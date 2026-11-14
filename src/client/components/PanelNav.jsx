/* 左侧导航：五个页面，点击切页；右侧内容独立滚动，底部操作栏固定。 */
const PAGES = [
  ['play', '播放'],
  ['appearance', '外观'],
  ['sound', '声音'],
  ['content', '内容'],
  ['about', '关于'],
]

/**
 * 导航项保持原生 button：它们的版式完全由 __ss_navItem 控制，
 * 套宿主的 Button 会带进胶囊高度/居中排版，反而要写一堆重置。
 */
export function PanelNav({ tab, version, buildVersion, switchTab }) {
  return (
    <nav className="__ss_nav" aria-label="启动动画设置">
      <div className="__ss_navTitle">启动动画</div>
      {PAGES.map((p) => (
        <button
          key={p[0]}
          id={'__ss_tab_' + p[0]}
          type="button"
          className={'__ss_navItem' + (tab === p[0] ? ' __ss_navItemActive' : '')}
          aria-controls={'__ss_page_' + p[0]}
          aria-current={tab === p[0] ? 'page' : undefined}
          onClick={() => switchTab(p[0])}
        >
          {p[1]}
        </button>
      ))}
      <div className="__ss_navVersion">{'v' + (version || buildVersion)}</div>
    </nav>
  )
}
