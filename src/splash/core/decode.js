import { DECODE_TICK } from './constants.js'
import { el } from './dom.js'

/* 全角片假名（1em 宽）+ 半角 hex —— 两组都和目标字同宽。
   中文用片假名：笔画密度与汉字接近，且所有中文字体都覆盖；
   换成数字 / 拉丁或康熙部首会出现密度太稀、字宽不一致或豆腐块。 */
const GLYPH_WIDE = 'アイウエオカキクケコ' + 'サシスセソタチツテトナニヌネノ'
const GLYPH_NARROW = '0123456789ABCDEF'

function glyphFor(ch) {
  const wide = ch.charCodeAt(0) > 0x2e7f
  const pool = wide ? GLYPH_WIDE : GLYPH_NARROW
  return pool.charAt(Math.floor(Math.random() * pool.length))
}

/**
 * 逐字写入与解码调度。
 *
 * 一个实例对应一次播放：所有字共用一个定时器，dispose 时一并停掉。
 * `reduced` 为真时不做解码动画，直接落真字。
 *
 * @param {boolean} reduced
 */
export function createDecoder(reduced) {
  let decodeTimer = null
  let decodePending = []

  /** 逐字写入。fade=淡入上移；decode=先落随机字形再锁定真字（只给中文主字）。 */
  function typeIn(host, text, stagger, mode) {
    host.textContent = ''
    const frag = document.createDocumentFragment()
    const slots = []
    let n = 0
    const decode = mode === 'decode' && !reduced
    for (let i = 0; i < text.length; i++) {
      const ch = text.charAt(i)
      if (ch === ' ') {
        frag.appendChild(document.createTextNode(' '))
        continue
      }
      const sep = ch === '·'
      const span = el('span', sep ? 'dsu-ch dsu-sep' : 'dsu-ch', decode && !sep ? glyphFor(ch) : ch)
      span.style.transitionDelay = Math.round(n * stagger) + 'ms'
      if (decode && !sep) slots.push({ node: span, text: ch, delay: Math.round(n * stagger) })
      frag.appendChild(span)
      n++
    }
    host.appendChild(frag)
    return slots
  }

  function startDecode(slots) {
    stopDecode()
    if (!slots || !slots.length) return
    for (const slot of slots) {
      decodePending.push({
        node: slot.node,
        text: slot.text,
        lockAt: slot.delay + 100 + Math.random() * 180,
      })
    }
    const t0 = Date.now()
    decodeTimer = setInterval(() => {
      const now = Date.now() - t0
      const rest = []
      for (const item of decodePending) {
        if (now >= item.lockAt) item.node.textContent = item.text
        else {
          item.node.textContent = glyphFor(item.text)
          rest.push(item)
        }
      }
      decodePending = rest
      if (!decodePending.length) stopDecode()
    }, DECODE_TICK)
  }

  /** 停掉解码并把还没锁定的字强制写成真字（跳过 / 揭幕 / dispose 时必须调）。 */
  function stopDecode() {
    if (decodeTimer) {
      clearInterval(decodeTimer)
      decodeTimer = null
    }
    for (const item of decodePending) item.node.textContent = item.text
    decodePending = []
  }

  return { typeIn, startDecode, stopDecode }
}
