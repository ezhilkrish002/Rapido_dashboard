import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import CustomTooltip from './CustomTooltip.jsx';
import WalletBalanceBanner from './WalletBalanceBanner.jsx';
import WalletValue from './WalletValue.jsx';
import { fmt } from '../utils/format.js';
import { profitCellClass, profitBadgeClass } from '../utils/profit.js';
import { walletSignClass } from '../utils/wallet.js';

const TH =
  'whitespace-nowrap px-2 sm:px-3.5 py-2.5 sm:py-3 text-right text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7a9e]';
const TD = 'px-2 sm:px-3.5 py-2 sm:py-2.5 text-right whitespace-nowrap';

export default function DailyTab({ filteredDaily, chartData, walletBalance = 0 }) {
  const sum = (key) => filteredDaily.reduce((s, r) => s + r[key], 0);
  const totalProfit = sum('Profit');

  return (
    <div className="space-y-4">
      <WalletBalanceBanner balance={walletBalance} compact />

      <div className="glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
          <div className="text-sm font-semibold sm:text-base">
            📊 Daily Profit vs Petrol Cost
          </div>
          <div className={profitBadgeClass(totalProfit)}>
            💰 Total {fmt(totalProfit)}
          </div>
        </div>
        <div className="h-[220px] w-full sm:h-[260px] md:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#6b7a9e"
                tick={{ fontSize: 10, fill: '#6b7a9e' }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <YAxis
                stroke="#6b7a9e"
                tick={{ fontSize: 10, fill: '#6b7a9e' }}
                tickLine={false}
                axisLine={false}
                width={42}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Profit" fill="#f7c948" radius={[4, 4, 0, 0]} name="Profit" />
              <Bar dataKey="Petrol" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Petrol" />
              <Bar dataKey="Incentive" fill="#10b981" radius={[4, 4, 0, 0]} name="Incentive" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel animate-fade-in-up overflow-x-auto rounded-xl">
        <p className="px-3 pt-2 text-[10px] text-[#6b7a9e] sm:hidden">
          ← swipe to scroll →
        </p>
        <table className="w-full min-w-[900px] border-collapse text-[12px] sm:text-[13px]">
          <thead>
            <tr className="border-b border-[#1e2740]">
              <th className={`${TH} sticky left-0 z-10 bg-[#111520]/95 text-left backdrop-blur`}>
                Date
              </th>
              {['Orders', 'Distance', 'Total', 'Commission', 'Tips', 'Incentive', 'Cash', 'GPay', 'Petrol', 'Wallet', 'Bal', 'Profit'].map((h) => (
                <th
                  key={h}
                  className={`${TH} ${h === 'Profit' ? 'text-[#f7c948]' : ''} ${h === 'Wallet' ? 'text-[#a855f7]' : ''} ${h === 'Bal' ? 'text-[#10b981]' : ''}`}
                >
                  {h}
                </th>
              ))}            </tr>
          </thead>
          <tbody>
            {filteredDaily.map((d, i) => (
              <tr
                key={i}
                className="row-glow group border-b border-[#1e2740]"
                style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
              >
                <td className="font-mono-num sticky left-0 z-10 whitespace-nowrap bg-[#111520]/95 px-2 py-2 text-xs text-[#f7c948] backdrop-blur group-hover:bg-[#181e2e]/95 sm:px-3.5 sm:py-2.5">
                  {d.Date}
                </td>
                <td className={TD}>{d.Orders}</td>
                <td className={TD}>{d.Distance} km</td>
                <td className={`${TD} font-semibold text-[#3b82f6]`}>{fmt(d.Total)}</td>
                <td className={TD}>{fmt(d.Commission)}</td>
                <td className={`${TD} text-[#06b6d4]`}>{fmt(d.Tips)}</td>
                <td className={`${TD} text-[#f97316]`}>{fmt(d.Incentive)}</td>
                <td className={TD}>{fmt(d.Cash)}</td>
                <td className={TD}>{fmt(d.Gpay)}</td>
                <td className={`${TD} text-[#f43f5e]`}>{fmt(d.Petrol)}</td>
                <td className={`${TD} ${walletSignClass(d.Wallet)}`}>
                  {d.Wallet !== 0 ? (
                    <WalletValue value={d.Wallet} />
                  ) : (
                    <span className="text-[#6b7a9e]">-</span>
                  )}
                </td>
                <td className={`${TD} text-[#6b7a9e]`}>-</td>
                <td className={`${TD} font-bold ${profitCellClass(d.Profit)}`}>                  {fmt(d.Profit)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#f7c948]/40 bg-[#181e2e] font-bold">
              <td className="sticky left-0 z-10 bg-[#181e2e] px-2 py-3 text-[#f7c948] sm:px-3.5">
                TOTAL
              </td>
              <td className={TD}>{sum('Orders')}</td>
              <td className={TD}>{sum('Distance')} km</td>
              <td className={`${TD} text-[#3b82f6]`}>{fmt(sum('Total'))}</td>
              <td className={TD}>{fmt(sum('Commission'))}</td>
              <td className={`${TD} text-[#06b6d4]`}>{fmt(sum('Tips'))}</td>
              <td className={`${TD} text-[#f97316]`}>{fmt(sum('Incentive'))}</td>
              <td className={TD}>{fmt(sum('Cash'))}</td>
              <td className={TD}>{fmt(sum('Gpay'))}</td>
              <td className={`${TD} text-[#f43f5e]`}>{fmt(sum('Petrol'))}</td>
              <td className={`${TD} text-[#6b7a9e]`}>{fmt(sum('Wallet'))}</td>
              <td className={`${TD} ${walletSignClass(walletBalance)}`}>
                <WalletValue value={walletBalance} />
              </td>
              <td className={`${TD} profit-cell-high font-bold`}>{fmt(totalProfit)}</td>            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
