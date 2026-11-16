/**
 * 时间线的等待闸门：普通等待、等待用户操作、跳过时一次性放行。
 *
 * release() 之后闸门永久打开：揭幕/跳过已经发生过，后续链式等待立刻返回，
 * 也不会再注册键盘或点击监听（否则 finish 之后才走到 waitAction 的链会泄漏监听）。
 *
 * @param {{
 *   config: Record<string, any>,
 *   ui: Record<string, any>,
 *   ms: (n: number) => number,
 *   armStall: () => void,
 *   disarmStall: () => void,
 *   isSkipped: () => boolean,
 * }} options
 */
export function createGate(options) {
  const C = options.config
  const ui = options.ui
  const ms = options.ms
  const armStall = options.armStall
  const disarmStall = options.disarmStall
  const isSkipped = options.isSkipped
  const timers = new Set()
  const waiters = []
  let released = false

  function wait(base) {
    return new Promise(function (resolve) {
      if (released || isSkipped()) return resolve()
      let done = false
      let timer = null
      function fin() {
        if (done) return
        done = true
        if (timer) {
          clearTimeout(timer)
          timers.delete(timer)
        }
        const i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
        resolve()
      }
      timer = setTimeout(fin, Math.max(0, ms(base)))
      timers.add(timer)
      waiters.push(fin)
    })
  }

  function waitAction() {
    return new Promise(function (resolve) {
      if (released || isSkipped() || !C.requireInteraction) return resolve()
      /* 等用户操作期间暂停计时：正在犹豫的人不该被超时保护踢出去 */
      disarmStall()
      let done = false
      function fin() {
        if (done) return
        done = true
        cleanup()
        /* 揭幕/跳过时的放行不再重新上弦，避免 watchdog 在 finish 之后复活 */
        if (!released) armStall()
        resolve()
      }
      function onKey(e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault()
          fin()
        }
      }
      function onClick(e) {
        e.preventDefault()
        fin()
      }
      function cleanup() {
        ui.btn.removeEventListener('click', onClick)
        ui.action.removeEventListener('click', onClick)
        document.removeEventListener('keydown', onKey)
        const i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
      }
      ui.btn.addEventListener('click', onClick)
      ui.action.addEventListener('click', onClick)
      document.addEventListener('keydown', onKey)
      waiters.push(fin)
    })
  }

  /** 清掉所有计时器并放行等待者；跳过 / 揭幕 / 销毁都走这里。之后闸门保持打开。 */
  function release() {
    released = true
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    const list = waiters.slice()
    waiters.length = 0
    for (let j = 0; j < list.length; j++) {
      try {
        list[j]()
      } catch (err) {
        /* noop */
      }
    }
  }

  return { wait, waitAction, release }
}
