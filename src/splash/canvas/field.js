import { isAmbientOn } from '../core/config.js'
import { createScene } from './scene.js'

/**
 * 活体光场（Canvas）。
 *
 * 低分辨率 Canvas：星尘 / 贝塞尔流光 / 边缘数据雨 / 底部水线。
 * 中心区域自动降亮，不压文字；种子来自真实信息，同一台机器构图一致。
 * ambient=false 时不建节点；prefers-reduced-motion 只画一帧。
 *
 * @param {{
 *   canvas: any,
 *   root: any,
 *   config: Record<string, any>,
 *   facts: Record<string, any>,
 *   reduced: boolean,
 * }} options
 * @returns {any|null} 光场句柄；环境不满足时返回 null
 */
export function createField(options) {
  const canvas = options.canvas
  const root = options.root
  const config = options.config
  const facts = options.facts || {}
  const reduced = !!options.reduced
  if (!isAmbientOn(config)) return null
  if (!canvas || typeof canvas.getContext !== 'function') return null
  let ctx = null
  try {
    ctx = canvas.getContext('2d')
  } catch (e) {
    return null
  }
  if (!ctx) return null

  const dpr = Math.min(1.75, Math.max(1, Number(window.devicePixelRatio) || 1))
  const limit = 150
  let raf = 0
  let frames = 0
  let ticks = 0
  /* 玻璃模式每帧都要重新合成 backdrop-filter；光场隔帧画一次，观感几乎不变。 */
  const frameEvery = config.glass ? 2 : 1
  let stopped = false
  const startedAt = Date.now()
  function fieldNow() {
    return Math.max(0, Date.now() - startedAt)
  }
  const palette =
    config.theme === 'dark'
      ? { cool: '111,211,232', warm: '255,177,102', dim: '224,241,246' }
      : { cool: '38,108,122', warm: '164,91,38', dim: '48,64,66' }

  /* 同一台机器、同一份真实信息，光场构图一致 */
  let state = 2166136261
  const seed =
    String(facts.hash || 'DSHBOOT') +
    '|' +
    String(facts.profile || '') +
    '|' +
    String(facts.bundleCount || '')
  for (let k = 0; k < seed.length; k++) {
    state ^= seed.charCodeAt(k)
    state = Math.imul(state, 16777619) >>> 0
  }
  function rand() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }

  const scene = createScene({ ctx, config, palette, rand, limit })

  function resize() {
    const W = Math.max(
      1,
      Number(canvas.clientWidth) || Number(root.clientWidth) || Number(window.innerWidth) || 1600,
    )
    const H = Math.max(
      1,
      Number(canvas.clientHeight) ||
        Number(root.clientHeight) ||
        Number(window.innerHeight) ||
        1020,
    )
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    if (canvas.style) {
      canvas.style.width = '100%'
      canvas.style.height = '100%'
    }
    if (typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    scene.setSize(W, H)
  }

  const handle = {
    frames: 0,
    width() {
      return scene.width()
    },
    height() {
      return scene.height()
    },
    draw(ms, still) {
      scene.draw(ms || 0, !!still)
    },
    stop() {
      stopped = true
      if (raf) {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }

  function frame() {
    if (stopped) return
    ticks++
    if (ticks % frameEvery === 0) {
      scene.draw(fieldNow(), false)
      frames++
      handle.frames = frames
    }
    raf = window.requestAnimationFrame(frame)
  }

  function onResize() {
    resize()
    scene.draw(fieldNow(), true)
  }
  function onVisibility() {
    if (document.hidden) {
      if (raf) {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
    } else if (!reduced && !raf) {
      raf = window.requestAnimationFrame(frame)
    }
  }

  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  resize()
  scene.draw(0, true)
  if (!reduced) raf = window.requestAnimationFrame(frame)
  return handle
}
