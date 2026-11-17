import { clamp } from '../core/clamp.js'
import { ROOT_ID } from '../core/constants.js'
import { el } from '../core/dom.js'

/**
 * 液态玻璃：只让「背景层」（底板 / 黑幕）半透明 + 磨砂，
 * 文字、线条、鲸鱼标识、读数这些主体素材保持实心 —— 所以稿面还在，只是透出了背后的界面。
 *
 * @param {any} root
 * @param {Record<string, any>} config
 * @returns {{ backdropOn: boolean, restore: () => void }}
 */
export function applyGlass(root, config) {
  const blurredNodes = []
  let backdropOn = false

  /** 兜底：backdrop-filter 不可用时，直接模糊应用本体（除自己的根节点）。 */
  function blurAppBackdrop(px) {
    try {
      if (!document.body || !document.body.children) return
      for (let i = 0; i < document.body.children.length; i++) {
        /** @type {any} */
        const node = document.body.children[i]
        if (!node || !node.style || node.id === ROOT_ID) continue
        blurredNodes.push({ node, filter: node.style.filter || '' })
        node.style.transition = 'filter 420ms ease'
        node.style.filter = px > 0 ? 'blur(' + px + 'px)' : ''
      }
    } catch (e) {
      /* 兜底不抛 */
    }
  }

  function restore() {
    for (let i = 0; i < blurredNodes.length; i++) {
      const it = blurredNodes[i]
      try {
        it.node.style.filter = it.filter
        it.node.style.transition = ''
      } catch (e) {
        /* noop */
      }
    }
    blurredNodes.length = 0
  }

  if (!config.glass) {
    root.classList.remove('dsu-glass')
    return { backdropOn, restore }
  }

  const gAlpha = clamp(config.glassOpacity, 0.15, 0.95)
  const gBlur = clamp(config.glassBlur, 0, 60)
  const gSat = clamp(config.glassSaturate, 100, 200)
  root.classList.add('dsu-glass')
  root.style.setProperty('--dsu-glass-alpha', String(gAlpha))
  root.style.setProperty('--dsu-glass-blur', gBlur + 'px')
  root.style.setProperty('--dsu-glass-sat', gSat + '%')
  /* 这里刻意不置 transparent：DSH 0.2.1 起启动期 body 被强制白底，
     一上来透明就会在首帧露出白色，看起来就是「闪一下」。
     等底板铺满（下方 plate opacity=1 之后）再放开。 */
  /* 背景模糊：独立一层，专门糊「玻璃背后的东西」，和玻璃自身的磨砂是两个参数 */
  backdropOn = true
  const backdropBlur = clamp(config.glassBackdropBlur, 0, 80)
  root.style.setProperty('--dsu-backdrop-blur', backdropBlur + 'px')
  /* 直接模糊应用本体：backdrop-filter 在跨层级/跨堆叠上下文时会被静默忽略
     （实测表现是「底板透明了但背后不糊」），所以背景模糊不再依赖它 ——
     给 body 里除自己以外的根节点加 filter，效果确定、可在 finish/dispose 还原。 */
  /* 上限 60：再高就只剩一片纯色，看不出「背景变糊」而像「背景没了」 */
  if (backdropBlur > 0) {
    /* 应用本体已经糊过：通知 CSS 关掉底板/黑幕的冗余 backdrop-filter */
    root.classList.add('dsu-glass-appblur')
    blurAppBackdrop(Math.min(60, backdropBlur))
  } else {
    root.classList.remove('dsu-glass-appblur')
  }
  return { backdropOn, restore }
}

/** 背景模糊层：只在液态玻璃开启时插入，自己透明、只带 backdrop-filter。 */
export function insertBackdrop(root) {
  root.insertBefore(el('div', 'dsu-backdrop'), root.firstChild)
}
