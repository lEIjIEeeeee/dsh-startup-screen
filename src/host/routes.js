import fs from 'node:fs'
import path from 'node:path'
import { DEFAULTS } from '../shared/defaults.js'
import { NS, ROUTES } from '../shared/routes.js'
import { factsSnapshot, refreshSessions } from './facts.js'

/** @typedef {import('node:http').IncomingMessage} IncomingMessage */
/** @typedef {import('node:http').ServerResponse} ServerResponse */
/** @typedef {import('./types.js').HostEnv} HostEnv */
/** @typedef {import('./types.js').Route} Route */

/**
 * 静态文件按修改时间缓存：改完插件刷新页面就生效。文件缺失返回 null，由调用方回 503。
 * @param {string} file
 * @returns {() => string | null}
 */
function makeReader(file) {
  /** @type {{ mtimeMs: number, text: string } | null} */
  let cache = null
  return function read() {
    try {
      const st = fs.statSync(file)
      if (!cache || cache.mtimeMs !== st.mtimeMs) {
        cache = { mtimeMs: st.mtimeMs, text: fs.readFileSync(file, 'utf8') }
      }
      return cache.text
    } catch (err) {
      return null
    }
  }
}

/**
 * @param {ServerResponse} res
 * @param {number} code
 * @param {any} payload
 * @param {(() => void)} [done]
 */
function sendJson(res, code, payload, done) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(body, done)
}

/**
 * 读请求体。三种结果：
 *   `{ tooLarge: true }` 超限，调用方回 413；
 *   `{ error: true }`    连接中断或超时，调用方回 400，绝不能当成空 patch 写盘；
 *   其余                 正常读到文本。
 *
 * @param {IncomingMessage} req
 * @param {number} [limit]
 * @param {number} [timeoutMs]
 * @returns {Promise<{ tooLarge: boolean, text: string, error?: boolean }>}
 */
function readBody(req, limit = 64 * 1024, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let size = 0
    let settled = false
    /** @type {Buffer[]} */
    const chunks = []
    /**
     * @param {{ tooLarge: boolean, text: string, error?: boolean }} result
     */
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => {
      try {
        if (typeof req.destroy === 'function') req.destroy()
      } catch (err) {
        /* noop */
      }
      finish({ tooLarge: false, text: '', error: true })
    }, timeoutMs)
    req.on('data', (c) => {
      if (settled) return
      size += c.length
      if (size > limit) {
        chunks.length = 0
        /* 先暂停，让调用方把 413 写出去，连接随后再销毁 */
        try {
          if (typeof req.pause === 'function') req.pause()
        } catch (err) {
          /* noop */
        }
        finish({ tooLarge: true, text: '' })
        return
      }
      chunks.push(c)
    })
    req.on('end', () => finish({ tooLarge: false, text: Buffer.concat(chunks).toString('utf8') }))
    req.on('error', () => finish({ tooLarge: false, text: '', error: true }))
  })
}

/**
 * @param {ServerResponse} res
 * @param {string} type
 * @param {string} text
 * @param {boolean} [headOnly] HEAD 请求只发头，不发正文
 */
function sendText(res, type, text, headOnly) {
  const body = Buffer.from(text, 'utf8')
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(headOnly ? undefined : body)
}

/** @param {IncomingMessage} req */
function methodOf(req) {
  return (req.method || 'GET').toUpperCase()
}

/**
 * 构建产物缺失：路由在、文件不在，属于服务端配置问题，回 503 让浏览器侧直接走兜底。
 * @param {ServerResponse} res
 */
function sendUnavailable(res) {
  res.writeHead(503, { 'X-Content-Type-Options': 'nosniff' })
  res.end()
}

/**
 * 注册 HTTP 路由，返回对应的 disposer 列表。
 * @param {HostEnv} host
 * @returns {Array<() => void>}
 */
export function registerRoutes(host) {
  const { ctx, webServer, packageRoot, version, factsCache, readConfig, writeConfig, configFile } =
    host
  const readSplashCss = makeReader(path.join(packageRoot, 'lib', 'splash.css'))
  const readSplashJs = makeReader(path.join(packageRoot, 'lib', 'splash.js'))
  const assetsDir = path.join(packageRoot, 'lib', 'assets')
  /** @type {Array<() => void>} */
  const disposers = []

  /** @param {string} message @param {any} [err] */
  function warn(message, err) {
    try {
      const detail = err && err.message ? err.message : err
      ctx.logger?.warn?.('[' + NS + '] ' + message + (detail ? '：' + detail : ''))
    } catch (e) {
      /* 日志失败不影响请求 */
    }
  }

  /**
   * 来源校验：自定义路由必须过这一关，否则任意网页都能读写配置。
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   */
  function rejected(req, res) {
    try {
      const conn =
        (typeof ctx.get === 'function' ? ctx.get('connection') : undefined) || ctx.connection
      if (!conn || typeof conn.requestRejection !== 'function') return false
      const code = conn.requestRejection(req)
      if (code === undefined || code === null || code === false) return false
      res.statusCode = typeof code === 'number' ? code : 403
      res.end()
      return true
    } catch (err) {
      /* 校验服务存在但自己出错：宁可拒绝，也不能当成“没有服务”放行 */
      warn('来源校验失败，已拒绝请求', err)
      try {
        res.statusCode = 403
        res.end()
      } catch (e) {
        /* 连接已断开 */
      }
      return true
    }
  }

  /**
   * 统一包一层：来源校验 + 异常兜底。handler 的 req/res 类型由 Route 给出。
   * @param {Route} route
   * @returns {() => void}
   */
  function registerRoute(route) {
    const inner = route.handler
    /** @type {Route} */
    const wrapped = {
      kind: route.kind,
      path: route.path,
      handler: async (req, res) => {
        if (rejected(req, res)) return
        /* 连接提前断开时 res.writeHead 会抛；这里兜住，避免变成 unhandled rejection。 */
        try {
          await inner(req, res)
        } catch (err) {
          warn('路由处理失败', err)
          try {
            if (!res.headersSent) {
              sendJson(res, 500, { ok: false, error: 'internal error' })
            } else if (typeof res.destroy === 'function') {
              res.destroy()
            }
          } catch (e) {
            try {
              res.statusCode = 500
              res.end()
            } catch (e2) {
              /* 连接已断开 */
            }
          }
        }
      },
    }
    return webServer.register(wrapped)
  }

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.css,
      handler: (req, res) => {
        const method = methodOf(req)
        if (method !== 'GET' && method !== 'HEAD') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        const text = readSplashCss()
        if (text === null) return sendUnavailable(res)
        sendText(res, 'text/css; charset=utf-8', text, method === 'HEAD')
      },
    }),
  )

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.splash,
      handler: (req, res) => {
        const method = methodOf(req)
        if (method !== 'GET' && method !== 'HEAD') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        const text = readSplashJs()
        if (text === null) return sendUnavailable(res)
        sendText(res, 'application/javascript; charset=utf-8', text, method === 'HEAD')
      },
    }),
  )

  /* 音频素材：只读、白名单、不含子路径，杜绝目录穿越。
     素材缺失时浏览器会自动改用合成音。 */
  disposers.push(
    registerRoute({
      kind: 'prefix',
      path: ROUTES.asset,
      handler: (req, res) => {
        const method = methodOf(req)
        if (method !== 'GET' && method !== 'HEAD') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
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
          'X-Content-Type-Options': 'nosniff',
        })
        res.end(method === 'HEAD' ? undefined : bytes)
      },
    }),
  )

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.config,
      handler: async (req, res) => {
        const method = methodOf(req)
        if (method === 'GET') {
          sendJson(res, 200, {
            ok: true,
            version,
            config: readConfig(),
            defaults: DEFAULTS,
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
        if (body.error) {
          sendJson(res, 400, { ok: false, error: 'request aborted' })
          return
        }
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
            const cfgNow = writeConfig(DEFAULTS)
            sendJson(res, 200, { ok: true, version, config: cfgNow, defaults: DEFAULTS })
            return
          }
          const current = readConfig()
          const patch =
            payload && typeof payload.patch === 'object' && payload.patch ? payload.patch : payload
          const cfgNow = writeConfig({ ...current, ...patch })
          sendJson(res, 200, { ok: true, version, config: cfgNow, defaults: DEFAULTS })
        } catch (err) {
          /* 细节只进日志，响应里不吐路径等内部信息 */
          warn('保存配置失败', err)
          sendJson(res, 500, { ok: false, error: 'internal error' })
        }
      },
    }),
  )

  disposers.push(
    registerRoute({
      kind: 'exact',
      path: ROUTES.facts,
      handler: async (req, res) => {
        if (methodOf(req) !== 'GET') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        try {
          await refreshSessions(ctx, factsCache)
        } catch (err) {
          warn('刷新会话数失败', err)
        }
        sendJson(res, 200, { ok: true, facts: factsSnapshot(factsCache) })
      },
    }),
  )

  return disposers
}
