/**
 * 全仓库唯一的默认配置。
 *
 * 宿主、启动动画、设置面板都从这里取值；改默认值只需要改这一处。
 * 运行时配置仍以宿主注入的 window.__DSH_STARTUP__ 为准，这里只是兜底。
 */
/** @type {Record<string, any>} */
export const DEFAULTS = {
  enabled: true,
  mode: 'session', // always | session | daily
  theme: 'light', // light | dark
  speed: 1,
  requireInteraction: true,
  allowSkip: true,
  ambient: true, // 环境光效：Canvas 光场 + 氛围层 + 电影感细节
  sound: true, // 界面音效（WebAudio 合成，无音频文件）
  soundVolume: 0.5,
  voice: true, // 女声播报（Web Speech API）
  voiceLang: 'en', // en | zh | both
  voiceName: '', // '' = 自动挑（按分数优先神经网络女声）
  voiceRate: 0.88, // 电影旁白档：比朗读慢，字与字之间才有重量
  voicePitch: 0.85, // 压低音调，深沉的 AI 女声
  voiceVolume: 0.9,
  voiceCue: true, // 念台词前的一声轻提示
  sfx: 'audio', // 音效来源：audio=lib/assets 里的真素材 / synth=现场合成
  voiceSource: 'asset', // 语音来源：asset=优先用真声素材（拿不到自动回落 TTS）/ tts=全 TTS
  voiceLead: 240, // 提示音之后留一小段空白再开口
  identity: 'JOYCE MOORE', // ← 设置页里可改的「身份名称」
  identityId: '0087',
  accessLevel: '3',
  brand1: 'DEEPSEEK',
  brand2: 'SYNTHESIZE INTELLIGENCE',
  brand3a: 'HARNESS',
  brand3b: 'OS',
  orgZh: '深度求索',
  orgEn: 'DEEPSEEK',
  orgSub: 'DEEPSEEK HARNESS',
  welcomeBox: 'DEEPSEEK HARNESS',
  footer: 'POWERED BY DEEPSEEK',
  accent: '#ff7500',
  glitchA: '#ff3b30',
  glitchB: '#2971b8',
  /* 液态玻璃：背景层做成半透明磨砂，能透出后面的窗口；文字和图形保持不透明。
     默认关闭，实心底板更像成片。 */
  glass: false, // 总开关（默认关：实心底板更像成片；想透桌面再开）
  glassOpacity: 0.75, // 0.15 ~ 0.95：越低越透；0.75 时背后是「暖白模糊」而不是灰
  glassBlur: 22, // 0 ~ 60px：玻璃自身的磨砂
  glassSaturate: 160, // 100 ~ 200%：玻璃后面的饱和度（液态玻璃那种通透感）
  glassBackdropBlur: 28, // 0 ~ 80px：背景模糊（实际作用于应用本体，超过 60 会糊成纯色）
}
