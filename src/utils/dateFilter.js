import { resolveDailyPetrol } from './petrolIntervals.js';

/** Parse many date formats as local midnight. */
export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // ISO: 2026-05-29
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + +dmy[3] : +dmy[3];
    return new Date(year, +dmy[2] - 1, +dmy[1]);
  }

  // MM/DD/YYYY (US)
  const mdy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) {
    return new Date(+mdy[3], +mdy[1] - 1, +mdy[2]);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatDateISO(d) {
  if (!d) return '';
  const date = parseLocalDate(d);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEFAULT_DATE_FILTER = { preset: 'all', from: null, to: null };

/** Min / max dates present in rows. */
export function getDataDateBounds(rows, dateKey = 'Date') {
  let min = null;
  let max = null;
  (rows || []).forEach((r) => {
    const d = parseLocalDate(r[dateKey]);
    if (!d) return;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  });
  return { min, max };
}

export function getLatestDate(rows, dateKey = 'Date') {
  return getDataDateBounds(rows, dateKey).max || new Date();
}

function resolveRange(filter, rows, dateKey = 'Date') {
  const { min, max } = getDataDateBounds(rows, dateKey);
  if (!max) return null;

  const end = new Date(max.getFullYear(), max.getMonth(), max.getDate());
  let start = new Date(end);

  const preset = typeof filter === 'string' ? filter : filter?.preset;

  if (!preset || preset === 'all') return null;

  if (preset === 'custom') {
    const from = parseLocalDate(filter.from);
    const to = parseLocalDate(filter.to) || end;
    if (!from) return { start: min || end, end: to };
    return { start: from, end: to };
  }

  if (preset === '1d') {
    return { start: end, end };
  }
  if (preset === 'week' || preset === '7d') {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (preset === 'month' || preset === '30d') {
    start.setDate(start.getDate() - 29);
    return { start, end };
  }
  if (preset === '14d') {
    start.setDate(start.getDate() - 13);
    return { start, end };
  }

  return null;
}

export function filterByDateRange(rows, filter, dateKey = 'Date') {
  const preset = typeof filter === 'string' ? filter : filter?.preset;
  if (!preset || preset === 'all') return rows;

  const range = resolveRange(filter, rows, dateKey);
  if (!range) return rows;

  return rows.filter((r) => {
    const d = parseLocalDate(r[dateKey]);
    if (!d) return false;
    return d >= range.start && d <= range.end;
  });
}

export function filterExpensesByDateRange(expenses, filter, _referenceDate) {
  const preset = typeof filter === 'string' ? filter : filter?.preset;
  if (!preset || preset === 'all') return { rows: expenses, undatedHidden: 0 };

  const dated = [];
  const undated = [];
  expenses.forEach((e) => {
    if (e.Date) dated.push(e);
    else undated.push(e);
  });

  return {
    rows: filterByDateRange(dated, filter, 'Date'),
    undatedHidden: undated.length,
  };
}

export function dateFilterLabel(filter) {
  const preset = typeof filter === 'string' ? filter : filter?.preset;
  if (!preset || preset === 'all') return 'All time';
  if (preset === '1d') return 'Latest day';
  if (preset === 'week' || preset === '7d') return 'Last 7 days';
  if (preset === '14d') return 'Last 14 days';
  if (preset === 'month' || preset === '30d') return 'Last 30 days';
  if (preset === 'custom') {
    const from = filter.from || '…';
    const to = filter.to || '…';
    return `${from} → ${to}`;
  }
  return preset;
}

export function isActiveFilter(filter) {
  const preset = typeof filter === 'string' ? filter : filter?.preset;
  return preset && preset !== 'all';
}

/** Chart-only period (applied on top of global filter). */
export const CHART_PERIODS = [
  { id: 'all', label: 'All' },
  { id: '1d', label: '1 Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export function filterChartPeriod(rows, period, dateKey = 'Date') {
  if (!period || period === 'all') return rows;
  return filterByDateRange(rows, { preset: period }, dateKey);
}

export function chartPeriodLabel(period) {
  if (!period || period === 'all') return 'All data';
  if (period === '1d') return 'Latest day';
  if (period === 'week') return 'Last 7 days';
  if (period === 'month') return 'Last 30 days';
  return period;
}

export function buildChartDataFromDaily(filteredDaily) {
  const sorted = [...filteredDaily].sort(
    (a, b) => parseLocalDate(a.Date) - parseLocalDate(b.Date)
  );
  let cumProfit = 0;
  let cumRevenue = 0;
  return sorted.map((d) => {
    cumProfit += d.Profit;
    cumRevenue += d.Total;
    const incentive = +(d.Incentive || 0);
    const dailyPetrol = resolveDailyPetrol(d);
    return {
      ...d,
      label: d.Date.slice(5).replace('-', '/'),
      DailyPetrol: +dailyPetrol.toFixed(0),
      ProfitPerOrder: d.Orders > 0 ? +(d.Profit / d.Orders).toFixed(1) : 0,
      ProfitPerKm: d.Distance > 0 ? +(d.Profit / d.Distance).toFixed(1) : 0,
      CumProfit: +cumProfit.toFixed(0),
      CumRevenue: +cumRevenue.toFixed(0),
      Detection: +(d.Detection || 0),
      Distance: +(d.Distance || 0),
      Incentive: incentive,
      HasIncentive: incentive > 0,
      IncentiveLabel: incentive > 0 ? `+₹${Math.round(incentive)}` : '',
    };
  });
}
