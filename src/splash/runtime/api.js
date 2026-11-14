/**
 * 对外 API：settings 面板里的"立即预览"按钮和重播都走它。
 *
 * @param {{
 *   voice: any,
 *   replay: () => any,
 *   timeline: any,
 *   dispose: () => void,
 *   config: Record<string, any>,
 * }} options
 */
export function installApi(options) {
  const voice = options.voice
  const timeline = options.timeline
  const dispose = options.dispose
  window.__DSH_STARTUP_API__ = {
    /* 设置页试听与冒烟测试用：直接念一行 */
    speak: function (en, zh) {
      voice.say(en, zh)
    },
    speakName: function (n) {
      return voice.speakName(n)
    },
    get voice() {
      return voice.current()
    },
    replay: options.replay,
    skip: timeline.requestSkip,
    finish: timeline.finish,
    dispose,
    config: options.config,
  }
}
