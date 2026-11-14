/** 系统"减少动态效果"：解码动画与后续光场都按静态处理。 */
export function prefersReducedMotion() {
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  } catch (e) {
    return false
  }
}
