import { isAmbientOn } from '../core/config.js'

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
  let W = 0
  let H = 0
  let raf = 0
  let frames = 0
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

  const motes = []
  const ribbons = []
  const columns = []

  function resize() {
    W = Math.max(
      1,
      Number(canvas.clientWidth) || Number(root.clientWidth) || Number(window.innerWidth) || 1600
    )
    H = Math.max(
      1,
      Number(canvas.clientHeight) || Number(root.clientHeight) || Number(window.innerHeight) || 1020
    )
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    if (canvas.style) {
      canvas.style.width = '100%'
      canvas.style.height = '100%'
    }
    if (typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    spawn()
  }

  function spawn() {
    motes.length = 0
    ribbons.length = 0
    columns.length = 0
    const count = Math.round(Math.min(limit, Math.max(74, (W * H) / 13500)))
    for (let i = 0; i < count; i++) {
      motes.push({
        x: rand() * W,
        y: rand() * H,
        z: 0.24 + rand() * 0.76,
        r: 0.35 + rand() * 1.35,
        ax: 10 + rand() * 54,
        ay: 7 + rand() * 38,
        sp: 0.000025 + rand() * 0.000075,
        ph: rand() * Math.PI * 2,
        tw: 0.00028 + rand() * 0.00066,
        warm: rand() < 0.24,
      })
    }
    for (let r = 0; r < 4; r++) {
      ribbons.push({
        y: 0.2 + r * 0.18 + rand() * 0.055,
        amp: 0.028 + rand() * 0.042,
        sp: 0.000022 + rand() * 0.000026,
        ph: rand() * Math.PI * 2,
        wide: 5 + rand() * 8,
        warm: r === 1,
      })
    }
    for (let c = 0; c < 12; c++) {
      columns.push({
        side: c % 2,
        x: c < 6 ? 0.025 + rand() * 0.12 : 0.855 + rand() * 0.12,
        y: rand(),
        len: 24 + rand() * 86,
        sp: 0.000006 + rand() * 0.000012,
      })
    }
  }

  function drawRibbon(r, now) {
    const drift = now * r.sp
    const x0 = -W * 0.12
    const x1 = W * 1.12
    const y0 = H * (r.y + Math.sin(drift + r.ph) * r.amp)
    const y1 = H * (r.y + Math.cos(drift * 0.82 + r.ph) * r.amp * 1.25)
    const c1 = H * (r.y + Math.sin(drift * 0.64 + r.ph) * r.amp * 2.1)
    const c2 = H * (r.y + Math.cos(drift * 0.57 + r.ph * 1.4) * r.amp * 2.4)
    const rgb = r.warm ? palette.warm : palette.cool
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, 'rgba(' + rgb + ',0)')
    grad.addColorStop(0.22, 'rgba(' + rgb + ',' + (config.theme === 'dark' ? 0.055 : 0.045) + ')')
    grad.addColorStop(0.5, 'rgba(' + rgb + ',' + (config.theme === 'dark' ? 0.14 : 0.085) + ')')
    grad.addColorStop(0.78, 'rgba(' + rgb + ',' + (config.theme === 'dark' ? 0.05 : 0.04) + ')')
    grad.addColorStop(1, 'rgba(' + rgb + ',0)')
    ctx.strokeStyle = grad
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.bezierCurveTo(W * 0.28, c1, W * 0.7, c2, x1, y1)
    ctx.lineWidth = r.wide
    ctx.globalAlpha = 0.16
    ctx.stroke()
    ctx.lineWidth = 0.75
    ctx.globalAlpha = 0.72
    ctx.stroke()

    /* 光带上的读取头：沿同一条贝塞尔曲线移动的小光点 */
    const u = (((now * 0.000034 + r.ph / (Math.PI * 2)) % 1) + 1) % 1
    const v = 1 - u
    const px = v * v * v * x0 + 3 * v * v * u * (W * 0.28) + 3 * v * u * u * (W * 0.7) + u * u * u * x1
    const py = v * v * v * y0 + 3 * v * v * u * c1 + 3 * v * u * u * c2 + u * u * u * y1
    const cdx = (px / W - 0.5) * 2
    const cdy = (py / H - 0.45) * 2
    const cometFade = Math.min(1, Math.max(0.16, Math.sqrt(cdx * cdx + cdy * cdy) * 1.4))
    ctx.beginPath()
    ctx.fillStyle = 'rgba(' + rgb + ',' + (0.11 * cometFade).toFixed(3) + ')'
    ctx.arc(px, py, r.wide * 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = 'rgba(' + rgb + ',' + (0.72 * cometFade).toFixed(3) + ')'
    ctx.arc(px, py, r.warm ? 1.25 : 1.05, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  function draw(now, still) {
    ctx.clearRect(0, 0, W, H)
    ctx.globalCompositeOperation = config.theme === 'dark' ? 'lighter' : 'source-over'

    /* 一条极慢的垂直光带，像扫描仪走过整张底板 */
    const sx = ((now * 0.012) % (W + 260)) - 130
    const sweep = ctx.createLinearGradient(sx - 150, 0, sx + 150, 0)
    sweep.addColorStop(0, 'rgba(' + palette.cool + ',0)')
    sweep.addColorStop(
      0.5,
      'rgba(' + palette.cool + ',' + (config.theme === 'dark' ? 0.028 : 0.018) + ')'
    )
    sweep.addColorStop(1, 'rgba(' + palette.cool + ',0)')
    ctx.fillStyle = sweep
    ctx.fillRect(sx - 150, 0, 300, H)

    for (let r = 0; r < ribbons.length; r++) drawRibbon(ribbons[r], now)

    /* 底部三条低频水线 */
    for (let w = 0; w < 3; w++) {
      ctx.beginPath()
      for (let x = 0; x <= W; x += 26) {
        const wy =
          H * (0.745 + w * 0.052) +
          Math.sin(x * 0.0062 + now * 0.00022 + w * 1.7) * (3 + w * 1.4) +
          Math.sin(x * 0.013 - now * 0.00014 + w) * 1.6
        if (x === 0) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.strokeStyle =
        'rgba(' +
        (w === 1 ? palette.warm : palette.cool) +
        ',' +
        (config.theme === 'dark' ? 0.05 : 0.032) +
        ')'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    /* 边缘数据雨：只在左右留白里 */
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c]
      const cy = ((col.y + now * col.sp) % 1.2) * H - col.len
      ctx.fillStyle =
        'rgba(' + palette.dim + ',' + (config.theme === 'dark' ? 0.035 : 0.022) + ')'
      ctx.fillRect(Math.round(col.x * W), cy, 1, col.len)
    }

    /* 星尘：中心 30% 半径内降亮到 18% */
    for (let m = 0; m < motes.length; m++) {
      const dot = motes[m]
      let mx = dot.x + Math.sin(now * dot.sp + dot.ph) * dot.ax
      let my = dot.y + Math.cos(now * dot.sp * 0.83 + dot.ph) * dot.ay
      if (still) {
        mx = dot.x
        my = dot.y
      }
      const nx = (mx / W - 0.5) * 2
      const ny = (my / H - 0.45) * 2
      const dist = Math.sqrt(nx * nx * 1.18 + ny * ny)
      const centerFade = Math.min(1, Math.max(0.18, dist * 1.32))
      const twinkle = 0.62 + 0.38 * Math.sin(now * dot.tw + dot.ph)
      const alpha = (0.045 + dot.z * 0.16) * centerFade * twinkle
      const rgbDot = dot.warm ? palette.warm : palette.cool
      ctx.beginPath()
      ctx.fillStyle = 'rgba(' + rgbDot + ',' + alpha.toFixed(3) + ')'
      ctx.arc(mx, my, dot.r * dot.z, 0, Math.PI * 2)
      ctx.fill()
      if (dot.r > 1.15) {
        ctx.beginPath()
        ctx.fillStyle = 'rgba(' + rgbDot + ',' + (alpha * 0.12).toFixed(3) + ')'
        ctx.arc(mx, my, dot.r * 4.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  const handle = {
    frames: 0,
    width() {
      return W
    },
    height() {
      return H
    },
    draw(ms, still) {
      draw(ms || 0, !!still)
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
    draw(fieldNow(), false)
    frames++
    handle.frames = frames
    raf = window.requestAnimationFrame(frame)
  }

  function onResize() {
    resize()
    draw(fieldNow(), true)
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
  draw(0, true)
  if (!reduced) raf = window.requestAnimationFrame(frame)
  return handle
}
