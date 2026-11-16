import type { PanelTab, VersionInfo } from './types.js'

/* 左侧导航：五个页面，点击切页；右侧内容独立滚动，底部操作栏固定。
   用 Record<PanelTab, string> 保证新增页签时这里不会漏项。 */
const PAGES: Record<PanelTab, string> = {
  play: '播放',
  appearance: '外观',
  sound: '声音',
  content: '内容',
  about: '关于',
}
const TABS = Object.keys(PAGES) as PanelTab[]

export interface PanelNavProps extends VersionInfo {
  tab: PanelTab
  switchTab: (tab: PanelTab) => void
}

/**
 * 导航项保持原生 button：它们的版式完全由 __ss_navItem 控制，
 * 套宿主的 Button 会带进胶囊高度/居中排版，反而要写一堆重置。
 */
export function PanelNav({ tab, version, buildVersion, switchTab }: PanelNavProps) {
  return (
    <nav className="__ss_nav" aria-label="启动动画设置">
      <div className="__ss_navTitle">启动动画</div>
      {TABS.map((key) => (
        <button
          key={key}
          id={'__ss_tab_' + key}
          type="button"
          className={'__ss_navItem' + (tab === key ? ' __ss_navItemActive' : '')}
          aria-controls={'__ss_page_' + key}
          aria-current={tab === key ? 'page' : undefined}
          onClick={() => switchTab(key)}
        >
          {PAGES[key]}
        </button>
      ))}
      <div className="__ss_navVersion">{'v' + (version || buildVersion)}</div>
    </nav>
  )
}
