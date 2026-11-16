import type { SelectHTMLAttributes } from 'react'
import { useFieldA11y } from '../a11y.js'

export interface SelectProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: T
  options: ReadonlyArray<readonly [T, string]>
  onChange: (value: T) => void
}

export function Select<T extends string>({ value, options, onChange, ...rest }: SelectProps<T>) {
  const a11y = useFieldA11y()
  return (
    <select
      className="__ss_select"
      value={value}
      aria-labelledby={a11y.labelId}
      aria-describedby={a11y.hintId}
      onChange={(e) => onChange(e.target.value as T)}
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
