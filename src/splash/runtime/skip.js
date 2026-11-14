/**
 * 跳过入口：右上角 SKIP 与 Esc 都走同一条 requestSkip。
 *
 * @param {{
 *   config: Record<string, any>,
 *   ui: Record<string, any>,
 *   timeline: any,
 *   listen: (target: any, type: string, fn: any, opts?: any) => void,
 * }} options
 */
export function wireSkip(options) {
  const ui = options.ui
  if (!ui.skip) return
  if (!options.config.allowSkip) {
    ui.skip.hidden = true
    return
  }
  ui.skip.hidden = false
  ui.skip.addEventListener('click', function (e) {
    e.stopPropagation()
    options.timeline.requestSkip()
  })
  options.listen(document, 'keydown', function (e) {
    if (e.key === 'Escape') options.timeline.requestSkip()
  })
}
