import { DEFAULTS } from '../../shared/defaults.js'
import { IDENTITY_MAX, normalizeIdentityId } from '../../shared/schema.js'

/**
 * 把页面上的原始配置和默认值合并成一份可用的配置。
 * 不直接读 window：调用方把对象传进来，方便测试。
 *
 * @param {any} raw
 * @returns {Record<string, any>}
 */
export function normalizeStartupConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  for (const key in DEFAULTS) {
    if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) out[key] = DEFAULTS[key]
  }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined && source[key] !== null) {
      out[key] = source[key]
    }
  }
  out.speed = Math.min(3, Math.max(0.35, Number(out.speed) || 1))
  out.identity = String(out.identity || DEFAULTS.identity).slice(0, IDENTITY_MAX)
  out.identityId = normalizeIdentityId(out.identityId, out.identity)
  return out
}

/** 真实信息为空时显示占位符。 */
export function factText(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

/** 环境光效默认开启，只有显式关掉才停。 */
export function isAmbientOn(config) {
  return config.ambient !== false
}
