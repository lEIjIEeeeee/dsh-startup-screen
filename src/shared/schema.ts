import { DEFAULTS } from './defaults.js'
import type { StartupConfig } from './types.js'

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
] as const
export const COLOR_KEYS = ['accent', 'glitchA', 'glitchB'] as const
export const ENUMS: Record<string, readonly string[]> = {
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
] as const

/* 语音提示音之后留白的上限；设置页滑条和运行时夹取共用。 */
export const VOICE_LEAD_MAX = 1200

/** 数值字段的合法区间（越界即夹取）。 */
export const RANGES: Record<string, readonly [number, number]> = {
  speed: [0.35, 3],
  soundVolume: [0, 1],
  voiceRate: [0.5, 2],
  voiceLead: [0, VOICE_LEAD_MAX],
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
/* 音色名来自系统语音列表，比手写文案长得多（常见 "Microsoft ... Online (Natural)"），按 128 位截断。 */
export const VOICE_NAME_MAX = 128
/* 左上副标题只有一行，40 位是排版能容纳的上限。 */
export const BRAND2_MAX = 40

/* 各文案字段的实际上限；没列出的走 TEXT_MAX。 */
const TEXT_LIMITS: Record<string, number> = {
  identity: IDENTITY_MAX,
  voiceName: VOICE_NAME_MAX,
  brand2: BRAND2_MAX,
}

/**
 * 身份编号只保留字母和数字：动画里的等宽排版放不下符号，
 * 编号留空时从身份名称派生，纯中文名派生不出来就退回 OPERATOR。
 */
export function normalizeIdentityId(value: unknown, identity: unknown): string {
  const id = String(value || identity || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, IDENTITY_ID_MAX)
  return id || 'OPERATOR'
}

/**
 * 把任意输入收敛成一份合法配置：未知字段忽略，越界值夹取，非法值回落默认。
 */
export function normalize(input: unknown): StartupConfig {
  const out: StartupConfig = { ...DEFAULTS }
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  /* 动态按 key 写入时 TS 无法逐字段收窄，先落到 Record，返回时仍是 StartupConfig。 */
  const bag = out as unknown as Record<string, unknown>
  for (const key of Object.keys(DEFAULTS) as Array<keyof StartupConfig>) {
    if (!(key in src) || src[key] === undefined || src[key] === null) continue
    const value = src[key]
    if ((BOOL_KEYS as readonly string[]).includes(key)) {
      bag[key] = value === true || value === 'true' || value === 1 || value === '1'
    } else if (ENUMS[key]) {
      bag[key] = ENUMS[key].includes(value as string) ? value : DEFAULTS[key]
    } else if (RANGES[key]) {
      const [lo, hi] = RANGES[key]
      const n = Number(value)
      bag[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key]
    } else if ((COLOR_KEYS as readonly string[]).includes(key)) {
      const s = String(value).trim()
      bag[key] = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s) ? s : DEFAULTS[key]
    } else if ((TEXT_KEYS as readonly string[]).includes(key)) {
      bag[key] = String(value).slice(0, TEXT_LIMITS[key] || TEXT_MAX)
    } else {
      bag[key] = value
    }
  }
  if (!String(out.identity).trim()) out.identity = DEFAULTS.identity
  out.identityId = normalizeIdentityId(out.identityId, out.identity)
  return out
}
