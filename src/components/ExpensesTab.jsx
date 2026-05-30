import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import WalletBalanceBanner from './WalletBalanceBanner.jsx';
import WalletValue from './WalletValue.jsx';
import { fmt } from '../utils/format.js';
import { walletColor } from '../utils/wallet.js';
import {
  computeExpenseSummary,
  buildExpenseFlowChart,
  buildExpenseReasonChart,
  EXPENSE_FLOW_COLORS,
} from '../utils/expenses.js';
import { dateFilterLabel, isActiveFilter } from '../utils/dateFilter.js';

function FlowTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-[#1e2740] bg-[#111520]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="font-semibold capitalize text-[#e8ecf5]">{item.name || item.reason}</div>
      <div className="font-mono-num mt-1 text-[#f7c948]">₹{item.value?.toLocaleString('en-IN') ?? 0}</div>
    </div>
  );
}

function ReasonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e2740] bg-[#111520]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1.5 font-semibold capitalize text-[#e8ecf5]">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 font-mono-num">
          <span style={{ color: p.color }}>{p.name}</span>
          <span>₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExpensesTab({
  stats,
  expenses = [],
  walletRecharge = 0,
  uploadId = 0,
  dateFilter = { preset: 'all' },
  undatedExpensesHidden = 0,
}) {
  const walletBalance = stats.walletBalance ?? 0;

  const summary = useMemo(() => computeExpenseSummary(expenses), [expenses, uploadId, dateFilter]);
  const flowChart = useMemo(() => buildExpenseFlowChart(summary), [summary]);
  const reasonChart = useMemo(() => buildExpenseReasonChart(expenses), [expenses, uploadId, dateFilter]);

  const chartKey = `${dateFilter?.preset}-u${uploadId}-${expenses.length}-${summary.totalOut}`;

  const paymentCards = [
    { label: 'Cash In', value: summary.cashIn, color: EXPENSE_FLOW_COLORS.cashIn, positive: true },
    { label: 'Cash Out', value: summary.cashOut, color: EXPENSE_FLOW_COLORS.cashOut, positive: false },
    { label: 'GPay In', value: summary.gpayIn, color: EXPENSE_FLOW_COLORS.gpayIn, positive: true },
    { label: 'GPay Out', value: summary.gpayOut, color: EXPENSE_FLOW_COLORS.gpayOut, positive: false },
  ];

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

      {isActiveFilter(dateFilter) && (
        <div className="animate-fade-in rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-2 text-xs text-[#3b82f6] sm:text-sm">
          Filter: <strong>{dateFilterLabel(dateFilter)}</strong>
          {undatedExpensesHidden > 0 && (
            <span className="text-[#6b7a9e]">
              {' '}
              · {undatedExpensesHidden} expense rows without dates hidden (add a Date column in Excel to filter them)
            </span>
          )}
        </div>
      )}

      {/* Cash / GPay × In / Out summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {paymentCards.map((c) => (
          <div
            key={c.label}
            className={[
              'glass-panel animate-fade-in-up rounded-xl px-3 py-3 sm:px-4 sm:py-3.5',
              c.positive ? 'ring-1 ring-[#10b981]/20' : 'ring-1 ring-[#f43f5e]/20',
            ].join(' ')}
            style={{ borderLeft: `3px solid ${c.color}` }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#6b7a9e] sm:text-[11px]">
              {c.label}
            </div>
            <div className="font-mono-num mt-1 text-lg font-bold sm:text-xl" style={{ color: c.color }}>
              {c.positive ? '+' : '-'}₹{Math.round(c.value).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
      </div>

      {/* Net totals row */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <div className="glass-chip flex items-center justify-between rounded-xl px-4 py-2.5">
          <span className="text-xs text-[#6b7a9e]">Cash Net</span>
          <WalletValue value={summary.cashNet} signed />
        </div>
        <div className="glass-chip flex items-center justify-between rounded-xl px-4 py-2.5">
          <span className="text-xs text-[#6b7a9e]">GPay Net</span>
          <WalletValue value={summary.gpayNet} signed />
        </div>
        <div className="glass-chip flex items-center justify-between rounded-xl px-4 py-2.5">
          <span className="text-xs text-[#6b7a9e]">Total Net Flow</span>
          <WalletValue value={summary.net} signed />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payment flow pie */}
        <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
          <div className="mb-1 text-sm font-semibold sm:text-base">💸 Cash & GPay Flow</div>
          <p className="mb-3 text-[11px] text-[#6b7a9e]">In vs out, split by payment mode</p>
          <div className="h-[200px] w-full sm:h-[220px]">
            {flowChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart key={`flow-pie-${chartKey}`}>
                  <Pie
                    data={flowChart}
                    cx="50%"
                    cy="50%"
                    innerRadius="48%"
                    outerRadius="82%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {flowChart.map((d) => (
                      <Cell key={d.key} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<FlowTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6b7a9e]">
                No expense data
              </div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {flowChart.map((p) => (
              <div key={p.key} className="flex items-center justify-between py-1 text-[11px] sm:text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="font-mono-num font-semibold" style={{ color: p.color }}>
                  ₹{p.value.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By reason grouped bar */}
        <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
          <div className="mb-1 text-sm font-semibold sm:text-base">📊 By Reason (In / Out)</div>
          <p className="mb-3 text-[11px] text-[#6b7a9e]">Cash & GPay positive vs negative per item</p>
          <div className="h-[220px] w-full sm:h-[240px]">
            {reasonChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={`reason-bar-${chartKey}`}
                  data={reasonChart}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                  <XAxis
                    dataKey="reason"
                    stroke="#6b7a9e"
                    tick={{ fontSize: 9, fill: '#6b7a9e' }}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    stroke="#6b7a9e"
                    tick={{ fontSize: 10, fill: '#6b7a9e' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v}`}
                    width={44}
                  />
                  <Tooltip content={<ReasonTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="cashIn" name="Cash In" fill={EXPENSE_FLOW_COLORS.cashIn} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="gpayIn" name="GPay In" fill={EXPENSE_FLOW_COLORS.gpayIn} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cashOut" name="Cash Out" fill={EXPENSE_FLOW_COLORS.cashOut} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="gpayOut" name="GPay Out" fill={EXPENSE_FLOW_COLORS.gpayOut} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6b7a9e]">
                No expense data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense log table */}
      <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
        <div className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">📋 Expense Log</div>
        <div className="max-h-[280px] overflow-x-auto overflow-y-auto sm:max-h-[320px]">
          <table className="w-full min-w-[520px] border-collapse text-[12px] sm:text-[13px]">
            <thead className="sticky top-0 bg-[#111520]">
              <tr className="border-b border-[#1e2740]">
                <th className="px-2 py-2 text-left text-[10px] uppercase text-[#6b7a9e] sm:px-2.5 sm:text-[11px]">
                  Reason
                </th>
                <th className="px-2 py-2 text-right text-[10px] uppercase text-[#10b981] sm:px-2.5 sm:text-[11px]">
                  Cash +
                </th>
                <th className="px-2 py-2 text-right text-[10px] uppercase text-[#f43f5e] sm:px-2.5 sm:text-[11px]">
                  Cash −
                </th>
                <th className="px-2 py-2 text-right text-[10px] uppercase text-[#3b82f6] sm:px-2.5 sm:text-[11px]">
                  GPay +
                </th>
                <th className="px-2 py-2 text-right text-[10px] uppercase text-[#f97316] sm:px-2.5 sm:text-[11px]">
                  GPay −
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => {
                const cash = +e.Cash || 0;
                const gpay = +e.Gpay || 0;
                return (
                  <tr
                    key={`${uploadId}-${e.Reason}-${i}`}
                    className={[
                      'border-b border-[#1e2740] transition-colors hover:bg-[#181e2e]',
                      /wallet/i.test(e.Reason) ? 'bg-[#a855f7]/5' : '',
                    ].join(' ')}
                  >
                    <td className="px-2 py-1.5 capitalize sm:px-2.5">{e.Reason}</td>
                    <td className="px-2 py-1.5 text-right sm:px-2.5">
                      {cash > 0 ? <WalletValue value={cash} signed /> : <span className="text-[#6b7a9e]">-</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right sm:px-2.5">
                      {cash < 0 ? <WalletValue value={cash} signed /> : <span className="text-[#6b7a9e]">-</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right sm:px-2.5">
                      {gpay > 0 ? <WalletValue value={gpay} signed /> : <span className="text-[#6b7a9e]">-</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right sm:px-2.5">
                      {gpay < 0 ? <WalletValue value={gpay} signed /> : <span className="text-[#6b7a9e]">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#f7c948]/30 bg-[#181e2e] font-bold">
                <td className="px-2 py-2.5 text-[#f7c948] sm:px-2.5">TOTAL</td>
                <td className="px-2 py-2.5 text-right text-[#10b981] sm:px-2.5">
                  +₹{Math.round(summary.cashIn).toLocaleString('en-IN')}
                </td>
                <td className="px-2 py-2.5 text-right text-[#f43f5e] sm:px-2.5">
                  −₹{Math.round(summary.cashOut).toLocaleString('en-IN')}
                </td>
                <td className="px-2 py-2.5 text-right text-[#3b82f6] sm:px-2.5">
                  +₹{Math.round(summary.gpayIn).toLocaleString('en-IN')}
                </td>
                <td className="px-2 py-2.5 text-right text-[#f97316] sm:px-2.5">
                  −₹{Math.round(summary.gpayOut).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
        <div className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">🧾 Financial Summary</div>
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
