import { DEFAULTS } from './defaults.js'

export const TEXT_KEYS = [
  'identity',
  'identityId',
  'accessLevel',
  'brand1',
  'brand2',
  'brand3a',
  'brand3b',
  'orgZh',
  'orgEn',
  'orgSub',
  'welcomeBox',
  'footer',
  'voiceName',
]
export const COLOR_KEYS = ['accent', 'glitchA', 'glitchB']
/** @type {Record<string, string[]>} */
export const ENUMS = {
  mode: ['always', 'session', 'daily'],
  theme: ['light', 'dark'],
  voiceLang: ['en', 'zh', 'both'],
  sfx: ['audio', 'synth'],
  voiceSource: ['asset', 'tts'],
}
export const BOOL_KEYS = [
  'enabled',
  'requireInteraction',
  'allowSkip',
  'ambient',
  'sound',
  'voice',
  'voiceCue',
  'glass',
]

/** 数值字段的合法区间（越界即夹取）。 @type {Record<string, number[]>} */
export const RANGES = {
  speed: [0.35, 3],
  soundVolume: [0, 1],
  voiceRate: [0.5, 2],
  voiceLead: [0, 1200],
  voicePitch: [0, 2],
  voiceVolume: [0, 1],
  glassOpacity: [0.15, 0.95],
  glassBlur: [0, 60],
  glassSaturate: [100, 200],
  glassBackdropBlur: [0, 80],
}

/* 动画里的身份名称最多显示 48 个字符；设置页按同一上限截断，避免存进去的和看到的不一致。 */
export const IDENTITY_MAX = 48
/* 身份编号只保留 12 位字母数字，输入框和保存规则共用这个上限。 */
export const IDENTITY_ID_MAX = 12
/* 其余文案字段的通用上限。 */
export const TEXT_MAX = 64

/**
 * 身份编号只保留字母和数字：动画里的等宽排版放不下符号，
 * 编号留空时从身份名称派生，纯中文名派生不出来就退回 OPERATOR。
 *
 * @param {any} value
 * @param {any} identity
 * @returns {string}
 */
export function normalizeIdentityId(value, identity) {
  const id = String(value || identity || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, IDENTITY_ID_MAX)
  return id || 'OPERATOR'
}

/**
 * 把任意输入收敛成一份合法配置：未知字段忽略，越界值夹取，非法值回落默认。
 *
 * @param {any} input
 * @returns {Record<string, any>}
 */
export function normalize(input) {
  /** @type {Record<string, any>} */
  const out = { ...DEFAULTS }
  const src = input && typeof input === 'object' ? input : {}
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in src) || src[key] === undefined || src[key] === null) continue
    const value = src[key]
    if (BOOL_KEYS.includes(key)) {
      out[key] = value === true || value === 'true' || value === 1 || value === '1'
    } else if (ENUMS[key]) {
      out[key] = ENUMS[key].includes(value) ? value : DEFAULTS[key]
    } else if (RANGES[key]) {
      const [lo, hi] = RANGES[key]
      const n = Number(value)
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key]
    } else if (COLOR_KEYS.includes(key)) {
      const s = String(value).trim()
      out[key] = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s) ? s : DEFAULTS[key]
    } else if (TEXT_KEYS.includes(key)) {
      out[key] = String(value).slice(0, key === 'identity' ? IDENTITY_MAX : TEXT_MAX)
    } else {
      out[key] = value
    }
  }
  if (!String(out.identity).trim()) out.identity = DEFAULTS.identity
  out.identityId = normalizeIdentityId(out.identityId, out.identity)
  return out
}
