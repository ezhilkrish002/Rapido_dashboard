import { useMemo, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from 'recharts';
import StatCard from './StatCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import ProfitHero from './ProfitHero.jsx';
import ChartPeriodFilter from './ChartPeriodFilter.jsx';
import { fmt } from '../utils/format.js';
import { CHART_COLORS } from '../data/initialData.js';
import { walletColor, fmtWalletBalance } from '../utils/wallet.js';
import {
  dateFilterLabel,
  isActiveFilter,
  filterChartPeriod,
  buildChartDataFromDaily,
} from '../utils/dateFilter.js';
import WalletBalanceBanner from './WalletBalanceBanner.jsx';

function Panel({ title, children, className = '' }) {
  return (
    <div
      className={`glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5 ${className}`}
    >
      <div className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
        {title}
      </div>
      {children}
    </div>
  );
}

// Chart wrapper with breakpoint-driven height. Recharts ResponsiveContainer
// at 100%/100% fills the wrapper, so we control the height with Tailwind.
function ChartBox({ size = 'md', chartKey, children }) {
  const sizes = {
    sm: 'h-[180px] sm:h-[200px] md:h-[220px]',
    md: 'h-[200px] sm:h-[220px] md:h-[240px]',
    lg: 'h-[220px] sm:h-[260px] md:h-[280px]',
    pie: 'h-[160px] sm:h-[180px]',
  };
  return (
    <div key={chartKey} className={`w-full ${sizes[size]}`}>
      {children}
    </div>
  );
}

const axisX = {
  dataKey: 'label',
  stroke: '#6b7a9e',
  tick: { fontSize: 10, fill: '#6b7a9e' },
  tickLine: false,
  interval: 'preserveStartEnd',
  minTickGap: 12,
};

const axisY = {
  stroke: '#6b7a9e',
  tick: { fontSize: 10, fill: '#6b7a9e' },
  tickLine: false,
  axisLine: false,
  width: 42,
};

function formatPerfValue(p) {
  const v = p.value;
  if (p.dataKey === 'Distance') {
    return `${typeof v === 'number' ? v.toFixed(1) : v} km`;
  }
  return `₹${typeof v === 'number' ? v.toFixed(1) : v}`;
}

function PerformanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[#1e2740] bg-[#181e2e] px-3.5 py-2.5 text-xs shadow-lg">
      <div className="mb-1.5 font-semibold text-[#6b7a9e]">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="mb-0.5" style={{ color: p.color }}>
          {p.name}:{' '}
          <strong className="font-mono-num">{formatPerfValue(p)}</strong>
        </div>
      ))}
      {row?.HasIncentive && (
        <div className="mt-1.5 border-t border-[#1e2740] pt-1.5 font-semibold text-[#f97316]">
          🎯 Incentive received: ₹{Math.round(row.Incentive)}
        </div>
      )}
    </div>
  );
}

function IncentiveAxisTick({ x, y, payload, chartData }) {
  const row = chartData.find((d) => d.label === payload?.value);
  const highlight = row?.HasIncentive;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill={highlight ? '#f97316' : '#6b7a9e'}
        fontSize={10}
        fontWeight={highlight ? 600 : 400}
      >
        {payload?.value}
      </text>
    </g>
  );
}

export default function OverviewTab({
  stats,
  filteredDaily = [],
  paymentPie,
  revenueBreakdown,
  weekdayData,
  dateFilter = { preset: 'all' },
}) {
  const [chartPeriod, setChartPeriod] = useState('all');
  const chartsSectionRef = useRef(null);

  const chartData = useMemo(() => {
    const periodRows = filterChartPeriod(filteredDaily, chartPeriod);
    return buildChartDataFromDaily(periodRows);
  }, [filteredDaily, chartPeriod, dateFilter]);

  const chartKey = `${dateFilter?.preset}-${chartPeriod}-${chartData.length}-${stats.totalProfit || 0}`;
  const incentiveDays = chartData.filter((d) => d.HasIncentive);

  return (
    <div className="space-y-4 sm:space-y-5">
      {isActiveFilter(dateFilter) && (
        <div className="animate-fade-in rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-2 text-xs text-[#3b82f6] sm:text-sm">
          Cards & stats: <strong>{dateFilterLabel(dateFilter)}</strong> ({stats.workDays || 0} days)
        </div>
      )}

      {stats.workDays === 0 && (
        <div className="rounded-xl border border-[#f43f5e]/30 bg-[#f43f5e]/10 px-4 py-3 text-sm text-[#f43f5e]">
          No data for this filter. Try <strong>All</strong> or widen your custom date range.
        </div>
      )}

      <ProfitHero key={chartKey} stats={stats} />

      <WalletBalanceBanner balance={stats.walletBalance ?? 0} compact />

      {/* ── KPI CARDS (3×3 on desktop) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3">
        <StatCard
          label="Net Profit"
          value={fmt(stats.totalProfit || 0)}
          sub={`${stats.workDays || 0} working days`}
          color="#f7c948"
          icon="💰"
          featured
          delay={0}
        />
        <StatCard
          label="Total Revenue"
          value={fmt(stats.totalRevenue || 0)}
          sub="All rides combined"
          color="#3b82f6"
          icon="📈"
          delay={50}
        />
        <StatCard
          label="Total Orders"
          value={(stats.totalOrders || 0).toFixed(0)}
          sub={`Avg ${(stats.avgOrders || 0).toFixed(1)}/day`}
          color="#10b981"
          icon="🛵"
          delay={100}
        />
        <StatCard
          label="Total Distance"
          value={`${stats.totalDistance || 0} km`}
          sub={`₹${(stats.profitPerKm || 0).toFixed(1)}/km`}
          color="#a855f7"
          icon="🗺️"
          delay={150}
        />
        <StatCard
          label="Wallet Balance"
          value={fmtWalletBalance(stats.walletBalance ?? 0)}
          sub={+(stats.walletBalance ?? 0) >= 0 ? 'Positive balance' : 'Negative balance'}
          color={walletColor(stats.walletBalance ?? 0)}
          icon="👛"
          delay={175}
        />
        <StatCard
          label="Petrol Spent"
          value={fmt(stats.totalPetrol || 0)}
          color="#f43f5e"
          icon="⛽"
          delay={200}
        />
        <StatCard
          label="Incentives"
          value={fmt(stats.totalIncentive || 0)}
          color="#f97316"
          icon="🎯"
          delay={250}
        />
        <StatCard
          label="Tips Earned"
          value={fmt(stats.totalTips || 0)}
          color="#06b6d4"
          icon="🌟"
          delay={300}
        />
        <StatCard
          label="Best Day"
          value={fmt(stats.bestDay?.Profit || 0)}
          sub={stats.bestDay?.Date}
          color="#10b981"
          icon="🏆"
          delay={350}
        />
      </div>

      <section
        ref={chartsSectionRef}
        className="space-y-4 sm:space-y-5"
        aria-label="Charts"
      >
        <ChartPeriodFilter
          period={chartPeriod}
          onPeriod={setChartPeriod}
          dataPoints={chartData.length}
          sectionRef={chartsSectionRef}
        />

        {/* ── ROW 1: TREND + PAYMENT SPLIT ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="📈 Profit & Revenue Trend" className="lg:col-span-2">
          <ChartBox size="md" chartKey={`trend-${chartKey}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                key={`area-trend-${chartKey}`}
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7c948" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f7c948" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                <XAxis {...axisX} />
                <YAxis {...axisY} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Profit"
                  stroke="#f7c948"
                  strokeWidth={2}
                  fill="url(#gProfit)"
                  name="Profit"
                />
                <Area
                  type="monotone"
                  dataKey="Total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="💳 Payment Split">
          <ChartBox size="pie" chartKey={`pay-${chartKey}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={`pie-pay-${chartKey}`}>
                <Pie
                  data={paymentPie}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentPie.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
          <div className="space-y-1.5 pt-2">
            {paymentPie.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[12px] sm:text-[13px]"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: CHART_COLORS[i] }}
                  />
                  {p.name}
                </span>
                <span
                  className="font-mono-num font-semibold"
                  style={{ color: CHART_COLORS[i] }}
                >
                  {fmt(p.value)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── ROW 2: PERFORMANCE TREND ──────────────────────────────────── */}
      <Panel title="🚀 Performance Trend (Profit vs Detection)">
        {incentiveDays.length > 0 && (
          <div className="mb-3 truncate text-[11px] text-[#f97316] sm:text-xs">
            🎯 {incentiveDays.length} incentive day{incentiveDays.length > 1 ? 's' : ''}:{' '}
            {incentiveDays
              .map((d) => `${d.label} ₹${Math.round(d.Incentive)}`)
              .join(' · ')}
          </div>
        )}
        <ChartBox size="lg" chartKey={`perf-${chartKey}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={`perf-${chartKey}`}
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
              <XAxis
                {...axisX}
                tick={(props) => (
                  <IncentiveAxisTick {...props} chartData={chartData} />
                )}
              />
              <YAxis
                yAxisId="left"
                {...axisY}
                tickFormatter={(v) => `₹${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7a9e"
                tick={{ fontSize: 10, fill: '#6b7a9e' }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) => `${v}km`}
              />
              <Tooltip
                content={<PerformanceTooltip />}
                cursor={{ stroke: 'rgba(232,236,245,0.35)', strokeWidth: 1 }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                iconSize={10}
              />
              <Bar
                yAxisId="left"
                dataKey="Profit"
                radius={[4, 4, 0, 0]}
                name="Daily Profit"
                maxBarSize={32}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.HasIncentive ? '#f97316' : '#f7c948'}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Detection"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                name="Detection"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Distance"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                name="Distance"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>

      {/* ── ROW 3: ORDERS + REVENUE BREAKDOWN ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="🛵 Daily Orders & Profit/Order">
          <ChartBox size="sm">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                <XAxis {...axisX} />
                <YAxis yAxisId="left" {...axisY} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  {...axisY}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  yAxisId="left"
                  dataKey="Orders"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ProfitPerOrder"
                  stroke="#f7c948"
                  strokeWidth={2}
                  dot={false}
                  name="₹/Order"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="💰 Revenue Breakdown">
          <ChartBox size="sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#6b7a9e"
                  tick={{ fontSize: 10, fill: '#6b7a9e' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#6b7a9e"
                  tick={{ fontSize: 11, fill: '#6b7a9e' }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Amount">
                  {revenueBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
      </div>

      {/* ── ROW 4: CUMULATIVE + EFFICIENCY ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="📊 Cumulative Earnings">
          <ChartBox size="sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gCumRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCumProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7c948" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f7c948" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                <XAxis {...axisX} />
                <YAxis {...axisY} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="CumRevenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gCumRev)"
                  name="Cumulative Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="CumProfit"
                  stroke="#f7c948"
                  strokeWidth={2}
                  fill="url(#gCumProfit)"
                  name="Cumulative Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="⚡ Earning Efficiency (₹/km, ₹/order)">
          <ChartBox size="sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                <XAxis {...axisX} />
                <YAxis {...axisY} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="ProfitPerKm"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#a855f7' }}
                  name="₹/km"
                />
                <Line
                  type="monotone"
                  dataKey="ProfitPerOrder"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#06b6d4' }}
                  name="₹/order"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
      </div>

      {/* ── ROW 5: WEEKDAY PERFORMANCE ────────────────────────────────── */}
      <Panel title="📅 Weekday Performance (avg per day worked)">
        <ChartBox size="sm">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={weekdayData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#6b7a9e"
                tick={{ fontSize: 11, fill: '#6b7a9e' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                {...axisY}
                tickFormatter={(v) => `₹${v}`}
              />
              <YAxis yAxisId="right" orientation="right" {...axisY} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                yAxisId="left"
                dataKey="AvgProfit"
                radius={[5, 5, 0, 0]}
                name="Avg Profit"
              >
                {weekdayData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="AvgOrders"
                stroke="#e8ecf5"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#e8ecf5' }}
                name="Avg Orders"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>
      </section>
    </div>
  );
}
