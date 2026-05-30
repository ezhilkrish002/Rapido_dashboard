export function normalizePayMode(value) {
  const s = String(value ?? '').trim().toLowerCase();
  if (!s) return 'Gpay';
  if (s.includes('cash')) return 'Cash';
  if (s.includes('gpay') || s.includes('g pay') || s.includes('online') || s.includes('upi')) {
    return 'Gpay';
  }
  return 'Gpay';
}

export function normalizeRide(ride, index = 0) {
  const amount = +ride.Amount || 0;
  const tips = +ride.Tips || 0;
  const incentive = +ride.Incentive || 0;
  let total = +ride.Total || 0;
  if (total <= 0 && (amount > 0 || tips > 0)) {
    total = amount + tips;
  }

  return {
    ...ride,
    SNo: +ride.SNo || index + 1,
    Amount: amount,
    Tips: tips,
    Incentive: incentive,
    Commission: +ride.Commission || 0,
    Detection: +ride.Detection || 0,
    Total: total,
    PayMode: normalizePayMode(ride.PayMode),
    NetEarning: +(total + incentive).toFixed(2),
  };
}
