"use strict";
(() => {
  // src/shared/day.js
  function localDayKey(date) {
    const d = date instanceof Date ? date : /* @__PURE__ */ new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
  }

  // src/shared/routes.js
  var ROUTE_BASE = "/dsh-startup";
  var ROUTES = {
    css: ROUTE_BASE + "/splash.css",
    splash: ROUTE_BASE + "/splash.js",
    asset: ROUTE_BASE + "/asset",
    config: ROUTE_BASE + "/config",
    facts: ROUTE_BASE + "/facts"
  };

  // src/shared/defaults.js
  var DEFAULTS = {
    enabled: true,
    mode: "session",
    // always | session | daily
    theme: "light",
    // light | dark
    speed: 1,
    requireInteraction: true,
    allowSkip: true,
    ambient: true,
    // 环境光效：Canvas 光场 + 氛围层 + 电影感细节
    sound: true,
    // 界面音效（WebAudio 合成，无音频文件）
    soundVolume: 0.5,
    voice: true,
    // 女声播报（Web Speech API）
    voiceLang: "en",
    // en | zh | both
    voiceName: "",
    // '' = 自动挑（按分数优先神经网络女声）
    voiceRate: 0.88,
    // 电影旁白档：比朗读慢，字与字之间才有重量
    voicePitch: 0.85,
    // 压低音调，深沉的 AI 女声
    voiceVolume: 0.9,
    voiceCue: true,
    // 念台词前的一声轻提示
    sfx: "audio",
    // 音效来源：audio=内置素材目录里的真录音 / synth=现场合成
    voiceSource: "asset",
    // 语音来源：asset=优先用真声素材（拿不到自动回落 TTS）/ tts=全 TTS
    voiceLead: 240,
    // 提示音之后留一小段空白再开口
    identity: "JOYCE MOORE",
    // ← 设置页里可改的「身份名称」
    identityId: "0087",
    accessLevel: "3",
    brand1: "DEEPSEEK",
    brand2: "SYNTHESIZE INTELLIGENCE",
    brand3a: "HARNESS",
    brand3b: "OS",
    orgZh: "深度求索",
    orgEn: "DEEPSEEK",
    orgSub: "DEEPSEEK HARNESS",
    welcomeBox: "DEEPSEEK HARNESS",
    footer: "POWERED BY DEEPSEEK",
    accent: "#ff7500",
    glitchA: "#ff3b30",
    glitchB: "#2971b8",
    /* 液态玻璃：背景层做成半透明磨砂，能透出后面的窗口；文字和图形保持不透明。
       默认关闭，实心底板更像成片。 */
    glass: false,
    // 总开关（默认关：实心底板更像成片；想透桌面再开）
    glassOpacity: 0.75,
    // 0.15 ~ 0.95：越低越透；0.75 时背后是「暖白模糊」而不是灰
    glassBlur: 22,
    // 0 ~ 60px：玻璃自身的磨砂
    glassSaturate: 160,
    // 100 ~ 200%：玻璃后面的饱和度（液态玻璃那种通透感）
    glassBackdropBlur: 28
    // 0 ~ 80px：背景模糊（实际作用于应用本体，超过 60 会糊成纯色）
  };

  // src/shared/schema.js
  var IDENTITY_MAX = 48;
  var IDENTITY_ID_MAX = 12;
  function normalizeIdentityId(value, identity) {
    const id = String(value || identity || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, IDENTITY_ID_MAX);
    return id || "OPERATOR";
  }

  // src/splash/core/config.js
  function normalizeStartupConfig(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const out = {};
    for (const key in DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) out[key] = DEFAULTS[key];
    }
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== void 0 && source[key] !== null) {
        out[key] = source[key];
      }
    }
    out.speed = Math.min(3, Math.max(0.35, Number(out.speed) || 1));
    out.identity = String(out.identity || DEFAULTS.identity).slice(0, IDENTITY_MAX);
    out.identityId = normalizeIdentityId(out.identityId, out.identity);
    return out;
  }
  function factText(value) {
    return value === null || value === void 0 || value === "" ? "—" : String(value);
  }
  function isAmbientOn(config) {
    return config.ambient !== false;
  }

  // src/splash/core/constants.js
  var ROOT_ID = "dsh-startup-root";
  var STALL_MS = 15e3;
  var DECODE_TICK = 55;

  // src/splash/core/color.js
  function hexToRgba(hex, alpha) {
    let h = String(hex || "").replace(/^#/, "");
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    const n = parseInt(h, 16);
    if (!isFinite(n) || h.length !== 6) return "rgba(255, 117, 0, " + alpha + ")";
    return "rgba(" + (n >> 16 & 255) + ", " + (n >> 8 & 255) + ", " + (n & 255) + ", " + alpha + ")";
  }

  // src/splash/core/dom.js
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // src/splash/core/decode.js
  var GLYPH_WIDE = "アイウエオカキクケコサシスセソタチツテトナニヌネノ";
  var GLYPH_NARROW = "0123456789ABCDEF";
  function glyphFor(ch) {
    const wide = ch.charCodeAt(0) > 11903;
    const pool = wide ? GLYPH_WIDE : GLYPH_NARROW;
    return pool.charAt(Math.floor(Math.random() * pool.length));
  }
  function createDecoder(reduced) {
    let decodeTimer = null;
    let decodePending = [];
    function typeIn(host, text, stagger, mode) {
      host.textContent = "";
      const frag = document.createDocumentFragment();
      const slots = [];
      let n = 0;
      const decode = mode === "decode" && !reduced;
      for (let i = 0; i < text.length; i++) {
        const ch = text.charAt(i);
        if (ch === " ") {
          frag.appendChild(document.createTextNode(" "));
          continue;
        }
        const sep = ch === "·";
        const span = el("span", sep ? "dsu-ch dsu-sep" : "dsu-ch", decode && !sep ? glyphFor(ch) : ch);
        span.style.transitionDelay = Math.round(n * stagger) + "ms";
        if (decode && !sep) slots.push({ node: span, text: ch, delay: Math.round(n * stagger) });
        frag.appendChild(span);
        n++;
      }
      host.appendChild(frag);
      return slots;
    }
    function startDecode(slots) {
      stopDecode();
      if (!slots || !slots.length) return;
      for (const slot of slots) {
        decodePending.push({
          node: slot.node,
          text: slot.text,
          lockAt: slot.delay + 100 + Math.random() * 180
        });
      }
      const t0 = Date.now();
      decodeTimer = setInterval(() => {
        const now = Date.now() - t0;
        const rest = [];
        for (const item of decodePending) {
          if (now >= item.lockAt) item.node.textContent = item.text;
          else {
            item.node.textContent = glyphFor(item.text);
            rest.push(item);
          }
        }
        decodePending = rest;
        if (!decodePending.length) stopDecode();
      }, DECODE_TICK);
    }
    function stopDecode() {
      if (decodeTimer) {
        clearInterval(decodeTimer);
        decodeTimer = null;
      }
      for (const item of decodePending) item.node.textContent = item.text;
      decodePending = [];
    }
    return { typeIn, startDecode, stopDecode };
  }

  // src/splash/data/whale-path.js
  var WHALE_PATH = "M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z";

  // src/splash/core/whale.js
  var metalSeq = 0;
  function createWhaleSvg(cls) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 50 50");
    svg.setAttribute("aria-hidden", "true");
    if (cls) svg.setAttribute("class", cls);
    const gid = "dsu-metal-" + ++metalSeq;
    const defs = document.createElementNS(ns, "defs");
    const lg = document.createElementNS(ns, "linearGradient");
    lg.setAttribute("id", gid);
    lg.setAttribute("x1", "0.10");
    lg.setAttribute("y1", "0");
    lg.setAttribute("x2", "0.62");
    lg.setAttribute("y2", "1");
    const stops = [
      [0, "#ffffff", "0.24"],
      [0.4, "#ffffff", "0"],
      [0.62, "#000000", "0"],
      [1, "#000000", "0.20"]
    ];
    for (const stop of stops) {
      const node = document.createElementNS(ns, "stop");
      node.setAttribute("offset", String(stop[0]));
      node.setAttribute("stop-color", stop[1]);
      node.setAttribute("stop-opacity", stop[2]);
      lg.appendChild(node);
    }
    defs.appendChild(lg);
    svg.appendChild(defs);
    const shape = document.createElementNS(ns, "path");
    shape.setAttribute("d", WHALE_PATH);
    shape.setAttribute("fill-rule", "nonzero");
    svg.appendChild(shape);
    const shine = document.createElementNS(ns, "path");
    shine.setAttribute("d", WHALE_PATH);
    shine.setAttribute("fill-rule", "nonzero");
    shine.style.fill = "url(#" + gid + ")";
    svg.appendChild(shine);
    return svg;
  }

  // src/splash/data/steps.js
  var STEPS = [
    {
      zh: "需要访问许可",
      en: "ACCESS PERMISSION REQUIRED",
      say: "Access permission required.",
      audio: "line-1",
      log: "等待用户授权…",
      logEn: "AWAITING OPERATOR CONSENT",
      badge: "AUTHORIZATION",
      action: "grant",
      btnZh: "授予访问权限",
      btnEn: "GRANT ACCESS",
      hold: 900,
      progress: 0.34
    },
    {
      zh: "身份资料确认",
      en: "IDENTITY VERIFICATION",
      say: "Identity verification.",
      audio: "line-2",
      log: "核对身份资料…",
      logEn: "MATCHING OPERATOR RECORD",
      badge: "IDENTITY",
      action: "confirm",
      btnZh: "确认身份",
      btnEn: "CONFIRM IDENTITY",
      hold: 700,
      progress: 0.5
    },
    {
      zh: "接收访问需求",
      en: "ACCESS REQUEST RECEIVED",
      say: "Access request received.",
      audio: "line-3",
      log: "接收访问需求，建立会话通道…",
      logEn: "HANDSHAKE ESTABLISHED",
      badge: "REQUEST",
      action: "auto",
      hold: 1200,
      progress: 0.66,
      assembleLogo: true
    },
    {
      zh: "开始读取权限",
      en: "PERMISSION READ STARTED",
      say: "Beginning permission read.",
      audio: "line-4",
      log: "开始读取权限，索引工作区与会话…",
      logEn: "READING PERMISSION SET",
      badge: "READ",
      action: "auto",
      hold: 1200,
      progress: 0.8,
      hex: true
    },
    {
      zh: "读取完毕 · 核验通过",
      en: "READ COMPLETE · VERIFIED",
      say: "Read complete. Verification passed.",
      audio: "line-5",
      log: "读取完毕，核验通过，权限已授予",
      logEn: "PERMISSION AUTHORIZED",
      badge: "VERIFY",
      action: "auto",
      hold: 1600,
      progress: 0.93,
      reticle: true
    }
  ];

  // src/splash/dom/chrome-sync.js
  function createChromeSync() {
    const CLEAR = "rgba(0, 0, 0, 0)";
    const VARS = ["--dsw-specific-sidebar-fill", "--dsw-alias-label-primary"];
    const MAX_HOLD_MS = 6e4;
    const rootEl = document.documentElement;
    const state = { applied: false, probe: null, settledHits: 0 };
    const savedVars = {};
    let retryTimers = [];
    let keepAlive = null;
    let holdTimer = null;
    function isDesktopWin() {
      try {
        const nav = typeof window !== "undefined" && window.navigator || (typeof navigator !== "undefined" ? navigator : null);
        if (!nav || !/Win/.test(nav.userAgent || "")) return false;
        const loc = typeof window !== "undefined" && window.location || (typeof location !== "undefined" ? location : null);
        if (loc && loc.protocol === "dsh-app:") return true;
        const de = document.documentElement;
        return !!(de && de.hasAttribute && de.hasAttribute("data-windows-titlebar"));
      } catch (e) {
        return false;
      }
    }
    function findProbe() {
      try {
        if (!document.querySelector) return null;
        const node = document.querySelector('span[style*="dsw-specific-sidebar-fill"]');
        if (node) return node;
        if (!document.querySelectorAll) return null;
        const spans = document.querySelectorAll("span");
        for (let i = 0; i < spans.length; i++) {
          const span = spans[i];
          if (!span.style || typeof span.style.getPropertyValue !== "function") continue;
          const bg = span.style.getPropertyValue("background-color");
          if (bg && bg.indexOf("--dsw-specific-sidebar-fill") !== -1) return span;
        }
      } catch (e) {
      }
      return null;
    }
    function poke() {
      try {
        if (document.head) {
          const style = document.createElement("style");
          style.setAttribute("data-dsu-chrome-poke", "1");
          style.textContent = "/*dsu-poke*/";
          document.head.appendChild(style);
          if (style.parentNode) style.parentNode.removeChild(style);
        }
      } catch (e) {
      }
      try {
        if (document.body && document.body.style) {
          document.body.style.setProperty("--dsu-chrome-poke", String(Date.now() % 1e6));
          document.body.style.removeProperty("--dsu-chrome-poke");
        }
      } catch (e) {
      }
    }
    function settled() {
      try {
        const probe = state.probe;
        if (!probe || probe.isConnected === false) return false;
        if (typeof getComputedStyle !== "function") return false;
        return getComputedStyle(probe).backgroundColor === CLEAR;
      } catch (e) {
        return false;
      }
    }
    function apply() {
      try {
        let probe = state.probe;
        if (!probe || probe.isConnected === false) probe = state.probe = findProbe();
        if (probe) {
          probe.style.setProperty("background-color", CLEAR);
          probe.style.setProperty("color", CLEAR);
        }
        if (rootEl) for (const name of VARS) rootEl.style.setProperty(name, CLEAR);
        poke();
      } catch (e) {
      }
    }
    function stopTimers() {
      for (const timer of retryTimers) clearTimeout(timer);
      retryTimers = [];
      if (keepAlive) {
        clearInterval(keepAlive);
        keepAlive = null;
      }
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    }
    function hide() {
      if (!isDesktopWin()) return;
      try {
        if (!state.applied) {
          state.applied = true;
          state.settledHits = 0;
          for (const name of VARS) savedVars[name] = rootEl.style.getPropertyValue(name);
          state.probe = findProbe();
          holdTimer = setTimeout(show, MAX_HOLD_MS);
        }
        apply();
        for (const timer of retryTimers) clearTimeout(timer);
        retryTimers = [];
        const delays = [140, 520, 1400];
        for (const delay of delays) retryTimers.push(setTimeout(apply, delay));
        if (!keepAlive) {
          keepAlive = setInterval(function() {
            if (!state.applied) return;
            if (settled()) {
              if (++state.settledHits >= 2) {
                clearInterval(keepAlive);
                keepAlive = null;
              }
              return;
            }
            state.settledHits = 0;
            apply();
          }, 600);
        }
      } catch (e) {
      }
    }
    function show() {
      if (!state.applied) return;
      state.applied = false;
      try {
        stopTimers();
        const probe = state.probe;
        if (probe) {
          probe.style.removeProperty("background-color");
          probe.style.removeProperty("color");
        }
        if (rootEl) {
          for (const name of VARS) {
            if (savedVars[name]) rootEl.style.setProperty(name, savedVars[name]);
            else rootEl.style.removeProperty(name);
          }
        }
        poke();
        state.probe = null;
        state.settledHits = 0;
      } catch (e) {
      }
    }
    let observerInstalled = false;
    function installObserver() {
      if (observerInstalled) return;
      observerInstalled = true;
      try {
        if (typeof MutationObserver !== "function" || !document.body) return;
        const mo = new MutationObserver(function(mutations) {
          for (const mutation of mutations) {
            const nodes = mutation.removedNodes;
            for (let i = 0; nodes && i < nodes.length; i++) {
              if (nodes[i] && nodes[i].nodeType === 1 && nodes[i].id === ROOT_ID) {
                show();
                return;
              }
            }
          }
        });
        mo.observe(document.body, { childList: true });
      } catch (e) {
      }
    }
    if (document.body) installObserver();
    else if (document.addEventListener) document.addEventListener("DOMContentLoaded", installObserver);
    return { hide, show, isDesktopWin };
  }

  // src/splash/index.js
  function boot() {
    "use strict";
    if (window.__DSH_STARTUP_LOADED__) return;
    window.__DSH_STARTUP_LOADED__ = true;
    var C = normalizeStartupConfig(window.__DSH_STARTUP__);
    var REDUCED = (function() {
      try {
        return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      } catch (e) {
        return false;
      }
    })();
    var FACTS = C.facts && typeof C.facts === "object" ? C.facts : {};
    function ambientOn() {
      return isAmbientOn(C);
    }
    function paintMeta() {
      if (!ui || !ui.meta1) return;
      if (!FACTS.version && !FACTS.profile) {
        ui.meta1.textContent = "REV 0.1.0 · WEB PROFILE";
        return;
      }
      ui.meta1.textContent = "REV " + factText(FACTS.version) + " · " + factText(FACTS.profile) + " PROFILE";
    }
    function paintFacts() {
      if (!ui || !ui.fact1 || !ui.fact2) return;
      ui.fact1.textContent = "";
      ui.fact1.appendChild(el("span", null, "· MODEL : "));
      ui.fact1.appendChild(el("b", null, factText(FACTS.model)));
      ui.fact2.textContent = "";
      ui.fact2.appendChild(el("span", null, "· SANDBOX : "));
      ui.fact2.appendChild(el("b", null, factText(FACTS.sandbox)));
      ui.fact2.appendChild(el("span", null, " · BUNDLES : "));
      ui.fact2.appendChild(el("b", null, factText(FACTS.bundleCount)));
    }
    function buildChecks() {
      if (!ui || !ui.checks) return;
      ui.checks.textContent = "";
      var head = el("div", "dsu-checks-h", "SELF-CHECK / ");
      head.appendChild(el("span", "dsu-live", "LIVE"));
      ui.checks.appendChild(head);
      var rows = [
        ["PROFILE", FACTS.profile],
        ["BUNDLES", FACTS.bundleCount],
        ["MODEL", FACTS.model],
        ["SANDBOX", FACTS.sandbox],
        ["SESSIONS", FACTS.sessions],
        ["ARCHIVED", FACTS.sessionsArchived]
      ];
      for (var i = 0; i < rows.length; i++) {
        var row = el("div", "dsu-check");
        row.appendChild(el("span", "dsu-check-k", rows[i][0]));
        row.appendChild(el("span", "dsu-check-v", factText(rows[i][1])));
        row.appendChild(el("i"));
        ui.checks.appendChild(row);
      }
    }
    function setChecks(active) {
      if (!ui || !ui.checks) return;
      var items = ui.checks.children || [];
      var n = 0;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.classList || !it.classList.contains("dsu-check")) continue;
        n++;
        it.classList.toggle("dsu-on", n === active);
        it.classList.toggle("dsu-past", n < active);
      }
    }
    function stopTrace() {
      if (ui && ui.traceTimer) {
        clearInterval(ui.traceTimer);
        ui.traceTimer = null;
      }
    }
    function buildTrace() {
      if (!ui || !ui.trace) return;
      stopTrace();
      ui.trace.textContent = "";
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 520 46");
      var base = document.createElementNS(ns, "line");
      base.setAttribute("x1", "0");
      base.setAttribute("y1", "23");
      base.setAttribute("x2", "520");
      base.setAttribute("y2", "23");
      base.setAttribute("class", "dsu-trace-base");
      svg.appendChild(base);
      for (var i = 0; i <= 20; i++) {
        var tick = document.createElementNS(ns, "line");
        var tx = i * 26;
        tick.setAttribute("x1", String(tx));
        tick.setAttribute("y1", "19");
        tick.setAttribute("x2", String(tx));
        tick.setAttribute("y2", "27");
        tick.setAttribute("class", "dsu-trace-tick");
        svg.appendChild(tick);
      }
      var seed = String(FACTS.hash || "DSHBOOT");
      var h = 2166136261;
      for (var k = 0; k < seed.length; k++) {
        h ^= seed.charCodeAt(k);
        h = Math.imul(h, 16777619) >>> 0;
      }
      var phase = h % 628 / 100;
      function tracePathAt(now) {
        var drift = now * 34e-5;
        var d = "M0 23";
        for (var x = 0; x <= 520; x += 8) {
          var env = Math.sin(x / 520 * Math.PI);
          var amp = (Math.sin(x * 0.035 + phase + drift) * 5 + Math.sin(x * 0.011 + phase * 1.7 - drift * 0.62) * 3) * env;
          d += " L" + x + " " + (23 + amp).toFixed(1);
        }
        return d;
      }
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", tracePathAt(0));
      path.setAttribute("class", "dsu-trace-line");
      svg.appendChild(path);
      var cursor = document.createElementNS(ns, "line");
      cursor.setAttribute("x1", "0");
      cursor.setAttribute("y1", "2");
      cursor.setAttribute("x2", "0");
      cursor.setAttribute("y2", "44");
      cursor.setAttribute("class", "dsu-trace-cursor");
      svg.appendChild(cursor);
      ui.trace.appendChild(svg);
      ui.tracePath = path;
      ui.traceTimer = setInterval(function() {
        path.setAttribute("d", tracePathAt(Date.now()));
      }, 90);
    }
    function applyFacts(f) {
      if (!f || typeof f !== "object" || f.ready !== true) return;
      var prevHash = FACTS.hash;
      FACTS = f;
      try {
        if (window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === "object") {
          window.__DSH_STARTUP__.facts = f;
        }
      } catch (e) {
      }
      paintMeta();
      paintFacts();
      buildChecks();
      buildTrace();
      if (f.hash && f.hash !== prevHash && ui.field && !ui.field.classList.contains("dsu-in")) {
        try {
          stopField();
        } catch (e) {
        }
        startField();
      }
    }
    function refreshFacts() {
      if (typeof fetch !== "function") return;
      var deadline = Date.now() + 2200;
      function tick() {
        try {
          fetch(ROUTES.facts, { headers: { Accept: "application/json" } }).then(function(r) {
            return r.json();
          }).then(function(j) {
            if (j && j.ok === true && j.facts && j.facts.ready === true) applyFacts(j.facts);
            if (Date.now() < deadline) setTimeout(tick, 400);
          }).catch(function() {
            if (Date.now() < deadline) setTimeout(tick, 600);
          });
        } catch (e) {
          if (Date.now() < deadline) setTimeout(tick, 600);
        }
      }
      tick();
    }
    var chromeSync = createChromeSync();
    try {
      window.__DSH_STARTUP_CHROME__ = chromeSync;
    } catch (e) {
    }
    var GEN = window.__DSH_STARTUP_GEN__ = (window.__DSH_STARTUP_GEN__ || 0) + 1;
    function stale() {
      return window.__DSH_STARTUP_GEN__ !== GEN;
    }
    function noop() {
    }
    var globalListeners = [];
    function listen(target, type, fn, opts) {
      if (!target || typeof target.addEventListener !== "function") return;
      try {
        target.addEventListener(type, fn, opts);
      } catch (e) {
        return;
      }
      globalListeners.push(function() {
        try {
          target.removeEventListener(type, fn, opts);
        } catch (e) {
        }
      });
    }
    function dropListeners() {
      for (var i = 0; i < globalListeners.length; i++) {
        try {
          globalListeners[i]();
        } catch (e) {
        }
      }
      globalListeners.length = 0;
    }
    var stallTimer = null;
    var finishTimer = null;
    function disarmStall() {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
    }
    function armStall() {
      disarmStall();
      stallTimer = setTimeout(function() {
        if (finished || stale()) return;
        window.__DSH_STARTUP_STALLED__ = true;
        try {
          console.warn("[dsh-startup-screen] 时间线停滞超过 " + STALL_MS + "ms，强制揭幕");
        } catch (e) {
        }
        finish();
      }, STALL_MS);
    }
    function dispose() {
      finished = true;
      disarmStall();
      if (finishTimer) {
        clearTimeout(finishTimer);
        finishTimer = null;
      }
      dropListeners();
      try {
        chromeSync.show();
      } catch (e) {
      }
      try {
        restoreAppBackdrop();
      } catch (e) {
      }
      try {
        releaseAll();
      } catch (e) {
      }
      try {
        stopHex();
      } catch (e) {
      }
      if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
      }
      try {
        voice.stop();
      } catch (e) {
      }
      try {
        audio.close();
      } catch (e) {
      }
      try {
        document.documentElement.classList.remove("dsu-lock");
        document.documentElement.style.overflow = "";
        if (document.body) document.body.style.overflow = "";
      } catch (e) {
      }
      try {
        var r = document.getElementById(ROOT_ID);
        if (r && r.parentNode) r.parentNode.removeChild(r);
      } catch (e) {
      }
      try {
        window.__DSH_STARTUP_RUNNING__ = false;
        window.__DSH_STARTUP_FINISHED__ = false;
      } catch (e) {
      }
    }
    function injectSelf() {
      var prev = window.__DSH_STARTUP_API__;
      if (prev && typeof prev.dispose === "function" && prev.dispose !== noop) {
        try {
          prev.dispose();
        } catch (e) {
        }
      }
      window.__DSH_STARTUP_LOADED__ = false;
      var old = document.getElementById(ROOT_ID);
      if (old && old.parentNode) old.parentNode.removeChild(old);
      window.__DSH_STARTUP_SKIP__ = false;
      try {
        var stale2 = document.querySelectorAll("script[data-dsh-startup-runtime]");
        for (var i = 0; i < stale2.length; i++) {
          if (stale2[i] && stale2[i].parentNode) stale2[i].parentNode.removeChild(stale2[i]);
        }
      } catch (e) {
      }
      var s = document.createElement("script");
      try {
        s.setAttribute("data-dsh-startup-runtime", "1");
      } catch (e) {
      }
      if (window.__DSH_STARTUP_SCRIPT_URL__) {
        s.src = window.__DSH_STARTUP_SCRIPT_URL__;
      } else {
        s.src = ROUTES.splash + "?t=" + Date.now();
      }
      document.head.appendChild(s);
      return s;
    }
    if (window.__DSH_STARTUP_SKIP__ === true) {
      window.__DSH_STARTUP_API__ = {
        replay: injectSelf,
        skip: function() {
        },
        finish: function() {
        },
        dispose: noop,
        config: C
      };
      return;
    }
    setTimeout(function() {
      try {
        if (window.__DSH_STARTUP_RUNNING__ === true) return;
        var r = document.getElementById(ROOT_ID);
        if (r && r.parentNode) r.parentNode.removeChild(r);
        document.documentElement.classList.remove("dsu-lock");
        if (document.body) document.body.style.overflow = "";
        window.__DSH_STARTUP_FAILED__ = true;
      } catch (e) {
      }
    }, 9e3);
    var decoder = createDecoder(REDUCED);
    var typeIn = decoder.typeIn;
    var startDecode = decoder.startDecode;
    var stopDecode = decoder.stopDecode;
    var root = document.getElementById(ROOT_ID);
    if (!root) {
      root = el("div");
      root.id = ROOT_ID;
      root.className = "dsu-root";
      document.body.appendChild(root);
    }
    root.classList.toggle("dsu-dark", C.theme === "dark");
    var backdropOn = false;
    root.style.setProperty("--dsu-speed", String(C.speed));
    root.style.setProperty("--dsu-accent", C.accent);
    root.style.setProperty("--dsu-glitch-a", C.glitchA);
    root.style.setProperty("--dsu-glitch-b", C.glitchB);
    try {
      root.style.setProperty("--dsu-accent-glow", hexToRgba(C.accent, 0.42));
    } catch (e) {
    }
    try {
      root.style.setProperty("--dsu-accent-soft", hexToRgba(C.accent, 0.1));
    } catch (e) {
    }
    try {
      root.style.setProperty("--dsu-accent-strong", hexToRgba(C.accent, 0.72));
    } catch (e) {
    }
    var blurredNodes = [];
    function blurAppBackdrop(px) {
      try {
        if (!document.body || !document.body.children) return;
        for (var i = 0; i < document.body.children.length; i++) {
          var node = document.body.children[i];
          if (!node || !node.style || node.id === ROOT_ID) continue;
          blurredNodes.push({ node, filter: node.style.filter || "" });
          node.style.transition = "filter 420ms ease";
          node.style.filter = px > 0 ? "blur(" + px + "px)" : "";
        }
      } catch (e) {
      }
    }
    function restoreAppBackdrop() {
      for (var i = 0; i < blurredNodes.length; i++) {
        var it = blurredNodes[i];
        try {
          it.node.style.filter = it.filter;
          it.node.style.transition = "";
        } catch (e) {
        }
      }
      blurredNodes.length = 0;
    }
    if (C.glass) {
      var gAlpha = clamp01(C.glassOpacity, 0.15, 0.95);
      var gBlur = clamp01(C.glassBlur, 0, 60);
      var gSat = clamp01(C.glassSaturate, 100, 200);
      root.classList.add("dsu-glass");
      root.style.setProperty("--dsu-glass-alpha", String(gAlpha));
      root.style.setProperty("--dsu-glass-blur", gBlur + "px");
      root.style.setProperty("--dsu-glass-sat", gSat + "%");
      backdropOn = true;
      var backdropBlur = clamp01(C.glassBackdropBlur, 0, 80);
      root.style.setProperty("--dsu-backdrop-blur", backdropBlur + "px");
      if (backdropBlur > 0) {
        root.classList.add("dsu-glass-appblur");
        blurAppBackdrop(Math.min(60, backdropBlur));
      } else {
        root.classList.remove("dsu-glass-appblur");
      }
    } else {
      root.classList.remove("dsu-glass");
    }
    var ui = {};
    var clockTimer = null;
    var fieldHandle = null;
    var ambientHtml = ambientOn() ? '<div class="dsu-atmo"></div><canvas class="dsu-field" aria-hidden="true"></canvas><div class="dsu-beams"></div><div class="dsu-floor"></div><div class="dsu-sheen"></div>' : "";
    var ambientTail = ambientOn() ? '<div class="dsu-tear"></div>' : "";
    var html = ambientHtml + '<div class="dsu-plate"></div><div class="dsu-vignette"></div><div class="dsu-watermark"></div><div class="dsu-grain"></div><div class="dsu-black"><div class="dsu-black-inner"></div><div class="dsu-sweep"></div></div><div class="dsu-wash"></div><header class="dsu-brand"><div class="dsu-brand-1"></div><div class="dsu-brand-2"></div><div class="dsu-brand-3"><b></b><span></span></div></header><div class="dsu-stepcount">[ 00 / 06 ] INIT</div><div class="dsu-center"><div class="dsu-status"><span class="dsu-status-zh"></span><i class="dsu-caret"></i></div><div class="dsu-sub-en"></div><div class="dsu-rule"></div><div class="dsu-logo"></div><div class="dsu-dots" hidden></div></div><div class="dsu-idline"></div><div class="dsu-facts dsu-facts-1"></div><div class="dsu-facts dsu-facts-2"></div><div class="dsu-reticle"></div><div class="dsu-hex"></div><div class="dsu-trace"></div><div class="dsu-welcome"><div class="dsu-w1">WELCOME TO</div><div class="dsu-w2"></div><div class="dsu-w3"></div><div class="dsu-w4"></div></div><div class="dsu-action"><div class="dsu-card" hidden></div><button class="dsu-btn" type="button"><span class="dsu-btn-zh"></span><span class="dsu-btn-en"></span></button><div class="dsu-hint"></div></div><div class="dsu-frame"><i class="dsu-corner dsu-c-tl"></i><i class="dsu-corner dsu-c-tr"></i><i class="dsu-corner dsu-c-bl"></i><i class="dsu-corner dsu-c-br"></i><div class="dsu-scanline"></div></div><div class="dsu-slats"></div><div class="dsu-voice"><i></i><i></i><i></i><i></i><i></i></div><div class="dsu-meta"><span class="dsu-meta-1"></span><span class="dsu-meta-2"></span></div><div class="dsu-checks"></div><div class="dsu-skip">SKIP ▸</div><footer class="dsu-foot"><span></span><i></i></footer><div class="dsu-subtitle"><span class="dsu-sub-zh"></span><span class="dsu-sub-en2"></span></div><div class="dsu-progress"><i></i></div><div class="dsu-bloom"></div><div class="dsu-streak"></div><div class="dsu-flash"></div>' + ambientTail;
    root.innerHTML = html;
    if (backdropOn) {
      var backdropEl = el("div", "dsu-backdrop");
      root.insertBefore(backdropEl, root.firstChild);
    }
    function q(sel) {
      return root.querySelector(sel);
    }
    ui.plate = q(".dsu-plate");
    if (ambientOn()) {
      ui.atmo = q(".dsu-atmo");
      ui.field = q(".dsu-field");
      ui.beams = q(".dsu-beams");
      ui.floor = q(".dsu-floor");
      ui.sheen = q(".dsu-sheen");
      ui.tear = q(".dsu-tear");
    }
    ui.watermark = q(".dsu-watermark");
    ui.black = q(".dsu-black");
    ui.blackInner = q(".dsu-black-inner");
    ui.sweep = q(".dsu-sweep");
    ui.wash = q(".dsu-wash");
    ui.flash = q(".dsu-flash");
    ui.bloom = q(".dsu-bloom");
    ui.streak = q(".dsu-streak");
    ui.vignette = q(".dsu-vignette");
    ui.brand = q(".dsu-brand");
    ui.center = q(".dsu-center");
    ui.brand1 = q(".dsu-brand-1");
    ui.brand2 = q(".dsu-brand-2");
    ui.brand3b = q(".dsu-brand-3 b");
    ui.brand3s = q(".dsu-brand-3 span");
    ui.stepcount = q(".dsu-stepcount");
    ui.status = q(".dsu-status");
    ui.statusZh = q(".dsu-status-zh");
    ui.caret = q(".dsu-caret");
    ui.subEn = q(".dsu-sub-en");
    ui.rule = q(".dsu-rule");
    ui.logo = q(".dsu-logo");
    ui.dots = q(".dsu-dots");
    ui.idline = q(".dsu-idline");
    ui.reticle = q(".dsu-reticle");
    ui.hex = q(".dsu-hex");
    ui.welcome = q(".dsu-welcome");
    ui.w1 = q(".dsu-w1");
    ui.w2 = q(".dsu-w2");
    ui.w3 = q(".dsu-w3");
    ui.w4 = q(".dsu-w4");
    ui.action = q(".dsu-action");
    ui.card = q(".dsu-card");
    ui.btn = q(".dsu-btn");
    ui.btnZh = q(".dsu-btn-zh");
    ui.btnEn = q(".dsu-btn-en");
    ui.hint = q(".dsu-hint");
    ui.skip = q(".dsu-skip");
    ui.foot = q(".dsu-foot");
    ui.footText = q(".dsu-foot span");
    ui.subZh = q(".dsu-sub-zh");
    ui.subEn2 = q(".dsu-sub-en2");
    ui.progress = q(".dsu-progress");
    ui.bar = q(".dsu-progress i");
    ui.frame = q(".dsu-frame");
    ui.scanline = q(".dsu-scanline");
    ui.slats = q(".dsu-slats");
    ui.voice = q(".dsu-voice");
    ui.meta = q(".dsu-meta");
    ui.meta1 = q(".dsu-meta-1");
    ui.meta2 = q(".dsu-meta-2");
    ui.fact1 = q(".dsu-facts-1");
    ui.fact2 = q(".dsu-facts-2");
    ui.checks = q(".dsu-checks");
    ui.trace = q(".dsu-trace");
    ui.brand1.textContent = C.brand1;
    ui.brand2.textContent = C.brand2;
    ui.brand3b.textContent = C.brand3a;
    ui.brand3s.textContent = C.brand3b;
    ui.footText.textContent = C.footer;
    ui.w2.textContent = C.welcomeBox;
    ui.w4.textContent = "欢迎 " + C.identity + " 访问";
    ui.idline.textContent = "· ID CONFIRMED : " + C.identityId;
    (function blackStage() {
      var inner = ui.blackInner;
      var whale = createWhaleSvg("dsu-whale");
      inner.appendChild(whale);
      inner.appendChild(el("div", "dsu-black-zh", C.orgZh));
      var en = el("div", "dsu-black-en", C.orgEn);
      inner.appendChild(en);
      inner.appendChild(el("div", "dsu-black-sub", C.orgSub));
      ui.blackEn = en;
    })();
    (function logoStage() {
      ui.logo.appendChild(createWhaleSvg());
      ui.logo.appendChild(el("div", "dsu-logolabel", "D E E P S E E K"));
    })();
    (function welcomeLogo() {
      ui.w3.appendChild(createWhaleSvg());
      ui.w3.appendChild(el("span", "dsu-w3label", "D E E P S E E K  ·  H A R N E S S"));
    })();
    (function watermark() {
      var boxes = [
        [0.6, 0.02, 0.16, 0.96],
        [0.78, 0.02, 0.16, 0.96],
        [0.96, 0.02, 0.16, 0.96],
        [0.05, 0.02, 0.1, 0.5]
      ];
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        var depth = i < 1 ? " dsu-wm-far" : i < 3 ? " dsu-wm-mid" : " dsu-wm-near";
        var n = el("div", "dsu-wm" + depth);
        n.style.left = b[0] * 100 + "%";
        n.style.top = b[1] * 100 + "%";
        n.style.width = b[2] * 100 + "%";
        n.style.height = b[3] * 100 + "%";
        ui.watermark.appendChild(n);
      }
    })();
    (function slatsAndMeta() {
      for (var i = 0; i < STEPS.length + 1; i++) ui.slats.appendChild(el("i", "dsu-slat"));
      paintMeta();
      paintFacts();
      buildChecks();
      buildTrace();
      paintClock();
      clockTimer = setInterval(paintClock, 1e3);
    })();
    (function reticle() {
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 400 400");
      function arc(cx, cy, r, a0, a1, cls, cap) {
        var rad2 = function(d2) {
          return (d2 - 90) * Math.PI / 180;
        };
        var x0 = cx + r * Math.cos(rad2(a0)), y0 = cy + r * Math.sin(rad2(a0));
        var x1 = cx + r * Math.cos(rad2(a1)), y1 = cy + r * Math.sin(rad2(a1));
        var large = a1 - a0 > 180 ? 1 : 0;
        var p = document.createElementNS(ns, "path");
        p.setAttribute("d", "M" + x0.toFixed(2) + " " + y0.toFixed(2) + " A" + r + " " + r + " 0 " + large + " 1 " + x1.toFixed(2) + " " + y1.toFixed(2));
        p.setAttribute("class", cls);
        if (cap) p.setAttribute("stroke-linecap", cap);
        return { node: p, x: x1, y: y1, x0, y0 };
      }
      var gA = document.createElementNS(ns, "g");
      gA.setAttribute("class", "dsu-ret-rot-a");
      var a = arc(200, 200, 150, 215, 505, "dsu-ring-a", "round");
      gA.appendChild(a.node);
      var da = document.createElementNS(ns, "circle");
      da.setAttribute("class", "dsu-dot-a");
      da.setAttribute("cx", a.x.toFixed(2));
      da.setAttribute("cy", a.y.toFixed(2));
      da.setAttribute("r", "7");
      gA.appendChild(da);
      svg.appendChild(gA);
      var gB = document.createElementNS(ns, "g");
      gB.setAttribute("class", "dsu-ret-rot-b");
      var b = arc(200, 200, 104, 200, 490, "dsu-ring-b", "round");
      gB.appendChild(b.node);
      var db = document.createElementNS(ns, "circle");
      db.setAttribute("class", "dsu-dot-b");
      db.setAttribute("cx", b.x0.toFixed(2));
      db.setAttribute("cy", b.y0.toFixed(2));
      db.setAttribute("r", "4");
      gB.appendChild(db);
      svg.appendChild(gB);
      var gC = document.createElementNS(ns, "g");
      var bl = arc(200, 200, 62, 118, 242, "dsu-bracket", "round");
      var br = arc(200, 200, 62, 298, 62, "dsu-bracket", "round");
      gC.appendChild(bl.node);
      gC.appendChild(br.node);
      svg.appendChild(gC);
      var pts = [[152, 132], [252, 268], [278, 150]];
      for (var i = 0; i < pts.length; i++) {
        var c = document.createElementNS(ns, "circle");
        c.setAttribute("class", "dsu-dot-o");
        c.setAttribute("cx", pts[i][0]);
        c.setAttribute("cy", pts[i][1]);
        c.setAttribute("r", "2.8");
        svg.appendChild(c);
      }
      var gT = document.createElementNS(ns, "g");
      gT.setAttribute("class", "dsu-ret-ticks");
      var TICKS = 48;
      for (var t = 0; t < TICKS; t++) {
        var deg = t / TICKS * 360 - 90;
        var rad = deg * Math.PI / 180;
        var long = t % 4 === 0;
        var r0 = 133;
        var r1 = long ? 143 : 138;
        var line = document.createElementNS(ns, "line");
        line.setAttribute("class", "dsu-tick" + (long ? " dsu-tick-major" : ""));
        line.setAttribute("x1", (200 + r0 * Math.cos(rad)).toFixed(2));
        line.setAttribute("y1", (200 + r0 * Math.sin(rad)).toFixed(2));
        line.setAttribute("x2", (200 + r1 * Math.cos(rad)).toFixed(2));
        line.setAttribute("y2", (200 + r1 * Math.sin(rad)).toFixed(2));
        line.style.animationDelay = Math.round(t * 32) + "ms";
        gT.appendChild(line);
      }
      svg.appendChild(gT);
      var gD = document.createElementNS(ns, "g");
      gD.setAttribute("class", "dsu-ret-data");
      var DATA_TICKS = 40;
      var lit = Math.max(6, Math.min(DATA_TICKS, Number(FACTS.bundleCount) || 12));
      for (var d = 0; d < DATA_TICKS; d++) {
        var degD = d / DATA_TICKS * 360 - 90;
        var radD = degD * Math.PI / 180;
        var rD0 = 112;
        var rD1 = d < lit ? 120 : 116;
        var lineD = document.createElementNS(ns, "line");
        lineD.setAttribute("class", "dsu-tick-data" + (d < lit ? " dsu-lit" : ""));
        lineD.setAttribute("x1", (200 + rD0 * Math.cos(radD)).toFixed(2));
        lineD.setAttribute("y1", (200 + rD0 * Math.sin(radD)).toFixed(2));
        lineD.setAttribute("x2", (200 + rD1 * Math.cos(radD)).toFixed(2));
        lineD.setAttribute("y2", (200 + rD1 * Math.sin(radD)).toFixed(2));
        lineD.style.animationDelay = Math.round(d * 26) + "ms";
        gD.appendChild(lineD);
      }
      svg.appendChild(gD);
      var comet = document.createElementNS(ns, "circle");
      comet.setAttribute("class", "dsu-ret-comet");
      comet.setAttribute("cx", "200");
      comet.setAttribute("cy", "200");
      comet.setAttribute("r", "150");
      comet.setAttribute("pathLength", "100");
      comet.setAttribute("stroke-dasharray", "8 92");
      svg.appendChild(comet);
      var ping = document.createElementNS(ns, "circle");
      ping.setAttribute("class", "dsu-ping");
      ping.setAttribute("cx", "200");
      ping.setAttribute("cy", "200");
      ping.setAttribute("r", "150");
      svg.appendChild(ping);
      ui.reticle.appendChild(svg);
      ui.reticleScan = el("div", "dsu-ret-scan");
      ui.reticle.appendChild(ui.reticleScan);
    })();
    if (ambientOn()) startField();
    refreshFacts();
    var timers = [];
    var waiters = [];
    var skipped = false;
    var finished = false;
    var hexTimer = null;
    function ms(base) {
      return Math.round(base / C.speed);
    }
    function wait(base) {
      return new Promise(function(resolve) {
        if (skipped) return resolve();
        var done = false;
        function fin() {
          if (done) return;
          done = true;
          var i = waiters.indexOf(fin);
          if (i >= 0) waiters.splice(i, 1);
          resolve();
        }
        var t = setTimeout(fin, Math.max(0, ms(base)));
        timers.push(t);
        waiters.push(fin);
      });
    }
    function waitAction() {
      return new Promise(function(resolve) {
        if (skipped || !C.requireInteraction) return resolve();
        disarmStall();
        var done = false;
        function fin() {
          if (done) return;
          done = true;
          cleanup();
          armStall();
          resolve();
        }
        function onKey(e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            fin();
          }
        }
        function onClick(e) {
          e.preventDefault();
          fin();
        }
        function cleanup() {
          ui.btn.removeEventListener("click", onClick);
          ui.action.removeEventListener("click", onClick);
          document.removeEventListener("keydown", onKey);
          var i = waiters.indexOf(fin);
          if (i >= 0) waiters.splice(i, 1);
        }
        ui.btn.addEventListener("click", onClick);
        ui.action.addEventListener("click", onClick);
        document.addEventListener("keydown", onKey);
        waiters.push(fin);
      });
    }
    function releaseAll() {
      try {
        stopDecode();
      } catch (e) {
      }
      try {
        stopField();
      } catch (e) {
      }
      try {
        stopTrace();
      } catch (e) {
      }
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers.length = 0;
      var list = waiters.slice();
      waiters.length = 0;
      for (var j = 0; j < list.length; j++) {
        try {
          list[j]();
        } catch (err) {
        }
      }
    }
    function setProgress(p) {
      var pct = Math.max(0, Math.min(1, p));
      ui.bar.style.width = Math.round(pct * 100) + "%";
    }
    function setSlats(active) {
      var items = ui.slats.children;
      for (var i = 0; i < items.length; i++) {
        var idx = i + 1;
        items[i].classList.toggle("dsu-on", idx === active);
        items[i].classList.toggle("dsu-past", idx < active);
      }
    }
    function sweep() {
      if (!ui.scanline) return;
      ui.scanline.classList.remove("dsu-go");
      void ui.scanline.offsetWidth;
      ui.scanline.classList.add("dsu-go");
    }
    function paintClock() {
      var d = /* @__PURE__ */ new Date();
      var pad = function(n) {
        return (n < 10 ? "0" : "") + n;
      };
      ui.meta2.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }
    function setSubtitle(zh, en) {
      ui.subZh.classList.remove("dsu-in");
      ui.subEn2.classList.remove("dsu-in");
      setTimeout(function() {
        ui.subZh.textContent = zh || "";
        ui.subEn2.textContent = en || "";
        ui.subZh.classList.add("dsu-in");
        if (en) ui.subEn2.classList.add("dsu-in");
      }, ms(140));
    }
    function setStepCount(i, code) {
      var totalSteps = STEPS.length + 1;
      ui.stepcount.textContent = "[ " + String(i).padStart(2, "0") + " / " + String(totalSteps).padStart(2, "0") + " ] " + code;
    }
    function startHex() {
      var lines = 12;
      function line() {
        var s = "";
        for (var i = 0; i < 26; i++) {
          s += "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
          if (i % 2 === 1) s += " ";
        }
        return s;
      }
      function paint() {
        var out = [];
        for (var i = 0; i < lines; i++) out.push(line());
        ui.hex.innerHTML = out.join("<br>");
      }
      paint();
      ui.hex.classList.add("dsu-in");
      audio.tickRun();
      hexTimer = setInterval(paint, 110);
    }
    function stopHex() {
      if (hexTimer) {
        clearInterval(hexTimer);
        hexTimer = null;
      }
      ui.hex.classList.remove("dsu-in");
    }
    function stopField() {
      if (!fieldHandle) return;
      try {
        fieldHandle.stop();
      } catch (e) {
      }
      fieldHandle = null;
      try {
        window.__DSH_STARTUP_FIELD__ = null;
      } catch (e) {
      }
    }
    function startField() {
      if (!ambientOn() || fieldHandle) return;
      var cv = ui.field;
      if (!cv || typeof cv.getContext !== "function") return;
      var ctx = null;
      try {
        ctx = cv.getContext("2d");
      } catch (e) {
        return;
      }
      if (!ctx) return;
      var dpr = Math.min(1.75, Math.max(1, Number(window.devicePixelRatio) || 1));
      var limit = 150;
      var W = 0;
      var H = 0;
      var raf = 0;
      var frames = 0;
      var startedAt = Date.now();
      function fieldNow() {
        return Math.max(0, Date.now() - startedAt);
      }
      var palette = C.theme === "dark" ? { cool: "111,211,232", warm: "255,177,102", dim: "224,241,246" } : { cool: "38,108,122", warm: "164,91,38", dim: "48,64,66" };
      var state = 2166136261;
      var seed = String(FACTS.hash || "DSHBOOT") + "|" + String(FACTS.profile || "") + "|" + String(FACTS.bundleCount || "");
      for (var k = 0; k < seed.length; k++) {
        state ^= seed.charCodeAt(k);
        state = Math.imul(state, 16777619) >>> 0;
      }
      function rand() {
        state = Math.imul(state, 1664525) + 1013904223 >>> 0;
        return state / 4294967296;
      }
      var motes = [];
      var ribbons = [];
      var columns = [];
      function resize() {
        W = Math.max(1, Number(cv.clientWidth) || Number(root.clientWidth) || Number(window.innerWidth) || 1600);
        H = Math.max(1, Number(cv.clientHeight) || Number(root.clientHeight) || Number(window.innerHeight) || 1020);
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        if (cv.style) {
          cv.style.width = "100%";
          cv.style.height = "100%";
        }
        if (typeof ctx.setTransform === "function") ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        spawn();
      }
      function spawn() {
        motes.length = 0;
        ribbons.length = 0;
        columns.length = 0;
        var count = Math.round(Math.min(limit, Math.max(74, W * H / 13500)));
        for (var i = 0; i < count; i++) {
          motes.push({
            x: rand() * W,
            y: rand() * H,
            z: 0.24 + rand() * 0.76,
            r: 0.35 + rand() * 1.35,
            ax: 10 + rand() * 54,
            ay: 7 + rand() * 38,
            sp: 25e-6 + rand() * 75e-6,
            ph: rand() * Math.PI * 2,
            tw: 28e-5 + rand() * 66e-5,
            warm: rand() < 0.24
          });
        }
        for (var r = 0; r < 4; r++) {
          ribbons.push({
            y: 0.2 + r * 0.18 + rand() * 0.055,
            amp: 0.028 + rand() * 0.042,
            sp: 22e-6 + rand() * 26e-6,
            ph: rand() * Math.PI * 2,
            wide: 5 + rand() * 8,
            warm: r === 1
          });
        }
        for (var c = 0; c < 12; c++) {
          columns.push({
            side: c % 2,
            x: c < 6 ? 0.025 + rand() * 0.12 : 0.855 + rand() * 0.12,
            y: rand(),
            len: 24 + rand() * 86,
            sp: 6e-6 + rand() * 12e-6
          });
        }
      }
      function drawRibbon(r, now) {
        var drift = now * r.sp;
        var x0 = -W * 0.12;
        var x1 = W * 1.12;
        var y0 = H * (r.y + Math.sin(drift + r.ph) * r.amp);
        var y1 = H * (r.y + Math.cos(drift * 0.82 + r.ph) * r.amp * 1.25);
        var c1 = H * (r.y + Math.sin(drift * 0.64 + r.ph) * r.amp * 2.1);
        var c2 = H * (r.y + Math.cos(drift * 0.57 + r.ph * 1.4) * r.amp * 2.4);
        var rgb = r.warm ? palette.warm : palette.cool;
        var grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "rgba(" + rgb + ",0)");
        grad.addColorStop(0.22, "rgba(" + rgb + "," + (C.theme === "dark" ? 0.055 : 0.045) + ")");
        grad.addColorStop(0.5, "rgba(" + rgb + "," + (C.theme === "dark" ? 0.14 : 0.085) + ")");
        grad.addColorStop(0.78, "rgba(" + rgb + "," + (C.theme === "dark" ? 0.05 : 0.04) + ")");
        grad.addColorStop(1, "rgba(" + rgb + ",0)");
        ctx.strokeStyle = grad;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(W * 0.28, c1, W * 0.7, c2, x1, y1);
        ctx.lineWidth = r.wide;
        ctx.globalAlpha = 0.16;
        ctx.stroke();
        ctx.lineWidth = 0.75;
        ctx.globalAlpha = 0.72;
        ctx.stroke();
        var u = ((now * 34e-6 + r.ph / (Math.PI * 2)) % 1 + 1) % 1;
        var v = 1 - u;
        var px = v * v * v * x0 + 3 * v * v * u * (W * 0.28) + 3 * v * u * u * (W * 0.7) + u * u * u * x1;
        var py = v * v * v * y0 + 3 * v * v * u * c1 + 3 * v * u * u * c2 + u * u * u * y1;
        var cdx = (px / W - 0.5) * 2;
        var cdy = (py / H - 0.45) * 2;
        var cometFade = Math.min(1, Math.max(0.16, Math.sqrt(cdx * cdx + cdy * cdy) * 1.4));
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + rgb + "," + (0.11 * cometFade).toFixed(3) + ")";
        ctx.arc(px, py, r.wide * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + rgb + "," + (0.72 * cometFade).toFixed(3) + ")";
        ctx.arc(px, py, r.warm ? 1.25 : 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      function draw(now, still) {
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = C.theme === "dark" ? "lighter" : "source-over";
        var sx = now * 0.012 % (W + 260) - 130;
        var sweep2 = ctx.createLinearGradient(sx - 150, 0, sx + 150, 0);
        sweep2.addColorStop(0, "rgba(" + palette.cool + ",0)");
        sweep2.addColorStop(0.5, "rgba(" + palette.cool + "," + (C.theme === "dark" ? 0.028 : 0.018) + ")");
        sweep2.addColorStop(1, "rgba(" + palette.cool + ",0)");
        ctx.fillStyle = sweep2;
        ctx.fillRect(sx - 150, 0, 300, H);
        for (var r = 0; r < ribbons.length; r++) drawRibbon(ribbons[r], now);
        for (var w = 0; w < 3; w++) {
          ctx.beginPath();
          for (var x = 0; x <= W; x += 26) {
            var wy = H * (0.745 + w * 0.052) + Math.sin(x * 62e-4 + now * 22e-5 + w * 1.7) * (3 + w * 1.4) + Math.sin(x * 0.013 - now * 14e-5 + w) * 1.6;
            if (x === 0) ctx.moveTo(x, wy);
            else ctx.lineTo(x, wy);
          }
          ctx.strokeStyle = "rgba(" + (w === 1 ? palette.warm : palette.cool) + "," + (C.theme === "dark" ? 0.05 : 0.032) + ")";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        for (var c = 0; c < columns.length; c++) {
          var col = columns[c];
          var cy = (col.y + now * col.sp) % 1.2 * H - col.len;
          ctx.fillStyle = "rgba(" + palette.dim + "," + (C.theme === "dark" ? 0.035 : 0.022) + ")";
          ctx.fillRect(Math.round(col.x * W), cy, 1, col.len);
        }
        for (var m = 0; m < motes.length; m++) {
          var dot = motes[m];
          var mx = dot.x + Math.sin(now * dot.sp + dot.ph) * dot.ax;
          var my = dot.y + Math.cos(now * dot.sp * 0.83 + dot.ph) * dot.ay;
          if (still) {
            mx = dot.x;
            my = dot.y;
          }
          var nx = (mx / W - 0.5) * 2;
          var ny = (my / H - 0.45) * 2;
          var dist = Math.sqrt(nx * nx * 1.18 + ny * ny);
          var centerFade = Math.min(1, Math.max(0.18, dist * 1.32));
          var twinkle = 0.62 + 0.38 * Math.sin(now * dot.tw + dot.ph);
          var alpha = (0.045 + dot.z * 0.16) * centerFade * twinkle;
          var rgbDot = dot.warm ? palette.warm : palette.cool;
          ctx.beginPath();
          ctx.fillStyle = "rgba(" + rgbDot + "," + alpha.toFixed(3) + ")";
          ctx.arc(mx, my, dot.r * dot.z, 0, Math.PI * 2);
          ctx.fill();
          if (dot.r > 1.15) {
            ctx.beginPath();
            ctx.fillStyle = "rgba(" + rgbDot + "," + (alpha * 0.12).toFixed(3) + ")";
            ctx.arc(mx, my, dot.r * 4.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      function frame() {
        if (!fieldHandle) return;
        draw(fieldNow(), false);
        frames++;
        fieldHandle.frames = frames;
        raf = window.requestAnimationFrame(frame);
      }
      function onResize() {
        resize();
        draw(fieldNow(), true);
      }
      function onVisibility() {
        if (document.hidden) {
          if (raf) {
            window.cancelAnimationFrame(raf);
            raf = 0;
          }
        } else if (!REDUCED && !raf) {
          raf = window.requestAnimationFrame(frame);
        }
      }
      fieldHandle = {
        frames: 0,
        width: function() {
          return W;
        },
        height: function() {
          return H;
        },
        draw: function(ms2, still) {
          draw(ms2 || 0, !!still);
        },
        stop: function() {
          if (raf) {
            window.cancelAnimationFrame(raf);
            raf = 0;
          }
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
        }
      };
      try {
        window.__DSH_STARTUP_FIELD__ = fieldHandle;
      } catch (e) {
      }
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibility);
      resize();
      draw(0, true);
      if (!REDUCED) raf = window.requestAnimationFrame(frame);
    }
    function clamp01(v, lo, hi) {
      var n = Number(v);
      return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
    }
    var audio = /* @__PURE__ */ (function() {
      var ctx = null;
      var closed = false;
      function ac(force) {
        if (closed) return null;
        if (!C.sound && !force) return null;
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          if (!ctx) ctx = new AC();
          if (ctx.state === "suspended" && typeof ctx.resume === "function") ctx.resume();
          return ctx;
        } catch (e) {
          return null;
        }
      }
      function vol(gain) {
        return Math.max(2e-4, (gain == null ? 0.05 : gain) * clamp01(C.soundVolume, 0, 1) * 2);
      }
      function tone(freq, dur, type, gain, delay, glideTo) {
        var c = ac();
        if (!c) return;
        try {
          var t0 = c.currentTime + (delay || 0);
          var o = c.createOscillator(), g = c.createGain();
          o.type = type || "sine";
          o.frequency.setValueAtTime(freq, t0);
          if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
          g.gain.setValueAtTime(1e-4, t0);
          g.gain.exponentialRampToValueAtTime(vol(gain), t0 + Math.min(0.02, dur * 0.3));
          g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
          o.connect(g);
          g.connect(c.destination);
          o.start(t0);
          o.stop(t0 + dur + 0.03);
        } catch (e) {
        }
      }
      function noise(dur, gain) {
        var c = ac();
        if (!c) return;
        try {
          var n = Math.floor(c.sampleRate * dur);
          var buf = c.createBuffer(1, n, c.sampleRate);
          var d = buf.getChannelData(0);
          for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
          var src = c.createBufferSource();
          src.buffer = buf;
          var f = c.createBiquadFilter();
          f.type = "bandpass";
          f.frequency.value = 1500;
          f.Q.value = 0.6;
          var g = c.createGain();
          g.gain.value = vol(gain);
          src.connect(f);
          f.connect(g);
          g.connect(c.destination);
          src.start();
        } catch (e) {
        }
      }
      var buffers = {};
      var fetching = {};
      function loadAsset(name) {
        if (C.sfx === "synth") return;
        if (buffers[name] || fetching[name]) return;
        fetching[name] = true;
        try {
          fetch(ROUTES.asset + "/" + name + ".mp3").then(function(r) {
            return r.ok ? r.arrayBuffer() : null;
          }).then(function(ab) {
            return ab ? ac().decodeAudioData(ab) : null;
          }).then(function(buf) {
            if (buf) buffers[name] = buf;
          }).catch(function() {
          });
        } catch (e) {
        }
      }
      var pending = {};
      function ensureAsset(name) {
        if (buffers[name]) return Promise.resolve(true);
        if (pending[name]) return pending[name];
        if (C.voiceSource === "tts") return Promise.resolve(false);
        pending[name] = new Promise(function(resolve) {
          try {
            fetch(ROUTES.asset + "/" + name + ".mp3").then(function(r) {
              return r.ok ? r.arrayBuffer() : null;
            }).then(function(ab) {
              if (!ab) return null;
              return ac(true).decodeAudioData(ab);
            }).then(function(buf) {
              if (buf) {
                buffers[name] = buf;
                resolve(true);
              } else {
                resolve(false);
              }
            }).catch(function() {
              resolve(false);
            });
          } catch (e) {
            resolve(false);
          }
        });
        return pending[name];
      }
      function playAssetAndWait(name, gain) {
        return new Promise(function(resolve) {
          var c = ac(true);
          var buf = buffers[name];
          if (!c || !buf) {
            resolve(0);
            return;
          }
          var done = false;
          function fin(ms2) {
            if (done) return;
            done = true;
            resolve(ms2);
          }
          try {
            var src = c.createBufferSource();
            src.buffer = buf;
            var g = c.createGain();
            g.gain.value = Math.min(1, (gain == null ? 0.85 : gain) * clamp01(C.voiceVolume, 0, 1) * 1.6);
            src.connect(g);
            g.connect(c.destination);
            src.onended = function() {
              fin(Math.round(buf.duration * 1e3));
            };
            src.start();
            setTimeout(function() {
              fin(Math.round(buf.duration * 1e3));
            }, buf.duration * 1e3 + 1500);
          } catch (e) {
            fin(0);
          }
        });
      }
      function playAsset(name, gain) {
        var c = ac();
        if (!c) return false;
        var buf = buffers[name];
        if (!buf) {
          loadAsset(name);
          return false;
        }
        try {
          var src = c.createBufferSource();
          src.buffer = buf;
          var g = c.createGain();
          g.gain.value = Math.min(1, (gain == null ? 0.55 : gain) * clamp01(C.soundVolume, 0, 1) * 2);
          src.connect(g);
          g.connect(c.destination);
          src.start();
          return true;
        } catch (e) {
          return false;
        }
      }
      function close() {
        closed = true;
        try {
          if (ctx && typeof ctx.close === "function") ctx.close();
        } catch (e) {
        }
        ctx = null;
      }
      return {
        close,
        resume: function() {
          ac();
          loadAsset("sfx-tick");
          loadAsset("sfx-ticks-run");
        },
        preload: function() {
          loadAsset("sfx-tick");
          loadAsset("sfx-ticks-run");
        },
        ensureAsset,
        playAssetAndWait,
        /* 文字渐显 / 阶段推进 / 按钮确认 —— 优先用真素材 */
        tick: function() {
          if (!playAsset("sfx-tick", 0.45)) tone(1760, 0.035, "square", 0.022);
        },
        confirm: function() {
          if (!playAsset("sfx-tick", 0.85)) {
            tone(660, 0.09, "triangle", 0.07);
            tone(990, 0.17, "triangle", 0.055, 0.085);
          }
        },
        tickRun: function() {
          playAsset("sfx-ticks-run", 0.5);
        },
        step: function() {
          if (!playAsset("sfx-tick", 0.6)) {
            tone(880, 0.05, "sine", 0.05);
            tone(1320, 0.07, "sine", 0.028, 0.045);
          }
        },
        hover: function() {
          tone(2200, 0.02, "sine", 0.018);
        },
        sweep: function() {
          noise(0.75, 0.035);
        },
        /* 念台词之前的两声轻提示：让系统播报有开场感，而不是直接念字 */
        cue: function() {
          tone(1046.5, 0.05, "sine", 0.028);
          tone(1568, 0.06, "sine", 0.02, 0.075);
        },
        rise: function() {
          tone(220, 1.1, "sine", 0.032, 0, 990);
        },
        chime: function() {
          tone(659.25, 0.9, "sine", 0.055);
          tone(830.61, 0.9, "sine", 0.04, 0.09);
          tone(987.77, 1.3, "sine", 0.045, 0.18);
        }
      };
    })();
    var voice = (function() {
      var supported = typeof window !== "undefined" && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === "function";
      var voices = [];
      var picked = { en: null, zh: null };
      var meter = null;
      var saidOnce = false;
      var pending = { en: "", zh: "" };
      var NATURAL_HINTS = ["natural", "neural", "online", "premium", "enhanced", "siri", "google"];
      var FEMALE_HINTS = [
        "aria",
        "jenny",
        "michelle",
        "emma",
        "ava",
        "libby",
        "sonia",
        "maisie",
        "zira",
        "samantha",
        "karen",
        "moira",
        "tessa",
        "victoria",
        "serena",
        "allison",
        "susan",
        "fiona",
        "hazel",
        "female",
        "woman",
        "xiaoxiao",
        "xiaoyi",
        "xiaomo",
        "huihui",
        "yaoyao",
        "晓晓",
        "晓伊",
        "女声"
      ];
      var MALE_HINTS = [
        "david",
        "mark",
        "guy",
        "ryan",
        "george",
        "daniel",
        "alex",
        "fred",
        "male",
        "yunxi",
        "yunjian",
        "kangkang"
      ];
      function score(v, want) {
        var name = String(v.name || "").toLowerCase();
        var lang = String(v.lang || "").toLowerCase();
        var sc = 0;
        for (var i = 0; i < NATURAL_HINTS.length; i++) {
          if (name.indexOf(NATURAL_HINTS[i]) !== -1) {
            sc += 60;
            break;
          }
        }
        for (var j = 0; j < FEMALE_HINTS.length; j++) {
          if (name.indexOf(FEMALE_HINTS[j]) !== -1) {
            sc += 40;
            break;
          }
        }
        for (var k = 0; k < MALE_HINTS.length; k++) {
          if (name.indexOf(MALE_HINTS[k]) !== -1) {
            sc -= 45;
            break;
          }
        }
        if (lang.indexOf(want) === 0) sc += 25;
        if (v.localService) sc += 4;
        if (v.default) sc += 3;
        return sc;
      }
      function bestFor(want) {
        if (!voices.length) return null;
        if (C.voiceName) {
          for (var i = 0; i < voices.length; i++) {
            var v = voices[i];
            if (v.name === C.voiceName && String(v.lang || "").toLowerCase().indexOf(want) === 0) return v;
          }
        }
        var pool = [];
        for (var j = 0; j < voices.length; j++) {
          if (String(voices[j].lang || "").toLowerCase().indexOf(want) === 0) pool.push(voices[j]);
        }
        if (!pool.length) pool = voices.slice();
        var best = null;
        var bs = -1e9;
        for (var n = 0; n < pool.length; n++) {
          var sc = score(pool[n], want);
          if (sc > bs) {
            bs = sc;
            best = pool[n];
          }
        }
        return best;
      }
      function setMeter(on) {
        if (meter) meter.classList.toggle("dsu-on", !!on);
      }
      function load() {
        if (!supported) return;
        try {
          voices = window.speechSynthesis.getVoices() || [];
        } catch (e) {
          voices = [];
        }
        picked.en = bestFor("en");
        picked.zh = bestFor("zh");
      }
      function spokenName(name) {
        return String(name || "").replace(/\S+/g, function(w) {
          return /^[A-Z0-9.\-]+$/.test(w) && w.length > 1 ? w.charAt(0) + w.slice(1).toLowerCase() : w;
        });
      }
      function utter(text, lang) {
        try {
          var u = new window.SpeechSynthesisUtterance(text);
          var v = lang.indexOf("zh") === 0 ? picked.zh : picked.en;
          if (v) {
            u.voice = v;
            u.lang = v.lang || lang;
          } else u.lang = lang;
          u.rate = clamp01(C.voiceRate, 0.5, 2);
          u.pitch = clamp01(C.voicePitch, 0, 2);
          u.volume = clamp01(C.voiceVolume, 0, 1);
          u.onstart = function() {
            setMeter(true);
          };
          u.onend = function() {
            setMeter(false);
          };
          u.onerror = function() {
            setMeter(false);
          };
          window.speechSynthesis.speak(u);
          return true;
        } catch (e) {
          return false;
        }
      }
      function estimateMs(items) {
        var chars = 0;
        var rate = clamp01(C.voiceRate, 0.5, 2) || 1;
        for (var i = 0; i < items.length; i++) {
          var t = String(items[i].t || "");
          chars += /[\u4e00-\u9fa5]/.test(t) ? t.length * 1.7 : t.length;
        }
        return Math.round(chars / 13 * 1e3 / rate) + 460;
      }
      function buildUtter(text, lang) {
        var u = new window.SpeechSynthesisUtterance(text);
        var v = lang.indexOf("zh") === 0 ? picked.zh : picked.en;
        if (v) {
          u.voice = v;
          u.lang = v.lang || lang;
        } else u.lang = lang;
        u.rate = clamp01(C.voiceRate, 0.5, 2);
        u.pitch = clamp01(C.voicePitch, 0, 2);
        u.volume = clamp01(C.voiceVolume, 0, 1);
        return u;
      }
      return {
        supported,
        load,
        attach: function(node) {
          meter = node;
        },
        /**
         * 念一行，返回这一行实际花了多久的 Promise。
         * 不打断上一句：系统语音本身是队列，硬取消会把没念完的话掐断。
         * 提示音响过之后留 voiceLead 的空白再开口；等播报结束再 resolve，
         * 个别引擎不触发结束事件时按估算兜底，绝不把动画卡死。
         */
        line: function(en, zh, asset) {
          if (asset && C.voice && C.voiceSource !== "tts" && !finished) {
            return audio.ensureAsset(asset).then(function(ok) {
              if (!ok || finished) return 0;
              if (C.voiceCue !== false) audio.cue();
              return audio.playAssetAndWait(asset, 0.85).then(function(ms2) {
                if (ms2 > 0) setMeter(true);
                return ms2;
              });
            }).then(function(ms2) {
              if (ms2 > 0) {
                saidOnce = true;
                return ms2;
              }
              return ttsLine(en, zh);
            });
          }
          return ttsLine(en, zh);
        },
        /** 系统语音路径：素材缺失、指定用系统语音，或终幕那条动态名字 */
        tts: function(en, zh) {
          return ttsLine(en, zh);
        },
        /** 不等待的版本：设置页试听 / 任何"念完就行"的场合 */
        say: function(en, zh) {
          return this.line(en, zh);
        },
        /** 浏览器要求"先有用户手势"才放声：第一次点击/按键解锁 + 补播当前行 */
        unlock: function() {
          try {
            if (supported) window.speechSynthesis.resume();
          } catch (e) {
          }
          audio.resume();
          if (supported && !saidOnce) {
            try {
              var w = new window.SpeechSynthesisUtterance(" ");
              w.volume = 0;
              var v = picked.en || picked.zh;
              if (v) {
                w.voice = v;
                w.lang = v.lang;
              }
              window.speechSynthesis.speak(w);
            } catch (e) {
            }
          }
          if (!saidOnce && C.voice && (pending.en || pending.zh)) this.say(pending.en, pending.zh);
        },
        speakName: spokenName,
        current: function() {
          var a = picked.en ? picked.en.name : "";
          var b = picked.zh ? picked.zh.name : "";
          return a === b ? a : a + (b ? "  /  " + b : "");
        },
        listVoices: function() {
          return voices.slice();
        },
        /** 只有这里才真的掐断语音（跳过 / 揭幕） */
        stop: function() {
          try {
            if (supported) window.speechSynthesis.cancel();
          } catch (e) {
          }
          setMeter(false);
        }
      };
      function ttsLine(en, zh) {
        return new Promise(function(resolve) {
          if (!supported || !C.voice || finished) {
            resolve(0);
            return;
          }
          pending = { en: en || "", zh: zh || "" };
          var items = [];
          var mode = C.voiceLang;
          if (mode === "zh") {
            if (zh) items.push({ t: zh, l: "zh-CN" });
          } else if (mode === "both") {
            if (zh) items.push({ t: zh, l: "zh-CN" });
            if (en) items.push({ t: en, l: "en-US" });
          } else if (en) {
            items.push({ t: en, l: "en-US" });
          }
          if (!items.length) {
            resolve(0);
            return;
          }
          saidOnce = true;
          if (C.voiceCue !== false) audio.cue();
          var startedAt = Date.now();
          var est = estimateMs(items);
          var lead = clamp01(C.voiceLead, 0, 1200);
          var settled = false;
          var watchdog = null;
          function settle() {
            if (settled) return;
            settled = true;
            if (watchdog) clearTimeout(watchdog);
            setMeter(false);
            resolve(Math.max(0, Date.now() - startedAt));
          }
          setTimeout(function() {
            if (finished) {
              settle();
              return;
            }
            var last = items.length - 1;
            for (var i = 0; i <= last; i++) {
              var u = buildUtter(items[i].t, items[i].l);
              if (i === last) {
                u.onstart = function() {
                  setMeter(true);
                };
                u.onend = settle;
                u.onerror = settle;
              }
              try {
                window.speechSynthesis.speak(u);
              } catch (e) {
                if (i === last) settle();
              }
            }
            watchdog = setTimeout(settle, est + 900);
          }, lead);
        });
      }
    })();
    voice.attach(q(".dsu-voice"));
    (function preloadVoices() {
      if (C.voiceSource === "tts") return;
      for (var i = 0; i < STEPS.length; i++) if (STEPS[i].audio) audio.ensureAsset(STEPS[i].audio);
      audio.ensureAsset("line-6");
    })();
    (function wireSound() {
      voice.load();
      if (voice.supported && typeof window.speechSynthesis.addEventListener === "function") {
        try {
          listen(window.speechSynthesis, "voiceschanged", function() {
            voice.load();
          });
        } catch (e) {
        }
      }
      var unlocked = false;
      function unlock() {
        if (unlocked) return;
        unlocked = true;
        voice.unlock();
        document.removeEventListener("pointerdown", unlock, true);
        document.removeEventListener("keydown", unlock, true);
        document.removeEventListener("touchstart", unlock, true);
      }
      listen(document, "pointerdown", unlock, true);
      listen(document, "keydown", unlock, true);
      listen(document, "touchstart", unlock, true);
    })();
    function run() {
      window.__DSH_STARTUP_RUNNING__ = true;
      armStall();
      chromeSync.hide();
      return Promise.resolve().then(function() {
        return wait(820);
      }).then(function() {
        ui.blackInner.classList.add("dsu-in");
        audio.rise();
        return wait(240);
      }).then(function() {
        ui.blackEn.classList.add("dsu-tighten");
        return wait(880);
      }).then(function() {
        ui.sweep.classList.add("dsu-go");
        return wait(760);
      }).then(function() {
        ui.blackInner.classList.add("dsu-out");
        audio.sweep();
        ui.wash.style.transition = "opacity " + ms(220) + "ms linear";
        ui.wash.style.opacity = "1";
        return wait(260);
      }).then(function() {
        ui.plate.style.transition = "opacity " + ms(900) + "ms ease, transform 3.4s cubic-bezier(0.16, 0.84, 0.24, 1)";
        ui.plate.style.opacity = "1";
        if (C.glass) {
          setTimeout(function() {
            try {
              root.classList.add("dsu-glass-live");
              root.style.background = "transparent";
            } catch (e) {
            }
          }, ms(900) + 60);
        }
        ui.watermark.style.transition = "opacity " + ms(1100) + "ms ease, transform 4.6s cubic-bezier(0.16, 0.84, 0.24, 1)";
        ui.watermark.style.opacity = "1";
        ui.wash.style.transition = "opacity " + ms(720) + "ms cubic-bezier(.2,.9,.2,1)";
        ui.wash.style.opacity = "0";
        ui.black.style.transition = "opacity " + ms(720) + "ms ease";
        ui.black.style.opacity = "0";
        if (ambientOn() && ui.sheen) ui.sheen.classList.add("dsu-go");
        return wait(760);
      }).then(function() {
        ui.brand.classList.add("dsu-in");
        ui.foot.classList.add("dsu-in");
        ui.stepcount.classList.add("dsu-in");
        ui.idline.classList.add("dsu-in");
        ui.frame.classList.add("dsu-in");
        ui.slats.classList.add("dsu-in");
        ui.meta.classList.add("dsu-in");
        ui.vignette.classList.add("dsu-in");
        ui.voice.classList.add("dsu-in");
        ui.fact1.classList.add("dsu-in");
        ui.fact2.classList.add("dsu-in");
        ui.checks.classList.add("dsu-in");
        ui.trace.classList.add("dsu-in");
        if (ambientOn()) {
          ui.atmo.classList.add("dsu-in");
          ui.beams.classList.add("dsu-in");
          ui.floor.classList.add("dsu-in");
          ui.field.classList.add("dsu-in");
          root.classList.add("dsu-cam");
        }
        setProgress(0.12);
        setStepCount(0, "BOOT");
        setSlats(0);
        setSubtitle("系统自检中…", "SYSTEM SELF-CHECK");
        if (C.allowSkip) ui.skip.classList.add("dsu-in");
        return wait(700);
      }).then(function() {
        ui.black.style.display = "none";
        sweep();
      }).then(function() {
        return stepLoop();
      }).then(function() {
        return finale();
      }).catch(function(err) {
        try {
          console.warn("[dsh-startup-screen] 动画异常，直接揭幕：", err);
        } catch (e2) {
        }
        return finish();
      });
    }
    function stepLoop() {
      var chain = Promise.resolve();
      STEPS.forEach(function(step, i) {
        chain = chain.then(function() {
          if (finished || stale()) return;
          armStall();
          var n = i + 1;
          if (i >= 2) ui.idline.classList.remove("dsu-in");
          setStepCount(n, step.badge);
          setSlats(n);
          setChecks(n);
          setProgress(step.progress);
          setSubtitle(step.log, step.logEn);
          audio.step();
          var spoke = voice.line(step.say, step.zh, step.audio);
          ui.status.classList.toggle("dsu-zhline", true);
          ui.status.classList.remove("dsu-in");
          ui.subEn.classList.remove("dsu-in");
          void ui.status.offsetWidth;
          var slots = typeIn(ui.statusZh, step.zh, 46, "decode");
          slots = slots.concat(typeIn(ui.subEn, step.en, 13, "decode"));
          startDecode(slots);
          ui.caret.classList.toggle("dsu-on", !!step.action && step.action !== "auto");
          requestAnimationFrame(function() {
            if (finished) return;
            ui.status.classList.add("dsu-in");
            ui.subEn.classList.add("dsu-in");
          });
          ui.rule.classList.add("dsu-in");
          ui.status.classList.toggle("dsu-shield", !!step.reticle);
          ui.subEn.classList.toggle("dsu-shield", !!step.reticle);
          if (step.assembleLogo) assembleLogo();
          if (step.reticle) {
            ui.logo.classList.remove("dsu-in");
            ui.dots.hidden = true;
            ui.reticle.classList.add("dsu-in");
            ui.reticle.classList.add("dsu-lock");
            sweep();
          } else {
            ui.reticle.classList.remove("dsu-lock");
          }
          if (step.hex) startHex();
          function holdFor(spoken) {
            var target = Math.max(ms(step.hold), (spoken || 0) + ms(240));
            return wait(Math.max(0, target - (spoken || 0)));
          }
          if (step.action === "grant" || step.action === "confirm") {
            showAction(step);
            return wait(520).then(function() {
              return waitAction();
            }).then(function() {
              hideAction();
              audio.confirm();
              ui.caret.classList.remove("dsu-on");
              return spoke;
            }).then(function() {
              return wait(ms(320));
            });
          }
          if (step.hex) {
            return spoke.then(holdFor).then(function() {
              stopHex();
            });
          }
          return spoke.then(holdFor);
        });
      });
      return chain;
    }
    function assembleLogo() {
      ui.logo.classList.add("dsu-in");
      ui.dots.hidden = false;
      var path = ui.logo.querySelector("path");
      if (path && typeof path.getTotalLength === "function") {
        try {
          var len = path.getTotalLength();
          path.style.fill = "none";
          path.style.stroke = "currentColor";
          path.style.strokeWidth = "1.1";
          path.style.strokeDasharray = len;
          path.style.strokeDashoffset = len;
          path.animate(
            [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
            { duration: ms(1400), easing: "cubic-bezier(.55,.06,.24,1)", fill: "forwards" }
          );
          setTimeout(function() {
            path.style.transition = "fill " + ms(420) + "ms ease, stroke-width " + ms(420) + "ms ease";
            path.style.fill = "";
            path.style.strokeWidth = "0";
          }, ms(1450));
        } catch (err) {
        }
      }
      return wait(300);
    }
    function showAction(step) {
      ui.btnZh.textContent = step.btnZh;
      ui.btnEn.textContent = step.btnEn;
      ui.card.hidden = step.action !== "confirm";
      if (step.action === "confirm") {
        ui.card.innerHTML = "";
        var rows = [
          ["身份名称", C.identity, true],
          ["身份编号", C.identityId, false],
          ["权限等级", C.accessLevel, false]
        ];
        rows.forEach(function(r) {
          var row = el("div", "dsu-card-row");
          row.appendChild(el("span", null, r[0]));
          row.appendChild(el("b", r[2] ? "dsu-zhname" : null, r[1]));
          ui.card.appendChild(row);
        });
      }
      ui.hint.innerHTML = "按 <kbd>Enter</kbd> / <kbd>Space</kbd>，或点击按钮继续";
      ui.action.classList.add("dsu-in");
      ui.btn.classList.add("dsu-pulse");
    }
    function hideAction() {
      ui.action.classList.remove("dsu-in");
      ui.btn.classList.remove("dsu-pulse");
    }
    function finale() {
      if (finished || stale()) return Promise.resolve();
      armStall();
      setStepCount(6, "WELCOME");
      setSlats(6);
      setProgress(1);
      setSubtitle("身份验证完成，会话已建立", "IDENTITY VERIFIED · SESSION ESTABLISHED");
      audio.chime();
      var welcome = null;
      ui.status.classList.remove("dsu-in");
      ui.subEn.classList.remove("dsu-in");
      ui.status.classList.remove("dsu-shield");
      ui.subEn.classList.remove("dsu-shield");
      ui.rule.classList.remove("dsu-in");
      ui.reticle.classList.remove("dsu-in");
      ui.reticle.classList.remove("dsu-lock");
      ui.fact1.classList.remove("dsu-in");
      ui.fact2.classList.remove("dsu-in");
      ui.checks.classList.remove("dsu-in");
      ui.trace.classList.remove("dsu-in");
      setChecks(0);
      stopDecode();
      stopHex();
      ui.center.classList.add("dsu-off");
      ui.dots.hidden = true;
      return wait(360).then(function() {
        ui.welcome.classList.add("dsu-in");
        ui.idline.classList.remove("dsu-in");
        welcome = voice.line(null, null, "line-6");
        return wait(420);
      }).then(function() {
        var targets = [ui.w1, ui.w2, ui.w4];
        targets.forEach(function(t) {
          t.classList.add("dsu-glitch");
          t.setAttribute("data-text", t.textContent);
        });
        ui.w2.classList.add("dsu-glitch-box");
        void ui.welcome.offsetWidth;
        targets.forEach(function(t) {
          t.classList.add("dsu-on");
        });
        if (ambientOn() && ui.tear) ui.tear.classList.add("dsu-go");
        return wait(640);
      }).then(function() {
        root.classList.add("dsu-peak");
        ui.bloom.classList.add("dsu-go");
        ui.streak.classList.add("dsu-go");
        return wait(430);
      }).then(function() {
        ui.flash.style.transition = "opacity " + ms(70) + "ms linear";
        ui.flash.style.opacity = "0.72";
        return wait(90);
      }).then(function() {
        ui.flash.style.transition = "opacity " + ms(340) + "ms cubic-bezier(0.4, 0, 0.2, 1)";
        ui.flash.style.opacity = "0";
        return wait(320);
      }).then(function() {
        return welcome;
      }).then(function() {
        root.classList.add("dsu-handoff");
        return wait(780);
      }).then(function() {
        return finish();
      });
    }
    function finish() {
      if (finished) return;
      finished = true;
      window.__DSH_STARTUP_FINISHED__ = true;
      disarmStall();
      dropListeners();
      chromeSync.show();
      try {
        restoreAppBackdrop();
      } catch (e) {
      }
      releaseAll();
      stopHex();
      voice.stop();
      if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
      }
      try {
        if (C.mode === "session") window.sessionStorage.setItem("dsh-startup-screen:shown", "1");
        if (C.mode === "daily") {
          window.localStorage.setItem("dsh-startup-screen:day", localDayKey());
        }
      } catch (err) {
      }
      document.documentElement.classList.remove("dsu-lock");
      document.documentElement.style.overflow = "";
      if (document.body) document.body.style.overflow = "";
      root.classList.remove("dsu-boot");
      root.classList.add("dsu-gone");
      finishTimer = setTimeout(function() {
        finishTimer = null;
        if (stale()) return;
        if (root && root.parentNode) root.parentNode.removeChild(root);
        try {
          window.dispatchEvent(new CustomEvent("dsh-startup:done"));
        } catch (err) {
        }
      }, ms(900));
    }
    function requestSkip() {
      if (skipped || finished) return;
      skipped = true;
      releaseAll();
      finish();
    }
    if (C.allowSkip && ui.skip) {
      ui.skip.hidden = false;
      ui.skip.addEventListener("click", function(e) {
        e.stopPropagation();
        requestSkip();
      });
      listen(document, "keydown", function(e) {
        if (e.key === "Escape") requestSkip();
      });
    } else if (ui.skip) {
      ui.skip.hidden = true;
    }
    window.__DSH_STARTUP_API__ = {
      /* 设置页试听与冒烟测试用：直接念一行 */
      speak: function(en, zh) {
        voice.say(en, zh);
      },
      speakName: function(n) {
        return voice.speakName(n);
      },
      get voice() {
        return voice.current();
      },
      replay: injectSelf,
      skip: requestSkip,
      finish,
      dispose,
      config: C
    };
    document.documentElement.classList.add("dsu-lock");
    document.documentElement.style.overflow = "hidden";
    if (document.body) document.body.style.overflow = "hidden";
    setProgress(0.05);
    root.classList.remove("dsu-boot");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        run();
      });
    } else {
      run();
    }
  }
  boot();
})();
