/**
 * 数字兜底：值能转成有限数就用它，否则用默认值。
 *
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
export function num(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
