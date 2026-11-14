import { isAmbientOn } from '../core/config.js'
import { hexToRgba } from '../core/color.js'
import { ROOT_ID } from '../core/constants.js'
import { el } from '../core/dom.js'
import { applyGlass, insertBackdrop } from './stage-glass.js'
import { stageMarkup } from './stage-markup.js'
import { fillStage } from './stage-parts.js'
import { queryUi } from './stage-ui.js'

/** 把主题、强调色与故障色写进根节点的 CSS 变量。 */
function applyThemeVars(root, config) {
  root.style.setProperty('--dsu-speed', String(config.speed))
  root.style.setProperty('--dsu-accent', config.accent)
  root.style.setProperty('--dsu-glitch-a', config.glitchA)
  root.style.setProperty('--dsu-glitch-b', config.glitchB)
  try {
    root.style.setProperty('--dsu-accent-glow', hexToRgba(config.accent, 0.42))
  } catch (e) {
    /* noop */
  }
  try {
    root.style.setProperty('--dsu-accent-soft', hexToRgba(config.accent, 0.1))
  } catch (e) {
    /* noop */
  }
  try {
    root.style.setProperty('--dsu-accent-strong', hexToRgba(config.accent, 0.72))
  } catch (e) {
    /* noop */
  }
}

/**
 * 启动界面骨架：根节点、玻璃参数、版心结构、鲸鱼标识与准星。
 * 数据面板与时钟由入口在骨架建好后填充。
 *
 * @param {{ config: Record<string, any>, facts: Record<string, any>, ui: Record<string, any> }} options
 */
export function createStage(options) {
  const config = options.config
  const facts = options.facts || {}
  const ui = options.ui

  let root = document.getElementById(ROOT_ID)
  if (!root) {
    root = el('div')
    root.id = ROOT_ID
    root.className = 'dsu-root'
    document.body.appendChild(root)
  }
  root.classList.toggle('dsu-dark', config.theme === 'dark')
  applyThemeVars(root, config)

  const glass = applyGlass(root, config)
  root.innerHTML = stageMarkup(config)
  if (glass.backdropOn) insertBackdrop(root)

  queryUi(root, isAmbientOn(config), ui)
  fillStage(ui, config, facts)

  return { root, restoreAppBackdrop: glass.restore }
}
