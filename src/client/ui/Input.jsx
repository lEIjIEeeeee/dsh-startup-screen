/**
 * 宿主 UI primitives 的薄包装（Input）。
 *
 * 注意 DOM 形状：primitives.Input 的 className 落在外层 <span> 上，
 * 原生 <input> 是它的子节点。所以样式统一写成 `.__ss_input input{…}`，
 * 兜底实现也保持同样的结构，换实现不会掉样式。
 */
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'

const PrimitiveInput = typeof primitives.Input === 'function' ? primitives.Input : null

if (!PrimitiveInput && typeof console !== 'undefined' && console.warn) {
  console.warn('[dsh-startup-screen] 宿主未导出 ui-primitives.Input，已退回原生输入框')
}

export function Input({ value, placeholder, maxLength, mono, onChange, className, ...rest }) {
  const cls = '__ss_input' + (mono ? ' __ss_inputMono' : '') + (className ? ' ' + className : '')
  const props = Object.assign(
    {
      className: cls,
      type: 'text',
      value: value == null ? '' : String(value),
      placeholder: placeholder || '',
      maxLength: maxLength || 64,
      spellCheck: false,
      onChange: (e) => onChange(e.target.value),
    },
    rest,
  )
  if (PrimitiveInput) return <PrimitiveInput {...props} />
  return (
    <span className={cls}>
      <input {...props} className={undefined} />
    </span>
  )
}
