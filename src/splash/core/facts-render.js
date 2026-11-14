import { factText } from './config.js'
import { el } from './dom.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** REV 行：真实信息还没到时保留原来的占位。 */
export function paintMeta(ui, facts) {
  if (!ui || !ui.meta1) return
  if (!facts.version && !facts.profile) {
    ui.meta1.textContent = 'REV 0.1.0 · WEB PROFILE'
    return
  }
  ui.meta1.textContent = 'REV ' + factText(facts.version) + ' · ' + factText(facts.profile) + ' PROFILE'
}

/** 左侧两行读数。 */
export function paintFacts(ui, facts) {
  if (!ui || !ui.fact1 || !ui.fact2) return
  ui.fact1.textContent = ''
  ui.fact1.appendChild(el('span', null, '· MODEL : '))
  ui.fact1.appendChild(el('b', null, factText(facts.model)))
  ui.fact2.textContent = ''
  ui.fact2.appendChild(el('span', null, '· SANDBOX : '))
  ui.fact2.appendChild(el('b', null, factText(facts.sandbox)))
  ui.fact2.appendChild(el('span', null, ' · BUNDLES : '))
  ui.fact2.appendChild(el('b', null, factText(facts.bundleCount)))
}

/** 右侧自检清单。 */
export function buildChecks(ui, facts) {
  if (!ui || !ui.checks) return
  ui.checks.textContent = ''
  const head = el('div', 'dsu-checks-h', 'SELF-CHECK / ')
  head.appendChild(el('span', 'dsu-live', 'LIVE'))
  ui.checks.appendChild(head)
  const rows = [
    ['PROFILE', facts.profile],
    ['BUNDLES', facts.bundleCount],
    ['MODEL', facts.model],
    ['SANDBOX', facts.sandbox],
    ['SESSIONS', facts.sessions],
    ['ARCHIVED', facts.sessionsArchived],
  ]
  for (let i = 0; i < rows.length; i++) {
    const row = el('div', 'dsu-check')
    row.appendChild(el('span', 'dsu-check-k', rows[i][0]))
    row.appendChild(el('span', 'dsu-check-v', factText(rows[i][1])))
    row.appendChild(el('i'))
    ui.checks.appendChild(row)
  }
}

export function setChecks(ui, active) {
  if (!ui || !ui.checks) return
  const items = ui.checks.children || []
  let n = 0
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!it.classList || !it.classList.contains('dsu-check')) continue
    n++
    it.classList.toggle('dsu-on', n === active)
    it.classList.toggle('dsu-past', n < active)
  }
}

export function stopTrace(ui) {
  if (ui && ui.traceTimer) {
    clearInterval(ui.traceTimer)
    ui.traceTimer = null
  }
}

/** 底部波形：基线 + 刻度 + 随时间漂移的折线 + 游标。 */
export function buildTrace(ui, facts) {
  if (!ui || !ui.trace) return
  stopTrace(ui)
  ui.trace.textContent = ''
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 520 46')
  const base = document.createElementNS(SVG_NS, 'line')
  base.setAttribute('x1', '0')
  base.setAttribute('y1', '23')
  base.setAttribute('x2', '520')
  base.setAttribute('y2', '23')
  base.setAttribute('class', 'dsu-trace-base')
  svg.appendChild(base)
  for (let i = 0; i <= 20; i++) {
    const tick = document.createElementNS(SVG_NS, 'line')
    const tx = i * 26
    tick.setAttribute('x1', String(tx))
    tick.setAttribute('y1', '19')
    tick.setAttribute('x2', String(tx))
    tick.setAttribute('y2', '27')
    tick.setAttribute('class', 'dsu-trace-tick')
    svg.appendChild(tick)
  }

  const seed = String(facts.hash || 'DSHBOOT')
  let h = 2166136261
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k)
    h = Math.imul(h, 16777619) >>> 0
  }
  const phase = (h % 628) / 100
  function tracePathAt(now) {
    const drift = now * 0.00034
    let d = 'M0 23'
    for (let x = 0; x <= 520; x += 8) {
      const env = Math.sin((x / 520) * Math.PI)
      const amp =
        (Math.sin(x * 0.035 + phase + drift) * 5 +
          Math.sin(x * 0.011 + phase * 1.7 - drift * 0.62) * 3) *
        env
      d += ' L' + x + ' ' + (23 + amp).toFixed(1)
    }
    return d
  }
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', tracePathAt(0))
  path.setAttribute('class', 'dsu-trace-line')
  svg.appendChild(path)
  const cursor = document.createElementNS(SVG_NS, 'line')
  cursor.setAttribute('x1', '0')
  cursor.setAttribute('y1', '2')
  cursor.setAttribute('x2', '0')
  cursor.setAttribute('y2', '44')
  cursor.setAttribute('class', 'dsu-trace-cursor')
  svg.appendChild(cursor)
  ui.trace.appendChild(svg)
  ui.tracePath = path
  ui.traceTimer = setInterval(function () {
    path.setAttribute('d', tracePathAt(Date.now()))
  }, 90)
}

/** 一次刷新所有真实信息区域。 */
export function renderFacts(ui, facts) {
  paintMeta(ui, facts)
  paintFacts(ui, facts)
  buildChecks(ui, facts)
  buildTrace(ui, facts)
}
