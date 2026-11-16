/**
 * 开场：黑幕 → 鲸鱼标识 → 过曝洗白 → 暖白底板 → 品牌与读数进场。
 *
 * @param {Record<string, any>} ctx
 * @returns {Promise<any>}
 */
export function playOpening(ctx) {
  const C = ctx.C
  const ui = ctx.ui
  const root = ctx.root
  const audio = ctx.audio
  const ms = ctx.ms
  const wait = ctx.wait

  /* 第一幕就是纯黑：先把桌面端标题栏整层透明化，按钮与色块一并消失 */
  ctx.chromeSync.hide()
  return (
    Promise.resolve()
      /* 第一幕：黑幕 --> DeepSeek 标识 */
      .then(function () {
        return wait(820)
      })
      .then(function () {
        ui.blackInner.classList.add('dsu-in')
        audio.rise()
        return wait(240)
      })
      .then(function () {
        ui.blackEn.classList.add('dsu-tighten')
        return wait(880)
      })
      .then(function () {
        ui.sweep.classList.add('dsu-go')
        return wait(760)
      })
      /* 过场：过曝洗白 */
      .then(function () {
        ui.blackInner.classList.add('dsu-out')
        audio.sweep()
        ui.wash.style.transition = 'opacity ' + ms(220) + 'ms linear'
        ui.wash.style.opacity = '1'
        return wait(260)
      })
      .then(function () {
        ui.plate.style.transition =
          'opacity ' + ms(900) + 'ms ease, transform 3.4s cubic-bezier(0.16, 0.84, 0.24, 1)'
        ui.plate.style.opacity = '1'
        /* 底板铺满之后才让根节点透出去；多留 60ms，避免收尾帧仍露出 body 白底。 */
        if (C.glass) {
          setTimeout(
            function () {
              try {
                root.classList.add('dsu-glass-live')
                root.style.background = 'transparent'
              } catch (e) {
                /* noop */
              }
            },
            ms(900) + 60,
          )
        }
        ui.watermark.style.transition =
          'opacity ' + ms(1100) + 'ms ease, transform 4.6s cubic-bezier(0.16, 0.84, 0.24, 1)'
        ui.watermark.style.opacity = '1'
        ui.wash.style.transition = 'opacity ' + ms(720) + 'ms cubic-bezier(.2,.9,.2,1)'
        ui.wash.style.opacity = '0'
        ui.black.style.transition = 'opacity ' + ms(720) + 'ms ease'
        ui.black.style.opacity = '0'
        /* 底板正在被"洗"出来的时候，让一道掠光横掠过去 */
        if (ctx.ambientOn() && ui.sheen) ui.sheen.classList.add('dsu-go')
        return wait(760)
      })
      /* 第二幕：品牌块 / 页脚 / 进度条 */
      .then(function () {
        ui.brand.classList.add('dsu-in')
        ui.foot.classList.add('dsu-in')
        ui.stepcount.classList.add('dsu-in')
        ui.idline.classList.add('dsu-in')
        ui.frame.classList.add('dsu-in')
        ui.slats.classList.add('dsu-in')
        ui.meta.classList.add('dsu-in')
        ui.vignette.classList.add('dsu-in')
        ui.voice.classList.add('dsu-in')
        ui.fact1.classList.add('dsu-in')
        ui.fact2.classList.add('dsu-in')
        ui.checks.classList.add('dsu-in')
        ui.trace.classList.add('dsu-in')
        if (ctx.ambientOn()) {
          ui.atmo.classList.add('dsu-in')
          ui.beams.classList.add('dsu-in')
          ui.floor.classList.add('dsu-in')
          ui.field.classList.add('dsu-in')
          root.classList.add('dsu-cam')
        }
        ctx.setProgress(0.12)
        ctx.setStepCount(0, 'BOOT')
        ctx.setSlats(0)
        ctx.setSubtitle('系统自检中…', 'SYSTEM SELF-CHECK')
        if (C.allowSkip) ui.skip.classList.add('dsu-in')
        return wait(700)
      })
      .then(function () {
        ui.black.style.display = 'none'
        ctx.sweep()
      })
  )
}
