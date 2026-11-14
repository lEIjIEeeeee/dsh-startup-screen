import { createAssets } from './assets.js'
import { createEngine } from './engine.js'

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
  const engine = createEngine(config)
  const assets = createAssets({ engine, config })
  const tone = engine.tone
  const noise = engine.noise
  const playAsset = assets.playAsset

  return {
    close: engine.close,
    resume() {
      engine.ac()
      assets.loadAsset('sfx-tick')
      assets.loadAsset('sfx-ticks-run')
    },
    preload() {
      assets.loadAsset('sfx-tick')
      assets.loadAsset('sfx-ticks-run')
    },
    ensureAsset: assets.ensureAsset,
    playAssetAndWait: assets.playAssetAndWait,
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
