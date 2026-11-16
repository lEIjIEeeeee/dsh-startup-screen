import { PanelPage } from './PanelPage.js'
import { VersionLine } from './VersionLine.js'

export interface AboutSectionProps {
  active: boolean
  version: string
  buildVersion: string
  file: string
}

/** 关于页：版本、配置文件位置与来源说明。 */
export function AboutSection({ active, version, buildVersion, file }: AboutSectionProps) {
  return (
    <PanelPage name="about" active={active}>
      <div className="__ss_group">
        <div className="__ss_groupTitle">关于</div>
        <VersionLine version={version} buildVersion={buildVersion} />
        {file ? <div className="__ss_barFile">配置文件：{file}</div> : null}
        <div className="__ss_hint">
          本仓库是 6shenhonghong9/dsh-startup-screen 的 fork；Canvas 光场等视觉方案参考
          QIFANAI/dsh-startup-screen 1.6.0（MIT）。
        </div>
        <div className="__ss_hint">
          「恢复默认」会覆盖当前所有设置；「立即预览」使用当前修改但不写盘。
        </div>
      </div>
    </PanelPage>
  )
}
