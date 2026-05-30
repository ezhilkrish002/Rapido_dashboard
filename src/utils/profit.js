export function profitTier(value) {
  if (value > 300) return 'high';
  if (value > 150) return 'mid';
  return 'low';
}

export function profitCellClass(value) {
  const tier = profitTier(value);
  if (tier === 'high') return 'profit-cell-high';
  if (tier === 'mid') return 'profit-cell-mid';
  return 'profit-cell-low';
}

export function profitBadgeClass(value) {
  const tier = profitTier(value);
  return tier === 'high' ? 'profit-badge profit-badge-high' : 'profit-badge profit-badge-mid';
}
