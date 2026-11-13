# Changelog

本项目的版本记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。1.4.0 之前没有单独的变更记录。

## [Unreleased]

### Added

- 设置页左侧导航、分页与固定底栏。

### Changed

- 工程架构重构：源码迁入 `src/`，`lib/` 改为构建产物；Host / Client / Splash 按运行时边界拆分。
- 设置页控件尺寸与配色对齐 DSH 原生规格：开关 36×20、按钮高 36 圆角 12、
  输入框高 34、主色 `#4176e6`。

### Fixed

- 会话统计区分活动与归档。
- 自检面板垂直居中并补采会话数。

## [1.4.0] - 2026-11-07

### Added

- Canvas 活体光场、环境光效开关、真实数据面板。
- 准星刻度 / 数据环 / 雷达扫描、镜头推进与终幕撕裂带。
- 左上角 REV 行读取宿主真实 DSH 版本与 profile。
- 中文清晰度与逐字解码、电影细节增强。

### Changed

- 视觉密度对齐 QIFANAI v1.6.0 方案（MIT）。

[Unreleased]: https://github.com/lEIjIEeeeee/dsh-startup-screen/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/lEIjIEeeeee/dsh-startup-screen/releases/tag/v1.4.0
