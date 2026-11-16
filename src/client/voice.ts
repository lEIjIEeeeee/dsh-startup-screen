/* 语音：读系统里可用的音色，女声排在前面。
   打分规则必须和启动动画运行时一致，否则面板推荐的音色和实际念出来的不是同一个。 */
import type { StartupConfig } from '../shared/types.js'
import { FEMALE_HINTS, NATURAL_HINTS, findVoiceByName, hits, scoreVoice } from '../shared/voice.js'
import { num } from './format.js'

/** 面板下拉里的推荐标记：★ 神经网络音色，♀ 女声。 */
export function voiceMark(name: string): string {
  if (hits(name, NATURAL_HINTS)) return '★ '
  if (hits(name, FEMALE_HINTS)) return '♀ '
  return ''
}

export function readVoices(): SpeechSynthesisVoice[] {
  try {
    const s = window.speechSynthesis
    if (!s || typeof s.getVoices !== 'function') return []
    const list = s.getVoices() || []
    const scored = list.map((v, i) => ({
      v,
      sc: scoreVoice(v, 'en'),
      i,
    }))
    scored.sort((a, b) => {
      if (a.sc !== b.sc) return b.sc - a.sc
      return a.i - b.i
    })
    return scored.map((x) => x.v)
  } catch (e) {
    return []
  }
}

function makeUtterance(
  text: string,
  langPrefix: string,
  fallbackLang: string,
  draft: StartupConfig,
  list: SpeechSynthesisVoice[],
): SpeechSynthesisUtterance {
  const u = new window.SpeechSynthesisUtterance(text)
  const target = findVoiceByName(list, draft.voiceName, langPrefix)
  if (target) {
    u.voice = target
    u.lang = target.lang || fallbackLang
  } else {
    u.lang = fallbackLang
  }
  u.rate = Math.min(2, Math.max(0.5, Number(draft.voiceRate) || 1))
  u.pitch = Math.min(2, Math.max(0, Number(draft.voicePitch) || 1))
  u.volume = Math.min(1, Math.max(0, num(draft.voiceVolume, 0.9)))
  return u
}

export function speakSample(text: string | null | undefined, draft: StartupConfig): boolean {
  try {
    const s = window.speechSynthesis
    if (!s) return false
    s.cancel()
    const list = readVoices()
    const mode = draft.voiceLang
    const enText = text || 'Access permission required.'
    /* 与运行时一致：both 先中文后英文，zh 只念中文 */
    if (mode === 'zh' || mode === 'both') {
      s.speak(makeUtterance('需要访问许可，验证通过。', 'zh', 'zh-CN', draft, list))
    }
    if (mode !== 'zh') {
      s.speak(makeUtterance(enText, 'en', 'en-US', draft, list))
    }
    return true
  } catch (e) {
    return false
  }
}
