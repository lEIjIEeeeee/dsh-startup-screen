/**
 * 冒烟测试共用的断言输出。
 *
 * 四套测试原本各抄一份 `check` + 汇总，格式和退出码必须保持一致，
 * 否则 CI 只会在某一套里静默通过。集中到这里，新增测试只关心断言本身。
 */
export function createChecker() {
  let pass = 0
  let fail = 0

  /**
   * @param {string} label
   * @param {any} ok
   * @param {any} [extra] 失败时附在行尾的诊断信息
   */
  function check(label, ok, extra) {
    if (ok) {
      pass++
      console.log('  ok   ' + label)
    } else {
      fail++
      console.log('  FAIL ' + label + (extra !== undefined ? '  → ' + extra : ''))
    }
  }

  /** 打印汇总并按失败数退出；调用前先做完自己的清理。 */
  function finish() {
    console.log('\n============================')
    console.log(`  通过 ${pass} / 失败 ${fail}`)
    console.log('============================\n')
    process.exit(fail === 0 ? 0 : 1)
  }

  return { check, finish }
}
