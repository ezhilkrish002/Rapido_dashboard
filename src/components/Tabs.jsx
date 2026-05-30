const TABS = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'daily', icon: '📅', label: 'Daily' },
  { id: 'rides', icon: '🏍️', label: 'Rides' },
  { id: 'expenses', icon: '💸', label: 'Expenses' },
];

export default function Tabs({ tab, onTab }) {
  return (
    <div className="mb-4 -mx-1 overflow-x-auto sm:mb-6 sm:mx-0">
      <div className="glass-panel mx-1 inline-flex min-w-full gap-1 rounded-[10px] p-1 sm:min-w-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={[
                'relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs transition-all duration-300 sm:flex-none sm:px-4 sm:text-sm',
                active
                  ? 'bg-[#181e2e] font-semibold text-[#e8ecf5] shadow-[inset_0_0_0_1px_rgba(247,201,72,0.25)]'
                  : 'bg-transparent font-normal text-[#6b7a9e] hover:text-[#e8ecf5]',
              ].join(' ')}
            >
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#f7c948]" />
              )}
              <span className={active ? 'animate-scale-in' : ''}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
