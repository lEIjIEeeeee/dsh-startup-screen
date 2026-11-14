import { ROUTES } from '../../shared/routes.js'
import { factText } from './config.js'
import { el } from './dom.js'

/**
 * 真实信息面板：REV 行、左侧两行读数、右侧自检清单与底部波形。
 *
 * 数据由宿主注入或异步轮询；本模块只负责渲染与更新，
 * 光场是否要重排由入口在 onApplied 里决定。
 *
 * @param {{
 *   ui: Record<string, any>,
 *   initial?: Record<string, any>,
 *   onApplied?: (facts: Record<string, any>, prevHash: any) => void,
 * }} options
 */
export function createFacts(options) {
  var ui = options.ui
  var onApplied = options.onApplied || function () {}
  var FACTS = options.initial && typeof options.initial === 'object' ? options.initial : {}
  var stopped = false
  var pollTimer = null

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
    if (stopped || !f || typeof f !== 'object' || f.ready !== true) return
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
    onApplied(f, prevHash)
  }

  function refreshFacts() {
    if (stopped || typeof fetch !== 'function') return
    var deadline = Date.now() + 2200
    function schedule(delay) {
      if (stopped) return
      pollTimer = setTimeout(tick, delay)
    }
    function tick() {
      if (stopped) return
      try {
        fetch(ROUTES.facts, { headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json() })
          .then(function (j) {
            if (j && j.ok === true && j.facts && j.facts.ready === true) applyFacts(j.facts)
            /* 即使已经 ready 也继续轮询到截止：sessions 可能晚一点才加载出来 */
            if (Date.now() < deadline) schedule(400)
          })
          .catch(function () {
            /* 离线预览 / 首帧还没就绪：短时间内再试几次 */
            if (Date.now() < deadline) schedule(600)
          })
      } catch (e) {
        if (Date.now() < deadline) schedule(600)
      }
    }
    tick()
  }

  /** 停止轮询与波形定时器；揭幕或重播后不再碰已经要移除的 DOM。 */
  function dispose() {
    stopped = true
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    stopTrace()
  }

  paintMeta()
  paintFacts()
  buildChecks()
  buildTrace()

  return {
    current: function () { return FACTS },
    refresh: refreshFacts,
    setChecks: setChecks,
    stopTrace: stopTrace,
    dispose: dispose
  }
}
