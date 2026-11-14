/**
 * 宿主 UI primitives 的最小类型声明。
 *
 * 这个包由宿主在运行时通过模块加载器提供，仓库里不装它，所以这里只声明
 * 我们用到的两个导出。等 client 侧也纳入 tsc（目前还在迁移豁免里），
 * 或者把包装成 devDependency，就可以删掉这份声明，改用包自带的类型。
 *
 * 运行时用 typeof 校验导出；类型上标成可选，提醒调用方必须兜底。
 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  type PrimitiveProps = {
    [key: string]: unknown
    children?: unknown
    className?: string
  }

  export const Button: ((props: PrimitiveProps) => unknown) | undefined
  export const Input: ((props: PrimitiveProps) => unknown) | undefined
}
