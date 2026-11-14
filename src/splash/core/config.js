import { normalize } from '../../shared/schema.js'

/**
 * 页面上的原始配置：字段校验统一交给 shared/schema，这里只补一个运行时字段。
 * 宿主会把 facts 快照塞在配置对象里一起注入，它不是配置项，所以不进 normalize。
 *
 * @param {any} raw
 * @returns {Record<string, any>}
 */
export function readStartupConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const out = normalize(source)
  if (source.facts && typeof source.facts === 'object') out.facts = source.facts
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
