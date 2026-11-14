/* 语音：读系统里可用的音色，女声排在前面。
   打分规则必须和启动动画运行时一致，否则面板推荐的音色和实际念出来的不是同一个。 */
const NATURAL_HINTS = ['natural', 'neural', 'online', 'premium', 'enhanced', 'siri', 'google']
const FEMALE_HINTS = [
  'aria',
  'jenny',
  'michelle',
  'emma',
  'ava',
  'libby',
  'sonia',
  'maisie',
  'zira',
  'samantha',
  'karen',
  'moira',
  'tessa',
  'victoria',
  'serena',
  'allison',
  'susan',
  'fiona',
  'hazel',
  'female',
  'woman',
  'xiaoxiao',
  'xiaoyi',
  'xiaomo',
  'huihui',
  'yaoyao',
  '晓晓',
  '晓伊',
  '女声',
]
const MALE_HINTS = [
  'david',
  'mark',
  'guy',
  'ryan',
  'george',
  'daniel',
  'alex',
  'fred',
  'male',
  'yunxi',
  'yunjian',
  'kangkang',
]

export function hits(name, list) {
  for (let i = 0; i < list.length; i++) if (name.indexOf(list[i]) !== -1) return true
  return false
}

/** 面板下拉里的推荐标记：★ 神经网络音色，♀ 女声。 */
export function voiceMark(name) {
  if (hits(name, NATURAL_HINTS)) return '★ '
  if (hits(name, FEMALE_HINTS)) return '♀ '
  return ''
}

/** 神经网络音色优先，其次女声，最后剔掉男声。 */
function scoreVoice(name, lang, want) {
  let sc = 0
  if (hits(name, NATURAL_HINTS)) sc += 60
  if (hits(name, FEMALE_HINTS)) sc += 40
  if (hits(name, MALE_HINTS)) sc -= 45
  if (String(lang || '').indexOf(want) === 0) sc += 25
  return sc
}

export function readVoices() {
  try {
    const s = window.speechSynthesis
    if (!s || typeof s.getVoices !== 'function') return []
    const list = s.getVoices() || []
    const want = 'en'
    const scored = list.map((v, i) => {
      const name = String(v.name || '').toLowerCase()
      return {
        v,
        natural: hits(name, NATURAL_HINTS),
        female: hits(name, FEMALE_HINTS),
        sc: scoreVoice(name, String(v.lang || '').toLowerCase(), want),
        i,
      }
    })
    scored.sort((a, b) => {
      if (a.sc !== b.sc) return b.sc - a.sc
      return a.i - b.i
    })
    return scored.map((x) => x.v)
  } catch (e) {
    return []
  }
}

export function speakSample(text, draft) {
  try {
    const s = window.speechSynthesis
    if (!s) return false
    s.cancel()
    const u = new window.SpeechSynthesisUtterance(text || 'Access permission required.')
    const list = readVoices()
    let target = null
    for (let i = 0; i < list.length; i++) if (list[i].name === draft.voiceName) target = list[i]
    if (target) {
      u.voice = target
      u.lang = target.lang
    }
    u.rate = Math.min(2, Math.max(0.5, Number(draft.voiceRate) || 1))
    u.pitch = Math.min(2, Math.max(0, Number(draft.voicePitch) || 1))
    u.volume = Math.min(
      1,
      Math.max(
        0,
        draft.voiceVolume == null || draft.voiceVolume === '' ? 0.9 : Number(draft.voiceVolume),
      ),
    )
    if (draft.voiceLang === 'zh') {
      u.text = '需要访问许可，验证通过。'
      u.lang = 'zh-CN'
    }
    s.speak(u)
    return true
  } catch (e) {
    return false
  }
}
