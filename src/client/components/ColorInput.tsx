import type { InputHTMLAttributes } from 'react'
import { useFieldA11y } from '../a11y.js'

export interface ColorInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: string
  onChange: (value: string) => void
}

export function ColorInput({ value, onChange, ...rest }: ColorInputProps) {
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
