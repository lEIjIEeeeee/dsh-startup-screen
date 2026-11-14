/**
 * 宿主按钮的薄包装。
 *
 * 用宿主控件是为了白拿原生语义：type="button"、键盘触发、焦点环。
 * 视觉仍由调用方给的 __ss_* 类名负责，不依赖宿主那套样式。
 *
 * 宿主版本可能没有导出这个控件，缺了就退回原生按钮并告警一次：
 * 设置面板不能因为一个装饰性依赖整个挂掉。
 */
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'

const PrimitiveButton = typeof primitives.Button === 'function' ? primitives.Button : null

if (!PrimitiveButton && typeof console !== 'undefined' && console.warn) {
  console.warn('[dsh-startup-screen] 宿主未导出 ui-primitives.Button，已退回原生按钮')
}

function FallbackButton({ children, ...rest }) {
  return (
    <button type="button" {...rest}>
      {children}
    </button>
  )
}

export function Button(props) {
  const Impl = PrimitiveButton || FallbackButton
  return <Impl {...props} />
}
