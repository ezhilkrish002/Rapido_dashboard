import StatCard from './StatCard.jsx';
import WalletBalanceBanner from './WalletBalanceBanner.jsx';
import WalletValue from './WalletValue.jsx';
import { fmt, fmtD } from '../utils/format.js';
import { normalizePayMode } from '../utils/normalize.js';
import { walletColor, walletSignClass, fmtWalletBalance } from '../utils/wallet.js';
import { dateFilterLabel, isActiveFilter } from '../utils/dateFilter.js';

const TH =
  'whitespace-nowrap px-2 sm:px-3.5 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7a9e]';

export default function RidesTab({
  rides,
  totalOrders = 0,
  allRidesCount = 0,
  walletBalance = 0,
  dateFilter = { preset: 'all' },
}) {
  const gpayCount = rides.filter((r) => normalizePayMode(r.PayMode) === 'Gpay').length;
  const cashCount = rides.filter((r) => normalizePayMode(r.PayMode) === 'Cash').length;
  const tipsCount = rides.filter((r) => r.Tips > 0).length;
  const totalEarning = rides.reduce((s, r) => s + (r.NetEarning ?? r.Total), 0);
  const totalWalletUsed = rides.reduce((s, r) => s + (r.Wallet || 0), 0);

  const showUploadHint = dateFilterMismatchHint(allRidesCount, totalOrders);

  return (
    <div className="space-y-4 sm:space-y-5">
      {isActiveFilter(dateFilter) && (
        <div className="animate-fade-in rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-2 text-xs text-[#3b82f6] sm:text-sm">
          Filter: <strong>{dateFilterLabel(dateFilter)}</strong> ({rides.length} rides)
        </div>
      )}
      {showUploadHint && (
        <div className="animate-fade-in-up rounded-xl border border-[#f7c948]/30 bg-[#f7c948]/10 px-4 py-3 text-xs text-[#f7c948] sm:text-sm">
          ⚠️ Showing {allRidesCount} rides in log vs {totalOrders} orders in daily summary.
          Upload your full <strong>Rap_1.xlsx</strong> to load every ride from the{' '}
          <strong>rapido</strong> sheet.
        </div>
      )}

      <WalletBalanceBanner balance={walletBalance} compact />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        <StatCard label="Total Rides" value={rides.length} color="#f7c948" icon="🏍️" featured delay={0} />
        <StatCard
          label="Wallet Balance"
          value={fmtWalletBalance(walletBalance)}
          color={walletColor(walletBalance)}
          icon="👛"
          delay={50}
        />
        <StatCard label="GPay Rides" value={gpayCount} color="#3b82f6" icon="📲" delay={100} />
        <StatCard label="Cash Rides" value={cashCount} color="#10b981" icon="💵" delay={150} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="glass-panel animate-fade-in-up flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3">
          <span className="text-xs text-[#6b7a9e] sm:text-sm">Filtered ride earnings</span>
          <span className="profit-shimmer font-mono-num text-lg font-bold sm:text-xl">
            {fmt(totalEarning)}
          </span>
        </div>
        <div className="glass-panel animate-fade-in-up flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3">
          <span className="text-xs text-[#6b7a9e] sm:text-sm">Wallet used (rides)</span>
          <WalletValue value={totalWalletUsed} />
        </div>
      </div>

      <div className="glass-panel animate-fade-in-up overflow-x-auto rounded-xl">
        <p className="px-3 pt-2 text-[10px] text-[#6b7a9e] sm:hidden">
          ← swipe to scroll →
        </p>
        {rides.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[#6b7a9e]">
            No rides for this date range. Try <strong>All</strong> or upload Excel.
          </div>
        ) : (
          <table className="w-full min-w-[960px] border-collapse text-[12px] sm:text-[13px]">
            <thead>
              <tr className="border-b border-[#1e2740]">
                <th className={`${TH} sticky left-0 z-10 bg-[#111520]/95 text-left backdrop-blur`}>
                  #
                </th>
                <th className={`${TH} text-left`}>Date</th>
                {['Amount', 'Detection', 'Commission', 'Tips', 'Total', 'Wallet', 'Net'].map((h) => (
                  <th
                    key={h}
                    className={`${TH} text-right ${
                      h === 'Net' ? 'text-[#f7c948]' : h === 'Wallet' ? 'text-[#a855f7]' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
                <th className={`${TH} text-left`}>Mode</th>
                <th className={`${TH} text-right`}>Incentive</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r, i) => {
                const mode = normalizePayMode(r.PayMode);
                const net = r.NetEarning ?? r.Total + (r.Incentive || 0);
                return (
                  <tr
                    key={`${r.Date}-${r.SNo}-${i}`}
                    className="row-glow group border-b border-[#1e2740]"
                  >
                    <td className="font-mono-num sticky left-0 z-10 bg-[#111520]/95 px-2 py-2 text-[11px] text-[#6b7a9e] backdrop-blur group-hover:bg-[#181e2e]/95 sm:px-3.5">
                      {r.SNo}
                    </td>
                    <td className="font-mono-num whitespace-nowrap px-2 py-2 text-[11px] text-[#6b7a9e] sm:px-3.5">
                      {r.Date}
                    </td>
                    <td className="px-2 py-2 text-right sm:px-3.5">{fmt(r.Amount)}</td>
                    <td className="px-2 py-2 text-right text-[11px] text-[#f43f5e] sm:px-3.5">
                      {fmtD(r.Detection)}
                    </td>
                    <td className="px-2 py-2 text-right sm:px-3.5">{fmt(r.Commission)}</td>
                    <td
                      className="px-2 py-2 text-right sm:px-3.5"
                      style={{ color: r.Tips > 0 ? '#06b6d4' : '#6b7a9e' }}
                    >
                      {r.Tips > 0 ? fmt(r.Tips) : '-'}
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-[#3b82f6] sm:px-3.5">
                      {fmt(r.Total)}
                    </td>
                    <td className={`px-2 py-2 text-right sm:px-3.5 ${walletSignClass(r.Wallet)}`}>
                      {r.Wallet !== 0 ? (
                        <WalletValue value={r.Wallet} signed />
                      ) : (
                        <span className="text-[#6b7a9e]">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-[#f7c948] sm:px-3.5">
                      {fmt(net)}
                    </td>
                    <td className="px-2 py-2 sm:px-3.5">
                      <span
                        className={[
                          'rounded px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]',
                          mode === 'Gpay'
                            ? 'bg-[#3b82f6]/15 text-[#3b82f6]'
                            : 'bg-[#10b981]/15 text-[#10b981]',
                        ].join(' ')}
                      >
                        {mode}
                      </span>
                    </td>
                    <td
                      className="px-2 py-2 text-right sm:px-3.5"
                      style={{ color: r.Incentive > 0 ? '#f97316' : '#6b7a9e' }}
                    >
                      {r.Incentive > 0 ? fmt(r.Incentive) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#f7c948]/30 bg-[#181e2e] font-bold">
                <td colSpan={2} className="sticky left-0 z-10 bg-[#181e2e] px-2 py-3 text-[#f7c948] sm:px-3.5">
                  TOTAL ({rides.length})
                </td>
                <td className="px-2 py-3 text-right sm:px-3.5">
                  {fmt(rides.reduce((s, r) => s + r.Amount, 0))}
                </td>
                <td className="px-2 py-3 text-right text-[#f43f5e] sm:px-3.5">
                  {fmtD(rides.reduce((s, r) => s + r.Detection, 0))}
                </td>
                <td className="px-2 py-3 text-right sm:px-3.5">
                  {fmt(rides.reduce((s, r) => s + r.Commission, 0))}
                </td>
                <td className="px-2 py-3 text-right text-[#06b6d4] sm:px-3.5">
                  {fmt(rides.reduce((s, r) => s + r.Tips, 0))}
                </td>
                <td className="px-2 py-3 text-right text-[#3b82f6] sm:px-3.5">
                  {fmt(rides.reduce((s, r) => s + r.Total, 0))}
                </td>
                <td className={`px-2 py-3 text-right sm:px-3.5 ${walletSignClass(totalWalletUsed)}`}>
                  <WalletValue value={totalWalletUsed} signed />
                </td>
                <td className="profit-cell-high px-2 py-3 text-right sm:px-3.5">
                  {fmt(totalEarning)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

function dateFilterMismatchHint(allRides, orders) {
  if (orders <= 0) return false;
  return allRides < orders * 0.5;
}
