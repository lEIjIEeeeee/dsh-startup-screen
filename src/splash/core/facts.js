import { ROUTES } from '../../shared/routes.js'
import { FACTS_DEADLINE_MS, FACTS_POLL_MS, FACTS_RETRY_MS } from './constants.js'
import {
  buildChecks,
  buildTrace,
  paintFacts,
  paintMeta,
  setChecks,
  stopTrace,
} from './facts-render.js'

/**
 * 真实信息面板：REV 行、左侧两行读数、右侧自检清单与底部波形。
 *
 * 数据由宿主注入或异步轮询；本模块只负责渲染与更新，
 * 光场是否要重排由入口在 onApplied 里决定。
 *
 * @param {{
 *   ui: Record<string, any>,
 *   initial?: Record<string, any>,
 *   onApplied?: (facts: Record<string, any>, prevHash: any) => void,
 * }} options
 */
export function createFacts(options) {
  const ui = options.ui
  const onApplied = options.onApplied || function () {}
  let FACTS = options.initial && typeof options.initial === 'object' ? options.initial : {}
  let stopped = false
  let pollTimer = null

  function applyFacts(f) {
    if (stopped || !f || typeof f !== 'object' || f.ready !== true) return
    const prevHash = FACTS.hash
    FACTS = f
    try {
      if (window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === 'object') {
        window.__DSH_STARTUP__.facts = f
      }
    } catch (e) {
      /* noop */
    }
    paintMeta(ui, FACTS)
    paintFacts(ui, FACTS)
    buildChecks(ui, FACTS)
    buildTrace(ui, FACTS)
    onApplied(f, prevHash)
  }

  function refreshFacts() {
    if (stopped || typeof fetch !== 'function') return
    const deadline = Date.now() + FACTS_DEADLINE_MS
    function schedule(delay) {
      if (stopped) return
      pollTimer = setTimeout(tick, delay)
    }
    function tick() {
      if (stopped) return
      try {
        fetch(ROUTES.facts, { headers: { Accept: 'application/json' } })
          .then(function (r) {
            return r.json()
          })
          .then(function (j) {
            if (j && j.ok === true && j.facts && j.facts.ready === true) applyFacts(j.facts)
            /* 即使已经 ready 也继续轮询到截止：sessions 可能晚一点才加载出来 */
            if (Date.now() < deadline) schedule(FACTS_RETRY_MS)
          })
          .catch(function () {
            /* 离线预览 / 首帧还没就绪：短时间内再试几次 */
            if (Date.now() < deadline) schedule(FACTS_POLL_MS)
          })
      } catch (e) {
        if (Date.now() < deadline) schedule(FACTS_POLL_MS)
      }
    }
    tick()
  }

  /** 停止轮询与波形定时器；揭幕或重播后不再碰已经要移除的 DOM。 */
  function dispose() {
    stopped = true
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    stopTrace(ui)
  }

  paintMeta(ui, FACTS)
  paintFacts(ui, FACTS)
  buildChecks(ui, FACTS)
  buildTrace(ui, FACTS)

  return {
    current() {
      return FACTS
    },
    refresh: refreshFacts,
    setChecks(active) {
      setChecks(ui, active)
    },
    stopTrace() {
      stopTrace(ui)
    },
    dispose,
  }
}
