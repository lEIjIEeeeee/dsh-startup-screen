#!/usr/bin/env node
/**
 * 构建入口。
 *
 * src/ 是源码，lib/ 是提交进仓库的产物。每次构建先清空 lib/：
 * 重命名或删除模块后，残留的旧文件不会被 git diff 发现。
 *
 * 宿主入口和素材直接复制；启动动画打成 IIFE；设置面板打成 CJS，
 * 外面套一层宿主的模块注册壳（window.__ModuleLoader__.load）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const LIB = path.join(ROOT, 'lib')
const PLUGIN_ID = 'dsh-startup-screen'

/** @param {string} message */
function fail(message) {
  console.error('[build] ' + message)
  process.exit(1)
}

/** @param {string} from @param {string} to */
function copy(from, to) {
  if (!fs.existsSync(from)) fail('缺少源码：' + path.relative(ROOT, from))
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.cpSync(from, to, { recursive: true })
}

async function main() {
  if (!fs.existsSync(SRC)) fail('src/ 不存在，没有可构建的源码。')

  fs.rmSync(LIB, { recursive: true, force: true })
  fs.mkdirSync(LIB, { recursive: true })

  /* 宿主入口与音频素材原样复制 */
  copy(path.join(SRC, 'index.js'), path.join(LIB, 'index.js'))
  copy(path.join(SRC, 'assets'), path.join(LIB, 'assets'))

  /* 样式先原样复制；拆分与合并留到样式重构时再做 */
  copy(path.join(SRC, 'splash', 'styles', 'index.css'), path.join(LIB, 'splash.css'))

  await build({
    entryPoints: [path.join(SRC, 'splash', 'index.js')],
    outfile: path.join(LIB, 'splash.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2019',
    legalComments: 'none',
  })

  /* 加载器把 require 作为参数交给 factory，所以注册壳必须包在打包结果外面 */
  await build({
    entryPoints: [path.join(SRC, 'client', 'index.jsx')],
    outfile: path.join(LIB, 'client.js'),
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2019',
    external: ['react'],
    legalComments: 'none',
    banner: {
      js: [
        'window.__ModuleLoader__.load({',
        "  id: '" + PLUGIN_ID + "',",
        '  factory: (require) => {',
        '    var module = { exports: {} };',
        '    var exports = module.exports;',
      ].join('\n'),
    },
    footer: {
      js: ['    return module.exports;', '  }', '})'].join('\n'),
    },
  })

  for (const name of ['index.js', 'splash.js', 'splash.css', 'client.js']) {
    const size = fs.statSync(path.join(LIB, name)).size
    console.log('[build] lib/' + name + '  ' + Math.round(size / 1024) + ' KB')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
