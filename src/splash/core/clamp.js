/**
 * 把数值夹到 [lo, hi]；非数值回落到 lo。
 *
 * @param {any} v
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
export function clamp01(v, lo, hi) {
  const n = Number(v)
  return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo
}
