import { useEffect, useState } from 'react'
import { readVoices, voiceMark } from '../voice.js'
import { Select } from './Select.jsx'

export function VoicePicker({ value, onChange, onPreview }) {
  const [list, setList] = useState(readVoices)

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
  const opts = [['', '自动（优先神经网络女声）' + (auto ? ' → ' + auto : '')]].concat(
    list.map((v) => {
      const name = String(v.name || '').toLowerCase()
      return [v.name, voiceMark(name) + v.name + ' · ' + (v.lang || '')]
    }),
  )

  return (
    <div className="__ss_field">
      <label className="__ss_label">音色</label>
      <div className="__ss_row">
        <Select value={value || ''} options={opts} onChange={onChange} />
        <button className="__ss_btn" type="button" onClick={onPreview}>
          试听
        </button>
      </div>
      <div className="__ss_hint">
        {list.length ? '★ 推荐 · ♀ 女声 · 共 ' + list.length + ' 个' : '暂时读不到系统音色。'}
      </div>
    </div>
  )
}
