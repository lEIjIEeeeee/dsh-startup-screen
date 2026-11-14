/**
 * 五步授权序列的文案与节奏。
 *
 * 文字与真声素材一一对应：
 *   line-1 = 需要访问许可
 *   line-2 = 身份资料确认
 *   line-3 = 接收访问需求
 *   line-4 = 开始读取权限
 *   line-5 = 读取完毕 · 核验通过
 *
 * `say` 是素材拿不到时的系统语音兜底文本；
 * `audio` 是素材文件名（不含扩展名）；`hold` 是这一步的基础停留时长。
 */
export const STEPS = [
  {
    zh: '需要访问许可',
    en: 'ACCESS PERMISSION REQUIRED',
    say: 'Access permission required.',
    audio: 'line-1',
    log: '等待用户授权…',
    logEn: 'AWAITING OPERATOR CONSENT',
    badge: 'AUTHORIZATION',
    action: 'grant',
    btnZh: '授予访问权限',
    btnEn: 'GRANT ACCESS',
    hold: 900,
    progress: 0.34
  },
  {
    zh: '身份资料确认',
    en: 'IDENTITY VERIFICATION',
    say: 'Identity verification.',
    audio: 'line-2',
    log: '核对身份资料…',
    logEn: 'MATCHING OPERATOR RECORD',
    badge: 'IDENTITY',
    action: 'confirm',
    btnZh: '确认身份',
    btnEn: 'CONFIRM IDENTITY',
    hold: 700,
    progress: 0.5
  },
  {
    zh: '接收访问需求',
    en: 'ACCESS REQUEST RECEIVED',
    say: 'Access request received.',
    audio: 'line-3',
    log: '接收访问需求，建立会话通道…',
    logEn: 'HANDSHAKE ESTABLISHED',
    badge: 'REQUEST',
    action: 'auto',
    hold: 1200,
    progress: 0.66,
    assembleLogo: true
  },
  {
    zh: '开始读取权限',
    en: 'PERMISSION READ STARTED',
    say: 'Beginning permission read.',
    audio: 'line-4',
    log: '开始读取权限，索引工作区与会话…',
    logEn: 'READING PERMISSION SET',
    badge: 'READ',
    action: 'auto',
    hold: 1200,
    progress: 0.8,
    hex: true
  },
  {
    zh: '读取完毕 · 核验通过',
    en: 'READ COMPLETE · VERIFIED',
    say: 'Read complete. Verification passed.',
    audio: 'line-5',
    log: '读取完毕，核验通过，权限已授予',
    logEn: 'PERMISSION AUTHORIZED',
    badge: 'VERIFY',
    action: 'auto',
    hold: 1600,
    progress: 0.93,
    reticle: true
  }
]
