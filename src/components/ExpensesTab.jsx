import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import WalletBalanceBanner from './WalletBalanceBanner.jsx';
import WalletValue from './WalletValue.jsx';
import { fmt } from '../utils/format.js';
import { EXPENSES, CHART_COLORS } from '../data/initialData.js';
import { walletColor } from '../utils/wallet.js';

export default function ExpensesTab({ stats, expPie, walletRecharge = 0 }) {
  const walletBalance = stats.walletBalance ?? 0;

  const summaryCards = [
    { label: 'Total Revenue', value: stats.totalRevenue, color: '#3b82f6', isWallet: false },
    { label: 'Total Petrol', value: stats.totalPetrol, color: '#f43f5e', isWallet: false },
    { label: 'Platform Detection', value: stats.totalDetection, color: '#f97316', isWallet: false },
    { label: 'Net Profit', value: stats.totalProfit, color: '#f7c948', isProfit: true, isWallet: false },
    { label: 'Wallet Recharge', value: walletRecharge, color: '#a855f7', isWallet: false },
    { label: 'Balance Wallet', value: walletBalance, color: walletColor(walletBalance), isWallet: true },
  ];

  return (
    <div className="space-y-4">
      <WalletBalanceBanner balance={walletBalance} recharge={walletRecharge} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
          <div className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
            💸 Expense Breakdown
          </div>
          <div className="h-[200px] w-full sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expPie}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="85%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expPie.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {expPie.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1 text-[11px] sm:text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5 capitalize">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{p.name}</span>
                </span>
                <span
                  className="font-mono-num font-semibold"
                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  ₹{p.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
          <div className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
            📋 Expense Log
          </div>
          <div className="max-h-[260px] overflow-y-auto sm:max-h-[300px]">
            <table className="w-full border-collapse text-[12px] sm:text-[13px]">
              <thead className="sticky top-0 bg-[#111520]">
                <tr className="border-b border-[#1e2740]">
                  <th className="px-2 py-2 text-left text-[10px] uppercase text-[#6b7a9e] sm:px-2.5 sm:text-[11px]">
                    Reason
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] uppercase text-[#6b7a9e] sm:px-2.5 sm:text-[11px]">
                    Cash
                  </th>
                  <th className="px-2 py-2 text-right text-[10px] uppercase text-[#6b7a9e] sm:px-2.5 sm:text-[11px]">
                    GPay
                  </th>
                </tr>
              </thead>
              <tbody>
                {EXPENSES.map((e, i) => (
                  <tr
                    key={i}
                    className={[
                      'border-b border-[#1e2740] transition-colors hover:bg-[#181e2e]',
                      /wallet/i.test(e.Reason) ? 'bg-[#a855f7]/5' : '',
                    ].join(' ')}
                  >
                    <td className="px-2 py-1.5 capitalize sm:px-2.5">{e.Reason}</td>
                    <td className="px-2 py-1.5 text-right sm:px-2.5">
                      {e.Cash !== 0 ? (
                        <WalletValue value={e.Cash} signed />
                      ) : (
                        <span className="text-[#6b7a9e]">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right sm:px-2.5">
                      {e.Gpay !== 0 ? (
                        <WalletValue value={e.Gpay} signed />
                      ) : (
                        <span className="text-[#6b7a9e]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
        <div className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
          🧾 Financial Summary
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3">
          {summaryCards.map((s, i) => (
            <div
              key={i}
              className={[
                'rounded-lg px-3 py-3 transition-transform duration-200 hover:-translate-y-0.5 sm:px-4 sm:py-3.5',
                s.isProfit
                  ? 'stat-featured bg-[#181e2e]/90'
                  : s.isWallet
                  ? walletBalance >= 0
                    ? 'bg-[#10b981]/10 ring-1 ring-[#10b981]/25'
                    : 'bg-[#f43f5e]/10 ring-1 ring-[#f43f5e]/25'
                  : 'bg-[#181e2e]',
              ].join(' ')}
              style={{ borderLeft: `3px solid ${s.color}` }}
            >
              <div className="mb-1 text-[10px] uppercase tracking-[0.06em] text-[#6b7a9e] sm:mb-1.5 sm:text-[11px]">
                {s.label}
              </div>
              {s.isWallet ? (
                <div className="text-lg font-bold sm:text-[22px]">
                  <WalletValue value={s.value} />
                </div>
              ) : (
                <div
                  className={[
                    'font-mono-num font-bold',
                    s.isProfit ? 'profit-shimmer text-xl sm:text-2xl' : 'text-lg sm:text-[22px]',
                  ].join(' ')}
                  style={s.isProfit ? undefined : { color: s.color }}
                >
                  {fmt(s.value || 0)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
