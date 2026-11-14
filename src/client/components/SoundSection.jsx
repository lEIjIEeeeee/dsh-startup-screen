import { num } from '../format.js'
import { Field } from './Field.jsx'
import { PanelPage } from './PanelPage.jsx'
import { Range } from './Range.jsx'
import { Select } from './Select.jsx'
import { Switch } from './Switch.jsx'
import { VoiceGroup } from './VoiceGroup.jsx'

/** 声音页：语音播报与界面音效（同一个设置分组）。 */
export function SoundSection({ active, draft, onChange, onPreview }) {
  return (
    <PanelPage name="sound" active={active}>
      <VoiceGroup draft={draft} onChange={onChange} onPreview={onPreview}>
        <div className="__ss_subTitle">界面音效</div>
        <Switch
          label="界面音效"
          hint="按钮、过场和结尾的提示音。"
          checked={draft.sound}
          onChange={(v) => onChange('sound', v)}
        />
        {draft.sound ? (
          <Field label="音效来源" hint="内置素材优先；也可以现场合成。">
            <Select
              value={draft.sfx || 'audio'}
              options={[
                ['audio', '内置素材（推荐）'],
                ['synth', '现场合成'],
              ]}
              onChange={(v) => onChange('sfx', v)}
            />
          </Field>
        ) : null}
        {draft.sound ? (
          <Field label="音效音量">
            <Range
              value={num(draft.soundVolume, 0.5)}
              min={0}
              max={1}
              display={Math.round(num(draft.soundVolume, 0.5) * 100) + '%'}
              onChange={(v) => onChange('soundVolume', v)}
            />
          </Field>
        ) : null}
      </VoiceGroup>
    </PanelPage>
  )
}
