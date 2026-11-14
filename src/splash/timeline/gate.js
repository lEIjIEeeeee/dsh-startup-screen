/**
 * 时间线的等待闸门：普通等待、等待用户操作、跳过时一次性放行。
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
  const timers = []
  const waiters = []

  function wait(base) {
    return new Promise(function (resolve) {
      if (isSkipped()) return resolve()
      let done = false
      function fin() {
        if (done) return
        done = true
        const i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
        resolve()
      }
      const t = setTimeout(fin, Math.max(0, ms(base)))
      timers.push(t)
      waiters.push(fin)
    })
  }

  function waitAction() {
    return new Promise(function (resolve) {
      if (isSkipped() || !C.requireInteraction) return resolve()
      /* 等用户操作期间暂停计时：正在犹豫的人不该被超时保护踢出去 */
      disarmStall()
      let done = false
      function fin() {
        if (done) return
        done = true
        cleanup()
        armStall()
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

  /** 清掉所有计时器并放行等待者；跳过 / 揭幕 / 销毁都走这里。 */
  function release() {
    for (let i = 0; i < timers.length; i++) clearTimeout(timers[i])
    timers.length = 0
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
