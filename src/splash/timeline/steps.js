import { STEPS } from '../data/steps.js'

/**
 * 六个阶段：编号、阶段柱、自检、字幕、语音与等待。
 *
 * @param {import('./timeline.js').TimelineContext} ctx
 * @returns {Promise<any>}
 */
export function playSteps(ctx) {
  const ui = ctx.ui
  const ms = ctx.ms
  const wait = ctx.wait
  const waitAction = ctx.waitAction
  const typeIn = ctx.typeIn
  const startDecode = ctx.startDecode
  const voice = ctx.voice
  const audio = ctx.audio

  let chain = Promise.resolve()
  STEPS.forEach(function (step, i) {
    chain = chain.then(function () {
      if (ctx.isFinished() || ctx.stale()) return
      ctx.armStall()
      const n = i + 1
      /* 身份读数讲的是「身份已确认」，只属于前两幕。第 3 幕起是「接收访问需求」，
         这句信息已经过期，跟着身份核验一起退场，不再一路挂到终幕。 */
      if (i >= 2) ui.idline.classList.remove('dsu-in')
      ctx.setStepCount(n, step.badge)
      ctx.setSlats(n)
      ctx.setChecks(n)
      ctx.setProgress(step.progress)
      ctx.setSubtitle(step.log, step.logEn)
      audio.step()
      /* 语音在这里起头，但**不阻塞**下面的文字渐显 —— 两者同时发生 */
      const spoke = voice.line(step.say, step.zh, step.audio)

      ui.status.classList.toggle('dsu-zhline', true)
      /* 先摘掉 dsu-in 并强制一次样式计算，新的逐字 span 才会重新走渐显动画 */
      ui.status.classList.remove('dsu-in')
      ui.subEn.classList.remove('dsu-in')
      void ui.status.offsetWidth
      let slots = typeIn(ui.statusZh, step.zh, 46, 'decode')
      slots = slots.concat(typeIn(ui.subEn, step.en, 13, 'decode'))
      startDecode(slots)
      ui.caret.classList.toggle('dsu-on', !!step.action && step.action !== 'auto')
      requestAnimationFrame(function () {
        if (ctx.isFinished()) return
        ui.status.classList.add('dsu-in')
        ui.subEn.classList.add('dsu-in')
      })
      ui.rule.classList.add('dsu-in')
      /* 准星步骤才加护城河，避免玻璃背景下每句字都带常驻光晕 */
      ui.status.classList.toggle('dsu-shield', !!step.reticle)
      ui.subEn.classList.toggle('dsu-shield', !!step.reticle)

      if (step.assembleLogo) ctx.assembleLogo()
      if (step.reticle) {
        /* 照原片：准星出现时中央只留状态字，鲸鱼标识和虚线收掉，别挤成一团 */
        ui.logo.classList.remove('dsu-in')
        ui.dots.hidden = true
        ui.reticle.classList.add('dsu-in')
        ui.reticle.classList.add('dsu-lock')
        ctx.sweep()
      } else {
        ui.reticle.classList.remove('dsu-lock')
      }
      if (step.hex) ctx.startHex()

      /* 这一步停多久 = max(视觉基准, 实际播报时长 + 收尾留白) —— 台词长就多停，
         台词短也不会干等。用户点得快时同样等这一句念完，不掐断。 */
      function holdFor(spoken) {
        const target = Math.max(ms(step.hold), (spoken || 0) + ms(240))
        return wait(Math.max(0, target - (spoken || 0)))
      }

      if (step.action === 'grant' || step.action === 'confirm') {
        ctx.showAction(step)
        return wait(520)
          .then(function () {
            return waitAction()
          })
          .then(function () {
            ctx.hideAction()
            audio.confirm()
            ui.caret.classList.remove('dsu-on')
            return spoke
          })
          .then(function () {
            return wait(ms(320))
          })
      }
      if (step.hex) {
        return spoke.then(holdFor).then(function () {
          ctx.stopHex()
        })
      }
      return spoke.then(holdFor)
    })
  })
  return chain
}
