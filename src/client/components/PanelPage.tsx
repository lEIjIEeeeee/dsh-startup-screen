import type { ReactNode } from 'react'

export interface PanelPageProps {
  name: string
  active: boolean
  children: ReactNode
}

/**
 * 一个页签的内容容器：非当前页只隐藏，不卸载，切页时保留滚动位置和输入状态。
 */
export function PanelPage({ name, active, children }: PanelPageProps) {
  return (
    <div
      className="__ss_page"
      id={'__ss_page_' + name}
      role="region"
      aria-labelledby={'__ss_tab_' + name}
      hidden={!active}
    >
      {children}
    </div>
  )
}
