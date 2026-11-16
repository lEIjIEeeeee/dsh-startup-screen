/**
 * 时间线里的两个独立动效：十六进制读数滚动、鲸鱼一笔落墨。
 */

function randomHexLine() {
  let s = ''
  for (let i = 0; i < 26; i++) {
    s += '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
    if (i % 2 === 1) s += ' '
  }
  return s
}

/**
 * 十六进制读数：12 行随机字符，每 110ms 刷新一次。
 *
 * @param {Record<string, any>} ui
 * @param {any} audio
 */
export function createHex(ui, audio) {
  let timer = null

  function paint() {
    const out = []
    for (let i = 0; i < 12; i++) out.push(randomHexLine())
    ui.hex.innerHTML = out.join('<br>')
  }

  function start() {
    paint()
    ui.hex.classList.add('dsu-in')
    audio.tickRun()
    timer = setInterval(paint, 110)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    ui.hex.classList.remove('dsu-in')
  }

  return { start, stop }
}

/**
 * 鲸鱼标识：先勾线，再落墨成面；Web Animations 不可用时直接落墨。
 *
 * @param {Record<string, any>} ui
 * @param {(n: number) => number} ms
 * @param {(n: number) => Promise<any>} wait
 */
export function revealLogo(ui, ms, wait) {
  ui.logo.classList.add('dsu-in')
  ui.dots.hidden = false
  const path = ui.logo.querySelector('path')
  if (path && typeof path.getTotalLength === 'function') {
    try {
      const len = path.getTotalLength()
      path.style.fill = 'none'
      path.style.stroke = 'currentColor'
      path.style.strokeWidth = '1.1'
      path.style.strokeDasharray = len
      path.style.strokeDashoffset = len
      /* 参考片的"一笔画成"：先勾线，再落墨成面 */
      path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: ms(1400),
        easing: 'cubic-bezier(.55,.06,.24,1)',
        fill: 'forwards',
      })
      setTimeout(function () {
        path.style.transition = 'fill ' + ms(420) + 'ms ease, stroke-width ' + ms(420) + 'ms ease'
        path.style.fill = ''
        path.style.strokeWidth = '0'
      }, ms(1450))
    } catch (err) {
      /* Web Animations 不可用时直接落墨 */
    }
  }
  return wait(300)
}
