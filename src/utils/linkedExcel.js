const DB_NAME = 'rapido-dashboard';
const DB_VERSION = 1;
const STORE = 'linked-files';
const HANDLE_KEY = 'excel-handle';
const META_KEY = 'excel-meta';

const EXCEL_PICKER_TYPES = [
  {
    description: 'Excel workbook',
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls', '.xlsm', '.xlsb'],
    },
  },
];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbPut(key, value) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

function idbDelete(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

async function ensureReadPermission(handle) {
  const opts = { mode: 'read' };
  const current = await handle.queryPermission(opts);
  if (current === 'granted') return true;
  const requested = await handle.requestPermission(opts);
  return requested === 'granted';
}

/** Open picker, persist handle + file name in IndexedDB. */
export async function pickAndLinkExcelFile() {
  const [handle] = await window.showOpenFilePicker({
    types: EXCEL_PICKER_TYPES,
    multiple: false,
  });
  await idbPut(HANDLE_KEY, handle);
  await idbPut(META_KEY, { name: handle.name, lastSyncedAt: null, fileLastModified: null });
  return handle;
}

/** Restore handle from IndexedDB and request read permission if needed. */
export async function restoreLinkedExcelHandle() {
  const handle = await idbGet(HANDLE_KEY);
  if (!handle) return null;
  const allowed = await ensureReadPermission(handle);
  if (!allowed) return null;
  return handle;
}

export async function loadLinkedExcelMeta() {
  return idbGet(META_KEY);
}

export async function saveLinkedExcelMeta(meta) {
  await idbPut(META_KEY, meta);
}

export async function readLinkedExcelFile(handle) {
  const file = await handle.getFile();
  return {
    file,
    name: handle.name,
    lastModified: file.lastModified,
  };
}

export async function unlinkExcelFile() {
  await idbDelete(HANDLE_KEY);
  await idbDelete(META_KEY);
}

export function formatSyncTime(timestamp) {
  if (!timestamp) return null;
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return null;
  }
}
