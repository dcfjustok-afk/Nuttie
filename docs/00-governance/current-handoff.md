# Nuttie 当前交接

| 字段 | 当前事实 |
| --- | --- |
| 快照日期 | 2026-08-17（Asia/Shanghai）；ProjectOps 人工归并快照与 2026-08-17 最新事件源一致 |
| 项目阶段 | Phase 0，产品、体验与 Build Ready 基线形成中 |
| Gate | G0/G1 `PASS`；G2/G3/G4 `IN_PROGRESS`；G5~G8 `FAIL` |
| 权威决定 | 29 项 `ACCEPTED`；3 项 `CANDIDATE`，其中 D-032 为 `SPIKE_AUTHORIZED`；D-039=A 已接受 |
| 当前允许 | 文档、原型、测试设计、许可证据、工作台维护；约定隔离目录中的 SDK 57 JS Spike |
| 当前禁止 | 正式 React Native 根工程、正式 lockfile、`ios/`、Apple 注册/付费、TestFlight 上传、发布或其他线上变更 |
| 下一位责任人 | PM 为 D-039 B05 准备 D-034 资源预算中立选择卡；D-033/D-031/D-045 与 D-040 第一批卡等待独立复核，D-039 保持 PX-4 已冻结、PX-5 未授权 |

本文件是恢复入口，不是新的决定源。事实冲突时按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的优先级处理：Owner 明确回复和有效决定事件优先，其次是 [决定台账](decision-register.md) 与 `project-ops/decisions.json` 的一致副本；原型、推荐、工作台和本文件都不能替代 Owner 选择。

## 1. 权威状态与运行快照

`project-ops/decisions.json` 生成于 `2026-08-15T00:03:31+08:00`，与 [决定台账](decision-register.md) 一致，当前包含 29 项 `ACCEPTED` 和 3 项 `CANDIDATE`。

`project-ops/snapshots/current.json` 已按 `2026-08-17T21:08:00+08:00` 最新权威来源完成归并，当前记录 29 项 accepted、3 项 candidate、168 个事件、116 条 Agent 消息、25 个角色和 1 个活跃角色；唯一活跃角色是 PM `root`。Owner 首批整批回读仍为 11 项 accepted，D-032 仅获得隔离 SDK 57 JS Spike 授权；后续 Owner 查看冻结 D-039 原型后明确回复 `a`，D-039 方案 A 现为 `ACCEPTED / PX-3_PASS / PX-4_BASELINE_FROZEN`。首次 PX-5 DoR 为 `NOT_READY`；B01/B02 已关闭，当前 `B03~B07 / 5 BLOCKERS / D039-PX5-OWNER_DEPENDENCIES_REQUIRED`。B03 的 D-045 最近/收藏、B04 的 D-031 媒体/AI 保留与 B05 的 D-033 非标签 AI 上传确认三包内部卡均已完成四域自审，仍为 `INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY`。D-040 的 20 个决定轴、D-054~D-072 候选 ID 预留和第一批四卡保持不变，同样等待独立复核。OI-02 仍为 Bundle ID 尚未创建、SKU=`N/A`，OI-03 仍为当前只有 `iPhone 16 Pro Max / iOS 26.5`、暂无可用 Mac。隔离 Spike 的 Android/iOS JS export 与共用结构校验保持通过，所有原生调用仍为零。D-039 DoR 进展、ID 预留和卡片自审都不授权正式页面、路由、原生或发布工作。

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
| [D-039 路由与可观测性契约](../03-design/d039-route-observability-contract.md) | 5 route、严格参数、43 个静态 testID、2 个动态模式和 6 类恢复已冻结 | 规格完成不等于 Router、组件、E2E、真机或正式实现证据 |
| [D-045 最近与收藏内部卡](../03-design/d045-recent-favorites-card-spec.md) | 三套完整政策包与四域自审已完成 | 独立复核、Owner 展示/选择、决定接受和 B03 关闭均未发生 |
| [D-031 媒体与 AI 内容保留内部卡](../03-design/d031-media-ai-retention-card-spec.md) | 三套完整政策包、临时内容清理、备份/删除和四域自审已完成 | 独立复核、Owner 展示/选择、决定接受和 B04 关闭均未发生 |
| [D-033 非标签 AI 上传确认内部卡](../03-design/d033-nonlabel-ai-confirmation-card-spec.md) | 三套完整政策包、D-014 保留范围、单次绑定/失效和四域自审已完成 | 独立复核、Owner 展示/选择、决定接受和 B05 关闭均未发生 |
| [D-039 正式验收矩阵](../05-quality/d039-formal-acceptance-matrix.md) | 24 条用例覆盖首层、本地、最近、扫描、AI、保存、返回和无障碍 | 规格完成不等于实现或真机证据；依赖阻断保持条件化 |
| [D-039 PX-4 设计基线](../03-design/d039-px4-design-baseline.md) | 首层层级、返回、状态、无障碍顺序和四域复核已冻结 | 稳定设计 ID 尚未映射到经授权的正式页面/路由，真机与持久化证据仍缺失 |
| [D-040 原型 Manifest](../03-design/d040-prototype-manifest.md) | `CANDIDATE / PX-0_INPUT_GAP / FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED`；三方案流程与作者 QA 已形成 | 20 个决定轴已分配候选 ID，第一批四卡完成自审；独立复核、其余卡片、支持文案和健康评审治理仍未关闭，不能进入 PX-1/PX-2 或 Owner 方案选择 |
| [D-040 第一批选择卡规格](../03-design/d040-first-batch-card-spec.md) | D-054/D-055/D-056/D-058 稳定 ID、互斥选项、`NOT_APPLICABLE` 和 `Other` 规范化已固定 | `INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY`；没有决定接受或实现授权 |
| [D-040 问题分解](../03-design/d040-question-allocation.md) | D-040 最终结构 + D-054~D-072 预留，共 20 个独立轴 | 不进入决定台账/Owner intake；第一小批规格与跨域复核待完成 |
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
2. **D-040 已完成问题分解，选择卡规格仍待评审。** A/B/C 流程、恢复、无目标和失败零写入已形成原型；公式/治理证据复审归零，20 个决定轴已分配候选 ID。中国支持文案、健康评审治理和第一小批中立卡规格尚未关闭；不得把固定测试夹具当作产品目标，也不得直接向 Owner 提交未成熟选择卡。
3. **G4 仍未通过；纯 JS Spike 子范围已验证。** 工程基础选择已接受，现有框架无关合同继续提供本地事实、事务、AI fail-closed 与禁止能力边界。合并后的 ProjectOps 有 5 份 Schema/287 个实例；D-039 B01/B02 关闭、D-045、D-031、D-033 与 D-040 内部卡自审都不授权正式工程。F01/F02/F16 共享请求证据只接受唯一剩余 policy blocker 为 `D053_NOT_AUTHORIZED` 的本地上下文；D-033 只完成内部卡，AI 配置—策略预检仍阻断 D-033/D-034/D-036/D-053；正式根工程、Prebuild/Xcode/CocoaPods、原生编译与运行证据继续关闭。
4. **数据与 AI 分发 fail closed。** D-052 未处理前不向美国境外朋友分发 USDA；D-053 和 Provider 证据未满足前不向第三方 AI 发送健康/营养载荷。
5. **Apple 原生链路仍阻断。** 已记录 iPhone 16 Pro Max / iOS 26.5 与 Bundle ID 尚未创建，但当前无可用 Mac、macOS、Xcode、CocoaPods、具体 Bundle ID、签名链、App Store Connect record 或 TestFlight build；只有 iPhone 不构成原生构建能力。
6. **D-039 Owner 阻塞已关闭。** OI-02、首批整批确认和 D-039=A 均已登记；D-040 仍只是计划中的 Owner 队列占位，第一小批选择卡规格与 PX 前置必须先关闭。完整宿主迁移记录见 [Choice UI 宿主只读审计](../04-engineering/choice-ui-host-audit-2026-08-14.md)。

当前合并基线全库 831/831、工具合同 642/642、ProjectOps 验证 160/160、Schema 子集 14/14、只读对账 5/5；包含 5 个 Schema、`287` 个受控实例、`32` 条决定、1 份 Owner intake、`168` 个事件、`116` 条消息和 25 个角色。验证器锁定首批接受事件、D-039=A 单独接受/PX-4/PX-5 NOT_READY、B01/B02、D-045、D-031 与 D-033 三包内部卡的稳定 ID/自审/未授权状态、D-040 的 20 轴分解与第一批四卡、D-032 Spike 授权、OI-02/OI-03、Windows JS/双平台 export 与全部非生产合同。`project-ops/reconcile.mjs` 对账 D-039 `D039-PX5-OWNER_DEPENDENCIES_REQUIRED`、D-045 `D045_INDEPENDENT_REVIEW_REQUIRED`、D-031 `D031_INDEPENDENT_REVIEW_REQUIRED`、D-033 `D033_INDEPENDENT_REVIEW_REQUIRED`、D-040 `FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED`，并继续证明正式实现和 Owner 卡均未越级授权。证据矩阵仍为 `66 = 37 confirmed + 24 cross-source + 5 pending`；Windows 主机继续阻断原生路径。

## 7. 下一步 Owner 互动

Owner 已明确选择 D-039=A，不得重复询问；PX-4 设计基线也已完成。PM 下一步为 D-040 的 D-054/D-055/D-056/D-058 第一小批编写并复核中立选择卡规格。`owner-intake.json` 中的 `d040_onboarding_goals` 只是队列占位，D-040 达到 `READY_FOR_OWNER_REVIEW` 前不得提前展示。

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

恢复后至少重新确认：决定是 29/3；事件/消息/角色是 168/116/25 且仅 `root` 活跃；D-039=A 为 `ACCEPTED / PX-4_BASELINE_FROZEN / PX-5_DOR_NOT_READY`，B01/B02 已关闭、B03~B07 共 5 项开放且正式实现为 false；D-045、D-031 与 D-033 三包内部卡自审通过但独立复核/Owner 卡未排期，均未进入决定台账或 Owner intake；D-040 为 `CANDIDATE / PX-0_INPUT_GAP / FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED`，D-054~D-072 仅预留。D-032 是 `CANDIDATE + SPIKE_AUTHORIZED` 且 Windows JS/类型依赖表面、Android/iOS 平台条件 export 与共用结构校验子范围已通过。OI-02 精确为 Bundle ID 尚未创建、SKU=`N/A`，OI-03 精确为 iPhone 16 Pro Max / iOS 26.5 / 无 Mac；D-052/D-053 继续 fail closed；根目录正式工程、原生、签名、Archive 与 TestFlight 仍未授权。
