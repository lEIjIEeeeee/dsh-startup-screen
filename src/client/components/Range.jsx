import { useFieldA11y } from '../a11y.js'

export function Range({ value, min, max, step, display, onChange, ...rest }) {
  const a11y = useFieldA11y()
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
        aria-labelledby={a11y.labelId}
        aria-describedby={a11y.hintId}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
      <span className="__ss_status" aria-hidden="true">
        {display}
      </span>
    </div>
  )
}
