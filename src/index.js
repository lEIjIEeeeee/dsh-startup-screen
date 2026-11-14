/* ============================================================================
 * dsh-startup-screen — 宿主侧入口
 *
 * 只做装配：算路径、拿服务、把路由 / 注入 / 配置 / 事实采集接起来。
 * 具体实现分在 host/ 下的几个模块里：
 *   config.js  配置读写（原子落盘）
 *   facts.js   启动界面要显示的真实信息
 *   routes.js  HTTP 路由
 *   inject.js  index.html 首屏注入
 *
 * 配置不走宿主的 settings 服务，而是自己存一份 JSON、自己画设置面板，
 * 这样宿主升级设置模块时不会把这里带崩。
 * ========================================================================== */

import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NS } from './shared/routes.js'
import { createConfig } from './host/config.js'
import { collectFacts, createFactsCache } from './host/facts.js'
import { registerRoutes } from './host/routes.js'
import { injectIndex } from './host/inject.js'

/** @typedef {import('./host/types.js').HostContext} HostContext */

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const CONFIG_FILE = path.join(DSH_HOME, 'dsh-startup.json')

/* 版本号由构建时注入，唯一来源是 package.json。 */
const PLUGIN_VERSION = __PLUGIN_VERSION__

const name = NS
const inject = ['webServer', 'connection']

/**
 * 取 HTTP 服务。网页版和桌面版通常都会提供；桌面版也可能改用 file:// 加进程通信
 * 直接下发页面，这时没有 HTTP 服务，插件不能因此报错，改由浏览器侧自己启动动画。
 * @param {HostContext} ctx
 */
function resolveWebServer(ctx) {
  try {
    const viaGet = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
    if (viaGet) return viaGet
  } catch (err) { /* 取不到就当没有 */ }
  return ctx.webServer
}

/**
 * @param {any} server
 * @returns {boolean}
 */
function hasRoutes(server) {
  return !!server && typeof server.register === 'function' && typeof server.tapIndex === 'function'
}

/** @param {HostContext} ctx */
function apply(ctx) {
  /* 每次 apply 一份新缓存：宿主热重载时不会沿用旧 ctx 采到的快照。 */
  const factsCache = createFactsCache()
  try { collectFacts(ctx, factsCache) } catch (err) { /* 采事实失败绝不影响插件 */ }
  /** @type {Array<() => void>} */
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

  const config = createConfig(CONFIG_FILE)
  const host = {
    ctx,
    webServer,
    packageRoot: PACKAGE_ROOT,
    configFile: CONFIG_FILE,
    version: PLUGIN_VERSION,
    factsCache,
    readConfig: config.read,
    writeConfig: config.write,
  }

  /* 装配中途失败时把已注册的路由和 effect 一起摘掉，避免宿主里留下半套插件。 */
  try {
    disposers.push(...registerRoutes(host))
    disposers.push(injectIndex(host))
    ctx.effect(() => () => {
      for (const dispose of disposers) {
        try { dispose() } catch (err) { /* noop */ }
      }
    })
  } catch (err) {
    for (const dispose of disposers) {
      try { dispose() } catch (e) { /* noop */ }
    }
    throw err
  }
}

/* 只导出 name / inject / apply 三个具名成员，和宿主内置插件保持一致。
   不额外写默认导出：两种写法并存时容易改一处漏一处；
   也不把默认值包装成宿主的配置规则类型，两者含义不同。 */
export { apply, inject, name }
