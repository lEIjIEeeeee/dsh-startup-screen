export interface SwitchProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  return (
    <label className="__ss_check">
      <input
        type="checkbox"
        role="switch"
        aria-checked={!!checked}
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="__ss_switch" aria-hidden="true">
        <i />
      </span>
      <span className="__ss_checkText">
        <span>{label}</span>
        {hint ? <span className="__ss_hint">{hint}</span> : null}
      </span>
    </label>
  )
}
