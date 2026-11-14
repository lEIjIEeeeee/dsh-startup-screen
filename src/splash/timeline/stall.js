import { STALL_MS } from '../core/constants.js'

/**
 * 停滞看门狗：任意一幕卡住（音频不返回、切换设备、音频被挂起）都要放行。
 * 每推进一步重新计时；等用户操作时暂停计时，不把正在犹豫的人踢出去。
 *
 * @param {{ isDone: () => boolean, onStall: () => void }} options
 */
export function createStall(options) {
  let stallTimer = null

  function disarm() {
    if (stallTimer) {
      clearTimeout(stallTimer)
      stallTimer = null
    }
  }

  function arm() {
    disarm()
    stallTimer = setTimeout(function () {
      if (options.isDone()) return
      window.__DSH_STARTUP_STALLED__ = true
      try {
        console.warn('[dsh-startup-screen] 时间线停滞超过 ' + STALL_MS + 'ms，强制揭幕')
      } catch (e) {
        /* noop */
      }
      options.onStall()
    }, STALL_MS)
  }

  return { arm, disarm }
}
