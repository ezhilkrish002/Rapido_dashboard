/** Split expense rows into Cash / GPay × In / Out totals. */
export function computeExpenseSummary(expenses = []) {
  let cashIn = 0;
  let cashOut = 0;
  let gpayIn = 0;
  let gpayOut = 0;

  expenses.forEach((e) => {
    const cash = +e.Cash || 0;
    const gpay = +e.Gpay || 0;

    if (cash > 0) cashIn += cash;
    else if (cash < 0) cashOut += Math.abs(cash);

    if (gpay > 0) gpayIn += gpay;
    else if (gpay < 0) gpayOut += Math.abs(gpay);
  });

  return {
    cashIn,
    cashOut,
    gpayIn,
    gpayOut,
    cashNet: cashIn - cashOut,
    gpayNet: gpayIn - gpayOut,
    totalIn: cashIn + gpayIn,
    totalOut: cashOut + gpayOut,
    net: cashIn - cashOut + gpayIn - gpayOut,
  };
}

export const EXPENSE_FLOW_COLORS = {
  cashIn: '#10b981',
  cashOut: '#f43f5e',
  gpayIn: '#3b82f6',
  gpayOut: '#f97316',
};

/** Pie / bar data: Cash & GPay in/out as separate slices. */
export function buildExpenseFlowChart(summary) {
  return [
    { name: 'Cash In', key: 'cashIn', value: +summary.cashIn.toFixed(0), color: EXPENSE_FLOW_COLORS.cashIn },
    { name: 'Cash Out', key: 'cashOut', value: +summary.cashOut.toFixed(0), color: EXPENSE_FLOW_COLORS.cashOut },
    { name: 'GPay In', key: 'gpayIn', value: +summary.gpayIn.toFixed(0), color: EXPENSE_FLOW_COLORS.gpayIn },
    { name: 'GPay Out', key: 'gpayOut', value: +summary.gpayOut.toFixed(0), color: EXPENSE_FLOW_COLORS.gpayOut },
  ].filter((d) => d.value > 0);
}

/** Grouped bar: per reason, cash/gpay in vs out. */
export function buildExpenseReasonChart(expenses = []) {
  const byReason = {};

  expenses.forEach((e) => {
    const reason = String(e.Reason || 'Other').trim() || 'Other';
    if (!byReason[reason]) {
      byReason[reason] = { cashIn: 0, cashOut: 0, gpayIn: 0, gpayOut: 0 };
    }
    const cash = +e.Cash || 0;
    const gpay = +e.Gpay || 0;

    if (cash > 0) byReason[reason].cashIn += cash;
    else if (cash < 0) byReason[reason].cashOut += Math.abs(cash);

    if (gpay > 0) byReason[reason].gpayIn += gpay;
    else if (gpay < 0) byReason[reason].gpayOut += Math.abs(gpay);
  });

  return Object.entries(byReason)
    .map(([reason, v]) => ({
      reason,
      cashIn: +v.cashIn.toFixed(0),
      cashOut: +v.cashOut.toFixed(0),
      gpayIn: +v.gpayIn.toFixed(0),
      gpayOut: +v.gpayOut.toFixed(0),
      total: +(v.cashIn + v.cashOut + v.gpayIn + v.gpayOut).toFixed(0),
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}
