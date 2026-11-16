/**
 * 终幕：欢迎语、色散故障、光晕峰值与揭幕。
 *
 * @param {Record<string, any>} ctx
 * @returns {Promise<any>}
 */
export function playFinale(ctx) {
  const ui = ctx.ui
  const root = ctx.root
  const audio = ctx.audio
  const voice = ctx.voice
  const ms = ctx.ms
  const wait = ctx.wait

  if (ctx.isFinished() || ctx.stale()) return Promise.resolve()
  ctx.armStall()
  ctx.setStepCount(6, 'WELCOME')
  ctx.setSlats(6)
  ctx.setProgress(1)
  /* 底部日志和终幕里的「欢迎 xxx 访问」区分开，避免同一句出现两遍 */
  ctx.setSubtitle('身份验证完成，会话已建立', 'IDENTITY VERIFIED · SESSION ESTABLISHED')
  audio.chime()
  /* 终幕欢迎语用自制落幕词素材，在欢迎文案亮起的同一刻开始播放。
     素材缺失、走系统语音或关闭语音时保持静音，不会念出合成腔。 */
  let welcome = null

  ui.status.classList.remove('dsu-in')
  ui.subEn.classList.remove('dsu-in')
  ui.status.classList.remove('dsu-shield')
  ui.subEn.classList.remove('dsu-shield')
  ui.rule.classList.remove('dsu-in')
  ui.reticle.classList.remove('dsu-in')
  ui.reticle.classList.remove('dsu-lock')
  ui.fact1.classList.remove('dsu-in')
  ui.fact2.classList.remove('dsu-in')
  ui.checks.classList.remove('dsu-in')
  ui.trace.classList.remove('dsu-in')
  ctx.setChecks(0)
  ctx.stopDecode()
  ctx.stopHex()
  /* 中央区（状态行/分隔线/鲸鱼/虚线）整体退场：不清掉会和 WELCOME 版式叠字 */
  ui.center.classList.add('dsu-off')
  ui.dots.hidden = true

  return (
    wait(360)
      .then(function () {
        ui.welcome.classList.add('dsu-in')
        ui.idline.classList.remove('dsu-in')
        /* 欢迎文案亮起的同一刻开口 —— 早于画面会让人以为「话没说完画面就跳了」 */
        welcome = voice.line(null, null, 'line-6')
        return wait(420)
      })
      .then(function () {
        /* 结尾色散故障：分片位移 + 0.5px 模糊 + 混合模式，读起来像镜头色散 */
        const targets = [ui.w1, ui.w2, ui.w4]
        targets.forEach(function (t) {
          t.classList.add('dsu-glitch')
          t.setAttribute('data-text', t.textContent)
        })
        ui.w2.classList.add('dsu-glitch-box') /* 黑底白字那块换加色混合 */
        void ui.welcome.offsetWidth
        targets.forEach(function (t) {
          t.classList.add('dsu-on')
        })
        /* 色散层做"字在抖"，撕裂带做"画面在撕" */
        if (ctx.ambientOn() && ui.tear) ui.tear.classList.add('dsu-go')
        return wait(640)
      })
      /* 光晕从中心炸开 + 变形光条横扫 + 文字青色 halation */
      .then(function () {
        root.classList.add('dsu-peak')
        ui.bloom.classList.add('dsu-go')
        ui.streak.classList.add('dsu-go')
        return wait(430)
      })
      /* 光晕最亮那一下补一记极短高光（是"眨一下"，不是长时间糊白） */
      .then(function () {
        ui.flash.style.transition = 'opacity ' + ms(70) + 'ms linear'
        ui.flash.style.opacity = '0.72'
        return wait(90)
      })
      .then(function () {
        ui.flash.style.transition = 'opacity ' + ms(340) + 'ms cubic-bezier(0.4, 0, 0.2, 1)'
        ui.flash.style.opacity = '0'
        return wait(320)
      })
      /* 欢迎语没播完就不揭幕（素材缺失时这个 Promise 立刻 resolve，不影响节奏） */
      .then(function () {
        return welcome
      })
      /* 揭幕：整个机位后撤 + 轻微失焦，比单纯淡出更有镜头感 */
      .then(function () {
        root.classList.add('dsu-handoff')
        return wait(780)
      })
      .then(function () {
        return ctx.finish()
      })
  )
}
