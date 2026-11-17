/* splash 运行时自己读写的全局标记；其余 window 标记在 src/client/globals.d.ts。 */
interface Window {
  __DSH_STARTUP_CHROME__?: any
  __DSH_STARTUP_FIELD__?: any
  __DSH_STARTUP_GEN__?: number
  __DSH_STARTUP_SCRIPT_URL__?: string
  __DSH_STARTUP_FINISHED__?: boolean
  __DSH_STARTUP_STALLED__?: boolean
  webkitAudioContext?: typeof AudioContext
}
