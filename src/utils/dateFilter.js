export function filterByDateRange(rows, dateFilter, dateKey = 'Date') {
  if (dateFilter === 'all') return rows;
  const cutoff = new Date();
  if (dateFilter === '7d') cutoff.setDate(cutoff.getDate() - 7);
  if (dateFilter === '14d') cutoff.setDate(cutoff.getDate() - 14);
  if (dateFilter === '30d') cutoff.setDate(cutoff.getDate() - 30);
  return rows.filter((r) => new Date(r[dateKey]) >= cutoff);
}
