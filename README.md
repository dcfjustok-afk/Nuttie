# 栗子自律 Nuttie

> 积“栗”前行，“立”见更好的自己。<br>
> Small steps, solid growth.

Nuttie 是一款面向自己与朋友使用的本地优先 iOS 营养、自律与体重管理应用。产品以公开可验证的“自律茄子”能力为对标基线，使用 React Native 构建；除用户主动发起的 AI 请求外，业务数据与功能均在设备本地运行。

## 当前阶段

- 快照日期：2026-08-15
- 阶段：Phase 0，产品、体验、架构基线形成中
- `G0 项目立项`：PASS
- `G1 调研可信`：PASS（验收口径为公开可验证资料）
- `G2 产品基线`、`G3 体验基线`、`G4 Build Ready`：IN_PROGRESS
- 应用工程：正式根工程尚未初始化；D-032 仅授权的隔离 SDK 57 Windows JS Spike 已通过冻结安装、类型检查、Doctor 20/20 与 Android/iOS 平台 Metro export，两个 export 已共用平台限定 metadata、精确文件集、资产策略、路径和原生目录自动校验，六个高风险依赖符号已进入 JS/类型解析路径且原生调用为零；Windows 平台 JS export 不是原生运行或可复现构建证据
- Owner 决定：首批 11 项新决定和后续 D-039 方案 A 已接受；D-032 为 `CANDIDATE + SPIKE_AUTHORIZED`，D-052/D-053 继续 fail closed。D-039 已冻结 PX-4；PX-5 首次 DoR 评估为 `NOT_READY`，B01 正式验收矩阵与 B02 路由/可观测性契约已关闭，B03~B07 共 5 个 Owner/环境阻断项待关闭，未授权正式实现
- 框架无关契约与治理检查：合并后全库 819/819，通过 ProjectOps 5 份 Schema/284 个实例；D-040 已分解为 20 个决定轴，D-054~D-072 仍只预留候选 ID。D-054/D-055/D-056/D-058 第一批内部选择卡完成四域自审，等待独立复核，尚未进入 Owner 评审。F01/F02/F16 请求证据、AI 配置—策略预检、不可信响应、D-053 门禁、F18 删除、F19 恢复/导入、F03 数据包/条码、F09 营养洞察及其他本地合同继续 fail closed；这些证据和 Windows JS 依赖/平台解析不等于正式根工程、Keychain/SQLCipher、真实网络、原生 iOS 能力、签名 Release Archive、真机或发布证据

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
- [D-039 PX-5 实现就绪评估](docs/05-quality/d039-px5-dor-assessment.md)
- [D-039 正式验收矩阵](docs/05-quality/d039-formal-acceptance-matrix.md)
- [D-040 首启资料与目标原型清单](docs/03-design/d040-prototype-manifest.md)
- [D-040 第一小批选择卡规格](docs/03-design/d040-first-batch-card-spec.md)
- [Nuttie 视觉方向与 Figma 导入合同](docs/03-design/nuttie-visual-direction.md)
- [视觉资产契约检查](tools/visual-kit-check.mjs)
- [React Native / Expo 独立复核](docs/05-quality/rn-stack-independent-review.md)
- [追踪整改最终复验](docs/05-quality/traceability-review.md)
- [项目事件流](project-ops/README.md)
- [框架无关测试夹具](docs/04-engineering/testing/domain-contract-harness.md)
- [体重记录事务合同](docs/04-engineering/testing/body-weight-record-harness.md)
- [近七日摄入/消耗事实读模型](docs/04-engineering/testing/seven-day-energy-trend-harness.md)
- [手工消耗事实事务合同](docs/04-engineering/testing/manual-burn-record-harness.md)
- [饮水记录事务与当日汇总合同](docs/04-engineering/testing/water-record-harness.md)
- [本地提醒规则与调度对账合同](docs/04-engineering/testing/local-reminder-reconcile-harness.md)
- [日期事实与外部授权导航合同](docs/04-engineering/testing/date-navigation-harness.md)
- [显式餐次定义与分组读模型合同](docs/04-engineering/testing/meal-slot-grouping-harness.md)
- [宏量目标版本事实与历史读取合同](docs/04-engineering/testing/macro-target-history-harness.md)
- [每日能量事实账本合同](docs/04-engineering/testing/daily-energy-ledger-harness.md)
- [F01–F24 合同覆盖审计](docs/04-engineering/testing/feature-contract-coverage.md)
- [本地档案事务与非级联删除合同](docs/04-engineering/testing/local-profile-record-harness.md)
- [本地数据访问清单合同](docs/04-engineering/testing/local-data-access-manifest-harness.md)
- [媒体权限编排合同](docs/04-engineering/testing/media-permission-orchestrator-harness.md)
- [F20/F23/F24 禁止能力审计合同](docs/04-engineering/testing/prohibited-capability-audit-harness.md)
- [F22 平台与语言 Release 审计合同](docs/04-engineering/testing/platform-language-release-audit-harness.md)
- [AI 策略阻断夹具](docs/04-engineering/testing/ai-policy-harness.md)
- [导入安全负向夹具](docs/04-engineering/testing/import-safety-harness.md)
- [调研工作台恢复与对账说明](docs/00-governance/workbench-reconcile-integration.md)

## 仓库状态说明

当前仓库首先承载调研、治理、产品、设计、架构与质量基线。React Native 工程将在 G2-G4 审查完成、下一批必需选型经 Owner 确认后初始化。
