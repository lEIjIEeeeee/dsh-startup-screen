import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULTS } from '../../src/shared/defaults.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** 从离线预览页里取出 window.__DSH_STARTUP__ 的对象字面量。 */
function previewConfig() {
  const html = fs.readFileSync(path.join(ROOT, 'preview/index.html'), 'utf8')
  const marker = 'window.__DSH_STARTUP__ = '
  const start = html.indexOf(marker)
  assert.ok(start >= 0, 'preview 里找不到运行时配置')
  const end = html.indexOf('\n  };', start)
  assert.ok(end > start, 'preview 配置没有正常结束')
  const source = html.slice(start + marker.length, end + 4)
  return Function('return ' + source)()
}

test('离线预览的配置覆盖全部默认字段', () => {
  const config = previewConfig()
  const missing = Object.keys(DEFAULTS).filter((key) => !(key in config))
  assert.deepEqual(missing, [], '预览配置缺少：' + missing.join(', '))
})
