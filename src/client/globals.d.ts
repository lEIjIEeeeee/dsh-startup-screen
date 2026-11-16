/** 启动动画暴露给设置面板的最小 API。 */
interface StartupApi {
  voice?: string
  replay?: () => void
  skip?: () => void
  speak?: (en: string, zh?: string | null) => unknown
  speakName?: (name: string) => unknown
  finish?: () => void
  dispose?: () => void
  config?: Partial<import('../shared/types.js').RuntimeConfig>
}

interface Window {
  __DSH_STARTUP__?: Partial<import('../shared/types.js').RuntimeConfig>
  __DSH_STARTUP_VERSION__?: string
  __DSH_STARTUP_API__?: StartupApi
  __DSH_STARTUP_BOOT__?: 'index' | 'client'
  __DSH_STARTUP_SKIP__?: boolean
  __DSH_STARTUP_FAILED__?: boolean
  __DSH_STARTUP_LOADED__?: boolean
  __DSH_STARTUP_RUNNING__?: boolean
}
