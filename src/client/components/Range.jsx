export function Range({ value, min, max, step, display, onChange }) {
  const lo = Number(min)
  const hi = Number(max)
  const val = Number(value)
  const pct = hi > lo ? Math.max(0, Math.min(100, ((val - lo) / (hi - lo)) * 100)) : 0
  return (
    <div className="__ss_row">
      <input
        type="range"
        className="__ss_range"
        min={min}
        max={max}
        step={step || 0.05}
        value={value}
        style={{ flex: '1 1 200px', '--ss-fill': pct + '%' }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="__ss_status" aria-hidden="true">
        {display}
      </span>
    </div>
  )
}
