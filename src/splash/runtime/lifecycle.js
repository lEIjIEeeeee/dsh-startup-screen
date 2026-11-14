import { ROUTES } from '../../shared/routes.js'
import { ROOT_ID } from '../core/constants.js'

/**
 * 实例生命周期：拆掉当前实例、重播时重新加载运行时脚本。
 *
 * @param {{
 *   runtime: Record<string, any>,
 *   chromeSync: any,
 *   restoreAppBackdrop: () => void,
 *   dropListeners: () => void,
 *   stopClock: () => void,
 *   noop: () => void,
 * }} deps
 */
export function createLifecycle(deps) {
  const runtime = deps.runtime

  /** 拆掉当前实例：停时间线、清定时器、停语音、解滚动锁、摘根节点。重播前必须先调它。 */
  function dispose() {
    try {
      runtime.timeline.dispose()
    } catch (e) {
      /* noop */
    }
    try {
      runtime.facts.dispose()
    } catch (e) {
      /* noop */
    }
    deps.dropListeners()
    /* 桌面端：旧实例藏起来的标题栏必须还原，否则它的 60 秒 holdTimer 会
       在新一轮动画播到一半时突然把按钮放出来 */
    try {
      deps.chromeSync.show()
    } catch (e) {
      /* noop */
    }
    try {
      deps.restoreAppBackdrop()
    } catch (e) {
      /* noop */
    }
    deps.stopClock()
    try {
      runtime.voice.stop()
    } catch (e) {
      /* noop */
    }
    /* 每次重播都是一个新脚本实例，不关旧 AudioContext 会撞浏览器上限 */
    try {
      runtime.audio.close()
    } catch (e) {
      /* noop */
    }
    try {
      document.documentElement.classList.remove('dsu-lock')
      document.documentElement.style.overflow = ''
      if (document.body) document.body.style.overflow = ''
    } catch (e) {
      /* noop */
    }
    try {
      const r = document.getElementById(ROOT_ID)
      if (r && r.parentNode) r.parentNode.removeChild(r)
    } catch (e) {
      /* noop */
    }
    /* 把"这一轮的状态"也清干净：新实例要重新置位 RUNNING，
       否则它自己的 9 秒兜底会因为 RUNNING 还是 true 而永远不生效 */
    try {
      window.__DSH_STARTUP_RUNNING__ = false
      window.__DSH_STARTUP_FINISHED__ = false
    } catch (e) {
      /* noop */
    }
  }

  /** 重播：先拆掉旧实例，再把运行时脚本重新加载一次。 */
  function injectSelf() {
    const prev = window.__DSH_STARTUP_API__
    if (prev && typeof prev.dispose === 'function' && prev.dispose !== deps.noop) {
      try {
        prev.dispose()
      } catch (e) {
        /* 旧实例拆不干净也不能挡住重播 */
      }
    }
    window.__DSH_STARTUP_LOADED__ = false
    const old = document.getElementById(ROOT_ID)
    if (old && old.parentNode) old.parentNode.removeChild(old)
    window.__DSH_STARTUP_SKIP__ = false

    /* 先摘掉之前注入的脚本：同一个地址反复加载会留下多份执行环境，
       有些浏览器还会因为地址已执行过而直接跳过，重播就静默失效了 */
    try {
      const stale = document.querySelectorAll('script[data-dsh-startup-runtime]')
      for (let i = 0; i < stale.length; i++) {
        if (stale[i] && stale[i].parentNode) stale[i].parentNode.removeChild(stale[i])
      }
    } catch (e) {
      /* noop */
    }

    const s = document.createElement('script')
    try {
      s.setAttribute('data-dsh-startup-runtime', '1')
    } catch (e) {
      /* noop */
    }
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

  return { dispose, injectSelf }
}
