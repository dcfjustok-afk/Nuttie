# Nuttie 当前交接

| 字段 | 当前事实 |
| --- | --- |
| 快照日期 | 2026-08-22（Asia/Shanghai）；ProjectOps 人工归并快照与 2026-08-22 最新事件源一致 |
| 项目阶段 | Phase 0，产品、体验与 Build Ready 基线形成中 |
| Gate | G0/G1 `PASS`；G2/G3/G4 `IN_PROGRESS`；G5~G8 `FAIL` |
| 权威决定 | 29 项 `ACCEPTED`；3 项 `CANDIDATE`，其中 D-032 为 `SPIKE_AUTHORIZED`；D-039=A 已接受 |
| 当前允许 | 文档、原型、测试设计、许可证据、工作台维护；约定隔离目录中的 SDK 57 JS Spike |
| 当前禁止 | 正式 React Native 根工程、正式 lockfile、`ios/`、Apple 注册/付费、TestFlight 上传、发布或其他线上变更 |
| 下一位责任人 | PM 为 D-039 B03~B05 六卡复核包取得具名独立复核人，并继续准备 D-034 benchmark、按统一无密钥模板取得 OI-07 三个 Provider target，并按已冻结协议补齐 D-036 Provider/工具链/原生执行前提，以及按已冻结协议补齐 D-053 OI-07/Provider/证据快照/App Privacy 映射与具名签署；ProjectContentOwner 获得外部联络授权后为 D-040 指派具名合格中国健康评审人并核验资质/利益冲突。D-039 保持 PX-4 已冻结、PX-5 未授权 |

本文件是恢复入口，不是新的决定源。事实冲突时按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的优先级处理：Owner 明确回复和有效决定事件优先，其次是 [决定台账](decision-register.md) 与 `project-ops/decisions.json` 的一致副本；原型、推荐、工作台和本文件都不能替代 Owner 选择。

## 1. 权威状态与运行快照

`project-ops/decisions.json` 生成于 `2026-08-15T00:03:31+08:00`，与 [决定台账](decision-register.md) 一致，当前包含 29 项 `ACCEPTED` 和 3 项 `CANDIDATE`。

`project-ops/snapshots/current.json` 已按 `2026-08-22T19:35:07+08:00` 最新权威来源完成归并，当前记录 29 项 accepted、3 项 candidate、200 个事件、116 条 Agent 消息、25 个角色和 1 个活跃角色；唯一活跃角色是 PM `root`。Owner 首批整批回读仍为 11 项 accepted，D-032 仅获得隔离 SDK 57 JS Spike 授权；后续 Owner 查看冻结 D-039 原型后明确回复 `a`，D-039 方案 A 现为 `ACCEPTED / PX-3_PASS / PX-4_BASELINE_FROZEN`。首次 PX-5 DoR 为 `NOT_READY`；B01/B02 已关闭，当前 `B03~B07 / 5 BLOCKERS / D039-PX5-OWNER_DEPENDENCIES_REQUIRED`。B03 的 D-045 最近/收藏、B04 的 D-031 媒体/AI 保留与 B05 的 D-033 非标签 AI 上传确认、D-034 AI 资源预算、D-036 AITransport 隔离、D-053 Provider 用途准入六张内部卡均已完成四域自审，仍为 `INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY`。六卡统一独立复核包已固定 10 份输入、6 卡逐项处置、3 个阻断项、4 个复核域、16 条跨卡不变量与 P0~P3 标准；当前为 `PACKET_READY / INPUT_MANIFEST_FROZEN`，10 项输入清单已冻结并记录 blob OID/SHA-256，但具名复核人、身份/独立性核验和实际复核均未发生；独立复核回执机器合同与 20 项本地失败关闭 validator 已固定 frozen packet、四域 attestation、六卡、16 条不变量、P0~P3、disposition 与双层 SHA-256，合成 fixture 不是现实证据，正式回执、attestation、签署核验和权威 PASS 仍为 0/false；D-034 benchmark 协议、13 项 corpus manifest 本地校验、raw run/report bundle 机器合同与 17 项本地失败关闭 validator 已准备，固定三档/21 行/19+2/85 槽位/38 边界与 +1、最低 765 warm-up/2550 measured、整组丢弃/重试保留和聚合重算；39 条缩小合成记录只验证算法且不落盘，真实 raw run/report 为 0，真实 corpus、最低设备、Mac/Xcode、隔离原生 harness、实测与独立复核仍缺失，D-036/D-053 共用 OI-07 无密钥模板与 11 项本地失败关闭校验已准备并固定同一 revision、3 个 slot、每 target 29 字段和 30 个联合字段，但 Owner 输入、Provider 解析、凭证、费用、联网和证据采集均未发生；D-036 Provider/原生兼容协议已准备，固定无 key OI-07 输入、36 个兼容单元、13 个原生边界面及离线 10 次/Provider 路径 3 次重复，但 OI-07、Provider 目标、Mac/Xcode、原生 harness、合成 corpus、凭证注入、真实网络授权、执行/结果与独立复核仍缺失，D-053 Provider 证据/App Privacy 协议已准备，固定 3 个 Provider、5 类 payload、15 个最小准入 profile、150 项十维评估与至少 5 行映射，但 OI-07、Provider、证据采集/快照、映射、具名签署、独立复核、Owner 与准入仍缺失。D-040 的 20 个决定轴与 D-054~D-072 候选 ID 预留不变，前三批共十三卡完成自审；七份 frozen 输入、四域、十三卡逐项处置、十二条跨批不变量与 P0~P3 标准的独立复核包已就绪，但复核人未指派、身份/胜任范围/独立性/利益冲突未核验且复核未开始。对应独立复核回执机器合同与 20 项本地失败关闭 validator 已固定同一 packet、四域 attestation、十三卡、十二条不变量、P0~P3、disposition 与双层 SHA-256；合成 fixture 不是现实证据，正式回执、attestation、身份/独立性/胜任/签署核验和权威 PASS 仍为 0/false。D-063 固定三项互斥来源，D-070 固定三项互斥输入形态，D-071 固定三项互斥显示策略及来源单位、显式派生、raw/display、十进制舍入和残差披露边界，D-072 固定硬停止后允许无目标事实或暂停新增二选一、硬停止不可豁免、无目标事实不创建目标、历史不删不回算和数据控制持续可用；四卡均完成内部自审。四卡独立复核包进一步固定 10 份输入、4 个复核域、4 卡逐项处置、14 条跨轴不变量和 P0~P3 标准，且输入清单已冻结到同一提交的 10 个原始 Git blob 并记录规范 SHA-256，但具名复核人、身份/胜任范围/独立性/利益冲突核验和实际复核均未发生。对应独立复核回执机器合同与 20 项本地失败关闭 validator 已固定同一 packet、四域 attestation、四卡、14 条不变量、P0~P3、disposition 与双层 SHA-256；合成 fixture 不是现实证据，正式回执、attestation、身份/独立性/胜任/签署核验和权威 PASS 仍为 0/false。D-063/D-070 尚未接受，D-068/D-069、健康数值边界与文案、Content QA 与独立复核未完成，均未 Owner-ready。NIDDK 动态模型的论文、方程和七个当前网页代码资产已完成来源可行性核验；NIH 官方 `TAB-2436 / E-160-2012-0`、`Prototype / Licensing` 路径已定位，但七项资产覆盖、逐文件许可、稳定版本、官方 oracle corpus、回归容差、保护线与健康评审仍未通过；未发送许可澄清模板已固定 7 资产、3 类问题、6 类动作、12 项授权字段、30 项答复字段与 5 种处置，D-062/D-059 对应选项仍未 Owner-ready。第三批固定了四层数据、保存/删除、raw/display 舍入与历史不回算边界。中国大陆支持输入草案已区分 `12356` 心理援助与 `120` 医疗急救，并形成候选称谓、六个文案场景和复核合同；九份版本化输入、十三个逐条签署项、具名资质/利益冲突字段、90 天复核与独立 Content QA 门禁的健康交接包已就绪；20 项本地回执 validator 已固定同一 frozen packet、声明范围/越域语义、P0~P3、disposition 与双层 SHA-256，但只验证调用方数据。合成 fixture 不是现实证据，具名健康评审人、资质核验、正式回执、批准和 Content QA 仍为 0/false。四个复核/交接包都未发送外部消息。中国宏量标准输入已核验 `WS/T 578.1-2017` 的现行状态、成人参考带和 `4/4/9`。OI-02 仍为 Bundle ID 尚未创建、SKU=`N/A`，OI-03 仍为当前只有 `iPhone 16 Pro Max / iOS 26.5`、暂无可用 Mac。隔离 Spike 的 Android/iOS JS export 与共用结构校验保持通过，所有原生调用仍为零。D-039 DoR 进展、ID 预留、卡片自审和输入证据都不授权正式页面、路由、原生或发布工作。

门禁状态以 [阶段门禁](stage-gates.md) 为准：G0/G1 已通过；G2/G3/G4 仍在形成证据；G5~G8 因尚无经批准实现、构建、Beta 或发布证据而保持 `FAIL`。这里的 `FAIL` 表示退出条件尚不存在，不表示项目异常。

## 2. 决定状态

### 2.1 已接受 29 项

精确 ID：

```text
D-001, D-002, D-003, D-004, D-005, D-006, D-007, D-008, D-009,
D-010, D-011, D-012, D-013, D-014, D-015, D-016, D-017, D-018,
D-019, D-020, D-021, D-023, D-024, D-025, D-037, D-038, D-039, D-047,
D-048
```

新增接受项固定了 Expo Router、Zustand UI 状态边界、Drizzle + 受控 SQL、React Hook Form + Zod、Jest 单 runner、本地 Maestro + XCTest/XCUITest、StyleSheet semantic tokens、pnpm hoisted profile、四入口导航、D-039 本地搜索/最近优先、当前不加入 Apple Developer Program 只自用，以及 iPhone 竖屏 profile。完整精确语义见决定台账。

### 2.2 当前候选 3 项

精确 ID：

```text
D-032, D-052, D-053
```

D-032 已选择 SDK 57，但只形成 `CANDIDATE + SPIKE_AUTHORIZED`，等待隔离 Spike 证据后的第二次 Owner 动作。D-052 是 USDA 数据面向美国境外朋友的再分发口径；未决定前，USDA 原始或转换数据只用于本地研发。D-053 是第三方 AI Provider 数据用途准入；未决定且证据不足时，一律按 `UNKNOWN/BLOCKED` 处理。后两项不阻断本地自用、无第三方 AI 的 MVP 开发路径。

## 3. D-032 的两阶段语义

D-032 保留同一个决定 ID，但必须发生两次独立 Owner 动作：

1. **第一次：Spike candidate baseline，已完成。** Owner 已选择 A（SDK 57），只授权在约定的隔离 `spikes/` 边界创建候选 `package.json` 和唯一 lockfile，当前 Windows/无 Mac 条件下仅执行 JS Spike。记录语义是 `CANDIDATE + SPIKE_AUTHORIZED`，不能改为 `ACCEPTED`，也不能创建正式 Nuttie 根工程或执行 Prebuild。
2. **第二次：Final frozen matrix。** 团队提交 lockfile/Podfile.lock 实际解析版本、Mac/macOS/Xcode/CocoaPods、New Architecture 强制状态、SQLCipher、Keychain、通知、相机、Prebuild diff、Debug/Release/Archive 和真机证据后，Owner 再选择接受最终矩阵、改变候选或停止；只有这次明确确认才能把 D-032 冻结为最终 accepted 版本矩阵。

第一次动作所需的 D-037 pnpm profile 与 OI-03 设备事实已齐备。D-048 已接受；具体 Bundle ID 仍最迟在首次正式签名配置前关闭。D-047/OI-01 继续阻断稳定真机签名、App Store Connect 和 TestFlight。

隔离 `spikes/sdk57-js` 已用 Node 22.13.0 / pnpm 11.18.0 完成冻结安装、静态边界检查、TypeScript、Expo public config、Doctor 20/20 和 Android/iOS 平台 Hermes export。高风险依赖表面进一步绑定六个具体 JS 符号与四个 config plugin，Metro 分别解析 1,652 个 Android 模块和 1,565 个 iOS 条件模块，同时固定原生 API、权限、数据库、Keychain、通知、worklet 和网络调用均为 0。Android/iOS export 现共用同一校验核心，将平台限定 metadata、唯一 Hermes bundle、明确资产扩展名、声明/实际文件集精确一致、路径越界与原生目录进入导出后自动校验，10 个单测通过；因两平台连续运行都已观测到 SHA 或字节数漂移，两者都不作可复现构建门禁。它没有生成 `ios/`/`android/`，没有运行 Prebuild/Xcode/CocoaPods，也没有验证 SQLCipher、Keychain、权限、原生编译、模拟器、签名 Archive 或 iPhone 运行；因此它只关闭 Windows JS 解析子范围，不触发第二次 Owner 动作，也不把 D-032 改为 accepted。

## 4. 已完成评审与原型

| 产物 | 当前结论 | 接续时不得误读 |
| --- | --- | --- |
| [追踪整改最终复验](../05-quality/traceability-review.md) | `PASS_WITH_OWNER_GATE_BLOCKERS` | 历史 66/37/24/5、F/REQ/AT 和当时 14 项候选可复核；不覆盖当前 29/3 状态 |
| [Phase 0 机器一致性验证](../05-quality/phase0-validation-report.md) | `PASS_WITH_GATE_BLOCKERS` | 报告只验证首批候选登记前的 7 月 31 日历史快照，不能替代当前计数 |
| [Phase 0 8 月 5 日验证基线](../05-quality/phase0-validation-report-2026-08-05.md) | `PASS_WITH_GATE_BLOCKERS`；当前权威数据、工作台和 D-039 复验通过 | 固化 31 决定、77 事件、86 消息、17 角色、66 条证据与 D-039 PX-2；不关闭 G2/G3/G4，也不代表 Owner 已选 D-039 |
| [React Native / Expo 技术栈独立复核](../05-quality/rn-stack-independent-review.md) | `CONDITIONAL PASS`；重写要求已落实到当前决策包 | 没有初始化工程、安装依赖、生成 lockfile、Prebuild 或 Archive |
| [Owner 启动门禁独立审查](owner-startup-gate-independent-review.md) | 审查完成；发现的两阶段、选项完整性和候选登记问题已由当前决策包/台账收口 | 它是历史审查证据，文中的旧候选计数不能覆盖当前 29/3 权威状态 |
| [安全终审](../05-quality/security-review.md) | 总体 `BLOCKED`；安全协议文档发现已关闭 | 无实现、构建、真机、跨工具 corpus 或 Release 抓包证据，G4 不可 PASS |
| [食品数据许可审查](../05-quality/data-license-review.md) | `CONDITIONAL` | 台湾包须显名；USDA 境外分发由 D-052 fail closed |
| [iOS Release 独立审查](../05-quality/ios-release-readiness-review.md) | `BLOCKED` | 开发准备、G6 和 G7 都没有退出证据，不得宣称 Beta/Release Ready |
| [D-038 原型 Manifest](../03-design/prototype-manifest.md) | 原型 PX 验证已完成；Owner 已接受 A 四入口 + 情境新增 | 原型中的历史 candidate 标记不能覆盖 2026-08-14 权威决定事件 |
| [D-039 原型 Manifest](../03-design/d039-prototype-manifest.md) | 历史 PX-2 已通过；Owner 已选择 A，当前 `ACCEPTED / PX-4_BASELINE_FROZEN / PX-5_DOR_EVALUATED_NOT_READY` | B01/B02 已关闭，B03~B07 开放；正式 React Native 实现仍未授权 |
| [D-039 PX-5 实现就绪评估](../05-quality/d039-px5-dor-assessment.md) | 首次 `PASS=1 / PARTIAL=3 / FAIL=3`；B01 验收矩阵与 B02 路由契约随后关闭 | 当前转向 Owner/环境依赖，不创建正式工程 |
| [D-039 B03~B05 六卡独立复核包](../03-design/d039-b03-b05-independent-review-packet.md) | 10 份输入、6 卡逐项处置、3 个阻断项、4 个复核域、16 条跨卡不变量与 P0~P3 标准已准备 | 10 项输入清单已冻结并记录 blob OID/SHA-256；具名复核人、实际复核、外部证据、Owner 动作与实现授权均未发生 |
| [D-039 路由与可观测性契约](../03-design/d039-route-observability-contract.md) | 5 route、严格参数、43 个静态 testID、2 个动态模式和 6 类恢复已冻结 | 规格完成不等于 Router、组件、E2E、真机或正式实现证据 |
| [D-045 最近与收藏内部卡](../03-design/d045-recent-favorites-card-spec.md) | 三套完整政策包与四域自审已完成 | 独立复核、Owner 展示/选择、决定接受和 B03 关闭均未发生 |
| [D-031 媒体与 AI 内容保留内部卡](../03-design/d031-media-ai-retention-card-spec.md) | 三套完整政策包、临时内容清理、备份/删除和四域自审已完成 | 独立复核、Owner 展示/选择、决定接受和 B04 关闭均未发生 |
| [D-033 非标签 AI 上传确认内部卡](../03-design/d033-nonlabel-ai-confirmation-card-spec.md) | 三套完整政策包、D-014 保留范围、单次绑定/失效和四域自审已完成 | 独立复核、Owner 展示/选择、决定接受和 B05 关闭均未发生 |
| [D-034 AI 资源预算内部卡](../03-design/d034-ai-resource-budget-card-spec.md) | 三套固定预算政策包、19 项直接硬上限、超限清理、四域自审、[benchmark 协议](../04-engineering/testing/d034-minimum-iphone-benchmark-protocol.md)、[corpus manifest 合同](../04-engineering/testing/d034-benchmark-corpus-manifest-contract.md)、[本地校验](../04-engineering/testing/d034-benchmark-corpus-manifest-harness.md)、[raw run/report 合同](../04-engineering/testing/d034-benchmark-run-report-contract.md)与[17 项本地 report validator](../04-engineering/testing/d034-benchmark-run-report-harness.md)已完成 | manifest 与 report validator 都只校验调用方数据，不读取或物化 corpus；39 条缩小合成记录只验证算法且不落盘，真实 raw run/report 为 0；真实 corpus、最低设备/工具链/隔离原生 harness/实测、独立复核、Owner 展示/选择、决定接受和 B05 关闭均未发生 |
| [D-036 AITransport 隔离内部卡](../03-design/d036-ai-transport-profile-card-spec.md) | 三套 URL/redirect/session 政策包、显式 cache/cookie/credential storage 隔离和四域自审已完成；[OI-07 统一输入模板](../04-engineering/testing/oi07-provider-target-intake-template.md)已固定同一 revision、3 个 slot、每 target 29 字段和 30 个联合字段，但 Owner 输入仍为 0；[Provider/原生兼容协议](../04-engineering/testing/d036-provider-native-compatibility-spike-protocol.md)已固定无 key OI-07 输入、36 个兼容单元、13 个原生边界面和重复标准 | OI-07、Provider 目标、Mac/Xcode、原生 harness、合成 corpus、凭证注入、真实网络授权、执行/结果、独立复核、Owner 展示/选择、决定接受和 B05 关闭均未发生 |
| [D-053 AI Provider 用途准入内部卡](../03-design/d053-ai-provider-use-admission-card-spec.md) | 三套准入政策包、十维 Provider 真相、五类 payload、App Privacy 和旧 harness 边界已完成；[Provider 证据/App Privacy 协议](../04-engineering/testing/d053-provider-evidence-app-privacy-protocol.md)已固定 3 个 Provider、15 个最小 profile、150 项十维评估与至少 5 行映射 | OI-07、Provider、证据采集/快照、profile/维度记录、App Privacy/隐私政策映射与具名签署、独立复核、Owner 展示/选择、决定接受、准入记录和 B05 关闭均未发生 |
| [D-039 正式验收矩阵](../05-quality/d039-formal-acceptance-matrix.md) | 24 条用例覆盖首层、本地、最近、扫描、AI、保存、返回和无障碍 | 规格完成不等于实现或真机证据；依赖阻断保持条件化 |
| [D-039 PX-4 设计基线](../03-design/d039-px4-design-baseline.md) | 首层层级、返回、状态、无障碍顺序和四域复核已冻结 | 稳定设计 ID 尚未映射到经授权的正式页面/路由，真机与持久化证据仍缺失 |
| [D-040 原型 Manifest](../03-design/d040-prototype-manifest.md) | `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`；三方案流程与作者 QA 已形成 | 20 个决定轴已分配候选 ID，前三批十三卡完成自审，中国支持/健康治理输入草案完成；具名健康评审、独立复核、动态模型采用证据和其余卡片仍未关闭，不能进入 PX-1/PX-2 或 Owner 方案选择 |
| [D-040 第一批选择卡规格](../03-design/d040-first-batch-card-spec.md) | D-054/D-055/D-056/D-058 稳定 ID、互斥选项、`NOT_APPLICABLE` 和 `Other` 规范化已固定 | `INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY`；没有决定接受或实现授权 |
| [D-040 第二批能量模型选择卡](../03-design/d040-energy-model-batch-card-spec.md) | D-057/D-059/D-060/D-061/D-062 的 EER/REE、活动、增减重与失败关闭边界已固定 | 动态模型来源可行性已核验，但采用证据、独立复核和 Owner 评审均未完成；没有公式或实现授权 |
| [D-040 第三批资料与目标生命周期卡](../03-design/d040-data-lifecycle-batch-card-spec.md) | D-064/D-065/D-066/D-067 的四层数据、保存/删除、舍入与重算边界已固定 | 独立复核和 Owner 评审均未完成；没有持久化或实现授权 |
| [D-040 中国大陆支持与健康评审输入](../03-design/d040-china-support-health-review-input.md) | 12356/120 用途、四类称谓、六个文案场景、90 天/发版前复核和即时失效合同已形成 | 具名健康评审人、资质、健康批准、Content QA、D-068/D-069 Owner-ready 和实现授权均未完成 |
| [D-040 中国宏量营养标准输入](../03-design/d040-china-macronutrient-standard-input.md) | WS/T 578.1-2017 现行状态、健康成人 P/C/F 参考带、4/4/9 与修订监视已形成 | 具名健康评审、D-063 独立复核、Owner-ready、默认目标和实现授权均未完成 |
| [D-040 D-063 宏量目标来源卡](../03-design/d040-macro-target-source-card-spec.md) | 无目标、中国健康成人参考带信息、用户自定义三项互斥来源与 D-070~D-072 依赖已固定 | 内部自审完成；D-068/D-069、健康批准、Content QA、独立复核、Owner-ready 和实现授权均未完成 |
| [D-040 D-070 自定义宏量输入形态卡](../03-design/d040-custom-macro-input-shape-card-spec.md) | 完整克数、固定 100% 三项比例、显式缺项克数三项互斥形态已固定 | 内部自审完成；D-063 接受、D-068/D-069、健康数值边界、独立复核、Owner-ready 和实现授权均未完成 |
| [D-040 D-071 宏量展示与舍入卡](../03-design/d040-macro-display-rounding-card-spec.md) | 三项互斥显示策略、来源/派生单位、raw/display、十进制舍入和残差披露已固定 | 内部自审完成；D-063/D-070 接受、健康数值边界、独立复核、Owner-ready 和实现授权均未完成 |
| [D-040 D-072 硬停止后纯记录可用性卡](../03-design/d040-hard-stop-record-availability-card-spec.md) | 允许无目标事实或暂停新增二选一；硬停止、零目标创建、历史与数据控制边界已固定 | 内部自审完成；D-068/D-069、健康文案、Content QA、独立复核、Owner-ready 和实现授权均未完成 |
| [D-040 四张宏量轴卡独立复核包](../03-design/d040-macro-axis-independent-review-packet.md) | 10 份输入、4 个复核域、4 卡逐项处置、14 条跨轴不变量和 P0~P3 标准已形成 | 10 项输入清单已冻结并记录 blob OID/SHA-256；`REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED`，不替代健康签署、Owner 决定或实现授权 |
| [D-040 NIDDK 动态模型可行性输入](../03-design/d040-niddk-dynamic-model-feasibility-input.md) | 论文、方程、七个当前网页代码资产及 hash、NIH 官方 `TAB-2436 / E-160-2012-0` 许可路径已定位 | 当前七项资产与 `TAB-2436` 的覆盖映射、逐文件许可、稳定版本、官方 oracle corpus、回归容差、保护线与健康评审未通过；未外联、未将源码入库或执行 |
| [D-040 NIDDK 许可澄清模板](../03-design/d040-niddk-license-clarification-template.md) | 七资产、三类问题、六类动作、十二项外联授权字段、三十项答复字段和五种处置已固定 | `NOT_SENT / RESPONSE_NOT_RECEIVED`；不构成联系授权、许可答复、Owner-ready 或实现授权 |
| [D-040 中国健康评审人交接包](../03-design/d040-china-health-reviewer-intake-packet.md) | 九份版本化输入、十三项逐条签署、九项资质字段、利益冲突与独立 Content QA 门禁已形成 | `PACKET_READY / REVIEWER_UNASSIGNED / REVIEW_NOT_STARTED / NOT_APPROVED`；没有外联、Owner-ready 或实现授权 |
| [D-040 健康评审回执机器合同与 validator](../04-engineering/testing/d040-china-health-review-record-harness.md) | 20 项本地失败关闭测试固定 frozen packet、九输入、十三项、资质/范围/地域/冲突/签署声明、90 天、P0~P3、disposition 与双 SHA-256 | 只验证调用方数据；正式回执、attestation、评审人核验、健康批准和 Content QA 均为 0/false |
| [D-040 前三批十三卡独立复核包](../03-design/d040-first-three-batches-independent-review-packet.md) | 四个复核域、十三卡逐项处置、十二条跨批不变量和 P0~P3 标准已形成 | `PACKET_READY / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED`；不替代健康签署、Owner 决定或实现授权 |
| [D-040 问题分解](../03-design/d040-question-allocation.md) | D-040 最终结构 + D-054~D-072 预留，共 20 个独立轴 | 不进入决定台账/Owner intake；前三批跨域独立复核与后续卡待完成 |
| [原型与 Owner 评审流程](../03-design/prototype-and-owner-review-workflow.md) | 流程草案已形成 | 设计必须先原型、跨角色审查、Owner 明确选择，再进入正式规格与实现 |

D-038 仓库同源为 [交互原型](../../prototypes/d038-navigation-shell/index.html)。D-039 仓库同源为 [添加餐食原型](../../prototypes/d039-add-meal-entry/index.html)；其页面点击仍不保存决定，但 Owner 后续明确文字回复 A 已成为权威决定。D-040 仓库同源为 [首启资料与目标原型](../../prototypes/d040-onboarding-goals/index.html)，只比较 A/B/C 流程，并明确不执行健康公式；其 candidate 状态不得被 D-039 的接受推导升级。

## 5. 五条 pending evidence

当前研究总数是 `66 = 37 confirmed + 24 cross-source + 5 pending`。以下五条均因公开资料不足而保持 `pending`：

| Evidence ID | 公开资料不能证明什么 | Nuttie 处理边界 |
| --- | --- | --- |
| `LOG-08` | AI 识别结果是否有人工纠正入口及纠错范围 | 完整本地记录闭环需要，但只能标为 `Nuttie-required`，交互仍待 Owner |
| `LOG-09` | 手工搜索、自建食品、最近使用和收藏是否属于竞品功能 | 作为 Nuttie 本地闭环候选，不能合称竞品已证实 |
| `AI-06` | 协议免责声明提到的健康知识、营养知识和成功故事是否对应实际内容模块 | 只留研究台账，不进入确定 UI |
| `DATA-07` | 协议“可能包含广告”是否证明当前广告位或频率 | 不进入 Nuttie 目标实现 |
| `DATA-08` | 竞品是否存在导入、导出、备份、iCloud 或恢复流程 | D-006/D-012 的加密 Files 备份属于 `Nuttie-required`，不是竞品事实 |

2026-08-05 已为 S01/S10 新增向前快照元数据和最小原文摘录，路径为 `docs/01-research/snapshots/2026-08-05/`。它没有追溯重建 2026-07-31 页面，也不提供上述五条缺失的 iOS UI/流程证据，因此 37/24/5 与 pending ID 集合保持不变。

权威逐行记录见 [竞品证据矩阵](../01-research/competitor-evidence-matrix.md)。EG-01~EG-09 是九组跨行 gap themes，不是另外九条 evidence，也不能与 66 相加。这五条 pending 不阻断 G1，但持续约束产品文案和“竞品全部功能”的宣称。

## 6. 当前阻塞

1. **D-039 已完成 PX-4，但 PX-5 尚未完成。** Owner 已选择 A；首层组织、返回、状态、无障碍顺序和四域复核已冻结。不得把设计基线冒充实现 DoR、真机证据或正式工程授权。
2. **D-040 已完成问题分解，前三批与四张宏量轴卡仍待独立评审。** A/B/C 流程、恢复、无目标和失败零写入已形成原型；公式/治理证据复审归零，20 个决定轴已分配候选 ID，前三批十三张卡、D-063 来源卡、D-070 输入形态卡、D-071 显示舍入卡和 D-072 硬停止记录可用性卡完成内部自审。四卡复核包已形成，且 10 份输入已冻结到同一提交并记录 blob OID/SHA-256，但具名复核人和实际复核未发生。D-072 只固定硬停止期间的事实新增策略，不解除停止、不生成目标/评分、不删或回算历史。D-063/D-070 仍未接受，D-068/D-069、具名健康批准、健康数值边界与文案、Content QA 和独立复核仍缺失。中国宏量现行标准证据、健康评审交接包及 20 项本地回执 validator 已补齐，但机器合同就绪不等于具名评审人已指派、资质已核验、正式回执已形成或健康/Content QA 已批准。NIDDK 动态模型来源可行性及 NIH 官方 `TAB-2436 / E-160-2012-0`、`Prototype / Licensing` 路径已核验，但当前七项资产覆盖、逐文件许可、稳定版本、官方 oracle corpus、回归容差、保护线和具名健康评审仍未关闭；未发送许可澄清模板只准备问题与回执结构，不是外联授权或许可答复；不得把当前网页 hash、固定测试夹具、作者草案、内部自审或参考带当作已批准产品规则，也不得直接向 Owner 提交未成熟选择卡。
3. **G4 仍未通过；纯 JS Spike 子范围已验证。** 工程基础选择已接受，现有框架无关合同继续提供本地事实、事务、AI fail-closed 与禁止能力边界。合并后的 ProjectOps 有 5 份 Schema/319 个实例；D-039 B01/B02 关闭、D-039 六卡复核包只达到 PACKET_READY，10 项输入清单已冻结并记录 blob OID/SHA-256，20 项本地回执 validator 只验证机器合同且不产生正式回执、复核人或 PASS；D-045、D-031、D-033、D-034、D-036、D-053 与 D-040 内部卡自审和输入证据都不授权正式工程；D-040 十三卡 20 项本地回执 validator 只验证七份 frozen 输入、四域/十三卡/十二不变量/P0~P3/disposition/双 SHA-256 机器合同，不产生正式回执、复核人或 PASS；D-040 四卡 20 项本地回执 validator 同样只验证十份 frozen 输入、四域/四卡/十四不变量/P0~P3/disposition/双 SHA-256 机器合同。F01/F02/F16 共享请求证据只接受唯一剩余 policy blocker 为 `D053_NOT_AUTHORIZED` 的本地上下文；D-033/D-034 只完成内部卡；D-034 本地 manifest 校验只验证结构，raw run/report 本地 validator 只验证调用方数据、覆盖/聚合与 disposition；这些本地合同都不物化 corpus、不创建真实 run/report 或授权执行，D-036/D-053 共用 OI-07 模板与 11 项本地失败关闭校验已准备但 Owner 输入仍为 0；D-036 已准备 Provider/原生兼容协议但未获得执行输入或授权，D-053 已准备 Provider 证据/App Privacy 协议但未获得 OI-07、采集、映射、签署或准入，AI 配置—策略预检仍阻断 D-033/D-034/D-036/D-053；正式根工程、Prebuild/Xcode/CocoaPods、原生编译与运行证据继续关闭。
4. **数据与 AI 分发 fail closed。** D-052 未处理前不向美国境外朋友分发 USDA；D-053 和 Provider 证据未满足前不向第三方 AI 发送健康/营养载荷。
5. **Apple 原生链路仍阻断。** 已记录 iPhone 16 Pro Max / iOS 26.5 与 Bundle ID 尚未创建，但当前无可用 Mac、macOS、Xcode、CocoaPods、具体 Bundle ID、签名链、App Store Connect record 或 TestFlight build；只有 iPhone 不构成原生构建能力。
6. **D-039 Owner 阻塞已关闭。** OI-02、首批整批确认和 D-039=A 均已登记；D-040 仍只是计划中的 Owner 队列占位，第一小批选择卡规格与 PX 前置必须先关闭。完整宿主迁移记录见 [Choice UI 宿主只读审计](../04-engineering/choice-ui-host-audit-2026-08-14.md)。

当前合并基线全库 1070/1070、工具合同 763/763、ProjectOps 验证 288/288、Schema 子集 14/14、只读对账 5/5；包含 5 个 Schema、`319` 个受控实例、`32` 条决定、1 份 Owner intake、`200` 个事件、`116` 条消息和 25 个角色。验证器锁定首批接受事件、D-039=A 单独接受/PX-4/PX-5 NOT_READY、B01/B02、D-045、D-031、D-033、D-034、D-036 与 D-053 六张内部卡及其统一复核包的 10 输入/6 卡/3 阻断项/4 域/16 不变量/输入已冻结/复核未开始状态，以及回执 validator 的 20 项测试/正式回执与 attestation 为 0/合成 fixture 非证据/PASS 与门禁全关闭边界、D-034 benchmark 协议、manifest 校验与 raw run/report 合同的 3 档/21 行/19+2/85 槽位/38 边界与 +1、765 warm-up/2550 measured、8 阶段/14 指标、整组丢弃/重试保留、raw 聚合/p95/pass 边界，以及本地 validator 的 17 项测试/39 条合成记录非证据/实际 run 与 report 为 0/corpus/设备/原生执行/结果/复核/Owner/B05/实现全关闭状态、OI-07 统一模板与 11 项本地校验的同一 revision/3 target/每 target 29 字段/30 联合字段及输入/凭证/费用/联网/证据/Owner/B05/实现全关闭边界、D-036 Provider/原生兼容协议的 36 单元/13 原生面/离线 10 次/Provider 路径 3 次重复标准，以及 OI-07/Provider/工具链/联网/执行/复核/Owner/B05/实现全关闭边界、D-053 Provider 证据/App Privacy 协议的 3 Provider/5 payload/15 profile/150 十维评估/至少 5 行映射，以及 OI-07/采集/快照/映射/签署/复核/Owner/准入/B05/联网/实现全关闭边界、D-040 的 20 轴分解、前三批十三卡、健康评审回执 validator 的 20 项测试/九输入/十三项/90 天/合成 fixture 非证据/正式回执与 attestation 为 0/健康批准与 Content QA 全关闭边界、D-063/D-070/D-071/D-072 四卡边界、四卡复核包与本地回执 validator 的 10 输入/4 域/4 卡/14 不变量/P0~P3/disposition/双 SHA-256/输入冻结提交与哈希/正式回执与 attestation 为 0/合成 fixture 非证据/独立性胜任签署未核验/PASS 与门禁全关闭状态、中国支持/健康治理输入、中国宏量现行标准证据、NIDDK 动态模型官方许可路径定位、七资产未映射、许可澄清模板未发送与采用未通过状态、健康评审交接包，以及十三卡独立复核包与本地回执 validator 的七输入/四域/十三卡/十二不变量/P0~P3/disposition/双 SHA-256/正式回执与 attestation 为 0/合成 fixture 非证据/独立性胜任签署未核验/PASS 与门禁全关闭边界、D-032 Spike 授权、OI-02/OI-03、Windows JS/双平台 export 与全部非生产合同。`project-ops/reconcile.mjs` 对账 D-039 `D039-PX5-OWNER_DEPENDENCIES_REQUIRED`、D-045 `D045_INDEPENDENT_REVIEW_REQUIRED`、D-031 `D031_INDEPENDENT_REVIEW_REQUIRED`、D-033 `D033_INDEPENDENT_REVIEW_REQUIRED`、D-034 `D034_DEVICE_BENCHMARK_AND_INDEPENDENT_REVIEW_REQUIRED`、D-036 主状态 `D036_PROVIDER_SPIKE_NATIVE_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED` 且协议子状态 `D036_PROVIDER_NATIVE_SPIKE_PROTOCOL_READY`、D-053 主状态 `D053_OI07_POLICY_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED` 且协议子状态 `D053_PROVIDER_EVIDENCE_APP_PRIVACY_PROTOCOL_READY`、D-040 `CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`，并继续证明正式实现和 Owner 卡均未越级授权。证据矩阵仍为 `66 = 37 confirmed + 24 cross-source + 5 pending`；Windows 主机继续阻断原生路径。

## 7. 下一步 Owner 互动

Owner 已明确选择 D-039=A，不得重复询问；PX-4 设计基线也已完成。D-034 资源预算卡、benchmark 协议、13 项本地 manifest 校验与 raw run/report 合同已完成，但仍需真实 corpus、最低设备/工具链/隔离原生 harness/实测和独立复核；D-036/D-053 共用 OI-07 模板已完成，仍需 Owner 或获授权联系人提供三个无密钥 target；D-036 传输隔离卡与 Provider/原生兼容协议已完成，协议固定 36 个兼容单元、13 个原生边界面和离线 10 次/Provider 路径 3 次重复，但仍需 OI-07、Provider 目标、Mac/Xcode、原生 harness、合成 corpus、凭证注入、真实网络授权、执行/结果和独立复核；D-053 用途准入卡与 Provider 证据/App Privacy 协议已完成，协议固定 15 个最小 profile、150 项十维评估和至少 5 行映射，但仍需 OI-07、Provider、证据采集/快照、映射、具名签署和独立复核。PM 可继续准备这些证据，并推进 D-040 的后续小批中立选择卡。`owner-intake.json` 中的 `d040_onboarding_goals` 只是队列占位，上述卡片达到 `READY_FOR_OWNER_REVIEW` 前不得提前展示。

当前 Codex host 已通过新安装的 `interactive-questions` 插件暴露原生 `request_user_input`，OI-02 已取得真实返回。旧 Choice UI MCP 的安装流程不再需要，也不得为本项目额外修改全局插件或 feature；历史审计结论及迁移说明保留在 [Choice UI 宿主只读审计](../04-engineering/choice-ui-host-audit-2026-08-14.md)。

D-032 的第一次动作已经完成且只表示隔离 Spike 授权。Spike 失败时不得自动切换 SDK 56；必须提交证据并触发第二次 Owner 动作。

## 8. 恢复与验证命令

先按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的启动顺序读取权威文件。仓库根目录必须从当前 checkout 动态解析，不能复用历史任务中的绝对路径。外部 `D:\study\Nuttie-Discovery-Workbench` 在本轮机器上不存在，因此未执行静态重建或 live/static smoke；[工作台对账集成](workbench-reconcile-integration.md) 已如实记录 `NOT RUN`。未来恢复时仍应先解析实际仓库与工作台路径：

```powershell
$repoRoot = (git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $repoRoot -PathType Container)) { throw "无法解析当前仓库根目录" }
$repoRoot = (Resolve-Path -LiteralPath $repoRoot).Path
$workbenchRoot = 'D:\study\Nuttie-Discovery-Workbench'
if (-not (Test-Path -LiteralPath $workbenchRoot -PathType Container)) { throw "工作台目录不存在：$workbenchRoot" }
node (Join-Path $workbenchRoot 'server.mjs') --port 4173 --workspace $repoRoot
```

打开 `http://127.0.0.1:4173/`。基于已更新的 `project-ops/snapshots/current.json` 重建工作台静态副本并执行 smoke：

```powershell
node (Join-Path $workbenchRoot 'qa\build-static-snapshot.mjs') $repoRoot
node (Join-Path $workbenchRoot 'qa\smoke-test.mjs') http://127.0.0.1:4173
```

若浏览器拒绝直接打开 D-038 本地文件，在仓库同源目录启动只绑定 loopback 的预览：

```powershell
node (Join-Path $repoRoot 'prototypes\d038-navigation-shell\server.mjs') 4175
```

打开 `http://127.0.0.1:4175/`。端口冲突时可以换其他本地端口；不得把工作台或原型部署到公网。

D-039 冻结预览使用独立 loopback 服务，并执行原型 smoke：

```powershell
node (Join-Path $repoRoot 'prototypes\d039-add-meal-entry\server.mjs') 4176
node (Join-Path $repoRoot 'prototypes\d039-add-meal-entry\qa-smoke.mjs') http://127.0.0.1:4176/ (Join-Path $env:TEMP 'Nuttie-D039-QA')
```

打开 `http://127.0.0.1:4176/`。页面只用于评审，不保存 Owner 选择。

D-040 冻结预览和自动 QA：

```powershell
node (Join-Path $repoRoot 'prototypes\d040-onboarding-goals\server.mjs') 4177
node (Join-Path $repoRoot 'prototypes\d040-onboarding-goals\qa-smoke.mjs') http://127.0.0.1:4177/ (Join-Path $env:TEMP 'Nuttie-D040-QA')
```

打开 `http://127.0.0.1:4177/`。该页面只比较首启资料与目标流程；固定数值不是健康公式结果，也不保存 Owner 选择。

恢复后至少重新确认：决定是 29/3；事件/消息/角色是 200/116/25 且仅 `root` 活跃；D-039=A 为 `ACCEPTED / PX-4_BASELINE_FROZEN / PX-5_DOR_NOT_READY`，B01/B02 已关闭、B03~B07 共 5 项开放且正式实现为 false；D-045、D-031、D-033、D-034、D-036 与 D-053 六张内部卡自审通过但独立复核/Owner 卡未排期；D-053 仍是台账内 candidate，其余内部卡未进入决定台账或 Owner intake；D-034 benchmark 协议、13 项本地 manifest 校验、raw run/report 合同与 17 项本地失败关闭 validator 已准备，但 39 条缩小合成记录只验证算法且不落盘，真实 raw run/report 为 0，真实 corpus、最低设备、工具链、隔离原生 harness、实测与独立复核仍缺失，OI-07 统一模板与 11 项本地失败关闭校验已准备但 revision/Owner 输入/Provider target 均未取得；D-036 Provider/原生兼容协议已准备并固定 36 个兼容单元、13 个原生边界面和重复标准，但 OI-07、Provider 目标、Mac/Xcode、原生 harness、合成 corpus、凭证注入、真实网络授权、执行/结果和独立复核仍缺失，D-053 Provider 证据/App Privacy 协议已准备并固定 15 个最小 profile、150 项十维评估和至少 5 行映射，但 OI-07、Provider、证据采集/快照、映射、具名签署和独立复核仍缺失；六卡统一复核包已准备，且 10 项输入已冻结并记录 blob OID/SHA-256，但具名复核人未指派且实际复核未开始；20 项本地回执 validator 只验证机器合同，正式回执、attestation、签署核验与权威 PASS 仍为 0/false；D-040 为 `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`，前三批十三卡完成自审且独立复核包就绪，20 项本地回执 validator 已固定七份 frozen 输入、四域 attestation、十三卡、十二条不变量、P0~P3、disposition 与双层 SHA-256，但合成 fixture 不是现实证据，正式回执与 attestation 为 0，具名复核人、身份/独立性/胜任/签署核验和实际复核均未完成；D-063/D-070/D-071/D-072 内部卡与四卡复核包已形成，四卡包的 10 份输入已冻结并记录 blob OID/SHA-256，20 项本地回执 validator 已固定同一 packet、四域 attestation、四卡、十四不变量、P0~P3、disposition 与双层 SHA-256，但合成 fixture 不是现实证据，正式回执与 attestation 为 0，仍缺前两卡接受、健康数值边界与文案、D-068/D-069、Content QA 和独立复核；D-072 不解除硬停止、不创建目标/评分、不删或回算历史。健康评审九工件/十三项交接包及 20 项本地回执 validator 已就绪，但正式回执、attestation、具名健康评审人、资质核验、批准与 Content QA 均未完成，四个复核/交接包均未外联。WS/T 578.1-2017 现行宏量证据已补齐但 D-063/D-070/D-071/D-072 未 Owner-ready；NIDDK 动态模型来源可行性与官方许可路径已核验，未发送许可澄清模板也已就绪，但七项资产覆盖未确认且采用证据未通过，D-062/D-059 对应项未 Owner-ready，D-054~D-072 仍仅预留。D-032 是 `CANDIDATE + SPIKE_AUTHORIZED` 且 Windows JS/类型依赖表面、Android/iOS 平台条件 export 与共用结构校验子范围已通过。OI-02 精确为 Bundle ID 尚未创建、SKU=`N/A`，OI-03 精确为 iPhone 16 Pro Max / iOS 26.5 / 无 Mac；D-052/D-053 继续 fail closed；根目录正式工程、原生、签名、Archive 与 TestFlight 仍未授权。
