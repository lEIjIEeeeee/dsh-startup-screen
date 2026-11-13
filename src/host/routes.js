// @ts-nocheck —— 迁移期先不收紧类型，后续再逐块补 JSDoc。
import fs from 'node:fs'
import path from 'node:path'
import { ROUTES } from '../shared/routes.js'
import { factsSnapshot, refreshSessions } from './facts.js'

/** 静态文件按修改时间缓存：改完插件刷新页面就生效。 */
function makeReader(file) {
  let cache = null
  return function read() {
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

function sendJson(res, code, payload, done) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
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
        try {
          if (typeof req.pause === 'function') req.pause()
        } catch (err) {
          /* noop */
        }
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
    'Content-Length': String(body.length),
  })
  res.end(body)
}

/**
 * 注册 5 条 HTTP 路由，返回对应的 disposer 列表。
 * host: { ctx, webServer, packageRoot, version, factsCache, readConfig, writeConfig, defaults, configFile }
 */
export function registerRoutes(host) {
  const { ctx, webServer, packageRoot, version, factsCache, readConfig, writeConfig, defaults, configFile } = host
  const readSplashCss = makeReader(path.join(packageRoot, 'lib', 'splash.css'))
  const readSplashJs = makeReader(path.join(packageRoot, 'lib', 'splash.js'))
  const assetsDir = path.join(packageRoot, 'lib', 'assets')
  const disposers = []

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
      },
    })
    return webServer.register(wrapped)
  }

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.css,
      handler: (req, res) => sendText(res, 'text/css; charset=utf-8', readSplashCss()),
    })
  )

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.splash,
      handler: (req, res) => sendText(res, 'application/javascript; charset=utf-8', readSplashJs()),
    })
  )

  /* 音频素材：只读、白名单、不含子路径，杜绝目录穿越。
     素材缺失时浏览器会自动改用合成音。 */
  disposers.push(
    registerRoute({
      kind: 'prefix',
      path: ROUTES.asset,
      handler: (req, res) => {
        let pathname
        try {
          pathname = decodeURIComponent((req.url || '').split('?')[0])
        } catch (err) {
          /* 畸形百分号编码（如 /asset/%E0%A4%A）不能让 handler 抛出去 */
          res.writeHead(400)
          res.end()
          return
        }
        const name = path.basename(pathname)
        if (!/^[a-z0-9._-]+\.mp3$/i.test(name) || name.includes('..')) {
          res.writeHead(404)
          res.end()
          return
        }
        let bytes
        try {
          bytes = fs.readFileSync(path.join(assetsDir, name))
        } catch (err) {
          res.writeHead(404)
          res.end()
          return
        }
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': String(bytes.length),
        })
        res.end(bytes)
      },
    })
  )

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.config,
      handler: async (req, res) => {
        const method = (req.method || 'GET').toUpperCase()
        if (method === 'GET') {
          sendJson(res, 200, {
            ok: true,
            version,
            config: readConfig(),
            defaults,
            file: configFile,
            facts: factsSnapshot(factsCache),
          })
          return
        }
        if (method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        const body = await readBody(req)
        if (body.tooLarge) {
          sendJson(res, 413, { ok: false, error: 'payload too large' }, () => {
            try {
              if (typeof req.destroy === 'function') req.destroy()
            } catch (err) {
              /* noop */
            }
          })
          return
        }
        let payload
        try {
          payload = body.text ? JSON.parse(body.text) : {}
        } catch (err) {
          sendJson(res, 400, { ok: false, error: 'invalid json' })
          return
        }
        try {
          if (payload && payload.action === 'reset') {
            const cfgNow = writeConfig(defaults)
            sendJson(res, 200, { ok: true, version, config: cfgNow, defaults })
            return
          }
          const current = readConfig()
          const patch = payload && typeof payload.patch === 'object' && payload.patch ? payload.patch : payload
          const cfgNow = writeConfig({ ...current, ...patch })
          sendJson(res, 200, { ok: true, version, config: cfgNow, defaults })
        } catch (err) {
          sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
        }
      },
    })
  )

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.facts,
      handler: (req, res) => {
        if ((req.method || 'GET').toUpperCase() !== 'GET') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        try {
          refreshSessions(ctx, factsCache)
        } catch (err) {
          /* noop */
        }
        sendJson(res, 200, { ok: true, facts: factsSnapshot(factsCache) })
      },
    })
  )

  return disposers
}
