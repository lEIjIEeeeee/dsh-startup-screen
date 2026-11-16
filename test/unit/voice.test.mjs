import test from 'node:test'
import assert from 'node:assert/strict'
import { findVoiceByName, pickVoice, scoreVoice } from '../../src/shared/voice.js'

test('神经网络女声 + 语种吻合得分最高', () => {
  const score = scoreVoice({ name: 'Microsoft Aria Online (Natural)', lang: 'en-US' }, 'en')
  assert.equal(score, 60 + 40 + 25)
})

test('男声被扣分，本地与默认音色小幅加分', () => {
  assert.equal(scoreVoice({ name: 'Microsoft David', lang: 'en-US' }, 'en'), -45 + 25)
  assert.equal(
    scoreVoice({ name: 'Voice', lang: 'en-US', localService: true, default: true }, 'en'),
    25 + 4 + 3,
  )
})

test('pickVoice 只在语种吻合的候选里挑', () => {
  const en = { name: 'Microsoft Aria Online (Natural)', lang: 'en-US' }
  const zh = { name: 'Microsoft Huihui', lang: 'zh-CN' }
  assert.equal(pickVoice([en, zh], 'zh'), zh)
})

test('语种都不吻合时退回全部候选', () => {
  const en = { name: 'Microsoft Aria Online (Natural)', lang: 'en-US' }
  const zh = { name: 'Microsoft Huihui', lang: 'zh-CN' }
  assert.equal(pickVoice([zh, en], 'fr'), en)
})

test('空列表返回 null', () => {
  assert.equal(pickVoice([], 'en'), null)
  assert.equal(pickVoice(null, 'en'), null)
})

test('按名字精确匹配指定音色，并要求语种前缀吻合', () => {
  const en = { name: 'Microsoft Aria', lang: 'en-US' }
  const zh = { name: 'Microsoft Aria', lang: 'zh-CN' }
  assert.equal(findVoiceByName([zh, en], 'Microsoft Aria', 'en'), en)
  assert.equal(findVoiceByName([zh], 'Microsoft Aria', 'en'), null)
  assert.equal(findVoiceByName([en], '', 'en'), null)
  assert.equal(findVoiceByName(null, 'Microsoft Aria', 'en'), null)
})
