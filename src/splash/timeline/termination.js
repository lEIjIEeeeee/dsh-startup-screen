import { localDayKey } from '../../shared/day.js'

/**
 * 揭幕与销毁：写已播标记、解锁滚动、摘根节点、广播 done。
 *
 * @param {{
 *   config: Record<string, any>,
 *   root: any,
 *   ms: (n: number) => number,
 *   stale: () => boolean,
 *   disarmStall: () => void,
 *   releaseAll: () => void,
 *   stopHex: () => void,
 *   stopFacts: () => void,
 *   stopVoice: () => void,
 *   stopClock: () => void,
 *   dropListeners: () => void,
 *   showChrome: () => void,
 *   restoreAppBackdrop: () => void,
 * }} deps
 */
export function createTermination(deps) {
  const C = deps.config
  const root = deps.root
  let finished = false
  let finishTimer = null

  function finish() {
    if (finished) return
    finished = true
    window.__DSH_STARTUP_FINISHED__ = true
    deps.disarmStall()
    /* 播完不再需要键盘和手势监听；不摘的话闭包会一直持有整棵已经移除的 DOM */
    deps.dropListeners()
    /* 揭幕即还原桌面端标题栏（root 被移除时 MutationObserver 还会再兜一次） */
    deps.showChrome()
    try {
      deps.restoreAppBackdrop()
    } catch (e) {
      /* noop */
    }
    deps.releaseAll()
    deps.stopHex()
    deps.stopFacts()
    deps.stopVoice()
    deps.stopClock()
    try {
      if (C.mode === 'session') window.sessionStorage.setItem('dsh-startup-screen:shown', '1')
      if (C.mode === 'daily') {
        window.localStorage.setItem('dsh-startup-screen:day', localDayKey())
      }
    } catch (err) {
      /* 隐私模式下不可写，忽略 */
    }
    /* 解锁：宿主注入的关键样式用 html.dsu-lock 锁滚动，这里必须一并摘掉，
       否则揭幕后主界面会永远滚不动。 */
    document.documentElement.classList.remove('dsu-lock')
    document.documentElement.style.overflow = ''
    if (document.body) document.body.style.overflow = ''
    root.classList.remove('dsu-boot')
    root.classList.add('dsu-gone')
    finishTimer = setTimeout(function () {
      finishTimer = null
      if (deps.stale()) return
      if (root && root.parentNode) root.parentNode.removeChild(root)
      try {
        window.dispatchEvent(new CustomEvent('dsh-startup:done'))
      } catch (err) {
        /* noop */
      }
    }, deps.ms(900))
  }

  /** 跳过：先放行所有等待，再走正常揭幕。 */
  function requestSkip() {
    if (finished) return
    deps.releaseAll()
    finish()
  }

  /** 拆掉时间线自己的状态；DOM、声音与滚动锁由入口继续处理。 */
  function disposeTimeline() {
    finished = true
    deps.disarmStall()
    if (finishTimer) {
      clearTimeout(finishTimer)
      finishTimer = null
    }
    try {
      deps.releaseAll()
    } catch (e) {
      /* noop */
    }
    try {
      deps.stopHex()
    } catch (e) {
      /* noop */
    }
  }

  return {
    finish,
    requestSkip,
    dispose: disposeTimeline,
    isFinished: function () {
      return finished
    },
  }
}
