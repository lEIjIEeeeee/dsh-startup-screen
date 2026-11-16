export interface VersionLineProps {
  version: string
  buildVersion: string
}

/** 版本号常驻顶部，不进骨架屏 —— 它不依赖配置接口，接口挂了也该看得见当前装的是哪一版。 */
export function VersionLine({ version, buildVersion }: VersionLineProps) {
  return <div className="__ss_version">{'版本 v' + (version || buildVersion)}</div>
}
