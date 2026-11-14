export function TextInput({ value, placeholder, maxLength, mono, onChange }) {
  return (
    <input
      className={'__ss_input' + (mono ? ' __ss_inputMono' : '')}
      type="text"
      value={value == null ? '' : String(value)}
      placeholder={placeholder || ''}
      maxLength={maxLength || 64}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
