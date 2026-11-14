import { STEPS } from '../data/steps.js'
import { el } from '../core/dom.js'
import { createHex, revealLogo } from './effects.js'

/**
 * 时间线的展示动作：进度、阶段柱、字幕、编号、十六进制读数、鲸鱼落墨与操作卡。
 *
 * @param {{
 *   config: Record<string, any>,
 *   ui: Record<string, any>,
 *   audio: any,
 *   ms: (n: number) => number,
 *   wait: (n: number) => Promise<any>,
 * }} rt
 */
export function createTimelineHelpers(rt) {
  const C = rt.config
  const ui = rt.ui
  const audio = rt.audio
  const ms = rt.ms
  const wait = rt.wait
  const hex = createHex(ui, audio)

  function setProgress(p) {
    const pct = Math.max(0, Math.min(1, p))
    ui.bar.style.width = Math.round(pct * 100) + '%'
  }

  /** 六格阶段柱：走过的压暗、当前的拉满并点亮主题橙 */
  function setSlats(active) {
    const items = ui.slats.children
    for (let i = 0; i < items.length; i++) {
      const idx = i + 1
      items[i].classList.toggle('dsu-on', idx === active)
      items[i].classList.toggle('dsu-past', idx < active)
    }
  }

  /** 扫描线自上而下扫一遍（底板洗白后一次，验准时再一次） */
  function sweep() {
    if (!ui.scanline) return
    ui.scanline.classList.remove('dsu-go')
    void ui.scanline.offsetWidth
    ui.scanline.classList.add('dsu-go')
  }

  function setSubtitle(zh, en) {
    ui.subZh.classList.remove('dsu-in')
    ui.subEn2.classList.remove('dsu-in')
    setTimeout(function () {
      ui.subZh.textContent = zh || ''
      ui.subEn2.textContent = en || ''
      ui.subZh.classList.add('dsu-in')
      if (en) ui.subEn2.classList.add('dsu-in')
    }, ms(140))
  }

  function setStepCount(i, code) {
    const totalSteps = STEPS.length + 1
    ui.stepcount.textContent =
      '[ ' + String(i).padStart(2, '0') + ' / ' + String(totalSteps).padStart(2, '0') + ' ] ' + code
  }

  function showAction(step) {
    ui.btnZh.textContent = step.btnZh
    ui.btnEn.textContent = step.btnEn
    ui.card.hidden = step.action !== 'confirm'
    if (step.action === 'confirm') {
      ui.card.innerHTML = ''
      /* 纯中文标签 + 数字/名称，去掉英文双写与主机行，别堆信息 */
      const rows = [
        ['身份名称', C.identity, true],
        ['身份编号', C.identityId, false],
        ['权限等级', C.accessLevel, false],
      ]
      rows.forEach(function (r) {
        const row = el('div', 'dsu-card-row')
        row.appendChild(el('span', null, r[0]))
        row.appendChild(el('b', r[2] ? 'dsu-zhname' : null, r[1]))
        ui.card.appendChild(row)
      })
    }
    ui.hint.innerHTML = '按 <kbd>Enter</kbd> / <kbd>Space</kbd>，或点击按钮继续'
    ui.action.classList.add('dsu-in')
    ui.btn.classList.add('dsu-pulse')
  }

  function hideAction() {
    ui.action.classList.remove('dsu-in')
    ui.btn.classList.remove('dsu-pulse')
  }

  return {
    setProgress,
    setSlats,
    sweep,
    setSubtitle,
    setStepCount,
    startHex: hex.start,
    stopHex: hex.stop,
    assembleLogo() {
      return revealLogo(ui, ms, wait)
    },
    showAction,
    hideAction,
  }
}
