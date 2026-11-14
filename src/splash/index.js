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
import { createStage } from './dom/stage.js'
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
  var ui = {}
  var clockTimer = null
  var fieldHandle = null
  function paintClock() {
    var d = new Date()
    var pad = function (n) { return (n < 10 ? '0' : '') + n }
    ui.meta2.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }
  function stopClock() {
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
  }

  var stage = createStage({ config: C, facts: FACTS, ui: ui })
  var root = stage.root
  var restoreAppBackdrop = stage.restoreAppBackdrop
  function q(sel) { return root.querySelector(sel) }
  paintMeta()
  paintFacts()
  buildChecks()
  buildTrace()
  paintClock()
  clockTimer = setInterval(paintClock, 1000)

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
