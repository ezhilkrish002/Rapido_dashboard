export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e2740] bg-[#181e2e] px-3.5 py-2.5 text-xs shadow-lg">
      <div className="mb-1.5 font-semibold text-[#6b7a9e]">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="mb-0.5" style={{ color: p.color }}>
          {p.name}:{' '}
          <strong className="font-mono-num">
            ₹{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
