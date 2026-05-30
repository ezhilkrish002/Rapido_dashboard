import AnimatedNumber from './AnimatedNumber.jsx';
import WalletValue from './WalletValue.jsx';
import { fmt } from '../utils/format.js';
export default function ProfitHero({ stats }) {
  const profit = stats.totalProfit || 0;
  const revenue = stats.totalRevenue || 0;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="profit-hero animate-fade-in-up relative mb-5 overflow-hidden rounded-2xl border border-[#f7c948]/30 p-4 sm:mb-6 sm:p-6">
      <div className="profit-hero-glow pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="profit-pulse inline-block h-2 w-2 rounded-full bg-[#f7c948]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f7c948] sm:text-xs">
              Net Profit Highlight
            </span>
          </div>
          <div className="profit-shimmer font-mono-num text-3xl font-bold leading-none text-[#f7c948] sm:text-4xl md:text-5xl">
            <AnimatedNumber value={profit} formatter={(v) => fmt(v)} />
          </div>
          <p className="mt-2 text-xs text-[#6b7a9e] sm:text-sm">
            {stats.workDays || 0} working days · avg{' '}
            <span className="font-semibold text-[#e8ecf5]">
              {fmt(stats.avgProfit || 0)}
            </span>
            /day · margin{' '}
            <span className="font-semibold text-[#10b981]">{margin}%</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: 'Revenue', value: fmt(revenue), color: '#3b82f6' },
            {
              label: 'Wallet Bal',
              wallet: stats.walletBalance ?? 0,
            },
            {
              label: '₹/km',
              value: `₹${(stats.profitPerKm || 0).toFixed(1)}`,
              color: '#a855f7',
            },
            {
              label: 'Best Day',
              value: fmt(stats.bestDay?.Profit || 0),
              color: '#10b981',
              sub: stats.bestDay?.Date?.slice(5),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-chip animate-scale-in rounded-xl px-2.5 py-2 text-center sm:px-3 sm:py-2.5"
            >
              <div className="text-[9px] uppercase tracking-wider text-[#6b7a9e] sm:text-[10px]">
                {item.label}
              </div>
              {item.wallet !== undefined ? (
                <div className="mt-0.5 text-sm font-bold sm:text-base">
                  <WalletValue value={item.wallet} />
                </div>
              ) : (
                <div
                  className="font-mono-num mt-0.5 text-sm font-bold sm:text-base"
                  style={{ color: item.color }}
                >
                  {item.value}
                </div>
              )}
              {item.sub && (
                <div className="text-[10px] text-[#6b7a9e]">{item.sub}</div>
              )}
            </div>
          ))}
        </div>      </div>
    </div>
  );
}
