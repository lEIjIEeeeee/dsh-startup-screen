/**
 * 把 #rgb / #rrggbb 转成 rgba()。
 * 非法值回落成默认橙色，保证样式里不会出现无效颜色。
 *
 * @param {string} hex
 * @param {number|string} alpha
 * @returns {string}
 */
export function hexToRgba(hex, alpha) {
  let h = String(hex || '').replace(/^#/, '')
  if (h.length === 3) {
    h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)
  }
  const n = parseInt(h, 16)
  if (!isFinite(n) || h.length !== 6) return 'rgba(255, 117, 0, ' + alpha + ')'
  return 'rgba(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + alpha + ')'
}
