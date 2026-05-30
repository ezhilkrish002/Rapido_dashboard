import { useCallback, useMemo, useState } from 'react';
import AppBackground from './components/AppBackground.jsx';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import OverviewTab from './components/OverviewTab.jsx';
import DailyTab from './components/DailyTab.jsx';
import RidesTab from './components/RidesTab.jsx';
import ExpensesTab from './components/ExpensesTab.jsx';
import { parseExcel } from './utils/parseExcel.js';
import { filterByDateRange } from './utils/dateFilter.js';
import { normalizeRide } from './utils/normalize.js';
import {
  computeWalletStats,
} from './utils/wallet.js';
import {
  INITIAL_DAILY,
  INITIAL_RIDES,
  EXPENSES,
  WALLET_META,
} from './data/initialData.js';

export default function App() {
  const [daily, setDaily] = useState(INITIAL_DAILY);
  const [rides, setRides] = useState(() =>
    INITIAL_RIDES.map((r, i) => normalizeRide(r, i))
  );
  const [walletMeta, setWalletMeta] = useState({
    balance: WALLET_META.balance,
    recharge: WALLET_META.recharge,
    fallbackBalance: WALLET_META.balance,
  });
  const [tab, setTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Built-in data');

  const handleFile = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);
    parseExcel(f, ({ daily: d, rides: r, walletMeta: wm, ok }) => {
      if (ok && d.length > 0) {
        setDaily(d);
        setRides(r);
        setWalletMeta({
          balance: wm?.balance ?? null,
          recharge: wm?.recharge ?? null,
          fallbackBalance: null,
        });
        setLastUpdated(new Date().toLocaleTimeString());
      }
      setUploading(false);
      e.target.value = '';
    });
  }, []);

  const filteredDaily = useMemo(
    () => filterByDateRange(daily, dateFilter),
    [daily, dateFilter]
  );

  const filteredRides = useMemo(() => {
    const filtered = filterByDateRange(rides, dateFilter);
    return [...filtered].sort((a, b) => {
      const da = new Date(a.Date);
      const db = new Date(b.Date);
      if (db - da !== 0) return db - da;
      return b.SNo - a.SNo;
    });
  }, [rides, dateFilter]);

  const walletStats = useMemo(
    () =>
      computeWalletStats(daily, rides, {
        balance: walletMeta.balance,
        recharge: walletMeta.recharge,
        fallbackBalance: walletMeta.fallbackBalance,
      }),
    [daily, rides, walletMeta]
  );

  const stats = useMemo(() => {
    const d = filteredDaily;
    if (!d.length) return {};
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
  }, [filteredDaily, walletStats]);

  const walletRecharge = walletStats.recharge;

  const chartData = useMemo(() => {
    const sorted = [...filteredDaily].sort(
      (a, b) => new Date(a.Date) - new Date(b.Date)
    );
    let cumProfit = 0;
    let cumRevenue = 0;
    return sorted.map((d, i, arr) => {
      cumProfit += d.Profit;
      cumRevenue += d.Total;
      const window = arr.slice(Math.max(0, i - 2), i + 1);
      const ma3 = window.reduce((s, x) => s + x.Profit, 0) / window.length;
      return {
        ...d,
        label: d.Date.slice(5).replace('-', '/'),
        ProfitPerOrder: d.Orders > 0 ? +(d.Profit / d.Orders).toFixed(1) : 0,
        ProfitPerKm: d.Distance > 0 ? +(d.Profit / d.Distance).toFixed(1) : 0,
        CumProfit: +cumProfit.toFixed(0),
        CumRevenue: +cumRevenue.toFixed(0),
        MA3: +ma3.toFixed(1),
      };
    });
  }, [filteredDaily]);

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
  }, [filteredDaily]);

  const paymentPie = useMemo(
    () => [
      { name: 'GPay', value: stats.totalGpay || 0 },
      { name: 'Cash', value: stats.totalCash || 0 },
    ],
    [stats]
  );

  const revenueBreakdown = useMemo(
    () => [
      { name: 'Commission', value: +(stats.totalCommission || 0).toFixed(0) },
      { name: 'Tips', value: +(stats.totalTips || 0).toFixed(0) },
      { name: 'Incentive', value: +(stats.totalIncentive || 0).toFixed(0) },
    ],
    [stats]
  );

  const expPie = useMemo(() => {
    const byReason = {};
    EXPENSES.forEach((e) => {
      const total = Math.abs(e.Cash) + Math.abs(e.Gpay);
      byReason[e.Reason] = (byReason[e.Reason] || 0) + total;
    });
    return Object.entries(byReason)
      .map(([k, v]) => ({ name: k, value: +v.toFixed(0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, []);

  return (
    <>
      <AppBackground />
      <div className="relative mx-auto w-full max-w-[1280px] px-3 pb-6 sm:px-4 sm:pb-10 md:px-6">
        <Header
          lastUpdated={lastUpdated}
          dateFilter={dateFilter}
          onDateFilter={setDateFilter}
          uploading={uploading}
          onFile={handleFile}
          walletBalance={walletStats.balance ?? 0}
        />

        <Tabs tab={tab} onTab={setTab} />

        <div key={tab} className="tab-content-enter">
          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              chartData={chartData}
              paymentPie={paymentPie}
              revenueBreakdown={revenueBreakdown}
              weekdayData={weekdayData}
            />
          )}
          {tab === 'daily' && (
            <DailyTab
              filteredDaily={filteredDaily}
              chartData={chartData}
              walletBalance={walletStats.balance ?? 0}
            />
          )}
          {tab === 'rides' && (
            <RidesTab
              rides={filteredRides}
              totalOrders={stats.totalOrders || 0}
              allRidesCount={rides.length}
              walletBalance={walletStats.balance ?? 0}
            />
          )}
          {tab === 'expenses' && (
            <ExpensesTab
              stats={stats}
              expPie={expPie}
              walletRecharge={walletRecharge}
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
