import { useEffect, useState } from 'react'
import { DEFAULTS } from '../shared/defaults.js'
import type { StartupConfig } from '../shared/types.js'
import { loadConfig, messageOf, previewConfig, resetConfig, saveConfig } from './api.js'

function readInjectedVersion(): string {
  try {
    const v = window.__DSH_STARTUP_VERSION__
    return v ? String(v) : ''
  } catch (e) {
    return ''
  }
}

export interface PanelConfigState {
  draft: StartupConfig | null
  file: string
  version: string
  error: string | null
  notice: string | null
  busy: boolean
  dirty: boolean
  set: <K extends keyof StartupConfig>(key: K, value: StartupConfig[K]) => void
  save: () => void
  reset: () => void
  preview: () => void
  reload: () => void
}

/**
 * 设置面板的配置状态：读取、编辑、保存、恢复默认、立即预览。
 *
 * 面板组件只负责排版；所有与配置接口的交互集中在这里，
 * 状态变更后由调用方通过 props 分发给各页签。
 */
export function usePanelConfig(): PanelConfigState {
  const [draft, setDraft] = useState<StartupConfig | null>(null)
  const [file, setFile] = useState('')
  const [version, setVersion] = useState(readInjectedVersion)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  /* 有未保存的改动时，底部固定操作条上会亮一个点 */
  const [dirty, setDirty] = useState(false)

  function load() {
    setError(null)
    loadConfig()
      .then((j) => {
        setDraft(Object.assign({}, DEFAULTS, j.config))
        setDirty(false)
        setFile(j.file || '')
        if (j.version) setVersion(String(j.version))
      })
      .catch((e: unknown) => setError(messageOf(e)))
  }

  useEffect(() => {
    load()
  }, [])

  function set<K extends keyof StartupConfig>(key: K, value: StartupConfig[K]) {
    setNotice(null)
    setError(null)
    setDirty(true)
    setDraft((d) => Object.assign({}, d, { [key]: value }) as StartupConfig)
  }

  function save() {
    if (!draft) return
    setBusy(true)
    setNotice(null)
    setError(null)
    saveConfig(draft)
      .then((j) => {
        if (j.config) setDraft(j.config)
        setDirty(false)
        setNotice('已保存。下次打开 DSH 生效；「立即预览」使用当前修改。')
      })
      .catch((e: unknown) => setError(messageOf(e)))
      .then(() => setBusy(false))
  }

  function reset() {
    try {
      if (
        typeof window !== 'undefined' &&
        typeof window.confirm === 'function' &&
        !window.confirm('恢复默认会覆盖当前所有设置，确定吗？')
      )
        return
    } catch (e) {
      /* noop */
    }
    setBusy(true)
    setNotice(null)
    setError(null)
    resetConfig()
      .then((j) => {
        if (j.config) setDraft(j.config)
        setDirty(false)
        setNotice('已恢复默认。')
      })
      .catch((e: unknown) => setError(messageOf(e)))
      .then(() => setBusy(false))
  }

  /* 立即预览：把当前未保存的 draft 合进页面配置，重播一次；不写盘。 */
  function preview() {
    previewConfig(draft)
  }

  return {
    draft,
    file,
    version,
    error,
    notice,
    busy,
    dirty,
    set,
    save,
    reset,
    preview,
    reload: load,
  }
}
