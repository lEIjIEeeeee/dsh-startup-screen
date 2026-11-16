import { useEffect, useState } from 'react'
import { readVoices, voiceMark } from '../voice.js'
import { Button } from '../ui/Button.js'
import { Field } from './Field.js'
import { Select } from './Select.js'

export interface VoicePickerProps {
  value: string
  onChange: (value: string) => void
  onPreview: () => void
}

export function VoicePicker({ value, onChange, onPreview }: VoicePickerProps) {
  const [list, setList] = useState<SpeechSynthesisVoice[]>(readVoices)

  useEffect(() => {
    const s = window.speechSynthesis
    if (!s) return
    const on = () => setList(readVoices())
    try {
      s.addEventListener('voiceschanged', on)
    } catch (e) {
      /* noop */
    }
    const t = setTimeout(on, 400)
    return () => {
      try {
        s.removeEventListener('voiceschanged', on)
      } catch (e) {
        /* noop */
      }
      clearTimeout(t)
    }
  }, [])

  const auto = window.__DSH_STARTUP_API__ && window.__DSH_STARTUP_API__.voice
  const opts: Array<[string, string]> = [
    ['', '自动（优先神经网络女声）' + (auto ? ' → ' + auto : '')],
  ]
  for (const v of list) {
    const name = String(v.name || '').toLowerCase()
    opts.push([v.name, voiceMark(name) + v.name + ' · ' + (v.lang || '')])
  }

  return (
    <Field
      label="音色"
      hint={list.length ? '★ 推荐 · ♀ 女声 · 共 ' + list.length + ' 个' : '暂时读不到系统音色。'}
    >
      <div className="__ss_row">
        <Select value={value || ''} options={opts} onChange={onChange} />
        <Button className="__ss_btn" onClick={onPreview}>
          试听
        </Button>
      </div>
    </Field>
  )
}
