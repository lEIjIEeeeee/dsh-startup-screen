/**
 * 全局监听器登记表：dispose 时必须全部摘掉。
 * 重播会新建一份脚本实例，漏摘的监听器会一直持有旧实例的 DOM 与闭包。
 */
export function createListenerRegistry() {
  const disposers = []

  function listen(target, type, fn, opts) {
    if (!target || typeof target.addEventListener !== 'function') return
    try {
      target.addEventListener(type, fn, opts)
    } catch (e) {
      return
    }
    disposers.push(function () {
      try {
        target.removeEventListener(type, fn, opts)
      } catch (e) {
        /* noop */
      }
    })
  }

  function drop() {
    for (let i = 0; i < disposers.length; i++) {
      try {
        disposers[i]()
      } catch (e) {
        /* noop */
      }
    }
    disposers.length = 0
  }

  return { listen, drop }
}
