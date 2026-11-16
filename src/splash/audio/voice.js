import { createTts } from './tts.js'

/**
 * 女声播报：优先真声素材，拿不到再用系统语音。
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
  const isFinished =
    options.isFinished ||
    function () {
      return false
    }
  const tts = createTts(options)

  /**
   * 念一行，返回这一行实际花了多久的 Promise。
   * 有真声素材就优先用素材；拿不到再改用系统语音。
   */
  function line(en, zh, asset) {
    if (asset && config.voice && config.voiceSource !== 'tts' && !isFinished()) {
      return sfx
        .ensureAsset(asset)
        .then(function (ok) {
          if (!ok || isFinished()) return 0
          if (config.voiceCue !== false) sfx.cue()
          return sfx.playAssetAndWait(asset, 0.85).then(function (ms) {
            if (ms > 0) tts.setMeter(true)
            return ms
          })
        })
        .then(function (ms) {
          if (ms > 0) {
            tts.markSpoken()
            return ms
          }
          return tts.tts(en, zh)
        })
    }
    return tts.tts(en, zh)
  }

  return {
    supported: tts.supported,
    load: tts.load,
    attach: tts.attach,

    /**
     * 不打断上一句：系统语音本身是队列，硬取消会把没念完的话掐断。
     * 提示音响过之后留 voiceLead 的空白再开口；等播报结束再 resolve，
     * 个别引擎不触发结束事件时按估算兜底，绝不把动画卡死。
     */
    line,

    /** 系统语音路径：素材缺失、指定用系统语音，或终幕那条动态名字 */
    tts: tts.tts,

    /** 不等待的版本：设置页试听 / 任何"念完就行"的场合 */
    say(en, zh) {
      return line(en, zh)
    },

    unlock: tts.unlock,
    speakName: tts.speakName,
    current: tts.current,
    listVoices: tts.listVoices,
    stop: tts.stop,
  }
}
