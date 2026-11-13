import fs from 'node:fs'

/**
 * 直接运行单个测试时不会经过 pretest 构建。
 * lib/ 比源码旧就提醒：运行时断言和源码断言会分别测到新旧两版。
 *
 * @param {string} bundle 构建产物
 * @param {string[]} sources 对应的源码
 */
export function warnIfStale(bundle, sources) {
  try {
    const built = fs.statSync(bundle).mtimeMs
    for (const file of sources) {
      if (fs.statSync(file).mtimeMs > built) {
        console.warn('  ! lib/ 比源码旧，先运行 npm run build，否则可能测到两版代码')
        return
      }
    }
  } catch {
    /* 文件不存在时交给具体断言报错 */
  }
}
