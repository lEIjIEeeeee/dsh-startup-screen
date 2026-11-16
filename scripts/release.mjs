#!/usr/bin/env node
/**
 * 发布前检查（dry-run）。
 *
 * 只读：跑一遍 npm pack --dry-run，核对将进入 tarball 的文件是否符合
 * package.json 的 files 白名单，并确认 lib/ 里嵌的版本号、CHANGELOG 与
 * README 的版本号和 package.json 一致。真正的发布仍然由人执行 npm publish。
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const version = String(pkg.version || '')

const problems = []

/** @param {boolean} ok @param {string} message */
function check(ok, message) {
  console.log((ok ? '  ok    ' : '  FAIL  ') + message)
  if (!ok) problems.push(message)
}

/** @param {string} file @param {RegExp} pattern */
function readMatch(file, pattern) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8')
  const match = text.match(pattern)
  return match ? match[1] : ''
}

/* npm 在 npm run 里会把自身路径放进 npm_execpath；直接用 node 跑它，
   比 shell 拼 npm.cmd 少一层转义。直接执行脚本时退回命令名。 */
const npmCli = process.env.npm_execpath
const npm = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm'
const pack = spawnSync(npm, [...(npmCli ? [npmCli] : []), 'pack', '--dry-run', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: !npmCli && process.platform === 'win32',
})

if (pack.status !== 0) {
  console.error(pack.stderr || pack.stdout)
  process.exit(1)
}

/* npm 有时会在 JSON 前面打提示，从第一个方括号开始解析。 */
const start = pack.stdout.indexOf('[')
/** @type {{ filename: string, size: number, files: { path: string }[] }} */
const info = JSON.parse(pack.stdout.slice(start))[0]
const files = info.files.map((file) => file.path.replace(/\\/g, '/'))
const names = new Set(files)

console.log('[release] ' + info.filename)
console.log('[release] ' + files.length + ' 个文件，压缩包 ' + Math.round(info.size / 1024) + ' KB')

/* 运行时必需的文件单独点名；其余靠下面的 files 白名单逐条核对。 */
const critical = [
  'lib/index.js',
  'lib/splash.js',
  'lib/splash.css',
  'lib/client.js',
  'cordis.patch.yml',
  'preview/index.html',
]
for (const name of critical) check(names.has(name), '包含 ' + name)

/* package.json 的 files 是发布清单的唯一来源：每条都要能在 tarball 里找到，
   避免手工维护的 required 列表漏掉新增文件。 */
for (const entry of Array.isArray(pkg.files) ? pkg.files : []) {
  const prefix = entry.replace(/\/+$/, '') + '/'
  const hit = files.some((name) => name === entry || name.startsWith(prefix))
  check(hit, 'files 条目已打包：' + entry)
}

const audio = files.filter((name) => /^lib\/assets\/.+\.mp3$/.test(name))
check(audio.length >= 8, '包含音频素材（实际 ' + audio.length + ' 个）')

const tests = files.filter((name) => name.startsWith('test/'))
check(tests.length > 0, '包含测试（实际 ' + tests.length + ' 个文件）')

const forbidden = [
  ['src/', '源码'],
  ['scripts/', '构建脚本'],
  ['node_modules/', '依赖'],
  ['.github/', 'CI 配置'],
  ['lib.tmp/', '构建临时目录'],
  ['lib.bak/', '构建备份目录'],
]
for (const [prefix, label] of forbidden) {
  const hit = files.filter((name) => name.startsWith(prefix))
  check(hit.length === 0, '不包含 ' + label + '（' + prefix + '）')
}

/* docs/ 只放截图；设计稿、审查记录这类 Markdown 不进包。 */
const docs = files.filter(
  (name) => name.startsWith('docs/') && !name.startsWith('docs/screenshots/'),
)
check(docs.length === 0, 'docs/ 只包含截图')

const hostVersion = readMatch('lib/index.js', /PLUGIN_VERSION = "([^"]+)"/)
const clientVersion = readMatch('lib/client.js', /BUILD_VERSION = "([^"]+)"/)
check(hostVersion === version, 'lib/index.js 版本 ' + hostVersion + ' = package.json ' + version)
check(
  clientVersion === version,
  'lib/client.js 版本 ' + clientVersion + ' = package.json ' + version,
)
check(
  fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8').includes('## [' + version + ']'),
  'CHANGELOG 有 ' + version + ' 的记录',
)
check(
  fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').includes('**' + version + '**'),
  'README 标注了 ' + version,
)

if (problems.length > 0) {
  console.error('[release] ' + problems.length + ' 项不符合预期，先处理再发布。')
  process.exit(1)
}
console.log('[release] 检查通过，可以 npm publish。')
