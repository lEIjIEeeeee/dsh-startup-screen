export function Switch({ label, hint, checked, onChange }) {
  return (
    <label className="__ss_check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
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
