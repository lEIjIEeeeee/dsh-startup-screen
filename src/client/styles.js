/* 设置面板样式。以字符串形式随 bundle 注入 <style>，避免多一个 CSS 产物，
   也沿用宿主约定的 data-plugin-css 去重标记。 */
export const CSS = [
  '.__ss_root{max-width:620px;display:flex;flex-direction:column;gap:14px;font-family:"Segoe UI Variable Text","Segoe UI","Noto Sans SC","Microsoft YaHei UI","Microsoft YaHei","PingFang SC",sans-serif;font-size:13.5px;line-height:1.5;-webkit-font-smoothing:auto;text-rendering:auto;color:var(--dsw-alias-label-primary)}',
  '.__ss_version{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary)}',
  '.__ss_group{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:var(--dsw-radius-md,12px);padding:12px 14px;display:flex;flex-direction:column;gap:11px}',
  '.__ss_groupTitle{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}',
  '.__ss_groupTitle::after{content:"";flex:1;height:1px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.2))}',
  '.__ss_subTitle{font-size:11.5px;font-weight:600;letter-spacing:.06em;color:var(--dsw-alias-label-tertiary);margin-top:2px}',
  '.__ss_shell{display:flex;flex-direction:column;height:100%;min-height:420px}',
  '.__ss_layout{display:flex;flex:1;min-height:0;gap:16px}',
  '.__ss_nav{width:124px;flex:none;display:flex;flex-direction:column;gap:4px;border-right:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));padding-right:12px}',
  '.__ss_navTitle{font-size:12px;font-weight:600;letter-spacing:.08em;color:var(--dsw-alias-label-tertiary);padding:2px 8px 6px}',
  '.__ss_navItem{position:relative;text-align:left;border:0;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:var(--dsw-radius-md,12px);padding:8px 12px;font:inherit;font-size:13.5px;cursor:pointer}',
  '.__ss_navItem:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.12))}',
  '.__ss_navItemActive{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.12));font-weight:600}',
  '.__ss_navItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:-2px}',
  '.__ss_navVersion{margin-top:auto;padding:10px 8px 0;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-tertiary)}',
  '.__ss_main{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}',
  '.__ss_content{flex:1;min-height:0;overflow-y:auto;padding-right:6px;display:flex;flex-direction:column;gap:14px}',
  '.__ss_page{display:flex;flex-direction:column;gap:14px}',
  '.__ss_page[hidden]{display:none}',
  '.__ss_details{border-top:1px dashed var(--dsw-alias-border-l2);padding-top:8px;display:flex;flex-direction:column;gap:10px}',
  '.__ss_details summary{cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}',
  '.__ss_field{display:flex;flex-direction:column;gap:6px}',
  '.__ss_label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}',
  '.__ss_labelText{display:block}',
  '.__ss_hint{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
  '.__ss_row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
  /* 输入框是宿主 primitives.Input：类名落在外层 span 上，内层才是原生 input */
  '.__ss_input{display:block;box-sizing:border-box;width:100%;min-width:0;height:auto;padding:0;border:0;background:none}',
  '.__ss_input input{box-sizing:border-box;width:100%;height:34px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l4,rgba(127,127,127,.28));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08));font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);outline:none}',
  '.__ss_input input:focus{border-color:var(--dsw-alias-state-business-primary,#4176e6)}',
  '.__ss_inputMono input{font-family:ui-monospace,Consolas,monospace;font-size:12px;letter-spacing:.06em}',
  '.__ss_select{box-sizing:border-box;height:34px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4,rgba(127,127,127,.28));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08));color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;min-width:180px}',
  '.__ss_select:focus{border-color:var(--dsw-alias-state-business-primary,#4176e6);outline:none}',
  '.__ss_check{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;padding:2px 0}',
  '.__ss_check input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}',
  '.__ss_switch{order:2;position:relative;flex:none;box-sizing:border-box;width:36px;height:20px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3,#dcdfe6);transition:background 180ms ease}',
  '.__ss_switch i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb,#fff);transition:transform 180ms cubic-bezier(.2,.8,.2,1)}',
  '.__ss_check input:checked + .__ss_switch{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-state-business-primary,#4176e6))}',
  '.__ss_check input:checked + .__ss_switch i{transform:translateX(16px);background:var(--dsw-alias-label-primary-foreground,#fff)}',
  '.__ss_check input:focus-visible + .__ss_switch{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}',
  '.__ss_checkText{order:1;flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
  '.__ss_range{flex:1 1 200px;-webkit-appearance:none;appearance:none;height:18px;background:transparent;cursor:pointer}',
  '.__ss_range::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(90deg,var(--dsw-alias-state-business-primary,#4176e6) 0 var(--ss-fill,50%),var(--dsw-alias-border-l2,rgba(127,127,127,.28)) var(--ss-fill,50%))}',
  '.__ss_range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-5.5px;border-radius:50%;background:#fff;border:2px solid var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 1px 3px rgba(0,0,0,.22)}',
  '.__ss_range::-moz-range-track{height:3px;border-radius:2px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.28))}',
  '.__ss_range::-moz-range-progress{height:3px;border-radius:2px;background:var(--dsw-alias-state-business-primary,#4176e6)}',
  '.__ss_range::-moz-range-thumb{width:12px;height:12px;border:2px solid var(--dsw-alias-state-business-primary,#4176e6);border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.22)}',
  '.__ss_two{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
  '.__ss_actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:2px}',
  /* 固定底栏：在右侧内容区之外，不随内容滚动 */
  '.__ss_footer{flex:none;margin-top:8px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));background:var(--dsw-alias-bg-layer-1,#fff);display:flex;flex-direction:column;gap:6px}',
  '.__ss_barHint{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary);word-break:break-all}',
  '.__ss_barFile{display:block;opacity:.85;font-family:ui-monospace,Consolas,monospace;font-size:11px}',
  '.__ss_dirty{font-size:12px;color:var(--dsw-alias-state-business-primary,#4176e6);font-weight:600}',
  '.__ss_btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border:0;border-radius:var(--dsw-radius-md,12px);background:transparent;box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsh-button-outline-color,var(--dsw-alias-border-l3,rgba(127,127,127,.28)));color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}',
  '.__ss_btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}',
  '.__ss_btn:disabled{opacity:.4;cursor:not-allowed}',
  '.__ss_btnPrimary{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-state-business-primary,#4176e6));color:var(--dsw-alias-label-primary-foreground,#fff);box-shadow:none}',
  '.__ss_btnPrimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-state-business-primary,#4176e6));filter:brightness(1.06)}',
  '.__ss_btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}',
  '.__ss_select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}',
  '.__ss_range:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px;border-radius:9px}',
  '.__ss_swatch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}',
  '.__ss_status{font-size:12.5px;color:var(--dsw-alias-label-tertiary)}',
  '.__ss_ok{font-size:12.5px;color:var(--dsw-alias-state-business-primary,#4176e6)}',
  '.__ss_err{font-size:12.5px;color:var(--dsw-alias-state-error-primary,#f85149)}',
  '.__ss_swatch{width:38px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:8px;background:transparent;cursor:pointer}',
].join('')

const TAG_ID = 'dsh-startup-screen/main.css'

/** 挂一次样式；已挂过就跳过（设置页可能被反复打开）。 */
export function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css="' + TAG_ID + '"]') !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-startup-screen'
  tag.dataset.pluginCss = TAG_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}
