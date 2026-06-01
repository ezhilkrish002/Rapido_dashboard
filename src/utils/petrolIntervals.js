import { parseLocalDate } from './dateFilter.js';

/** Estimated daily fuel cost from sheet or distance × ₹3/km fallback. */
export function resolveDailyPetrol(row) {
  const explicit = +(row?.DailyPetrol || 0);
  if (explicit > 0) return explicit;
  const dist = +(row?.Distance || 0);
  return dist > 0 ? dist * 3 : 0;
}

function shortDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(5).replace('-', '/');
}

function buildIntervalPoint({ petrolPrice, days }) {
  if (!days?.length) return null;
  const profit = days.reduce((s, d) => s + (d.Profit || 0), 0);
  const distance = days.reduce((s, d) => s + (d.Distance || 0), 0);
  const dailyPetrolCost = days.reduce((s, d) => s + resolveDailyPetrol(d), 0);
  const start = days[0].Date;
  const end = days[days.length - 1].Date;
  const range = `${shortDate(start)}→${shortDate(end)}`;
  const priceLabel = petrolPrice > 0 ? `₹${Math.round(petrolPrice)}` : 'No fill';

  return {
    petrolPrice: Math.round(petrolPrice),
    label: petrolPrice > 0 ? priceLabel : range,
    fullLabel: petrolPrice > 0 ? `${priceLabel} · ${range}` : range,
    from: start,
    to: end,
    dateRange: range,
    RangeProfit: +profit.toFixed(0),
    Distance: +distance.toFixed(0),
    DailyPetrolCost: +dailyPetrolCost.toFixed(0),
    ProfitPerKm: distance > 0 ? +(profit / distance).toFixed(1) : 0,
    Days: days.length,
  };
}

/**
 * Group working days by petrol fill amount (Petrol > 0). Each fill starts a new
 * interval; following days until the next fill share that tank price. Profit and
 * distance are summed per interval.
 */
export function buildPetrolIntervalProfitData(filteredDaily) {
  const sorted = [...(filteredDaily || [])].sort(
    (a, b) => parseLocalDate(a.Date) - parseLocalDate(b.Date)
  );
  if (!sorted.length) return [];

  const intervals = [];
  let preFill = [];
  let current = null;

  const pushInterval = (interval) => {
    const point = buildIntervalPoint(interval);
    if (point) intervals.push(point);
  };

  for (const day of sorted) {
    const refill = +(day.Petrol || 0) > 0;
    if (refill) {
      if (preFill.length) {
        pushInterval({ petrolPrice: 0, days: preFill });
        preFill = [];
      }
      if (current?.days?.length) {
        pushInterval(current);
      }
      current = { petrolPrice: day.Petrol, days: [day] };
    } else if (current) {
      current.days.push(day);
    } else {
      preFill.push(day);
    }
  }

  if (preFill.length) pushInterval({ petrolPrice: 0, days: preFill });
  if (current?.days?.length) pushInterval(current);

  return intervals;
}
