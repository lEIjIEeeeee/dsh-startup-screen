import { ROUTES } from '../../shared/routes.js'
import { clamp01 } from '../core/clamp.js'

/**
 * 界面音效与语音素材播放。
 *
 * 音效现场合成（咔哒、确认音、扫频、和声钟）；真素材可用时优先播素材，
 * 拿不到就自动回落到合成音，功能不依赖网络或素材是否存在。
 * 语音素材独立于「界面音效」开关：force=true 时无视 config.sound。
 *
 * @param {Record<string, any>} config
 */
export function createSfx(config) {
  let ctx = null
  let closed = false

  function ac(force) {
    /* 实例销毁后不能再建新上下文：旧时间线的 Promise 回调会晚于 dispose 执行，
       不挡住的话关掉一个又开一个，重播几次照样撞浏览器上限 */
    if (closed) return null
    /* 语音素材要独立于「界面音效」开关：force=true 时无视 config.sound */
    if (!config.sound && !force) return null
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      if (!ctx) ctx = new AC()
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume()
      return ctx
    } catch (e) {
      return null
    }
  }

  function vol(gain) {
    return Math.max(0.0002, (gain == null ? 0.05 : gain) * clamp01(config.soundVolume, 0, 1) * 2)
  }

  function tone(freq, dur, type, gain, delay, glideTo) {
    const c = ac()
    if (!c) return
    try {
      const t0 = c.currentTime + (delay || 0)
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = type || 'sine'
      o.frequency.setValueAtTime(freq, t0)
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(vol(gain), t0 + Math.min(0.02, dur * 0.3))
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      o.connect(g)
      g.connect(c.destination)
      o.start(t0)
      o.stop(t0 + dur + 0.03)
    } catch (e) {
      /* 静默降级 */
    }
  }

  function noise(dur, gain) {
    const c = ac()
    if (!c) return
    try {
      const n = Math.floor(c.sampleRate * dur)
      const buf = c.createBuffer(1, n, c.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
      const src = c.createBufferSource()
      src.buffer = buf
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 1500
      f.Q.value = 0.6
      const g = c.createGain()
      g.gain.value = vol(gain)
      src.connect(f)
      f.connect(g)
      g.connect(c.destination)
      src.start()
    } catch (e) {
      /* 静默降级 */
    }
  }

  /* 从 /dsh-startup/asset/ 拉真素材（用户音频里抠出来的"哒"）并解码缓存；
     拿不到就自动回落到合成音，功能不依赖网络/素材存在与否。 */
  const buffers = {}
  const fetching = {}
  function loadAsset(name) {
    if (config.sfx === 'synth') return
    if (buffers[name] || fetching[name]) return
    fetching[name] = true
    try {
      fetch(ROUTES.asset + '/' + name + '.mp3')
        .then(function (r) {
          return r.ok ? r.arrayBuffer() : null
        })
        .then(function (ab) {
          return ab ? ac().decodeAudioData(ab) : null
        })
        .then(function (buf) {
          if (buf) buffers[name] = buf
        })
        .catch(function () {
          /* 没素材就走合成音 */
        })
    } catch (e) {
      /* fetch 不存在也一样降级 */
    }
  }

  /* 素材预加载：fetch + decodeAudioData 不需要用户手势，所以加载时就拉，
     这样第一步就能用真声，而不用等用户第一次点击。 */
  const pending = {}
  function ensureAsset(name) {
    if (buffers[name]) return Promise.resolve(true)
    if (pending[name]) return pending[name]
    if (config.voiceSource === 'tts') return Promise.resolve(false)
    pending[name] = new Promise(function (resolve) {
      try {
        fetch(ROUTES.asset + '/' + name + '.mp3')
          .then(function (r) {
            return r.ok ? r.arrayBuffer() : null
          })
          .then(function (ab) {
            if (!ab) return null
            return ac(true).decodeAudioData(ab)
          })
          .then(function (buf) {
            if (buf) {
              buffers[name] = buf
              resolve(true)
            } else {
              resolve(false)
            }
          })
          .catch(function () {
            resolve(false)
          })
      } catch (e) {
        resolve(false)
      }
    })
    return pending[name]
  }

  /** 播素材并等它播完，resolve 实际时长(ms)。拿不到素材 resolve 0。
   *  onended 是唯一正常出口，但音频上下文挂起时它永远不会来 —— 加一道超时兜底，
   *  保证这一步的 Promise 一定会有结果，不会把用户永久锁在黑幕里。 */
  function playAssetAndWait(name, gain) {
    return new Promise(function (resolve) {
      const c = ac(true)
      const buf = buffers[name]
      if (!c || !buf) {
        resolve(0)
        return
      }
      let done = false
      function fin(ms) {
        if (done) return
        done = true
        resolve(ms)
      }
      try {
        const src = c.createBufferSource()
        src.buffer = buf
        const g = c.createGain()
        g.gain.value = Math.min(
          1,
          (gain == null ? 0.85 : gain) * clamp01(config.voiceVolume, 0, 1) * 1.6
        )
        src.connect(g)
        g.connect(c.destination)
        src.onended = function () {
          fin(Math.round(buf.duration * 1000))
        }
        src.start()
        setTimeout(function () {
          fin(Math.round(buf.duration * 1000))
        }, buf.duration * 1000 + 1500)
      } catch (e) {
        fin(0)
      }
    })
  }

  function playAsset(name, gain) {
    const c = ac()
    if (!c) return false
    const buf = buffers[name]
    if (!buf) {
      loadAsset(name)
      return false
    }
    try {
      const src = c.createBufferSource()
      src.buffer = buf
      const g = c.createGain()
      g.gain.value = Math.min(
        1,
        (gain == null ? 0.55 : gain) * clamp01(config.soundVolume, 0, 1) * 2
      )
      src.connect(g)
      g.connect(c.destination)
      src.start()
      return true
    } catch (e) {
      return false
    }
  }

  function close() {
    closed = true
    try {
      if (ctx && typeof ctx.close === 'function') ctx.close()
    } catch (e) {
      /* noop */
    }
    ctx = null
  }

  return {
    close,
    resume() {
      ac()
      loadAsset('sfx-tick')
      loadAsset('sfx-ticks-run')
    },
    preload() {
      loadAsset('sfx-tick')
      loadAsset('sfx-ticks-run')
    },
    ensureAsset,
    playAssetAndWait,
    /* 文字渐显 / 阶段推进 / 按钮确认 —— 优先用真素材 */
    tick() {
      if (!playAsset('sfx-tick', 0.45)) tone(1760, 0.035, 'square', 0.022)
    },
    confirm() {
      if (!playAsset('sfx-tick', 0.85)) {
        tone(660, 0.09, 'triangle', 0.07)
        tone(990, 0.17, 'triangle', 0.055, 0.085)
      }
    },
    tickRun() {
      playAsset('sfx-ticks-run', 0.5)
    },
    step() {
      if (!playAsset('sfx-tick', 0.6)) {
        tone(880, 0.05, 'sine', 0.05)
        tone(1320, 0.07, 'sine', 0.028, 0.045)
      }
    },
    hover() {
      tone(2200, 0.02, 'sine', 0.018)
    },
    sweep() {
      noise(0.75, 0.035)
    },
    /* 念台词之前的两声轻提示：让系统播报有开场感，而不是直接念字 */
    cue() {
      tone(1046.5, 0.05, 'sine', 0.028)
      tone(1568, 0.06, 'sine', 0.02, 0.075)
    },
    rise() {
      tone(220, 1.1, 'sine', 0.032, 0, 990)
    },
    chime() {
      tone(659.25, 0.9, 'sine', 0.055)
      tone(830.61, 0.9, 'sine', 0.04, 0.09)
      tone(987.77, 1.3, 'sine', 0.045, 0.18)
    },
  }
}
