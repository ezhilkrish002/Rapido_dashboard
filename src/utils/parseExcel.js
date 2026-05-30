import * as XLSX from 'xlsx';
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
    const d = XLSX.SSF?.parse_date_code?.(v);
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
  const sno = pick(idx, ['S.No', 'SNo', 'S No', 'Serial', 'Sl.No', 'Sl No', '#']);
  if (sno !== undefined && !isNaN(+sno) && +sno > 0) return true;
  const date = toDate(pick(idx, ['Date']));
  const orders = toNum(pick(idx, ['Orders', 'Order', 'Rides', 'Trips']));
  const profit = toNum(pick(idx, ['Profit', 'Net', 'NetProfit']));
  return Boolean(date) && (orders > 0 || profit !== 0);
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

function parseWalletMetaFromWorkbook(wb) {
  let balance = null;
  let recharge = null;

  const balanceLabels = /balancewallet|walletbalance|walletbal|balwallet|balance wal/;
  const rechargeLabels = /walletrecharge|totalwallet|recharge wallet/;

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      for (let i = 0; i < row.length; i++) {
        const label = canon(String(row[i]));
        if (!label) continue;

        if (balance == null && balanceLabels.test(label)) {
          const val = toNum(row[i + 1]) || toNum(row[i + 2]);
          if (Number.isFinite(val)) balance = val;
        }
        if (recharge == null && rechargeLabels.test(label)) {
          const val = toNum(row[i + 1]) || toNum(row[i + 2]);
          if (val > 0) recharge = val;
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
      'Cash/Gpay',
      'Cash / Gpay',
      'PayMode',
      'Mode',
      'Payment',
      'Type',
      'Pay Mode',
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

export function parseExcel(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });

      const dailySheetName =
        wb.SheetNames.find((n) => /daily/i.test(n)) || 'Daily';
      const dailySheet = wb.Sheets[dailySheetName];
      const rawDaily = dailySheet
        ? XLSX.utils.sheet_to_json(dailySheet, { defval: 0 })
        : [];

      const daily = rawDaily
        .map(indexRow)
        .filter(isDailyRow)
        .map((idx) => ({
          Date: toDate(pick(idx, ['Date'])),
          Distance: toNum(
            pick(idx, [
              'Distance (KM)',
              'Distance(KM)',
              'Distance KM',
              'Distance',
              'KM',
              'Km',
            ]) ?? pickByContains(idx, 'distance')
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
          ...(() => {
            const balanceRaw =
              pick(idx, [
                'Balance Wallet',
                'Bal Wallet',
                'Wallet Balance',
                'Wallet Bal',
              ]) ?? pickByContains(idx, 'balancewallet');
            return balanceRaw !== undefined
              ? { BalanceWallet: toNum(balanceRaw) }
              : {};
          })(),
          Profit: toNum(pick(idx, ['Profit', 'Net', 'NetProfit'])),
          Orders: toNum(pick(idx, ['Orders', 'Order', 'Rides', 'Trips'])),
        }))
        .filter((r) => r.Date);

      const ridesSheetName =
        wb.SheetNames.find((n) => /rapido|ride/i.test(n)) || 'rapido';
      const ridesSheet = wb.Sheets[ridesSheetName];
      const rawRides = ridesSheet
        ? XLSX.utils.sheet_to_json(ridesSheet, { defval: 0 })
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

      const walletMeta = parseWalletMetaFromWorkbook(wb);

      onDone({ daily, rides, walletMeta, ok: true });
    } catch (err) {
      console.error('parseExcel failed', err);
      alert('Error parsing Excel: ' + err.message);
      onDone({ daily: [], rides: [], walletMeta: {}, ok: false });
    }
  };
  reader.readAsArrayBuffer(file);
}
