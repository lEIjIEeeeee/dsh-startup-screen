#!/usr/bin/env node
/**
 * 构建入口。
 *
 * src/ 是源码，lib/ 是提交进仓库的产物。输出先写到 lib.tmp/，
 * 全部成功后再切换：构建中途失败时旧产物原样保留，不会把 lib/ 删成半套。
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
const OUT = path.join(ROOT, 'lib.tmp')
const BACKUP = path.join(ROOT, 'lib.bak')
const PLUGIN_ID = 'dsh-startup-screen'

/* 加载器在 factory 里注入这些模块。不标成 external 就会被重复打包，
   体积变大还是小事，拿到第二份 React 会直接触发 invalid hook call。 */
const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime', '@deepseek-ai/*']

/** @param {string} message */
function fail(message) {
  console.error('[build] ' + message)
  process.exit(1)
}

/** Windows 上文件可能被杀毒软件短暂占用，删目录留几次重试。 @param {string} dir */
function remove(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}

/** @param {string} from @param {string} to */
function copy(from, to) {
  if (!fs.existsSync(from)) fail('缺少源码：' + path.relative(ROOT, from))
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.cpSync(from, to, { recursive: true })
}

/* 全部产物就绪后一次性切换；切换失败就把旧产物换回来。 */
function publish() {
  remove(BACKUP)
  if (fs.existsSync(LIB)) fs.renameSync(LIB, BACKUP)
  try {
    fs.renameSync(OUT, LIB)
  } catch (err) {
    if (fs.existsSync(BACKUP)) fs.renameSync(BACKUP, LIB)
    throw err
  }
  remove(BACKUP)
}

async function main() {
  if (!fs.existsSync(SRC)) fail('src/ 不存在，没有可构建的源码。')

  remove(OUT)
  fs.mkdirSync(OUT, { recursive: true })

  try {
    /* 宿主目前原样复制。加共享模块之前必须先把这里改成 esbuild 打包，
       否则复制出来的 lib/index.js 会带着解析不了的相对 import。 */
    copy(path.join(SRC, 'index.js'), path.join(OUT, 'index.js'))
    copy(path.join(SRC, 'assets'), path.join(OUT, 'assets'))

    /* 样式先原样复制；拆分与合并留到样式重构时再做 */
    copy(path.join(SRC, 'splash', 'styles', 'index.css'), path.join(OUT, 'splash.css'))

    await build({
      entryPoints: [path.join(SRC, 'splash', 'index.js')],
      outfile: path.join(OUT, 'splash.js'),
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2019',
      charset: 'utf8',
      legalComments: 'none',
    })

    /* 加载器把 require 作为参数交给 factory，所以注册壳必须包在打包结果外面 */
    await build({
      entryPoints: [path.join(SRC, 'client', 'index.jsx')],
      outfile: path.join(OUT, 'client.js'),
      bundle: true,
      format: 'cjs',
      platform: 'browser',
      target: 'es2019',
      charset: 'utf8',
      external: CLIENT_EXTERNALS,
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
  } catch (err) {
    remove(OUT)
    throw err
  }

  publish()

  for (const name of ['index.js', 'splash.js', 'splash.css', 'client.js']) {
    const size = fs.statSync(path.join(LIB, name)).size
    console.log('[build] lib/' + name + '  ' + Math.round(size / 1024) + ' KB')
  }
}

main().catch((err) => {
  /* esbuild 的报错对象直接打印很难读，把位置和原因摘出来 */
  if (err && Array.isArray(err.errors) && err.errors.length > 0) {
    for (const e of err.errors) {
      const loc = e.location ? e.location.file + ':' + e.location.line + ':' + e.location.column + '  ' : ''
      console.error('[build] ' + loc + e.text)
    }
  } else {
    console.error(err && err.message ? err.message : err)
  }
  process.exit(1)
})
