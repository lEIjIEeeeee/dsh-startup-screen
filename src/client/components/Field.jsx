import { FieldContext, useFieldId } from '../a11y.js'

/**
 * 一行设置项：标题在上，控件在下，提示在最后。
 *
 * 标题不包住控件 —— 一个标题可能对应多个控件，
 * 用一个 <label> 全包住会产出不合法的结构。
 * 这里把标题和提示的 id 交给控件，由控件用 aria-labelledby /
 * aria-describedby 指回来，读屏能念出正确的名字和说明。
 */
export function Field({ label, hint, children }) {
  const base = useFieldId()
  const labelId = base + '-label'
  const hintId = hint ? base + '-hint' : undefined
  return (
    <div className="__ss_field">
      <span className="__ss_label" id={labelId}>
        <span className="__ss_labelText">{label}</span>
      </span>
      <FieldContext.Provider value={{ labelId, hintId }}>{children}</FieldContext.Provider>
      {hint ? (
        <div className="__ss_hint" id={hintId}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}
