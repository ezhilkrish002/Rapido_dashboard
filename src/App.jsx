import { useCallback, useMemo, useState } from 'react';
import AppBackground from './components/AppBackground.jsx';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import OverviewTab from './components/OverviewTab.jsx';
import DailyTab from './components/DailyTab.jsx';
import RidesTab from './components/RidesTab.jsx';
import ExpensesTab from './components/ExpensesTab.jsx';
import { parseExcelFile } from './utils/parseExcel.js';
import {
  DEFAULT_DATE_FILTER,
  filterByDateRange,
  filterExpensesByDateRange,
  getDataDateBounds,
  buildChartDataFromDaily,
  isActiveFilter,
} from './utils/dateFilter.js';
import { computeWalletStats } from './utils/wallet.js';
import {
  loadDashboardFromStorage,
  buildDashboardFromExcel,
  persistDashboard,
} from './utils/dashboardState.js';
import { useToast } from './context/ToastContext.jsx';

export default function App() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState(loadDashboardFromStorage);
  const [tab, setTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState(DEFAULT_DATE_FILTER);
  const [uploading, setUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const { daily, rides, expenses, walletMeta, lastUpdated, uploadId } = dashboard;

  const dataBounds = useMemo(() => getDataDateBounds(daily), [daily, uploadId]);

  const handleFile = useCallback(
    async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;

      setUploading(true);
      const loadingId = toast.loading(`Reading ${f.name}…`);

      try {
        const result = await parseExcelFile(f);
        toast.dismiss(loadingId);

        if (!result.ok) {
          toast.error(result.error || 'Failed to parse Excel file.');
          return;
        }

        setDashboard((prev) => {
          const next = buildDashboardFromExcel(result, prev);
          persistDashboard(next);
          return next;
        });

        setDateFilter(DEFAULT_DATE_FILTER);
        setFileInputKey((k) => k + 1);

        if (result.expensesFound) {
          toast.success(
            `Updated! ${result.daily.length} days · ${result.rides.length} rides · ${result.expenses.length} expenses (sheet: ${result.expenseSheetName})`,
            5000
          );
        } else {
          toast.success(
            `Updated! ${result.daily.length} days · ${result.rides.length} rides`,
            4000
          );
          toast.info(
            `Expense sheet not found. Sheets in file: ${result.sheetNames.join(', ')}.`,
            7000
          );
        }
      } catch (err) {
        toast.dismiss(loadingId);
        console.error('Upload failed:', err);
        toast.error(err?.message || 'Unexpected error while uploading file.');
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  const filteredDaily = useMemo(
    () => filterByDateRange(daily, dateFilter),
    [daily, dateFilter, uploadId]
  );

  const filteredRides = useMemo(() => {
    const filtered = filterByDateRange(rides, dateFilter);
    return [...filtered].sort((a, b) => {
      const da = new Date(a.Date);
      const db = new Date(b.Date);
      if (db - da !== 0) return db - da;
      return b.SNo - a.SNo;
    });
  }, [rides, dateFilter, uploadId]);

  const { rows: filteredExpenses, undatedExpensesHidden } = useMemo(
    () => filterExpensesByDateRange(expenses, dateFilter),
    [expenses, dateFilter, uploadId]
  );

  const walletStats = useMemo(
    () =>
      computeWalletStats(filteredDaily, filteredRides, {
        balance: isActiveFilter(dateFilter)
          ? getLatestBalanceInRange(filteredDaily, walletMeta.balance)
          : walletMeta.balance,
        recharge: isActiveFilter(dateFilter) ? null : walletMeta.recharge,
        fallbackBalance: isActiveFilter(dateFilter) ? null : walletMeta.fallbackBalance,
      }),
    [filteredDaily, filteredRides, walletMeta, dateFilter, uploadId]
  );

  const stats = useMemo(() => {
    const d = filteredDaily;
    if (!d.length) {
      return {
        workDays: 0,
        totalCommission: 0,
        totalDetection: 0,
        walletRecharge: walletStats.recharge ?? 0,
        walletBalance: walletStats.balance ?? 0,
      };
    }
    const totalProfit = d.reduce((s, r) => s + r.Profit, 0);
    const totalRevenue = d.reduce((s, r) => s + r.Total, 0);
    const totalOrders = d.reduce((s, r) => s + r.Orders, 0);
    const totalDistance = d.reduce((s, r) => s + r.Distance, 0);
    const totalPetrol = d.reduce((s, r) => s + r.Petrol, 0);
    const totalIncentive = d.reduce((s, r) => s + r.Incentive, 0);
    const totalTips = d.reduce((s, r) => s + r.Tips, 0);
    const totalCash = d.reduce((s, r) => s + r.Cash, 0);
    const totalGpay = d.reduce((s, r) => s + r.Gpay, 0);
    const totalDetection = d.reduce((s, r) => s + r.Detection, 0);
    const totalCommission = d.reduce((s, r) => s + r.Commission, 0);
    const totalWallet = d.reduce((s, r) => s + (r.Wallet || 0), 0);
    const avgProfit = totalProfit / d.length;
    const avgOrders = totalOrders / d.length;
    const profitPerKm = totalDistance > 0 ? totalProfit / totalDistance : 0;
    const bestDay = d.reduce((b, r) => (r.Profit > b.Profit ? r : b), d[0]);
    return {
      totalProfit,
      totalRevenue,
      totalOrders,
      totalDistance,
      totalPetrol,
      totalIncentive,
      totalTips,
      totalCash,
      totalGpay,
      totalDetection,
      totalCommission,
      totalWallet,
      walletBalance: walletStats.balance,
      walletRecharge: walletStats.recharge,
      walletUsed: walletStats.used,
      avgProfit,
      avgOrders,
      profitPerKm,
      bestDay,
      workDays: d.length,
    };
  }, [filteredDaily, walletStats, uploadId, dateFilter]);

  const chartData = useMemo(
    () => buildChartDataFromDaily(filteredDaily),
    [filteredDaily, uploadId, dateFilter]
  );

  const weekdayData = useMemo(() => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = names.map((n) => ({
      day: n,
      Profit: 0,
      Orders: 0,
      Days: 0,
    }));
    filteredDaily.forEach((d) => {
      const idx = new Date(d.Date).getDay();
      if (Number.isNaN(idx)) return;
      buckets[idx].Profit += d.Profit;
      buckets[idx].Orders += d.Orders;
      buckets[idx].Days += 1;
    });
    return buckets.map((b) => ({
      day: b.day,
      AvgProfit: b.Days ? +(b.Profit / b.Days).toFixed(0) : 0,
      AvgOrders: b.Days ? +(b.Orders / b.Days).toFixed(1) : 0,
      Days: b.Days,
    }));
  }, [filteredDaily, uploadId, dateFilter]);

  const paymentPie = useMemo(
    () => [
      { name: 'GPay', value: stats.totalGpay || 0 },
      { name: 'Cash', value: stats.totalCash || 0 },
    ],
    [stats, dateFilter]
  );

  const revenueBreakdown = useMemo(
    () => [
      { name: 'Commission', value: +(stats.totalCommission || 0).toFixed(0) },
      { name: 'Tips', value: +(stats.totalTips || 0).toFixed(0) },
      { name: 'Incentive', value: +(stats.totalIncentive || 0).toFixed(0) },
    ],
    [stats, dateFilter]
  );

  const viewKey = `${uploadId}-${dateFilter.preset}-${dateFilter.from}-${dateFilter.to}`;

  return (
    <>
      <AppBackground />
      <div className="relative mx-auto w-full max-w-[1280px] px-3 pb-6 sm:px-4 sm:pb-10 md:px-6">
        <Header
          lastUpdated={lastUpdated}
          dateFilter={dateFilter}
          onDateFilter={setDateFilter}
          dataBounds={dataBounds}
          uploading={uploading}
          onFile={handleFile}
          fileInputKey={fileInputKey}
          walletBalance={walletStats.balance ?? 0}
        />

        <Tabs tab={tab} onTab={setTab} />

        <div key={viewKey} className="tab-content-enter">
          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              filteredDaily={filteredDaily}
              paymentPie={paymentPie}
              revenueBreakdown={revenueBreakdown}
              weekdayData={weekdayData}
              dateFilter={dateFilter}
            />
          )}
          {tab === 'daily' && (
            <DailyTab
              filteredDaily={filteredDaily}
              chartData={chartData}
              walletBalance={walletStats.balance ?? 0}
              dateFilter={dateFilter}
            />
          )}
          {tab === 'rides' && (
            <RidesTab
              rides={filteredRides}
              totalOrders={stats.totalOrders || 0}
              allRidesCount={rides.length}
              walletBalance={walletStats.balance ?? 0}
              dateFilter={dateFilter}
            />
          )}
          {tab === 'expenses' && (
            <ExpensesTab
              stats={stats}
              expenses={filteredExpenses}
              walletRecharge={walletStats.recharge}
              uploadId={uploadId}
              dateFilter={dateFilter}
              undatedExpensesHidden={undatedExpensesHidden}
            />
          )}
        </div>

        <div className="mt-6 animate-fade-in px-2 text-center text-[11px] text-[#6b7a9e] sm:mt-8">
          Upload your updated{' '}
          <strong className="text-[#f7c948]">Rap_1.xlsx</strong> anytime to refresh
          all data automatically
        </div>
      </div>
    </>
  );
}

function getLatestBalanceInRange(filteredDaily, metaBalance) {
  if (!filteredDaily?.length) return metaBalance ?? 0;
  const withBal = [...filteredDaily]
    .filter((d) => d.BalanceWallet !== undefined)
    .sort((a, b) => new Date(b.Date) - new Date(a.Date));
  if (withBal.length) return +withBal[0].BalanceWallet;
  return metaBalance ?? 0;
}
