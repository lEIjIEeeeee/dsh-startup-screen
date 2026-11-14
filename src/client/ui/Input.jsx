import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'
import { useFieldA11y } from '../a11y.js'

/**
 * 宿主输入框的薄包装。
 *
 * 注意 DOM 形状：宿主把类名挂在外层 <span> 上，原生 <input> 是它的子节点。
 * 所以样式统一写成 `.__ss_input input{…}`，兜底实现也保持同样的结构，
 * 换实现不会掉样式。
 */
const PrimitiveInput = typeof primitives.Input === 'function' ? primitives.Input : null

if (!PrimitiveInput && typeof console !== 'undefined' && console.warn) {
  console.warn('[dsh-startup-screen] 宿主未导出 ui-primitives.Input，已退回原生输入框')
}

export function Input({ value, placeholder, maxLength, mono, onChange, className, ...rest }) {
  const a11y = useFieldA11y()
  const cls = '__ss_input' + (mono ? ' __ss_inputMono' : '') + (className ? ' ' + className : '')
  const props = Object.assign(
    {
      className: cls,
      type: 'text',
      value: value == null ? '' : String(value),
      placeholder: placeholder || '',
      spellCheck: false,
      'aria-labelledby': a11y.labelId,
      'aria-describedby': a11y.hintId,
      onChange: (e) => onChange(e.target.value),
    },
    maxLength ? { maxLength } : null,
    rest,
  )
  if (PrimitiveInput) return <PrimitiveInput {...props} />
  return (
    <span className={cls}>
      <input {...props} className={undefined} />
    </span>
  )
}
