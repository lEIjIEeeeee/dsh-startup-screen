/**
 * 插件用到的 HTTP 路径。
 *
 * 宿主注册路由、启动动画发请求、设置面板读写配置，都从这里取，
 * 改前缀时不会漏掉某一处。
 */
export const NS = 'dsh-startup-screen'
export const ROUTE_BASE = '/dsh-startup'

export const ROUTES = {
  css: ROUTE_BASE + '/splash.css',
  splash: ROUTE_BASE + '/splash.js',
  asset: ROUTE_BASE + '/asset',
  config: ROUTE_BASE + '/config',
  facts: ROUTE_BASE + '/facts',
}
