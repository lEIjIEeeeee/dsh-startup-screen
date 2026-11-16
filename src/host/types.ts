import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Facts, FactsCache, StartupConfig } from '../shared/types.js'

export type { Facts, FactsCache, StartupConfig }

export interface Logger {
  warn?: (message: string) => void
}

export interface Route {
  kind: string
  path: string
  handler: (req: IncomingMessage, res: ServerResponse) => unknown
}

export interface WebServer {
  register: (route: Route) => () => void
  tapIndex?: (fn: (html: string) => string) => () => void
}

export interface ConnectionGuard {
  requestRejection?: (req: IncomingMessage) => number | boolean | null | undefined
}

/** 宿主 ctx 里本插件用到的部分；服务本身按需用泛型取，避免把宿主 API 抄全。 */
export interface HostContext {
  get?: (name: string) => unknown
  webServer?: WebServer
  connection?: ConnectionGuard
  logger?: Logger
  effect: (fn: () => () => void) => void
}

/** 路由与首屏注入需要的宿主环境；路径等共享常量不放进这里。 */
export interface HostEnv {
  ctx: HostContext
  webServer: WebServer
  packageRoot: string
  configFile: string
  version: string
  factsCache: FactsCache
  readConfig: () => StartupConfig
  writeConfig: (next: unknown) => StartupConfig
}
