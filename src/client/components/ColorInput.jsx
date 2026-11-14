export function ColorInput({ value, onChange }) {
  return (
    <input
      className="__ss_swatch"
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
