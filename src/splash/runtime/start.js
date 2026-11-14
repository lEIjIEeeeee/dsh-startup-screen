/**
 * 锁滚动并启动时间线；DOM 还在加载时等 DOMContentLoaded。
 *
 * @param {any} root
 * @param {any} timeline
 */
export function startRuntime(root, timeline) {
  document.documentElement.classList.add('dsu-lock')
  document.documentElement.style.overflow = 'hidden'
  if (document.body) document.body.style.overflow = 'hidden'
  timeline.setProgress(0.05)
  root.classList.remove('dsu-boot')

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      timeline.start()
    })
  } else {
    timeline.start()
  }
}
