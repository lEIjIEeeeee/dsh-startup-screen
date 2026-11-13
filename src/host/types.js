/* 宿主模块共用的 JSDoc 类型；只在类型检查时使用，运行时没有任何代码。 */
export {}

/**
 * 宿主 ctx 里本插件用到的部分。
 * @typedef {object} HostContext
 * @property {(name: string) => any} [get]
 * @property {any} [webServer]
 * @property {any} [connection]
 * @property {{ warn?: (msg: string) => void }} [logger]
 * @property {(fn: () => (() => void)) => void} effect
 */

/**
 * @typedef {object} WebServer
 * @property {(route: Route) => () => void} register
 * @property {(fn: (html: string) => string) => () => void} tapIndex
 */

/**
 * @typedef {object} Route
 * @property {string} kind
 * @property {string} path
 * @property {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => any} handler
 */

/** @typedef {Record<string, any>} Config */

/**
 * 启动界面要显示的真实信息。取不到的字段留空，页面显示 "—"。
 * @typedef {object} Facts
 * @property {boolean} ready
 * @property {string|null} [profile]
 * @property {string|null} [version]
 * @property {string|null} [model]
 * @property {string|null} [sandbox]
 * @property {number|null} [bundleCount]
 * @property {number} [sessions]
 * @property {number} [sessionsArchived]
 * @property {number} [sessionsTotal]
 * @property {string} [hash]
 */

/**
 * @typedef {object} FactsCache
 * @property {Facts|null} value
 * @property {boolean} started
 */

/**
 * routes / inject 需要的宿主环境。常量不进这里，直接 import shared。
 * @typedef {object} HostEnv
 * @property {HostContext} ctx
 * @property {WebServer} webServer
 * @property {string} packageRoot
 * @property {string} configFile
 * @property {string} version
 * @property {FactsCache} factsCache
 * @property {() => Config} readConfig
 * @property {(next: any) => Config} writeConfig
 */
