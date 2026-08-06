# 栗子自律 Nuttie

> 积“栗”前行，“立”见更好的自己。<br>
> Small steps, solid growth.

Nuttie 是一款面向自己与朋友使用的本地优先 iOS 营养、自律与体重管理应用。产品以公开可验证的“自律茄子”能力为对标基线，使用 React Native 构建；除用户主动发起的 AI 请求外，业务数据与功能均在设备本地运行。

## 当前阶段

- 快照日期：2026-07-31
- 阶段：Phase 0，产品、体验、架构基线形成中
- `G0 项目立项`：PASS
- `G1 调研可信`：PASS（验收口径为公开可验证资料）
- `G2 产品基线`、`G3 体验基线`、`G4 Build Ready`：IN_PROGRESS
- 应用工程：尚未初始化；未批准的库级选型不会提前固化

## 硬边界

- 仅 `AITransport` 可在用户主动操作后访问其配置的 HTTPS AI 服务。
- 不建设业务服务器，不引入业务账号、云数据库、对象存储、遥测、广告、远程配置、远程 Push、崩溃上传、CloudKit 或 EAS OTA。
- AI Base URL、model 与 key 由每位使用者自行配置；凭据不得打包进 IPA。
- 业务数据库使用 SQLCipher，数据库密钥存入 Keychain。
- 数据恢复采用用户主动执行的加密文件导出/导入，默认排除 iCloud。
- iOS 最低版本为 17，首发仅提供简体中文。

## 项目入口

- [项目章程](docs/00-governance/project-charter.md)
- [Owner 决策台账](docs/00-governance/decision-register.md)
- [当前交接](docs/00-governance/current-handoff.md)
- [Codex 连续性运行手册](docs/00-governance/codex-continuity-runbook.md)
- [阶段门禁](docs/00-governance/stage-gates.md)
- [团队运行方式](docs/00-governance/operating-model.md)
- [D-038 导航原型清单](docs/03-design/prototype-manifest.md)
- [D-039 添加餐食原型清单](docs/03-design/d039-prototype-manifest.md)
- [React Native / Expo 独立复核](docs/05-quality/rn-stack-independent-review.md)
- [追踪整改最终复验](docs/05-quality/traceability-review.md)
- [项目事件流](project-ops/README.md)
- [调研工作台](D:/study/Nuttie-Discovery-Workbench/index.html)

## 仓库状态说明

当前仓库首先承载调研、治理、产品、设计、架构与质量基线。React Native 工程将在 G2-G4 审查完成、下一批必需选型经 Owner 确认后初始化。
