import { clamp01 } from '../core/clamp.js'
import { isAmbientOn } from '../core/config.js'
import { hexToRgba } from '../core/color.js'
import { ROOT_ID } from '../core/constants.js'
import { el } from '../core/dom.js'
import { createWhaleSvg } from '../core/whale.js'
import { STEPS } from '../data/steps.js'

/**
 * 启动界面骨架：根节点、玻璃参数、版心结构、鲸鱼标识与准星。
 * 数据面板与时钟由入口在骨架建好后填充。
 *
 * @param {{ config: Record<string, any>, facts: Record<string, any>, ui: Record<string, any> }} options
 */
export function createStage(options) {
  const C = options.config
  const facts = options.facts || {}
  const ui = options.ui

  /* ── DOM 搭建 ─────────────────────────────────────────────────────────── */
  var root = document.getElementById(ROOT_ID)
  if (!root) {
    root = el('div')
    root.id = ROOT_ID
    root.className = 'dsu-root'
    document.body.appendChild(root)
  }
  root.classList.toggle('dsu-dark', C.theme === 'dark')
  var backdropOn = false
  root.style.setProperty('--dsu-speed', String(C.speed))
  root.style.setProperty('--dsu-accent', C.accent)
  root.style.setProperty('--dsu-glitch-a', C.glitchA)
  root.style.setProperty('--dsu-glitch-b', C.glitchB)
  try { root.style.setProperty('--dsu-accent-glow', hexToRgba(C.accent, 0.42)) } catch (e) { /* noop */ }
  try { root.style.setProperty('--dsu-accent-soft', hexToRgba(C.accent, 0.10)) } catch (e) { /* noop */ }
  try { root.style.setProperty('--dsu-accent-strong', hexToRgba(C.accent, 0.72)) } catch (e) { /* noop */ }

  /* 液态玻璃：只让「背景层」（底板 / 黑幕）半透明 + 磨砂，
     文字、线条、鲸鱼标识、读数这些主体素材保持实心 —— 所以稿面还在，只是透出了背后的界面。 */
  var blurredNodes = []
  /** 兜底：backdrop-filter 不可用时，直接模糊应用本体（除自己的根节点）。 */
  function blurAppBackdrop(px) {
    try {
      if (!document.body || !document.body.children) return
      for (var i = 0; i < document.body.children.length; i++) {
        var node = document.body.children[i]
        if (!node || !node.style || node.id === ROOT_ID) continue
        blurredNodes.push({ node: node, filter: node.style.filter || '' })
        node.style.transition = 'filter 420ms ease'
        node.style.filter = px > 0 ? 'blur(' + px + 'px)' : ''
      }
    } catch (e) { /* 兜底不抛 */ }
  }
  function restoreAppBackdrop() {
    for (var i = 0; i < blurredNodes.length; i++) {
      var it = blurredNodes[i]
      try {
        it.node.style.filter = it.filter
        it.node.style.transition = ''
      } catch (e) { /* noop */ }
    }
    blurredNodes.length = 0
  }

  if (C.glass) {
    var gAlpha = clamp01(C.glassOpacity, 0.15, 0.95)
    var gBlur = clamp01(C.glassBlur, 0, 60)
    var gSat = clamp01(C.glassSaturate, 100, 200)
    root.classList.add('dsu-glass')
    root.style.setProperty('--dsu-glass-alpha', String(gAlpha))
    root.style.setProperty('--dsu-glass-blur', gBlur + 'px')
    root.style.setProperty('--dsu-glass-sat', gSat + '%')
    /* 这里刻意不置 transparent：DSH 0.2.1 起启动期 body 被强制白底，
       一上来透明就会在首帧露出白色，看起来就是「闪一下」。
       等底板铺满（下方 plate opacity=1 之后）再放开。 */
    /* 背景模糊：独立一层，专门糊「玻璃背后的东西」，和玻璃自身的磨砂是两个参数 */
    backdropOn = true
    var backdropBlur = clamp01(C.glassBackdropBlur, 0, 80)
    root.style.setProperty('--dsu-backdrop-blur', backdropBlur + 'px')
    /* 直接模糊应用本体：backdrop-filter 在跨层级/跨堆叠上下文时会被静默忽略
       （实测表现是「底板透明了但背后不糊」），所以背景模糊不再依赖它 ——
       给 body 里除自己以外的根节点加 filter，效果确定、可在 finish/dispose 还原。 */
    /* 上限 60：再高就只剩一片纯色，看不出「背景变糊」而像「背景没了」 */
    if (backdropBlur > 0) {
      /* 应用本体已经糊过：通知 CSS 关掉底板/黑幕的冗余 backdrop-filter */
      root.classList.add('dsu-glass-appblur')
      blurAppBackdrop(Math.min(60, backdropBlur))
    } else {
      root.classList.remove('dsu-glass-appblur')
    }
  } else {
    root.classList.remove('dsu-glass')
  }

  /* ambient 关闭时连节点都不建，省掉一整层合成与 Canvas */
  var ambientHtml = isAmbientOn(C)
    ? '<div class="dsu-atmo"></div>' +
      '<canvas class="dsu-field" aria-hidden="true"></canvas>' +
      '<div class="dsu-beams"></div>' +
      '<div class="dsu-floor"></div>' +
      '<div class="dsu-sheen"></div>'
    : ''
  var ambientTail = isAmbientOn(C) ? '<div class="dsu-tear"></div>' : ''
  var html = ambientHtml +
    '<div class="dsu-plate"></div>' +
    '<div class="dsu-vignette"></div>' +
    '<div class="dsu-watermark"></div>' +
    '<div class="dsu-grain"></div>' +
    '<div class="dsu-black">' +
      '<div class="dsu-black-inner"></div>' +
      '<div class="dsu-sweep"></div>' +
    '</div>' +
    '<div class="dsu-wash"></div>' +
    '<header class="dsu-brand">' +
      '<div class="dsu-brand-1"></div><div class="dsu-brand-2"></div>' +
      '<div class="dsu-brand-3"><b></b><span></span></div>' +
    '</header>' +
    '<div class="dsu-stepcount">[ 00 / 06 ] INIT</div>' +
    '<div class="dsu-center">' +
      '<div class="dsu-status"><span class="dsu-status-zh"></span><i class="dsu-caret"></i></div>' +
      '<div class="dsu-sub-en"></div>' +
      '<div class="dsu-rule"></div>' +
      '<div class="dsu-logo"></div>' +
      '<div class="dsu-dots" hidden></div>' +
    '</div>' +
    '<div class="dsu-idline"></div>' +
    '<div class="dsu-facts dsu-facts-1"></div>' +
    '<div class="dsu-facts dsu-facts-2"></div>' +
    '<div class="dsu-reticle"></div>' +
    '<div class="dsu-hex"></div>' +
    '<div class="dsu-trace"></div>' +
    '<div class="dsu-welcome">' +
      '<div class="dsu-w1">WELCOME TO</div>' +
      '<div class="dsu-w2"></div>' +
      '<div class="dsu-w3"></div>' +
      '<div class="dsu-w4"></div>' +
    '</div>' +
    '<div class="dsu-action">' +
      '<div class="dsu-card" hidden></div>' +
      '<button class="dsu-btn" type="button">' +
        '<span class="dsu-btn-zh"></span><span class="dsu-btn-en"></span>' +
      '</button>' +
      '<div class="dsu-hint"></div>' +
    '</div>' +
    '<div class="dsu-frame">' +
      '<i class="dsu-corner dsu-c-tl"></i><i class="dsu-corner dsu-c-tr"></i>' +
      '<i class="dsu-corner dsu-c-bl"></i><i class="dsu-corner dsu-c-br"></i>' +
      '<div class="dsu-scanline"></div>' +
    '</div>' +
    '<div class="dsu-slats"></div>' +
    '<div class="dsu-voice"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="dsu-meta"><span class="dsu-meta-1"></span><span class="dsu-meta-2"></span></div>' +
    '<div class="dsu-checks"></div>' +
    '<div class="dsu-skip">SKIP ▸</div>' +
    '<footer class="dsu-foot"><span></span><i></i></footer>' +
    '<div class="dsu-subtitle">' +
      '<span class="dsu-sub-zh"></span><span class="dsu-sub-en2"></span>' +
    '</div>' +
    '<div class="dsu-progress"><i></i></div>' +
    '<div class="dsu-bloom"></div>' +
    '<div class="dsu-streak"></div>' +
    '<div class="dsu-flash"></div>' +
    ambientTail

  root.innerHTML = html

  /* 背景层：只在液态玻璃开启时插入，专门做「背景模糊」——
     它自己透明、只带 backdrop-filter，所以和底板/黑幕的磨砂互不影响。 */
  if (backdropOn) {
    var backdropEl = el('div', 'dsu-backdrop')
    root.insertBefore(backdropEl, root.firstChild)
  }

  function q(sel) { return root.querySelector(sel) }
  ui.plate = q('.dsu-plate')
  if (isAmbientOn(C)) {
    ui.atmo = q('.dsu-atmo')
    ui.field = q('.dsu-field')
    ui.beams = q('.dsu-beams')
    ui.floor = q('.dsu-floor')
    ui.sheen = q('.dsu-sheen')
    ui.tear = q('.dsu-tear')
  }
  ui.watermark = q('.dsu-watermark')
  ui.black = q('.dsu-black')
  ui.blackInner = q('.dsu-black-inner')
  ui.sweep = q('.dsu-sweep')
  ui.wash = q('.dsu-wash')
  ui.flash = q('.dsu-flash')
  ui.bloom = q('.dsu-bloom')
  ui.streak = q('.dsu-streak')
  ui.vignette = q('.dsu-vignette')
  ui.brand = q('.dsu-brand')
  ui.center = q('.dsu-center')
  ui.brand1 = q('.dsu-brand-1')
  ui.brand2 = q('.dsu-brand-2')
  ui.brand3b = q('.dsu-brand-3 b')
  ui.brand3s = q('.dsu-brand-3 span')
  ui.stepcount = q('.dsu-stepcount')
  ui.status = q('.dsu-status')
  ui.statusZh = q('.dsu-status-zh')
  ui.caret = q('.dsu-caret')
  ui.subEn = q('.dsu-sub-en')
  ui.rule = q('.dsu-rule')
  ui.logo = q('.dsu-logo')
  ui.dots = q('.dsu-dots')
  ui.idline = q('.dsu-idline')
  ui.reticle = q('.dsu-reticle')
  ui.hex = q('.dsu-hex')
  ui.welcome = q('.dsu-welcome')
  ui.w1 = q('.dsu-w1')
  ui.w2 = q('.dsu-w2')
  ui.w3 = q('.dsu-w3')
  ui.w4 = q('.dsu-w4')
  ui.action = q('.dsu-action')
  ui.card = q('.dsu-card')
  ui.btn = q('.dsu-btn')
  ui.btnZh = q('.dsu-btn-zh')
  ui.btnEn = q('.dsu-btn-en')
  ui.hint = q('.dsu-hint')
  ui.skip = q('.dsu-skip')
  ui.foot = q('.dsu-foot')
  ui.footText = q('.dsu-foot span')
  ui.subZh = q('.dsu-sub-zh')
  ui.subEn2 = q('.dsu-sub-en2')
  ui.progress = q('.dsu-progress')
  ui.bar = q('.dsu-progress i')
  ui.frame = q('.dsu-frame')
  ui.scanline = q('.dsu-scanline')
  ui.slats = q('.dsu-slats')
  ui.voice = q('.dsu-voice')
  ui.meta = q('.dsu-meta')
  ui.meta1 = q('.dsu-meta-1')
  ui.meta2 = q('.dsu-meta-2')
  ui.fact1 = q('.dsu-facts-1')
  ui.fact2 = q('.dsu-facts-2')
  ui.checks = q('.dsu-checks')
  ui.trace = q('.dsu-trace')

  /* 内容填充 */
  ui.brand1.textContent = C.brand1
  ui.brand2.textContent = C.brand2
  ui.brand3b.textContent = C.brand3a
  ui.brand3s.textContent = C.brand3b
  ui.footText.textContent = C.footer
  ui.w2.textContent = C.welcomeBox
  ui.w4.textContent = '欢迎 ' + C.identity + ' 访问'
  ui.idline.textContent = '· ID CONFIRMED : ' + C.identityId

  ;(function blackStage() {
    var inner = ui.blackInner
    var whale = createWhaleSvg('dsu-whale')
    inner.appendChild(whale)
    inner.appendChild(el('div', 'dsu-black-zh', C.orgZh))
    var en = el('div', 'dsu-black-en', C.orgEn)
    inner.appendChild(en)
    inner.appendChild(el('div', 'dsu-black-sub', C.orgSub))
    ui.blackEn = en
  })()

  ;(function logoStage() {
    ui.logo.appendChild(createWhaleSvg())
    ui.logo.appendChild(el('div', 'dsu-logolabel', 'D E E P S E E K'))
  })()

  ;(function welcomeLogo() {
    ui.w3.appendChild(createWhaleSvg())
    ui.w3.appendChild(el('span', 'dsu-w3label', 'D E E P S E E K  ·  H A R N E S S'))
  })()

  ;(function watermark() {
    var boxes = [
      [0.60, 0.02, 0.16, 0.96], [0.78, 0.02, 0.16, 0.96], [0.96, 0.02, 0.16, 0.96],
      [0.05, 0.02, 0.10, 0.5]
    ]
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]
      var depth = i < 1 ? ' dsu-wm-far' : i < 3 ? ' dsu-wm-mid' : ' dsu-wm-near'
      var n = el('div', 'dsu-wm' + depth)
      n.style.left = (b[0] * 100) + '%'
      n.style.top = (b[1] * 100) + '%'
      n.style.width = (b[2] * 100) + '%'
      n.style.height = (b[3] * 100) + '%'
      ui.watermark.appendChild(n)
    }
  })()

  /* 左侧六格阶段柱 + 品牌块下方的小字数据行 + 实时时钟 */
  ;(function slatsAndMeta() {
    for (var i = 0; i < STEPS.length + 1; i++) ui.slats.appendChild(el('i', 'dsu-slat'))
  })()

  ;(function reticle() {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 400 400')
    function arc(cx, cy, r, a0, a1, cls, cap) {
      var rad = function (d) { return (d - 90) * Math.PI / 180 }
      var x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0))
      var x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1))
      var large = (a1 - a0) > 180 ? 1 : 0
      var p = document.createElementNS(ns, 'path')
      p.setAttribute('d', 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
        ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2))
      p.setAttribute('class', cls)
      if (cap) p.setAttribute('stroke-linecap', cap)
      return { node: p, x: x1, y: y1, x0: x0, y0: y0 }
    }
    var gA = document.createElementNS(ns, 'g')
    gA.setAttribute('class', 'dsu-ret-rot-a')
    /* 300° 弧，缺口留在正下方 6 点钟方向：底部字幕永远不会被压到，
       弧末端圆点落在 5 点钟位置，和原片一致。 */
    var a = arc(200, 200, 150, 215, 505, 'dsu-ring-a', 'round')
    gA.appendChild(a.node)
    var da = document.createElementNS(ns, 'circle')
    da.setAttribute('class', 'dsu-dot-a')
    da.setAttribute('cx', a.x.toFixed(2)); da.setAttribute('cy', a.y.toFixed(2)); da.setAttribute('r', '7')
    gA.appendChild(da)
    svg.appendChild(gA)

    var gB = document.createElementNS(ns, 'g')
    gB.setAttribute('class', 'dsu-ret-rot-b')
    var b = arc(200, 200, 104, 200, 490, 'dsu-ring-b', 'round')
    gB.appendChild(b.node)
    var db = document.createElementNS(ns, 'circle')
    db.setAttribute('class', 'dsu-dot-b')
    db.setAttribute('cx', b.x0.toFixed(2)); db.setAttribute('cy', b.y0.toFixed(2)); db.setAttribute('r', '4')
    gB.appendChild(db)
    svg.appendChild(gB)

    var gC = document.createElementNS(ns, 'g')
    var bl = arc(200, 200, 62, 118, 242, 'dsu-bracket', 'round')
    var br = arc(200, 200, 62, 298, 62, 'dsu-bracket', 'round')
    gC.appendChild(bl.node); gC.appendChild(br.node)
    svg.appendChild(gC)

    var pts = [[152, 132], [252, 268], [278, 150]]
    for (var i = 0; i < pts.length; i++) {
      var c = document.createElementNS(ns, 'circle')
      c.setAttribute('class', 'dsu-dot-o')
      c.setAttribute('cx', pts[i][0]); c.setAttribute('cy', pts[i][1]); c.setAttribute('r', '2.8')
      svg.appendChild(c)
    }

    /* 刻度环：48 格沿环逐格点亮一圈（仪表自检），读完停在暗态 */
    var gT = document.createElementNS(ns, 'g')
    gT.setAttribute('class', 'dsu-ret-ticks')
    var TICKS = 48
    for (var t = 0; t < TICKS; t++) {
      var deg = (t / TICKS) * 360 - 90
      var rad = deg * Math.PI / 180
      var long = t % 4 === 0
      var r0 = 133
      var r1 = long ? 143 : 138
      var line = document.createElementNS(ns, 'line')
      line.setAttribute('class', 'dsu-tick' + (long ? ' dsu-tick-major' : ''))
      line.setAttribute('x1', (200 + r0 * Math.cos(rad)).toFixed(2))
      line.setAttribute('y1', (200 + r0 * Math.sin(rad)).toFixed(2))
      line.setAttribute('x2', (200 + r1 * Math.cos(rad)).toFixed(2))
      line.setAttribute('y2', (200 + r1 * Math.sin(rad)).toFixed(2))
      line.style.animationDelay = Math.round(t * 32) + 'ms'
      gT.appendChild(line)
    }
    svg.appendChild(gT)

    /* 数据环：按插件数量点亮对应格数（取不到就 12 格） */
    var gD = document.createElementNS(ns, 'g')
    gD.setAttribute('class', 'dsu-ret-data')
    var DATA_TICKS = 40
    var lit = Math.max(6, Math.min(DATA_TICKS, Number(facts.bundleCount) || 12))
    for (var d = 0; d < DATA_TICKS; d++) {
      var degD = (d / DATA_TICKS) * 360 - 90
      var radD = degD * Math.PI / 180
      var rD0 = 112
      var rD1 = d < lit ? 120 : 116
      var lineD = document.createElementNS(ns, 'line')
      lineD.setAttribute('class', 'dsu-tick-data' + (d < lit ? ' dsu-lit' : ''))
      lineD.setAttribute('x1', (200 + rD0 * Math.cos(radD)).toFixed(2))
      lineD.setAttribute('y1', (200 + rD0 * Math.sin(radD)).toFixed(2))
      lineD.setAttribute('x2', (200 + rD1 * Math.cos(radD)).toFixed(2))
      lineD.setAttribute('y2', (200 + rD1 * Math.sin(radD)).toFixed(2))
      lineD.style.animationDelay = Math.round(d * 26) + 'ms'
      gD.appendChild(lineD)
    }
    svg.appendChild(gD)

    /* 彗星弧：8% 周长的一段弧，绕环匀速扫过 */
    var comet = document.createElementNS(ns, 'circle')
    comet.setAttribute('class', 'dsu-ret-comet')
    comet.setAttribute('cx', '200')
    comet.setAttribute('cy', '200')
    comet.setAttribute('r', '150')
    comet.setAttribute('pathLength', '100')
    comet.setAttribute('stroke-dasharray', '8 92')
    svg.appendChild(comet)

    /* 锁定冲击波：只在外环外扩，不穿过中央文字 */
    var ping = document.createElementNS(ns, 'circle')
    ping.setAttribute('class', 'dsu-ping')
    ping.setAttribute('cx', '200')
    ping.setAttribute('cy', '200')
    ping.setAttribute('r', '150')
    svg.appendChild(ping)

    ui.reticle.appendChild(svg)

    /* 雷达扫描扇区：conic 渐变 + 环形遮罩，只在中环那一圈扫 */
    ui.reticleScan = el('div', 'dsu-ret-scan')
    ui.reticle.appendChild(ui.reticleScan)
  })()

  return { root: root, restoreAppBackdrop: restoreAppBackdrop }
}
