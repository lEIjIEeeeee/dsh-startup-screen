import { useRef, useState } from 'react'
import { AboutSection } from './components/AboutSection.jsx'
import { AppearanceSection } from './components/AppearanceSection.jsx'
import { ContentSection } from './components/ContentSection.jsx'
import { PanelFooter } from './components/PanelFooter.jsx'
import { PanelNav } from './components/PanelNav.jsx'
import { PanelSkeleton } from './components/PanelSkeleton.jsx'
import { PlaySection } from './components/PlaySection.jsx'
import { SoundSection } from './components/SoundSection.jsx'
import { useFitHeight } from './use-fit-height.js'
import { usePanelConfig } from './use-panel-config.js'
import { speakSample } from './voice.js'

/* 版本号按可靠性取：先看配置接口返回值，再看页面里注入的值，
   最后用构建时写进来的版本兜底，避免面板显示 undefined。 */
const BUILD_VERSION = __PLUGIN_VERSION__

export function Panel() {
  const { draft, file, version, error, notice, busy, dirty, set, save, reset, preview, reload } =
    usePanelConfig()
  const [tab, setTab] = useState('play')
  const contentRef = useRef(null)
  const shellRef = useRef(null)

  /* 配置到位后重新量一次高度（draft 从 null 变成对象） */
  useFitHeight(shellRef, draft ? 1 : 0)

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

  if (!draft) {
    return (
      <PanelSkeleton
        version={version}
        buildVersion={BUILD_VERSION}
        error={error}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="__ss_root">
      <div className="__ss_shell" ref={shellRef}>
        <div className="__ss_layout">
          <PanelNav
            tab={tab}
            version={version}
            buildVersion={BUILD_VERSION}
            switchTab={switchTab}
          />
          <div className="__ss_main">
            <div className="__ss_content" ref={contentRef}>
              <PlaySection active={tab === 'play'} draft={draft} onChange={set} />
              <AppearanceSection active={tab === 'appearance'} draft={draft} onChange={set} />
              <SoundSection
                active={tab === 'sound'}
                draft={draft}
                onChange={set}
                onPreview={() => speakSample(null, draft)}
              />
              <ContentSection active={tab === 'content'} draft={draft} onChange={set} />
              <AboutSection
                active={tab === 'about'}
                version={version}
                buildVersion={BUILD_VERSION}
                file={file}
              />
            </div>
            <PanelFooter
              busy={busy}
              dirty={dirty}
              notice={notice}
              error={error}
              onSave={save}
              onPreview={preview}
              onReset={reset}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
