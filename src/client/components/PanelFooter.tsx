import { Button } from '../ui/Button.js'

export interface PanelFooterProps {
  busy: boolean
  dirty: boolean
  notice: string | null
  error: string | null
  onSave: () => void
  onPreview: () => void
  onReset: () => void
}

/** 底部固定操作栏：保存 / 立即预览 / 恢复默认，外加状态提示。 */
export function PanelFooter({
  busy,
  dirty,
  notice,
  error,
  onSave,
  onPreview,
  onReset,
}: PanelFooterProps) {
  return (
    <div className="__ss_footer">
      <div className="__ss_actions">
        <Button className="__ss_btn __ss_btnPrimary" disabled={busy} onClick={onSave}>
          {busy ? '处理中…' : '保存'}
        </Button>
        <Button className="__ss_btn" onClick={onPreview}>
          立即预览
        </Button>
        <Button className="__ss_btn" disabled={busy} onClick={onReset}>
          恢复默认
        </Button>
      </div>
      <div className="__ss_barHint">
        关闭弹窗不会保存；保存后下次启动生效；「立即预览」使用当前修改（不写盘）。
        {dirty ? <span className="__ss_dirty"> ● 未保存</span> : null}
        {notice ? (
          <span className="__ss_ok" role="status">
            {notice}
          </span>
        ) : null}
        {error ? (
          <span className="__ss_err" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  )
}
