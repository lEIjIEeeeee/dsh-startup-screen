/* ============================================================================
 * dsh-startup-screen — 启动动画（浏览器侧，零依赖）
 * ----------------------------------------------------------------------------
 * 由宿主注入页面，在应用挂载之前接管首屏：
 *   黑幕 → 过曝洗白 → 暖白底板 → 五步授权 → 故障揭幕。
 * 每一步是中文大字 + 英文等宽字幕 + 底部日志；前两步等待用户确认，可以跳过。
 *
 * 配置来自 window.__DSH_STARTUP__，也可以用 window.__DSH_STARTUP_API__.replay() 重播。
 * ========================================================================== */
import { createSfx } from './audio/sfx.js'
import { createVoice } from './audio/voice.js'
import { isAmbientOn, readStartupConfig } from './core/config.js'
import { createDecoder } from './core/decode.js'
import { createFacts } from './core/facts.js'
import { createChromeSync } from './dom/chrome-sync.js'
import { createStage } from './dom/stage.js'
import { installApi } from './runtime/api.js'
import { createClock } from './runtime/clock.js'
import { prefersReducedMotion } from './runtime/env.js'
import { createFieldControl } from './runtime/field-control.js'
import { installBootGuard } from './runtime/guard.js'
import { createLifecycle } from './runtime/lifecycle.js'
import { createListenerRegistry } from './runtime/listeners.js'
import { wireSkip } from './runtime/skip.js'
import { wireSound } from './runtime/sound.js'
import { startRuntime } from './runtime/start.js'
import { createTimeline } from './timeline/timeline.js'

/* 顶层守卫收进 boot()：构建时外面再套一层立即执行，同一份脚本重复加载也只跑一遍。 */
function boot() {
  'use strict'

  if (window.__DSH_STARTUP_LOADED__) return
  window.__DSH_STARTUP_LOADED__ = true

  const C = readStartupConfig(window.__DSH_STARTUP__)

  /* 系统"减少动态效果"：解码动画与后续光场都按静态处理 */
  const REDUCED = prefersReducedMotion()

  /* 真实信息由宿主注入；没有时全部走回退值，不影响动画 */
  const initialFacts = C.facts && typeof C.facts === 'object' ? C.facts : {}
  function ambientOn() {
    return isAmbientOn(C)
  }

  /* ── 桌面端标题栏同步（Windows）──────────────────────────────────────────
     桌面版用系统绘制的窗口按钮，底色跟着应用主题走。动画播放时右上角会留下
     一块和主题同色的方块：黑幕时是一条亮带，暖白底板上又显得刺眼。
     做法是把桌面版用来取色的隐藏元素改成完全透明，让它把窗口按钮和底色一起藏起来，
     动画结束再还原。浏览器和 macOS 下这段不执行，任何一步失败都静默跳过。 */
  const chromeSync = createChromeSync({ window, document })

  /* 排查 / 冒烟测试用的把手：只读开关，不改变插件行为 */
  try {
    window.__DSH_STARTUP_CHROME__ = chromeSync
  } catch (e) {
    /* noop */
  }

  /* 轮次编号：重播会重新加载一份脚本，旧脚本的时间线必须立刻失效。 */
  const GEN = (window.__DSH_STARTUP_GEN__ = (window.__DSH_STARTUP_GEN__ || 0) + 1)
  function stale() {
    return window.__DSH_STARTUP_GEN__ !== GEN
  }
  function noop() {}

  const listeners = createListenerRegistry()
  const listen = listeners.listen
  const dropListeners = listeners.drop

  /* 各运行部件的引用集中在一个对象里，生命周期模块按它清理。 */
  /** @type {{ timeline: any, facts: any, voice: any, audio: any }} */
  const runtime = { timeline: null, facts: null, voice: null, audio: null }
  const lifecycle = createLifecycle({
    runtime,
    chromeSync,
    restoreAppBackdrop: function () {
      restoreAppBackdrop()
    },
    dropListeners,
    stopClock: function () {
      clock.stop()
    },
    noop,
  })
  const dispose = lifecycle.dispose
  const injectSelf = lifecycle.injectSelf

  if (installBootGuard({ config: C, replay: injectSelf, noop })) return

  /* 逐字写入与解码动画：一次播放共用一个实例 */
  const decoder = createDecoder(REDUCED)
  const typeIn = decoder.typeIn
  const startDecode = decoder.startDecode
  const stopDecode = decoder.stopDecode

  /* ── DOM 搭建 ─────────────────────────────────────────────────────────── */
  const ui = {}
  const clock = createClock(ui)
  const stage = createStage({ config: C, facts: initialFacts, ui })
  const root = stage.root
  const restoreAppBackdrop = stage.restoreAppBackdrop
  function q(sel) {
    return root.querySelector(sel)
  }

  const fieldControl = createFieldControl({
    config: C,
    ui,
    root,
    reduced: REDUCED,
    ambientOn,
    getFacts: function () {
      return runtime.facts.current()
    },
  })
  const facts = createFacts({
    ui,
    initial: initialFacts,
    onApplied: fieldControl.refresh,
  })
  runtime.facts = facts
  clock.start()

  /* 光场在 DOM 就绪后就开始跑，但 .dsu-field 的 opacity=0，第一幕纯黑时看不见 */
  if (ambientOn()) fieldControl.start()
  facts.refresh()

  /* ── 声音 ──────────────────────────────────────────────────────────────
   * 浏览器要求先有用户手势才能出声，所以第一次点击或按键时会补一次解锁。 */
  const audio = createSfx(C)
  const voice = createVoice({
    config: C,
    sfx: audio,
    isFinished: function () {
      return runtime.timeline ? runtime.timeline.isFinished() : false
    },
  })
  runtime.audio = audio
  runtime.voice = voice
  wireSound({ config: C, audio, voice, voiceNode: q('.dsu-voice'), listen })

  /* ── 时间线 ───────────────────────────────────────────────────────────── */
  const timeline = createTimeline({
    config: C,
    ui,
    root,
    audio,
    voice,
    chromeSync,
    typeIn,
    startDecode,
    stopDecode,
    ambientOn,
    stale,
    stopField: fieldControl.stop,
    stopFacts: facts.dispose,
    stopTrace: facts.stopTrace,
    setChecks: facts.setChecks,
    dropListeners,
    restoreAppBackdrop,
    stopClock: clock.stop,
  })
  runtime.timeline = timeline
  wireSkip({ config: C, ui, timeline, listen })

  installApi({
    voice,
    replay: injectSelf,
    timeline,
    dispose,
    config: C,
  })
  startRuntime(root, timeline)
}

boot()
