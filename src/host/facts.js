/* ============================================================================
 * 采集启动界面要显示的真实信息：运行环境、版本、插件数、模型、沙箱模式、会话数。
 * 逐步异步填充，先给页面一份快照，浏览器再补一次。
 * 取不到的字段留空，页面显示 "—"，绝不把异常抛给宿主。
 * ========================================================================== */

/** @typedef {import('./types.js').Facts} Facts */
/** @typedef {import('./types.js').FactsCache} FactsCache */
/** @typedef {import('./types.js').HostContext} HostContext */

/**
 * 从宿主取服务；宿主没有或取失败都当没有。
 * @param {HostContext} ctx
 * @param {string} name
 */
function service(ctx, name) {
  try {
    return typeof ctx.get === 'function' ? ctx.get(name) : undefined
  } catch (err) {
    return undefined
  }
}

/**
 * 生成 8 位十六进制短指纹，只用来保证同一台机器的光场构图一致，不用于安全用途。
 * @param {string} text
 */
function shortHash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).toUpperCase().padStart(8, '0')
}

/**
 * 工作区注册表知道所有工作区里的会话 + 归档会话；
 * sessions.list() 默认不含归档，所以 SESSIONS 优先用这里的总数。
 * @param {HostContext} ctx
 */
function readRegistryCounts(ctx) {
  /** @type {Record<string, number>} */
  const out = {}
  try {
    const wr = service(ctx, 'workspaceRegistry')
    if (!wr || typeof wr.list !== 'function') return out
    const ids = new Set()
    const list = wr.list()
    if (Array.isArray(list)) {
      for (const w of list) {
        if (w && Array.isArray(w.sessionIds)) {
          for (const id of w.sessionIds) ids.add(String(id))
        }
      }
    }
    if (Array.isArray(wr.archivedSessionIds)) {
      for (const id of wr.archivedSessionIds) ids.add(String(id))
      out.sessionsArchived = wr.archivedSessionIds.length
    }
    if (ids.size) out.sessionsTotal = ids.size
  } catch (err) {
    /* noop */
  }
  return out
}

/** @returns {FactsCache} */
export function createFactsCache() {
  return { value: null, started: false }
}

/**
 * @param {FactsCache} cache
 * @returns {Facts}
 */
export function factsSnapshot(cache) {
  const facts = cache.value || { ready: false }
  /* 超时之后晚到的 model / bundles 仍会补进 facts；每次出快照重算指纹，
     避免 hash 与随行的字段对不上。会话数不参与指纹。 */
  if (facts.ready) facts.hash = factsHash(facts)
  return facts
}

/**
 * 用户资料与已加载插件数。
 * @param {HostContext} ctx
 * @param {Facts} facts
 */
function readProfile(ctx, facts) {
  try {
    const pc = service(ctx, 'profileContext') || {}
    facts.profile = pc.name ? String(pc.name).toUpperCase() : null
    facts.bundleCount = Array.isArray(pc.startedBundles) ? pc.startedBundles.length : null
  } catch (err) {
    /* noop */
  }
}

/**
 * 沙箱默认模式；没有默认值时向策略要一次解析结果。
 * @param {HostContext} ctx
 * @param {Facts} facts
 */
function readSandbox(ctx, facts) {
  try {
    const sp = service(ctx, 'sandboxPolicy')
    let mode = sp && sp.defaultMode
    if (!mode && sp && typeof sp.resolve === 'function') {
      const r = sp.resolve()
      mode = r && r.mode
    }
    facts.sandbox = mode ? String(mode) : null
  } catch (err) {
    /* noop */
  }
}

/**
 * 当前会话选用的模型。
 * @param {HostContext} ctx
 * @param {Facts} facts
 */
async function readModel(ctx, facts) {
  try {
    const md = service(ctx, 'agentDefaultModel')
    if (md && typeof md.currentSelection === 'function') {
      const sel = await md.currentSelection()
      facts.model = sel && sel.model ? String(sel.model) : null
    }
  } catch (err) {
    /* noop */
  }
}

/**
 * 插件清单：总数，以及 dsh-base（或第一个插件）的版本。
 * @param {HostContext} ctx
 * @param {Facts} facts
 */
async function readBundles(ctx, facts) {
  try {
    const pm = service(ctx, 'pluginManager')
    if (pm && typeof pm.listBundles === 'function') {
      const list = await pm.listBundles()
      if (Array.isArray(list) && list.length) {
        facts.bundleCount = list.length
        const base = list.find((b) => b && /dsh-base$/.test(String(b.name || '')))
        const core = base || list[0]
        if (core && core.version) facts.version = String(core.version).replace(/^v/, '')
      }
    }
  } catch (err) {
    /* noop */
  }
}

/**
 * 会话数；不同版本的 sessions.list 返回形状不同。
 * @param {HostContext} ctx
 * @param {Facts} facts
 */
async function readSessions(ctx, facts) {
  try {
    const s = service(ctx, 'sessions')
    if (s && typeof s.list === 'function') {
      const r = await s.list()
      if (Array.isArray(r)) facts.sessions = r.length
      else if (r && Array.isArray(r.items)) facts.sessions = r.items.length
      else if (r && Array.isArray(r.sessions)) facts.sessions = r.sessions.length
    }
  } catch (err) {
    /* noop */
  }
}

/**
 * 只取"这台机器上稳定"的项；会话数会变，不参与指纹。
 * @param {Facts} facts
 */
function factsHash(facts) {
  return shortHash(
    [facts.profile, facts.version, facts.model, facts.sandbox, facts.bundleCount]
      .map((x) => (x === null || x === undefined ? '-' : String(x)))
      .join('|'),
  )
}

/** 单个服务读取的上限；任一服务卡住都不能把整块真实信息拖成永远未就绪。 */
const READ_TIMEOUT_MS = 1500

/**
 * 给一次服务读取加超时：到点就当作没读到，晚到的结果仍然会补进 facts。
 *
 * @param {Promise<any>} promise
 * @returns {Promise<void>}
 */
function withTimeout(promise) {
  return new Promise(function (resolve) {
    const timer = setTimeout(resolve, READ_TIMEOUT_MS)
    Promise.resolve(promise).then(
      function () {
        clearTimeout(timer)
        resolve()
      },
      function () {
        clearTimeout(timer)
        resolve()
      },
    )
  })
}

/**
 * @param {HostContext} ctx
 * @param {FactsCache} cache
 * @returns {Facts}
 */
export function collectFacts(ctx, cache) {
  if (cache.started) return cache.value || { ready: false }
  cache.started = true
  /** @type {Facts} */
  const facts = { ready: false }
  cache.value = facts

  ;(async () => {
    readProfile(ctx, facts)
    readSandbox(ctx, facts)
    /* 三个服务互不依赖：并行读，各自超时，慢的那个不阻塞其它字段 */
    await Promise.all([
      withTimeout(readModel(ctx, facts)),
      withTimeout(readBundles(ctx, facts)),
      withTimeout(readSessions(ctx, facts)),
    ])
    Object.assign(facts, readRegistryCounts(ctx))
    facts.hash = factsHash(facts)
    facts.ready = true
  })().catch(() => {
    facts.ready = true
  })

  return facts
}

/* 会话可能比插件启动得晚：每次读取真实信息时顺手重采一次，
   动画播放期间浏览器会轮询几次，晚到的会话数也能补上。 */
/**
 * @param {HostContext} ctx
 * @param {FactsCache} cache
 */
export async function refreshSessions(ctx, cache) {
  const facts = cache.value
  if (!facts) return
  /* 轮询路径同样要有上限：sessions 服务卡住时不能把 /facts 一起拖死。 */
  await withTimeout(readSessions(ctx, facts))
  Object.assign(facts, readRegistryCounts(ctx))
}
