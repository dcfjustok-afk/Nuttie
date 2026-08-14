# Nuttie 当前交接

| 字段 | 当前事实 |
| --- | --- |
| 快照日期 | 2026-08-14（Asia/Shanghai）；ProjectOps 人工归并快照与 2026-08-14 最新事件源一致 |
| 项目阶段 | Phase 0，产品、体验与 Build Ready 基线形成中 |
| Gate | G0/G1 `PASS`；G2/G3/G4 `IN_PROGRESS`；G5~G8 `FAIL` |
| 权威决定 | 28 项 `ACCEPTED`；3 项 `CANDIDATE`，其中 D-032 为 `SPIKE_AUTHORIZED` |
| 当前允许 | 文档、原型、测试设计、许可证据、工作台维护；约定隔离目录中的 SDK 57 JS Spike |
| 当前禁止 | 正式 React Native 根工程、正式 lockfile、`ios/`、Apple 注册/付费、TestFlight 上传、发布或其他线上变更 |
| 下一位责任人 | PM 用宿主原生 `request_user_input` 执行 D-039 PX-3 添加餐食选择 |

本文件是恢复入口，不是新的决定源。事实冲突时按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的优先级处理：Owner 明确回复和有效决定事件优先，其次是 [决定台账](decision-register.md) 与 `project-ops/decisions.json` 的一致副本；原型、推荐、工作台和本文件都不能替代 Owner 选择。

## 1. 权威状态与运行快照

`project-ops/decisions.json` 生成于 `2026-08-14T17:22:29+08:00`，与 [决定台账](decision-register.md) 一致，当前包含 28 项 `ACCEPTED` 和 3 项 `CANDIDATE`。

`project-ops/snapshots/current.json` 已按 `2026-08-14T23:38:39+08:00` 最新权威来源完成分支归并，当前记录 28 项 accepted、3 项 candidate、158 个事件、116 条 Agent 消息、25 个角色和 1 个活跃角色；唯一活跃角色是 PM `root`。Owner 已通过宿主原生 `request_user_input` 确认首批整批回读：11 项决定转为 accepted，D-032 仅获得隔离 SDK 57 JS Spike 授权；OI-02 为 Bundle ID 尚未创建、SKU=`N/A`，OI-03 为当前只有 `iPhone 16 Pro Max / iOS 26.5`、暂无可用 Mac。隔离 Spike 已在 Windows 上通过冻结安装、类型检查、Expo 配置、Doctor 20/20 与 Android/iOS 平台 Metro export；SQLite、SecureStore、Camera、Notifications、Reanimated、Worklets 的六个具体符号已进入类型与 Metro 路径且原生调用为零，Android 1,652 模块与 iOS 条件 1,565 模块 export 已共用平台限定 metadata、精确文件集、资产扩展名、路径和原生目录自动校验；字节数和 SHA 只记录单次运行、不作可复现构建门禁。它们不构成原生运行、签名产物或 iOS 证据，D-032 仍保持 candidate。合并同时保留本机 F01/F02/F16 共享 `AI_REQUEST_EVIDENCE_CONTEXT_V2`、AI 配置—策略预检、不可信响应、完整候选证据链及此前 F18/F19/F03/F09 等非生产合同。上述证据继续固定不证明原生 iOS、transport，也不授予发送或正式实现。D-039 保持 PX-2 并成为下一张选择卡，D-040 仍保留在 PX-0 后续队列。

门禁状态以 [阶段门禁](stage-gates.md) 为准：G0/G1 已通过；G2/G3/G4 仍在形成证据；G5~G8 因尚无经批准实现、构建、Beta 或发布证据而保持 `FAIL`。这里的 `FAIL` 表示退出条件尚不存在，不表示项目异常。

## 2. 决定状态

### 2.1 已接受 28 项

精确 ID：

```text
D-001, D-002, D-003, D-004, D-005, D-006, D-007, D-008, D-009,
D-010, D-011, D-012, D-013, D-014, D-015, D-016, D-017, D-018,
D-019, D-020, D-021, D-023, D-024, D-025, D-037, D-038, D-047,
D-048
```

新增接受项固定了 Expo Router、Zustand UI 状态边界、Drizzle + 受控 SQL、React Hook Form + Zod、Jest 单 runner、本地 Maestro + XCTest/XCUITest、StyleSheet semantic tokens、pnpm hoisted profile、四入口导航、当前不加入 Apple Developer Program 只自用，以及 iPhone 竖屏 profile。完整精确语义见决定台账。

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
| [追踪整改最终复验](../05-quality/traceability-review.md) | `PASS_WITH_OWNER_GATE_BLOCKERS` | 历史 66/37/24/5、F/REQ/AT 和当时 14 项候选可复核；不覆盖当前 28/3 状态 |
| [Phase 0 机器一致性验证](../05-quality/phase0-validation-report.md) | `PASS_WITH_GATE_BLOCKERS` | 报告只验证首批候选登记前的 7 月 31 日历史快照，不能替代当前计数 |
| [Phase 0 8 月 5 日验证基线](../05-quality/phase0-validation-report-2026-08-05.md) | `PASS_WITH_GATE_BLOCKERS`；当前权威数据、工作台和 D-039 复验通过 | 固化 31 决定、77 事件、86 消息、17 角色、66 条证据与 D-039 PX-2；不关闭 G2/G3/G4，也不代表 Owner 已选 D-039 |
| [React Native / Expo 技术栈独立复核](../05-quality/rn-stack-independent-review.md) | `CONDITIONAL PASS`；重写要求已落实到当前决策包 | 没有初始化工程、安装依赖、生成 lockfile、Prebuild 或 Archive |
| [Owner 启动门禁独立审查](owner-startup-gate-independent-review.md) | 审查完成；发现的两阶段、选项完整性和候选登记问题已由当前决策包/台账收口 | 它是历史审查证据，文中的旧候选计数不能覆盖当前 28/3 权威状态 |
| [安全终审](../05-quality/security-review.md) | 总体 `BLOCKED`；安全协议文档发现已关闭 | 无实现、构建、真机、跨工具 corpus 或 Release 抓包证据，G4 不可 PASS |
| [食品数据许可审查](../05-quality/data-license-review.md) | `CONDITIONAL` | 台湾包须显名；USDA 境外分发由 D-052 fail closed |
| [iOS Release 独立审查](../05-quality/ios-release-readiness-review.md) | `BLOCKED` | 开发准备、G6 和 G7 都没有退出证据，不得宣称 Beta/Release Ready |
| [D-038 原型 Manifest](../03-design/prototype-manifest.md) | 原型 PX 验证已完成；Owner 已接受 A 四入口 + 情境新增 | 原型中的历史 candidate 标记不能覆盖 2026-08-14 权威决定事件 |
| [D-039 原型 Manifest](../03-design/d039-prototype-manifest.md) | `CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW`；D039-QA-001 至 QA-010 全部关闭 | PX-2 只证明原型可提交评审；Owner 尚未选择 A/B/C，也未授权正式 React Native 实现 |
| [D-040 原型 Manifest](../03-design/d040-prototype-manifest.md) | `CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`；三方案流程与作者 QA 已形成 | 具体画像字段、公式、适用范围和特殊人群规则尚未关闭；不能进入 PX-1/PX-2 或 Owner 方案选择 |
| [原型与 Owner 评审流程](../03-design/prototype-and-owner-review-workflow.md) | 流程草案已形成 | 设计必须先原型、跨角色审查、Owner 明确选择，再进入正式规格与实现 |

D-038 仓库同源为 [交互原型](../../prototypes/d038-navigation-shell/index.html)。它只比较产品导航外壳，不决定 D-018 导航库、React Native 版本、正式视觉或任何 Apple/发布事项。D-039 仓库同源为 [添加餐食原型](../../prototypes/d039-add-meal-entry/index.html)，只比较添加餐食首层方式。D-040 仓库同源为 [首启资料与目标原型](../../prototypes/d040-onboarding-goals/index.html)，只比较 A/B/C 流程，并明确不执行健康公式。三个 Manifest 中的 `CANDIDATE` 都是原型门禁状态，不得误读为 Owner 已接受决定。

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

1. **D-039 已通过 PX-2，但尚未通过 PX-3 Owner Gate。** D039-QA-001 至 QA-010 已全部关闭，原型可提交 Owner 评审；在 Owner 明确选择 A/B/C 前，不得把某个添加餐食首层方案写成正式体验基线。
2. **D-040 保留在后续队列。** A/B/C 流程、恢复、无目标和失败零写入已形成原型，但最小字段、目标公式、适用范围和特殊人群停止规则未关闭；不得把固定测试夹具当作产品目标。它不再阻断当前 D-039 选择与隔离 JS Spike。
3. **G4 仍未通过；纯 JS Spike 子范围已验证。** 工程基础选择已接受，现有框架无关合同继续提供本地事实、事务、AI fail-closed 与禁止能力边界。合并后的 ProjectOps 有 5 份 Schema/277 个实例；F01/F02/F16 共享请求证据只接受唯一剩余 policy blocker 为 `D053_NOT_AUTHORIZED` 的本地上下文，AI 配置—策略预检还会精确绑定非敏感配置证据并固定阻断 D-033/D-034/D-036/D-053，且二者均不证明 transport、不授予发送。完整 response 指纹、F18 删除、F19 恢复/导入、F03 数据包/条码、F09 及其他合同均不等于真实 SQLCipher、Keychain、网络、原生或 Release 证据。D-032 Windows JS/类型依赖表面与 Android/iOS 平台条件 export 已通过，两平台 export 结构校验已共用核心自动化且不把字节数/SHA 冒充可复现构建证据；正式根工程、Prebuild/Xcode/CocoaPods、原生编译与运行证据继续关闭。
4. **数据与 AI 分发 fail closed。** D-052 未处理前不向美国境外朋友分发 USDA；D-053 和 Provider 证据未满足前不向第三方 AI 发送健康/营养载荷。
5. **Apple 原生链路仍阻断。** 已记录 iPhone 16 Pro Max / iOS 26.5 与 Bundle ID 尚未创建，但当前无可用 Mac、macOS、Xcode、CocoaPods、具体 Bundle ID、签名链、App Store Connect record 或 TestFlight build；只有 iPhone 不构成原生构建能力。
6. **Choice UI 宿主阻塞已关闭。** 当前任务已真实暴露宿主原生 `request_user_input`，OI-02 与首批整批确认均已返回并登记；旧 MCP 候选无需安装。下一门禁是 D-039，完整迁移记录见 [Choice UI 宿主只读审计](../04-engineering/choice-ui-host-audit-2026-08-14.md)。

当前合并基线全库 792/792、工具合同 642/642、ProjectOps 验证 121/121、Schema 子集 14/14、只读对账 5/5；包含 5 个 Schema、`277` 个受控实例、`31` 条决定、1 份 Owner intake、`158` 个事件、`116` 条消息和 25 个角色。事件/消息 ID 唯一且所有 `responseTo` 可解析；验证器同时锁定 11 项接受事件、D-032 Spike 授权、Windows JS 实测、六包依赖表面边界、Android/iOS 平台 JS export 与共用导出后结构校验、OI-02/OI-03 精确事实、D-039 下一门禁及本机新增非生产合同。`project-ops/reconcile.mjs` 对账 28/3 决定状态、D-032 隔离 JS Spike、D-039 PX-2 和 D-040 PX-0 授权位。隔离 SDK 57 Spike 的冻结安装、静态合同、六包类型/Metro 解析、Expo config、Doctor 20/20、1,652 模块 Android export、1,565 模块 iOS 条件 export 和 10 项共用核心 export 结构校验单测已通过，但所有原生调用为零，原生 iOS/SQLCipher/Keychain/Archive/真机证据仍 pending。证据矩阵仍为 `66 = 37 confirmed + 24 cross-source + 5 pending`；Windows 主机继续阻断原生路径。

## 7. 下一步 Owner 互动

Owner 决策继续使用主 Codex 聊天内的宿主原生 `request_user_input`。首批输入与 OI-01 至 OI-03 已确认，不得重复询问。PM 下一步从 `owner-intake.json` 指定的 `d039_add_meal_entry` 继续，展示 D-039 权威 A/B/C 选项并等待 Owner 真实选择；不得从页面当前状态或 PX-2 PASS 推导答案。

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

恢复后至少重新确认：决定是 28/3；事件/消息/角色是 158/116/25 且仅 `root` 活跃；Owner 首批状态为 `CONFIRMED`，D-032 是 `CANDIDATE + SPIKE_AUTHORIZED` 且 Windows JS/类型依赖表面、Android/iOS 平台条件 export 与共用导出后结构校验子范围已通过，下一题是宿主原生 `request_user_input` 的 `d039_add_meal_entry`；OI-02 精确为 Bundle ID 尚未创建、SKU=`N/A`，OI-03 精确为 iPhone 16 Pro Max / iOS 26.5 / 无 Mac；共享 AI 请求证据、AI 配置—策略预检、不可信响应、候选完整指纹及其他非生产合同不得冒充 Provider/schema/营养真值、发送许可、真实持久化、网络、原生或 Release 证据；D-052/D-053 继续 fail closed；D-039 是 `CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW`；D-040 是 `CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`；根目录正式工程仍未授权，隔离 `spikes/sdk57-js` 不等于 Xcode/CocoaPods/原生编译或运行、Android 原生/签名产物、可复现原生构建、正式根 scaffold、Apple 资源、签名 Archive 或 TestFlight 产物。
