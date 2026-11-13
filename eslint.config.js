import js from '@eslint/js'
import importX, { createNodeResolver } from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

/**
 * 依赖方向（单向，禁止反向）：
 *
 *   shared  ←  host
 *   shared  ←  client
 *   shared  ←  splash
 *
 * host / client / splash 三者之间互不引用。任何跨运行时复用都必须下沉到 shared。
 */
const RUNTIME_DIRS = ['host', 'client', 'splash']

// target = 发起 import 的文件/目录；from = 被禁止引用的目录。
const zones = [
  // 宿主入口只负责组装，不能反向依赖浏览器侧的运行时。
  { target: './src/index.js', from: './src/client' },
  { target: './src/index.js', from: './src/splash' },
  ...RUNTIME_DIRS.flatMap((importer) => [
    { target: './src/shared', from: `./src/${importer}` },
    ...RUNTIME_DIRS.filter((imported) => imported !== importer).map((imported) => ({
      target: `./src/${imported}`,
      from: `./src/${importer}`,
    })),
  ]),
]

export default [
  {
    ignores: [
      'lib/**',
      'dist/**',
      'releases/**',
      'node_modules/**',
      'docs/**',
      'preview/**',
      '*.min.js',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-var': 'error',
      'object-shorthand': ['error', 'properties'],
    },
  },

  {
    files: ['src/**/*.{js,mjs,jsx}'],
    plugins: { 'import-x': importX },
    settings: {
      // 默认解析器不认 .jsx，显式补上，否则 no-cycle 对 JSX 模块完全失效。
      'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs'],
      'import-x/resolver-next': [
        createNodeResolver({ extensions: ['.js', '.jsx', '.mjs', '.cjs', '.json'] }),
      ],
    },
    rules: {
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
      'import-x/no-self-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/no-restricted-paths': ['error', { zones }],
    },
  },

  {
    files: ['src/client/**/*.{js,jsx}', 'src/splash/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // 浏览器侧的脚本会被打进宿主页面，不能假设有 Node 全局。
      'no-restricted-globals': ['error', 'process', 'require', '__dirname', '__filename'],
    },
  },

  {
    files: ['src/client/**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  {
    // 迁移豁免：Phase 2 原样搬入的旧代码，重写前不套新风格规则。
    // Phase 5（client）/ Phase 6（splash）完成后删除本段。
    files: ['src/client/**/*.{js,jsx}', 'src/splash/**/*.{js,jsx}'],
    rules: {
      'no-var': 'off',
      'prefer-const': 'off',
      'object-shorthand': 'off',
      eqeqeq: 'off',
      'no-empty': 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
    },
  },

  {
    files: ['test/**/*.mjs', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // 测试里会构造假的 window / document，允许在 Node 环境里出现浏览器全局。
      'no-undef': 'off',
    },
  },
]
