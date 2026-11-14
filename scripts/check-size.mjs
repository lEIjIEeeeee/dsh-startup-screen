#!/usr/bin/env node
/**
 * 打包体积预算（设计文档 6.7）。
 *
 * 只量未压缩的产物字节数：宿主是单个 ESM 包，浏览器侧是 IIFE 和 CJS，
 * 用户实际拿到的就是这几个文件。超预算直接失败，不自动放宽。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KB = 1024

/** @type {{ file: string, max: number, label: string }[]} */
const BUDGETS = [
  { file: 'lib/client.js', max: 70 * KB, label: '设置面板' },
  { file: 'lib/splash.js', max: 120 * KB, label: '启动动画' },
  { file: 'lib/splash.css', max: 70 * KB, label: '启动动画样式' },
  { file: 'lib/index.js', max: 35 * KB, label: 'Host' },
]

let failed = false

for (const budget of BUDGETS) {
  const full = path.join(ROOT, budget.file)
  if (!fs.existsSync(full)) {
    console.error('[size] 缺少产物：' + budget.file + '（先跑 npm run build）')
    failed = true
    continue
  }
  const bytes = fs.statSync(full).size
  const pct = Math.round((bytes / budget.max) * 100)
  const line =
    budget.file + '  ' + (bytes / KB).toFixed(1) + ' KB / ' + budget.max / KB + ' KB (' + pct + '%)'
  if (bytes > budget.max) {
    console.error('[size] 超出预算  ' + line + '  ' + budget.label)
    failed = true
  } else {
    console.log('[size] ok  ' + line + '  ' + budget.label)
  }
}

if (failed) process.exit(1)
