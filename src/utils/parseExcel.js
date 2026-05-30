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
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[₹,\s]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toDate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
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
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return trimmed.slice(0, 10);
  }
  return '';
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

  return normalizeRide(
    {
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
    },
    i
  );
}

function parseDailyRow(idx) {
  const balanceRaw =
    pick(idx, ['Balance Wallet', 'Bal Wallet', 'Wallet Balance', 'Wallet Bal']) ??
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
    ...(balanceRaw !== undefined ? { BalanceWallet: toNum(balanceRaw) } : {}),
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

function findSheet(wb, patterns, fallback) {
  const name = wb.SheetNames.find((n) => patterns.some((p) => p.test(n)));
  return name ? wb.Sheets[name] : wb.Sheets[fallback];
}

function parseWorkbook(buffer) {
  const wb = read(buffer, { type: 'array', cellDates: true });
  const sheetNames = wb.SheetNames;

  const dailySheet = findSheet(wb, [/daily/i], 'Daily');
  const rawDaily = dailySheet
    ? utils.sheet_to_json(dailySheet, { defval: 0, raw: false })
    : [];

  const daily = rawDaily
    .map(indexRow)
    .filter(isDailyRow)
    .map(parseDailyRow)
    .filter((r) => r.Date);

  const ridesSheet = findSheet(wb, [/rapido/i, /ride/i], 'rapido');
  const rawRides = ridesSheet
    ? utils.sheet_to_json(ridesSheet, { defval: 0, raw: false })
    : [];

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
    .map((r, i) => ({ ...r, SNo: i + 1 }));

  const expenseSheet = findSheet(wb, [/expense/i], null);
  let expenses = null;
  if (expenseSheet) {
    const rawExp = utils.sheet_to_json(expenseSheet, { defval: 0, raw: false });
    expenses = rawExp
      .map(indexRow)
      .filter(isExpenseRow)
      .map(parseExpenseRow)
      .filter((e) => e.Reason);
  }

  const walletMeta = parseWalletMetaFromWorkbook(wb);

  return { daily, rides, expenses, walletMeta, sheetNames };
}

/**
 * Parse an Excel workbook file. Returns a Promise (works reliably in production builds).
 */
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
            daily: [],
            rides: [],
            expenses: null,
            walletMeta: {},
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
          daily: [],
          rides: [],
          expenses: null,
          walletMeta: {},
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/** @deprecated Use parseExcelFile — kept for compatibility */
export function parseExcel(file, onDone) {
  parseExcelFile(file).then(onDone);
}
