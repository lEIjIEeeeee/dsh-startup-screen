/** 建一个带类名和文本的普通元素。 */
export function el(tag, cls, text) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (text != null) node.textContent = text
  return node
}

/** 按需加上 / 摘掉一个状态类，默认是 `dsu-in`。 */
export function setIn(node, on, cls) {
  if (!node) return
  node.classList.toggle(cls || 'dsu-in', !!on)
}
