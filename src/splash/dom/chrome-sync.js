import { ROOT_ID } from '../core/constants.js'

/**
 * 桌面端标题栏同步（仅 Windows）。
 *
 * 桌面版用系统绘制的窗口按钮，底色跟着应用主题走。动画播放时右上角会留下
 * 一块和主题同色的方块：黑幕时是一条亮带，暖白底板上又显得刺眼。
 * 做法是把桌面版用来取色的隐藏元素改成完全透明，让它把窗口按钮和底色一起藏起来，
 * 动画结束再还原。浏览器和 macOS 下这段不执行，任何一步失败都静默跳过。
 *
 * @param {{ window?: any, document?: any }} [env] 宿主窗口与文档；不传时用全局对象
 * @returns {{ hide: () => void, show: () => void, isDesktopWin: () => boolean }}
 */
export function createChromeSync(env) {
  const win = (env && env.window) || window
  const doc = (env && env.document) || document
  const CLEAR = 'rgba(0, 0, 0, 0)'
  const VARS = ['--dsw-specific-sidebar-fill', '--dsw-alias-label-primary']
  const MAX_HOLD_MS = 60000 /* 硬上限：万一动画卡住，别把按钮永久藏住 */
  const rootEl = doc.documentElement
  const state = { applied: false, probe: null, settledHits: 0 }
  const savedVars = {}
  let retryTimers = []
  let keepAlive = null
  let holdTimer = null

  function isDesktopWin() {
    try {
      const nav = win.navigator
      if (!nav || !/Win/.test(nav.userAgent || '')) return false
      /* 判据不只认协议字符串：桌面端还会在文档上打 data-windows-titlebar 标记，
         任一个命中即认为是 Windows 桌面端，避免协议改名后整段静默失效 */
      const loc = win.location
      if (loc && loc.protocol === 'dsh-app:') return true
      const de = doc.documentElement
      return !!(de && de.hasAttribute && de.hasAttribute('data-windows-titlebar'))
    } catch (e) {
      return false
    }
  }

  /* 桌面版用来取色的隐藏元素是一个 span，内联背景色的声明值里带这个变量名 */
  function findProbe() {
    try {
      if (!doc.querySelector) return null
      const node = doc.querySelector('span[style*="dsw-specific-sidebar-fill"]')
      if (node) return node
      /* 兜底：某些实现不把内联样式暴露给属性选择器 */
      if (!doc.querySelectorAll) return null
      const spans = doc.querySelectorAll('span')
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i]
        if (!span.style || typeof span.style.getPropertyValue !== 'function') continue
        const bg = span.style.getPropertyValue('background-color')
        if (bg && bg.indexOf('--dsw-specific-sidebar-fill') !== -1) return span
      }
    } catch (e) {
      /* 兜底不再抛 */
    }
    return null
  }

  /* 在页面里制造一点小改动，让桌面版重新读取窗口颜色；两条路径任一生效即可。 */
  function poke() {
    try {
      if (doc.head) {
        const style = doc.createElement('style')
        style.setAttribute('data-dsu-chrome-poke', '1')
        style.textContent = '/*dsu-poke*/'
        doc.head.appendChild(style)
        if (style.parentNode) style.parentNode.removeChild(style)
      }
    } catch (e) {
      /* 兜底不再抛 */
    }
    try {
      if (doc.body && doc.body.style) {
        doc.body.style.setProperty('--dsu-chrome-poke', String(Date.now() % 1000000))
        doc.body.style.removeProperty('--dsu-chrome-poke')
      }
    } catch (e) {
      /* 兜底不再抛 */
    }
  }

  /** 检测元素是否已经真的透明；读不到样式就当作还没生效，继续重试。 */
  function settled() {
    try {
      const probe = state.probe
      if (!probe || probe.isConnected === false) return false
      const getStyle =
        win.getComputedStyle ||
        (typeof getComputedStyle === 'function' ? getComputedStyle : null)
      if (!getStyle) return false
      return getStyle(probe).backgroundColor === CLEAR
    } catch (e) {
      return false
    }
  }

  function apply() {
    try {
      /* 检测元素可能被应用重新挂载（切换主题、热更新）：节点一旦离开页面就重新找，
         否则会对着已删除的节点操作，标题栏会在动画中途突然回到主题色 */
      let probe = state.probe
      if (!probe || probe.isConnected === false) probe = state.probe = findProbe()
      if (probe) {
        probe.style.setProperty('background-color', CLEAR)
        probe.style.setProperty('color', CLEAR)
      }
      if (rootEl) for (const name of VARS) rootEl.style.setProperty(name, CLEAR)
      poke()
    } catch (e) {
      /* 兜底不再抛 */
    }
  }

  function stopTimers() {
    for (const timer of retryTimers) clearTimeout(timer)
    retryTimers = []
    if (keepAlive) {
      clearInterval(keepAlive)
      keepAlive = null
    }
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
  }

  function hide() {
    if (!isDesktopWin()) return
    try {
      if (!state.applied) {
        state.applied = true
        state.settledHits = 0
        for (const name of VARS) savedVars[name] = rootEl.style.getPropertyValue(name)
        state.probe = findProbe()
        /* 万一动画卡住不揭幕，到点强制还原，绝不把三个按钮永久藏住 */
        holdTimer = setTimeout(show, MAX_HOLD_MS)
      }
      apply()
      /* 脚本可能比桌面版准备好得更早，所以多试几次 */
      for (const timer of retryTimers) clearTimeout(timer)
      retryTimers = []
      const delays = [140, 520, 1400]
      for (const delay of delays) retryTimers.push(setTimeout(apply, delay))
      /* 自动恢复：应用挂载过程中如果自己又改回来，这里再拉回透明；
         连续两次确认透明后停止，不要一直空转 */
      if (!keepAlive) {
        keepAlive = setInterval(function () {
          if (!state.applied) return
          if (settled()) {
            if (++state.settledHits >= 2) {
              clearInterval(keepAlive)
              keepAlive = null
            }
            return
          }
          state.settledHits = 0
          apply()
        }, 600)
      }
    } catch (e) {
      /* 兜底不再抛 */
    }
  }

  function show() {
    if (!state.applied) return
    state.applied = false
    try {
      stopTimers()
      const probe = state.probe
      if (probe) {
        probe.style.removeProperty('background-color')
        probe.style.removeProperty('color')
      }
      if (rootEl) {
        for (const name of VARS) {
          if (savedVars[name]) rootEl.style.setProperty(name, savedVars[name])
          else rootEl.style.removeProperty(name)
        }
      }
      poke()
      state.probe = null
      state.settledHits = 0
    } catch (e) {
      /* 兜底不再抛 */
    }
  }

  /* 兜底：无论从哪条路退出（揭幕、跳过、启动失败、9 秒超时），
     根节点一被移除就还原标题栏 */
  let observerInstalled = false
  function installObserver() {
    if (observerInstalled) return
    observerInstalled = true
    try {
      const MO =
        win.MutationObserver ||
        (typeof MutationObserver !== 'undefined' ? MutationObserver : null)
      if (!MO || !doc.body) return
      const mo = new MO(function (mutations) {
        for (const mutation of mutations) {
          const nodes = mutation.removedNodes
          for (let i = 0; nodes && i < nodes.length; i++) {
            if (nodes[i] && nodes[i].nodeType === 1 && nodes[i].id === ROOT_ID) {
              show()
              return
            }
          }
        }
      })
      mo.observe(doc.body, { childList: true })
    } catch (e) {
      /* 兜底不再抛 */
    }
  }
  if (doc.body) installObserver()
  else if (doc.addEventListener) doc.addEventListener('DOMContentLoaded', installObserver)

  return { hide, show, isDesktopWin }
}
