import { createGate } from './gate.js'
import { createTimelineHelpers } from './helpers.js'
import { playFinale } from './finale.js'
import { playOpening } from './opening.js'
import { playSteps } from './steps.js'
import { createStall } from './stall.js'
import { createTermination } from './termination.js'

/**
 * 启动动画时间线：开场、逐幕推进、终幕、揭幕与跳过。
 *
 * 共享状态（计时器、等待者、finished / skipped）都收在这里；
 * DOM、声音、光场与入口状态通过 rt 传入，避免再出现隐式全局。
 *
 * @param {Record<string, any>} rt
 */
export function createTimeline(rt) {
  const C = rt.config
  const ui = rt.ui
  const stale = rt.stale
  const stopFacts = rt.stopFacts || function () {}
  let skipped = false
  let termination = null

  const stall = createStall({
    isDone: function () {
      return !termination || termination.isFinished() || stale()
    },
    onStall: function () {
      termination.finish()
    },
  })
  const armStall = stall.arm
  const disarmStall = stall.disarm

  function ms(base) {
    return Math.round(base / C.speed)
  }

  const gate = createGate({
    config: C,
    ui,
    ms,
    armStall,
    disarmStall,
    isSkipped: function () {
      return skipped
    },
  })
  const wait = gate.wait
  const waitAction = gate.waitAction

  function releaseAll() {
    try {
      rt.stopDecode()
    } catch (e) {
      /* noop */
    }
    try {
      rt.stopField()
    } catch (e) {
      /* noop */
    }
    try {
      rt.stopTrace()
    } catch (e) {
      /* noop */
    }
    gate.release()
  }

  const helpers = createTimelineHelpers({ config: C, ui, audio: rt.audio, ms, wait })
  termination = createTermination({
    config: C,
    root: rt.root,
    ms,
    stale,
    disarmStall,
    releaseAll,
    stopHex: helpers.stopHex,
    stopFacts,
    stopVoice: function () {
      rt.voice.stop()
    },
    stopClock: rt.stopClock,
    dropListeners: rt.dropListeners,
    showChrome: function () {
      rt.chromeSync.show()
    },
    restoreAppBackdrop: rt.restoreAppBackdrop,
  })

  const ctx = Object.assign({}, rt, helpers, {
    C,
    ms,
    wait,
    waitAction,
    armStall,
    isFinished: termination.isFinished,
    finish: termination.finish,
  })

  function run() {
    /* 标记「时间线真的跑起来了」：9 秒兜底只放行"压根没跑"的情况，不误杀正常播放 */
    window.__DSH_STARTUP_RUNNING__ = true
    armStall()
    return playOpening(ctx)
      .then(function () {
        return playSteps(ctx)
      })
      .then(function () {
        return playFinale(ctx)
      })
      .catch(function (err) {
        try {
          console.warn('[dsh-startup-screen] 动画异常，直接揭幕：', err)
        } catch (e2) {
          /* noop */
        }
        return termination.finish()
      })
  }

  function requestSkip() {
    if (skipped || termination.isFinished()) return
    skipped = true
    termination.requestSkip()
  }

  return {
    start: run,
    finish: termination.finish,
    requestSkip,
    dispose: termination.dispose,
    isFinished: termination.isFinished,
    setProgress: helpers.setProgress,
  }
}
