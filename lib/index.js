// src/index.js
import os from "node:os";
import path3 from "node:path";
import { fileURLToPath } from "node:url";

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
var IDENTITY_ID_MAX = 12;
var TEXT_MAX = 64;
function normalizeIdentityId(value, identity) {
  const id = String(value || identity || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, IDENTITY_ID_MAX);
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
    } else if (RANGES[key]) {
      const [lo, hi] = RANGES[key];
      const n = Number(value);
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key];
    } else if (COLOR_KEYS.includes(key)) {
      const s = String(value).trim();
      out[key] = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s) ? s : DEFAULTS[key];
    } else if (TEXT_KEYS.includes(key)) {
      out[key] = String(value).slice(0, key === "identity" ? IDENTITY_MAX : TEXT_MAX);
    } else {
      out[key] = value;
    }
  }
  if (!String(out.identity).trim()) out.identity = DEFAULTS.identity;
  out.identityId = normalizeIdentityId(out.identityId, out.identity);
  return out;
}

// src/host/config.js
function createConfig(configFile, logger) {
  let seq = 0;
  let readWarned = false;
  function warn(message) {
    try {
      if (logger && typeof logger.warn === "function") logger.warn("[" + NS + "] " + message);
    } catch (err) {
    }
  }
  function quarantine() {
    const backup = configFile + ".corrupt-" + Date.now();
    try {
      fs.renameSync(configFile, backup);
      warn("配置文件无法解析，已备份到 " + backup + "，本次使用默认配置。");
    } catch (renameErr) {
      warn("配置文件无法解析，且备份失败，本次使用默认配置：" + messageOf(renameErr));
    }
  }
  function read() {
    let text;
    try {
      text = fs.readFileSync(configFile, "utf8");
    } catch (err) {
      const code = (
        /** @type {any} */
        (err || {}).code
      );
      if (code !== "ENOENT" && !readWarned) {
        readWarned = true;
        warn("读取配置失败，本次使用默认配置：" + messageOf(err));
      }
      return { ...DEFAULTS };
    }
    try {
      return normalize(JSON.parse(text));
    } catch (err) {
      quarantine();
      return { ...DEFAULTS };
    }
  }
  function write(next) {
    const cfg = normalize(next);
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    const tmp = configFile + "." + process.pid + "." + seq++ + ".tmp";
    try {
      fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), "utf8");
      fs.renameSync(tmp, configFile);
    } catch (err) {
      try {
        fs.unlinkSync(tmp);
      } catch (cleanupErr) {
      }
      throw err;
    }
    return cfg;
  }
  return { read, write };
}
function messageOf(err) {
  return String(err && err.message ? err.message : err);
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
function readRegistryCounts(ctx) {
  const out = {};
  try {
    const wr = service(ctx, "workspaceRegistry");
    if (!wr || typeof wr.list !== "function") return out;
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
      out.sessionsArchived = wr.archivedSessionIds.length;
    }
    if (ids.size) out.sessionsTotal = ids.size;
  } catch (err) {
  }
  return out;
}
function createFactsCache() {
  return { value: null, started: false };
}
function factsSnapshot(cache) {
  return cache.value || { ready: false };
}
function collectFacts(ctx, cache) {
  if (cache.started) return cache.value || { ready: false };
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
    Object.assign(facts, readRegistryCounts(ctx));
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
    if (s && typeof s.list === "function") {
      const r = await s.list();
      if (Array.isArray(r)) facts.sessions = r.length;
      else if (r && Array.isArray(r.items)) facts.sessions = r.items.length;
      else if (r && Array.isArray(r.sessions)) facts.sessions = r.sessions.length;
    }
  } catch (err) {
  }
  Object.assign(facts, readRegistryCounts(ctx));
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
      return null;
    }
  };
}
function sendJson(res, code, payload, done) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": String(body.length),
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body, done);
}
function readBody(req, limit = 64 * 1024, timeoutMs = 15e3) {
  return new Promise((resolve) => {
    let size = 0;
    let settled = false;
    const chunks = [];
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      try {
        if (typeof req.destroy === "function") req.destroy();
      } catch (err) {
      }
      finish({ tooLarge: false, text: "", error: true });
    }, timeoutMs);
    req.on("data", (c) => {
      if (settled) return;
      size += c.length;
      if (size > limit) {
        chunks.length = 0;
        try {
          if (typeof req.pause === "function") req.pause();
        } catch (err) {
        }
        finish({ tooLarge: true, text: "" });
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => finish({ tooLarge: false, text: Buffer.concat(chunks).toString("utf8") }));
    req.on("error", () => finish({ tooLarge: false, text: "", error: true }));
  });
}
function sendText(res, type, text, headOnly) {
  const body = Buffer.from(text, "utf8");
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Content-Length": String(body.length),
    "X-Content-Type-Options": "nosniff"
  });
  res.end(headOnly ? void 0 : body);
}
function methodOf(req) {
  return (req.method || "GET").toUpperCase();
}
function sendUnavailable(res) {
  res.writeHead(503, { "X-Content-Type-Options": "nosniff" });
  res.end();
}
function registerRoutes(host) {
  const { ctx, webServer, packageRoot, version, factsCache, readConfig, writeConfig, configFile } = host;
  const readSplashCss = makeReader(path2.join(packageRoot, "lib", "splash.css"));
  const readSplashJs = makeReader(path2.join(packageRoot, "lib", "splash.js"));
  const assetsDir = path2.join(packageRoot, "lib", "assets");
  const disposers = [];
  function warn(message, err) {
    try {
      const detail = err && err.message ? err.message : err;
      ctx.logger?.warn?.("[" + NS + "] " + message + (detail ? "：" + detail : ""));
    } catch (e) {
    }
  }
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
      warn("来源校验失败，已拒绝请求", err);
      try {
        res.statusCode = 403;
        res.end();
      } catch (e) {
      }
      return true;
    }
  }
  function registerRoute(route) {
    const inner = route.handler;
    const wrapped = {
      kind: route.kind,
      path: route.path,
      handler: async (req, res) => {
        if (rejected(req, res)) return;
        try {
          await inner(req, res);
        } catch (err) {
          warn("路由处理失败", err);
          try {
            if (!res.headersSent) {
              sendJson(res, 500, { ok: false, error: "internal error" });
            } else if (typeof res.destroy === "function") {
              res.destroy();
            }
          } catch (e) {
            try {
              res.statusCode = 500;
              res.end();
            } catch (e2) {
            }
          }
        }
      }
    };
    return webServer.register(wrapped);
  }
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.css,
      handler: (req, res) => {
        const method = methodOf(req);
        if (method !== "GET" && method !== "HEAD") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
        const text = readSplashCss();
        if (text === null) return sendUnavailable(res);
        sendText(res, "text/css; charset=utf-8", text, method === "HEAD");
      }
    })
  );
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.splash,
      handler: (req, res) => {
        const method = methodOf(req);
        if (method !== "GET" && method !== "HEAD") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
        const text = readSplashJs();
        if (text === null) return sendUnavailable(res);
        sendText(res, "application/javascript; charset=utf-8", text, method === "HEAD");
      }
    })
  );
  disposers.push(
    registerRoute({
      kind: "prefix",
      path: ROUTES.asset,
      handler: (req, res) => {
        const method = methodOf(req);
        if (method !== "GET" && method !== "HEAD") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
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
          "Content-Length": String(bytes.length),
          "X-Content-Type-Options": "nosniff"
        });
        res.end(method === "HEAD" ? void 0 : bytes);
      }
    })
  );
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.config,
      handler: async (req, res) => {
        const method = methodOf(req);
        if (method === "GET") {
          sendJson(res, 200, {
            ok: true,
            version,
            config: readConfig(),
            defaults: DEFAULTS,
            file: configFile,
            facts: factsSnapshot(factsCache)
          });
          return;
        }
        if (method !== "POST") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
        const body = await readBody(req);
        if (body.error) {
          sendJson(res, 400, { ok: false, error: "request aborted" });
          return;
        }
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
            const cfgNow2 = writeConfig(DEFAULTS);
            sendJson(res, 200, { ok: true, version, config: cfgNow2, defaults: DEFAULTS });
            return;
          }
          const current = readConfig();
          const patch = payload && typeof payload.patch === "object" && payload.patch ? payload.patch : payload;
          const cfgNow = writeConfig({ ...current, ...patch });
          sendJson(res, 200, { ok: true, version, config: cfgNow, defaults: DEFAULTS });
        } catch (err) {
          warn("保存配置失败", err);
          sendJson(res, 500, { ok: false, error: "internal error" });
        }
      }
    })
  );
  disposers.push(
    registerRoute({
      kind: "exact",
      path: ROUTES.facts,
      handler: async (req, res) => {
        if (methodOf(req) !== "GET") {
          sendJson(res, 405, { ok: false, error: "method not allowed" });
          return;
        }
        try {
          await refreshSessions(ctx, factsCache);
        } catch (err) {
          warn("刷新会话数失败", err);
        }
        sendJson(res, 200, { ok: true, facts: factsSnapshot(factsCache) });
      }
    })
  );
  return disposers;
}

// src/host/inject.js
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
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
if(!off&&c.mode==='daily'){try{var d=new Date();var k=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);if(localStorage.getItem('dsh-startup-screen:day')===k)off=true}catch(e){}}
if(off){window.__DSH_STARTUP_SKIP__=true;if(root&&root.parentNode)root.parentNode.removeChild(root);}
else{document.documentElement.classList.add('dsu-lock');setTimeout(function(){try{if(window.__DSH_STARTUP_RUNNING__===true)return;var r=document.getElementById('dsh-startup-root');if(r&&r.parentNode)r.parentNode.removeChild(r);document.documentElement.classList.remove('dsu-lock');if(document.body)document.body.style.overflow='';window.__DSH_STARTUP_FAILED__=true;}catch(e){}},9000);}
}catch(e){} })()`;
function injectIndex(host) {
  const { webServer, version, factsCache, readConfig } = host;
  return webServer.tapIndex((html) => {
    if (!html || html.includes(ROUTES.splash)) return html;
    const cfg = readConfig();
    cfg.facts = factsSnapshot(factsCache);
    const head = '<link rel="stylesheet" href="' + ROUTES.css + '"><style id="dsh-startup-critical">' + CRITICAL_CSS + "</style>";
    const body = '<div id="dsh-startup-root" class="dsu-root dsu-boot"></div><script>window.__DSH_STARTUP_BOOT__="index";window.__DSH_STARTUP_VERSION__=' + safeJson(version) + ";window.__DSH_STARTUP__=" + safeJson(cfg) + ";" + BOOTSTRAP_JS + '</script><script defer src="' + ROUTES.splash + '"></script>';
    let out = html;
    if (out.includes("</head>")) {
      const at = out.lastIndexOf("</head>");
      out = out.slice(0, at) + head + out.slice(at);
    } else {
      out = head + out;
    }
    if (out.includes("<body>")) {
      out = out.replace("<body>", "<body>" + body);
    } else if (out.includes("</body>")) {
      const at = out.lastIndexOf("</body>");
      out = out.slice(0, at) + body + out.slice(at);
    } else {
      out = out + body;
    }
    return out;
  });
}

// src/index.js
var PACKAGE_ROOT = path3.resolve(path3.dirname(fileURLToPath(import.meta.url)), "..");
var DSH_HOME = process.env.DSH_HOME || path3.join(os.homedir(), ".dsh");
var CONFIG_FILE = path3.join(DSH_HOME, "dsh-startup.json");
var PLUGIN_VERSION = "1.4.0";
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
function routeAbilities(server) {
  return {
    canRegister: !!server && typeof server.register === "function",
    canTap: !!server && typeof server.tapIndex === "function"
  };
}
function apply(ctx) {
  const factsCache = createFactsCache();
  try {
    collectFacts(ctx, factsCache);
  } catch (err) {
  }
  const disposers = [];
  const webServer = resolveWebServer(ctx);
  const { canRegister, canTap } = routeAbilities(webServer);
  if (!canRegister) {
    try {
      ctx.logger?.warn?.(
        "[" + NS + "] 当前环境没有可注册路由的 webServer（桌面端可能直接下发页面）；宿主侧跳过路由与首屏注入，改由浏览器侧自己启动动画。"
      );
    } catch (err) {
    }
    return;
  }
  const config = createConfig(CONFIG_FILE, ctx.logger);
  const host = {
    ctx,
    webServer,
    packageRoot: PACKAGE_ROOT,
    configFile: CONFIG_FILE,
    version: PLUGIN_VERSION,
    factsCache,
    readConfig: config.read,
    writeConfig: config.write
  };
  try {
    disposers.push(...registerRoutes(host));
    if (canTap) disposers.push(injectIndex(host));
    ctx.effect(() => () => {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch (err) {
        }
      }
    });
  } catch (err) {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch (e) {
      }
    }
    throw err;
  }
}
export {
  apply,
  inject,
  name
};
