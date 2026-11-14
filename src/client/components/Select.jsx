import { useFieldA11y } from '../a11y.js'

export function Select({ value, options, onChange, ...rest }) {
  const a11y = useFieldA11y()
  return (
    <select
      className="__ss_select"
      value={value}
      aria-labelledby={a11y.labelId}
      aria-describedby={a11y.hintId}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {options.map((o, i) => (
        <option key={o[0] + '|' + o[1] + '|' + i} value={o[0]}>
          {o[1]}
        </option>
      ))}
    </select>
  )
}
