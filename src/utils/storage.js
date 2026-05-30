const STORAGE_KEY = 'rapido-dashboard-data';

export function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.daily?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredData({ daily, rides, expenses, walletMeta, lastUpdated }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ daily, rides, expenses, walletMeta, lastUpdated })
    );
  } catch (err) {
    console.warn('Could not save dashboard data to localStorage:', err);
  }
}

export function clearStoredData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
