import { fmt, fmtD } from './format.js';

export function walletSignClass(value) {
  const n = +value || 0;
  if (n > 0) return 'wallet-positive';
  if (n < 0) return 'wallet-negative';
  return 'wallet-neutral';
}

export function walletColor(value) {
  const n = +value || 0;
  if (n > 0) return '#10b981';
  if (n < 0) return '#f43f5e';
  return '#6b7a9e';
}

export function fmtSigned(v, decimals = false) {
  const n = +v || 0;
  if (n === 0) return '-';
  const prefix = n > 0 ? '+' : '-';
  const abs = decimals
    ? Math.abs(n).toFixed(2)
    : Math.abs(Math.round(n)).toLocaleString('en-IN');
  return `${prefix}₹${abs}`;
}

export function fmtWalletBalance(v, forceDecimals) {
  const n = +v || 0;
  const needsDecimals =
    forceDecimals || Math.abs(n) < 100 || n !== Math.round(n);
  if (needsDecimals) return `₹${fmtD(n)}`;
  return fmt(n);
}

/**
 * Total wallet credits recorded on the Daily sheet (sum of the Wallet column).
 * Matches "Wallet Recharge" in the original spreadsheet (e.g. ₹1,047.45).
 */
export function computeWalletRecharge(dailyRows) {
  return (dailyRows || []).reduce((s, d) => s + (+d.Wallet || 0), 0);
}

/** Total wallet amount logged on individual rides (rapido sheet). */
export function computeWalletUsed(rides) {
  return (rides || []).reduce((s, r) => s + (+r.Wallet || 0), 0);
}

/** Latest explicit Balance Wallet column value from daily rows, if present. */
export function getLatestBalanceWalletColumn(dailyRows) {
  if (!dailyRows?.length) return null;
  const withBalance = dailyRows.filter((d) => d.BalanceWallet !== undefined);
  if (!withBalance.length) return null;
  const sorted = [...withBalance].sort(
    (a, b) => new Date(b.Date) - new Date(a.Date)
  );
  const val = +sorted[0].BalanceWallet;
  return Number.isFinite(val) ? val : null;
}

/**
 * Current Rapido wallet balance.
 *
 * Priority:
 * 1. Value read from Excel summary cell (Balance Wallet / Wallet Bal label)
 * 2. Latest "Balance Wallet" column on the Daily sheet
 * 3. Recharge (sum daily Wallet) − Used (sum ride Wallet) — matches spreadsheet math
 * 4. Built-in fallback constant when ride data is incomplete
 */
export function computeWalletBalance(dailyRows, rides, walletMeta = {}) {
  if (walletMeta?.balance != null && Number.isFinite(+walletMeta.balance)) {
    return +walletMeta.balance;
  }

  const fromColumn = getLatestBalanceWalletColumn(dailyRows);
  if (fromColumn != null && Number.isFinite(fromColumn)) return fromColumn;

  const recharge = walletMeta?.recharge ?? computeWalletRecharge(dailyRows);
  const used = computeWalletUsed(rides);
  const totalOrders = (dailyRows || []).reduce((s, d) => s + (+d.Orders || 0), 0);
  const ridesComplete = totalOrders > 0 && rides.length >= totalOrders * 0.85;

  if (recharge > 0 && used > 0 && ridesComplete) {
    return +(recharge - used).toFixed(2);
  }

  if (walletMeta?.fallbackBalance != null) {
    return +walletMeta.fallbackBalance;
  }

  if (recharge > 0 && used > 0) {
    return +(recharge - used).toFixed(2);
  }

  return 0;
}

export function computeWalletStats(dailyRows, rides, walletMeta = {}) {
  const recharge = walletMeta?.recharge ?? computeWalletRecharge(dailyRows);
  const used = computeWalletUsed(rides);
  const balance = computeWalletBalance(dailyRows, rides, {
    ...walletMeta,
    recharge,
  });

  return { balance, recharge, used };
}
