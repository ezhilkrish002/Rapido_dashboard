import WalletValue from './WalletValue.jsx';
import DateFilterBar from './DateFilterBar.jsx';

export default function Header({
  lastUpdated,
  dateFilter,
  onDateFilter,
  dataBounds,
  uploading,
  onFile,
  fileInputKey = 0,
  walletBalance = 0,
}) {
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
          <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-[#6b7a9e]">Wallet:</span>
            <WalletValue value={walletBalance} showBadge />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto sm:gap-3">
        <DateFilterBar
          dateFilter={dateFilter}
          onDateFilter={onDateFilter}
          dataBounds={dataBounds}
        />

        <label
          className={[
            'ml-auto flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-bold text-[#0a0d14] transition-all sm:ml-0 sm:px-4 sm:text-xs',
            uploading
              ? 'animate-pulse bg-[#6b7a9e]'
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
          />
        </label>
      </div>
    </header>
  );
}
