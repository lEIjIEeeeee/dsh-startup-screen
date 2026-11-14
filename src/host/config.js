import fs from 'node:fs'
import path from 'node:path'
import { DEFAULTS } from '../shared/defaults.js'
import { NS } from '../shared/routes.js'
import { normalize } from '../shared/schema.js'

/**
 * 配置读写。路径由调用方给，模块自己不推算。
 *
 * @param {string} configFile
 * @param {{ warn?: (msg: string) => void }} [logger]
 * @returns {{ read: () => import('./types.js').Config, write: (next: any) => import('./types.js').Config }}
 */
export function createConfig(configFile, logger) {
  let seq = 0
  let readWarned = false

  /** @param {string} message */
  function warn(message) {
    try {
      if (logger && typeof logger.warn === 'function') logger.warn('[' + NS + '] ' + message)
    } catch (err) {
      /* 日志失败不影响读写 */
    }
  }

  /* 文件坏了先挪到一边：原内容留着能查，下一次保存也不会把它直接覆盖掉。
     挪成功之后文件就不在了，后续读取不会重复触发。 */
  function quarantine() {
    const backup = configFile + '.corrupt-' + Date.now()
    try {
      fs.renameSync(configFile, backup)
      warn('配置文件无法解析，已备份到 ' + backup + '，本次使用默认配置。')
    } catch (renameErr) {
      warn('配置文件无法解析，且备份失败，本次使用默认配置：' + messageOf(renameErr))
    }
  }

  function read() {
    let text
    try {
      text = fs.readFileSync(configFile, 'utf8')
    } catch (err) {
      /* 首次运行没有文件是正常的，不用提示 */
      const code = (/** @type {any} */ (err) || {}).code
      if (code !== 'ENOENT' && !readWarned) {
        readWarned = true
        warn('读取配置失败，本次使用默认配置：' + messageOf(err))
      }
      return { ...DEFAULTS }
    }
    try {
      return normalize(JSON.parse(text))
    } catch (err) {
      quarantine()
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
    try {
      fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8')
      fs.renameSync(tmp, configFile)
    } catch (err) {
      try {
        fs.unlinkSync(tmp)
      } catch (cleanupErr) {
        /* 临时文件可能根本没写出来 */
      }
      throw err
    }
    return cfg
  }

  return { read, write }
}

/** @param {any} err */
function messageOf(err) {
  return String(err && err.message ? err.message : err)
}
