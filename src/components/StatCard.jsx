export default function StatCard({
  label,
  value,
  sub,
  color = '#f7c948',
  icon,
  trend,
  featured = false,
  delay = 0,
}) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl border border-[#1e2740] bg-[#111520] px-3.5 py-3',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:px-5 sm:py-4',
        'animate-fade-in-up',
        featured ? 'stat-featured' : 'glass-panel',
      ].join(' ')}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
        style={{ background: color }}
      />
      {featured && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#f7c948]/10 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6b7a9e] sm:mb-1.5 sm:text-[11px]">
            {label}
          </div>
          <div
            className={[
              'font-mono-num truncate font-bold leading-tight',
              featured ? 'text-2xl sm:text-3xl profit-shimmer' : 'text-xl sm:text-2xl',
            ].join(' ')}
            style={featured ? undefined : { color }}
            title={String(value)}
          >
            {value}
          </div>
          {sub && (
            <div className="mt-0.5 truncate text-[11px] text-[#6b7a9e] sm:mt-1 sm:text-xs">
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={[
              'shrink-0 opacity-70',
              featured ? 'animate-float-fast text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
            ].join(' ')}
          >
            {icon}
          </div>
        )}
      </div>
      {trend != null && (
        <div
          className="relative mt-1.5 text-[11px] font-medium sm:mt-2 sm:text-xs"
          style={{ color: trend >= 0 ? '#10b981' : '#f43f5e' }}
        >
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs avg
        </div>
      )}
    </div>
  );
}
