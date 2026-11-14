import { isAmbientOn } from '../core/config.js'

/**
 * 启动界面的骨架 HTML。
 *
 * 环境光关闭时连节点都不建，省掉一整层合成与 Canvas。
 *
 * @param {Record<string, any>} config
 * @returns {string}
 */
export function stageMarkup(config) {
  const ambient = isAmbientOn(config)
  const ambientHtml = ambient
    ? '<div class="dsu-atmo"></div>' +
      '<canvas class="dsu-field" aria-hidden="true"></canvas>' +
      '<div class="dsu-beams"></div>' +
      '<div class="dsu-floor"></div>' +
      '<div class="dsu-sheen"></div>'
    : ''
  const ambientTail = ambient ? '<div class="dsu-tear"></div>' : ''
  return (
    ambientHtml +
    '<div class="dsu-plate"></div>' +
    '<div class="dsu-vignette"></div>' +
    '<div class="dsu-watermark"></div>' +
    '<div class="dsu-grain"></div>' +
    '<div class="dsu-black">' +
    '<div class="dsu-black-inner"></div>' +
    '<div class="dsu-sweep"></div>' +
    '</div>' +
    '<div class="dsu-wash"></div>' +
    '<header class="dsu-brand">' +
    '<div class="dsu-brand-1"></div><div class="dsu-brand-2"></div>' +
    '<div class="dsu-brand-3"><b></b><span></span></div>' +
    '</header>' +
    '<div class="dsu-stepcount">[ 00 / 06 ] INIT</div>' +
    '<div class="dsu-center">' +
    '<div class="dsu-status"><span class="dsu-status-zh"></span><i class="dsu-caret"></i></div>' +
    '<div class="dsu-sub-en"></div>' +
    '<div class="dsu-rule"></div>' +
    '<div class="dsu-logo"></div>' +
    '<div class="dsu-dots" hidden></div>' +
    '</div>' +
    '<div class="dsu-idline"></div>' +
    '<div class="dsu-facts dsu-facts-1"></div>' +
    '<div class="dsu-facts dsu-facts-2"></div>' +
    '<div class="dsu-reticle"></div>' +
    '<div class="dsu-hex"></div>' +
    '<div class="dsu-trace"></div>' +
    '<div class="dsu-welcome">' +
    '<div class="dsu-w1">WELCOME TO</div>' +
    '<div class="dsu-w2"></div>' +
    '<div class="dsu-w3"></div>' +
    '<div class="dsu-w4"></div>' +
    '</div>' +
    '<div class="dsu-action">' +
    '<div class="dsu-card" hidden></div>' +
    '<button class="dsu-btn" type="button">' +
    '<span class="dsu-btn-zh"></span><span class="dsu-btn-en"></span>' +
    '</button>' +
    '<div class="dsu-hint"></div>' +
    '</div>' +
    '<div class="dsu-frame">' +
    '<i class="dsu-corner dsu-c-tl"></i><i class="dsu-corner dsu-c-tr"></i>' +
    '<i class="dsu-corner dsu-c-bl"></i><i class="dsu-corner dsu-c-br"></i>' +
    '<div class="dsu-scanline"></div>' +
    '</div>' +
    '<div class="dsu-slats"></div>' +
    '<div class="dsu-voice"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="dsu-meta"><span class="dsu-meta-1"></span><span class="dsu-meta-2"></span></div>' +
    '<div class="dsu-checks"></div>' +
    '<div class="dsu-skip">SKIP ▸</div>' +
    '<footer class="dsu-foot"><span></span><i></i></footer>' +
    '<div class="dsu-subtitle">' +
    '<span class="dsu-sub-zh"></span><span class="dsu-sub-en2"></span>' +
    '</div>' +
    '<div class="dsu-progress"><i></i></div>' +
    '<div class="dsu-bloom"></div>' +
    '<div class="dsu-streak"></div>' +
    '<div class="dsu-flash"></div>' +
    ambientTail
  )
}
