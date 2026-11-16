/** 全仓库共用的数据类型；运行时没有任何代码。 */

export type PlayMode = 'always' | 'session' | 'daily'
export type Theme = 'light' | 'dark'
export type VoiceLang = 'en' | 'zh' | 'both'
export type SfxSource = 'audio' | 'synth'
export type VoiceSource = 'asset' | 'tts'

/** 一份完整的启动配置；默认值见 defaults.ts，校验规则见 schema.ts。 */
export interface StartupConfig {
  enabled: boolean
  mode: PlayMode
  theme: Theme
  speed: number
  requireInteraction: boolean
  allowSkip: boolean
  ambient: boolean
  sound: boolean
  soundVolume: number
  voice: boolean
  voiceLang: VoiceLang
  voiceName: string
  voiceRate: number
  voicePitch: number
  voiceVolume: number
  voiceCue: boolean
  sfx: SfxSource
  voiceSource: VoiceSource
  voiceLead: number
  identity: string
  identityId: string
  accessLevel: string
  brand1: string
  brand2: string
  brand3a: string
  brand3b: string
  orgZh: string
  orgEn: string
  orgSub: string
  welcomeBox: string
  footer: string
  accent: string
  glitchA: string
  glitchB: string
  glass: boolean
  glassOpacity: number
  glassBlur: number
  glassSaturate: number
  glassBackdropBlur: number
}

/** 启动界面要显示的真实信息；取不到的字段留空，页面显示 "—"。 */
export interface Facts {
  ready: boolean
  profile?: string | null
  version?: string | null
  model?: string | null
  sandbox?: string | null
  bundleCount?: number | null
  sessions?: number
  sessionsArchived?: number
  sessionsTotal?: number
  hash?: string
}

/** 宿主侧的 facts 缓存；宿主只创建一次，浏览器轮询读取。 */
export interface FactsCache {
  value: Facts | null
  started: boolean
}

/** 系统语音的最小形状；SpeechSynthesisVoice 结构上兼容。 */
export interface Voice {
  name?: string
  lang?: string
  localService?: boolean
  default?: boolean
}
