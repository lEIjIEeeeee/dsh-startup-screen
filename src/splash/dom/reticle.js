import { el } from '../core/dom.js'

const NS = 'http://www.w3.org/2000/svg'
const CENTER = 200

function svgEl(tag) {
  return document.createElementNS(NS, tag)
}

/** 画一段以 (200,200) 为圆心的弧；返回终点与起点，供圆点定位。 */
function arc(r, a0, a1, cls, cap) {
  const rad = function (d) {
    return ((d - 90) * Math.PI) / 180
  }
  const x0 = CENTER + r * Math.cos(rad(a0))
  const y0 = CENTER + r * Math.sin(rad(a0))
  const x1 = CENTER + r * Math.cos(rad(a1))
  const y1 = CENTER + r * Math.sin(rad(a1))
  const large = a1 - a0 > 180 ? 1 : 0
  const p = svgEl('path')
  p.setAttribute(
    'd',
    'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
      ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2),
  )
  p.setAttribute('class', cls)
  if (cap) p.setAttribute('stroke-linecap', cap)
  return { node: p, x: x1, y: y1, x0, y0 }
}

function dot(cls, x, y, r) {
  const c = svgEl('circle')
  c.setAttribute('class', cls)
  c.setAttribute('cx', x.toFixed(2))
  c.setAttribute('cy', y.toFixed(2))
  c.setAttribute('r', r)
  return c
}

/** 一圈刻度：48 格自检环 / 40 格数据环共用。 */
function tickRing(options) {
  const g = svgEl('g')
  g.setAttribute('class', options.groupClass)
  for (let i = 0; i < options.count; i++) {
    const deg = (i / options.count) * 360 - 90
    const rad = (deg * Math.PI) / 180
    const long = options.majorEvery ? i % options.majorEvery === 0 : false
    const r0 = options.r0
    const r1 = long ? options.r1Major : options.r1
    const line = svgEl('line')
    line.setAttribute('class', options.itemClass + (long ? ' ' + options.majorClass : ''))
    line.setAttribute('x1', (CENTER + r0 * Math.cos(rad)).toFixed(2))
    line.setAttribute('y1', (CENTER + r0 * Math.sin(rad)).toFixed(2))
    line.setAttribute('x2', (CENTER + r1 * Math.cos(rad)).toFixed(2))
    line.setAttribute('y2', (CENTER + r1 * Math.sin(rad)).toFixed(2))
    line.style.animationDelay = Math.round(i * options.delayStep) + 'ms'
    g.appendChild(line)
  }
  return g
}

/**
 * 准星：两圈旋转弧 + 括号 + 轨道点 + 刻度环 + 数据环 + 彗星与冲击波。
 *
 * @param {any} host 准星容器
 * @param {Record<string, any>} facts
 * @returns {{ scan: any }}
 */
export function createReticle(host, facts) {
  const svg = svgEl('svg')
  svg.setAttribute('viewBox', '0 0 400 400')

  const gA = svgEl('g')
  gA.setAttribute('class', 'dsu-ret-rot-a')
  /* 300° 弧，缺口留在正下方 6 点钟方向：底部字幕永远不会被压到，
     弧末端圆点落在 5 点钟位置，和原片一致。 */
  const a = arc(150, 215, 505, 'dsu-ring-a', 'round')
  gA.appendChild(a.node)
  gA.appendChild(dot('dsu-dot-a', a.x, a.y, '7'))
  svg.appendChild(gA)

  const gB = svgEl('g')
  gB.setAttribute('class', 'dsu-ret-rot-b')
  const b = arc(104, 200, 490, 'dsu-ring-b', 'round')
  gB.appendChild(b.node)
  gB.appendChild(dot('dsu-dot-b', b.x0, b.y0, '4'))
  svg.appendChild(gB)

  const gC = svgEl('g')
  gC.appendChild(arc(62, 118, 242, 'dsu-bracket', 'round').node)
  gC.appendChild(arc(62, 298, 62, 'dsu-bracket', 'round').node)
  svg.appendChild(gC)

  const pts = [[152, 132], [252, 268], [278, 150]]
  for (let i = 0; i < pts.length; i++) {
    svg.appendChild(dot('dsu-dot-o', pts[i][0], pts[i][1], '2.8'))
  }

  /* 刻度环：48 格沿环逐格点亮一圈（仪表自检），读完停在暗态 */
  svg.appendChild(
    tickRing({
      groupClass: 'dsu-ret-ticks',
      count: 48,
      itemClass: 'dsu-tick',
      majorClass: 'dsu-tick-major',
      majorEvery: 4,
      r0: 133,
      r1: 138,
      r1Major: 143,
      delayStep: 32,
    }),
  )

  /* 数据环：按插件数量点亮对应格数（取不到就 12 格） */
  const DATA_TICKS = 40
  const lit = Math.max(6, Math.min(DATA_TICKS, Number(facts.bundleCount) || 12))
  const gD = svgEl('g')
  gD.setAttribute('class', 'dsu-ret-data')
  for (let d = 0; d < DATA_TICKS; d++) {
    const degD = (d / DATA_TICKS) * 360 - 90
    const radD = (degD * Math.PI) / 180
    const rD0 = 112
    const rD1 = d < lit ? 120 : 116
    const lineD = svgEl('line')
    lineD.setAttribute('class', 'dsu-tick-data' + (d < lit ? ' dsu-lit' : ''))
    lineD.setAttribute('x1', (CENTER + rD0 * Math.cos(radD)).toFixed(2))
    lineD.setAttribute('y1', (CENTER + rD0 * Math.sin(radD)).toFixed(2))
    lineD.setAttribute('x2', (CENTER + rD1 * Math.cos(radD)).toFixed(2))
    lineD.setAttribute('y2', (CENTER + rD1 * Math.sin(radD)).toFixed(2))
    lineD.style.animationDelay = Math.round(d * 26) + 'ms'
    gD.appendChild(lineD)
  }
  svg.appendChild(gD)

  /* 彗星弧：8% 周长的一段弧，绕环匀速扫过 */
  const comet = svgEl('circle')
  comet.setAttribute('class', 'dsu-ret-comet')
  comet.setAttribute('cx', String(CENTER))
  comet.setAttribute('cy', String(CENTER))
  comet.setAttribute('r', '150')
  comet.setAttribute('pathLength', '100')
  comet.setAttribute('stroke-dasharray', '8 92')
  svg.appendChild(comet)

  /* 锁定冲击波：只在外环外扩，不穿过中央文字 */
  const ping = svgEl('circle')
  ping.setAttribute('class', 'dsu-ping')
  ping.setAttribute('cx', String(CENTER))
  ping.setAttribute('cy', String(CENTER))
  ping.setAttribute('r', '150')
  svg.appendChild(ping)

  host.appendChild(svg)

  /* 雷达扫描扇区：conic 渐变 + 环形遮罩，只在中环那一圈扫 */
  const scan = el('div', 'dsu-ret-scan')
  host.appendChild(scan)
  return { scan }
}
