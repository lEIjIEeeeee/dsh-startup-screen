import { Button } from '../ui/Button.js'
import { VersionLine } from './VersionLine.js'

export interface PanelSkeletonProps {
  version: string
  buildVersion: string
  error: string | null
  onRetry: () => void
}

/** 配置接口还没返回时的骨架：版本号先显示，读取失败给重试按钮。 */
export function PanelSkeleton({ version, buildVersion, error, onRetry }: PanelSkeletonProps) {
  return (
    <div className="__ss_root">
      <VersionLine version={version} buildVersion={buildVersion} />
      <div className="__ss_status" role={error ? 'alert' : 'status'}>
        {error ? error : '读取配置中…'}
      </div>
      {error ? (
        <div className="__ss_actions">
          <Button className="__ss_btn" onClick={onRetry}>
            重试
          </Button>
        </div>
      ) : null}
    </div>
  )
}
