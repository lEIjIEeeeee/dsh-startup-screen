import type { StartupConfig } from '../../shared/types.js'

export type ConfigKey = keyof StartupConfig

/** 五个页签共用的 props：当前页是否激活、当前配置、字段更新函数。 */
export interface SectionProps {
  active: boolean
  draft: StartupConfig
  onChange: <K extends ConfigKey>(key: K, value: StartupConfig[K]) => void
}

export type PanelTab = 'play' | 'appearance' | 'sound' | 'content' | 'about'

/** 面板顶部 / 关于页共用的版本对。 */
export interface VersionInfo {
  version: string
  buildVersion: string
}
