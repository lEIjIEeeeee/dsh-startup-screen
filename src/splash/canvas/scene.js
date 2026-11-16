/**
 * 光场绘制：星尘、贝塞尔流光、边缘数据雨、底部水线。
 *
 * 纯绘制层，不持有 Canvas 生命周期；尺寸与随机数由 field 传入。
 */

function spawn(scene) {
  const { W, H, limit, rand } = scene
  scene.motes.length = 0
  scene.ribbons.length = 0
  scene.columns.length = 0
  const count = Math.round(Math.min(limit, Math.max(74, (W * H) / 13500)))
  for (let i = 0; i < count; i++) {
    scene.motes.push({
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
    scene.ribbons.push({
      y: 0.2 + r * 0.18 + rand() * 0.055,
      amp: 0.028 + rand() * 0.042,
      sp: 0.000022 + rand() * 0.000026,
      ph: rand() * Math.PI * 2,
      wide: 5 + rand() * 8,
      warm: r === 1,
    })
  }
  for (let c = 0; c < 12; c++) {
    scene.columns.push({
      side: c % 2,
      x: c < 6 ? 0.025 + rand() * 0.12 : 0.855 + rand() * 0.12,
      y: rand(),
      len: 24 + rand() * 86,
      sp: 0.000006 + rand() * 0.000012,
    })
  }
}

function drawRibbon(scene, r, now) {
  const { ctx, config, palette, W, H } = scene
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
  const px =
    v * v * v * x0 + 3 * v * v * u * (W * 0.28) + 3 * v * u * u * (W * 0.7) + u * u * u * x1
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

/** 底部三条低频水线 */
function drawWaves(scene, now) {
  const { ctx, config, palette, W, H } = scene
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
}

/** 边缘数据雨：只在左右留白里 */
function drawColumns(scene, now) {
  const { ctx, config, palette, W, H } = scene
  for (let c = 0; c < scene.columns.length; c++) {
    const col = scene.columns[c]
    const cy = ((col.y + now * col.sp) % 1.2) * H - col.len
    ctx.fillStyle = 'rgba(' + palette.dim + ',' + (config.theme === 'dark' ? 0.035 : 0.022) + ')'
    ctx.fillRect(Math.round(col.x * W), cy, 1, col.len)
  }
}

/** 星尘：中心 30% 半径内降亮到 18% */
function drawMotes(scene, now, still) {
  const { ctx, palette, W, H } = scene
  for (let m = 0; m < scene.motes.length; m++) {
    const dot = scene.motes[m]
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
}

function drawScene(scene, now, still) {
  const { ctx, config, palette, W, H } = scene
  ctx.clearRect(0, 0, W, H)
  ctx.globalCompositeOperation = config.theme === 'dark' ? 'lighter' : 'source-over'

  /* 一条极慢的垂直光带，像扫描仪走过整张底板 */
  const sx = ((now * 0.012) % (W + 260)) - 130
  const sweep = ctx.createLinearGradient(sx - 150, 0, sx + 150, 0)
  sweep.addColorStop(0, 'rgba(' + palette.cool + ',0)')
  sweep.addColorStop(
    0.5,
    'rgba(' + palette.cool + ',' + (config.theme === 'dark' ? 0.028 : 0.018) + ')',
  )
  sweep.addColorStop(1, 'rgba(' + palette.cool + ',0)')
  ctx.fillStyle = sweep
  ctx.fillRect(sx - 150, 0, 300, H)

  for (let r = 0; r < scene.ribbons.length; r++) drawRibbon(scene, scene.ribbons[r], now)
  drawWaves(scene, now)
  drawColumns(scene, now)
  drawMotes(scene, now, still)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * @param {{
 *   ctx: any,
 *   config: Record<string, any>,
 *   palette: Record<string, string>,
 *   rand: () => number,
 *   limit?: number,
 * }} options
 */
export function createScene(options) {
  const scene = {
    ctx: options.ctx,
    config: options.config,
    palette: options.palette,
    rand: options.rand,
    limit: options.limit == null ? 150 : options.limit,
    W: 0,
    H: 0,
    motes: [],
    ribbons: [],
    columns: [],
  }
  return {
    setSize(w, h) {
      scene.W = w
      scene.H = h
      spawn(scene)
    },
    draw(now, still) {
      drawScene(scene, now, still)
    },
    width() {
      return scene.W
    },
    height() {
      return scene.H
    },
  }
}
