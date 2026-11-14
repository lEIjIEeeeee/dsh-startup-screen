import { WHALE_PATH } from '../data/whale-path.js'

let metalSeq = 0

/**
 * 建鲸鱼标识：实心底 + 同形状的渐变高光。
 * 不给整个形状调半透明 —— 浅色主题下深色形状被调淡就是发灰、无神，不像金属。
 *
 * @param {string} [cls]
 * @returns {SVGElement}
 */
export function createWhaleSvg(cls) {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', '0 0 50 50')
  svg.setAttribute('aria-hidden', 'true')
  if (cls) svg.setAttribute('class', cls)

  const gid = 'dsu-metal-' + ++metalSeq
  const defs = document.createElementNS(ns, 'defs')
  const lg = document.createElementNS(ns, 'linearGradient')
  lg.setAttribute('id', gid)
  lg.setAttribute('x1', '0.10')
  lg.setAttribute('y1', '0')
  lg.setAttribute('x2', '0.62')
  lg.setAttribute('y2', '1')
  const stops = [
    [0, '#ffffff', '0.24'],
    [0.4, '#ffffff', '0'],
    [0.62, '#000000', '0'],
    [1, '#000000', '0.20'],
  ]
  for (const stop of stops) {
    const node = document.createElementNS(ns, 'stop')
    node.setAttribute('offset', String(stop[0]))
    node.setAttribute('stop-color', stop[1])
    node.setAttribute('stop-opacity', stop[2])
    lg.appendChild(node)
  }
  defs.appendChild(lg)
  svg.appendChild(defs)

  const shape = document.createElementNS(ns, 'path')
  shape.setAttribute('d', WHALE_PATH)
  shape.setAttribute('fill-rule', 'nonzero')
  svg.appendChild(shape)

  const shine = document.createElementNS(ns, 'path')
  shine.setAttribute('d', WHALE_PATH)
  shine.setAttribute('fill-rule', 'nonzero')
  shine.style.fill = 'url(#' + gid + ')'
  svg.appendChild(shine)
  return svg
}
