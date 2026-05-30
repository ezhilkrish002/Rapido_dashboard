import { read, utils, SSF } from 'xlsx';
import { normalizePayMode, normalizeRide } from './normalize.js';

function canon(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[\s\n\r\t._\-/()\\]+/g, '');
}

function indexRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[canon(k)] = row[k];
  });
  return out;
}

function pick(idx, aliases) {
  for (const a of aliases) {
    const v = idx[canon(a)];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

function pickByContains(idx, fragment) {
  const needle = canon(fragment);
  for (const [k, v] of Object.entries(idx)) {
    if (k.includes(needle) && v !== undefined && v !== '') return v;
  }
  return undefined;
}

function toNum(v) {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/[₹,\s]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toDate(v) {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'number') {
    const d = SSF?.parse_date_code?.(v);
    if (d) {
      const mm = String(d.m).padStart(2, '0');
      const dd = String(d.d).padStart(2, '0');
      return `${d.y}-${mm}-${dd}`;
    }
  }
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const year = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const mo = String(parsed.getMonth() + 1).padStart(2, '0');
      const da = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${mo}-${da}`;
    }
    return trimmed.slice(0, 10);
  }
  return '';
}

function rowLabels(row) {
  return (row || []).map((c) => canon(c));
}

function detectHeaderRow(matrix, kind) {
  const rules = {
    daily: (labels) =>
      labels.some((l) => l.includes('date')) &&
      (labels.some((l) => l.includes('profit') || l.includes('orders') || l.includes('commission'))),
    rides: (labels) =>
      labels.some((l) => l.includes('date')) &&
      (labels.some((l) => l.includes('amount') || l.includes('commission') || l.includes('total'))),
    expenses: (labels) =>
      labels.some((l) => l.includes('reason') || l.includes('particular') || l.includes('description')) &&
      (labels.some((l) => l.includes('cash') || l.includes('gpay'))),
  };

  const test = rules[kind] || rules.daily;
  const idx = matrix.findIndex((row) => test(rowLabels(row)));
  return idx >= 0 ? idx : 0;
}

/** Read sheet rows as objects even when title/blank rows appear before headers. */
function readSheetAsObjects(sheet, kind = 'daily') {
  if (!sheet?.['!ref']) return [];

  const matrix = utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!matrix.length) return [];

  const headerIdx = detectHeaderRow(matrix, kind);
  const headers = matrix[headerIdx].map((h, i) => {
    const label = String(h ?? '').trim();
    return label || `Column${i + 1}`;
  });

  const rows = [];
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const line = matrix[r];
    if (!line?.some((c) => c !== '' && c != null)) continue;

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = line[i] ?? '';
    });
    rows.push(obj);
  }

  return rows;
}

function isSummaryRow(idx) {
  const sno = String(pick(idx, ['S.No', 'SNo', '#']) ?? '').toLowerCase();
  const date = String(pick(idx, ['Date']) ?? '').toLowerCase();
  if (sno.includes('total') || date.includes('total')) return true;
  if (date.includes('grand')) return true;
  return false;
}

function isDailyRow(idx) {
  if (isSummaryRow(idx)) return false;

  const date = toDate(pick(idx, ['Date']));
  if (!date || date.length < 8) return false;

  const sno = pick(idx, ['S.No', 'SNo', 'S No', 'Serial', 'Sl.No', 'Sl No', '#']);
  if (sno !== undefined && !isNaN(+sno) && +sno > 0) return true;

  const metrics = [
    'Orders', 'Order', 'Rides', 'Trips', 'Commission', 'Commision',
    'Amount', 'Total', 'Profit', 'Net', 'NetProfit', 'Distance',
    'Cash', 'Gpay', 'GPay', 'Tips', 'Petrol', 'Wallet',
  ];
  return metrics.some((m) => toNum(pick(idx, [m])) !== 0);
}

function isRideRow(idx) {
  if (isSummaryRow(idx)) return false;

  const date = toDate(pick(idx, ['Date']));
  const amount = toNum(pick(idx, ['Amount']) ?? pickByContains(idx, 'amount'));
  const commission = toNum(pick(idx, ['Commission', 'Commision']));
  const total = toNum(pick(idx, ['Total']));
  const tips = toNum(pick(idx, ['Tips', 'Tip']));

  if (!date || date.length < 8) return false;
  if (amount > 0 || commission > 0 || total > 0 || tips > 0) return true;

  const sno = pick(idx, ['S.No', 'SNo', 'S No', '#']);
  return sno !== undefined && !isNaN(+sno) && +sno > 0;
}

function isExpenseRow(idx) {
  const reason = pick(idx, ['Reason', 'Description', 'Item', 'Name', 'Particulars']);
  if (!reason || String(reason).toLowerCase().includes('total')) return false;
  const cash = toNum(pick(idx, ['Cash']));
  const gpay = toNum(pick(idx, ['Gpay', 'GPay', 'G Pay', 'Online']));
  return cash !== 0 || gpay !== 0 || String(reason).trim().length > 0;
}

function parseWalletMetaFromWorkbook(wb) {
  let balance = null;
  let recharge = null;

  const balanceLabels = /balancewallet|walletbalance|walletbal|balwallet|balance wal/;
  const rechargeLabels = /walletrecharge|totalwallet|recharge wallet/;

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' });

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      for (let i = 0; i < row.length; i++) {
        const label = canon(String(row[i]));
        if (!label) continue;

        if (balance == null && balanceLabels.test(label)) {
          const raw = row[i + 1] ?? row[i + 2];
          if (raw !== undefined && raw !== '') {
            const val = toNum(raw);
            if (Number.isFinite(val)) balance = val;
          }
        }
        if (recharge == null && rechargeLabels.test(label)) {
          const raw = row[i + 1] ?? row[i + 2];
          if (raw !== undefined && raw !== '') {
            const val = toNum(raw);
            if (val > 0) recharge = val;
          }
        }
      }
    }
  }

  return { balance, recharge };
}

function parseRideRow(idx, i) {
  const amount = toNum(pick(idx, ['Amount']) ?? pickByContains(idx, 'amount'));
  const tips = toNum(pick(idx, ['Tips', 'Tip']));
  const incentive = toNum(pick(idx, ['Incentive', 'Bonus']));
  let total = toNum(pick(idx, ['Total']));
  if (total <= 0 && (amount > 0 || tips > 0)) total = amount + tips;

  const payRaw =
    pick(idx, [
      'Cash/Gpay', 'Cash / Gpay', 'PayMode', 'Mode', 'Payment', 'Type', 'Pay Mode',
    ]) ?? 'Gpay';

  return {
    SNo: toNum(pick(idx, ['S.No', 'SNo', '#'])) || i + 1,
    Date: toDate(pick(idx, ['Date'])),
    Detection: toNum(pick(idx, ['Detection', 'Detect', 'Deduction'])),
    Commission: toNum(pick(idx, ['Commission', 'Commision'])),
    Amount: amount,
    Tips: tips,
    Total: total,
    PayMode: normalizePayMode(payRaw),
    Wallet: toNum(pick(idx, ['Wallet'])),
    Petrol: toNum(pick(idx, ['Petrol', 'Fuel'])),
    Incentive: incentive,
  };
}

function parseDailyRow(idx) {
  const balanceRaw =
    pick(idx, ['Balance Wallet', 'Bal Wallet', 'Wallet Balance', 'Wallet Bal', 'Bal']) ??
    pickByContains(idx, 'balancewallet');

  return {
    Date: toDate(pick(idx, ['Date'])),
    Distance: toNum(
      pick(idx, ['Distance (KM)', 'Distance(KM)', 'Distance KM', 'Distance', 'KM', 'Km']) ??
        pickByContains(idx, 'distance')
    ),
    DailyPetrol: toNum(
      pick(idx, ['Daily Petrol', 'DailyPetrol', 'Daily-Petrol']) ??
        pickByContains(idx, 'dailypetrol')
    ),
    Commission: toNum(pick(idx, ['Commission', 'Commision'])),
    Amount: toNum(pick(idx, ['Amount'])),
    Tips: toNum(pick(idx, ['Tips', 'Tip'])),
    Cash: toNum(pick(idx, ['Cash'])),
    Gpay: toNum(pick(idx, ['Gpay', 'GPay', 'G Pay', 'Online'])),
    Incentive: toNum(pick(idx, ['Incentive', 'Bonus'])),
    Total: toNum(pick(idx, ['Total', 'GrandTotal'])),
    Detection: toNum(pick(idx, ['Detection', 'Detect', 'Deduction'])),
    Petrol: toNum(pick(idx, ['Petrol', 'Fuel'])),
    Wallet: toNum(pick(idx, ['Wallet'])),
    ...(balanceRaw !== undefined && balanceRaw !== '' ? { BalanceWallet: toNum(balanceRaw) } : {}),
    Profit: toNum(pick(idx, ['Profit', 'Net', 'NetProfit'])),
    Orders: toNum(pick(idx, ['Orders', 'Order', 'Rides', 'Trips'])),
  };
}

function parseExpenseRow(idx) {
  return {
    Reason: String(pick(idx, ['Reason', 'Description', 'Item', 'Name', 'Particulars']) ?? '').trim(),
    Cash: toNum(pick(idx, ['Cash'])),
    Gpay: toNum(pick(idx, ['Gpay', 'GPay', 'G Pay', 'Online'])),
  };
}

function findSheet(wb, exactNames, patterns) {
  for (const exact of exactNames) {
    const needle = canon(exact);
    const match = wb.SheetNames.find((n) => canon(n) === needle);
    if (match) return wb.Sheets[match];
  }
  const fuzzy = wb.SheetNames.find((n) => patterns.some((p) => p.test(n)));
  return fuzzy ? wb.Sheets[fuzzy] : null;
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function parseWorkbook(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const wb = read(bytes, { type: 'array', cellDates: true });
  const sheetNames = wb.SheetNames;

  const dailySheet = findSheet(wb, ['Daily'], [/daily/i]);
  const rawDaily = dailySheet ? readSheetAsObjects(dailySheet, 'daily') : [];

  const daily = rawDaily
    .map(indexRow)
    .filter(isDailyRow)
    .map(parseDailyRow)
    .filter((r) => r.Date);

  const ridesSheet = findSheet(wb, ['rapido', 'Rapido'], [/rapido/i]);
  const rawRides = ridesSheet ? readSheetAsObjects(ridesSheet, 'rides') : [];

  const rides = rawRides
    .map(indexRow)
    .filter(isRideRow)
    .map(parseRideRow)
    .sort((a, b) => {
      const da = new Date(a.Date);
      const db = new Date(b.Date);
      if (da - db !== 0) return da - db;
      return a.SNo - b.SNo;
    })
    .map((r, i) => normalizeRide({ ...r, SNo: i + 1 }, i));

  const expenseSheet = findSheet(wb, ['Expense', 'Expenses', 'Exp'], [/expense/i, /^exp$/i]);
  let expenses = null;
  if (expenseSheet) {
    const rawExp = readSheetAsObjects(expenseSheet, 'expenses');
    expenses = rawExp
      .map(indexRow)
      .filter(isExpenseRow)
      .map(parseExpenseRow)
      .filter((e) => e.Reason);
  }

  const walletMeta = parseWalletMetaFromWorkbook(wb);

  return {
    daily: cloneData(daily),
    rides: cloneData(rides),
    expenses: expenses ? cloneData(expenses) : null,
    walletMeta,
    sheetNames,
  };
}

export function parseExcelFile(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ ok: false, error: 'No file selected.' });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'xlsm', 'xlsb'].includes(ext)) {
      resolve({ ok: false, error: 'Please upload a valid Excel file (.xlsx or .xls).' });
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      resolve({ ok: false, error: 'Could not read the file. Please try again.' });
    };

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({ ok: false, error: 'File read returned empty data.' });
          return;
        }

        const { daily, rides, expenses, walletMeta, sheetNames } = parseWorkbook(buffer);

        if (!daily.length) {
          resolve({
            ok: false,
            error: `No daily data found. Sheets in file: ${sheetNames.join(', ') || 'none'}. Expected a "Daily" sheet with Date and earnings columns.`,
            sheetNames,
          });
          return;
        }

        resolve({
          ok: true,
          daily,
          rides,
          expenses,
          walletMeta,
          sheetNames,
        });
      } catch (err) {
        console.error('parseExcelFile failed:', err);
        resolve({
          ok: false,
          error: err?.message || 'Failed to parse Excel file.',
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
