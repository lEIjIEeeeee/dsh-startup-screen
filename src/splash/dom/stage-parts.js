import { el } from '../core/dom.js'
import { createWhaleSvg } from '../core/whale.js'
import { STEPS } from '../data/steps.js'
import { createReticle } from './reticle.js'

/** 品牌、页脚、欢迎语、身份行这些静态文案。 */
export function fillStageText(ui, config) {
  ui.brand1.textContent = config.brand1
  ui.brand2.textContent = config.brand2
  ui.brand3b.textContent = config.brand3a
  ui.brand3s.textContent = config.brand3b
  ui.footText.textContent = config.footer
  ui.w2.textContent = config.welcomeBox
  ui.w4.textContent = '欢迎 ' + config.identity + ' 访问'
  ui.idline.textContent = '· ID CONFIRMED : ' + config.identityId
}

/** 黑幕里的鲸鱼与三行说明。 */
function decorateBlack(ui, config) {
  const inner = ui.blackInner
  inner.appendChild(createWhaleSvg('dsu-whale'))
  inner.appendChild(el('div', 'dsu-black-zh', config.orgZh))
  const en = el('div', 'dsu-black-en', config.orgEn)
  inner.appendChild(en)
  inner.appendChild(el('div', 'dsu-black-sub', config.orgSub))
  ui.blackEn = en
}

/** 中央鲸鱼标识与终幕标识。 */
function decorateLogos(ui) {
  ui.logo.appendChild(createWhaleSvg())
  ui.logo.appendChild(el('div', 'dsu-logolabel', 'D E E P S E E K'))
  ui.w3.appendChild(createWhaleSvg())
  ui.w3.appendChild(el('span', 'dsu-w3label', 'D E E P S E E K  ·  H A R N E S S'))
}

/** 右侧水印框：远 / 中 / 近三层。 */
function decorateWatermark(ui) {
  const boxes = [
    [0.6, 0.02, 0.16, 0.96],
    [0.78, 0.02, 0.16, 0.96],
    [0.96, 0.02, 0.16, 0.96],
    [0.05, 0.02, 0.1, 0.5],
  ]
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    const depth = i < 1 ? ' dsu-wm-far' : i < 3 ? ' dsu-wm-mid' : ' dsu-wm-near'
    const n = el('div', 'dsu-wm' + depth)
    n.style.left = b[0] * 100 + '%'
    n.style.top = b[1] * 100 + '%'
    n.style.width = b[2] * 100 + '%'
    n.style.height = b[3] * 100 + '%'
    ui.watermark.appendChild(n)
  }
}

/**
 * 左侧六格阶段柱 + 准星。
 *
 * @param {Record<string, any>} ui
 * @param {Record<string, any>} facts
 */
export function decorateStage(ui, facts) {
  for (let i = 0; i < STEPS.length + 1; i++) ui.slats.appendChild(el('i', 'dsu-slat'))
  ui.reticleScan = createReticle(ui.reticle, facts).scan
}

/**
 * 一次性填充骨架：静态文案 + 装饰节点。
 *
 * @param {Record<string, any>} ui
 * @param {Record<string, any>} config
 * @param {Record<string, any>} facts
 */
export function fillStage(ui, config, facts) {
  fillStageText(ui, config)
  decorateBlack(ui, config)
  decorateLogos(ui)
  decorateWatermark(ui)
  decorateStage(ui, facts)
}
