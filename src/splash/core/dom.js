/**
 * 建一个带类名和文本的普通元素。
 * @param {string} tag
 * @param {string|null} [cls]
 * @param {string|null} [text]
 * @returns {HTMLElement}
 */
export function el(tag, cls, text) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (text != null) node.textContent = text
  return node
}
