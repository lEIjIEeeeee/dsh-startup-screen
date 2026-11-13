#!/usr/bin/env node
/**
 * 构建入口。
 *
 * 源码还没迁到 src/ 时，这里只做检查并给出提示，不产出文件。
 * 迁完之后：宿主、共享代码和素材直接复制到 lib/，启动动画打包成一个立即执行的脚本，
 * 设置面板打包成宿主可直接加载的模块。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')

function main() {
  if (!fs.existsSync(SRC)) {
    console.log('[build] src/ 尚未迁移，跳过构建。')
    console.log('[build] 当前 lib/ 仍是手写产物，直接使用。')
    return
  }

  /* 接入构建管线时，第一步必须是清空 lib/ 再产出：
     重命名或删除模块后，残留的旧文件不会被 git diff 发现。 */
  console.error('[build] src/ 已存在，但构建管线还没接好。')
  process.exitCode = 1
}

main()
