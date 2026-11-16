import { VOICE_LEAD_MAX } from '../../shared/schema.js'
import { findVoiceByName, pickVoice } from '../../shared/voice.js'
import { clamp } from '../core/clamp.js'

/** 全大写名字有些引擎会一个字母一个字母念，转成 Title Case 更像在叫名字 */
export function spokenName(name) {
  return String(name || '').replace(/\S+/g, function (w) {
    return /^[A-Z0-9.-]+$/.test(w) && w.length > 1 ? w.charAt(0) + w.slice(1).toLowerCase() : w
  })
}

/** 一句话的时长估算（个别引擎不触发 onend 时兜底；中文按字、英文按字符） */
function estimateMs(items, rate) {
  let chars = 0
  for (let i = 0; i < items.length; i++) {
    const t = String(items[i].t || '')
    chars += /[一-龥]/.test(t) ? t.length * 1.7 : t.length
  }
  return Math.round(((chars / 13) * 1000) / rate) + 460
}

/* 音色打分统一放在 shared/voice，面板推荐与运行时挑选用同一套规则 */
/** 挑某语种最合适的一个音色（want 传 'en' / 'zh' 这样的两字母前缀） */
function bestFor(state, config, want) {
  const preferred = findVoiceByName(state.voices, config.voiceName, want)
  return preferred || pickVoice(state.voices, want)
}

function loadVoices(state) {
  if (!state.supported) return
  try {
    state.voices = window.speechSynthesis.getVoices() || []
  } catch (e) {
    state.voices = []
  }
  state.picked.en = bestFor(state, state.config, 'en')
  state.picked.zh = bestFor(state, state.config, 'zh')
}

function setMeter(state, on) {
  if (state.meter) state.meter.classList.toggle('dsu-on', !!on)
}

function buildUtter(state, config, text, lang) {
  const u = new window.SpeechSynthesisUtterance(text)
  const v = lang.indexOf('zh') === 0 ? state.picked.zh : state.picked.en
  if (v) {
    u.voice = v
    u.lang = v.lang || lang
  } else {
    u.lang = lang
  }
  u.rate = clamp(config.voiceRate, 0.5, 2)
  u.pitch = clamp(config.voicePitch, 0, 2)
  u.volume = clamp(config.voiceVolume, 0, 1)
  return u
}

/** 用系统语音念完，resolve 实际时长；拿不到语音引擎时返回 0。 */
function speakLine(ctx, en, zh) {
  const { state, config, sfx, isFinished } = ctx
  return new Promise(function (resolve) {
    if (!state.supported || !config.voice || isFinished()) {
      resolve(0)
      return
    }
    state.pending = { en: en || '', zh: zh || '' }
    const items = []
    const mode = config.voiceLang
    if (mode === 'zh') {
      if (zh) items.push({ t: zh, l: 'zh-CN' })
    } else if (mode === 'both') {
      if (zh) items.push({ t: zh, l: 'zh-CN' })
      if (en) items.push({ t: en, l: 'en-US' })
    } else if (en) {
      items.push({ t: en, l: 'en-US' })
    }
    if (!items.length) {
      resolve(0)
      return
    }

    state.saidOnce = true
    if (config.voiceCue !== false) sfx.cue()

    const startedAt = Date.now()
    const est = estimateMs(items, clamp(config.voiceRate, 0.5, 2) || 1)
    const lead = clamp(config.voiceLead, 0, VOICE_LEAD_MAX)
    let settled = false
    let watchdog = null

    function settle() {
      if (settled) return
      settled = true
      if (watchdog) clearTimeout(watchdog)
      setMeter(state, false)
      resolve(Math.max(0, Date.now() - startedAt))
    }

    setTimeout(function () {
      if (isFinished()) {
        settle()
        return
      }
      const last = items.length - 1
      for (let i = 0; i <= last; i++) {
        const u = buildUtter(state, config, items[i].t, items[i].l)
        if (i === last) {
          u.onstart = function () {
            setMeter(state, true)
          }
          u.onend = settle
          u.onerror = settle
        }
        try {
          window.speechSynthesis.speak(u)
        } catch (e) {
          if (i === last) settle()
        }
      }
      watchdog = setTimeout(settle, est + 900)
    }, lead)
  })
}

/** 浏览器要求"先有用户手势"才放声：第一次点击/按键解锁 + 补播当前行 */
function unlockTts(ctx) {
  const { state, config, sfx } = ctx
  try {
    if (state.supported) window.speechSynthesis.resume()
  } catch (e) {
    /* noop */
  }
  sfx.resume()
  /* 预热：先无声念一个空格，把引擎唤醒，避免第一句被吃掉开头半个字 */
  if (state.supported && !state.saidOnce) {
    try {
      const w = new window.SpeechSynthesisUtterance(' ')
      w.volume = 0
      const v = state.picked.en || state.picked.zh
      if (v) {
        w.voice = v
        w.lang = v.lang
      }
      window.speechSynthesis.speak(w)
    } catch (e) {
      /* noop */
    }
  }
  if (!state.saidOnce && config.voice && (state.pending.en || state.pending.zh)) {
    speakLine(ctx, state.pending.en, state.pending.zh)
  }
}

/** 只有这里才真的掐断语音（跳过 / 揭幕） */
function stopTts(state) {
  try {
    if (state.supported) window.speechSynthesis.cancel()
  } catch (e) {
    /* noop */
  }
  setMeter(state, false)
}

function currentVoice(state) {
  const a = state.picked.en ? state.picked.en.name : ''
  const b = state.picked.zh ? state.picked.zh.name : ''
  return a === b ? a : a + (b ? '  /  ' + b : '')
}

/**
 * 系统语音（TTS）：挑音色、按语种播报、等播报结束。
 *
 * 不打断上一句（队列顺序播报），只在跳过 / 揭幕时取消；
 * 提示音响过之后留 voiceLead 的空白再开口。
 *
 * @param {{
 *   config: Record<string, any>,
 *   sfx: any,
 *   isFinished: () => boolean,
 * }} options
 */
export function createTts(options) {
  const config = options.config
  const sfx = options.sfx
  const isFinished =
    options.isFinished ||
    function () {
      return false
    }
  const state = {
    supported:
      typeof window !== 'undefined' &&
      !!window.speechSynthesis &&
      typeof window.SpeechSynthesisUtterance === 'function',
    voices: [],
    picked: { en: null, zh: null },
    meter: null,
    saidOnce: false,
    pending: { en: '', zh: '' },
    config,
  }
  const ctx = { state, config, sfx, isFinished }

  return {
    supported: state.supported,
    load() {
      loadVoices(state)
    },
    attach(node) {
      state.meter = node
    },
    tts(en, zh) {
      return speakLine(ctx, en, zh)
    },
    unlock() {
      unlockTts(ctx)
    },
    stop() {
      stopTts(state)
    },
    current() {
      return currentVoice(state)
    },
    listVoices() {
      return state.voices.slice()
    },
    speakName: spokenName,
    setMeter(on) {
      setMeter(state, on)
    },
    markSpoken() {
      state.saidOnce = true
    },
  }
}
