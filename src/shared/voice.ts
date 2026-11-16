/**
 * 音色打分：面板推荐与实际播报必须用同一套规则。
 *
 * 神经网络音色优先，其次女声，最后剔掉男声；语种吻合、本地音色、默认音色加分。
 * 纯数据与纯函数，不依赖 window / speechSynthesis。
 */
import type { Voice } from './types.js'

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
 */
export function hits(name: string, list: readonly string[]): boolean {
  for (let i = 0; i < list.length; i++) if (name.indexOf(list[i]) !== -1) return true
  return false
}

/**
 * 语种前缀是否吻合；`want` 是 'en' / 'zh' 这样的两字母前缀。
 */
export function langMatches(lang: string | undefined, want: string): boolean {
  return (
    String(lang || '')
      .toLowerCase()
      .indexOf(want) === 0
  )
}

/**
 * 给一个音色打分；`want` 传 'en' / 'zh' 这样的两字母前缀。
 */
export function scoreVoice(voice: Voice, want: string): number {
  const name = String(voice.name || '').toLowerCase()
  let sc = 0
  if (hits(name, NATURAL_HINTS)) sc += 60
  if (hits(name, FEMALE_HINTS)) sc += 40
  if (hits(name, MALE_HINTS)) sc -= 45
  if (langMatches(voice.lang, want)) sc += 25
  if (voice.localService) sc += 4 /* 本地音色起播快，不会先卡半秒 */
  if (voice.default) sc += 3
  return sc
}

/**
 * 从候选里挑分数最高的一个。
 */
export function pickVoice<T extends Voice>(
  voices: readonly T[] | null | undefined,
  want: string,
): T | null {
  if (!voices || !voices.length) return null
  let pool = voices.filter((v) => langMatches(v.lang, want))
  if (!pool.length) pool = voices.slice()
  let best: T | null = null
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

/**
 * 按用户指定的音色名精确匹配，并限定语种前缀；没指定或没命中返回 null。
 */
export function findVoiceByName<T extends Voice>(
  voices: readonly T[] | null | undefined,
  name: string,
  want: string,
): T | null {
  if (!name || !voices || !voices.length) return null
  for (const voice of voices) {
    if (voice.name === name && langMatches(voice.lang, want)) return voice
  }
  return null
}
