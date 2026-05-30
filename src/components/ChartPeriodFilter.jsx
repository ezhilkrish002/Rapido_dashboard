import { useLayoutEffect, useRef, useState } from 'react';
import { CHART_PERIODS, chartPeriodLabel } from '../utils/dateFilter.js';
import { useChartSectionSticky } from '../hooks/useChartSectionSticky.js';

export function ChartPeriodFilterBar({ period, onPeriod, dataPoints = 0, barRef }) {
  return (
    <div
      ref={barRef}
      className="glass-chip flex flex-col gap-2.5 rounded-xl border border-[#1e2740]/80 px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3"
      role="toolbar"
      aria-label="Chart date range"
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/15 text-sm"
          aria-hidden
        >
          📊
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#e8ecf5] sm:text-[13px]">
            Chart range
          </div>
          <div className="truncate text-[10px] text-[#6b7a9e] sm:text-[11px]">
            {chartPeriodLabel(period)}
            {dataPoints > 0 && (
              <span className="text-[#3b82f6]">
                {' '}
                · {dataPoints} day{dataPoints !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-lg bg-[#0a0d14]/60 p-1 sm:shrink-0">
        {CHART_PERIODS.map((p) => {
          const active = period === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriod(p.id)}
              aria-pressed={active}
              className={[
                'shrink-0 cursor-pointer rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-xs',
                active
                  ? 'scale-[1.02] border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6] shadow-[0_0_14px_rgba(59,130,246,0.25)]'
                  : 'border-transparent bg-transparent text-[#6b7a9e] hover:bg-[#181e2e]/80 hover:text-[#e8ecf5]',
              ].join(' ')}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Sticky chart filter — visible only while the charts section is on screen. */
export default function ChartPeriodFilter({
  period,
  onPeriod,
  dataPoints = 0,
  sectionRef,
}) {
  const { sectionVisible, pinned, sentinelRef } = useChartSectionSticky(sectionRef);
  const barRef = useRef(null);
  const fixedBarRef = useRef(null);
  const [barHeight, setBarHeight] = useState(72);

  useLayoutEffect(() => {
    const el = pinned ? fixedBarRef.current : barRef.current;
    if (!el) return;
    setBarHeight(el.offsetHeight);
  }, [period, dataPoints, sectionVisible, pinned]);

  if (!sectionVisible) return null;

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

      {!pinned ? (
        <div className="sticky top-0 z-30 -mx-1 pb-2 pt-0.5 sm:-mx-0 sm:top-0">
          <ChartPeriodFilterBar
            period={period}
            onPeriod={onPeriod}
            dataPoints={dataPoints}
            barRef={barRef}
          />
        </div>
      ) : (
        <>
          <div className="animate-fade-in fixed inset-x-0 top-0 z-40 border-b border-[#1e2740]/60 bg-[#0a0d14]/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mx-auto w-full max-w-[1280px] px-3 py-2 sm:px-4 md:px-6">
              <ChartPeriodFilterBar
                period={period}
                onPeriod={onPeriod}
                dataPoints={dataPoints}
                barRef={fixedBarRef}
              />
            </div>
          </div>
          <div aria-hidden style={{ height: barHeight + 8 }} className="shrink-0" />
        </>
      )}
    </>
  );
}
