/* ============================================================================
 * dsh-startup-screen — 启动动画（浏览器侧，零依赖）
 * ----------------------------------------------------------------------------
 * 由宿主注入页面，在应用挂载之前接管首屏：
 *   黑幕 → 过曝洗白 → 暖白底板 → 五步授权 → 故障揭幕。
 * 每一步是中文大字 + 英文等宽字幕 + 底部日志；前两步等待用户确认，可以跳过。
 *
 * 配置来自 window.__DSH_STARTUP__，也可以用 window.__DSH_STARTUP_API__.replay() 重播。
 * ========================================================================== */
import { localDayKey } from '../shared/day.js'
import { ROUTES } from '../shared/routes.js'
import { factText, isAmbientOn, normalizeStartupConfig } from './core/config.js'
import { ROOT_ID, STALL_MS } from './core/constants.js'
import { clamp01 } from './core/clamp.js'
import { hexToRgba } from './core/color.js'
import { createSfx } from './audio/sfx.js'
import { createVoice } from './audio/voice.js'
import { createField } from './canvas/field.js'
import { createDecoder } from './core/decode.js'
import { el, setIn } from './core/dom.js'
import { createWhaleSvg } from './core/whale.js'
import { STEPS } from './data/steps.js'
import { createChromeSync } from './dom/chrome-sync.js'
import { createTimeline } from './timeline/timeline.js'

/* 顶层守卫收进 boot()：构建时外面再套一层立即执行，同一份脚本重复加载也只跑一遍。 */
function boot() {
  'use strict'

  if (window.__DSH_STARTUP_LOADED__) return
  window.__DSH_STARTUP_LOADED__ = true

  var C = normalizeStartupConfig(window.__DSH_STARTUP__)

  /* 系统"减少动态效果"：解码动画与后续光场都按静态处理 */
  var REDUCED = (function () {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    } catch (e) { return false }
  })()

  /* 真实信息由宿主注入；没有时全部走回退值，不影响动画 */
  var FACTS = (C.facts && typeof C.facts === 'object') ? C.facts : {}
  function ambientOn() { return isAmbientOn(C) }

  function paintMeta() {
    if (!ui || !ui.meta1) return
    if (!FACTS.version && !FACTS.profile) {
      /* 真实信息还没到：保留原来的占位，不要让这一行变空 */
      ui.meta1.textContent = 'REV 0.1.0 · WEB PROFILE'
      return
    }
    ui.meta1.textContent = 'REV ' + factText(FACTS.version) + ' · ' + factText(FACTS.profile) + ' PROFILE'
  }

  function paintFacts() {
    if (!ui || !ui.fact1 || !ui.fact2) return
    ui.fact1.textContent = ''
    ui.fact1.appendChild(el('span', null, '· MODEL : '))
    ui.fact1.appendChild(el('b', null, factText(FACTS.model)))
    ui.fact2.textContent = ''
    ui.fact2.appendChild(el('span', null, '· SANDBOX : '))
    ui.fact2.appendChild(el('b', null, factText(FACTS.sandbox)))
    ui.fact2.appendChild(el('span', null, ' · BUNDLES : '))
    ui.fact2.appendChild(el('b', null, factText(FACTS.bundleCount)))
  }

  function buildChecks() {
    if (!ui || !ui.checks) return
    ui.checks.textContent = ''
    var head = el('div', 'dsu-checks-h', 'SELF-CHECK / ')
    head.appendChild(el('span', 'dsu-live', 'LIVE'))
    ui.checks.appendChild(head)
    var rows = [
      ['PROFILE', FACTS.profile],
      ['BUNDLES', FACTS.bundleCount],
      ['MODEL', FACTS.model],
      ['SANDBOX', FACTS.sandbox],
      ['SESSIONS', FACTS.sessions],
      ['ARCHIVED', FACTS.sessionsArchived]
    ]
    for (var i = 0; i < rows.length; i++) {
      var row = el('div', 'dsu-check')
      row.appendChild(el('span', 'dsu-check-k', rows[i][0]))
      row.appendChild(el('span', 'dsu-check-v', factText(rows[i][1])))
      row.appendChild(el('i'))
      ui.checks.appendChild(row)
    }
  }

  function setChecks(active) {
    if (!ui || !ui.checks) return
    var items = ui.checks.children || []
    var n = 0
    for (var i = 0; i < items.length; i++) {
      var it = items[i]
      if (!it.classList || !it.classList.contains('dsu-check')) continue
      n++
      it.classList.toggle('dsu-on', n === active)
      it.classList.toggle('dsu-past', n < active)
    }
  }

  function stopTrace() {
    if (ui && ui.traceTimer) {
      clearInterval(ui.traceTimer)
      ui.traceTimer = null
    }
  }

  function buildTrace() {
    if (!ui || !ui.trace) return
    stopTrace()
    ui.trace.textContent = ''
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 520 46')
    var base = document.createElementNS(ns, 'line')
    base.setAttribute('x1', '0'); base.setAttribute('y1', '23')
    base.setAttribute('x2', '520'); base.setAttribute('y2', '23')
    base.setAttribute('class', 'dsu-trace-base')
    svg.appendChild(base)
    for (var i = 0; i <= 20; i++) {
      var tick = document.createElementNS(ns, 'line')
      var tx = i * 26
      tick.setAttribute('x1', String(tx)); tick.setAttribute('y1', '19')
      tick.setAttribute('x2', String(tx)); tick.setAttribute('y2', '27')
      tick.setAttribute('class', 'dsu-trace-tick')
      svg.appendChild(tick)
    }

    var seed = String(FACTS.hash || 'DSHBOOT')
    var h = 2166136261
    for (var k = 0; k < seed.length; k++) {
      h ^= seed.charCodeAt(k)
      h = Math.imul(h, 16777619) >>> 0
    }
    var phase = (h % 628) / 100
    function tracePathAt(now) {
      var drift = now * 0.00034
      var d = 'M0 23'
      for (var x = 0; x <= 520; x += 8) {
        var env = Math.sin((x / 520) * Math.PI)
        var amp = (Math.sin(x * 0.035 + phase + drift) * 5 +
          Math.sin(x * 0.011 + phase * 1.7 - drift * 0.62) * 3) * env
        d += ' L' + x + ' ' + (23 + amp).toFixed(1)
      }
      return d
    }
    var path = document.createElementNS(ns, 'path')
    path.setAttribute('d', tracePathAt(0))
    path.setAttribute('class', 'dsu-trace-line')
    svg.appendChild(path)
    var cursor = document.createElementNS(ns, 'line')
    cursor.setAttribute('x1', '0'); cursor.setAttribute('y1', '2')
    cursor.setAttribute('x2', '0'); cursor.setAttribute('y2', '44')
    cursor.setAttribute('class', 'dsu-trace-cursor')
    svg.appendChild(cursor)
    ui.trace.appendChild(svg)
    ui.tracePath = path
    ui.traceTimer = setInterval(function () {
      path.setAttribute('d', tracePathAt(Date.now()))
    }, 90)
  }

  function applyFacts(f) {
    if (!f || typeof f !== 'object' || f.ready !== true) return
    var prevHash = FACTS.hash
    FACTS = f
    try {
      if (window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === 'object') {
        window.__DSH_STARTUP__.facts = f
      }
    } catch (e) { /* noop */ }
    paintMeta()
    paintFacts()
    buildChecks()
    buildTrace()
    /* 只有指纹变了才重排光场；会话数变化不该让粒子跳一下 */
    if (f.hash && f.hash !== prevHash && ui.field && !ui.field.classList.contains('dsu-in')) {
      try { stopField() } catch (e) { /* noop */ }
      startField()
    }
  }

  function refreshFacts() {
    if (typeof fetch !== 'function') return
    var deadline = Date.now() + 2200
    function tick() {
      try {
        fetch(ROUTES.facts, { headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json() })
          .then(function (j) {
            if (j && j.ok === true && j.facts && j.facts.ready === true) applyFacts(j.facts)
            /* 即使已经 ready 也继续轮询到截止：sessions 可能晚一点才加载出来 */
            if (Date.now() < deadline) setTimeout(tick, 400)
          })
          .catch(function () {
            /* 离线预览 / 首帧还没就绪：短时间内再试几次 */
            if (Date.now() < deadline) setTimeout(tick, 600)
          })
      } catch (e) {
        if (Date.now() < deadline) setTimeout(tick, 600)
      }
    }
    tick()
  }

  /* ── 桌面端标题栏同步（Windows）──────────────────────────────────────────
     桌面版用系统绘制的窗口按钮，底色跟着应用主题走。动画播放时右上角会留下
     一块和主题同色的方块：黑幕时是一条亮带，暖白底板上又显得刺眼。
     做法是把桌面版用来取色的隐藏元素改成完全透明，让它把窗口按钮和底色一起藏起来，
     动画结束再还原。浏览器和 macOS 下这段不执行，任何一步失败都静默跳过。 */
  var chromeSync = createChromeSync()

  /* 排查 / 冒烟测试用的把手：只读开关，不改变插件行为 */
  try { window.__DSH_STARTUP_CHROME__ = chromeSync } catch (e) { /* noop */ }

  /* 轮次编号：重播会重新加载一份脚本，旧脚本的时间线必须立刻失效。 */
  var GEN = (window.__DSH_STARTUP_GEN__ = (window.__DSH_STARTUP_GEN__ || 0) + 1)
  function stale() { return window.__DSH_STARTUP_GEN__ !== GEN }
  function noop() {}

  /* 全局监听器登记表：dispose 时必须全部摘掉。
     重播会新建一份脚本实例，漏摘的监听器会一直持有旧实例的 DOM 与闭包。 */
  var globalListeners = []
  function listen(target, type, fn, opts) {
    if (!target || typeof target.addEventListener !== 'function') return
    try { target.addEventListener(type, fn, opts) } catch (e) { return }
    globalListeners.push(function () {
      try { target.removeEventListener(type, fn, opts) } catch (e) { /* noop */ }
    })
  }
  function dropListeners() {
    for (var i = 0; i < globalListeners.length; i++) {
      try { globalListeners[i]() } catch (e) { /* noop */ }
    }
    globalListeners.length = 0
  }

  /** 拆掉当前实例：停时间线、清定时器、停语音、解滚动锁、摘根节点。重播前必须先调它。 */
  function dispose() {
    try { timeline.dispose() } catch (e) { /* noop */ }
    dropListeners()
    /* 桌面端：旧实例藏起来的标题栏必须还原，否则它的 60 秒 holdTimer 会
       在新一轮动画播到一半时突然把按钮放出来 */
    try { chromeSync.show() } catch (e) { /* noop */ }
    try { restoreAppBackdrop() } catch (e) { /* noop */ }
    stopClock()
    try { voice.stop() } catch (e) { /* noop */ }
    /* 每次重播都是一个新脚本实例，不关旧 AudioContext 会撞浏览器上限 */
    try { audio.close() } catch (e) { /* noop */ }
    try {
      document.documentElement.classList.remove('dsu-lock')
      document.documentElement.style.overflow = ''
      if (document.body) document.body.style.overflow = ''
    } catch (e) { /* noop */ }
    try {
      var r = document.getElementById(ROOT_ID)
      if (r && r.parentNode) r.parentNode.removeChild(r)
    } catch (e) { /* noop */ }
    /* 把"这一轮的状态"也清干净：新实例要重新置位 RUNNING，
       否则它自己的 9 秒兜底会因为 RUNNING 还是 true 而永远不生效 */
    try {
      window.__DSH_STARTUP_RUNNING__ = false
      window.__DSH_STARTUP_FINISHED__ = false
    } catch (e) { /* noop */ }
  }

  /** 重播：先拆掉旧实例，再把运行时脚本重新加载一次。 */
  function injectSelf() {
    var prev = window.__DSH_STARTUP_API__
    if (prev && typeof prev.dispose === 'function' && prev.dispose !== noop) {
      try { prev.dispose() } catch (e) { /* 旧实例拆不干净也不能挡住重播 */ }
    }
    window.__DSH_STARTUP_LOADED__ = false
    var old = document.getElementById(ROOT_ID)
    if (old && old.parentNode) old.parentNode.removeChild(old)
    window.__DSH_STARTUP_SKIP__ = false

    /* 先摘掉之前注入的脚本：同一个地址反复加载会留下多份执行环境，
       有些浏览器还会因为地址已执行过而直接跳过，重播就静默失效了 */
    try {
      var stale = document.querySelectorAll('script[data-dsh-startup-runtime]')
      for (var i = 0; i < stale.length; i++) {
        if (stale[i] && stale[i].parentNode) stale[i].parentNode.removeChild(stale[i])
      }
    } catch (e) { /* noop */ }

    var s = document.createElement('script')
    try { s.setAttribute('data-dsh-startup-runtime', '1') } catch (e) { /* noop */ }
    /* 正式运行时由宿主路由提供（加时间戳绕开缓存）；
       离线预览页会把相对路径写进 __DSH_STARTUP_SCRIPT_URL__，file:// 下不加查询串。 */
    if (window.__DSH_STARTUP_SCRIPT_URL__) {
      s.src = window.__DSH_STARTUP_SCRIPT_URL__
    } else {
      s.src = ROUTES.splash + '?t=' + Date.now()
    }
    document.head.appendChild(s)
    return s
  }

  /* 宿主侧的首屏兜底脚本已经判定"这次不播"（未启用 / 本会话已播 / 今日已播）：
     这里不再建 DOM，但仍然暴露 API，方便设置页按需重播。 */
  if (window.__DSH_STARTUP_SKIP__ === true) {
    window.__DSH_STARTUP_API__ = {
      replay: injectSelf,
      skip: function () {},
      finish: function () {},
      dispose: noop,
      config: C
    }
    return
  }

  /* 最后一道保险：脚本连 run() 都没进去（404 / 语法错 / 被拦）时，9 秒后无条件放行。
     判的是「有没有开始跑」而不是类名 —— `dsu-boot` 在 run() 之前就被摘掉了，
     按类名判等于永不生效（这正是旧实现漏掉的那类卡死）。 */
  setTimeout(function () {
    try {
      if (window.__DSH_STARTUP_RUNNING__ === true) return
      var r = document.getElementById(ROOT_ID)
      if (r && r.parentNode) r.parentNode.removeChild(r)
      document.documentElement.classList.remove('dsu-lock')
      if (document.body) document.body.style.overflow = ''
      window.__DSH_STARTUP_FAILED__ = true
    } catch (e) { /* 兜底本身不许再抛 */ }
  }, 9000)

  /* 逐字写入与解码动画：一次播放共用一个实例 */
  var decoder = createDecoder(REDUCED)
  var typeIn = decoder.typeIn
  var startDecode = decoder.startDecode
  var stopDecode = decoder.stopDecode

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

  var ui = {}
  var clockTimer = null
  function paintClock() {
    var d = new Date()
    var pad = function (n) { return (n < 10 ? '0' : '') + n }
    ui.meta2.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }
  function stopClock() {
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
  }
  var fieldHandle = null
  /* ambient 关闭时连节点都不建，省掉一整层合成与 Canvas */
  var ambientHtml = ambientOn()
    ? '<div class="dsu-atmo"></div>' +
      '<canvas class="dsu-field" aria-hidden="true"></canvas>' +
      '<div class="dsu-beams"></div>' +
      '<div class="dsu-floor"></div>' +
      '<div class="dsu-sheen"></div>'
    : ''
  var ambientTail = ambientOn() ? '<div class="dsu-tear"></div>' : ''
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
  if (ambientOn()) {
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
    paintMeta()
    paintFacts()
    buildChecks()
    buildTrace()
    paintClock()
    clockTimer = setInterval(paintClock, 1000)
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
    var lit = Math.max(6, Math.min(DATA_TICKS, Number(FACTS.bundleCount) || 12))
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

  /* 光场在 DOM 就绪后就开始跑，但 .dsu-field 的 opacity=0，第一幕纯黑时看不见 */
  if (ambientOn()) startField()
  refreshFacts()

  /* ── 活体光场（Canvas）────────────────────────────────────────────────── */
  function stopField() {
    if (!fieldHandle) return
    try { fieldHandle.stop() } catch (e) { /* noop */ }
    fieldHandle = null
    try { window.__DSH_STARTUP_FIELD__ = null } catch (e) { /* noop */ }
  }

  function startField() {
    if (!ambientOn() || fieldHandle) return
    fieldHandle = createField({
      canvas: ui.field,
      root: root,
      config: C,
      facts: FACTS,
      reduced: REDUCED
    })
    if (!fieldHandle) return
    try { window.__DSH_STARTUP_FIELD__ = fieldHandle } catch (e) { /* noop */ }
  }

  /* ── 声音 ──────────────────────────────────────────────────────────────
   * 两条独立通道：audio 是界面音效（现场合成），voice 是女声播报（素材优先）。
   * 浏览器要求先有用户手势才能出声，所以第一次点击或按键时会补一次解锁。 */
  var timeline = null
  var audio = createSfx(C)
  var voice = createVoice({ config: C, sfx: audio, isFinished: function () { return timeline ? timeline.isFinished() : false } })

  /* 语音/音效接线：声卡要等用户手势才能出声，这里挂一次性解锁 */
  voice.attach(q('.dsu-voice'))
  ;(function preloadVoices() {
    if (C.voiceSource === 'tts') return
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].audio) audio.ensureAsset(STEPS[i].audio)
    audio.ensureAsset('line-6')   /* 终幕欢迎语 */
  })()
  ;(function wireSound() {
    voice.load()
    if (voice.supported && typeof window.speechSynthesis.addEventListener === 'function') {
      try { listen(window.speechSynthesis, 'voiceschanged', function () { voice.load() }) } catch (e) {}
    }
    var unlocked = false
    function unlock() {
      if (unlocked) return
      unlocked = true
      voice.unlock()
      document.removeEventListener('pointerdown', unlock, true)
      document.removeEventListener('keydown', unlock, true)
      document.removeEventListener('touchstart', unlock, true)
    }
    listen(document, 'pointerdown', unlock, true)
    listen(document, 'keydown', unlock, true)
    listen(document, 'touchstart', unlock, true)
  })()

  /* ── 时间线 ───────────────────────────────────────────────────────────── */
  timeline = createTimeline({
    config: C,
    ui: ui,
    root: root,
    audio: audio,
    voice: voice,
    chromeSync: chromeSync,
    typeIn: typeIn,
    startDecode: startDecode,
    stopDecode: stopDecode,
    ambientOn: ambientOn,
    stale: stale,
    stopField: stopField,
    stopTrace: stopTrace,
    setChecks: setChecks,
    dropListeners: dropListeners,
    restoreAppBackdrop: restoreAppBackdrop,
    stopClock: stopClock
  })

  if (C.allowSkip && ui.skip) {
    ui.skip.hidden = false
    ui.skip.addEventListener('click', function (e) { e.stopPropagation(); timeline.requestSkip() })
    listen(document, 'keydown', function (e) {
      if (e.key === 'Escape') timeline.requestSkip()
    })
  } else if (ui.skip) {
    ui.skip.hidden = true
  }

  /* 对外 API：settings 面板里的"立即预览"按钮和重播都走它 */
  window.__DSH_STARTUP_API__ = {
    /* 设置页试听与冒烟测试用：直接念一行 */
    speak: function (en, zh) { voice.say(en, zh) },
    speakName: function (n) { return voice.speakName(n) },
    get voice() { return voice.current() },
    replay: injectSelf,
    skip: timeline.requestSkip,
    finish: timeline.finish,
    dispose: dispose,
    config: C
  }

  /* 锁滚动，动画期间不露出下面的应用 */
  document.documentElement.classList.add('dsu-lock')
  document.documentElement.style.overflow = 'hidden'
  if (document.body) document.body.style.overflow = 'hidden'
  timeline.setProgress(0.05)
  root.classList.remove('dsu-boot')

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { timeline.start() })
  } else {
    timeline.start()
  }
}

boot()
