import { normalizeRide } from './normalize.js';
import { loadStoredData, saveStoredData } from './storage.js';
import {
  INITIAL_DAILY,
  INITIAL_RIDES,
  EXPENSES,
  WALLET_META,
} from '../data/initialData.js';

function defaultWalletMeta() {
  return {
    balance: WALLET_META.balance,
    recharge: WALLET_META.recharge,
    fallbackBalance: WALLET_META.balance,
  };
}

export function createEmptyDashboard() {
  return {
    daily: INITIAL_DAILY,
    rides: INITIAL_RIDES.map((r, i) => normalizeRide(r, i)),
    expenses: EXPENSES,
    walletMeta: defaultWalletMeta(),
    lastUpdated: 'Built-in data',
    uploadId: 0,
  };
}

export function loadDashboardFromStorage() {
  const stored = loadStoredData();
  if (!stored?.daily?.length) return createEmptyDashboard();

  return {
    daily: stored.daily,
    rides: (stored.rides || []).map((r, i) => normalizeRide(r, i)),
    expenses: stored.expenses?.length ? stored.expenses : EXPENSES,
    walletMeta: stored.walletMeta ?? defaultWalletMeta(),
    lastUpdated: stored.lastUpdated || 'Saved data',
    uploadId: stored.uploadId ?? 1,
  };
}

export function buildDashboardFromExcel(result, previous) {
  const uploadId = (previous.uploadId ?? 0) + 1;
  const updatedAt = new Date().toLocaleString();

  // Always replace expenses when the expense sheet exists in the workbook
  const expenses = result.expensesFound
    ? result.expenses
    : previous.expenses;

  return {
    daily: result.daily,
    rides: result.rides,
    expenses,
    expensesFound: result.expensesFound,
    expenseSheetName: result.expenseSheetName,
    walletMeta: {
      balance: result.walletMeta?.balance ?? null,
      recharge: result.walletMeta?.recharge ?? null,
      fallbackBalance: null,
    },
    lastUpdated: updatedAt,
    uploadId,
  };
}

export function persistDashboard(dashboard) {
  saveStoredData({
    daily: dashboard.daily,
    rides: dashboard.rides,
    expenses: dashboard.expenses,
    walletMeta: dashboard.walletMeta,
    lastUpdated: dashboard.lastUpdated,
    uploadId: dashboard.uploadId,
  });
}
