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
var react = __toESM(require("react"), 1);
var h = react.createElement;
var API = "/dsh-startup/config";
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
  ".__ss_navVersion{margin-top:auto;padding:10px 8px 0;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_main{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}",
  ".__ss_content{flex:1;min-height:0;overflow-y:auto;padding-right:6px;display:flex;flex-direction:column;gap:14px}",
  ".__ss_page{display:flex;flex-direction:column;gap:14px}",
  ".__ss_page[hidden]{display:none}",
  ".__ss_details{border-top:1px dashed var(--dsw-alias-border-l2);padding-top:8px;display:flex;flex-direction:column;gap:10px}",
  ".__ss_details summary{cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}",
  ".__ss_field{display:flex;flex-direction:column;gap:6px}",
  ".__ss_label{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}",
  ".__ss_hint{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
  ".__ss_input{box-sizing:border-box;width:100%;height:34px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l4,rgba(127,127,127,.28));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08));font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);outline:none}",
  ".__ss_input:focus{border-color:var(--dsw-alias-state-business-primary,#4176e6)}",
  ".__ss_inputMono{font-family:ui-monospace,Consolas,monospace;font-size:12px;letter-spacing:.06em}",
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
  ".__ss_status{font-size:12.5px;color:var(--dsw-alias-label-tertiary)}",
  ".__ss_ok{font-size:12.5px;color:var(--dsw-alias-state-business-primary,#4176e6)}",
  ".__ss_err{font-size:12.5px;color:var(--dsw-alias-state-error-primary,#f85149)}",
  ".__ss_swatch{width:38px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:8px;background:transparent;cursor:pointer}",
  ".__ss_preview{margin-top:2px;border:1px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.2));border-radius:var(--dsw-radius-md,12px);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}",
  ".__ss_previewText{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.5}"
].join("");
var tagId = "dsh-startup-screen/main.css";
if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
  tag = document.createElement("style");
  tag.dataset.plugin = "dsh-startup-screen";
  tag.dataset.pluginCss = tagId;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
var tag;
function Field(props) {
  return h(
    "div",
    { className: "__ss_field" },
    h("label", { className: "__ss_label" }, props.label),
    props.children,
    props.hint ? h("div", { className: "__ss_hint" }, props.hint) : null
  );
}
function TextInput(props) {
  return h("input", {
    className: "__ss_input" + (props.mono ? " __ss_inputMono" : ""),
    type: "text",
    value: props.value == null ? "" : String(props.value),
    placeholder: props.placeholder || "",
    maxLength: props.maxLength || 64,
    spellCheck: false,
    onChange: (e) => props.onChange(e.target.value)
  });
}
function Select(props) {
  return h("select", {
    className: "__ss_select",
    value: props.value,
    onChange: (e) => props.onChange(e.target.value)
  }, props.options.map((o) => h("option", { key: o[0], value: o[0] }, o[1])));
}
function Check(props) {
  return h(
    "label",
    { className: "__ss_check" },
    h("input", {
      type: "checkbox",
      checked: !!props.checked,
      onChange: (e) => props.onChange(e.target.checked)
    }),
    h("span", { className: "__ss_switch", "aria-hidden": "true" }, h("i")),
    h(
      "span",
      { className: "__ss_checkText" },
      h("span", null, props.label),
      props.hint ? h("span", { className: "__ss_hint" }, props.hint) : null
    )
  );
}
function ColorInput(props) {
  return h("input", {
    className: "__ss_swatch",
    type: "color",
    value: props.value,
    onChange: (e) => props.onChange(e.target.value)
  });
}
function Range(props) {
  var min = Number(props.min);
  var max = Number(props.max);
  var val = Number(props.value);
  var pct = max > min ? Math.max(0, Math.min(100, (val - min) / (max - min) * 100)) : 0;
  return h(
    "div",
    { className: "__ss_row" },
    h("input", {
      type: "range",
      className: "__ss_range",
      min: props.min,
      max: props.max,
      step: props.step || 0.05,
      value: props.value,
      style: { flex: "1 1 200px", "--ss-fill": pct + "%" },
      onChange: (e) => props.onChange(Number(e.target.value))
    }),
    h("span", { className: "__ss_status" }, props.display)
  );
}
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
  "\u6653\u6653",
  "\u6653\u4F0A",
  "\u5973\u58F0"
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
  for (var i = 0; i < list.length; i++) if (name.indexOf(list[i]) !== -1) return true;
  return false;
}
function scoreVoice(name, lang, want) {
  var sc = 0;
  if (hits(name, NATURAL_HINTS)) sc += 60;
  if (hits(name, FEMALE_HINTS)) sc += 40;
  if (hits(name, MALE_HINTS)) sc -= 45;
  if (String(lang || "").indexOf(want) === 0) sc += 25;
  return sc;
}
function readVoices() {
  try {
    var s = window.speechSynthesis;
    if (!s || typeof s.getVoices !== "function") return [];
    var list = s.getVoices() || [];
    var want = "en";
    var scored = list.map(function(v, i) {
      var name = String(v.name || "").toLowerCase();
      return {
        v,
        natural: hits(name, NATURAL_HINTS),
        female: hits(name, FEMALE_HINTS),
        sc: scoreVoice(name, String(v.lang || "").toLowerCase(), want),
        i
      };
    });
    scored.sort(function(a, b) {
      if (a.sc !== b.sc) return b.sc - a.sc;
      return a.i - b.i;
    });
    return scored.map(function(x) {
      return x.v;
    });
  } catch (e) {
    return [];
  }
}
function speakSample(text, draft) {
  try {
    var s = window.speechSynthesis;
    if (!s) return false;
    s.cancel();
    var u = new window.SpeechSynthesisUtterance(text || "Access permission required.");
    var list = readVoices();
    var target = null;
    for (var i = 0; i < list.length; i++) if (list[i].name === draft.voiceName) target = list[i];
    if (target) {
      u.voice = target;
      u.lang = target.lang;
    }
    u.rate = Math.min(2, Math.max(0.5, Number(draft.voiceRate) || 1));
    u.pitch = Math.min(2, Math.max(0, Number(draft.voicePitch) || 1));
    u.volume = Math.min(1, Math.max(0, draft.voiceVolume == null || draft.voiceVolume === "" ? 0.9 : Number(draft.voiceVolume)));
    if (draft.voiceLang === "zh") {
      u.text = "\u9700\u8981\u8BBF\u95EE\u8BB8\u53EF\uFF0C\u9A8C\u8BC1\u901A\u8FC7\u3002";
      u.lang = "zh-CN";
    }
    s.speak(u);
    return true;
  } catch (e) {
    return false;
  }
}
function VoicePicker(props) {
  var [list, setList] = react.useState(readVoices);
  react.useEffect(function() {
    var s = window.speechSynthesis;
    if (!s) return;
    var on = function() {
      setList(readVoices());
    };
    try {
      s.addEventListener("voiceschanged", on);
    } catch (e) {
    }
    var t = setTimeout(on, 400);
    return function() {
      try {
        s.removeEventListener("voiceschanged", on);
      } catch (e) {
      }
      clearTimeout(t);
    };
  }, []);
  var auto = window.__DSH_STARTUP_API__ && window.__DSH_STARTUP_API__.voice;
  var opts = [["", "\u81EA\u52A8\uFF08\u4F18\u5148\u795E\u7ECF\u7F51\u7EDC\u5973\u58F0\uFF09" + (auto ? " \u2192 " + auto : "")]].concat(
    list.map(function(v) {
      var name = String(v.name || "").toLowerCase();
      var mark = hits(name, NATURAL_HINTS) ? "\u2605 " : hits(name, FEMALE_HINTS) ? "\u2640 " : "";
      return [v.name, mark + v.name + " \xB7 " + (v.lang || "")];
    })
  );
  return h(
    "div",
    { className: "__ss_field" },
    h("label", { className: "__ss_label" }, "\u97F3\u8272"),
    h(
      "div",
      { className: "__ss_row" },
      h(Select, { value: props.value || "", options: opts, onChange: props.onChange }),
      h("button", {
        className: "__ss_btn",
        type: "button",
        onClick: props.onPreview
      }, "\u8BD5\u542C")
    ),
    h(
      "div",
      { className: "__ss_hint" },
      list.length ? "\u2605 \u63A8\u8350 \xB7 \u2640 \u5973\u58F0 \xB7 \u5171 " + list.length + " \u4E2A" : "\u6682\u65F6\u8BFB\u4E0D\u5230\u7CFB\u7EDF\u97F3\u8272\u3002"
    )
  );
}
var FALLBACK = {
  voice: true,
  voiceLang: "en",
  voiceName: "",
  voiceRate: 0.88,
  voicePitch: 0.85,
  voiceVolume: 0.9,
  voiceCue: true,
  voiceLead: 240,
  voiceSource: "asset",
  sound: true,
  soundVolume: 0.5,
  ambient: true,
  glass: false,
  glassOpacity: 0.75,
  glassBlur: 22,
  glassSaturate: 160,
  glassBackdropBlur: 28
};
function num(v, d) {
  var n = Number(v);
  return isFinite(n) ? n : d;
}
var FALLBACK_VERSION = "1.4.0";
function readInjectedVersion() {
  try {
    var v = window.__DSH_STARTUP_VERSION__;
    return v ? String(v) : "";
  } catch (e) {
    return "";
  }
}
function Panel() {
  var [draft, setDraft] = react.useState(null);
  var [defaults, setDefaults] = react.useState(null);
  var [file, setFile] = react.useState("");
  var [version, setVersion] = react.useState(readInjectedVersion);
  var [error, setError] = react.useState(null);
  var [notice, setNotice] = react.useState(null);
  var [busy, setBusy] = react.useState(false);
  var [dirty, setDirty] = react.useState(false);
  var [tab, setTab] = react.useState("play");
  var contentRef = react.useRef(null);
  var shellRef = react.useRef(null);
  function load() {
    setError(null);
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function() {
      ctrl.abort();
    }, 8e3) : null;
    function stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    var init = { headers: { Accept: "application/json" } };
    if (ctrl) init.signal = ctrl.signal;
    return fetch(API, init).then((r) => r.json()).then((j) => {
      stop();
      if (!j || j.ok !== true) throw new Error(j && j.error || "load failed");
      setDraft(Object.assign({}, FALLBACK, j.config));
      setDefaults(Object.assign({}, FALLBACK, j.defaults));
      setDirty(false);
      setFile(j.file || "");
      if (j.version) setVersion(String(j.version));
    }).catch((e) => {
      stop();
      if (ctrl && ctrl.signal.aborted) {
        setError("\u8BFB\u53D6\u914D\u7F6E\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
        return;
      }
      setError("\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1A" + String(e && e.message ? e.message : e));
    });
  }
  react.useEffect(() => {
    load();
  }, []);
  react.useEffect(function() {
    var shell = shellRef.current;
    if (!shell || typeof window === "undefined") return;
    function findScrollParent(el) {
      var p = el && el.parentElement;
      while (p) {
        try {
          var cs = window.getComputedStyle(p);
          if (cs && /(auto|scroll)/.test(cs.overflowY)) return p;
        } catch (e) {
        }
        p = p.parentElement;
      }
      return null;
    }
    var parent = findScrollParent(shell);
    if (!parent) return;
    function fit() {
      try {
        var cs = window.getComputedStyle(parent);
        var h2 = parent.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
        if (h2 > 0) shell.style.height = h2 + "px";
      } catch (e) {
      }
    }
    fit();
    var timer = setTimeout(fit, 0);
    var ro = window.ResizeObserver ? new window.ResizeObserver(fit) : null;
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
  }, [draft ? 1 : 0]);
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
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: draft })
    }).then((r) => r.json()).then((j) => {
      if (!j || j.ok !== true) throw new Error(j && j.error || "save failed");
      setDraft(j.config);
      setDirty(false);
      setNotice("\u5DF2\u4FDD\u5B58\u3002\u4E0B\u6B21\u6253\u5F00 DSH \u751F\u6548\uFF1B\u300C\u7ACB\u5373\u9884\u89C8\u300D\u4F7F\u7528\u5F53\u524D\u4FEE\u6539\u3002");
    }).catch((e) => setError("\u4FDD\u5B58\u5931\u8D25\uFF1A" + String(e && e.message ? e.message : e))).then(() => setBusy(false));
  }
  function reset() {
    try {
      if (typeof window !== "undefined" && typeof window.confirm === "function" && !window.confirm("\u6062\u590D\u9ED8\u8BA4\u4F1A\u8986\u76D6\u5F53\u524D\u6240\u6709\u8BBE\u7F6E\uFF0C\u786E\u5B9A\u5417\uFF1F")) return;
    } catch (e) {
    }
    setBusy(true);
    setNotice(null);
    setError(null);
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" })
    }).then((r) => r.json()).then((j) => {
      if (!j || j.ok !== true) throw new Error(j && j.error || "reset failed");
      setDraft(j.config);
      setDirty(false);
      setNotice("\u5DF2\u6062\u590D\u9ED8\u8BA4\u3002");
    }).catch((e) => setError("\u6062\u590D\u9ED8\u8BA4\u5931\u8D25\uFF1A" + String(e && e.message ? e.message : e))).then(() => setBusy(false));
  }
  function preview() {
    try {
      var base = window.__DSH_STARTUP__ && typeof window.__DSH_STARTUP__ === "object" ? window.__DSH_STARTUP__ : {};
      window.__DSH_STARTUP__ = Object.assign({}, base, draft || {});
    } catch (e) {
    }
    var api = window.__DSH_STARTUP_API__;
    if (api && typeof api.replay === "function") {
      var threw = false;
      try {
        api.replay();
      } catch (e) {
        threw = true;
      }
      setTimeout(function() {
        if (threw) {
          window.location.reload();
          return;
        }
        var root = document.getElementById("dsh-startup-root");
        var running = window.__DSH_STARTUP_RUNNING__ === true;
        if (!root && !running) window.location.reload();
      }, 1200);
      return;
    }
    window.location.reload();
  }
  var versionLine = h("div", { className: "__ss_version" }, "\u7248\u672C v" + (version || FALLBACK_VERSION));
  if (!draft) {
    return h(
      "div",
      { className: "__ss_root" },
      versionLine,
      h("div", { className: "__ss_status" }, error ? error : "\u8BFB\u53D6\u914D\u7F6E\u4E2D\u2026"),
      error ? h(
        "div",
        { className: "__ss_actions" },
        h("button", { className: "__ss_btn", onClick: load }, "\u91CD\u8BD5")
      ) : null
    );
  }
  var modeOptions = [
    ["session", "\u6BCF\u4E2A\u6D4F\u89C8\u5668\u4F1A\u8BDD\u4E00\u6B21"],
    ["daily", "\u6BCF\u5929\u4E00\u6B21"],
    ["always", "\u6BCF\u6B21\u6253\u5F00\u90FD\u64AD\u653E"]
  ];
  var PAGES = [
    ["play", "\u64AD\u653E"],
    ["appearance", "\u5916\u89C2"],
    ["sound", "\u58F0\u97F3"],
    ["content", "\u5185\u5BB9"],
    ["about", "\u5173\u4E8E"]
  ];
  function switchTab(key) {
    setTab(key);
    var c = contentRef.current;
    if (c) {
      try {
        c.scrollTop = 0;
      } catch (e) {
      }
    }
  }
  var playGroup = h(
    "div",
    { className: "__ss_group", id: "__ss_group_play" },
    h("div", { className: "__ss_groupTitle" }, "\u64AD\u653E"),
    h(Check, {
      label: "\u542F\u7528\u542F\u52A8\u52A8\u753B",
      hint: "\u5173\u95ED\u540E\u76F4\u63A5\u8FDB\u5165\u4E3B\u754C\u9762\u3002",
      checked: draft.enabled,
      onChange: (v) => set("enabled", v)
    }),
    h(
      Field,
      { label: "\u64AD\u653E\u65F6\u673A" },
      h(Select, { value: draft.mode, options: modeOptions, onChange: (v) => set("mode", v) })
    ),
    h(
      Field,
      { label: "\u901F\u5EA6\u500D\u7387", hint: "0.35 \u6162\u653E \xB7 1 \u539F\u901F \xB7 3 \u5FEB\u653E\uFF1B\u9ED8\u8BA4\u7EA6 16 \u79D2\u3002" },
      h(Range, {
        value: draft.speed,
        min: 0.35,
        max: 3,
        step: 0.05,
        display: Number(draft.speed).toFixed(2) + "\xD7",
        onChange: (v) => set("speed", v)
      })
    )
  );
  var interactGroup = h(
    "div",
    { className: "__ss_group", id: "__ss_group_interact" },
    h("div", { className: "__ss_groupTitle" }, "\u4EA4\u4E92"),
    h(Check, {
      label: "\u9700\u8981\u4EBA\u5DE5\u786E\u8BA4",
      hint: "\u7B2C 1\u30012 \u6B65\u505C\u4E0B\u6765\u7B49\u6309\u94AE\u6216 Enter\u3002",
      checked: draft.requireInteraction,
      onChange: (v) => set("requireInteraction", v)
    }),
    h(Check, {
      label: "\u5141\u8BB8\u8DF3\u8FC7",
      hint: "\u53F3\u4E0A\u89D2\u663E\u793A SKIP\uFF0CEsc \u4E5F\u80FD\u8DF3\u8FC7\u3002",
      checked: draft.allowSkip,
      onChange: (v) => set("allowSkip", v)
    })
  );
  var identityGroup = h(
    "div",
    { className: "__ss_group", id: "__ss_group_identity" },
    h("div", { className: "__ss_groupTitle" }, "\u8EAB\u4EFD\u8D44\u6599"),
    h(Field, {
      label: "\u8EAB\u4EFD\u540D\u79F0",
      hint: "\u7EC8\u5E55\u6B22\u8FCE\u8BED\u548C\u7B2C\u4E8C\u6B65\u8EAB\u4EFD\u5361\u4E0A\u7684\u540D\u5B57\u3002"
    }, h(TextInput, { value: draft.identity, placeholder: "\u4F8B\u5982\uFF1AJOYCE MOORE", onChange: (v) => set("identity", v) })),
    h(
      "div",
      { className: "__ss_two" },
      h(
        Field,
        { label: "\u8EAB\u4EFD\u7F16\u53F7", hint: "\u7B2C\u4E8C\u6B65\u8EAB\u4EFD\u5361\u4E0A\u7684\u7F16\u53F7\uFF0C\u5EFA\u8BAE\u7528\u6570\u5B57\u3002" },
        h(TextInput, { value: draft.identityId, mono: true, onChange: (v) => set("identityId", v) })
      ),
      h(
        Field,
        { label: "\u6743\u9650\u7B49\u7EA7" },
        h(TextInput, { value: draft.accessLevel, mono: true, onChange: (v) => set("accessLevel", v) })
      )
    )
  );
  var textGroup = h(
    "div",
    { className: "__ss_group", id: "__ss_group_text" },
    h("div", { className: "__ss_groupTitle" }, "\u54C1\u724C\u4E0E\u6587\u6848"),
    h(
      "div",
      { className: "__ss_two" },
      h(Field, { label: "\u5DE6\u4E0A \xB7 \u4E3B\u6807\u9898" }, h(TextInput, { value: draft.brand1, onChange: (v) => set("brand1", v) })),
      h(
        Field,
        { label: "\u5DE6\u4E0A \xB7 \u4EA7\u54C1\u884C" },
        h(
          "div",
          { className: "__ss_row" },
          h(TextInput, { value: draft.brand3a, onChange: (v) => set("brand3a", v) }),
          h("span", { className: "__ss_status" }, "+"),
          h(TextInput, { value: draft.brand3b, onChange: (v) => set("brand3b", v) })
        )
      )
    ),
    h(Field, { label: "\u5DE6\u4E0A \xB7 \u526F\u6807\u9898" }, h(TextInput, { value: draft.brand2, maxLength: 40, onChange: (v) => set("brand2", v) })),
    h(
      "div",
      { className: "__ss_two" },
      h(Field, { label: "\u9ED1\u5E55 \xB7 \u4E2D\u6587" }, h(TextInput, { value: draft.orgZh, onChange: (v) => set("orgZh", v) })),
      h(Field, { label: "\u9ED1\u5E55 \xB7 \u82F1\u6587" }, h(TextInput, { value: draft.orgEn, mono: true, onChange: (v) => set("orgEn", v) }))
    ),
    h(
      "div",
      { className: "__ss_two" },
      h(Field, { label: "\u9ED1\u5E55 \xB7 \u5C0F\u5B57" }, h(TextInput, { value: draft.orgSub, mono: true, onChange: (v) => set("orgSub", v) })),
      h(Field, { label: "\u7EC8\u5E55 \xB7 \u9ED1\u6846" }, h(TextInput, { value: draft.welcomeBox, onChange: (v) => set("welcomeBox", v) }))
    ),
    h(Field, { label: "\u53F3\u4E0B \xB7 \u9875\u811A" }, h(TextInput, { value: draft.footer, mono: true, onChange: (v) => set("footer", v) }))
  );
  var voiceGroup = h(
    "div",
    { className: "__ss_group", id: "__ss_group_voice" },
    h("div", { className: "__ss_groupTitle" }, "\u58F0\u97F3"),
    h("div", { className: "__ss_subTitle" }, "\u8BED\u97F3\u64AD\u62A5"),
    h(Check, {
      label: "\u5973\u58F0\u64AD\u62A5\uFF08\u5FF5\u6BCF\u4E00\u884C\u7684\u82F1\u6587\uFF09",
      hint: "\u6587\u5B57\u51FA\u73B0\u65F6\u540C\u6B65\u5FF5\u51FA\u82F1\u6587\u65C1\u767D\u3002",
      checked: draft.voice,
      onChange: (v) => set("voice", v)
    }),
    h(
      Field,
      {
        label: "\u8BED\u97F3\u6765\u6E90",
        hint: "\u5185\u7F6E\u771F\u58F0\u4F18\u5148\uFF1B\u7F3A\u5931\u65F6\u81EA\u52A8\u7528\u7CFB\u7EDF\u8BED\u97F3\u3002"
      },
      h(Select, {
        value: draft.voiceSource || "asset",
        options: [["asset", "\u771F\u58F0\u7D20\u6750\uFF08\u63A8\u8350\uFF09"], ["tts", "\u7CFB\u7EDF TTS \u5408\u6210"]],
        onChange: (v) => set("voiceSource", v)
      })
    ),
    h(
      Field,
      { label: "\u64AD\u62A5\u8BED\u8A00" },
      h(Select, {
        value: draft.voiceLang,
        options: [["en", "\u82F1\u8BED\uFF08\u7167\u53C2\u8003\u7247\uFF09"], ["zh", "\u4E2D\u6587"], ["both", "\u4E2D\u82F1\u5404\u5FF5\u4E00\u904D"]],
        onChange: (v) => set("voiceLang", v)
      })
    ),
    draft.voice ? h(VoicePicker, {
      value: draft.voiceName,
      onChange: (v) => set("voiceName", v),
      onPreview: () => speakSample(null, draft)
    }) : null,
    draft.voice ? h(
      "div",
      { className: "__ss_row" },
      h("button", {
        className: "__ss_btn",
        type: "button",
        onClick: () => {
          set("voiceRate", 0.88);
          set("voicePitch", 0.85);
          set("voiceName", "");
          set("voiceCue", true);
          set("voiceLead", 240);
        }
      }, "\u21BA \u5957\u7528\u300C\u7535\u5F71\u65C1\u767D\u300D\u6863"),
      h("span", { className: "__ss_hint" }, "\u8BED\u901F 0.88 \xB7 \u97F3\u8C03 0.85\uFF08\u538B\u6291\u3001\u6DF1\u6C89\uFF09\xB7 \u81EA\u52A8\u6311\u795E\u7ECF\u7F51\u7EDC\u5973\u58F0 \xB7 \u63D0\u793A\u97F3 + \u5F00\u53E3\u7559\u767D")
    ) : null,
    draft.voice ? h(
      "div",
      { className: "__ss_two" },
      h(
        Field,
        { label: "\u8BED\u901F" },
        h(Range, { value: num(draft.voiceRate, 1), min: 0.5, max: 2, display: num(draft.voiceRate, 1).toFixed(2) + "\xD7", onChange: (v) => set("voiceRate", v) })
      ),
      h(
        Field,
        { label: "\u97F3\u8C03" },
        h(Range, { value: num(draft.voicePitch, 1), min: 0, max: 2, display: num(draft.voicePitch, 1).toFixed(2), onChange: (v) => set("voicePitch", v) })
      )
    ) : null,
    draft.voice ? h(
      Field,
      { label: "\u5F00\u53E3\u524D\u7559\u767D", hint: "\u63D0\u793A\u97F3\u4E4B\u540E\u505C\u987F\u591A\u4E45\u518D\u5F00\u53E3\u3002" },
      h(Range, {
        value: num(draft.voiceLead, 240),
        min: 0,
        max: 1200,
        step: 20,
        display: Math.round(num(draft.voiceLead, 240)) + " ms",
        onChange: (v) => set("voiceLead", v)
      })
    ) : null,
    draft.voice ? h(
      Field,
      { label: "\u97F3\u91CF" },
      h(Range, { value: num(draft.voiceVolume, 0.9), min: 0, max: 1, display: Math.round(num(draft.voiceVolume, 0.9) * 100) + "%", onChange: (v) => set("voiceVolume", v) })
    ) : null,
    draft.voice ? h(Check, {
      label: "\u64AD\u62A5\u524D\u63D0\u793A\u97F3",
      hint: "\u5F00\u53E3\u524D\u54CD\u4E24\u58F0\u8F7B\u63D0\u793A\u3002",
      checked: draft.voiceCue,
      onChange: (v) => set("voiceCue", v)
    }) : null,
    h("div", { className: "__ss_subTitle" }, "\u754C\u9762\u97F3\u6548"),
    h(Check, {
      label: "\u754C\u9762\u97F3\u6548",
      hint: "\u6309\u94AE\u3001\u8FC7\u573A\u548C\u7ED3\u5C3E\u7684\u63D0\u793A\u97F3\u3002",
      checked: draft.sound,
      onChange: (v) => set("sound", v)
    }),
    draft.sound ? h(
      Field,
      {
        label: "\u97F3\u6548\u6765\u6E90",
        hint: "\u5185\u7F6E\u7D20\u6750\u4F18\u5148\uFF1B\u4E5F\u53EF\u4EE5\u73B0\u573A\u5408\u6210\u3002"
      },
      h(Select, {
        value: draft.sfx || "audio",
        options: [["audio", "\u5185\u7F6E\u7D20\u6750\uFF08\u63A8\u8350\uFF09"], ["synth", "\u73B0\u573A\u5408\u6210"]],
        onChange: (v) => set("sfx", v)
      })
    ) : null,
    draft.sound ? h(
      Field,
      { label: "\u97F3\u6548\u97F3\u91CF" },
      h(Range, { value: num(draft.soundVolume, 0.5), min: 0, max: 1, display: Math.round(num(draft.soundVolume, 0.5) * 100) + "%", onChange: (v) => set("soundVolume", v) })
    ) : null
  );
  var visualGroup = h(
    "div",
    { className: "__ss_group", id: "__ss_group_visual" },
    h("div", { className: "__ss_groupTitle" }, "\u5916\u89C2"),
    h("div", { className: "__ss_subTitle" }, "\u4E3B\u9898\u4E0E\u80CC\u666F"),
    h(
      Field,
      { label: "\u4E3B\u9898" },
      h(Select, {
        value: draft.theme,
        options: [["light", "\u6D45\u8272 \xB7 \u6696\u767D\u6863\u6848\u5E95\u677F\uFF08\u53C2\u8003\u7247\u539F\u8272\uFF09"], ["dark", "\u6DF1\u8272 \xB7 \u6697\u5E95\u677F"]],
        onChange: (v) => set("theme", v)
      })
    ),
    h(Check, {
      label: "\u73AF\u5883\u5149\u6548\uFF08Canvas \u5149\u573A / \u6C1B\u56F4\u5C42\uFF09",
      hint: "\u80CC\u666F\u7684\u661F\u5C18\u3001\u6D41\u5149\u548C\u5149\u6591\uFF1B\u4F4E\u7AEF\u673A\u53EF\u5173\u95ED\u3002",
      checked: draft.ambient !== false,
      onChange: (v) => set("ambient", v)
    }),
    h("div", { className: "__ss_subTitle" }, "\u6DB2\u6001\u73BB\u7483"),
    h(Check, {
      label: "\u6DB2\u6001\u73BB\u7483\uFF08\u900F\u51FA\u684C\u9762 / \u80CC\u540E\u7A97\u53E3\uFF09",
      hint: "\u5E95\u677F\u53D8\u6210\u78E8\u7802\u73BB\u7483\uFF0C\u80FD\u900F\u51FA\u540E\u9762\u7684\u7A97\u53E3\u3002",
      checked: !!draft.glass,
      onChange: (v) => set("glass", v)
    }),
    draft.glass ? h(
      "details",
      { className: "__ss_details" },
      h("summary", null, "\u9AD8\u7EA7\u73BB\u7483\u53C2\u6570"),
      h(
        Field,
        { label: "\u73BB\u7483\u4E0D\u900F\u660E\u5EA6", hint: "\u8D8A\u4F4E\u8D8A\u900F\u3002" },
        h(Range, {
          value: num(draft.glassOpacity, 0.75),
          min: 0.15,
          max: 0.95,
          step: 0.01,
          display: Math.round(num(draft.glassOpacity, 0.75) * 100) + "%",
          onChange: (v) => set("glassOpacity", v)
        })
      ),
      h(
        Field,
        { label: "\u78E8\u7802\u6A21\u7CCA", hint: "\u80CC\u540E\u7684\u753B\u9762\u7CCA\u591A\u5C11\u3002" },
        h(Range, {
          value: num(draft.glassBlur, 22),
          min: 0,
          max: 60,
          step: 1,
          display: Math.round(num(draft.glassBlur, 22)) + " px",
          onChange: (v) => set("glassBlur", v)
        })
      ),
      h(
        Field,
        { label: "\u73BB\u7483\u9971\u548C\u5EA6", hint: "\u900F\u8FC7\u73BB\u7483\u770B\u5230\u7684\u989C\u8272\u6D53\u5EA6\u3002" },
        h(Range, {
          value: num(draft.glassSaturate, 160),
          min: 100,
          max: 200,
          step: 5,
          display: Math.round(num(draft.glassSaturate, 160)) + "%",
          onChange: (v) => set("glassSaturate", v)
        })
      ),
      h(
        Field,
        {
          label: "\u80CC\u666F\u6A21\u7CCA",
          hint: "\u5355\u72EC\u63A7\u5236\u73BB\u7483\u80CC\u540E\u7684\u6A21\u7CCA\u3002"
        },
        h(Range, {
          value: num(draft.glassBackdropBlur, 28),
          min: 0,
          max: 80,
          step: 1,
          display: Math.round(num(draft.glassBackdropBlur, 28)) + " px",
          onChange: (v) => set("glassBackdropBlur", v)
        })
      )
    ) : null,
    h("div", { className: "__ss_subTitle" }, "\u989C\u8272\u4E0E\u7279\u6548"),
    h(
      "div",
      { className: "__ss_two" },
      h(
        Field,
        { label: "\u5F3A\u8C03\u8272 \xB7 \u6A59" },
        h(
          "div",
          { className: "__ss_row" },
          h(ColorInput, { value: draft.accent, onChange: (v) => set("accent", v) }),
          h("span", { className: "__ss_status" }, draft.accent)
        )
      ),
      h(
        Field,
        { label: "\u6545\u969C\u8272 \xB7 \u84DD" },
        h(
          "div",
          { className: "__ss_row" },
          h(ColorInput, { value: draft.glitchB, onChange: (v) => set("glitchB", v) }),
          h("span", { className: "__ss_status" }, draft.glitchB)
        )
      )
    ),
    h(
      Field,
      { label: "\u6545\u969C\u8272 \xB7 \u7EA2" },
      h(
        "div",
        { className: "__ss_row" },
        h(ColorInput, { value: draft.glitchA || "#ff3b30", onChange: (v) => set("glitchA", v) }),
        h("span", { className: "__ss_status" }, draft.glitchA || "#ff3b30")
      )
    )
  );
  var aboutGroup = h(
    "div",
    { className: "__ss_group" },
    h("div", { className: "__ss_groupTitle" }, "\u5173\u4E8E"),
    versionLine,
    file ? h("div", { className: "__ss_barFile" }, "\u914D\u7F6E\u6587\u4EF6\uFF1A" + file) : null,
    h("div", { className: "__ss_hint" }, "\u672C\u4ED3\u5E93\u662F 6shenhonghong9/dsh-startup-screen \u7684 fork\uFF1BCanvas \u5149\u573A\u7B49\u89C6\u89C9\u65B9\u6848\u53C2\u8003 QIFANAI/dsh-startup-screen 1.6.0\uFF08MIT\uFF09\u3002"),
    h("div", { className: "__ss_hint" }, "\u300C\u6062\u590D\u9ED8\u8BA4\u300D\u4F1A\u8986\u76D6\u5F53\u524D\u6240\u6709\u8BBE\u7F6E\uFF1B\u300C\u7ACB\u5373\u9884\u89C8\u300D\u4F7F\u7528\u5F53\u524D\u4FEE\u6539\u4F46\u4E0D\u5199\u76D8\u3002")
  );
  var playPage = h(
    "div",
    { className: "__ss_page", id: "__ss_page_play", hidden: tab !== "play" },
    playGroup,
    interactGroup
  );
  var appearancePage = h(
    "div",
    { className: "__ss_page", id: "__ss_page_appearance", hidden: tab !== "appearance" },
    visualGroup
  );
  var soundPage = h(
    "div",
    { className: "__ss_page", id: "__ss_page_sound", hidden: tab !== "sound" },
    voiceGroup
  );
  var contentPage = h(
    "div",
    { className: "__ss_page", id: "__ss_page_content", hidden: tab !== "content" },
    identityGroup,
    textGroup
  );
  var aboutPage = h(
    "div",
    { className: "__ss_page", id: "__ss_page_about", hidden: tab !== "about" },
    aboutGroup
  );
  var nav = h(
    "nav",
    { className: "__ss_nav" },
    h("div", { className: "__ss_navTitle" }, "\u542F\u52A8\u52A8\u753B"),
    PAGES.map(function(p) {
      return h("button", {
        key: p[0],
        type: "button",
        className: "__ss_navItem" + (tab === p[0] ? " __ss_navItemActive" : ""),
        onClick: function() {
          switchTab(p[0]);
        }
      }, p[1]);
    }),
    h("div", { className: "__ss_navVersion" }, "v" + (version || FALLBACK_VERSION))
  );
  var footer = h(
    "div",
    { className: "__ss_footer" },
    h(
      "div",
      { className: "__ss_actions" },
      h("button", {
        className: "__ss_btn __ss_btnPrimary",
        disabled: busy,
        onClick: save
      }, busy ? "\u5904\u7406\u4E2D\u2026" : "\u4FDD\u5B58"),
      h("button", { className: "__ss_btn", onClick: preview }, "\u7ACB\u5373\u9884\u89C8"),
      h("button", { className: "__ss_btn", disabled: busy, onClick: reset }, "\u6062\u590D\u9ED8\u8BA4")
    ),
    h(
      "div",
      { className: "__ss_barHint" },
      "\u5173\u95ED\u5F39\u7A97\u4E0D\u4F1A\u4FDD\u5B58\uFF1B\u4FDD\u5B58\u540E\u4E0B\u6B21\u542F\u52A8\u751F\u6548\uFF1B\u300C\u7ACB\u5373\u9884\u89C8\u300D\u4F7F\u7528\u5F53\u524D\u4FEE\u6539\uFF08\u4E0D\u5199\u76D8\uFF09\u3002",
      dirty ? h("span", { className: "__ss_dirty" }, " \u25CF \u672A\u4FDD\u5B58") : null,
      notice ? h("span", { className: "__ss_ok" }, notice) : null,
      error ? h("span", { className: "__ss_err" }, error) : null
    )
  );
  return h(
    "div",
    { className: "__ss_root" },
    h(
      "div",
      { className: "__ss_shell", ref: shellRef },
      h(
        "div",
        { className: "__ss_layout" },
        nav,
        h(
          "div",
          { className: "__ss_main" },
          h(
            "div",
            { className: "__ss_content", ref: contentRef },
            playPage,
            appearancePage,
            soundPage,
            contentPage,
            aboutPage
          ),
          footer
        )
      )
    )
  );
}
var BOOT_ROUTE = "/dsh-startup";
function readFlag(store, key) {
  try {
    var s = window[store];
    return s ? s.getItem(key) : null;
  } catch (e) {
    return null;
  }
}
function writeFlag(store, key, value) {
  try {
    var s = window[store];
    if (s) s.setItem(key, value);
  } catch (e) {
  }
}
function markBooted() {
  try {
    window.__DSH_STARTUP_BOOT__ = "client";
  } catch (e) {
  }
}
function loadScript(src, fail) {
  var s = document.createElement("script");
  s.src = src;
  s.async = false;
  if (typeof fail === "function") {
    s.addEventListener("load", function() {
      fail(null);
    });
    s.addEventListener("error", function() {
      fail(new Error("script load failed: " + src));
    });
  }
  ;
  (document.head || document.documentElement).appendChild(s);
}
function loadCss(href, fail) {
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  if (typeof fail === "function") {
    link.addEventListener("load", function() {
      fail(null);
    });
    link.addEventListener("error", function() {
      fail(new Error("css load failed: " + href));
    });
  }
  ;
  (document.head || document.documentElement).appendChild(link);
}
function release(ok) {
  if (ok) return;
  try {
    var r = document.getElementById("dsh-startup-root");
    if (r && r.parentNode) r.parentNode.removeChild(r);
    if (document.documentElement.classList) document.documentElement.classList.remove("dsu-lock");
    if (document.body && document.body.style) document.body.style.overflow = "";
    window.__DSH_STARTUP_FAILED__ = true;
  } catch (e) {
  }
}
function injectRoot(cfg, onReady) {
  var root = document.getElementById("dsh-startup-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "dsh-startup-root";
    document.body.appendChild(root);
  }
  root.className = "dsu-root dsu-boot";
  if (document.documentElement.classList) document.documentElement.classList.add("dsu-lock");
  if (document.body && document.body.style) document.body.style.overflow = "hidden";
  var failed = false;
  var cssReady = false;
  var scriptReady = false;
  var readyCalled = false;
  function guard(err) {
    if (err) {
      if (!failed && typeof console !== "undefined" && console.warn) {
        console.warn("[dsh-startup-screen] \u542F\u52A8\u754C\u9762\u81EA\u4E3E\u5931\u8D25\uFF0C\u5DF2\u653E\u5F00\u9875\u9762\uFF1A", err.message);
      }
      failed = true;
      release(false);
      return;
    }
    if (cssReady && scriptReady && !readyCalled) {
      readyCalled = true;
      release(true);
      if (typeof onReady === "function") {
        try {
          onReady();
        } catch (e) {
        }
      }
    }
  }
  loadCss(BOOT_ROUTE + "/splash.css", function(err) {
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
  loadScript(BOOT_ROUTE + "/splash.js?t=" + Date.now(), function(err) {
    if (err) {
      guard(err);
      return;
    }
    scriptReady = true;
    guard(null);
  });
  setTimeout(function() {
    try {
      var r = document.getElementById("dsh-startup-root");
      if (r && r.className && r.className.indexOf("dsu-boot") !== -1) release(false);
    } catch (e) {
    }
  }, 9e3);
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
    fetch(API, { headers: { Accept: "application/json" } }).then(function(r) {
      return r.json();
    }).then(function(j) {
      if (!j || j.ok !== true) return null;
      var cfg = j.config || null;
      if (cfg && j.facts) cfg.facts = j.facts;
      return cfg;
    }).catch(function() {
      return null;
    }).then(function(cfg) {
      cfg = cfg || { enabled: true, mode: "session", speed: 1 };
      if (cfg.enabled === false) return;
      var today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (cfg.mode === "session" && readFlag("sessionStorage", "dsh-startup-screen:shown") === "1") return;
      if (cfg.mode === "daily" && readFlag("localStorage", "dsh-startup-screen:day") === today) return;
      return injectRoot(cfg, function() {
        if (cfg.mode === "session") writeFlag("sessionStorage", "dsh-startup-screen:shown", "1");
        if (cfg.mode === "daily") writeFlag("localStorage", "dsh-startup-screen:day", today);
      });
    }).catch(function() {
    });
  } catch (e) {
  }
}
var inject = ["slots"];
function apply(ctx) {
  selfBoot();
  ctx.slots.inject("settings.section", function() {
    return ctx.slots.register(
      { name: "settings.section", id: "startup-screen", order: 26, label: "\u542F\u52A8\u52A8\u753B" },
      function() {
        return h(Panel, {});
      }
    );
  });
}
    return module.exports;
  }
})
