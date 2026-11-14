import { ROUTES } from '../../shared/routes.js'
import { ASSET_TAIL_MS } from '../core/constants.js'
import { clamp } from '../core/clamp.js'

/**
 * 音频素材：从 /dsh-startup/asset/ 拉真素材并解码缓存；
 * 拿不到就返回失败，由调用方回落到合成音。
 *
 * @param {{ engine: ReturnType<typeof import('./engine.js').createEngine>, config: Record<string, any> }} options
 */
export function createAssets(options) {
  const engine = options.engine
  const config = options.config
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
          return ab ? engine.ac().decodeAudioData(ab) : null
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
            return engine.ac(true).decodeAudioData(ab)
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
      const c = engine.ac(true)
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
          (gain == null ? 0.85 : gain) * clamp(config.voiceVolume, 0, 1) * 1.6,
        )
        src.connect(g)
        g.connect(c.destination)
        src.onended = function () {
          fin(Math.round(buf.duration * 1000))
        }
        src.start()
        setTimeout(function () {
          fin(Math.round(buf.duration * 1000))
        }, buf.duration * 1000 + ASSET_TAIL_MS)
      } catch (e) {
        fin(0)
      }
    })
  }

  function playAsset(name, gain) {
    const c = engine.ac()
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
        (gain == null ? 0.55 : gain) * clamp(config.soundVolume, 0, 1) * 2,
      )
      src.connect(g)
      g.connect(c.destination)
      src.start()
      return true
    } catch (e) {
      return false
    }
  }

  return { loadAsset, ensureAsset, playAssetAndWait, playAsset }
}
