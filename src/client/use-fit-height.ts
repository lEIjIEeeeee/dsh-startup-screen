import { useEffect } from 'react'

/** 找到最近的可滚动祖先：设置区要按它的内容高度撑满，而不是按窗口。 */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
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

/**
 * 设置区填满 DSH 弹窗的内容高度：右侧内容自己滚，底部操作栏固定在底部。
 *
 * @param ref 外层 shell
 * @param ready 配置到位后变化，触发重新测量
 */
export function useFitHeight(ref: { current: HTMLElement | null }, ready: number): void {
  useEffect(
    function () {
      const shell = ref.current
      if (!shell || typeof window === 'undefined') return
      const parent = findScrollParent(shell)
      if (!parent) return
      /* 闭包里保留非空别名，避免 TS 在嵌套函数里丢掉收窄。 */
      const shellEl: HTMLElement = shell
      const scrollParent: HTMLElement = parent
      function fit() {
        try {
          const cs = window.getComputedStyle(scrollParent)
          const h =
            scrollParent.clientHeight -
            (parseFloat(cs.paddingTop) || 0) -
            (parseFloat(cs.paddingBottom) || 0)
          if (h > 0) shellEl.style.height = h + 'px'
        } catch (e) {
          /* noop */
        }
      }
      fit()
      /* 弹窗刚挂载时 flex 高度可能还没稳定，下一帧再量一次 */
      const timer = setTimeout(fit, 0)
      const ro = window.ResizeObserver ? new window.ResizeObserver(fit) : null
      if (ro) ro.observe(scrollParent)
      window.addEventListener('resize', fit)
      return function () {
        clearTimeout(timer)
        if (ro) ro.disconnect()
        window.removeEventListener('resize', fit)
        try {
          shellEl.style.height = ''
        } catch (e) {
          /* noop */
        }
      }
    },
    [ref, ready],
  )
}
