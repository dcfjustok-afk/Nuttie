# 栗子自律 Nuttie

> 积“栗”前行，“立”见更好的自己。<br>
> Small steps, solid growth.

Nuttie 是一款面向自己与朋友使用的本地优先 iOS 营养、自律与体重管理应用。产品以公开可验证的“自律茄子”能力为对标基线，使用 React Native 构建；除用户主动发起的 AI 请求外，业务数据与功能均在设备本地运行。

## 当前阶段

- 快照日期：2026-08-22
- 阶段：Phase 0，产品、体验、架构基线形成中
- `G0 项目立项`：PASS
- `G1 调研可信`：PASS（验收口径为公开可验证资料）
- `G2 产品基线`、`G3 体验基线`、`G4 Build Ready`：IN_PROGRESS
- 应用工程：正式根工程尚未初始化；D-032 仅授权的隔离 SDK 57 Windows JS Spike 已通过冻结安装、类型检查、Doctor 20/20 与 Android/iOS 平台 Metro export，两个 export 已共用平台限定 metadata、精确文件集、资产策略、路径和原生目录自动校验，六个高风险依赖符号已进入 JS/类型解析路径且原生调用为零；Windows 平台 JS export 不是原生运行或可复现构建证据
- Owner 决定：首批 11 项新决定和后续 D-039 方案 A 已接受；D-032 为 `CANDIDATE + SPIKE_AUTHORIZED`，D-052/D-053 继续 fail closed。D-039 已冻结 PX-4；PX-5 首次 DoR 评估为 `NOT_READY`，B01 正式验收矩阵与 B02 路由/可观测性契约已关闭，B03~B07 共 5 个 Owner/环境阻断项待关闭，未授权正式实现
- 框架无关契约与治理检查：合并后全库 1251/1251，通过 ProjectOps 5 份 Schema/329 个实例；G2 首个 MVP 增量范围卡已固定三项互斥选择与 7 条共享不变量，但推荐 A 不等于 Owner 选择，范围尚未冻结且不授权实现；跨角色复核包的 11 项输入已冻结，对应机器合同与 20 项本地 validator 已固定 5 域/A-B-C/12 不变量/P0~P3/disposition/双 SHA-256，合成 fixture 不是现实证据，正式回执、attestation、具名复核、PASS、Owner、范围冻结与实现授权仍为 0/false；复核人接入包、指派机器合同与 20 项本地 validator 进一步固定五域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256 和合成隔离，但真实候选人、联系人、联络授权、正式指派、复核与 PASS 仍为 0/false；D-045 最近/收藏、D-031 媒体/AI 保留、D-033 非标签 AI 上传确认、D-034 AI 资源预算、D-036 AITransport 隔离、D-053 Provider 用途准入与 D-040 前三批十三卡都完成四域自审，均未进入 Owner 评审。D-039 B03~B05 六卡统一独立复核包已固定 10 份输入、6 卡逐项处置、3 个阻断项、4 个复核域、16 条跨卡不变量与 P0~P3 标准；10 项输入清单已冻结到同一提交的原始 Git blob 并记录规范 SHA-256，但具名复核人和实际复核均未发生。独立复核回执机器合同与 20 项本地失败关闭 validator 已固定同一 frozen packet、四域 attestation、六卡、16 条不变量、P0~P3、disposition 与双层 SHA-256；合成 fixture 只验证算法，正式回执、reviewer attestation、身份/独立性/签署核验和权威 PASS 仍为 0/false。复核人接入包、指派机器合同与 21 项本地失败关闭 validator 进一步固定同一 packet、四域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256 与正式/合成隔离；真实候选人、受控联系人、联络授权、正式指派、实际复核、权威 PASS 与 B03~B05 关闭仍为 0/false。D-040 十三卡独立复核包已固定四个复核域、十三卡逐项处置、十二条跨批不变量与 P0~P3 标准，但具名复核人、身份/胜任范围/独立性核验和实际复核均未发生。对应独立复核回执机器合同与 20 项本地失败关闭 validator 已固定同一 frozen packet、七输入、四域 attestation、十三卡、十二条跨批不变量、P0~P3、disposition 与双层 SHA-256；合成 fixture 只验证算法，正式回执、attestation、身份/独立性/胜任/签署核验和权威 PASS 仍为 0/false。十三卡复核人接入包、指派机器合同与 21 项本地失败关闭 validator 进一步固定同一 packet、四域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256 与正式/合成隔离；真实候选人、受控联系人、联络授权、正式指派、实际复核、权威 PASS、健康批准、Content QA、Owner、PX-1/PX-2 与实现仍为 0/false。D-034 benchmark 协议、13 项 corpus manifest 本地校验、raw run/report bundle 机器合同与 17 项本地失败关闭 validator 已准备，覆盖三档、21 行矩阵、19+2 口径、85 个必需槽位/38 个边界与 +1、最低 765 warm-up/2550 measured、整组丢弃/重试保留及聚合重算；39 条缩小合成记录只验证算法且不落盘，真实 raw run/report 为 0，真实 corpus、最低设备、Mac/Xcode、隔离原生 harness、实测与独立复核仍缺失；D-036 Provider/原生兼容协议已准备，固定无 key OI-07 输入、36 个兼容单元、13 个原生边界面及离线 10 次/Provider 路径 3 次重复，但 OI-07、Provider 目标、Mac/Xcode、原生 harness、合成 corpus、凭证注入、真实网络授权、执行/结果与独立复核仍缺失；D-036/D-053 共用 OI-07 模板与 11 项本地失败关闭校验合同已固定同一 revision、3 个 slot、每 target 29 字段和 30 个联合字段，但 Owner 输入、Provider 解析、凭证、费用、联网和证据采集仍为 0；D-053 Provider 证据/App Privacy 协议已准备，固定 3 个 Provider、5 类 payload、15 个最小准入 profile、150 项十维评估与至少 5 行映射，但 OI-07、Provider、证据采集/快照、映射、具名签署、独立复核、Owner、准入与实现仍缺失。D-040 已分解为 20 个决定轴，D-054~D-072 仍只预留候选 ID；中国健康评审九工件/十三项交接包已就绪；对应回执机器合同与 20 项本地失败关闭 validator 已固定九工件、十三项、具名资质/胜任范围/地域/冲突/签署声明、90 天上限、P0~P3、disposition 与双层 SHA-256。合成 fixture 不是正式证据，正式回执、attestation、评审人核验、健康批准和独立 Content QA 仍为 0/false。健康评审人指派机器合同与 23 项本地失败关闭 validator 进一步固定同一 frozen packet、唯一入选候选人、五项胜任范围、身份/资质/地域/起草/冲突/覆盖、联络/90 天时序/签署、assignment SHA-256 与正式/合成隔离；真实候选人、受控联系人、执业注册读取、联络授权、正式指派、健康评审、批准、Content QA、Owner/PX 与实现仍为 0/false。WS/T 578.1-2017 中国现行宏量标准证据已补齐；D-063 来源卡、D-070 输入形态卡、D-071 显示舍入卡与 D-072 硬停止记录可用性卡已完成内部自审。四卡独立复核包进一步固定 10 份输入、4 个复核域、4 卡逐项处置、14 条跨轴不变量与 P0~P3 标准，且输入清单已冻结到同一提交的 10 个原始 Git blob 并记录规范 SHA-256，但具名复核人和实际复核均未发生；对应独立复核回执机器合同与 20 项本地失败关闭 validator 已固定同一 packet、四域 attestation、四卡、十四条跨轴不变量、P0~P3、disposition 与双层 SHA-256，合成 fixture 只验证算法，正式回执、attestation、身份/独立性/胜任/签署核验和权威 PASS 仍为 0/false；宏量轴复核人接入包、指派机器合同与 21 项本地失败关闭 validator 已固定同一 frozen packet、输入清单事件、四域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256 与正式/合成隔离；真实候选人、受控联系人、联络授权、外部消息、正式指派、实际复核、宏量轴权威 PASS、健康批准、Content QA、D-063/D-070 接受、四卡 Owner-ready、Owner、PX-1/PX-2 与实现仍为 0/false；上述四个复核/交接包都没有发送外部消息。D-071 固定来源单位、显式派生、raw/display、十进制舍入和残差披露边界；D-072 固定硬停止不可豁免、无目标事实不得创建目标、已有历史不删不回算且数据访问/删除持续可用。但 D-063/D-070 接受、D-068/D-069、健康数值边界、健康文案、Content QA 与独立复核未完成，四卡均未 Owner-ready。NIDDK 动态模型的论文、方程和七个当前网页代码资产已完成来源可行性核验；NIH 官方 `TAB-2436 / E-160-2012-0`、`Prototype / Licensing` 许可路径已定位，但七项资产覆盖未确认，逐文件许可、稳定版本、官方 oracle corpus、回归容差、保护线与健康评审仍未通过；未发送的许可澄清模板已固定 7 资产、外联授权、答复 schema 与失败关闭处置；补充审计定位 2010 年代码 ZIP 和 2008 年四种 Excel 逻辑工具，并确认官方已用 BWP 取代旧工具，旧工具不是当前发行或 oracle。D-062/D-059 对应选项仍未 Owner-ready。F01/F02/F16 请求证据、AI 配置—策略预检、不可信响应、D-053 门禁、F18 删除、F19 恢复/导入、F03 数据包/条码、F09 营养洞察及其他本地合同继续 fail closed；这些证据和 Windows JS 依赖/平台解析不等于正式根工程、Keychain/SQLCipher、真实网络、原生 iOS 能力、签名 Release Archive、真机或发布证据

- G2 首个 MVP 增量跨角色复核包已固定 11 份输入、3 个范围选项、5 个复核域、12 条跨选项不变量与 P0~P3 标准；11 项输入清单已绑定同一提交的原始 Git blob 与规范 SHA-256，当前为 `PACKET_READY / INPUT_MANIFEST_FROZEN`。具名复核人未指派、实际复核未开始，Owner 选择、范围冻结、G2 PASS、正式根工程、原生与实现授权均为 false。

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
- [D-039 B03~B05 六卡独立复核包](docs/03-design/d039-b03-b05-independent-review-packet.md)
- [D-039 独立复核回执机器合同](docs/04-engineering/testing/d039-independent-review-record-contract.md)
- [D-039 独立复核回执本地校验](docs/04-engineering/testing/d039-independent-review-record-harness.md)
- [D-031 媒体与 AI 内容保留选择卡](docs/03-design/d031-media-ai-retention-card-spec.md)
- [D-033 非标签 AI 上传确认选择卡](docs/03-design/d033-nonlabel-ai-confirmation-card-spec.md)
- [D-034 AI 资源预算选择卡](docs/03-design/d034-ai-resource-budget-card-spec.md)
- [D-034 最低支持 iPhone benchmark 协议](docs/04-engineering/testing/d034-minimum-iphone-benchmark-protocol.md)
- [D-034 corpus manifest 机器合同](docs/04-engineering/testing/d034-benchmark-corpus-manifest-contract.md)
- [D-034 corpus manifest 本地校验合同](docs/04-engineering/testing/d034-benchmark-corpus-manifest-harness.md)
- [D-034 raw run/report 机器合同](docs/04-engineering/testing/d034-benchmark-run-report-contract.md)
- [D-034 raw run/report 本地校验合同](docs/04-engineering/testing/d034-benchmark-run-report-harness.md)
- [D-036 AITransport 隔离选择卡](docs/03-design/d036-ai-transport-profile-card-spec.md)
- [D-053 AI Provider 用途准入选择卡](docs/03-design/d053-ai-provider-use-admission-card-spec.md)
- [OI-07 Provider 目标统一输入模板](docs/04-engineering/testing/oi07-provider-target-intake-template.md)
- [OI-07 Provider target 本地校验合同](docs/04-engineering/testing/oi07-provider-target-intake-harness.md)
- [D-040 首启资料与目标原型清单](docs/03-design/d040-prototype-manifest.md)
- [D-040 第一小批选择卡规格](docs/03-design/d040-first-batch-card-spec.md)
- [D-040 第二小批能量模型选择卡规格](docs/03-design/d040-energy-model-batch-card-spec.md)
- [D-040 第三小批资料与目标生命周期选择卡规格](docs/03-design/d040-data-lifecycle-batch-card-spec.md)
- [D-040 D-063 宏量目标来源选择卡规格](docs/03-design/d040-macro-target-source-card-spec.md)
- [D-040 D-070 自定义宏量输入形态选择卡规格](docs/03-design/d040-custom-macro-input-shape-card-spec.md)
- [D-040 D-071 宏量展示与舍入选择卡规格](docs/03-design/d040-macro-display-rounding-card-spec.md)
- [D-040 D-072 硬停止后纯记录可用性选择卡规格](docs/03-design/d040-hard-stop-record-availability-card-spec.md)
- [D-040 四张宏量轴卡独立复核包](docs/03-design/d040-macro-axis-independent-review-packet.md)
- [D-040 NIDDK 动态模型采用可行性输入](docs/03-design/d040-niddk-dynamic-model-feasibility-input.md)
- [D-040 NIDDK 动态模型许可澄清模板](docs/03-design/d040-niddk-license-clarification-template.md)
- [D-040 中国健康评审人交接与签署检查包](docs/03-design/d040-china-health-reviewer-intake-packet.md)
- [D-040 前三批十三卡独立复核包](docs/03-design/d040-first-three-batches-independent-review-packet.md)
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
