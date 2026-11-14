/**
 * 一行设置项。label 把控件包在里面，点标题就能聚焦/切换控件，
 * 读屏也会把标题当成控件的名字 —— 不用再手写 htmlFor/id 配对。
 */
export function Field({ label, hint, children }) {
  return (
    <div className="__ss_field">
      <label className="__ss_label">
        <span className="__ss_labelText">{label}</span>
        {children}
      </label>
      {hint ? <div className="__ss_hint">{hint}</div> : null}
    </div>
  )
}
