window.__ModuleLoader__.load({
  id: 'dsh-startup-screen',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

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

// src/client/api.js
var API = ROUTES.config;
var LOAD_TIMEOUT_MS = 8e3;
var WRITE_TIMEOUT_MS = 15e3;
var PREVIEW_FALLBACK_MS = 1200;
function messageOf(e) {
  return String(e && e.message ? e.message : e);
}
function request(init, timeoutMs, timeoutMessage) {
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  const stop = () => {
    if (timer) clearTimeout(timer);
  };
  if (ctrl) init.signal = ctrl.signal;
  return fetch(API, init).then((r) => r.json()).then((j) => {
    stop();
    return j;
  }).catch((e) => {
    stop();
    if (ctrl && ctrl.signal.aborted) {
      const err = new Error(timeoutMessage);
      err.timeout = true;
      throw err;
    }
    throw e;
  });
}
function post(body) {
  return request(
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    },
    WRITE_TIMEOUT_MS,
    "保存超时，请稍后重试"
  );
}
function loadConfig() {
  return request(
    { headers: { Accept: "application/json" } },
    LOAD_TIMEOUT_MS,
    "读取配置超时，请稍后重试"
  ).then((j) => {
    if (!j || j.ok !== true) throw new Error(j && j.error || "load failed");
    return j;
  }).catch((e) => {
    if (e && e.timeout) throw e;
    throw new Error("读取配置失败：" + messageOf(e));
  });
}
function saveConfig(draft) {
  return post({ patch: draft }).then((j) => {
    if (!j || j.ok !== true) throw new Error(j && j.error || "save failed");
    return j;
  }).catch((e) => {
    if (e && e.timeout) throw e;
    throw new Error("保存失败：" + messageOf(e));
  });
}
function resetConfig() {
  return post({ action: "reset" }).then((j) => {
    if (!j || j.ok !== true) throw new Error(j && j.error || "reset failed");
    return j;
  }).catch((e) => {
    if (e && e.timeout) throw new Error("恢复默认超时，请稍后重试");
    throw new Error("恢复默认失败：" + messageOf(e));
  });
}
function previewConfig(draft) {
  try {
    const base = window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === "object" ? window.__DSH_STARTUP__ : {};
    window.__DSH_STARTUP__ = Object.assign({}, base, draft || {});
  } catch (e) {
  }
  const api = window.__DSH_STARTUP_API__;
  if (api && typeof api.replay === "function") {
    let threw = false;
    try {
      api.replay();
    } catch (e) {
      threw = true;
    }
    setTimeout(() => {
      if (threw) {
        window.location.reload();
        return;
      }
      const root = document.getElementById("dsh-startup-root");
      const running = window.__DSH_STARTUP_RUNNING__ === true;
      if (!root && !running) window.location.reload();
    }, PREVIEW_FALLBACK_MS);
    return;
  }
  window.location.reload();
}

// src/client/panel.jsx
var import_react3 = require("react");

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
var TEXT_MAX = 64;

// src/client/a11y.js
var import_react = require("react");
var FieldContext = (0, import_react.createContext)(null);
var fieldSeq = 0;
function useFieldId() {
  const ref = (0, import_react.useRef)(null);
  if (ref.current === null) ref.current = "ss-field-" + ++fieldSeq;
  return ref.current;
}
function useFieldA11y() {
  return (0, import_react.useContext)(FieldContext) || {};
}

// src/client/components/ColorInput.jsx
var import_jsx_runtime = require("react/jsx-runtime");
function ColorInput({ value, onChange, ...rest }) {
  const a11y = useFieldA11y();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "input",
    {
      className: "__ss_swatch",
      type: "color",
      value,
      "aria-labelledby": a11y.labelId,
      "aria-describedby": a11y.hintId,
      onChange: (e) => onChange(e.target.value),
      ...rest
    }
  );
}

// src/client/components/Field.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Field({ label, hint, children }) {
  const base = useFieldId();
  const labelId = base + "-label";
  const hintId = hint ? base + "-hint" : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "__ss_field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "__ss_label", id: labelId, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "__ss_labelText", children: label }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldContext.Provider, { value: { labelId, hintId }, children }),
    hint ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "__ss_hint", id: hintId, children: hint }) : null
  ] });
}

// src/client/components/Range.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function Range({ value, min, max, step, display, onChange, ...rest }) {
  const a11y = useFieldA11y();
  const lo = Number(min);
  const hi = Number(max);
  const val = Number(value);
  const pct = hi > lo ? Math.max(0, Math.min(100, (val - lo) / (hi - lo) * 100)) : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "__ss_row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        type: "range",
        className: "__ss_range",
        min,
        max,
        step: step || 0.05,
        value,
        style: { flex: "1 1 200px", "--ss-fill": pct + "%" },
        "aria-labelledby": a11y.labelId,
        "aria-describedby": a11y.hintId,
        onChange: (e) => onChange(Number(e.target.value)),
        ...rest
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "__ss_status", "aria-hidden": "true", children: display })
  ] });
}

// src/client/components/Select.jsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function Select({ value, options, onChange, ...rest }) {
  const a11y = useFieldA11y();
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "select",
    {
      className: "__ss_select",
      value,
      "aria-labelledby": a11y.labelId,
      "aria-describedby": a11y.hintId,
      onChange: (e) => onChange(e.target.value),
      ...rest,
      children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: o[0], children: o[1] }, o[0]))
    }
  );
}

// src/client/components/Switch.jsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function Switch({ label, hint, checked, onChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "__ss_check", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked: !!checked, onChange: (e) => onChange(e.target.checked) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "__ss_switch", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("i", {}) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "__ss_checkText", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: label }),
      hint ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "__ss_hint", children: hint }) : null
    ] })
  ] });
}

// src/client/components/VoicePicker.jsx
var import_react2 = require("react");

// src/client/voice.js
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
function hits(name, list) {
  for (let i = 0; i < list.length; i++) if (name.indexOf(list[i]) !== -1) return true;
  return false;
}
function voiceMark(name) {
  if (hits(name, NATURAL_HINTS)) return "★ ";
  if (hits(name, FEMALE_HINTS)) return "♀ ";
  return "";
}
function scoreVoice(name, lang, want) {
  let sc = 0;
  if (hits(name, NATURAL_HINTS)) sc += 60;
  if (hits(name, FEMALE_HINTS)) sc += 40;
  if (hits(name, MALE_HINTS)) sc -= 45;
  if (String(lang || "").indexOf(want) === 0) sc += 25;
  return sc;
}
function readVoices() {
  try {
    const s = window.speechSynthesis;
    if (!s || typeof s.getVoices !== "function") return [];
    const list = s.getVoices() || [];
    const want = "en";
    const scored = list.map((v, i) => {
      const name = String(v.name || "").toLowerCase();
      return {
        v,
        natural: hits(name, NATURAL_HINTS),
        female: hits(name, FEMALE_HINTS),
        sc: scoreVoice(name, String(v.lang || "").toLowerCase(), want),
        i
      };
    });
    scored.sort((a, b) => {
      if (a.sc !== b.sc) return b.sc - a.sc;
      return a.i - b.i;
    });
    return scored.map((x) => x.v);
  } catch (e) {
    return [];
  }
}
function speakSample(text, draft) {
  try {
    const s = window.speechSynthesis;
    if (!s) return false;
    s.cancel();
    const u = new window.SpeechSynthesisUtterance(text || "Access permission required.");
    const list = readVoices();
    let target = null;
    for (let i = 0; i < list.length; i++) if (list[i].name === draft.voiceName) target = list[i];
    if (target) {
      u.voice = target;
      u.lang = target.lang;
    }
    u.rate = Math.min(2, Math.max(0.5, Number(draft.voiceRate) || 1));
    u.pitch = Math.min(2, Math.max(0, Number(draft.voicePitch) || 1));
    u.volume = Math.min(
      1,
      Math.max(
        0,
        draft.voiceVolume == null || draft.voiceVolume === "" ? 0.9 : Number(draft.voiceVolume)
      )
    );
    if (draft.voiceLang === "zh") {
      u.text = "需要访问许可，验证通过。";
      u.lang = "zh-CN";
    }
    s.speak(u);
    return true;
  } catch (e) {
    return false;
  }
}

// src/client/ui/Button.jsx
var primitives = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
var import_jsx_runtime6 = require("react/jsx-runtime");
var PrimitiveButton = typeof primitives.Button === "function" ? primitives.Button : null;
if (!PrimitiveButton && typeof console !== "undefined" && console.warn) {
  console.warn("[dsh-startup-screen] 宿主未导出 ui-primitives.Button，已退回原生按钮");
}
function FallbackButton({ children, ...rest }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", ...rest, children });
}
function Button2(props) {
  const Impl = PrimitiveButton || FallbackButton;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Impl, { ...props });
}

// src/client/components/VoicePicker.jsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function VoicePicker({ value, onChange, onPreview }) {
  const [list, setList] = (0, import_react2.useState)(readVoices);
  (0, import_react2.useEffect)(() => {
    const s = window.speechSynthesis;
    if (!s) return;
    const on = () => setList(readVoices());
    try {
      s.addEventListener("voiceschanged", on);
    } catch (e) {
    }
    const t = setTimeout(on, 400);
    return () => {
      try {
        s.removeEventListener("voiceschanged", on);
      } catch (e) {
      }
      clearTimeout(t);
    };
  }, []);
  const auto = window.__DSH_STARTUP_API__ && window.__DSH_STARTUP_API__.voice;
  const opts = [["", "自动（优先神经网络女声）" + (auto ? " → " + auto : "")]].concat(
    list.map((v) => {
      const name = String(v.name || "").toLowerCase();
      return [v.name, voiceMark(name) + v.name + " · " + (v.lang || "")];
    })
  );
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    Field,
    {
      label: "音色",
      hint: list.length ? "★ 推荐 · ♀ 女声 · 共 " + list.length + " 个" : "暂时读不到系统音色。",
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "__ss_row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Select, { value: value || "", options: opts, onChange }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button2, { className: "__ss_btn", onClick: onPreview, children: "试听" })
      ] })
    }
  );
}

// src/client/ui/Input.jsx
var primitives2 = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
var import_jsx_runtime8 = require("react/jsx-runtime");
var PrimitiveInput = typeof primitives2.Input === "function" ? primitives2.Input : null;
if (!PrimitiveInput && typeof console !== "undefined" && console.warn) {
  console.warn("[dsh-startup-screen] 宿主未导出 ui-primitives.Input，已退回原生输入框");
}
function Input2({ value, placeholder, maxLength, mono, onChange, className, ...rest }) {
  const a11y = useFieldA11y();
  const cls = "__ss_input" + (mono ? " __ss_inputMono" : "") + (className ? " " + className : "");
  const props = Object.assign(
    {
      className: cls,
      type: "text",
      value: value == null ? "" : String(value),
      placeholder: placeholder || "",
      spellCheck: false,
      "aria-labelledby": a11y.labelId,
      "aria-describedby": a11y.hintId,
      onChange: (e) => onChange(e.target.value)
    },
    maxLength ? { maxLength } : null,
    rest
  );
  if (PrimitiveInput) return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(PrimitiveInput, { ...props });
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: cls, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { ...props, className: void 0 }) });
}

// src/client/panel.jsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var BUILD_VERSION = "1.4.0";
function num(v, d) {
  const n = Number(v);
  return isFinite(n) ? n : d;
}
function readInjectedVersion() {
  try {
    const v = window.__DSH_STARTUP_VERSION__;
    return v ? String(v) : "";
  } catch (e) {
    return "";
  }
}
var MODE_OPTIONS = [
  ["session", "每个浏览器会话一次"],
  ["daily", "每天一次"],
  ["always", "每次打开都播放"]
];
var PAGES = [
  ["play", "播放"],
  ["appearance", "外观"],
  ["sound", "声音"],
  ["content", "内容"],
  ["about", "关于"]
];
function Panel() {
  const [draft, setDraft] = (0, import_react3.useState)(null);
  const [file, setFile] = (0, import_react3.useState)("");
  const [version, setVersion] = (0, import_react3.useState)(readInjectedVersion);
  const [error, setError] = (0, import_react3.useState)(null);
  const [notice, setNotice] = (0, import_react3.useState)(null);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [dirty, setDirty] = (0, import_react3.useState)(false);
  const [tab, setTab] = (0, import_react3.useState)("play");
  const contentRef = (0, import_react3.useRef)(null);
  const shellRef = (0, import_react3.useRef)(null);
  function load() {
    setError(null);
    loadConfig().then((j) => {
      setDraft(Object.assign({}, DEFAULTS, j.config));
      setDirty(false);
      setFile(j.file || "");
      if (j.version) setVersion(String(j.version));
    }).catch((e) => setError(e.message));
  }
  (0, import_react3.useEffect)(() => {
    load();
  }, []);
  const ready = draft ? 1 : 0;
  (0, import_react3.useEffect)(
    function() {
      const shell = shellRef.current;
      if (!shell || typeof window === "undefined") return;
      function findScrollParent(el) {
        let p = el && el.parentElement;
        while (p) {
          try {
            const cs = window.getComputedStyle(p);
            if (cs && /(auto|scroll)/.test(cs.overflowY)) return p;
          } catch (e) {
          }
          p = p.parentElement;
        }
        return null;
      }
      const parent = findScrollParent(shell);
      if (!parent) return;
      function fit() {
        try {
          const cs = window.getComputedStyle(parent);
          const h = parent.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
          if (h > 0) shell.style.height = h + "px";
        } catch (e) {
        }
      }
      fit();
      const timer = setTimeout(fit, 0);
      const ro = window.ResizeObserver ? new window.ResizeObserver(fit) : null;
      if (ro) ro.observe(parent);
      window.addEventListener("resize", fit);
      return function() {
        clearTimeout(timer);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", fit);
        try {
          shell.style.height = "";
        } catch (e) {
        }
      };
    },
    [ready]
  );
  function set(key, value) {
    setNotice(null);
    setDirty(true);
    setDraft((d) => Object.assign({}, d, { [key]: value }));
  }
  function save() {
    if (!draft) return;
    setBusy(true);
    setNotice(null);
    setError(null);
    saveConfig(draft).then((j) => {
      setDraft(j.config);
      setDirty(false);
      setNotice("已保存。下次打开 DSH 生效；「立即预览」使用当前修改。");
    }).catch((e) => setError(e.message)).then(() => setBusy(false));
  }
  function reset() {
    try {
      if (typeof window !== "undefined" && typeof window.confirm === "function" && !window.confirm("恢复默认会覆盖当前所有设置，确定吗？"))
        return;
    } catch (e) {
    }
    setBusy(true);
    setNotice(null);
    setError(null);
    resetConfig().then((j) => {
      setDraft(j.config);
      setDirty(false);
      setNotice("已恢复默认。");
    }).catch((e) => setError(e.message)).then(() => setBusy(false));
  }
  function preview() {
    previewConfig(draft);
  }
  function switchTab(key) {
    setTab(key);
    const c = contentRef.current;
    if (c) {
      try {
        c.scrollTop = 0;
      } catch (e) {
      }
    }
  }
  const versionLine = /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_version", children: "版本 v" + (version || BUILD_VERSION) });
  if (!draft) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_root", children: [
      versionLine,
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_status", role: error ? "alert" : "status", children: error ? error : "读取配置中…" }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_actions", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button2, { className: "__ss_btn", onClick: load, children: "重试" }) }) : null
    ] });
  }
  const playGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", id: "__ss_group_play", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "播放" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "启用启动动画",
        hint: "关闭后直接进入主界面。",
        checked: draft.enabled,
        onChange: (v) => set("enabled", v)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "播放时机", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Select, { value: draft.mode, options: MODE_OPTIONS, onChange: (v) => set("mode", v) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "速度倍率", hint: "0.35 慢放 · 1 原速 · 3 快放；默认约 16 秒。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Range,
      {
        value: draft.speed,
        min: 0.35,
        max: 3,
        step: 0.05,
        display: Number(draft.speed).toFixed(2) + "×",
        onChange: (v) => set("speed", v)
      }
    ) })
  ] });
  const interactGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", id: "__ss_group_interact", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "交互" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "需要人工确认",
        hint: "第 1、2 步停下来等按钮或 Enter。",
        checked: draft.requireInteraction,
        onChange: (v) => set("requireInteraction", v)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "允许跳过",
        hint: "右上角显示 SKIP，Esc 也能跳过。",
        checked: draft.allowSkip,
        onChange: (v) => set("allowSkip", v)
      }
    )
  ] });
  const identityGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", id: "__ss_group_identity", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "身份资料" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "身份名称", hint: "终幕欢迎语和第二步身份卡上的名字。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Input2,
      {
        value: draft.identity,
        placeholder: "例如：JOYCE MOORE",
        maxLength: IDENTITY_MAX,
        onChange: (v) => set("identity", v)
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_two", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "身份编号", hint: "第二步身份卡上的编号，建议用数字。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Input2,
        {
          value: draft.identityId,
          mono: true,
          maxLength: IDENTITY_ID_MAX,
          onChange: (v) => set("identityId", v)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "权限等级", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Input2,
        {
          value: draft.accessLevel,
          mono: true,
          maxLength: TEXT_MAX,
          onChange: (v) => set("accessLevel", v)
        }
      ) })
    ] })
  ] });
  const textGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", id: "__ss_group_text", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "品牌与文案" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_two", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "左上 · 主标题", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.brand1, maxLength: TEXT_MAX, onChange: (v) => set("brand1", v) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "左上 · 产品行", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.brand3a, maxLength: TEXT_MAX, onChange: (v) => set("brand3a", v) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_status", "aria-hidden": "true", children: "+" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.brand3b, maxLength: TEXT_MAX, onChange: (v) => set("brand3b", v) })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "左上 · 副标题", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.brand2, maxLength: 40, onChange: (v) => set("brand2", v) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_two", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "黑幕 · 中文", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.orgZh, maxLength: TEXT_MAX, onChange: (v) => set("orgZh", v) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "黑幕 · 英文", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.orgEn, mono: true, maxLength: TEXT_MAX, onChange: (v) => set("orgEn", v) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_two", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "黑幕 · 小字", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.orgSub, mono: true, maxLength: TEXT_MAX, onChange: (v) => set("orgSub", v) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "终幕 · 黑框", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Input2,
        {
          value: draft.welcomeBox,
          maxLength: TEXT_MAX,
          onChange: (v) => set("welcomeBox", v)
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "右下 · 页脚", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input2, { value: draft.footer, mono: true, maxLength: TEXT_MAX, onChange: (v) => set("footer", v) }) })
  ] });
  const voiceGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", id: "__ss_group_voice", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "声音" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_subTitle", children: "语音播报" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "女声播报（念每一行的英文）",
        hint: "文字出现时同步念出英文旁白。",
        checked: draft.voice,
        onChange: (v) => set("voice", v)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "语音来源", hint: "内置真声优先；缺失时自动用系统语音。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Select,
      {
        value: draft.voiceSource || "asset",
        options: [
          ["asset", "真声素材（推荐）"],
          ["tts", "系统 TTS 合成"]
        ],
        onChange: (v) => set("voiceSource", v)
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "播报语言", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Select,
      {
        value: draft.voiceLang,
        options: [
          ["en", "英语（照参考片）"],
          ["zh", "中文"],
          ["both", "中英各念一遍"]
        ],
        onChange: (v) => set("voiceLang", v)
      }
    ) }),
    draft.voice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      VoicePicker,
      {
        value: draft.voiceName,
        onChange: (v) => set("voiceName", v),
        onPreview: () => speakSample(null, draft)
      }
    ) : null,
    draft.voice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Button2,
        {
          className: "__ss_btn",
          onClick: () => {
            set("voiceRate", 0.88);
            set("voicePitch", 0.85);
            set("voiceName", "");
            set("voiceCue", true);
            set("voiceLead", 240);
          },
          children: "↺ 套用「电影旁白」档"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_hint", children: "语速 0.88 · 音调 0.85（压抑、深沉）· 自动挑神经网络女声 · 提示音 + 开口留白" })
    ] }) : null,
    draft.voice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_two", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "语速", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Range,
        {
          value: num(draft.voiceRate, 1),
          min: 0.5,
          max: 2,
          display: num(draft.voiceRate, 1).toFixed(2) + "×",
          onChange: (v) => set("voiceRate", v)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "音调", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Range,
        {
          value: num(draft.voicePitch, 1),
          min: 0,
          max: 2,
          display: num(draft.voicePitch, 1).toFixed(2),
          onChange: (v) => set("voicePitch", v)
        }
      ) })
    ] }) : null,
    draft.voice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "开口前留白", hint: "提示音之后停顿多久再开口。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Range,
      {
        value: num(draft.voiceLead, 240),
        min: 0,
        max: 1200,
        step: 20,
        display: Math.round(num(draft.voiceLead, 240)) + " ms",
        onChange: (v) => set("voiceLead", v)
      }
    ) }) : null,
    draft.voice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "音量", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Range,
      {
        value: num(draft.voiceVolume, 0.9),
        min: 0,
        max: 1,
        display: Math.round(num(draft.voiceVolume, 0.9) * 100) + "%",
        onChange: (v) => set("voiceVolume", v)
      }
    ) }) : null,
    draft.voice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "播报前提示音",
        hint: "开口前响两声轻提示。",
        checked: draft.voiceCue,
        onChange: (v) => set("voiceCue", v)
      }
    ) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_subTitle", children: "界面音效" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "界面音效",
        hint: "按钮、过场和结尾的提示音。",
        checked: draft.sound,
        onChange: (v) => set("sound", v)
      }
    ),
    draft.sound ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "音效来源", hint: "内置素材优先；也可以现场合成。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Select,
      {
        value: draft.sfx || "audio",
        options: [
          ["audio", "内置素材（推荐）"],
          ["synth", "现场合成"]
        ],
        onChange: (v) => set("sfx", v)
      }
    ) }) : null,
    draft.sound ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "音效音量", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Range,
      {
        value: num(draft.soundVolume, 0.5),
        min: 0,
        max: 1,
        display: Math.round(num(draft.soundVolume, 0.5) * 100) + "%",
        onChange: (v) => set("soundVolume", v)
      }
    ) }) : null
  ] });
  const visualGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", id: "__ss_group_visual", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "外观" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_subTitle", children: "主题与背景" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "主题", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Select,
      {
        value: draft.theme,
        options: [
          ["light", "浅色 · 暖白档案底板（参考片原色）"],
          ["dark", "深色 · 暗底板"]
        ],
        onChange: (v) => set("theme", v)
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "环境光效（Canvas 光场 / 氛围层）",
        hint: "背景的星尘、流光和光斑；低端机可关闭。",
        checked: draft.ambient !== false,
        onChange: (v) => set("ambient", v)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_subTitle", children: "液态玻璃" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Switch,
      {
        label: "液态玻璃（透出桌面 / 背后窗口）",
        hint: "底板变成磨砂玻璃，能透出后面的窗口。",
        checked: !!draft.glass,
        onChange: (v) => set("glass", v)
      }
    ),
    draft.glass ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("details", { className: "__ss_details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("summary", { children: "高级玻璃参数" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "玻璃不透明度", hint: "越低越透。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Range,
        {
          value: num(draft.glassOpacity, 0.75),
          min: 0.15,
          max: 0.95,
          step: 0.01,
          display: Math.round(num(draft.glassOpacity, 0.75) * 100) + "%",
          onChange: (v) => set("glassOpacity", v)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "磨砂模糊", hint: "背后的画面糊多少。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Range,
        {
          value: num(draft.glassBlur, 22),
          min: 0,
          max: 60,
          step: 1,
          display: Math.round(num(draft.glassBlur, 22)) + " px",
          onChange: (v) => set("glassBlur", v)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "玻璃饱和度", hint: "透过玻璃看到的颜色浓度。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Range,
        {
          value: num(draft.glassSaturate, 160),
          min: 100,
          max: 200,
          step: 5,
          display: Math.round(num(draft.glassSaturate, 160)) + "%",
          onChange: (v) => set("glassSaturate", v)
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "背景模糊", hint: "单独控制玻璃背后的模糊。", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Range,
        {
          value: num(draft.glassBackdropBlur, 28),
          min: 0,
          max: 80,
          step: 1,
          display: Math.round(num(draft.glassBackdropBlur, 28)) + " px",
          onChange: (v) => set("glassBackdropBlur", v)
        }
      ) })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_subTitle", children: "颜色与特效" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_two", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "强调色 · 橙", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ColorInput, { value: draft.accent, onChange: (v) => set("accent", v) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_status", "aria-hidden": "true", children: draft.accent })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "故障色 · 蓝", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ColorInput, { value: draft.glitchB, onChange: (v) => set("glitchB", v) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_status", "aria-hidden": "true", children: draft.glitchB })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "故障色 · 红", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ColorInput, { value: draft.glitchA || "#ff3b30", onChange: (v) => set("glitchA", v) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_status", "aria-hidden": "true", children: draft.glitchA || "#ff3b30" })
    ] }) })
  ] });
  const aboutGroup = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_groupTitle", children: "关于" }),
    versionLine,
    file ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_barFile", children: [
      "配置文件：",
      file
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_hint", children: "本仓库是 6shenhonghong9/dsh-startup-screen 的 fork；Canvas 光场等视觉方案参考 QIFANAI/dsh-startup-screen 1.6.0（MIT）。" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_hint", children: "「恢复默认」会覆盖当前所有设置；「立即预览」使用当前修改但不写盘。" })
  ] });
  const playPage = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    "div",
    {
      className: "__ss_page",
      id: "__ss_page_play",
      role: "region",
      "aria-labelledby": "__ss_tab_play",
      hidden: tab !== "play",
      children: [
        playGroup,
        interactGroup
      ]
    }
  );
  const appearancePage = /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
    "div",
    {
      className: "__ss_page",
      id: "__ss_page_appearance",
      role: "region",
      "aria-labelledby": "__ss_tab_appearance",
      hidden: tab !== "appearance",
      children: visualGroup
    }
  );
  const soundPage = /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
    "div",
    {
      className: "__ss_page",
      id: "__ss_page_sound",
      role: "region",
      "aria-labelledby": "__ss_tab_sound",
      hidden: tab !== "sound",
      children: voiceGroup
    }
  );
  const contentPage = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    "div",
    {
      className: "__ss_page",
      id: "__ss_page_content",
      role: "region",
      "aria-labelledby": "__ss_tab_content",
      hidden: tab !== "content",
      children: [
        identityGroup,
        textGroup
      ]
    }
  );
  const aboutPage = /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
    "div",
    {
      className: "__ss_page",
      id: "__ss_page_about",
      role: "region",
      "aria-labelledby": "__ss_tab_about",
      hidden: tab !== "about",
      children: aboutGroup
    }
  );
  const nav = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("nav", { className: "__ss_nav", "aria-label": "启动动画设置", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_navTitle", children: "启动动画" }),
    PAGES.map((p) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "button",
      {
        id: "__ss_tab_" + p[0],
        type: "button",
        className: "__ss_navItem" + (tab === p[0] ? " __ss_navItemActive" : ""),
        "aria-controls": "__ss_page_" + p[0],
        "aria-current": tab === p[0] ? "page" : void 0,
        onClick: () => switchTab(p[0]),
        children: p[1]
      },
      p[0]
    )),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_navVersion", children: "v" + (version || BUILD_VERSION) })
  ] });
  const footer = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_footer", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button2, { className: "__ss_btn __ss_btnPrimary", disabled: busy, onClick: save, children: busy ? "处理中…" : "保存" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button2, { className: "__ss_btn", onClick: preview, children: "立即预览" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button2, { className: "__ss_btn", disabled: busy, onClick: reset, children: "恢复默认" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_barHint", children: [
      "关闭弹窗不会保存；保存后下次启动生效；「立即预览」使用当前修改（不写盘）。",
      dirty ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_dirty", children: " ● 未保存" }) : null,
      notice ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_ok", role: "status", children: notice }) : null,
      error ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "__ss_err", role: "alert", children: error }) : null
    ] })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_root", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "__ss_shell", ref: shellRef, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_layout", children: [
    nav,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "__ss_content", ref: contentRef, children: [
        playPage,
        appearancePage,
        soundPage,
        contentPage,
        aboutPage
      ] }),
      footer
    ] })
  ] }) }) });
}

// src/client/styles.js
var CSS = [
  '.__ss_root{max-width:620px;display:flex;flex-direction:column;gap:14px;font-family:"Segoe UI Variable Text","Segoe UI","Noto Sans SC","Microsoft YaHei UI","Microsoft YaHei","PingFang SC",sans-serif;font-size:13.5px;line-height:1.5;-webkit-font-smoothing:auto;text-rendering:auto;color:var(--dsw-alias-label-primary)}',
  ".__ss_version{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_group{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:var(--dsw-radius-md,12px);padding:12px 14px;display:flex;flex-direction:column;gap:11px}",
  ".__ss_groupTitle{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}",
  '.__ss_groupTitle::after{content:"";flex:1;height:1px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.2))}',
  ".__ss_subTitle{font-size:11.5px;font-weight:600;letter-spacing:.06em;color:var(--dsw-alias-label-tertiary);margin-top:2px}",
  ".__ss_shell{display:flex;flex-direction:column;height:100%;min-height:420px}",
  ".__ss_layout{display:flex;flex:1;min-height:0;gap:16px}",
  ".__ss_nav{width:124px;flex:none;display:flex;flex-direction:column;gap:4px;border-right:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));padding-right:12px}",
  ".__ss_navTitle{font-size:12px;font-weight:600;letter-spacing:.08em;color:var(--dsw-alias-label-tertiary);padding:2px 8px 6px}",
  ".__ss_navItem{position:relative;text-align:left;border:0;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:var(--dsw-radius-md,12px);padding:8px 12px;font:inherit;font-size:13.5px;cursor:pointer}",
  ".__ss_navItem:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.12))}",
  ".__ss_navItemActive{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.12));font-weight:600}",
  ".__ss_navItem:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:-2px}",
  ".__ss_navVersion{margin-top:auto;padding:10px 8px 0;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_main{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}",
  ".__ss_content{flex:1;min-height:0;overflow-y:auto;padding-right:6px;display:flex;flex-direction:column;gap:14px}",
  ".__ss_page{display:flex;flex-direction:column;gap:14px}",
  ".__ss_page[hidden]{display:none}",
  ".__ss_details{border-top:1px dashed var(--dsw-alias-border-l2);padding-top:8px;display:flex;flex-direction:column;gap:10px}",
  ".__ss_details summary{cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}",
  ".__ss_field{display:flex;flex-direction:column;gap:6px}",
  ".__ss_label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}",
  ".__ss_labelText{display:block}",
  ".__ss_hint{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
  /* 输入框是宿主 primitives.Input：类名落在外层 span 上，内层才是原生 input */
  ".__ss_input{display:block;box-sizing:border-box;width:100%;min-width:0;height:auto;padding:0;border:0;background:none}",
  ".__ss_input input{box-sizing:border-box;width:100%;height:34px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l4,rgba(127,127,127,.28));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08));font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);outline:none}",
  ".__ss_input input:focus{border-color:var(--dsw-alias-state-business-primary,#4176e6)}",
  ".__ss_inputMono input{font-family:ui-monospace,Consolas,monospace;font-size:12px;letter-spacing:.06em}",
  ".__ss_select{box-sizing:border-box;height:34px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4,rgba(127,127,127,.28));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08));color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;min-width:180px}",
  ".__ss_select:focus{border-color:var(--dsw-alias-state-business-primary,#4176e6);outline:none}",
  ".__ss_check{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;padding:2px 0}",
  ".__ss_check input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}",
  ".__ss_switch{order:2;position:relative;flex:none;box-sizing:border-box;width:36px;height:20px;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3,#dcdfe6);transition:background 180ms ease}",
  ".__ss_switch i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-switch-thumb,#fff);transition:transform 180ms cubic-bezier(.2,.8,.2,1)}",
  ".__ss_check input:checked + .__ss_switch{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-state-business-primary,#4176e6))}",
  ".__ss_check input:checked + .__ss_switch i{transform:translateX(16px);background:var(--dsw-alias-label-primary-foreground,#fff)}",
  ".__ss_check input:focus-visible + .__ss_switch{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}",
  ".__ss_checkText{order:1;flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}",
  ".__ss_range{flex:1 1 200px;-webkit-appearance:none;appearance:none;height:18px;background:transparent;cursor:pointer}",
  ".__ss_range::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(90deg,var(--dsw-alias-state-business-primary,#4176e6) 0 var(--ss-fill,50%),var(--dsw-alias-border-l2,rgba(127,127,127,.28)) var(--ss-fill,50%))}",
  ".__ss_range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-5.5px;border-radius:50%;background:#fff;border:2px solid var(--dsw-alias-state-business-primary,#4176e6);box-shadow:0 1px 3px rgba(0,0,0,.22)}",
  ".__ss_range::-moz-range-track{height:3px;border-radius:2px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.28))}",
  ".__ss_range::-moz-range-progress{height:3px;border-radius:2px;background:var(--dsw-alias-state-business-primary,#4176e6)}",
  ".__ss_range::-moz-range-thumb{width:12px;height:12px;border:2px solid var(--dsw-alias-state-business-primary,#4176e6);border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.22)}",
  ".__ss_two{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
  ".__ss_actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:2px}",
  /* 固定底栏：在右侧内容区之外，不随内容滚动 */
  ".__ss_footer{flex:none;margin-top:8px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));background:var(--dsw-alias-bg-layer-1,#fff);display:flex;flex-direction:column;gap:6px}",
  ".__ss_barHint{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary);word-break:break-all}",
  ".__ss_barFile{display:block;opacity:.85;font-family:ui-monospace,Consolas,monospace;font-size:11px}",
  ".__ss_dirty{font-size:12px;color:var(--dsw-alias-state-business-primary,#4176e6);font-weight:600}",
  ".__ss_btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border:0;border-radius:var(--dsw-radius-md,12px);background:transparent;box-shadow:inset 0 0 0 var(--dsh-hairline-width,.5px) var(--dsh-button-outline-color,var(--dsw-alias-border-l3,rgba(127,127,127,.28)));color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}",
  ".__ss_btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
  ".__ss_btn:disabled{opacity:.4;cursor:not-allowed}",
  ".__ss_btnPrimary{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-state-business-primary,#4176e6));color:var(--dsw-alias-label-primary-foreground,#fff);box-shadow:none}",
  ".__ss_btnPrimary:hover:not(:disabled){background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-state-business-primary,#4176e6));filter:brightness(1.06)}",
  ".__ss_btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}",
  ".__ss_select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}",
  ".__ss_range:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px;border-radius:9px}",
  ".__ss_swatch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}",
  ".__ss_status{font-size:12.5px;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_ok{font-size:12.5px;color:var(--dsw-alias-state-business-primary,#4176e6)}",
  ".__ss_err{font-size:12.5px;color:var(--dsw-alias-state-error-primary,#f85149)}",
  ".__ss_swatch{width:38px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:8px;background:transparent;cursor:pointer}",
  ".__ss_preview{margin-top:2px;border:1px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:var(--dsw-radius-md,12px);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}",
  ".__ss_previewText{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.5}"
].join("");
var TAG_ID = "dsh-startup-screen/main.css";
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="' + TAG_ID + '"]') !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-startup-screen";
  tag.dataset.pluginCss = TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// src/client/index.jsx
var import_jsx_runtime10 = require("react/jsx-runtime");
injectStyles();
function readFlag(store, key) {
  try {
    const s = window[store];
    return s ? s.getItem(key) : null;
  } catch (e) {
    return null;
  }
}
function markBooted() {
  try {
    window.__DSH_STARTUP_BOOT__ = "client";
  } catch (e) {
  }
}
function loadScript(src, fail) {
  const s = document.createElement("script");
  s.src = src;
  s.async = false;
  if (typeof fail === "function") {
    s.addEventListener("load", () => fail(null));
    s.addEventListener("error", () => fail(new Error("script load failed: " + src)));
  }
  ;
  (document.head || document.documentElement).appendChild(s);
}
function loadCss(href, fail) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  if (typeof fail === "function") {
    link.addEventListener("load", () => fail(null));
    link.addEventListener("error", () => fail(new Error("css load failed: " + href)));
  }
  ;
  (document.head || document.documentElement).appendChild(link);
}
function release(ok) {
  if (ok) return;
  try {
    const r = document.getElementById("dsh-startup-root");
    if (r && r.parentNode) r.parentNode.removeChild(r);
    if (document.documentElement.classList) document.documentElement.classList.remove("dsu-lock");
    if (document.body && document.body.style) document.body.style.overflow = "";
    window.__DSH_STARTUP_FAILED__ = true;
  } catch (e) {
  }
}
function injectRoot(cfg) {
  let root = document.getElementById("dsh-startup-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "dsh-startup-root";
    document.body.appendChild(root);
  }
  root.className = "dsu-root dsu-boot";
  if (document.documentElement.classList) document.documentElement.classList.add("dsu-lock");
  if (document.body && document.body.style) document.body.style.overflow = "hidden";
  let failed = false;
  let cssReady = false;
  let scriptReady = false;
  let readyCalled = false;
  function guard(err) {
    if (err) {
      if (!failed && typeof console !== "undefined" && console.warn) {
        console.warn("[dsh-startup-screen] 启动界面自举失败，已放开页面：", err.message);
      }
      failed = true;
      release(false);
      return;
    }
    if (cssReady && scriptReady && !readyCalled) {
      readyCalled = true;
      release(true);
    }
  }
  loadCss(ROUTES.css, (err) => {
    if (err) {
      guard(err);
      return;
    }
    cssReady = true;
    guard(null);
  });
  window.__DSH_STARTUP__ = cfg || {};
  try {
    delete window.__DSH_STARTUP_LOADED__;
  } catch (e) {
    window.__DSH_STARTUP_LOADED__ = void 0;
  }
  loadScript(ROUTES.splash + "?t=" + Date.now(), (err) => {
    if (err) {
      guard(err);
      return;
    }
    scriptReady = true;
    guard(null);
  });
  setTimeout(() => {
    try {
      const r = document.getElementById("dsh-startup-root");
      if (r && r.className && r.className.indexOf("dsu-boot") !== -1) release(false);
    } catch (e) {
    }
  }, 9e3);
}
function loadSkippedRuntime(cfg) {
  window.__DSH_STARTUP__ = cfg || {};
  window.__DSH_STARTUP_SKIP__ = true;
  try {
    delete window.__DSH_STARTUP_LOADED__;
  } catch (e) {
    window.__DSH_STARTUP_LOADED__ = void 0;
  }
  loadCss(ROUTES.css, null);
  loadScript(ROUTES.splash + "?t=" + Date.now(), null);
}
function selfBoot() {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (!document.body) return;
    if (window.__DSH_STARTUP_BOOT__) return;
    if (window.__DSH_STARTUP__) return;
    if (document.getElementById("dsh-startup-root")) return;
    if (window.__DSH_STARTUP_FAILED__ === true) return;
    markBooted();
    fetch(API, { headers: { Accept: "application/json" } }).then((r) => r.json()).then((j) => {
      if (!j || j.ok !== true) return null;
      const cfg = j.config || null;
      if (cfg && j.facts) cfg.facts = j.facts;
      return cfg;
    }).catch(() => null).then((cfg) => {
      cfg = cfg || { enabled: true, mode: "session", speed: 1 };
      if (cfg.enabled === false) {
        loadSkippedRuntime(cfg);
        return;
      }
      const today = localDayKey();
      const shownThisSession = cfg.mode === "session" && readFlag("sessionStorage", "dsh-startup-screen:shown") === "1";
      const playedToday = cfg.mode === "daily" && readFlag("localStorage", "dsh-startup-screen:day") === today;
      if (shownThisSession || playedToday) {
        loadSkippedRuntime(cfg);
        return;
      }
      injectRoot(cfg);
    }).catch(() => {
    });
  } catch (e) {
  }
}
var inject = ["slots"];
function apply(ctx) {
  selfBoot();
  ctx.slots.inject("settings.section", () => {
    return ctx.slots.register(
      { name: "settings.section", id: "startup-screen", order: 26, label: "启动动画" },
      () => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Panel, {})
    );
  });
}
    return module.exports;
  }
})
