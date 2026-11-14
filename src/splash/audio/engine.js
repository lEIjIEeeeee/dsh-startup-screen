import { clamp } from '../core/clamp.js'

/**
 * WebAudio 引擎：懒创建 AudioContext，提供音量换算与合成音。
 *
 * @param {Record<string, any>} config
 */
export function createEngine(config) {
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
    return Math.max(0.0002, (gain == null ? 0.05 : gain) * clamp(config.soundVolume, 0, 1) * 2)
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

  function close() {
    closed = true
    try {
      if (ctx && typeof ctx.close === 'function') ctx.close()
    } catch (e) {
      /* noop */
    }
    ctx = null
  }

  return { ac, vol, tone, noise, close }
}
