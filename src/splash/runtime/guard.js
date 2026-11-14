import { BOOT_FAILSAFE_MS, ROOT_ID } from '../core/constants.js'

/**
 * 启动前的两道守卫。
 *
 * 1. 宿主侧的首屏兜底脚本已经判定"这次不播"（未启用 / 本会话已播 / 今日已播）：
 *    这里不再建 DOM，但仍然暴露 API，方便设置页按需重播。
 * 2. 最后一道保险：脚本连 run() 都没进去（404 / 语法错 / 被拦）时，9 秒后无条件放行。
 *    判的是「有没有开始跑」而不是类名 —— `dsu-boot` 在 run() 之前就被摘掉了，
 *    按类名判等于永不生效（这正是旧实现漏掉的那类卡死）。
 *
 * @param {{ config: Record<string, any>, replay: () => void, noop: () => void }} options
 * @returns {boolean} true 表示这次不播，调用方应直接结束
 */
export function installBootGuard(options) {
  if (window.__DSH_STARTUP_SKIP__ === true) {
    window.__DSH_STARTUP_API__ = {
      replay: options.replay,
      skip: function () {},
      finish: function () {},
      dispose: options.noop,
      config: options.config,
    }
    return true
  }

  setTimeout(function () {
    try {
      if (window.__DSH_STARTUP_RUNNING__ === true) return
      const r = document.getElementById(ROOT_ID)
      if (r && r.parentNode) r.parentNode.removeChild(r)
      document.documentElement.classList.remove('dsu-lock')
      if (document.body) document.body.style.overflow = ''
      window.__DSH_STARTUP_FAILED__ = true
    } catch (e) {
      /* 兜底本身不许再抛 */
    }
  }, BOOT_FAILSAFE_MS)
  return false
}
