/**
 * dsh-startup-screen — 浏览器侧（设置页「启动动画」）
 * ----------------------------------------------------------------------------
 * 按宿主的客户端模块格式加载，在设置页注册一个「启动动画」区块，
 * 用来改身份名称、权限等级、配色、速度、交互开关等。
 *
 * 配置读写走宿主侧的 /dsh-startup/config 接口，不用宿主的 settings 服务，
 * 这样宿主升级设置模块时不会把面板带崩。
 * 注册 id 必须和插件名一致，否则加载器会报错；注册壳由构建时套上。
 */
import { ROUTES } from '../shared/routes.js'
import { API } from './api.js'
import { Panel } from './panel.jsx'
import { injectStyles } from './styles.js'

injectStyles()

/* ── 桌面端自启动 ────────────────────────────────────────────────────────── */
/* 网页版由宿主把启动界面注入页面；桌面版可能不走注入，直接下发页面。
   所以浏览器侧自己兜一层：没被宿主接管时，自己建根节点并加载样式和脚本。

   判断只看页面上的标记，不去猜宿主类型：
     __DSH_STARTUP_BOOT__  宿主已注入，或本侧已经启动过
     __DSH_STARTUP_SKIP__  已经判定这次不播
     __DSH_STARTUP__       配置已经就位 */

function readFlag(store, key) {
  try {
    const s = window[store]
    return s ? s.getItem(key) : null
  } catch (e) {
    return null
  }
}

function writeFlag(store, key, value) {
  try {
    const s = window[store]
    if (s) s.setItem(key, value)
  } catch (e) {
    /* 隐私模式下可能抛，忽略 */
  }
}

function markBooted() {
  try {
    window.__DSH_STARTUP_BOOT__ = 'client'
  } catch (e) {
    /* noop */
  }
}

/** 挂一个 <script src>；失败时调 fail(err)。 */
function loadScript(src, fail) {
  const s = document.createElement('script')
  s.src = src
  s.async = false
  if (typeof fail === 'function') {
    s.addEventListener('load', () => fail(null))
    s.addEventListener('error', () => fail(new Error('script load failed: ' + src)))
  }
  ;(document.head || document.documentElement).appendChild(s)
}

/** 挂一份 <link rel=stylesheet>；失败时调 fail(err)。 */
function loadCss(href, fail) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  if (typeof fail === 'function') {
    link.addEventListener('load', () => fail(null))
    link.addEventListener('error', () => fail(new Error('css load failed: ' + href)))
  }
  ;(document.head || document.documentElement).appendChild(link)
}

/** 移除根节点、解开滚动锁定 —— 启动过程中任何一步失败都要把页面还回去。 */
function release(ok) {
  if (ok) return
  try {
    const r = document.getElementById('dsh-startup-root')
    if (r && r.parentNode) r.parentNode.removeChild(r)
    if (document.documentElement.classList) document.documentElement.classList.remove('dsu-lock')
    if (document.body && document.body.style) document.body.style.overflow = ''
    window.__DSH_STARTUP_FAILED__ = true
  } catch (e) {
    /* 兜底不再抛 */
  }
}

function injectRoot(cfg, onReady) {
  let root = document.getElementById('dsh-startup-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'dsh-startup-root'
    document.body.appendChild(root)
  }
  root.className = 'dsu-root dsu-boot'
  if (document.documentElement.classList) document.documentElement.classList.add('dsu-lock')
  if (document.body && document.body.style) document.body.style.overflow = 'hidden'

  /* 样式与运行时都从宿主路由取 —— 同一份文件，不额外维护内联副本 */
  let failed = false
  let cssReady = false
  let scriptReady = false
  let readyCalled = false
  function guard(err) {
    if (err) {
      if (!failed && typeof console !== 'undefined' && console.warn) {
        console.warn('[dsh-startup-screen] 启动界面自举失败，已放开页面：', err.message)
      }
      failed = true
      release(false)
      return
    }
    if (cssReady && scriptReady && !readyCalled) {
      readyCalled = true
      release(true)
      /* 只有真的挂上了才算播过：失败时不留标记，下次还能重试 */
      if (typeof onReady === 'function') {
        try {
          onReady()
        } catch (e) {
          /* 记标记失败不影响播放 */
        }
      }
    }
  }

  loadCss(ROUTES.css, (err) => {
    if (err) {
      guard(err)
      return
    }
    cssReady = true
    guard(null)
  })

  /* 配置先落 window：splash.js 载入时直接读它 */
  window.__DSH_STARTUP__ = cfg || {}
  try {
    delete window.__DSH_STARTUP_LOADED__
  } catch (e) {
    window.__DSH_STARTUP_LOADED__ = undefined
  }
  loadScript(ROUTES.splash + '?t=' + Date.now(), (err) => {
    if (err) {
      guard(err)
      return
    }
    scriptReady = true
    guard(null)
  })

  /* 自动恢复：样式和脚本都加载完了，标记还在，说明动画没接管，直接放行 */
  setTimeout(() => {
    try {
      const r = document.getElementById('dsh-startup-root')
      if (r && r.className && r.className.indexOf('dsu-boot') !== -1) release(false)
    } catch (e) {
      /* 兜底不再抛 */
    }
  }, 9000)
}

function selfBoot() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    if (!document.body) return
    if (window.__DSH_STARTUP_BOOT__) return /* 已被宿主或本侧接管 */
    if (window.__DSH_STARTUP__) return /* 配置已在页面上：宿主注入过 */
    if (document.getElementById('dsh-startup-root')) return
    /* 已经失败过就不再重试 */
    if (window.__DSH_STARTUP_FAILED__ === true) return
    markBooted()
    fetch(API, { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((j) => {
        if (!j || j.ok !== true) return null
        const cfg = j.config || null
        if (cfg && j.facts) cfg.facts = j.facts
        return cfg
      })
      .catch(() => null)
      .then((cfg) => {
        cfg = cfg || { enabled: true, mode: 'session', speed: 1 }
        if (cfg.enabled === false) return
        const today = new Date().toISOString().slice(0, 10)
        if (
          cfg.mode === 'session' &&
          readFlag('sessionStorage', 'dsh-startup-screen:shown') === '1'
        )
          return
        if (cfg.mode === 'daily' && readFlag('localStorage', 'dsh-startup-screen:day') === today)
          return
        /* 等样式和脚本都加载成功再写标记；失败时不留标记，这个会话还能再试。 */
        return injectRoot(cfg, () => {
          if (cfg.mode === 'session') writeFlag('sessionStorage', 'dsh-startup-screen:shown', '1')
          if (cfg.mode === 'daily') writeFlag('localStorage', 'dsh-startup-screen:day', today)
        })
      })
      .catch(() => {
        /* 自举失败就算了，页面本来就是好的 */
      })
  } catch (e) {
    /* 自举是兜底，绝不许把宿主带崩 */
  }
}

/* ── 插件入口 ────────────────────────────────────────────────────────────── */
const inject = ['slots']

function apply(ctx) {
  /* 桌面端兜底：宿主没有注入启动界面时，由这里自己启动。
     网页版这两个标记已经就位，本函数会直接返回。 */
  selfBoot()
  ctx.slots.inject('settings.section', () => {
    return ctx.slots.register(
      { name: 'settings.section', id: 'startup-screen', order: 26, label: '启动动画' },
      () => <Panel />,
    )
  })
}

export { apply, inject }
