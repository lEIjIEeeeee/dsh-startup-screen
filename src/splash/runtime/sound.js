import { STEPS } from '../data/steps.js'

/**
 * 语音/音效接线：声卡要等用户手势才能出声，这里挂一次性解锁。
 *
 * 两条独立通道：audio 是界面音效（现场合成），voice 是女声播报（素材优先）。
 *
 * @param {{
 *   config: Record<string, any>,
 *   audio: any,
 *   voice: any,
 *   voiceNode: any,
 *   listen: (target: any, type: string, fn: any, opts?: any) => void,
 * }} options
 */
export function wireSound(options) {
  const config = options.config
  const audio = options.audio
  const voice = options.voice
  const listen = options.listen

  voice.attach(options.voiceNode)
  if (config.voiceSource !== 'tts') {
    for (let i = 0; i < STEPS.length; i++) if (STEPS[i].audio) audio.ensureAsset(STEPS[i].audio)
    audio.ensureAsset('line-6') /* 终幕欢迎语 */
  }
  voice.load()
  if (voice.supported && typeof window.speechSynthesis.addEventListener === 'function') {
    try {
      listen(window.speechSynthesis, 'voiceschanged', function () {
        voice.load()
      })
    } catch (e) {
      /* noop */
    }
  }

  let unlocked = false
  function unlock() {
    if (unlocked) return
    unlocked = true
    voice.unlock()
    document.removeEventListener('pointerdown', unlock, true)
    document.removeEventListener('keydown', unlock, true)
    document.removeEventListener('touchstart', unlock, true)
  }
  listen(document, 'pointerdown', unlock, true)
  listen(document, 'keydown', unlock, true)
  listen(document, 'touchstart', unlock, true)
}
