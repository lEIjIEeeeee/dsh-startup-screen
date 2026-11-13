// src/index.js
import os from "node:os";
import path3 from "node:path";
import { fileURLToPath } from "node:url";

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
  // 音效来源：audio=lib/assets 里的真素材 / synth=现场合成
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

// src/shared/routes.js
var NS = "dsh-startup-screen";
var ROUTE_BASE = "/dsh-startup";
var ROUTES = {
  css: ROUTE_BASE + "/splash.css",
  splash: ROUTE_BASE + "/splash.js",
  asset: ROUTE_BASE + "/asset",
  config: ROUTE_BASE + "/config",
  facts: ROUTE_BASE + "/facts"
};

// src/host/config.js
import fs from "node:fs";
import path from "node:path";

// src/shared/schema.js
var TEXT_KEYS = [
  "identity",
  "identityId",
  "accessLevel",
  "brand1",
  "brand2",
  "brand3a",
  "brand3b",
  "orgZh",
  "orgEn",
  "orgSub",
  "welcomeBox",
  "footer",
  "voiceName"
];
var COLOR_KEYS = ["accent", "glitchA", "glitchB"];
var ENUMS = {
  mode: ["always", "session", "daily"],
  theme: ["light", "dark"],
  voiceLang: ["en", "zh", "both"],
  sfx: ["audio", "synth"],
  voiceSource: ["asset", "tts"]
};
var BOOL_KEYS = [
  "enabled",
  "requireInteraction",
  "allowSkip",
  "ambient",
  "sound",
  "voice",
  "voiceCue",
  "glass"
];
var RANGES = {
  speed: [0.35, 3],
  soundVolume: [0, 1],
  voiceRate: [0.5, 2],
  voiceLead: [0, 1200],
  voicePitch: [0, 2],
  voiceVolume: [0, 1],
  glassOpacity: [0.15, 0.95],
  glassBlur: [0, 60],
  glassSaturate: [100, 200],
  glassBackdropBlur: [0, 80]
};
var IDENTITY_MAX = 48;
function normalizeIdentityId(value, identity) {
  const id = String(value || identity || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return id || "OPERATOR";
}
function normalize(input) {
  const out = { ...DEFAULTS };
  const src = input && typeof input === "object" ? input : {};
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in src) || src[key] === void 0 || src[key] === null) continue;
    const value = src[key];
    if (BOOL_KEYS.includes(key)) {
      out[key] = value === true || value === "true" || value === 1 || value === "1";
    } else if (ENUMS[key]) {
      out[key] = ENUMS[key].includes(value) ? value : DEFAULTS[key];
    } else if (key === "speed" || RANGES[key]) {
      const [lo, hi] = RANGES[key] || RANGES.speed;
      const n = Number(value);
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key];
    } else if (COLOR_KEYS.includes(key)) {
      const s = String(value).trim();
      out[key] = /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : DEFAULTS[key];
    } else if (TEXT_KEYS.includes(key)) {
      out[key] = String(value).slice(0, key === "identity" ? IDENTITY_MAX : 64);
    } else {
      out[key] = value;
    }
  }
  if (!String(out.identity).trim()) out.identity = DEFAULTS.identity;
  out.identityId = normalizeIdentityId(out.identityId, out.identity);
  return out;
}

// src/host/config.js
function createConfig(configFile) {
  function read() {
    try {
      return normalize(JSON.parse(fs.readFileSync(configFile, "utf8")));
    } catch (err) {
      return { ...DEFAULTS };
    }
  }
  function write(next) {
    const cfg = normalize(next);
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    const tmp = configFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), "utf8");
    fs.renameSync(tmp, configFile);
    return cfg;
  }
  return { file: configFile, defaults: DEFAULTS, read, write };
}

// src/host/facts.js
function service(ctx, name2) {
  try {
    return typeof ctx.get === "function" ? ctx.get(name2) : void 0;
  } catch (err) {
    return void 0;
  }
}
function shortHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, "0");
}
function createFactsCache() {
  return { value: null, started: false };
}
function factsSnapshot(cache) {
  return cache.value || { ready: false };
}
function collectFacts(ctx, cache) {
  if (cache.started) return cache.value;
  cache.started = true;
  const facts = { ready: false };
  cache.value = facts;
  (async () => {
    try {
      const pc = service(ctx, "profileContext") || {};
      facts.profile = pc.name ? String(pc.name).toUpperCase() : null;
      facts.bundleCount = Array.isArray(pc.startedBundles) ? pc.startedBundles.length : null;
    } catch (err) {
    }
    try {
      const sp = service(ctx, "sandboxPolicy");
      let mode = sp && sp.defaultMode;
      if (!mode && sp && typeof sp.resolve === "function") {
        const r = sp.resolve();
        mode = r && r.mode;
      }
      facts.sandbox = mode ? String(mode) : null;
    } catch (err) {
    }
    try {
      const md = service(ctx, "agentDefaultModel");
      if (md && typeof md.currentSelection === "function") {
        const sel = await md.currentSelection();
        facts.model = sel && sel.model ? String(sel.model) : null;
      }
    } catch (err) {
    }
    try {
      const pm = service(ctx, "pluginManager");
      if (pm && typeof pm.listBundles === "function") {
        const list = await pm.listBundles();
        if (Array.isArray(list) && list.length) {
          facts.bundleCount = list.length;
          const base = list.find((b) => b && /dsh-base$/.test(String(b.name || "")));
          const core = base || list[0];
          if (core && core.version) facts.version = String(core.version).replace(/^v/, "");
        }
      }
    } catch (err) {
    }
    try {
      const s = service(ctx, "sessions");
      if (s && typeof s.list === "function") {
        const r = await s.list();
        if (Array.isArray(r)) facts.sessions = r.length;
      }
    } catch (err) {
    }
    try {
      const wr = service(ctx, "workspaceRegistry");
      if (wr && typeof wr.list === "function") {
        const ids = /* @__PURE__ */ new Set();
        const list = wr.list();
        if (Array.isArray(list)) {
          for (const w of list) {
            if (w && Array.isArray(w.sessionIds)) {
              for (const id of w.sessionIds) ids.add(String(id));
            }
          }
        }
        if (Array.isArray(wr.archivedSessionIds)) {
          for (const id of wr.archivedSessionIds) ids.add(String(id));
          facts.sessionsArchived = wr.archivedSessionIds.length;
        }
        if (ids.size) facts.sessionsTotal = ids.size;
      }
    } catch (err) {
    }
    facts.hash = shortHash(
      [facts.profile, facts.version, facts.model, facts.sandbox, facts.bundleCount].map((x) => x === null || x === void 0 ? "-" : String(x)).join("|")
    );
    facts.ready = true;
  })().catch(() => {
    facts.ready = true;
  });
  return facts;
}
async function refreshSessions(ctx, cache) {
  const facts = cache.value;
  if (!facts) return;
  try {
    const s = service(ctx, "sessions");
    if (!s || typeof s.list !== "function") return;
    const r = await s.list();
    if (Array.isArray(r)) facts.sessions = r.length;
    else if (r && Array.isArray(r.items)) facts.sessions = r.items.length;
    else if (r && Array.isArray(r.sessions)) facts.sessions = r.sessions.length;
  } catch (err) {
  }
  try {
    const wr = service(ctx, "workspaceRegistry");
    if (wr && typeof wr.list === "function") {
      const ids = /* @__PURE__ */ new Set();
      const list = wr.list();
      if (Array.isArray(list)) {
        for (const w of list) {
          if (w && Array.isArray(w.sessionIds)) {
            for (const id of w.sessionIds) ids.add(String(id));
          }
        }
      }
      if (Array.isArray(wr.archivedSessionIds)) {
        for (const id of wr.archivedSessionIds) ids.add(String(id));
        facts.sessionsArchived = wr.archivedSessionIds.length;
      }
      if (ids.size) facts.sessionsTotal = ids.size;
    }
  } catch (err) {
  }
}

// src/host/routes.js
import fs2 from "node:fs";
import path2 from "node:path";
function makeReader(file) {
  let cache = null;
  return function read() {
    try {
      const st = fs2.statSync(file);
      if (!cache || cache.mtimeMs !== st.mtimeMs) {
        cache = { mtimeMs: st.mtimeMs, text: fs2.readFileSync(file, "utf8") };
      }
      return cache.text;
    } catch (err) {
      return "";
    }
  };
}
function sendJson(res, code, payload, done) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": String(body.length)
  });
  res.end(body, done);
}
function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (c) => {
      if (tooLarge) return;
      size += c.length;
      if (size > limit) {
        tooLarge = true;
        chunks.length = 0;
        try {
          if (typeof req.pause === "function") req.pause();
        } catch (err) {
        }
        resolve({ tooLarge: true, text: "" });
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!tooLarge) resolve({ tooLarge: false, text: Buffer.concat(chunks).toString("utf8") });
    });
    req.on("error", () => {
      if (!tooLarge) resolve({ tooLarge: false, text: "" });
    });
  });
}
function sendText(res, type, text) {
  const body = Buffer.from(text, "utf8");
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Content-Length": String(body.length)
  });
  res.end(body);
}
function registerRoutes(host) {
  const { ctx, webServer, packageRoot, version, factsCache: factsCache2, readConfig, writeConfig, defaults, configFile } = host;
  const readSplashCss = makeReader(path2.join(packageRoot, "lib", "splash.css"));
  const readSplashJs = makeReader(path2.join(packageRoot, "lib", "splash.js"));
  const assetsDir = path2.join(packageRoot, "lib", "assets");
  const disposers = [];
  function rejected(req, res) {
    try {
      const conn = (typeof ctx.get === "function" ? ctx.get("connection") : void 0) || ctx.connection;
      if (!conn || typeof conn.requestRejection !== "function") return false;
      const code = conn.requestRejection(req);
      if (code === void 0 || code === null || code === false) return false;
      res.statusCode = typeof code === "number" ? code : 403;
      res.end();
      return true;
    } catch (err) {
      return false;
    }
  }
  function registerRoute(route) {
    const inner = route && route.handler;
    const wrapped = Object.assign({}, route, {
      handler: async (req, res) => {
        if (rejected(req, res)) return;
        return inner(req, res);
      }
    });
    return webServer.register(wrapped);
  }
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.css,
      handler: (req, res) => sendText(res, "text/css; charset=utf-8", readSplashCss())
    })
  );
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.splash,
      handler: (req, res) => sendText(res, "application/javascript; charset=utf-8", readSplashJs())
    })
  );
  disposers.push(
    registerRoute({
      kind: "prefix",
      path: ROUTES.asset,
      handler: (req, res) => {
        let pathname;
        try {
          pathname = decodeURIComponent((req.url || "").split("?")[0]);
        } catch (err) {
          res.writeHead(400);
          res.end();
          return;
        }
        const name2 = path2.basename(pathname);
        if (!/^[a-z0-9._-]+\.mp3$/i.test(name2) || name2.includes("..")) {
          res.writeHead(404);
          res.end();
          return;
        }
        let bytes;
        try {
          bytes = fs2.readFileSync(path2.join(assetsDir, name2));
        } catch (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          "Content-Length": String(bytes.length)
        });
        res.end(bytes);
      }
    })
  );
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.config,
      handler: async (req, res) => {
        const method = (req.method || "GET").toUpperCase();
        if (method === "GET") {
          sendJson(res, 200, {
            ok: true,
            version,
            config: readConfig(),
            defaults,
            file: configFile,
            facts: factsSnapshot(factsCache2)
          });
          return;
        }
        if (method !== "POST") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
        const body = await readBody(req);
        if (body.tooLarge) {
          sendJson(res, 413, { ok: false, error: "payload too large" }, () => {
            try {
              if (typeof req.destroy === "function") req.destroy();
            } catch (err) {
            }
          });
          return;
        }
        let payload;
        try {
          payload = body.text ? JSON.parse(body.text) : {};
        } catch (err) {
          sendJson(res, 400, { ok: false, error: "invalid json" });
          return;
        }
        try {
          if (payload && payload.action === "reset") {
            const cfgNow2 = writeConfig(defaults);
            sendJson(res, 200, { ok: true, version, config: cfgNow2, defaults });
            return;
          }
          const current = readConfig();
          const patch = payload && typeof payload.patch === "object" && payload.patch ? payload.patch : payload;
          const cfgNow = writeConfig({ ...current, ...patch });
          sendJson(res, 200, { ok: true, version, config: cfgNow, defaults });
        } catch (err) {
          sendJson(res, 500, { ok: false, error: String(err && err.message || err) });
        }
      }
    })
  );
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.facts,
      handler: (req, res) => {
        if ((req.method || "GET").toUpperCase() !== "GET") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
        try {
          refreshSessions(ctx, factsCache2);
        } catch (err) {
        }
        sendJson(res, 200, { ok: true, facts: factsSnapshot(factsCache2) });
      }
    })
  );
  return disposers;
}

// src/host/inject.js
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");
}
var CRITICAL_CSS = [
  "html.dsu-lock,html.dsu-lock body{overflow:hidden!important}",
  /* 宿主会先给页面写一条白色背景，覆盖层插入前或玻璃透明时会露出来，
     所以启动期间统一压成黑色，和黑幕开场一致。 */
  "html.dsu-lock body{background-color:#000!important}",
  ":root{--dsh-boot-bg:#000}",
  "#dsh-startup-root.dsu-boot{position:fixed;inset:0;z-index:2147483000;background:#000}"
].join("");
var BOOTSTRAP_JS = `(function(){try{
var c=window.__DSH_STARTUP__||{};
var root=document.getElementById('dsh-startup-root');
var off=!c.enabled;
if(!off&&c.mode==='session'){try{if(sessionStorage.getItem('dsh-startup-screen:shown')==='1')off=true}catch(e){}}
if(!off&&c.mode==='daily'){try{if(localStorage.getItem('dsh-startup-screen:day')===new Date().toISOString().slice(0,10))off=true}catch(e){}}
if(off){window.__DSH_STARTUP_SKIP__=true;if(root&&root.parentNode)root.parentNode.removeChild(root);}
else{document.documentElement.classList.add('dsu-lock');/* 兜底：动画脚本没跑起来（404、被拦、语法错）时，9 秒后无条件放行，绝不锁死黑屏。判断依据是时间线有没有开始，不能按类名判断 */setTimeout(function(){try{if(window.__DSH_STARTUP_RUNNING__===true)return;var r=document.getElementById('dsh-startup-root');if(r&&r.parentNode)r.parentNode.removeChild(r);document.documentElement.classList.remove('dsu-lock');if(document.body)document.body.style.overflow='';window.__DSH_STARTUP_FAILED__=true;}catch(e){}},9000);}
}catch(e){} })()`;
function injectIndex(host) {
  const { webServer, version, factsCache: factsCache2, readConfig } = host;
  return webServer.tapIndex((html) => {
    if (!html || html.includes(ROUTES.splash)) return html;
    const cfg = readConfig();
    cfg.facts = factsCache2.value || { ready: false };
    const head = '<link rel="stylesheet" href="' + ROUTES.css + '"><style id="dsh-startup-critical">' + CRITICAL_CSS + "</style>";
    const body = '<div id="dsh-startup-root" class="dsu-root dsu-boot"></div><script>window.__DSH_STARTUP_BOOT__="index";window.__DSH_STARTUP_VERSION__=' + safeJson(version) + ";window.__DSH_STARTUP__=" + safeJson(cfg) + ";" + BOOTSTRAP_JS + '</script><script defer src="' + ROUTES.splash + '"></script>';
    let out = html;
    if (out.includes("</head>")) out = out.replace("</head>", head + "</head>");
    else out = head + out;
    if (out.includes("<body>")) out = out.replace("<body>", "<body>" + body);
    else if (out.includes("</body>")) out = out.replace("</body>", body + "</body>");
    else out = out + body;
    return out;
  });
}

// src/index.js
var PACKAGE_ROOT = path3.resolve(path3.dirname(fileURLToPath(import.meta.url)), "..");
var DSH_HOME = process.env.DSH_HOME || path3.join(os.homedir(), ".dsh");
var CONFIG_FILE = path3.join(DSH_HOME, "dsh-startup.json");
var PLUGIN_VERSION = "1.4.0";
var factsCache = createFactsCache();
var name = NS;
var inject = ["webServer", "connection"];
function resolveWebServer(ctx) {
  try {
    const viaGet = typeof ctx.get === "function" ? ctx.get("webServer") : void 0;
    if (viaGet) return viaGet;
  } catch (err) {
  }
  return ctx.webServer;
}
function hasRoutes(server) {
  return !!server && typeof server.register === "function" && typeof server.tapIndex === "function";
}
function apply(ctx) {
  try {
    collectFacts(ctx, factsCache);
  } catch (err) {
  }
  const disposers = [];
  const webServer = resolveWebServer(ctx);
  if (!hasRoutes(webServer)) {
    try {
      ctx.logger?.warn?.(
        "[" + NS + "] 当前环境没有可用的 webServer（桌面端可能直接下发页面）；宿主侧跳过路由与首屏注入，改由浏览器侧自己启动动画。"
      );
    } catch (err) {
    }
    return;
  }
  const config = createConfig(CONFIG_FILE);
  const host = {
    ctx,
    webServer,
    packageRoot: PACKAGE_ROOT,
    configFile: CONFIG_FILE,
    version: PLUGIN_VERSION,
    defaults: DEFAULTS,
    factsCache,
    readConfig: config.read,
    writeConfig: config.write
  };
  try {
    disposers.push(...registerRoutes(host));
    disposers.push(injectIndex(host));
  } catch (err) {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch (e) {
      }
    }
    throw err;
  }
  ctx.effect(() => () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch (err) {
      }
    }
  });
}
export {
  apply,
  inject,
  name
};
