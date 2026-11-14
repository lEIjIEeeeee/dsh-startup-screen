/**
 * 冒烟测试共用的小替身。
 *
 * 宿主在运行时注入 React 和界面控件，仓库里不装它们，
 * 这里按真机的形状做最小实现，两个测试文件共用一份。
 */

/** jsx / jsxs 的最小实现：只保留 type / props / key。 */
export function makeJsxStub() {
  return (type, props, key) =>
    ({ type, props: Object.assign({}, props || {}, key == null ? {} : { key }) })
}

/** 宿主界面控件：Button 渲染成原生按钮，Input 的类名落在外层 span。 */
export function makePrimitivesStub(React) {
  return {
    Button({ children, ...rest }) {
      return React.createElement('button', Object.assign({ type: 'button' }, rest), children)
    },
    Input({ _icon, className, ...rest }) {
      return React.createElement('span', { className }, React.createElement('input', rest))
    },
  }
}
