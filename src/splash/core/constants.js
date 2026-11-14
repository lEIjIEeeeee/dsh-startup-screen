/** 启动界面根节点的 id；注入脚本、样式和运行时都按它找节点。 */
export const ROOT_ID = 'dsh-startup-root'

/** 动画停滞多久后强制放行（毫秒）。 */
export const STALL_MS = 15000

/** 逐字解码的刷新间隔（毫秒）。 */
export const DECODE_TICK = 55

/** 页面加载后多久还没开始播放就强制揭幕（毫秒）；只在运行时压根没启动时兜底。 */
export const BOOT_FAILSAFE_MS = 9000

/** facts 首次轮询的总时长与重试间隔（毫秒）；会话数可能比插件晚到。 */
export const FACTS_DEADLINE_MS = 2200
export const FACTS_RETRY_MS = 400
export const FACTS_POLL_MS = 600

/** 音频素材 onended 失联时的额外等待（毫秒）；等完按已知时长放行。 */
export const ASSET_TAIL_MS = 1500
