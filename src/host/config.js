import fs from 'node:fs'
import path from 'node:path'
import { DEFAULTS } from '../shared/defaults.js'
import { normalize } from '../shared/schema.js'

/**
 * 配置读写。路径由调用方给，模块自己不推算。
 *
 * @param {string} configFile
 * @returns {{ read: () => import('./types.js').Config, write: (next: any) => import('./types.js').Config }}
 */
export function createConfig(configFile) {
  let seq = 0

  function read() {
    try {
      return normalize(JSON.parse(fs.readFileSync(configFile, 'utf8')))
    } catch (err) {
      return { ...DEFAULTS }
    }
  }

  /**
   * @param {any} next
   * @returns {import('./types.js').Config}
   */
  function write(next) {
    const cfg = normalize(next)
    fs.mkdirSync(path.dirname(configFile), { recursive: true })
    /* 临时文件名带 pid + 序号：并发保存时不会互相踩掉对方的 rename。 */
    const tmp = configFile + '.' + process.pid + '.' + seq++ + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8')
    fs.renameSync(tmp, configFile)
    return cfg
  }

  return { read, write }
}
