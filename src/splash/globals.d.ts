/* splash 运行时自己读写的全局标记；其余 window 标记在 src/shared/globals.d.ts。 */
interface Window {
  __DSH_STARTUP_CHROME__?: any
  __DSH_STARTUP_FIELD__?: any
  __DSH_STARTUP_GEN__?: number
  __DSH_STARTUP_SCRIPT_URL__?: string
  __DSH_STARTUP_FINISHED__?: boolean
  __DSH_STARTUP_STALLED__?: boolean
  /* 旧版 Safari 前缀；根配置没有 DOM lib，这里不引用 AudioContext。 */
  webkitAudioContext?: any
}

/** 入口持有、生命周期模块按它清理的运行时部件。 */
interface SplashRuntime {
  timeline: { dispose: () => void; isFinished: () => boolean } | null
  facts: { dispose: () => void; current: () => Record<string, any> } | null
  voice: { stop: () => void } | null
  audio: { close: () => void } | null
}
