# Nuttie 工程设计基线

> 状态：G4 初版
>
> 负责人：移动端架构
>
> 基线日期：2026-07-31
>
> 适用范围：iOS 17+、React Native、Expo Development Build、本地优先

## 1. 文档目的

本目录把 Phase 0 已批准的产品与技术约束转换为可实现、可测试、可审计的工程边界。它不是依赖清单，也不授权初始化 React Native 工程。

工程实现必须同时满足以下不变量：

1. 除用户明确触发、且经 D-053 Provider/载荷用途准入为 `ALLOW` 的 AI 请求外，生产 App 不主动访问网络。
2. SQLite 是业务数据的本地真源；AI、Widget、HealthKit 和视图状态都不能成为隐式真源。
3. 任何外部输入先验证、后暂存；跨文件/SQLite/Keychain 边界使用 durable intent 与启动对账，保证 crash consistency，不能宣称全局原子事务。
4. API key、数据库密钥、备份口令和 Health 数据不得进入日志或普通数据库；是否允许用户主动创建明文 JSON/CSV 由 D-035 决定。
5. 权限在功能触发点申请；拒绝权限后仍提供手动路径或清晰的不可用状态。
6. 未经用户确认的框架和第三方库只允许出现在候选决策中，不得写成既定选型。

## 2. 权威决策

下表仅复述 Owner 于 2026-07-31 批准的 D-001 至 D-017。正式权威来源是 `docs/00-governance/decision-register.md` 和 `project-ops/decisions.json`；本目录不得自行改变其状态。

| ID | 状态 | 已批准结论 | 工程影响 |
| --- | --- | --- | --- |
| D-001 | accepted | “全部功能”以公开可验证证据为边界 | 未验证行为保持 `EVIDENCE_GAP`，不伪造需求 |
| D-002 | accepted | 台湾食药署 + USDA Foundation/SR + 用户自建 | 来源隔离、许可随包、禁止打包无再分发许可的数据 |
| D-003 | accepted | 每人配置 OpenAI-compatible baseURL/model/key | BYOK，不存在内置共享主 key |
| D-004 | accepted | 仅 HTTPS | Release 拒绝 HTTP、自签名和不支持的 scheme |
| D-005 | accepted | Expo Development Build + Prebuild，并检入 `ios/` | 原生工程是受版本控制的源码，不可随意 clean-regenerate |
| D-006 | accepted | SQLite + 手动加密导入/导出，默认排除 iCloud | 无自动云同步；恢复和迁移必须可验收 |
| D-007 | accepted | 首版本地记录，HealthKit 第二阶段再决定 | 首版不依赖 HealthKit，也不提前请求权限 |
| D-008 | accepted | 开发阶段 TestFlight，长期渠道后定 | 不把 TestFlight 当作永久分发方案 |
| D-009 | accepted | 本地 JSONL 实时工作台 + 静态快照 | 工程通信记录写入本地 JSONL |
| D-010 | accepted | 完整功能地图先行，小批确认实现 | 架构支持分阶段交付，不擅自裁掉对标范围 |
| D-011 | accepted | iOS 17+ | 原生目标、测试矩阵和 API 可使用 iOS 17 基线 |
| D-012 | accepted | 数据随 App 发版 + Files 签名包导入 | 禁止运行时在线拉取食物数据 |
| D-013 | accepted | 能量、蛋白质、碳水、脂肪、纤维、糖、钠 | 数据模型保留原值、原单位、来源和缺失语义 |
| D-014 | accepted | AI 营养标签照片首次说明 + 每次预览确认 | 只覆盖营养标签照片；未确认前不得上传或落库，其他载荷待 D-033 |
| D-015 | accepted | SQLCipher + Keychain 数据库密钥 | 数据库密钥不随备份迁移，不出现在 JS 日志 |
| D-016 | accepted | 首发仅简体中文 | 首版测试基线为简中；数据来源原文仍需保留 |
| D-017 | accepted | 公开对标范围不删减、分阶段交付 | 技术分期不等于删除已确认能力 |

## 3. 文档地图

- [本地优先架构](architecture/local-first-architecture.md)：上下文、容器、依赖规则和关键数据流。
- [F01–F24 工程边界](architecture/feature-boundary-map.md)：产品功能地图到本地/AI/iOS 边界的交接映射。
- [安全与威胁模型](security/security-and-threat-model.md)：资产、信任边界、威胁、控制和删除语义。
- [离线数据包](data/offline-data-packs.md)：包格式、签名、许可、导入协议和启动对账。
- [加密备份与恢复](data/encrypted-backup-and-restore.md)：手动导出、加密封装、恢复和默认排除 iCloud。
- [iOS 原生能力边界](ios/native-capability-boundaries.md)：iOS 17、Expo/Prebuild、权限、后台、扩展、Mac 和分发限制。
- [测试策略](testing/test-strategy.md)：测试金字塔、真机矩阵、安全测试和发布门禁。
- [视觉资产契约检查](testing/visual-kit-check.md)：Figma-ready 栗子视觉资产的本地结构与安全边界。
- [领域合同夹具](testing/domain-contract-harness.md)：七项营养、显式日期、每日汇总与基础内存 CRUD 的框架无关证据。
- [手工餐食保存合同](testing/manual-meal-entry-harness.md)：状态转换、Repository port、`commandId` 幂等和未知提交结果重放证据。
- [全量本地删除协调器合同](testing/local-wipe-coordinator-harness.md)：durable intent、严格删除顺序、未知回执对账和负向空状态验证证据。
- [食品数据包契约检查](testing/data-pack-contract-harness.md)：D-002/D-012/D-013 的 synthetic pre-auth corpus 与负向验证。
- [备份恢复对账检查](testing/backup-reconcile-harness.md)：generation、intent、active/previous ref 的框架无关 crash-consistency 模型。
- [AI 响应合同检查](testing/ai-response-contract-harness.md)：不可信响应的版本、schema、预算和零写入解析夹具。
- [ADR](adr/)：已批准架构决策的上下文与后果。
- [技术决策候选](decisions/decision-candidates.md)：D-018 起的 Options / Trade-offs / Recommended，全部仍待 Owner 确认。
- [技术栈调研总览](technology-stack-research.md)：按已批准边界、候选库、原生能力和 Spike 证据解释 React Native 技术栈。

## 4. 进入实现前的门禁

以下条件全部满足后，才允许初始化或修改 React Native 工程：

1. D-018 起的首批库级候选完成 Owner 确认。
2. Mac、受支持 Xcode、iOS 17 模拟器和至少一台真实 iPhone 可用。
3. SQLCipher、Keychain、签名包和加密备份完成最小 Spike，失败路径有结果记录。
4. 数据许可清单、署名模板和测试数据集经过产品与数据负责人复核。
5. AI Provider 合约、HTTPS 校验、用户主动触发和零写入失败语义形成验收用例；营养标签照片按 D-014 验收逐次预览，其他载荷的预览范围待 D-033；D-053 未接受或 Provider policy 非 `ALLOW` 时真实载荷保持阻断。
6. CI 是否使用第三方云服务单独确认；未确认前只定义命令，不接入外部服务。

G4 当前保持 `IN_PROGRESS / 初版`。独立 [安全终审](../05-quality/security-review.md) 已完成，当前没有开放的安全协议文档发现，但总体 disposition 仍为 `BLOCKED`：D-026 冻结数据包签名与 key lifecycle，D-027 冻结二维备份密码学/流式认证 profile，D-034 冻结 AI 资源预算，D-036 冻结 URL/redirect/session profile，D-052/D-053 分别阻断 USDA 境外分发和 Provider 数据用途准入。D-030、D-031、D-033、D-035 仍分别阻断恢复语义、媒体/AI 保留、非标签载荷预览和明文导出能力。文档关闭不等于 Owner 已接受，也不等于实现、Mac/真机或 Release 证据通过；本目录不得自行标记 PASS。

## 5. 当前平台证据，不是版本决定

PM 于 2026-07-31 核验 Expo 官方 latest 页面：SDK 57.0.0 对应 React Native 0.86、React 19.2.3、Node 22.13.x；Expo 最低 iOS 16.4、Xcode 26.4。D-011 的 iOS 17+ 比 Expo 当前最低版本更严格，因此无冲突。

这些数字只记录调研时点，不等于项目已冻结依赖。精确 Expo/RN/React/Node/Xcode 版本、lockfile 和 New Architecture 兼容矩阵必须经过原生 Spike，并由 D-032 确认。

参考：

- <https://docs.expo.dev/versions/latest/>
- <https://docs.expo.dev/develop/development-builds/introduction/>
- <https://docs.expo.dev/workflow/continuous-native-generation/>
- <https://docs.expo.dev/versions/latest/sdk/sqlite/>
- <https://docs.expo.dev/versions/latest/sdk/securestore/>
- <https://reactnative.dev/architecture/landing-page>
