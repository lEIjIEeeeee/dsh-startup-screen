import { ROUTES } from '../../shared/routes.js'
import { ASSET_TAIL_MS } from '../core/constants.js'
import { clamp } from '../core/clamp.js'

/**
 * 拉取并解码一段素材；任何失败都返回 null，由调用方决定降级方式。
 *
 * @param {ReturnType<typeof import('./engine.js').createEngine>} engine
 * @param {string} name
 * @param {boolean} [force] 语音素材要无视「界面音效」开关
 * @returns {Promise<any>}
 */
function fetchBuffer(engine, name, force) {
  return Promise.resolve()
    .then(function () {
      return fetch(ROUTES.asset + '/' + name + '.mp3')
    })
    .then(function (r) {
      return r.ok ? r.arrayBuffer() : null
    })
    .then(function (ab) {
      if (!ab) return null
      const c = engine.ac(force)
      return c ? c.decodeAudioData(ab) : null
    })
    .catch(function () {
      return null
    })
}

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
    fetchBuffer(engine, name).then(function (buf) {
      if (buf) buffers[name] = buf
      delete fetching[name]
    })
  }

  /* 素材预加载：fetch + decodeAudioData 不需要用户手势，所以加载时就拉，
     这样第一步就能用真声，而不用等用户第一次点击。 */
  const pending = {}
  function ensureAsset(name) {
    if (buffers[name]) return Promise.resolve(true)
    if (pending[name]) return pending[name]
    if (config.voiceSource === 'tts') return Promise.resolve(false)
    /* 失败不缓存：路由刚注册好或网络抖动后，下一句还能重试；
       成功则留在 buffers 里，后续直接命中。 */
    const p = fetchBuffer(engine, name, true).then(function (buf) {
      if (!buf) return false
      buffers[name] = buf
      return true
    })
    pending[name] = p
    p.then(function (ok) {
      if (!ok) delete pending[name]
    })
    return p
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
        setTimeout(
          function () {
            fin(Math.round(buf.duration * 1000))
          },
          buf.duration * 1000 + ASSET_TAIL_MS,
        )
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
      g.gain.value = Math.min(1, (gain == null ? 0.55 : gain) * clamp(config.soundVolume, 0, 1) * 2)
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
