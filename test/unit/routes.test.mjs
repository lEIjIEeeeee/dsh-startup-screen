import test from 'node:test'
import assert from 'node:assert/strict'
import { NS, ROUTE_BASE, ROUTES } from '../../src/shared/routes.js'
import { localDayKey } from '../../src/shared/day.js'

test('所有路由都以统一前缀开头', () => {
  for (const [name, path] of Object.entries(ROUTES)) {
    assert.ok(path.startsWith(ROUTE_BASE + '/'), name + ' → ' + path)
  }
})

test('路由互不重复', () => {
  const paths = Object.values(ROUTES)
  assert.equal(new Set(paths).size, paths.length)
})

test('命名空间与配置 / facts 路由稳定', () => {
  assert.equal(NS, 'dsh-startup-screen')
  assert.equal(ROUTES.config, '/dsh-startup/config')
  assert.equal(ROUTES.facts, '/dsh-startup/facts')
})

test('日期键按本机时区补零', () => {
  assert.equal(localDayKey(new Date(2026, 0, 5)), '2026-01-05')
  assert.equal(localDayKey(new Date(2026, 10, 14)), '2026-11-14')
  assert.match(localDayKey(), /^\d{4}-\d{2}-\d{2}$/)
})
