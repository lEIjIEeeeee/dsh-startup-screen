export function Select({ value, options, onChange }) {
  return (
    <select className="__ss_select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o[0]} value={o[0]}>
          {o[1]}
        </option>
      ))}
    </select>
  )
}
