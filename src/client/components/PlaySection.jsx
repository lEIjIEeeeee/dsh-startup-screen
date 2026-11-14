import { Field } from './Field.jsx'
import { PanelPage } from './PanelPage.jsx'
import { Range } from './Range.jsx'
import { Select } from './Select.jsx'
import { Switch } from './Switch.jsx'

const MODE_OPTIONS = [
  ['session', '每个浏览器会话一次'],
  ['daily', '每天一次'],
  ['always', '每次打开都播放'],
]

/** 播放页：启用开关、播放时机、速度，以及交互相关的两个开关。 */
export function PlaySection({ active, draft, onChange }) {
  return (
    <PanelPage name="play" active={active}>
      <div className="__ss_group" id="__ss_group_play">
        <div className="__ss_groupTitle">播放</div>
        <Switch
          label="启用启动动画"
          hint="关闭后直接进入主界面。"
          checked={draft.enabled}
          onChange={(v) => onChange('enabled', v)}
        />
        <Field label="播放时机">
          <Select value={draft.mode} options={MODE_OPTIONS} onChange={(v) => onChange('mode', v)} />
        </Field>
        <Field label="速度倍率" hint="0.35 慢放 · 1 原速 · 3 快放；默认约 16 秒。">
          <Range
            value={draft.speed}
            min={0.35}
            max={3}
            step={0.05}
            display={Number(draft.speed).toFixed(2) + '×'}
            onChange={(v) => onChange('speed', v)}
          />
        </Field>
      </div>

      <div className="__ss_group" id="__ss_group_interact">
        <div className="__ss_groupTitle">交互</div>
        <Switch
          label="需要人工确认"
          hint="第 1、2 步停下来等按钮或 Enter。"
          checked={draft.requireInteraction}
          onChange={(v) => onChange('requireInteraction', v)}
        />
        <Switch
          label="允许跳过"
          hint="右上角显示 SKIP，Esc 也能跳过。"
          checked={draft.allowSkip}
          onChange={(v) => onChange('allowSkip', v)}
        />
      </div>
    </PanelPage>
  )
}
