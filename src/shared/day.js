/**
 * 「每天一次」用的日期键。
 *
 * 按本机时区取年月日，跨零点换日；不要用 UTC，
 * 否则东八区早上八点就会被算成第二天。
 *
 * @param {Date} [date]
 * @returns {string} 形如 2026-11-14
 */
export function localDayKey(date) {
  const d = date instanceof Date ? date : new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + month + '-' + day
}
