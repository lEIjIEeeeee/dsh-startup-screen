/**
 * 音色打分：面板推荐与实际播报必须用同一套规则。
 *
 * 神经网络音色优先，其次女声，最后剔掉男声；语种吻合、本地音色、默认音色加分。
 * 纯数据与纯函数，不依赖 window / speechSynthesis。
 */

export const NATURAL_HINTS = [
  'natural',
  'neural',
  'online',
  'premium',
  'enhanced',
  'siri',
  'google',
]

export const FEMALE_HINTS = [
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

export const MALE_HINTS = [
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

/**
 * 名字里是否命中某个提示词。
 *
 * @param {string} name
 * @param {string[]} list
 * @returns {boolean}
 */
export function hits(name, list) {
  for (let i = 0; i < list.length; i++) if (name.indexOf(list[i]) !== -1) return true
  return false
}

/**
 * 给一个音色打分；`want` 传 'en' / 'zh' 这样的两字母前缀。
 *
 * @param {{ name?: string, lang?: string, localService?: boolean, default?: boolean }} voice
 * @param {string} want
 * @returns {number}
 */
export function scoreVoice(voice, want) {
  const name = String(voice.name || '').toLowerCase()
  const lang = String(voice.lang || '').toLowerCase()
  let sc = 0
  if (hits(name, NATURAL_HINTS)) sc += 60
  if (hits(name, FEMALE_HINTS)) sc += 40
  if (hits(name, MALE_HINTS)) sc -= 45
  if (lang.indexOf(want) === 0) sc += 25
  if (voice.localService) sc += 4 /* 本地音色起播快，不会先卡半秒 */
  if (voice.default) sc += 3
  return sc
}

/**
 * 从候选里挑分数最高的一个。
 *
 * @template {{ name?: string, lang?: string, localService?: boolean, default?: boolean }} T
 * @param {T[]} voices
 * @param {string} want
 * @returns {T|null}
 */
export function pickVoice(voices, want) {
  if (!voices || !voices.length) return null
  let pool = voices.filter(
    (v) =>
      String(v.lang || '')
        .toLowerCase()
        .indexOf(want) === 0,
  )
  if (!pool.length) pool = voices.slice()
  let best = null
  let bestScore = -1e9
  for (const voice of pool) {
    const sc = scoreVoice(voice, want)
    if (sc > bestScore) {
      bestScore = sc
      best = voice
    }
  }
  return best
}
