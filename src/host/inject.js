import { ROUTES } from '../shared/routes.js'
import { factsSnapshot } from './facts.js'

/** @typedef {import('./types.js').HostEnv} HostEnv */

/**
 * 内联到页面里的 JSON 不能出现 `</script>`。
 * @param {any} value
 */
export function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028|\u2029/g, '')
}

/** 首屏兜底样式：在应用挂载前先盖住窗口，避免闪出界面本体。 */
export const CRITICAL_CSS = [
  'html.dsu-lock,html.dsu-lock body{overflow:hidden!important}',
  /* 宿主会先给页面写一条白色背景，覆盖层插入前或玻璃透明时会露出来，
     所以启动期间统一压成黑色，和黑幕开场一致。 */
  'html.dsu-lock body{background-color:#000!important}',
  ':root{--dsh-boot-bg:#000}',
  '#dsh-startup-root.dsu-boot{position:fixed;inset:0;z-index:2147483000;background:#000}',
].join('')

/* 首屏兜底脚本。这次不播时清掉根节点并留下跳过标记；
   要播时锁住滚动，并在动画始终没跑起来（脚本缺失、被拦、语法错）时
   9 秒后无条件放行，绝不把页面锁死在黑屏。 */
export const BOOTSTRAP_JS = `(function(){try{
var c=window.__DSH_STARTUP__||{};
var root=document.getElementById('dsh-startup-root');
var off=!c.enabled;
if(!off&&c.mode==='session'){try{if(sessionStorage.getItem('dsh-startup-screen:shown')==='1')off=true}catch(e){}}
if(!off&&c.mode==='daily'){try{var d=new Date();var k=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);if(localStorage.getItem('dsh-startup-screen:day')===k)off=true}catch(e){}}
if(off){window.__DSH_STARTUP_SKIP__=true;if(root&&root.parentNode)root.parentNode.removeChild(root);}
else{document.documentElement.classList.add('dsu-lock');setTimeout(function(){try{if(window.__DSH_STARTUP_RUNNING__===true)return;var r=document.getElementById('dsh-startup-root');if(r&&r.parentNode)r.parentNode.removeChild(r);document.documentElement.classList.remove('dsu-lock');if(document.body)document.body.style.overflow='';window.__DSH_STARTUP_FAILED__=true;}catch(e){}},9000);}
}catch(e){} })()`

/**
 * 把首屏覆盖层注入宿主下发的 index.html。
 * @param {HostEnv} host
 * @returns {() => void} disposer
 */
export function injectIndex(host) {
  const { webServer, version, factsCache, readConfig } = host
  return webServer.tapIndex((html) => {
    if (!html || html.includes(ROUTES.splash)) return html
    const cfg = readConfig()
    cfg.facts = factsSnapshot(factsCache)
    const head =
      '<link rel="stylesheet" href="' +
      ROUTES.css +
      '">' +
      '<style id="dsh-startup-critical">' +
      CRITICAL_CSS +
      '</style>'
    const body =
      '<div id="dsh-startup-root" class="dsu-root dsu-boot"></div>' +
      '<script>window.__DSH_STARTUP_BOOT__="index";window.__DSH_STARTUP_VERSION__=' +
      safeJson(version) +
      ';window.__DSH_STARTUP__=' +
      safeJson(cfg) +
      ';' +
      BOOTSTRAP_JS +
      '</script>' +
      '<script defer src="' +
      ROUTES.splash +
      '"></script>'

    let out = html
    if (out.includes('</head>')) out = out.replace('</head>', head + '</head>')
    else out = head + out
    if (out.includes('<body>')) out = out.replace('<body>', '<body>' + body)
    else if (out.includes('</body>')) out = out.replace('</body>', body + '</body>')
    else out = out + body
    return out
  })
}
