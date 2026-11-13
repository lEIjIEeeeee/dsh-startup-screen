// @ts-nocheck —— 迁移期先不收紧类型，后续再逐块补 JSDoc。
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULTS } from '../shared/defaults.js'
import { normalize } from '../shared/schema.js'

/**
 * 配置读写。路径由调用方给，模块自己不推算。
 *
 * @param {string} configFile
 */
export function createConfig(configFile) {
  function read() {
    try {
      return normalize(JSON.parse(fs.readFileSync(configFile, 'utf8')))
    } catch (err) {
      return { ...DEFAULTS }
    }
  }

  function write(next) {
    const cfg = normalize(next)
    fs.mkdirSync(path.dirname(configFile), { recursive: true })
    const tmp = configFile + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8')
    fs.renameSync(tmp, configFile)
    return cfg
  }

  return { file: configFile, defaults: DEFAULTS, read, write }
}
