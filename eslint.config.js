import js from '@eslint/js'
import importX from 'eslint-plugin-import-x'
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

// target = 发起 import 的文件所在目录；from = 被禁止引用的目录。
const zones = RUNTIME_DIRS.flatMap((importer) => [
  { target: './src/shared', from: `./src/${importer}` },
  ...RUNTIME_DIRS.filter((imported) => imported !== importer).map((imported) => ({
    target: `./src/${imported}`,
    from: `./src/${importer}`,
  })),
])

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
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
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
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
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
