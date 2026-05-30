import WalletValue from './WalletValue.jsx';

const DATE_FILTERS = ['all', '7d', '14d', '30d'];

export default function Header({
  lastUpdated,
  dateFilter,
  onDateFilter,
  uploading,
  onFile,
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

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
        <div className="glass-chip flex flex-1 flex-wrap items-center gap-1.5 rounded-lg p-1 sm:flex-none sm:gap-2">
          {DATE_FILTERS.map((f) => {
            const active = dateFilter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onDateFilter(f)}
                className={[
                  'cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 sm:px-3.5 sm:py-1.5 sm:text-xs',
                  active
                    ? 'scale-105 border-[#f7c948] bg-[#f7c948]/15 text-[#f7c948] shadow-[0_0_12px_rgba(247,201,72,0.2)]'
                    : 'border-transparent bg-transparent text-[#6b7a9e] hover:text-[#e8ecf5]',
                ].join(' ')}
              >
                {f === 'all' ? 'All' : f}
              </button>
            );
          })}
        </div>

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
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFile}
          />
        </label>
      </div>
    </header>
  );
}
