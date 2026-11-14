import { ROUTES } from '../shared/routes.js'

export const API = ROUTES.config

/* 路由挂住时不能让面板永远停在「读取配置中…」 */
const LOAD_TIMEOUT_MS = 8000
const PREVIEW_FALLBACK_MS = 1200

function messageOf(e) {
  return String(e && e.message ? e.message : e)
}

function post(body) {
  return fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())
}

/** 读配置。超时或接口失败都抛带中文提示的 Error，由面板直接显示。 */
export function loadConfig() {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null
  const timer = ctrl ? setTimeout(() => ctrl.abort(), LOAD_TIMEOUT_MS) : null
  const stop = () => {
    if (timer) clearTimeout(timer)
  }
  const init = { headers: { Accept: 'application/json' } }
  if (ctrl) init.signal = ctrl.signal
  return fetch(API, init)
    .then((r) => r.json())
    .then((j) => {
      stop()
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'load failed')
      return j
    })
    .catch((e) => {
      stop()
      if (ctrl && ctrl.signal.aborted) throw new Error('读取配置超时，请稍后重试')
      throw new Error('读取配置失败：' + messageOf(e))
    })
}

export function saveConfig(draft) {
  return post({ patch: draft })
    .then((j) => {
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'save failed')
      return j
    })
    .catch((e) => {
      throw new Error('保存失败：' + messageOf(e))
    })
}

export function resetConfig() {
  return post({ action: 'reset' })
    .then((j) => {
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'reset failed')
      return j
    })
    .catch((e) => {
      throw new Error('恢复默认失败：' + messageOf(e))
    })
}

/** 立即预览：把当前未保存的 draft 合进页面配置，重播一次；不写盘。 */
export function previewConfig(draft) {
  try {
    const base =
      window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === 'object'
        ? window.__DSH_STARTUP__
        : {}
    window.__DSH_STARTUP__ = Object.assign({}, base, draft || {})
  } catch (e) {
    /* noop */
  }
  const api = window.__DSH_STARTUP_API__
  if (api && typeof api.replay === 'function') {
    let threw = false
    try {
      api.replay()
    } catch (e) {
      threw = true
    }
    /* 兜底：重挂没生效时，1.2 秒后直接刷新页面，保证按钮永远有反应。 */
    setTimeout(() => {
      if (threw) {
        window.location.reload()
        return
      }
      const root = document.getElementById('dsh-startup-root')
      const running = window.__DSH_STARTUP_RUNNING__ === true
      if (!root && !running) window.location.reload()
    }, PREVIEW_FALLBACK_MS)
    return
  }
  window.location.reload()
}
