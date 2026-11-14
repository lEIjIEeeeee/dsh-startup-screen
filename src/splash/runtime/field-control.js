import { createField } from '../canvas/field.js'

/**
 * 光场开关：DOM 就绪后就开始跑，但 .dsu-field 的 opacity=0，第一幕纯黑时看不见。
 *
 * @param {{
 *   config: Record<string, any>,
 *   ui: Record<string, any>,
 *   root: any,
 *   reduced: boolean,
 *   ambientOn: () => boolean,
 *   getFacts: () => Record<string, any>,
 * }} options
 */
export function createFieldControl(options) {
  let handle = null

  function stop() {
    if (!handle) return
    try {
      handle.stop()
    } catch (e) {
      /* noop */
    }
    handle = null
    try {
      window.__DSH_STARTUP_FIELD__ = null
    } catch (e) {
      /* noop */
    }
  }

  function start() {
    if (!options.ambientOn() || handle) return
    handle = createField({
      canvas: options.ui.field,
      root: options.root,
      config: options.config,
      facts: options.getFacts(),
      reduced: options.reduced,
    })
    if (!handle) return
    try {
      window.__DSH_STARTUP_FIELD__ = handle
    } catch (e) {
      /* noop */
    }
  }

  /** 真实信息指纹变化时重排光场；会话数变化不该让粒子跳一下。 */
  function refresh(next, prevHash) {
    const field = options.ui.field
    if (next.hash && next.hash !== prevHash && field && !field.classList.contains('dsu-in')) {
      stop()
      start()
    }
  }

  return { start, stop, refresh }
}
