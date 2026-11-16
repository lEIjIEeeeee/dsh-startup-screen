import { ROUTES } from '../shared/routes.js'
import type { Facts, RuntimeConfig, StartupConfig } from '../shared/types.js'

export const API = ROUTES.config

/* 路由挂住时不能让面板永远停在「读取配置中…」，写操作也不能一直转圈 */
const LOAD_TIMEOUT_MS = 8000
const WRITE_TIMEOUT_MS = 15000
const PREVIEW_FALLBACK_MS = 1200

interface ConfigPayload {
  ok: boolean
  error?: string
  version?: string
  config?: StartupConfig
  defaults?: StartupConfig
  file?: string
  facts?: Facts
}

type TimeoutError = Error & { timeout?: boolean }

function messageOf(e: unknown): string {
  return String(e && (e as { message?: unknown }).message ? (e as Error).message : e)
}

function isTimeout(e: unknown): e is TimeoutError {
  return !!e && typeof e === 'object' && (e as { timeout?: unknown }).timeout === true
}

/** 带超时的请求；超时抛出的错误带 timeout 标记，调用方据此换中文提示。 */
function request(init: RequestInit, timeoutMs: number, timeoutMessage: string) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null
  const stop = () => {
    if (timer) clearTimeout(timer)
  }
  if (ctrl) init.signal = ctrl.signal
  return fetch(API, init)
    .then((r) => r.json() as Promise<ConfigPayload>)
    .then((j) => {
      stop()
      return j
    })
    .catch((e: unknown) => {
      stop()
      if (ctrl && ctrl.signal.aborted) {
        const err: TimeoutError = new Error(timeoutMessage)
        err.timeout = true
        throw err
      }
      throw e
    })
}

function post(body: unknown) {
  return request(
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    WRITE_TIMEOUT_MS,
    '保存超时，请稍后重试',
  )
}

/** 读配置。超时或接口失败都抛带中文提示的 Error，由面板直接显示。 */
export function loadConfig(): Promise<ConfigPayload> {
  return request(
    { headers: { Accept: 'application/json' } },
    LOAD_TIMEOUT_MS,
    '读取配置超时，请稍后重试',
  )
    .then((j) => {
      if (!j || j.ok !== true) throw new Error(j && j.error ? j.error : 'load failed')
      return j
    })
    .catch((e: unknown) => {
      if (isTimeout(e)) throw e
      throw new Error('读取配置失败：' + messageOf(e))
    })
}

export function saveConfig(draft: StartupConfig): Promise<ConfigPayload> {
  return post({ patch: draft })
    .then((j) => {
      if (!j || j.ok !== true) throw new Error(j && j.error ? j.error : 'save failed')
      return j
    })
    .catch((e: unknown) => {
      if (isTimeout(e)) throw e
      throw new Error('保存失败：' + messageOf(e))
    })
}

export function resetConfig(): Promise<ConfigPayload> {
  return post({ action: 'reset' })
    .then((j) => {
      if (!j || j.ok !== true) throw new Error(j && j.error ? j.error : 'reset failed')
      return j
    })
    .catch((e: unknown) => {
      if (isTimeout(e)) throw new Error('恢复默认超时，请稍后重试')
      throw new Error('恢复默认失败：' + messageOf(e))
    })
}

/** 立即预览：把当前未保存的 draft 合进页面配置，重播一次；不写盘。 */
export function previewConfig(draft: StartupConfig | null) {
  try {
    const base =
      window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === 'object'
        ? window.__DSH_STARTUP__
        : {}
    window.__DSH_STARTUP__ = Object.assign({}, base, draft || {}) as RuntimeConfig
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
