import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import CustomTooltip from './CustomTooltip.jsx';
import { buildPetrolIntervalProfitData } from '../utils/petrolIntervals.js';
import { fmt } from '../utils/format.js';
import { profitBadgeClass } from '../utils/profit.js';

function IntervalTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="max-w-[240px] rounded-lg border border-[#1e2740] bg-[#181e2e] px-3.5 py-2.5 text-xs shadow-lg">
      <div className="mb-1.5 font-semibold text-[#f7c948]">{row.fullLabel}</div>
      {row.petrolPrice > 0 && (
        <div className="mb-0.5 text-[#f43f5e]">
          Petrol fill: <strong className="font-mono-num">₹{row.petrolPrice}</strong>
        </div>
      )}
      <div className="mb-0.5 text-[#6b7a9e]">
        Period: <strong>{row.dateRange}</strong> ({row.Days} day{row.Days !== 1 ? 's' : ''})
      </div>
      <div className="mb-0.5 text-[#f7c948]">
        Interval profit: <strong className="font-mono-num">{fmt(row.RangeProfit)}</strong>
      </div>
      <div className="mb-0.5 text-[#8b5cf6]">
        Distance: <strong className="font-mono-num">{row.Distance} km</strong>
      </div>
      <div className="mb-0.5 text-[#f43f5e]">
        Daily petrol cost: <strong className="font-mono-num">{fmt(row.DailyPetrolCost)}</strong>
      </div>
      <div className="text-[#10b981]">
        ₹/km: <strong className="font-mono-num">₹{row.ProfitPerKm}</strong>
      </div>
    </div>
  );
}

export default function ProfitRangeChart({
  filteredDaily = [],
  chartKey = '',
  heightClass = 'h-[220px] w-full sm:h-[260px] md:h-[280px]',
}) {
  const data = useMemo(
    () => buildPetrolIntervalProfitData(filteredDaily),
    [filteredDaily]
  );

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-[#6b7a9e]">
        No petrol fill intervals in this range. Add days with a petrol refill amount to see
        profit by tank price.
      </p>
    );
  }

  return (
    <div className={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          key={`profit-range-${chartKey}-${data.length}`}
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#6b7a9e"
            tick={{ fontSize: 9, fill: '#6b7a9e' }}
            tickLine={false}
            interval={0}
            angle={data.length > 4 ? -25 : 0}
            textAnchor={data.length > 4 ? 'end' : 'middle'}
            height={data.length > 4 ? 52 : 30}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7a9e"
            tick={{ fontSize: 10, fill: '#6b7a9e' }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => `₹${v}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7a9e"
            tick={{ fontSize: 10, fill: '#6b7a9e' }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v) => `${v}km`}
          />
          <Tooltip content={<IntervalTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            yAxisId="left"
            dataKey="RangeProfit"
            fill="#f7c948"
            radius={[4, 4, 0, 0]}
            name="Interval profit"
            maxBarSize={48}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Distance"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#8b5cf6' }}
            name="Distance (km)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyProfitPetrolChart({ chartData, chartKey }) {
  if (!chartData?.length) {
    return (
      <p className="py-8 text-center text-sm text-[#6b7a9e]">
        No daily data to chart. Upload your Excel file or widen the date filter.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
      >
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
        <Bar
          dataKey="DailyPetrol"
          fill="#f43f5e"
          radius={[4, 4, 0, 0]}
          name="Daily petrol"
        />
        <Bar dataKey="Incentive" fill="#10b981" radius={[4, 4, 0, 0]} name="Incentive" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailyProfitPetrolPanel({ chartData, chartKey, totalProfit, className = '' }) {
  return (
    <div className={`glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
        <div className="text-sm font-semibold sm:text-base">
          📊 Daily Profit vs Daily Petrol
        </div>
        <div className={profitBadgeClass(totalProfit)}>
          💰 Total {fmt(totalProfit)}
        </div>
      </div>
      <p className="mb-3 text-[11px] text-[#6b7a9e] sm:text-xs">
        Red bars use daily petrol cost (from sheet), not refill amount.
      </p>
      <div className="h-[220px] w-full sm:h-[260px] md:h-[280px]">
        <DailyProfitPetrolChart chartData={chartData} chartKey={chartKey} />
      </div>
    </div>
  );
}

export function ProfitRangePanel({ filteredDaily, chartKey, className = '' }) {
  return (
    <div className={`glass-panel animate-fade-in-up rounded-xl p-3 sm:p-4 md:p-5 ${className}`}>
      <div className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base">
        ⛽ Profit by Petrol Fill Interval
      </div>
      <p className="mb-3 text-[11px] text-[#6b7a9e] sm:text-xs">
        Each bar is profit between petrol fills (e.g. ₹220 tank until the next ₹200 fill), with
        distance ridden in that period.
      </p>
      <ProfitRangeChart filteredDaily={filteredDaily} chartKey={chartKey} />
    </div>
  );
}
