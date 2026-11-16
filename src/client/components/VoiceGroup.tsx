import type { ReactNode } from 'react'
import { VOICE_LEAD_MAX } from '../../shared/schema.js'
import type { StartupConfig } from '../../shared/types.js'
import { num } from '../format.js'
import { Button } from '../ui/Button.js'
import { Field } from './Field.js'
import { Range } from './Range.js'
import { Select } from './Select.js'
import { Switch } from './Switch.js'
import { VoicePicker } from './VoicePicker.js'
import type { SectionProps } from './types.js'

/* 「电影旁白」档：压低语速与音调，自动挑神经网络女声，保留提示音和开口留白。 */
const MOVIE_PRESET: Pick<
  StartupConfig,
  'voiceRate' | 'voicePitch' | 'voiceName' | 'voiceCue' | 'voiceLead'
> = {
  voiceRate: 0.88,
  voicePitch: 0.85,
  voiceName: '',
  voiceCue: true,
  voiceLead: 240,
}

export interface VoiceGroupProps extends Pick<SectionProps, 'draft' | 'onChange'> {
  onPreview: () => void
  children?: ReactNode
}

/** 语音播报分组：开关、来源、语言、音色与语速/音调；界面音效作为子节点接在后面。 */
export function VoiceGroup({ draft, onChange, onPreview, children }: VoiceGroupProps) {
  return (
    <div className="__ss_group" id="__ss_group_voice">
      <div className="__ss_groupTitle">声音</div>
      <div className="__ss_subTitle">语音播报</div>
      <Switch
        label="女声播报（念每一行的英文）"
        hint="文字出现时同步念出英文旁白。"
        checked={draft.voice}
        onChange={(v) => onChange('voice', v)}
      />
      <Field label="语音来源" hint="内置真声优先；缺失时自动用系统语音。">
        <Select
          value={draft.voiceSource || 'asset'}
          options={[
            ['asset', '真声素材（推荐）'],
            ['tts', '系统 TTS 合成'],
          ]}
          onChange={(v) => onChange('voiceSource', v)}
        />
      </Field>
      <Field label="播报语言">
        <Select
          value={draft.voiceLang}
          options={[
            ['en', '英语（照参考片）'],
            ['zh', '中文'],
            ['both', '中英各念一遍'],
          ]}
          onChange={(v) => onChange('voiceLang', v)}
        />
      </Field>
      {draft.voice ? (
        <VoicePicker
          value={draft.voiceName}
          onChange={(v) => onChange('voiceName', v)}
          onPreview={onPreview}
        />
      ) : null}
      {draft.voice ? (
        <div className="__ss_row">
          <Button
            className="__ss_btn"
            onClick={() => {
              for (const key of Object.keys(MOVIE_PRESET) as Array<keyof typeof MOVIE_PRESET>) {
                onChange(key, MOVIE_PRESET[key])
              }
            }}
          >
            ↺ 套用「电影旁白」档
          </Button>
          <span className="__ss_hint">
            语速 0.88 · 音调 0.85（压抑、深沉）· 自动挑神经网络女声 · 提示音 + 开口留白
          </span>
        </div>
      ) : null}
      {draft.voice ? (
        <div className="__ss_two">
          <Field label="语速">
            <Range
              value={num(draft.voiceRate, 1)}
              min={0.5}
              max={2}
              display={num(draft.voiceRate, 1).toFixed(2) + '×'}
              onChange={(v) => onChange('voiceRate', v)}
            />
          </Field>
          <Field label="音调">
            <Range
              value={num(draft.voicePitch, 1)}
              min={0}
              max={2}
              display={num(draft.voicePitch, 1).toFixed(2)}
              onChange={(v) => onChange('voicePitch', v)}
            />
          </Field>
        </div>
      ) : null}
      {draft.voice ? (
        <Field label="开口前留白" hint="提示音之后停顿多久再开口。">
          <Range
            value={num(draft.voiceLead, 240)}
            min={0}
            max={VOICE_LEAD_MAX}
            step={20}
            display={Math.round(num(draft.voiceLead, 240)) + ' ms'}
            onChange={(v) => onChange('voiceLead', v)}
          />
        </Field>
      ) : null}
      {draft.voice ? (
        <Field label="音量">
          <Range
            value={num(draft.voiceVolume, 0.9)}
            min={0}
            max={1}
            display={Math.round(num(draft.voiceVolume, 0.9) * 100) + '%'}
            onChange={(v) => onChange('voiceVolume', v)}
          />
        </Field>
      ) : null}
      {draft.voice ? (
        <Switch
          label="播报前提示音"
          hint="开口前响两声轻提示。"
          checked={draft.voiceCue}
          onChange={(v) => onChange('voiceCue', v)}
        />
      ) : null}
      {children}
    </div>
  )
}
