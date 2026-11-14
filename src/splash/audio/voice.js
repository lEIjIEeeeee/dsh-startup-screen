import { clamp01 } from '../core/clamp.js'

/**
 * 女声播报：优先真声素材，拿不到再用系统语音。
 *
 * 系统语音不打断上一句（队列顺序播报），只在跳过 / 揭幕时取消；
 * 提示音响过之后留 voiceLead 的空白再开口。
 *
 * @param {{
 *   config: Record<string, any>,
 *   sfx: any,
 *   isFinished: () => boolean,
 * }} options
 */
export function createVoice(options) {
  const config = options.config
  const sfx = options.sfx
  const isFinished = options.isFinished || function () { return false }

  const supported =
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    typeof window.SpeechSynthesisUtterance === 'function'
  let voices = []
  const picked = { en: null, zh: null }
  let meter = null
  let saidOnce = false
  let pending = { en: '', zh: '' }

  /* 想让它听起来像"AI 播报"，音色本身比什么都重要。
     同一台机器上，"Microsoft Zira Desktop" 是上世纪拼接合成，念长句塑料味很重；
     Edge 的 "... Online (Natural)"、Chrome 的 "Google ..."、macOS 的 Siri 才是神经网络音色。
     所以这里按分数挑，而不是挨个名字第一个命中。 */
  const NATURAL_HINTS = ['natural', 'neural', 'online', 'premium', 'enhanced', 'siri', 'google']
  const FEMALE_HINTS = [
    'aria', 'jenny', 'michelle', 'emma', 'ava', 'libby', 'sonia', 'maisie',
    'zira', 'samantha', 'karen', 'moira', 'tessa', 'victoria', 'serena', 'allison',
    'susan', 'fiona', 'hazel', 'female', 'woman',
    'xiaoxiao', 'xiaoyi', 'xiaomo', 'huihui', 'yaoyao', '晓晓', '晓伊', '女声',
  ]
  const MALE_HINTS = ['david', 'mark', 'guy', 'ryan', 'george', 'daniel', 'alex', 'fred',
    'male', 'yunxi', 'yunjian', 'kangkang']

  /** 给一个音色打分：神经网络 > 女声 > 语种吻合 > 本地 */
  function score(v, want) {
    const name = String(v.name || '').toLowerCase()
    const lang = String(v.lang || '').toLowerCase()
    let sc = 0
    for (let i = 0; i < NATURAL_HINTS.length; i++) {
      if (name.indexOf(NATURAL_HINTS[i]) !== -1) {
        sc += 60
        break
      }
    }
    for (let j = 0; j < FEMALE_HINTS.length; j++) {
      if (name.indexOf(FEMALE_HINTS[j]) !== -1) {
        sc += 40
        break
      }
    }
    for (let k = 0; k < MALE_HINTS.length; k++) {
      if (name.indexOf(MALE_HINTS[k]) !== -1) {
        sc -= 45
        break
      }
    }
    if (lang.indexOf(want) === 0) sc += 25
    if (v.localService) sc += 4 /* 本地音色起播快，不会先卡半秒 */
    if (v.default) sc += 3
    return sc
  }

  /** 挑某语种最合适的一个音色（want 传 'en' / 'zh' 这样的两字母前缀） */
  function bestFor(want) {
    if (!voices.length) return null
    if (config.voiceName) {
      for (let i = 0; i < voices.length; i++) {
        const v = voices[i]
        if (
          v.name === config.voiceName &&
          String(v.lang || '').toLowerCase().indexOf(want) === 0
        ) {
          return v
        }
      }
    }
    let pool = []
    for (let j = 0; j < voices.length; j++) {
      if (String(voices[j].lang || '').toLowerCase().indexOf(want) === 0) pool.push(voices[j])
    }
    if (!pool.length) pool = voices.slice()
    let best = null
    let bs = -1e9
    for (let n = 0; n < pool.length; n++) {
      const sc = score(pool[n], want)
      if (sc > bs) {
        bs = sc
        best = pool[n]
      }
    }
    return best
  }

  function setMeter(on) {
    if (meter) meter.classList.toggle('dsu-on', !!on)
  }

  function load() {
    if (!supported) return
    try {
      voices = window.speechSynthesis.getVoices() || []
    } catch (e) {
      voices = []
    }
    picked.en = bestFor('en')
    picked.zh = bestFor('zh')
  }

  /** 全大写名字有些引擎会一个字母一个字母念，转成 Title Case 更像在叫名字 */
  function spokenName(name) {
    return String(name || '').replace(/\S+/g, function (w) {
      return /^[A-Z0-9.\-]+$/.test(w) && w.length > 1
        ? w.charAt(0) + w.slice(1).toLowerCase()
        : w
    })
  }

  function buildUtter(text, lang) {
    const u = new window.SpeechSynthesisUtterance(text)
    const v = lang.indexOf('zh') === 0 ? picked.zh : picked.en
    if (v) {
      u.voice = v
      u.lang = v.lang || lang
    } else {
      u.lang = lang
    }
    u.rate = clamp01(config.voiceRate, 0.5, 2)
    u.pitch = clamp01(config.voicePitch, 0, 2)
    u.volume = clamp01(config.voiceVolume, 0, 1)
    return u
  }

  /** 一句话的时长估算（个别引擎不触发 onend 时兜底；中文按字、英文按字符） */
  function estimateMs(items) {
    let chars = 0
    const rate = clamp01(config.voiceRate, 0.5, 2) || 1
    for (let i = 0; i < items.length; i++) {
      const t = String(items[i].t || '')
      chars += /[一-龥]/.test(t) ? t.length * 1.7 : t.length
    }
    return Math.round((chars / 13) * 1000 / rate) + 460
  }

  /** 用系统语音念完，resolve 实际时长；拿不到语音引擎时返回 0。 */
  function ttsLine(en, zh) {
    return new Promise(function (resolve) {
      if (!supported || !config.voice || isFinished()) {
        resolve(0)
        return
      }
      pending = { en: en || '', zh: zh || '' }
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

      saidOnce = true
      if (config.voiceCue !== false) sfx.cue()

      const startedAt = Date.now()
      const est = estimateMs(items)
      const lead = clamp01(config.voiceLead, 0, 1200)
      let settled = false
      let watchdog = null

      function settle() {
        if (settled) return
        settled = true
        if (watchdog) clearTimeout(watchdog)
        setMeter(false)
        resolve(Math.max(0, Date.now() - startedAt))
      }

      setTimeout(function () {
        if (isFinished()) {
          settle()
          return
        }
        const last = items.length - 1
        for (let i = 0; i <= last; i++) {
          const u = buildUtter(items[i].t, items[i].l)
          if (i === last) {
            u.onstart = function () {
              setMeter(true)
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

  const api = {
    supported,
    load,
    attach(node) {
      meter = node
    },

    /**
     * 念一行，返回这一行实际花了多久的 Promise。
     * 不打断上一句：系统语音本身是队列，硬取消会把没念完的话掐断。
     * 提示音响过之后留 voiceLead 的空白再开口；等播报结束再 resolve，
     * 个别引擎不触发结束事件时按估算兜底，绝不把动画卡死。
     */
    line(en, zh, asset) {
      /* 有真声素材就优先用素材；拿不到再改用系统语音 */
      if (asset && config.voice && config.voiceSource !== 'tts' && !isFinished()) {
        return sfx
          .ensureAsset(asset)
          .then(function (ok) {
            if (!ok || isFinished()) return 0
            if (config.voiceCue !== false) sfx.cue()
            return sfx.playAssetAndWait(asset, 0.85).then(function (ms) {
              if (ms > 0) setMeter(true)
              return ms
            })
          })
          .then(function (ms) {
            if (ms > 0) {
              saidOnce = true
              return ms
            }
            return ttsLine(en, zh)
          })
      }
      return ttsLine(en, zh)
    },

    /** 系统语音路径：素材缺失、指定用系统语音，或终幕那条动态名字 */
    tts(en, zh) {
      return ttsLine(en, zh)
    },

    /** 不等待的版本：设置页试听 / 任何"念完就行"的场合 */
    say(en, zh) {
      return api.line(en, zh)
    },

    /** 浏览器要求"先有用户手势"才放声：第一次点击/按键解锁 + 补播当前行 */
    unlock() {
      try {
        if (supported) window.speechSynthesis.resume()
      } catch (e) {
        /* noop */
      }
      sfx.resume()
      /* 预热：先无声念一个空格，把引擎唤醒，避免第一句被吃掉开头半个字 */
      if (supported && !saidOnce) {
        try {
          const w = new window.SpeechSynthesisUtterance(' ')
          w.volume = 0
          const v = picked.en || picked.zh
          if (v) {
            w.voice = v
            w.lang = v.lang
          }
          window.speechSynthesis.speak(w)
        } catch (e) {
          /* noop */
        }
      }
      if (!saidOnce && config.voice && (pending.en || pending.zh)) {
        api.say(pending.en, pending.zh)
      }
    },
    speakName: spokenName,
    current() {
      const a = picked.en ? picked.en.name : ''
      const b = picked.zh ? picked.zh.name : ''
      return a === b ? a : a + (b ? '  /  ' + b : '')
    },
    listVoices() {
      return voices.slice()
    },
    /** 只有这里才真的掐断语音（跳过 / 揭幕） */
    stop() {
      try {
        if (supported) window.speechSynthesis.cancel()
      } catch (e) {
        /* noop */
      }
      setMeter(false)
    },
  }
  return api
}
