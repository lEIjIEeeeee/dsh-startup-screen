import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BOOL_KEYS,
  BRAND2_MAX,
  COLOR_KEYS,
  ENUMS,
  IDENTITY_MAX,
  RANGES,
  TEXT_KEYS,
  TEXT_MAX,
  VOICE_NAME_MAX,
  normalize,
  normalizeIdentityId,
} from '../../src/shared/schema.js'
import { DEFAULTS } from '../../src/shared/defaults.js'

test('空输入回落默认值，且不产生未知字段', () => {
  const out = normalize(undefined)
  assert.equal(out.mode, DEFAULTS.mode)
  assert.equal(out.speed, DEFAULTS.speed)
  assert.equal(out.identity, DEFAULTS.identity)
  assert.equal('nope' in normalize({ nope: 1 }), false)
})

test('布尔字段接受 true / "true" / 1 / "1"', () => {
  for (const value of [true, 'true', 1, '1']) {
    assert.equal(normalize({ enabled: value }).enabled, true, String(value))
  }
  assert.equal(normalize({ enabled: 'false' }).enabled, false)
  assert.equal(normalize({ enabled: 0 }).enabled, false)
})

test('枚举字段非法值回落默认，合法值原样保留', () => {
  assert.equal(normalize({ mode: 'weekly' }).mode, DEFAULTS.mode)
  assert.equal(normalize({ mode: 'daily' }).mode, 'daily')
  assert.equal(normalize({ theme: 'dark' }).theme, 'dark')
  assert.equal(normalize({ voiceSource: 'tts' }).voiceSource, 'tts')
})

test('数值字段越界夹取，非数字回落默认', () => {
  assert.equal(normalize({ speed: 99 }).speed, 3)
  assert.equal(normalize({ speed: -1 }).speed, 0.35)
  assert.equal(normalize({ soundVolume: '0.7' }).soundVolume, 0.7)
  assert.equal(normalize({ voiceLead: 'abc' }).voiceLead, DEFAULTS.voiceLead)
  assert.equal(normalize({ glassSaturate: 500 }).glassSaturate, 200)
})

test('颜色只接受十六进制，非法值回落默认', () => {
  assert.equal(normalize({ accent: '#abc' }).accent, '#abc')
  assert.equal(normalize({ accent: ' #FF7500 ' }).accent, '#FF7500')
  assert.equal(normalize({ accent: 'red' }).accent, DEFAULTS.accent)
  assert.equal(normalize({ accent: '#12345' }).accent, DEFAULTS.accent)
})

test('文案按各自上限截断', () => {
  assert.equal(normalize({ identity: 'x'.repeat(200) }).identity.length, IDENTITY_MAX)
  assert.equal(normalize({ voiceName: 'x'.repeat(300) }).voiceName.length, VOICE_NAME_MAX)
  assert.equal(normalize({ brand2: 'x'.repeat(100) }).brand2.length, BRAND2_MAX)
  assert.equal(normalize({ orgEn: 'x'.repeat(100) }).orgEn.length, TEXT_MAX)
})

test('空白身份名回落到默认身份', () => {
  assert.equal(normalize({ identity: '   ' }).identity, DEFAULTS.identity)
})

test('每个默认字段都归入且只归入一个校验分组', () => {
  const groups = [
    ...BOOL_KEYS,
    ...Object.keys(ENUMS),
    ...Object.keys(RANGES),
    ...COLOR_KEYS,
    ...TEXT_KEYS,
  ]
  const missing = Object.keys(DEFAULTS).filter((key) => !groups.includes(key))
  assert.deepEqual(missing, [], '缺少分组的字段：' + missing.join(', '))
  assert.equal(new Set(groups).size, groups.length, '字段不能同时归入多个分组')
})

test('身份编号只保留字母数字并大写', () => {
  assert.equal(normalizeIdentityId('ab-12!', 'x'), 'AB12')
  assert.equal(normalizeIdentityId('', 'joyce moore'), 'JOYCEMOORE')
  assert.equal(normalizeIdentityId('', '中文名'), 'OPERATOR')
  assert.equal(normalizeIdentityId('abcdefghijklmnop', '').length, 12)
})
