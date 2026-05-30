import {
  DEFAULT_DATE_FILTER,
  formatDateISO,
  getDataDateBounds,
  dateFilterLabel,
} from '../utils/dateFilter.js';

const PRESETS = [
  { id: 'all', label: 'All' },
  { id: '1d', label: '1 Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'custom', label: 'Custom' },
];

export default function DateFilterBar({
  dateFilter = DEFAULT_DATE_FILTER,
  onDateFilter,
  dataBounds = {},
}) {
  const minStr = dataBounds.min ? formatDateISO(dataBounds.min) : '';
  const maxStr = dataBounds.max ? formatDateISO(dataBounds.max) : '';
  const active = dateFilter.preset || 'all';

  const setPreset = (preset) => {
    if (preset === 'custom') {
      onDateFilter({
        preset: 'custom',
        from: dateFilter.from || minStr,
        to: dateFilter.to || maxStr,
      });
      return;
    }
    onDateFilter({ preset, from: null, to: null });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="glass-chip flex flex-wrap items-center gap-1.5 rounded-lg p-1 sm:gap-2">
        {PRESETS.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={[
                'cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-xs',
                isActive
                  ? 'scale-105 border-[#f7c948] bg-[#f7c948]/15 text-[#f7c948] shadow-[0_0_12px_rgba(247,201,72,0.2)]'
                  : 'border-transparent bg-transparent text-[#6b7a9e] hover:text-[#e8ecf5]',
              ].join(' ')}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {active === 'custom' && (
        <div className="glass-chip flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3">
          <label className="flex items-center gap-1.5 text-[11px] text-[#6b7a9e] sm:text-xs">
            From
            <input
              type="date"
              value={dateFilter.from || minStr}
              min={minStr}
              max={dateFilter.to || maxStr}
              onChange={(e) =>
                onDateFilter({ ...dateFilter, preset: 'custom', from: e.target.value })
              }
              className="date-input rounded border border-[#1e2740] bg-[#0a0d14] px-2 py-1 text-[11px] text-[#e8ecf5] sm:text-xs"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-[#6b7a9e] sm:text-xs">
            To
            <input
              type="date"
              value={dateFilter.to || maxStr}
              min={dateFilter.from || minStr}
              max={maxStr}
              onChange={(e) =>
                onDateFilter({ ...dateFilter, preset: 'custom', to: e.target.value })
              }
              className="date-input rounded border border-[#1e2740] bg-[#0a0d14] px-2 py-1 text-[11px] text-[#e8ecf5] sm:text-xs"
            />
          </label>
          {minStr && maxStr && (
            <span className="text-[10px] text-[#6b7a9e]">
              Data: {minStr} → {maxStr}
            </span>
          )}
        </div>
      )}

      {active !== 'all' && (
        <div className="text-[10px] text-[#6b7a9e] sm:text-[11px]">
          Filter: <span className="text-[#f7c948]">{dateFilterLabel(dateFilter)}</span>
        </div>
      )}
    </div>
  );
}
