/* 宿主 primitives 没有类型声明；只声明本插件实际用到的两个控件。 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ComponentType } from 'react'
  export const Button: ComponentType<any> | undefined
  export const Input: ComponentType<any> | undefined
}
