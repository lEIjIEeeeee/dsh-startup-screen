import { createContext, useContext, useRef } from 'react'

export interface FieldA11y {
  labelId?: string
  hintId?: string
}

/**
 * 设置项标题的 id。
 *
 * 一个标题可能对应多个控件（比如两个输入框拼成一行），
 * 用 <label> 把控件全包住会产出不合法的结构，所以改成
 * 标题只负责显示，控件用 aria-labelledby 指回来。
 */
export const FieldContext = createContext<FieldA11y | null>(null)

let fieldSeq = 0

/** 生成页面内唯一的 id；同一个组件实例跨渲染保持不变。 */
export function useFieldId(): string {
  const ref = useRef<string | null>(null)
  if (ref.current === null) ref.current = 'ss-field-' + ++fieldSeq
  return ref.current
}

/** 取当前设置项的标题 / 提示 id；不在 Field 里时返回空对象。 */
export function useFieldA11y(): FieldA11y {
  return useContext(FieldContext) || {}
}
