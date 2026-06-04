import WalletValue from './WalletValue.jsx';
import DateFilterBar from './DateFilterBar.jsx';
import { formatSyncTime } from '../utils/linkedExcel.js';

export default function Header({
  lastUpdated,
  dateFilter,
  onDateFilter,
  dataBounds,
  uploading,
  syncing = false,
  onFile,
  fileInputKey = 0,
  walletBalance = 0,
  linkSupported = false,
  linkedFileName = null,
  lastSyncedAt = null,
  onLinkExcel,
  onUnlinkExcel,
  onSyncNow,
}) {
  const busy = uploading || syncing;
  const syncedLabel = formatSyncTime(lastSyncedAt);

  return (
    <header className="animate-fade-in-up mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2740]/80 py-4 sm:mb-6 sm:py-6">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="animate-float-fast text-2xl sm:text-3xl">🏍️</div>
        <div className="min-w-0">
          <h1 className="bg-gradient-to-r from-[#e8ecf5] to-[#f7c948] bg-clip-text text-base font-bold leading-tight tracking-tight text-transparent sm:text-lg md:text-[22px]">
            Rapido Earnings
          </h1>
          <div className="text-[11px] text-[#6b7a9e] sm:text-xs">
            Last updated: {lastUpdated}
          </div>
          {linkedFileName && (
            <div className="mt-0.5 text-[11px] text-[#3b82f6] sm:text-xs">
              🔗 Linked: <span className="font-medium">{linkedFileName}</span>
              {syncedLabel && (
                <span className="text-[#6b7a9e]">
                  {' '}
                  · Last synced: <span className="text-[#10b981]">{syncedLabel}</span>
                </span>
              )}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-[#6b7a9e]">Wallet:</span>
            <WalletValue value={walletBalance} showBadge />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
        <DateFilterBar
          dateFilter={dateFilter}
          onDateFilter={onDateFilter}
          dataBounds={dataBounds}
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          {linkSupported && (
            <>
              {!linkedFileName ? (
                <button
                  type="button"
                  onClick={onLinkExcel}
                  disabled={busy}
                  className={[
                    'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-[11px] font-semibold transition-all sm:px-4 sm:text-xs',
                    busy
                      ? 'cursor-not-allowed border-[#6b7a9e]/40 text-[#6b7a9e]'
                      : 'border-[#3b82f6]/50 bg-[#3b82f6]/15 text-[#3b82f6] hover:bg-[#3b82f6]/25',
                  ].join(' ')}
                >
                  {busy ? '⏳ …' : '🔗 Link Excel'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onSyncNow}
                    disabled={busy}
                    className={[
                      'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-all sm:px-3 sm:text-xs',
                      busy
                        ? 'cursor-not-allowed border-[#6b7a9e]/40 text-[#6b7a9e]'
                        : 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20',
                    ].join(' ')}
                  >
                    {syncing ? '⏳ Syncing…' : '🔄 Sync now'}
                  </button>
                  <button
                    type="button"
                    onClick={onUnlinkExcel}
                    disabled={busy}
                    className="cursor-pointer whitespace-nowrap rounded-md border border-[#1e2740] px-2.5 py-1.5 text-[11px] text-[#6b7a9e] transition-all hover:border-[#f43f5e]/40 hover:text-[#f43f5e] sm:px-3 sm:text-xs"
                  >
                    Unlink
                  </button>
                </>
              )}
            </>
          )}

          <label
            className={[
              'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-bold text-[#0a0d14] transition-all sm:px-4 sm:text-xs',
              busy
                ? 'animate-pulse cursor-not-allowed bg-[#6b7a9e]'
                : 'bg-[#f7c948] shadow-[0_4px_20px_rgba(247,201,72,0.35)] hover:scale-105 hover:shadow-[0_6px_28px_rgba(247,201,72,0.45)]',
            ].join(' ')}
          >
            {uploading ? '⏳ Loading...' : '📁 Upload Excel'}
            <input
              key={fileInputKey}
              type="file"
              accept=".xlsx,.xls,.xlsm"
              className="hidden"
              onChange={onFile}
              disabled={busy}
            />
          </label>
        </div>
      </div>
    </header>
  );
}
