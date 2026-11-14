import { useEffect, useRef, useState } from 'react'
import { DEFAULTS } from '../shared/defaults.js'
import { loadConfig, previewConfig, resetConfig, saveConfig } from './api.js'
import { ColorInput } from './components/ColorInput.jsx'
import { Field } from './components/Field.jsx'
import { Range } from './components/Range.jsx'
import { Select } from './components/Select.jsx'
import { Switch } from './components/Switch.jsx'
import { TextInput } from './components/TextInput.jsx'
import { VoicePicker } from './components/VoicePicker.jsx'
import { speakSample } from './voice.js'

/* 版本号按可靠性取：先看配置接口返回值，再看页面里注入的值，
   最后用构建时写进来的版本兜底，避免面板显示 undefined。 */
const BUILD_VERSION = __PLUGIN_VERSION__

function num(v, d) {
  const n = Number(v)
  return isFinite(n) ? n : d
}

function readInjectedVersion() {
  try {
    const v = window.__DSH_STARTUP_VERSION__
    return v ? String(v) : ''
  } catch (e) {
    return ''
  }
}

const MODE_OPTIONS = [
  ['session', '每个浏览器会话一次'],
  ['daily', '每天一次'],
  ['always', '每次打开都播放'],
]

/* 左侧导航：五个页面，点击切页；右侧内容独立滚动，底部操作栏固定。 */
const PAGES = [
  ['play', '播放'],
  ['appearance', '外观'],
  ['sound', '声音'],
  ['content', '内容'],
  ['about', '关于'],
]

export function Panel() {
  const [draft, setDraft] = useState(null)
  const [file, setFile] = useState('')
  const [version, setVersion] = useState(readInjectedVersion)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  /* 有未保存的改动时，底部固定操作条上会亮一个点 */
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState('play')
  const contentRef = useRef(null)
  const shellRef = useRef(null)

  function load() {
    setError(null)
    loadConfig()
      .then((j) => {
        setDraft(Object.assign({}, DEFAULTS, j.config))
        setDirty(false)
        setFile(j.file || '')
        if (j.version) setVersion(String(j.version))
      })
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  /* 配置到位后重新量一次高度（draft 从 null 变成对象） */
  const ready = draft ? 1 : 0

  /* 设置区填满 DSH 弹窗的内容高度：右侧内容自己滚，底部操作栏固定在底部。 */
  useEffect(
    function () {
      const shell = shellRef.current
      if (!shell || typeof window === 'undefined') return
      function findScrollParent(el) {
        let p = el && el.parentElement
        while (p) {
          try {
            const cs = window.getComputedStyle(p)
            if (cs && /(auto|scroll)/.test(cs.overflowY)) return p
          } catch (e) {
            /* noop */
          }
          p = p.parentElement
        }
        return null
      }
      const parent = findScrollParent(shell)
      if (!parent) return
      function fit() {
        try {
          const cs = window.getComputedStyle(parent)
          const h =
            parent.clientHeight -
            (parseFloat(cs.paddingTop) || 0) -
            (parseFloat(cs.paddingBottom) || 0)
          if (h > 0) shell.style.height = h + 'px'
        } catch (e) {
          /* noop */
        }
      }
      fit()
      /* 弹窗刚挂载时 flex 高度可能还没稳定，下一帧再量一次 */
      const timer = setTimeout(fit, 0)
      const ro = window.ResizeObserver ? new window.ResizeObserver(fit) : null
      if (ro) ro.observe(parent)
      window.addEventListener('resize', fit)
      return function () {
        clearTimeout(timer)
        if (ro) ro.disconnect()
        window.removeEventListener('resize', fit)
        try {
          shell.style.height = ''
        } catch (e) {
          /* noop */
        }
      }
    },
    [ready],
  )

  function set(key, value) {
    setNotice(null)
    setDirty(true)
    setDraft((d) => Object.assign({}, d, { [key]: value }))
  }

  function save() {
    if (!draft) return
    setBusy(true)
    setNotice(null)
    setError(null)
    saveConfig(draft)
      .then((j) => {
        setDraft(j.config)
        setDirty(false)
        setNotice('已保存。下次打开 DSH 生效；「立即预览」使用当前修改。')
      })
      .catch((e) => setError(e.message))
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
        setDraft(j.config)
        setDirty(false)
        setNotice('已恢复默认。')
      })
      .catch((e) => setError(e.message))
      .then(() => setBusy(false))
  }

  /* 立即预览：把当前未保存的 draft 合进页面配置，重播一次；不写盘。 */
  function preview() {
    previewConfig(draft)
  }

  function switchTab(key) {
    setTab(key)
    const c = contentRef.current
    if (c) {
      try {
        c.scrollTop = 0
      } catch (e) {
        /* noop */
      }
    }
  }

  /* 版本号常驻顶部，不进骨架屏 —— 它不依赖配置接口，
     接口挂了也该看得见当前装的是哪一版。 */
  const versionLine = <div className="__ss_version">{'版本 v' + (version || BUILD_VERSION)}</div>

  if (!draft) {
    return (
      <div className="__ss_root">
        {versionLine}
        <div className="__ss_status">{error ? error : '读取配置中…'}</div>
        {error ? (
          <div className="__ss_actions">
            <button className="__ss_btn" onClick={load}>
              重试
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  const playGroup = (
    <div className="__ss_group" id="__ss_group_play">
      <div className="__ss_groupTitle">播放</div>
      <Switch
        label="启用启动动画"
        hint="关闭后直接进入主界面。"
        checked={draft.enabled}
        onChange={(v) => set('enabled', v)}
      />
      <Field label="播放时机">
        <Select value={draft.mode} options={MODE_OPTIONS} onChange={(v) => set('mode', v)} />
      </Field>
      <Field label="速度倍率" hint="0.35 慢放 · 1 原速 · 3 快放；默认约 16 秒。">
        <Range
          value={draft.speed}
          min={0.35}
          max={3}
          step={0.05}
          display={Number(draft.speed).toFixed(2) + '×'}
          onChange={(v) => set('speed', v)}
        />
      </Field>
    </div>
  )

  const interactGroup = (
    <div className="__ss_group" id="__ss_group_interact">
      <div className="__ss_groupTitle">交互</div>
      <Switch
        label="需要人工确认"
        hint="第 1、2 步停下来等按钮或 Enter。"
        checked={draft.requireInteraction}
        onChange={(v) => set('requireInteraction', v)}
      />
      <Switch
        label="允许跳过"
        hint="右上角显示 SKIP，Esc 也能跳过。"
        checked={draft.allowSkip}
        onChange={(v) => set('allowSkip', v)}
      />
    </div>
  )

  const identityGroup = (
    <div className="__ss_group" id="__ss_group_identity">
      <div className="__ss_groupTitle">身份资料</div>
      <Field label="身份名称" hint="终幕欢迎语和第二步身份卡上的名字。">
        <TextInput
          value={draft.identity}
          placeholder="例如：JOYCE MOORE"
          onChange={(v) => set('identity', v)}
        />
      </Field>
      <div className="__ss_two">
        <Field label="身份编号" hint="第二步身份卡上的编号，建议用数字。">
          <TextInput value={draft.identityId} mono onChange={(v) => set('identityId', v)} />
        </Field>
        <Field label="权限等级">
          <TextInput value={draft.accessLevel} mono onChange={(v) => set('accessLevel', v)} />
        </Field>
      </div>
    </div>
  )

  const textGroup = (
    <div className="__ss_group" id="__ss_group_text">
      <div className="__ss_groupTitle">品牌与文案</div>
      <div className="__ss_two">
        <Field label="左上 · 主标题">
          <TextInput value={draft.brand1} onChange={(v) => set('brand1', v)} />
        </Field>
        <Field label="左上 · 产品行">
          <div className="__ss_row">
            <TextInput value={draft.brand3a} onChange={(v) => set('brand3a', v)} />
            <span className="__ss_status">+</span>
            <TextInput value={draft.brand3b} onChange={(v) => set('brand3b', v)} />
          </div>
        </Field>
      </div>
      <Field label="左上 · 副标题">
        <TextInput value={draft.brand2} maxLength={40} onChange={(v) => set('brand2', v)} />
      </Field>
      <div className="__ss_two">
        <Field label="黑幕 · 中文">
          <TextInput value={draft.orgZh} onChange={(v) => set('orgZh', v)} />
        </Field>
        <Field label="黑幕 · 英文">
          <TextInput value={draft.orgEn} mono onChange={(v) => set('orgEn', v)} />
        </Field>
      </div>
      <div className="__ss_two">
        <Field label="黑幕 · 小字">
          <TextInput value={draft.orgSub} mono onChange={(v) => set('orgSub', v)} />
        </Field>
        <Field label="终幕 · 黑框">
          <TextInput value={draft.welcomeBox} onChange={(v) => set('welcomeBox', v)} />
        </Field>
      </div>
      <Field label="右下 · 页脚">
        <TextInput value={draft.footer} mono onChange={(v) => set('footer', v)} />
      </Field>
    </div>
  )

  const voiceGroup = (
    <div className="__ss_group" id="__ss_group_voice">
      <div className="__ss_groupTitle">声音</div>
      <div className="__ss_subTitle">语音播报</div>
      <Switch
        label="女声播报（念每一行的英文）"
        hint="文字出现时同步念出英文旁白。"
        checked={draft.voice}
        onChange={(v) => set('voice', v)}
      />
      <Field label="语音来源" hint="内置真声优先；缺失时自动用系统语音。">
        <Select
          value={draft.voiceSource || 'asset'}
          options={[
            ['asset', '真声素材（推荐）'],
            ['tts', '系统 TTS 合成'],
          ]}
          onChange={(v) => set('voiceSource', v)}
        />
      </Field>
      <Field label="播报语言">
        <Select
          value={draft.voiceLang}
          options={[
            ['en', '英语（照参考片）'],
            ['zh', '中文'],
            ['both', '中英各念一遍'],
          ]}
          onChange={(v) => set('voiceLang', v)}
        />
      </Field>
      {draft.voice ? (
        <VoicePicker
          value={draft.voiceName}
          onChange={(v) => set('voiceName', v)}
          onPreview={() => speakSample(null, draft)}
        />
      ) : null}
      {draft.voice ? (
        <div className="__ss_row">
          <button
            className="__ss_btn"
            type="button"
            onClick={() => {
              set('voiceRate', 0.88)
              set('voicePitch', 0.85)
              set('voiceName', '')
              set('voiceCue', true)
              set('voiceLead', 240)
            }}
          >
            ↺ 套用「电影旁白」档
          </button>
          <span className="__ss_hint">
            语速 0.88 · 音调 0.85（压抑、深沉）· 自动挑神经网络女声 · 提示音 + 开口留白
          </span>
        </div>
      ) : null}
      {draft.voice ? (
        <div className="__ss_two">
          <Field label="语速">
            <Range
              value={num(draft.voiceRate, 1)}
              min={0.5}
              max={2}
              display={num(draft.voiceRate, 1).toFixed(2) + '×'}
              onChange={(v) => set('voiceRate', v)}
            />
          </Field>
          <Field label="音调">
            <Range
              value={num(draft.voicePitch, 1)}
              min={0}
              max={2}
              display={num(draft.voicePitch, 1).toFixed(2)}
              onChange={(v) => set('voicePitch', v)}
            />
          </Field>
        </div>
      ) : null}
      {draft.voice ? (
        <Field label="开口前留白" hint="提示音之后停顿多久再开口。">
          <Range
            value={num(draft.voiceLead, 240)}
            min={0}
            max={1200}
            step={20}
            display={Math.round(num(draft.voiceLead, 240)) + ' ms'}
            onChange={(v) => set('voiceLead', v)}
          />
        </Field>
      ) : null}
      {draft.voice ? (
        <Field label="音量">
          <Range
            value={num(draft.voiceVolume, 0.9)}
            min={0}
            max={1}
            display={Math.round(num(draft.voiceVolume, 0.9) * 100) + '%'}
            onChange={(v) => set('voiceVolume', v)}
          />
        </Field>
      ) : null}
      {draft.voice ? (
        <Switch
          label="播报前提示音"
          hint="开口前响两声轻提示。"
          checked={draft.voiceCue}
          onChange={(v) => set('voiceCue', v)}
        />
      ) : null}
      <div className="__ss_subTitle">界面音效</div>
      <Switch
        label="界面音效"
        hint="按钮、过场和结尾的提示音。"
        checked={draft.sound}
        onChange={(v) => set('sound', v)}
      />
      {draft.sound ? (
        <Field label="音效来源" hint="内置素材优先；也可以现场合成。">
          <Select
            value={draft.sfx || 'audio'}
            options={[
              ['audio', '内置素材（推荐）'],
              ['synth', '现场合成'],
            ]}
            onChange={(v) => set('sfx', v)}
          />
        </Field>
      ) : null}
      {draft.sound ? (
        <Field label="音效音量">
          <Range
            value={num(draft.soundVolume, 0.5)}
            min={0}
            max={1}
            display={Math.round(num(draft.soundVolume, 0.5) * 100) + '%'}
            onChange={(v) => set('soundVolume', v)}
          />
        </Field>
      ) : null}
    </div>
  )

  const visualGroup = (
    <div className="__ss_group" id="__ss_group_visual">
      <div className="__ss_groupTitle">外观</div>
      <div className="__ss_subTitle">主题与背景</div>
      <Field label="主题">
        <Select
          value={draft.theme}
          options={[
            ['light', '浅色 · 暖白档案底板（参考片原色）'],
            ['dark', '深色 · 暗底板'],
          ]}
          onChange={(v) => set('theme', v)}
        />
      </Field>
      <Switch
        label="环境光效（Canvas 光场 / 氛围层）"
        hint="背景的星尘、流光和光斑；低端机可关闭。"
        checked={draft.ambient !== false}
        onChange={(v) => set('ambient', v)}
      />
      <div className="__ss_subTitle">液态玻璃</div>
      <Switch
        label="液态玻璃（透出桌面 / 背后窗口）"
        hint="底板变成磨砂玻璃，能透出后面的窗口。"
        checked={!!draft.glass}
        onChange={(v) => set('glass', v)}
      />
      {draft.glass ? (
        <details className="__ss_details">
          <summary>高级玻璃参数</summary>
          <Field label="玻璃不透明度" hint="越低越透。">
            <Range
              value={num(draft.glassOpacity, 0.75)}
              min={0.15}
              max={0.95}
              step={0.01}
              display={Math.round(num(draft.glassOpacity, 0.75) * 100) + '%'}
              onChange={(v) => set('glassOpacity', v)}
            />
          </Field>
          <Field label="磨砂模糊" hint="背后的画面糊多少。">
            <Range
              value={num(draft.glassBlur, 22)}
              min={0}
              max={60}
              step={1}
              display={Math.round(num(draft.glassBlur, 22)) + ' px'}
              onChange={(v) => set('glassBlur', v)}
            />
          </Field>
          <Field label="玻璃饱和度" hint="透过玻璃看到的颜色浓度。">
            <Range
              value={num(draft.glassSaturate, 160)}
              min={100}
              max={200}
              step={5}
              display={Math.round(num(draft.glassSaturate, 160)) + '%'}
              onChange={(v) => set('glassSaturate', v)}
            />
          </Field>
          <Field label="背景模糊" hint="单独控制玻璃背后的模糊。">
            <Range
              value={num(draft.glassBackdropBlur, 28)}
              min={0}
              max={80}
              step={1}
              display={Math.round(num(draft.glassBackdropBlur, 28)) + ' px'}
              onChange={(v) => set('glassBackdropBlur', v)}
            />
          </Field>
        </details>
      ) : null}
      <div className="__ss_subTitle">颜色与特效</div>
      <div className="__ss_two">
        <Field label="强调色 · 橙">
          <div className="__ss_row">
            <ColorInput value={draft.accent} onChange={(v) => set('accent', v)} />
            <span className="__ss_status">{draft.accent}</span>
          </div>
        </Field>
        <Field label="故障色 · 蓝">
          <div className="__ss_row">
            <ColorInput value={draft.glitchB} onChange={(v) => set('glitchB', v)} />
            <span className="__ss_status">{draft.glitchB}</span>
          </div>
        </Field>
      </div>
      <Field label="故障色 · 红">
        <div className="__ss_row">
          <ColorInput value={draft.glitchA || '#ff3b30'} onChange={(v) => set('glitchA', v)} />
          <span className="__ss_status">{draft.glitchA || '#ff3b30'}</span>
        </div>
      </Field>
    </div>
  )

  const aboutGroup = (
    <div className="__ss_group">
      <div className="__ss_groupTitle">关于</div>
      {versionLine}
      {file ? <div className="__ss_barFile">配置文件：{file}</div> : null}
      <div className="__ss_hint">
        本仓库是 6shenhonghong9/dsh-startup-screen 的 fork；Canvas 光场等视觉方案参考
        QIFANAI/dsh-startup-screen 1.6.0（MIT）。
      </div>
      <div className="__ss_hint">
        「恢复默认」会覆盖当前所有设置；「立即预览」使用当前修改但不写盘。
      </div>
    </div>
  )

  const playPage = (
    <div className="__ss_page" id="__ss_page_play" hidden={tab !== 'play'}>
      {playGroup}
      {interactGroup}
    </div>
  )
  const appearancePage = (
    <div className="__ss_page" id="__ss_page_appearance" hidden={tab !== 'appearance'}>
      {visualGroup}
    </div>
  )
  const soundPage = (
    <div className="__ss_page" id="__ss_page_sound" hidden={tab !== 'sound'}>
      {voiceGroup}
    </div>
  )
  const contentPage = (
    <div className="__ss_page" id="__ss_page_content" hidden={tab !== 'content'}>
      {identityGroup}
      {textGroup}
    </div>
  )
  const aboutPage = (
    <div className="__ss_page" id="__ss_page_about" hidden={tab !== 'about'}>
      {aboutGroup}
    </div>
  )

  const nav = (
    <nav className="__ss_nav">
      <div className="__ss_navTitle">启动动画</div>
      {PAGES.map((p) => (
        <button
          key={p[0]}
          type="button"
          className={'__ss_navItem' + (tab === p[0] ? ' __ss_navItemActive' : '')}
          onClick={() => switchTab(p[0])}
        >
          {p[1]}
        </button>
      ))}
      <div className="__ss_navVersion">{'v' + (version || BUILD_VERSION)}</div>
    </nav>
  )

  const footer = (
    <div className="__ss_footer">
      <div className="__ss_actions">
        <button className="__ss_btn __ss_btnPrimary" disabled={busy} onClick={save}>
          {busy ? '处理中…' : '保存'}
        </button>
        <button className="__ss_btn" onClick={preview}>
          立即预览
        </button>
        <button className="__ss_btn" disabled={busy} onClick={reset}>
          恢复默认
        </button>
      </div>
      <div className="__ss_barHint">
        关闭弹窗不会保存；保存后下次启动生效；「立即预览」使用当前修改（不写盘）。
        {dirty ? <span className="__ss_dirty"> ● 未保存</span> : null}
        {notice ? <span className="__ss_ok">{notice}</span> : null}
        {error ? <span className="__ss_err">{error}</span> : null}
      </div>
    </div>
  )

  return (
    <div className="__ss_root">
      <div className="__ss_shell" ref={shellRef}>
        <div className="__ss_layout">
          {nav}
          <div className="__ss_main">
            <div className="__ss_content" ref={contentRef}>
              {playPage}
              {appearancePage}
              {soundPage}
              {contentPage}
              {aboutPage}
            </div>
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
