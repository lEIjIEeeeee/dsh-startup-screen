import { useFieldA11y } from '../a11y.js'

export function ColorInput({ value, onChange, ...rest }) {
  const a11y = useFieldA11y()
  return (
    <input
      className="__ss_swatch"
      type="color"
      value={value}
      aria-labelledby={a11y.labelId}
      aria-describedby={a11y.hintId}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  )
}
