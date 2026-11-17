import { createGate } from './gate.js'
import { createTimelineHelpers } from './helpers.js'
import { playFinale } from './finale.js'
import { playOpening } from './opening.js'
import { playSteps } from './steps.js'
import { createStall } from './stall.js'
import { createTermination } from './termination.js'

/**
 * 三幕共享的时间线上下文。
 *
 * 由 timeline.js 用 `Object.assign(rt, helpers, …)` 组装；三幕只读不改。
 * 新增字段时同时更新这里和用到它的 play* 文件，避免靠猜字段名。
 *
 * @typedef {Object} TimelineContext
 * @property {Record<string, any>} C 规范化后的配置
 * @property {Record<string, any>} ui 舞台节点引用
 * @property {any} root 启动界面根节点
 * @property {any} audio 界面音效
 * @property {any} voice 语音播报
 * @property {any} chromeSync 桌面端标题栏同步
 * @property {(base: number) => number} ms 按播放速度换算时长
 * @property {(base: number) => Promise<any>} wait 普通等待
 * @property {() => Promise<any>} waitAction 等待用户操作
 * @property {() => void} armStall 给停滞看门狗上弦
 * @property {() => boolean} isFinished 是否已经揭幕
 * @property {() => boolean} stale 当前代际是否已失效
 * @property {() => boolean} ambientOn 环境光效是否开启
 * @property {() => any} finish 揭幕
 * @property {(n: number) => void} setProgress 底部进度
 * @property {(n: number) => void} setSlats 阶段柱
 * @property {(n: number, code?: string) => void} setStepCount 步骤编号
 * @property {(zh: string, en: string) => void} setSubtitle 底部双语日志
 * @property {(n: number) => void} setChecks 右侧自检点亮
 * @property {(host: any, text: string, stagger: number, mode?: string) => any[]} typeIn 逐字写入
 * @property {(slots: any[]) => void} startDecode 启动解码动画
 * @property {() => void} stopDecode 立即定格真字
 * @property {() => void} startHex 十六进制读数
 * @property {() => void} stopHex 停止十六进制读数
 * @property {() => void} sweep 扫描线
 * @property {() => void} assembleLogo 鲸鱼落墨
 * @property {(step: any) => void} showAction 显示操作卡
 * @property {() => void} hideAction 收起操作卡
 */

/**
 * 入口传给时间线的运行时依赖；字段名必须和 index.js 的 createTimeline({...}) 对齐。
 *
 * @typedef {Object} TimelineRuntime
 * @property {Record<string, any>} config
 * @property {Record<string, any>} ui
 * @property {any} root
 * @property {any} audio
 * @property {any} voice
 * @property {any} chromeSync
 * @property {() => boolean} stale
 * @property {() => void} stopDecode
 * @property {() => void} stopField
 * @property {() => void} stopTrace
 * @property {() => void} stopClock
 * @property {() => void} dropListeners
 * @property {() => void} restoreAppBackdrop
 * @property {() => void} [stopFacts]
 * @property {(n: number) => void} setChecks
 * @property {() => boolean} ambientOn
 * @property {any} typeIn
 * @property {any} startDecode
 */

/**
 * 启动动画时间线：开场、逐幕推进、终幕、揭幕与跳过。
 *
 * 共享状态（计时器、等待者、finished / skipped）都收在这里；
 * DOM、声音、光场与入口状态通过 rt 传入，避免再出现隐式全局。
 *
 * @param {TimelineRuntime} rt
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

  /** @type {TimelineContext} */
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
