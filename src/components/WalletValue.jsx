import { fmtSigned, fmtWalletBalance, walletColor, walletSignClass } from '../utils/wallet.js';

export default function WalletValue({
  value,
  signed = false,
  decimals = false,
  className = '',
  showBadge = false,
}) {
  const n = +value || 0;
  const text = signed ? fmtSigned(n, decimals) : fmtWalletBalance(n, decimals);
  const color = walletColor(n);
  const signClass = walletSignClass(n);

  if (showBadge && n !== 0) {
    return (
      <span
        className={[
          'inline-flex items-center rounded-full px-2 py-0.5 font-mono-num text-[11px] font-bold sm:text-xs',
          signClass === 'wallet-positive'
            ? 'bg-[#10b981]/15 text-[#10b981] ring-1 ring-[#10b981]/30'
            : 'bg-[#f43f5e]/15 text-[#f43f5e] ring-1 ring-[#f43f5e]/30',
          className,
        ].join(' ')}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={['font-mono-num font-semibold', signClass, className].join(' ')}
      style={{ color }}
    >
      {text}
    </span>
  );
}
