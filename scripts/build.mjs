#!/usr/bin/env node
/**
 * 构建入口。
 *
 * Phase 1：`src/` 尚未迁移，只做前置检查并给出明确提示，不产出任何文件。
 * Phase 2 起：Host/Shared/Assets 复制 → `lib/`，Splash 打 IIFE，Client 打 CJS +
 * ModuleLoader 包装。构建逻辑集中在本文件，不要散到别处。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')

function main() {
  if (!fs.existsSync(SRC)) {
    console.log('[build] src/ 尚未迁移，跳过构建（Phase 1）。')
    console.log('[build] 当前 lib/ 仍是手写产物，直接使用。')
    return
  }

  console.error('[build] src/ 已存在，但构建管线尚未接入（Phase 2）。')
  process.exitCode = 1
}

main()
