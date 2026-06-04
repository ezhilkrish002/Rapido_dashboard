import { useCallback, useEffect, useRef, useState } from 'react';
import { parseExcelFile } from '../utils/parseExcel.js';
import {
  isFileSystemAccessSupported,
  pickAndLinkExcelFile,
  restoreLinkedExcelHandle,
  readLinkedExcelFile,
  unlinkExcelFile,
  loadLinkedExcelMeta,
  saveLinkedExcelMeta,
} from '../utils/linkedExcel.js';

const SYNC_INTERVAL_MS = 45_000;

/**
 * @param {object} opts
 * @param {(result: object) => boolean} opts.onParsed - apply dashboard update; return true if applied
 * @param {import('../context/ToastContext.jsx').ToastFn} opts.toast
 */
export function useLinkedExcelSync({ onParsed, toast }) {
  const handleRef = useRef(null);
  const lastFileModifiedRef = useRef(null);
  const syncingRef = useRef(false);

  const [linkSupported, setLinkSupported] = useState(false);
  const [linkedFileName, setLinkedFileName] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const syncFromLinked = useCallback(
    async ({ silent = true, force = false } = {}) => {
      if (syncingRef.current) return;
      let handle = handleRef.current;
      if (!handle) {
        handle = await restoreLinkedExcelHandle();
        if (!handle) return;
        handleRef.current = handle;
        setLinkedFileName(handle.name);
      }

      syncingRef.current = true;
      setSyncing(true);
      try {
        const { file, name, lastModified } = await readLinkedExcelFile(handle);
        if (
          !force &&
          silent &&
          lastFileModifiedRef.current != null &&
          lastFileModifiedRef.current === lastModified
        ) {
          return;
        }

        const result = await parseExcelFile(file);
        if (!result.ok) {
          if (!silent) {
            toast.error(result.error || 'Failed to read linked Excel file.');
          }
          return;
        }

        const applied = onParsed(result, { silent, fileName: name, lastModified });
        if (applied) {
          lastFileModifiedRef.current = lastModified;
          const syncedAt = Date.now();
          setLastSyncedAt(syncedAt);
          await saveLinkedExcelMeta({
            name,
            lastSyncedAt: syncedAt,
            fileLastModified: lastModified,
          });
          if (!silent) {
            toast.success(
              `Synced from ${name} · ${result.daily.length} days · ${result.rides.length} rides`,
              4000
            );
          }
        }
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.warn('Linked Excel sync failed:', err);
        if (!silent) {
          toast.error(
            err?.message ||
              'Could not read the linked file. Save in Excel (Ctrl+S) and try again.'
          );
        }
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    },
    [onParsed, toast]
  );

  const handleLinkExcel = useCallback(async () => {
    if (!isFileSystemAccessSupported()) {
      toast.error('Link Excel works in Chrome or Edge on desktop. Use Upload Excel otherwise.');
      return;
    }
    try {
      const handle = await pickAndLinkExcelFile();
      handleRef.current = handle;
      lastFileModifiedRef.current = null;
      setLinkedFileName(handle.name);
      await syncFromLinked({ silent: false, force: true });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.error('Link Excel failed:', err);
      toast.error(err?.message || 'Could not link Excel file.');
    }
  }, [syncFromLinked, toast]);

  const handleUnlinkExcel = useCallback(async () => {
    await unlinkExcelFile();
    handleRef.current = null;
    lastFileModifiedRef.current = null;
    setLinkedFileName(null);
    setLastSyncedAt(null);
    toast.info('Excel unlinked. You can still use Upload Excel anytime.');
  }, [toast]);

  useEffect(() => {
    if (!isFileSystemAccessSupported()) return;
    setLinkSupported(true);

    (async () => {
      const meta = await loadLinkedExcelMeta();
      if (meta?.name) {
        setLinkedFileName(meta.name);
        if (meta.lastSyncedAt) setLastSyncedAt(meta.lastSyncedAt);
        if (meta.fileLastModified != null) {
          lastFileModifiedRef.current = meta.fileLastModified;
        }
      }
      const handle = await restoreLinkedExcelHandle();
      if (handle) {
        handleRef.current = handle;
        setLinkedFileName(handle.name);
        await syncFromLinked({ silent: true, force: true });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  useEffect(() => {
    if (!linkedFileName) return undefined;
    const id = setInterval(() => {
      syncFromLinked({ silent: true });
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [linkedFileName, syncFromLinked]);

  useEffect(() => {
    if (!linkedFileName) return undefined;
    const onFocus = () => syncFromLinked({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [linkedFileName, syncFromLinked]);

  return {
    linkSupported,
    linkedFileName,
    lastSyncedAt,
    syncing,
    handleLinkExcel,
    handleUnlinkExcel,
    syncFromLinked,
  };
}
