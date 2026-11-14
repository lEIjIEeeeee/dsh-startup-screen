/**
 * 左下角实时时钟：每秒刷新一次。
 *
 * @param {Record<string, any>} ui
 */
export function createClock(ui) {
  let timer = null

  function paint() {
    const d = new Date()
    const pad = function (n) {
      return (n < 10 ? '0' : '') + n
    }
    ui.meta2.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }

  function start() {
    paint()
    timer = setInterval(paint, 1000)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { start, stop }
}
