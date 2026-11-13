/* ============================================================================
 * dsh-startup-screen — 宿主侧
 *
 * 负责三件事：
 *   把启动界面注入页面首屏；
 *   提供动画的样式、脚本、配置和音频素材路由；
 *   把设置读写到 ~/.dsh/dsh-startup.json。
 *
 * 配置不走宿主的 settings 服务，而是自己存一份 JSON、自己画设置面板，
 * 这样宿主升级设置模块时不会把这里带崩。
 * ========================================================================== */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const CONFIG_FILE = path.join(DSH_HOME, 'dsh-startup.json')

const NS = 'dsh-startup-screen'
const ROUTE_BASE = '/dsh-startup'

/** 版本号只从 package.json 读一次，避免源码里再写一份。
    读不到时用 0.0.0，设置面板会显示它，不会显示 undefined。 */
const PLUGIN_VERSION = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'))
    const v = String(pkg.version || '').trim()
    return v || '0.0.0'
  } catch (err) {
    return '0.0.0'
  }
})()

/** 默认配置。字段与浏览器侧的默认值保持一致，改这里要同步改那边。 */
const DEFAULTS = {
  enabled: true,
  mode: 'session',            // always | session | daily
  theme: 'light',             // light | dark
  speed: 1,
  requireInteraction: true,
  allowSkip: true,
  ambient: true,              // 环境光效：Canvas 光场 + 氛围层 + 电影感细节
  sound: true,                // 界面音效（WebAudio 合成，无音频文件）
  soundVolume: 0.5,
  voice: true,                // 女声播报（Web Speech API）
  voiceLang: 'en',            // en | zh | both
  voiceName: '',              // '' = 自动挑（按分数优先神经网络女声）
  voiceRate: 0.88,            // 电影旁白档：比朗读慢，字与字之间才有重量
  voicePitch: 0.85,           // 压低音调，深沉的 AI 女声
  voiceVolume: 0.9,
  voiceCue: true,             // 念台词前的一声轻提示
  sfx: 'audio',               // 音效来源：audio=lib/assets 里的真素材 / synth=现场合成
  voiceSource: 'asset',       // 语音来源：asset=优先用真声素材（拿不到自动回落 TTS）/ tts=全 TTS
  voiceLead: 240,             // 提示音之后留一小段空白再开口
  identity: 'JOYCE MOORE',    // ← 设置页里可改的「身份名称」
  identityId: '0087',
  accessLevel: '3',
  brand1: 'DEEPSEEK',
  brand2: 'SYNTHESIZE INTELLIGENCE',
  brand3a: 'HARNESS',
  brand3b: 'OS',
  orgZh: '深度求索',
  orgEn: 'DEEPSEEK',
  orgSub: 'DEEPSEEK HARNESS',
  welcomeBox: 'DEEPSEEK HARNESS',
  footer: 'POWERED BY DEEPSEEK',
  accent: '#ff7500',
  glitchA: '#ff3b30',
  glitchB: '#2971b8',
  /* 液态玻璃：背景层做成半透明磨砂，能透出后面的窗口；文字和图形保持不透明。
     默认关闭，实心底板更像成片。 */
  glass: false,               // 总开关（默认关：实心底板更像成片；想透桌面再开）
  glassOpacity: 0.75,         // 0.15 ~ 0.95：越低越透；0.75 时背后是「暖白模糊」而不是灰
  glassBlur: 22,              // 0 ~ 60px：玻璃自身的磨砂
  glassSaturate: 160,         // 100 ~ 200%：玻璃后面的饱和度（液态玻璃那种通透感）
  glassBackdropBlur: 28       // 0 ~ 80px：背景模糊（实际作用于应用本体，超过 60 会糊成纯色）
}

const TEXT_KEYS = [
  'identity', 'identityId', 'accessLevel',
  'brand1', 'brand2', 'brand3a', 'brand3b',
  'orgZh', 'orgEn', 'orgSub', 'welcomeBox', 'footer', 'voiceName'
]
const COLOR_KEYS = ['accent', 'glitchA', 'glitchB']
const ENUMS = {
  mode: ['always', 'session', 'daily'],
  theme: ['light', 'dark'],
  voiceLang: ['en', 'zh', 'both'],
  sfx: ['audio', 'synth'],
  voiceSource: ['asset', 'tts']
}
const BOOL_KEYS = ['enabled', 'requireInteraction', 'allowSkip', 'ambient', 'sound', 'voice', 'voiceCue', 'glass']
/** 数值字段的合法区间（越界即夹取）。 */
const RANGES = {
  speed: [0.35, 3],
  soundVolume: [0, 1],
  voiceRate: [0.5, 2],
  voiceLead: [0, 1200],
  voicePitch: [0, 2],
  voiceVolume: [0, 1],
  glassOpacity: [0.15, 0.95],
  glassBlur: [0, 60],
  glassSaturate: [100, 200],
  glassBackdropBlur: [0, 80]
}

function normalize(input) {
  const out = { ...DEFAULTS }
  const src = input && typeof input === 'object' ? input : {}
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in src) || src[key] === undefined || src[key] === null) continue
    const value = src[key]
    if (BOOL_KEYS.includes(key)) {
      out[key] = value === true || value === 'true' || value === 1 || value === '1'
    } else if (ENUMS[key]) {
      out[key] = ENUMS[key].includes(value) ? value : DEFAULTS[key]
    } else if (key === 'speed' || RANGES[key]) {
      const [lo, hi] = RANGES[key] || RANGES.speed
      const n = Number(value)
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key]
    } else if (COLOR_KEYS.includes(key)) {
      const s = String(value).trim()
      out[key] = /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : DEFAULTS[key]
    } else if (TEXT_KEYS.includes(key)) {
      out[key] = String(value).slice(0, 64)
    } else {
      out[key] = value
    }
  }
  if (!String(out.identity).trim()) out.identity = DEFAULTS.identity
  if (!String(out.identityId).trim()) {
    out.identityId = String(out.identity).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
  }
  if (!String(out.identityId).trim()) out.identityId = 'OPERATOR'
  return out
}

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    return normalize(JSON.parse(raw))
  } catch (err) {
    return { ...DEFAULTS }
  }
}

function writeConfig(next) {
  const cfg = normalize(next)
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true })
  const tmp = CONFIG_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8')
  fs.renameSync(tmp, CONFIG_FILE)
  return cfg
}

/** 静态文件按修改时间缓存：改完插件刷新页面就生效。 */
function makeReader(rel) {
  let cache = null
  return function read() {
    const file = path.join(PACKAGE_ROOT, rel)
    try {
      const st = fs.statSync(file)
      if (!cache || cache.mtimeMs !== st.mtimeMs) {
        cache = { mtimeMs: st.mtimeMs, text: fs.readFileSync(file, 'utf8') }
      }
      return cache.text
    } catch (err) {
      return ''
    }
  }
}

const readSplashCss = makeReader('lib/splash.css')
const readSplashJs = makeReader('lib/splash.js')

/** 内联到页面里的 JSON 不能出现 `</script>`。 */
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')
}

/** 首屏兜底样式：在应用挂载前先盖住窗口，避免闪出界面本体。 */
const CRITICAL_CSS = [
  'html.dsu-lock,html.dsu-lock body{overflow:hidden!important}',
  /* 宿主会先给页面写一条白色背景，覆盖层插入前或玻璃透明时会露出来，
     所以启动期间统一压成黑色，和黑幕开场一致。 */
  'html.dsu-lock body{background-color:#000!important}',
  ':root{--dsh-boot-bg:#000}',
  '#dsh-startup-root.dsu-boot{position:fixed;inset:0;z-index:2147483000;background:#000}'
].join('')

const BOOTSTRAP_JS = `(function(){try{
var c=window.__DSH_STARTUP__||{};
var root=document.getElementById('dsh-startup-root');
var off=!c.enabled;
if(!off&&c.mode==='session'){try{if(sessionStorage.getItem('dsh-startup-screen:shown')==='1')off=true}catch(e){}}
if(!off&&c.mode==='daily'){try{if(localStorage.getItem('dsh-startup-screen:day')===new Date().toISOString().slice(0,10))off=true}catch(e){}}
if(off){window.__DSH_STARTUP_SKIP__=true;if(root&&root.parentNode)root.parentNode.removeChild(root);}
else{document.documentElement.classList.add('dsu-lock');/* 兜底：动画脚本没跑起来（404、被拦、语法错）时，9 秒后无条件放行，绝不锁死黑屏。判断依据是时间线有没有开始，不能按类名判断 */setTimeout(function(){try{if(window.__DSH_STARTUP_RUNNING__===true)return;var r=document.getElementById('dsh-startup-root');if(r&&r.parentNode)r.parentNode.removeChild(r);document.documentElement.classList.remove('dsu-lock');if(document.body)document.body.style.overflow='';window.__DSH_STARTUP_FAILED__=true;}catch(e){}},9000);}
}catch(e){} })()`

const name = NS
const inject = ['webServer', 'connection']

/**
 * 取 HTTP 服务。网页版和桌面版通常都会提供；桌面版也可能改用 file:// 加进程通信
 * 直接下发页面，这时没有 HTTP 服务，插件不能因此报错，改由浏览器侧自己启动动画。
 */
function resolveWebServer(ctx) {
  try {
    const viaGet = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
    if (viaGet) return viaGet
  } catch (err) { /* 取不到就当没有 */ }
  return ctx.webServer
}

function hasRoutes(server) {
  return !!server && typeof server.register === 'function' && typeof server.tapIndex === 'function'
}

/* ============================================================================
 * 采集启动界面要显示的真实信息：运行环境、版本、插件数、模型、沙箱模式、会话数。
 * 逐步异步填充，先给页面一份快照，浏览器再补一次。
 * 取不到的字段留空，页面显示 "—"，绝不把异常抛给宿主。
 * ========================================================================== */

/** 生成 8 位十六进制短指纹，只用来保证同一台机器的光场构图一致，不用于安全用途。 */
function shortHash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).toUpperCase().padStart(8, '0')
}

const factsCache = { value: null, started: false }

function collectFacts(ctx) {
  if (factsCache.started) return factsCache.value
  factsCache.started = true
  const facts = { ready: false }
  factsCache.value = facts
  const get = (n) => { try { return typeof ctx.get === 'function' ? ctx.get(n) : undefined } catch (err) { return undefined } }

  ;(async () => {
    try {
      const pc = get('profileContext') || {}
      facts.profile = pc.name ? String(pc.name).toUpperCase() : null
      facts.bundleCount = Array.isArray(pc.startedBundles) ? pc.startedBundles.length : null
    } catch (err) { /* noop */ }

    try {
      const sp = get('sandboxPolicy')
      let mode = sp && sp.defaultMode
      if (!mode && sp && typeof sp.resolve === 'function') {
        const r = sp.resolve()
        mode = r && r.mode
      }
      facts.sandbox = mode ? String(mode) : null
    } catch (err) { /* noop */ }

    try {
      const md = get('agentDefaultModel')
      if (md && typeof md.currentSelection === 'function') {
        const sel = await md.currentSelection()
        facts.model = sel && sel.model ? String(sel.model) : null
      }
    } catch (err) { /* noop */ }

    try {
      const pm = get('pluginManager')
      if (pm && typeof pm.listBundles === 'function') {
        const list = await pm.listBundles()
        if (Array.isArray(list) && list.length) {
          facts.bundleCount = list.length
          const base = list.find((b) => b && /dsh-base$/.test(String(b.name || '')))
          const core = base || list[0]
          if (core && core.version) facts.version = String(core.version).replace(/^v/, '')
        }
      }
    } catch (err) { /* noop */ }

    try {
      const s = get('sessions')
      if (s && typeof s.list === 'function') {
        const r = await s.list()
        if (Array.isArray(r)) facts.sessions = r.length
      }
    } catch (err) { /* noop */ }

    try {
      /* 工作区注册表知道所有工作区里的会话 + 归档会话；
         sessions.list() 默认不含归档，所以 SESSIONS 优先用这里的总数。 */
      const wr = get('workspaceRegistry')
      if (wr && typeof wr.list === 'function') {
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
          facts.sessionsArchived = wr.archivedSessionIds.length
        }
        if (ids.size) facts.sessionsTotal = ids.size
      }
    } catch (err) { /* noop */ }

    /* 只取"这台机器上稳定"的项；会话数会变，不参与指纹 */
    facts.hash = shortHash([
      facts.profile, facts.version, facts.model, facts.sandbox, facts.bundleCount
    ].map((x) => (x === null || x === undefined) ? '-' : String(x)).join('|'))
    facts.ready = true
  })().catch(() => { facts.ready = true })

  return facts
}

/* 会话可能比插件启动得晚：每次读取真实信息时顺手重采一次，
   动画播放期间浏览器会轮询几次，晚到的会话数也能补上。 */
async function refreshSessions(ctx) {
  const facts = factsCache.value
  if (!facts) return
  const get = (n) => { try { return typeof ctx.get === 'function' ? ctx.get(n) : undefined } catch (err) { return undefined } }
  try {
    const s = get('sessions')
    if (!s || typeof s.list !== 'function') return
    const r = await s.list()
    if (Array.isArray(r)) facts.sessions = r.length
    else if (r && Array.isArray(r.items)) facts.sessions = r.items.length
    else if (r && Array.isArray(r.sessions)) facts.sessions = r.sessions.length
  } catch (err) { /* noop */ }
  try {
    const wr = get('workspaceRegistry')
    if (wr && typeof wr.list === 'function') {
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
        facts.sessionsArchived = wr.archivedSessionIds.length
      }
      if (ids.size) facts.sessionsTotal = ids.size
    }
  } catch (err) { /* noop */ }
}

function apply(ctx) {
  try { collectFacts(ctx) } catch (err) { /* 采事实失败绝不影响插件 */ }
  const disposers = []
  const webServer = resolveWebServer(ctx)

  /** 没有可注册路由的 HTTP 服务：什么都不注册，插件本身仍然正常加载，
      页面由浏览器侧自己启动动画。 */
  if (!hasRoutes(webServer)) {
    try {
      ctx.logger?.warn?.(
        '[' + NS + '] 当前环境没有可用的 webServer（桌面端可能直接下发页面）；' +
        '宿主侧跳过路由与首屏注入，改由浏览器侧自己启动动画。'
      )
    } catch (err) { /* 日志失败不影响加载 */ }
    return
  }

  /** 来源校验：自定义路由必须过这一关，否则任意网页都能读写配置。 */
  function rejected(req, res) {
    try {
      const conn = (typeof ctx.get === 'function' ? ctx.get('connection') : undefined) || ctx.connection
      if (!conn || typeof conn.requestRejection !== 'function') return false
      const code = conn.requestRejection(req)
      if (code === undefined || code === null || code === false) return false
      res.statusCode = typeof code === 'number' ? code : 403
      res.end()
      return true
    } catch (err) {
      return false
    }
  }

  function registerRoute(route) {
    const inner = route && route.handler
    const wrapped = Object.assign({}, route, {
      handler: async (req, res) => {
        if (rejected(req, res)) return
        return inner(req, res)
      }
    })
    return webServer.register(wrapped)
  }

  function sendJson(res, code, payload, done) {
    const body = Buffer.from(JSON.stringify(payload), 'utf8')
    res.writeHead(code, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': String(body.length)
    })
    res.end(body, done)
  }

  /** 读请求体；超限返回 `{ tooLarge: true }`，由调用方回 413，绝不把空 patch 当成功写盘。 */
  function readBody(req, limit = 64 * 1024) {
    return new Promise((resolve) => {
      let size = 0
      let tooLarge = false
      const chunks = []
      req.on('data', (c) => {
        if (tooLarge) return
        size += c.length
        if (size > limit) {
          tooLarge = true
          chunks.length = 0
          /* 先暂停，让调用方把 413 写出去，连接随后再销毁 */
          try { if (typeof req.pause === 'function') req.pause() } catch (err) { /* noop */ }
          resolve({ tooLarge: true, text: '' })
          return
        }
        chunks.push(c)
      })
      req.on('end', () => {
        if (!tooLarge) resolve({ tooLarge: false, text: Buffer.concat(chunks).toString('utf8') })
      })
      req.on('error', () => {
        if (!tooLarge) resolve({ tooLarge: false, text: '' })
      })
    })
  }

  function sendText(res, type, text) {
    const body = Buffer.from(text, 'utf8')
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'Content-Length': String(body.length)
    })
    res.end(body)
  }

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/splash.css',
    handler: (req, res) => sendText(res, 'text/css; charset=utf-8', readSplashCss())
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/splash.js',
    handler: (req, res) => sendText(res, 'application/javascript; charset=utf-8', readSplashJs())
  }))

  /* 音频素材：只读、白名单、不含子路径，杜绝目录穿越。
     素材缺失时浏览器会自动改用合成音。 */
  disposers.push(registerRoute({
    kind: 'prefix',
    path: ROUTE_BASE + '/asset',
    handler: (req, res) => {
      let pathname
      try {
        pathname = decodeURIComponent((req.url || '').split('?')[0])
      } catch (err) {
        /* 畸形百分号编码（如 /asset/%E0%A4%A）不能让 handler 抛出去 */
        res.writeHead(400); res.end(); return
      }
      const name = path.basename(pathname)
      if (!/^[a-z0-9._-]+\.mp3$/i.test(name) || name.includes('..')) {
        res.writeHead(404); res.end(); return
      }
      const file = path.join(PACKAGE_ROOT, 'lib', 'assets', name)
      let bytes
      try { bytes = fs.readFileSync(file) } catch (err) {
        res.writeHead(404); res.end(); return
      }
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': String(bytes.length)
      })
      res.end(bytes)
    }
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/config',
    handler: async (req, res) => {
      const method = (req.method || 'GET').toUpperCase()
      if (method === 'GET') {
        sendJson(res, 200, { ok: true, version: PLUGIN_VERSION, config: readConfig(), defaults: DEFAULTS, file: CONFIG_FILE, facts: factsCache.value || { ready: false } })
        return
      }
      if (method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' })
        return
      }
      const body = await readBody(req)
      if (body.tooLarge) {
        sendJson(res, 413, { ok: false, error: 'payload too large' }, () => {
          try { if (typeof req.destroy === 'function') req.destroy() } catch (err) { /* noop */ }
        })
        return
      }
      let payload = {}
      try {
        payload = body.text ? JSON.parse(body.text) : {}
      } catch (err) {
        sendJson(res, 400, { ok: false, error: 'invalid json' })
        return
      }
      try {
        if (payload && payload.action === 'reset') {
          const cfgNow = writeConfig(DEFAULTS)
          sendJson(res, 200, { ok: true, version: PLUGIN_VERSION, config: cfgNow, defaults: DEFAULTS })
          return
        }
        const current = readConfig()
        const patch = payload && typeof payload.patch === 'object' && payload.patch ? payload.patch : payload
        const cfgNow = writeConfig({ ...current, ...patch })
        sendJson(res, 200, { ok: true, version: PLUGIN_VERSION, config: cfgNow, defaults: DEFAULTS })
      } catch (err) {
        sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
      }
    }
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/facts',
    handler: (req, res) => {
      if ((req.method || 'GET').toUpperCase() !== 'GET') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' })
        return
      }
      try { refreshSessions(ctx) } catch (err) { /* noop */ }
      sendJson(res, 200, { ok: true, facts: factsCache.value || { ready: false } })
    }
  }))

  disposers.push(webServer.tapIndex((html) => {
    if (!html || html.includes(ROUTE_BASE + '/splash.js')) return html
    const cfg = readConfig()
    cfg.facts = factsCache.value || { ready: false }
    const head =
      '<link rel="stylesheet" href="' + ROUTE_BASE + '/splash.css">' +
      '<style id="dsh-startup-critical">' + CRITICAL_CSS + '</style>'
    const body =
      '<div id="dsh-startup-root" class="dsu-root dsu-boot"></div>' +
      '<script>window.__DSH_STARTUP_BOOT__="index";window.__DSH_STARTUP_VERSION__=' + safeJson(PLUGIN_VERSION) + ';window.__DSH_STARTUP__=' + safeJson(cfg) + ';' + BOOTSTRAP_JS + '</script>' +
      '<script defer src="' + ROUTE_BASE + '/splash.js"></script>'

    let out = html
    if (out.includes('</head>')) out = out.replace('</head>', head + '</head>')
    else out = head + out
    if (out.includes('<body>')) out = out.replace('<body>', '<body>' + body)
    else if (out.includes('</body>')) out = out.replace('</body>', body + '</body>')
    else out = out + body
    return out
  }))

  ctx.effect(() => () => {
    for (const dispose of disposers) {
      try { dispose() } catch (err) { /* noop */ }
    }
  })
}

/* 只导出 name / inject / apply 三个具名成员，和宿主内置插件保持一致。
   两点刻意不做：
   有 default 导出时加载器只认 default，两边都写容易改一处漏一处；
   Config 在宿主里是配置校验规则，这里只是普通默认值，混用会出错。 */
export { apply, inject, name }
