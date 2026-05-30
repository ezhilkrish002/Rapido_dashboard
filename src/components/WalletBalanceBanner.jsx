import WalletValue from './WalletValue.jsx';
import { fmtWalletBalance } from '../utils/wallet.js';

export default function WalletBalanceBanner({ balance, recharge, compact = false }) {
  const isPositive = balance > 0;
  const isNegative = balance < 0;

  return (
    <div
      className={[
        'animate-fade-in-up relative overflow-hidden rounded-xl border px-4 py-3 sm:px-5 sm:py-4',
        isPositive
          ? 'border-[#10b981]/35 bg-[#10b981]/10'
          : isNegative
          ? 'border-[#f43f5e]/35 bg-[#f43f5e]/10'
          : 'border-[#1e2740] bg-[#111520]/80',
      ].join(' ')}
    >
      <div
        className={[
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl',
          isPositive ? 'bg-[#10b981]/20' : isNegative ? 'bg-[#f43f5e]/20' : 'bg-[#6b7a9e]/10',
        ].join(' ')}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl sm:text-2xl">👛</span>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7a9e] sm:text-[11px]">
              Wallet Balance
            </div>
            <div className="text-lg font-bold sm:text-xl">
              <WalletValue value={balance} />
            </div>
          </div>
        </div>
        {!compact && recharge > 0 && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7a9e]">
              Recharged
            </div>
            <div className="font-mono-num text-sm font-semibold text-[#a855f7] sm:text-base">
              {fmtWalletBalance(recharge)}
            </div>
          </div>
        )}
        <div
          className={[
            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]',
            isPositive
              ? 'bg-[#10b981]/20 text-[#10b981]'
              : isNegative
              ? 'bg-[#f43f5e]/20 text-[#f43f5e]'
              : 'bg-[#6b7a9e]/15 text-[#6b7a9e]',
          ].join(' ')}
        >
          {isPositive ? '✓ Positive' : isNegative ? '↓ Negative' : '— Zero'}
        </div>
      </div>
    </div>
  );
}
