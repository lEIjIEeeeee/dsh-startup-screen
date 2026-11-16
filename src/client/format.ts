/**
 * 数字兜底：值能转成有限数就用它，否则用默认值。
 */
export function num(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
