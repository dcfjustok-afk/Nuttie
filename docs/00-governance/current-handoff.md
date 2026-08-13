# Nuttie 当前交接

| 字段 | 当前事实 |
| --- | --- |
| 快照日期 | 2026-08-13（Asia/Shanghai）；ProjectOps 人工归并快照仍与 2026-08-12 最新事件源一致 |
| 项目阶段 | Phase 0，产品、体验与 Build Ready 基线形成中 |
| Gate | G0/G1 `PASS`；G2/G3/G4 `IN_PROGRESS`；G5~G8 `FAIL` |
| 权威决定 | 17 项 `ACCEPTED`；14 项 `CANDIDATE` |
| 当前允许 | 文档、低保真原型、测试设计、许可证据、工作台维护；满足首批门槛后才可另行执行隔离 Spike |
| 当前禁止 | 正式 React Native 根工程、正式 lockfile、`ios/`、Apple 注册/付费、TestFlight 上传、发布或其他线上变更 |
| 下一位责任人 | PM 用聊天内原生 choice-ui 关闭 OI-02 Bundle ID 状态，再执行首批整批回读 |

本文件是恢复入口，不是新的决定源。事实冲突时按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的优先级处理：Owner 明确回复和有效决定事件优先，其次是 [决定台账](decision-register.md) 与 `project-ops/decisions.json` 的一致副本；原型、推荐、工作台和本文件都不能替代 Owner 选择。

## 1. 权威状态与运行快照

`project-ops/decisions.json` 生成于 `2026-07-31T17:42:28+08:00`，与 [决定台账](decision-register.md) 一致，当前包含 17 项 `ACCEPTED` 和 14 项 `CANDIDATE`。

`project-ops/snapshots/current.json` 已于 `2026-08-12T23:48:24+08:00` 完成人工归并，当前记录 17 项 accepted、14 项 candidate、126 个事件、114 条 Agent 消息、25 个角色和 1 个活跃角色；唯一活跃角色是 PM `root`。本轮在 AI 凭据、F04/F05/F06/F08/F10/F11/F12/F13/F14/F15/F17/F18/F21 合同和 F20/F23/F24 禁止能力审计之后，继续登记 F22 平台/语言 Release 审计合同；十五项都没有改变 Owner intake 或 Gate。两项 Release 聚合审计当前都明确为 `BLOCKED`：没有正式签名 Release Archive，F20/F23/F24 缺 27 面生产报告；F22 还缺设备族、方向、Mac、Vision availability 四项权威决定和 25 面发布报告。OI-03 已通过原生 choice-ui 记录为当前只有 `iPhone 16 Pro Max / iOS 26.5`、暂无可用 Mac；两路独立审查确认这不授权 iOS 原生工作。D-039 仍保持 PX-2，D-040 仍阻断于 PX-0。

门禁状态以 [阶段门禁](stage-gates.md) 为准：G0/G1 已通过；G2/G3/G4 仍在形成证据；G5~G8 因尚无经批准实现、构建、Beta 或发布证据而保持 `FAIL`。这里的 `FAIL` 表示退出条件尚不存在，不表示项目异常。

## 2. 决定状态

### 2.1 已接受 17 项

精确 ID：

```text
D-001, D-002, D-003, D-004, D-005, D-006, D-007, D-008, D-009,
D-010, D-011, D-012, D-013, D-014, D-015, D-016, D-017
```

这些决定固定了公开可验证的竞品验收口径、本地食品来源方向、每人 BYOK、HTTPS-only、Expo development build + prebuild、本地加密存储与手动备份、首版不接 HealthKit、开发期 TestFlight、项目工作台、完整功能地图优先、iOS 17+、签名数据包导入、首版营养字段、营养标签照片逐次预览、SQLCipher + Keychain、首发简体中文和完整范围分阶段交付。

### 2.2 已登记候选 14 项

精确 ID：

```text
D-018, D-019, D-020, D-021, D-023, D-024, D-025, D-032, D-037,
D-038, D-047, D-048, D-052, D-053
```

其中当前可回复的第 1 批 12 项，按 [Owner 分批决策包](../02-product/owner-decision-packs.md) 的提问顺序为：

```text
D-047, D-048, D-037, D-032, D-038, D-018,
D-020, D-019, D-021, D-025, D-023, D-024
```

D-052 是 USDA 数据面向美国境外朋友的再分发口径；未决定前，USDA 原始或转换数据只用于本地研发，不进入面向美国境外朋友的 TestFlight/IPA。D-053 是第三方 AI Provider 数据用途准入；未决定且 Provider/载荷证据不足时，一律按 `UNKNOWN/BLOCKED` 处理，Apple 明确禁止的用途不能由 Owner 豁免。

登记为 `CANDIDATE` 只关闭“Owner 问题草案与权威机器台账双重真源”的问题，不表示 Owner 已选择。决策包中的其他后续题目仍是规划队列，不计入当前 14 项权威候选，也不得被当作 accepted。

## 3. D-032 的两阶段语义

D-032 保留同一个决定 ID，但必须发生两次独立 Owner 动作：

1. **第一次：Spike candidate baseline。** Owner 选择 A（SDK 57）或 B（SDK 56）时，只授权在约定的隔离 `spikes/` 边界创建候选 `package.json`、唯一 lockfile 和测试用 Prebuild。记录语义只能是 `CANDIDATE + SPIKE_AUTHORIZED`，不能改为 `ACCEPTED`，也不能创建正式 Nuttie 根工程。选择 C 则继续禁止工程和 Spike。
2. **第二次：Final frozen matrix。** 团队提交 lockfile/Podfile.lock 实际解析版本、Mac/macOS/Xcode/CocoaPods、New Architecture 强制状态、SQLCipher、Keychain、通知、相机、Prebuild diff、Debug/Release/Archive 和真机证据后，Owner 再选择接受最终矩阵、改变候选或停止；只有这次明确确认才能把 D-032 冻结为最终 accepted 版本矩阵。

第一次动作还依赖 D-037 的精确包管理器 profile 和 OI-03 的真实设备/工具事实。D-048 与 OI-02 Bundle ID 最迟在首次正式 Prebuild 前关闭；D-047/OI-01 不阻断文档、原型、空 scaffold 或无签名 Simulator Spike，但会阻断稳定真机签名、App Store Connect 和 TestFlight。

## 4. 已完成评审与原型

| 产物 | 当前结论 | 接续时不得误读 |
| --- | --- | --- |
| [追踪整改最终复验](../05-quality/traceability-review.md) | `PASS_WITH_OWNER_GATE_BLOCKERS` | 66/37/24/5、F/REQ/AT 和 14 项候选可复核；不关闭 G2/G3/G4 |
| [Phase 0 机器一致性验证](../05-quality/phase0-validation-report.md) | `PASS_WITH_GATE_BLOCKERS` | 报告只验证首批候选登记前的 7 月 31 日历史快照，不能替代当前计数 |
| [Phase 0 8 月 5 日验证基线](../05-quality/phase0-validation-report-2026-08-05.md) | `PASS_WITH_GATE_BLOCKERS`；当前权威数据、工作台和 D-039 复验通过 | 固化 31 决定、77 事件、86 消息、17 角色、66 条证据与 D-039 PX-2；不关闭 G2/G3/G4，也不代表 Owner 已选 D-039 |
| [React Native / Expo 技术栈独立复核](../05-quality/rn-stack-independent-review.md) | `CONDITIONAL PASS`；重写要求已落实到当前决策包 | 没有初始化工程、安装依赖、生成 lockfile、Prebuild 或 Archive |
| [Owner 启动门禁独立审查](owner-startup-gate-independent-review.md) | 审查完成；发现的两阶段、选项完整性和候选登记问题已由当前决策包/台账收口 | 它是历史审查证据，文中的旧候选计数不能覆盖当前 17/14 权威状态 |
| [安全终审](../05-quality/security-review.md) | 总体 `BLOCKED`；安全协议文档发现已关闭 | 无实现、构建、真机、跨工具 corpus 或 Release 抓包证据，G4 不可 PASS |
| [食品数据许可审查](../05-quality/data-license-review.md) | `CONDITIONAL` | 台湾包须显名；USDA 境外分发由 D-052 fail closed |
| [iOS Release 独立审查](../05-quality/ios-release-readiness-review.md) | `BLOCKED` | 开发准备、G6 和 G7 都没有退出证据，不得宣称 Beta/Release Ready |
| [D-038 原型 Manifest](../03-design/prototype-manifest.md) | `CANDIDATE / OWNER_DECISION_PENDING`；DesignOps 与主 Agent 浏览器验收通过 | A/B/C 同等完整；初始 A 仅按字母顺序；只剩 Owner 明确选择 |
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

1. **Owner 第 1 批已开始但尚未完成回读。** 12 项候选已通过原生选择卡取得待回读输入；D-047 最新输入已回正为 C“当前不付费、只自用”，OI-01 为尚未加入，OI-03 已记录设备 profile，OI-02 仍待规范化。全部内容见 [Owner 待回读输入](owner-intake-pending.md) 与 `project-ops/owner-intake.json`。整批最终确认前不能授权正式实现；D-032=A 即使最终回读确认，也只进入隔离 Spike 授权。
2. **D-038 尚未通过最终 Owner Gate。** DesignOps 与主 Agent 的桌面/移动视觉、console 和关键交互验收已完成；仍须由 Owner 明确选择 A/B/C，未选择前正式 IA/路由外壳保持阻断。
3. **D-039 已通过 PX-2，但尚未通过 PX-3 Owner Gate。** D039-QA-001 至 QA-010 已全部关闭，原型可提交 Owner 评审；在 Owner 明确选择 A/B/C 前，不得创建正式餐食录入页面、路由或据此改变决定台账。
4. **D-040 尚未关闭 PX-0 输入。** A/B/C 流程、恢复、无目标和失败零写入已形成可操作原型，但最小字段、目标公式、适用范围和特殊人群停止规则未获 Owner 与领域评审确认；不得把固定测试夹具当作产品目标或进入正式实现。
5. **G4 仍未通过，但框架无关的本地契约证据持续增加。** 除既有 Domain、AI policy、导入安全、数据包、备份、餐食、营养和 wipe 夹具外，本轮新增合同已覆盖 F04/F05/F06/F08/F10/F11/F12/F13/F14/F15/F17/F18/F21 的框架无关事实、事务、读模型和应用编排；`tools/prohibited-capability-audit-harness.*` 锁定 F20/F23/F24 签名 Release Archive 与 27 个禁止能力必查面，`tools/platform-language-release-audit-harness.*` 固定 F22 的 D-011 iOS 17.0、D-016 首发简中，并将设备族、方向、Mac、Vision availability 和 25 个发布证据面分开门控。8 月 13 日框架无关契约与治理检查全套 591 项测试通过；ProjectOps 使用无第三方依赖的受控 Draft 2020-12 子集校验 5 份 Schema 和 243 个 decisions/Owner intake/current snapshot/Event/Message 实例，未支持关键字与循环/外部 `$ref` 失败关闭，但不宣称完整通用 JSON Schema 引擎合规。两项 Release 聚合审计都保持 `BLOCKED`，因为没有正式目标、四项平台形态决定、生产扫描、模拟器/真机/Store/布局/无障碍或 Release 网络/权限捕获。D-039/D-040 自动 smoke、导航候选浏览器交互和视觉资产合同也复验通过。所有这些仍为 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`：不依赖 RN/SQLite/真实 Keychain/HealthKit/网络/UserNotifications/相机/照片，不冻结资料字段、当前/多档案策略、档案级联删除、显示精度、异常阈值、BMI、目标体重、同日聚合、内建默认餐次、默认/自定义餐次规则、移动/复制、运动字段、消耗公式、Left 公式/缺失默认值/负值/舍入、目标生成、百分比换算、实际/目标比较、目标舍入、目标/净值、平均/更长周期、未来日/补记/跨时区重基/默认今天、饮水目标/快捷量/单位/撤销/趋势、提醒类型/重复规则/通知内容/滚动窗口/DST 默认策略、权限文案、媒体保留、明文导出、备份恢复、秘密值访问、真实容器完成、设备族/方向/Mac/Vision availability，或 D-026/D-027/D-030/D-031/D-033/D-034/D-035/D-036/D-053，也不构成正式实现、构建、迁移、签名 Archive、真机或 Release 网络证据。
6. **数据与 AI 分发 fail closed。** D-052 未处理前不向美国境外朋友分发 USDA；D-053 和 Provider 证据未满足前不向第三方 AI 发送健康/营养载荷。
7. **Apple 原生链路仍阻断。** 已记录 iPhone 16 Pro Max / iOS 26.5，但当前无可用 Mac、macOS、Xcode、CocoaPods、Bundle ID、签名链、App Store Connect record 或 TestFlight build；只有 iPhone 不构成原生构建能力。

当前机器验收基线包含 4 个 schema、`31` 条决定、1 份 Owner intake、`126` 个事件、`114` 条消息和 25 个角色；事件/消息 ID 唯一且所有 `responseTo` 可解析。验证器锁定 AI 凭据、F04/F05/F06/F08/F10/F11/F12/F13/F14/F15/F17/F18/F21、F20/F23/F24 禁止能力与 F22 平台/语言十五项非生产合同，拒绝把它们冒充 Owner、产品规则、平台形态决定、真实原生调用、正式 Release 目标、生产报告或正式实现授权。`project-ops/reconcile.mjs` 对账 OI-03 精确事实、OI-02 choice-ui 下一题、D-039 PX-2 和 D-040 PX-0 六项授权位。证据矩阵仍为 `66 = 37 confirmed + 24 cross-source + 5 pending`。只读环境审计记录于 [本机 iOS 工具链审计](../04-engineering/local-ios-toolchain-audit-2026-08-06.md)：当前 Windows 主机不可见 Expo CLI、`xcodebuild` 和 CocoaPods；与 Owner 当前无可用 Mac 的事实一致，但不替代未来 Mac 实机审计。

## 7. 下一步 Owner 互动

Owner 决策使用主 Codex 聊天内的原生 `choice-ui` 逐题进行，不再使用静态网页、复制式回复模板或字母文字回复。D-038、D-032、D-037、D-048、D-018、D-020、D-019、D-021、D-025、D-023、D-024、D-047 已取得待回读输入；OI-03 已取得设备事实；不得重复询问。D-047 最新待回读选项为 C。D-039 已达到 PX-3 提交条件，但仍须使用单独的原生 A/B/C 选择卡，不得从页面切换或 PX-2 PASS 推导答案。

PM 下一步从 `owner-intake.json` 指定的 OI-02 Bundle ID 状态卡继续，并在完成首批整批回读后安排 D-039 PX-3 原生选择卡；SKU 因当前不使用 App Store Connect 可记为 `N/A`。事实输入不得包含密码、2FA、私钥或设备 UDID。

首批逐题选择完成后，PM 必须把全部答案规范化回读为 `ACCEPTED`、`CANDIDATE + SPIKE_AUTHORIZED` 或 `DEFERRED`，并复述 OI 事实，再通过原生选择卡请求最终确认。Owner 点击确认前，不追加 `DECISION_ACCEPTED`，不静默采用推荐项，也不自动切换失败方案。D-032 的 A/B 仍只表示第一次隔离 Spike 授权。

## 8. 恢复与验证命令

先按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的启动顺序读取权威文件。当前实际仓库根目录是 `D:\aaaProject\Nuttie`。外部 `D:\study\Nuttie-Discovery-Workbench` 不存在，因此本轮没有伪造工作台 smoke；如恢复该工具，再用实际仓库路径启动：

```powershell
node D:\study\Nuttie-Discovery-Workbench\server.mjs --port 4173 --workspace D:\aaaProject\Nuttie
```

打开 `http://127.0.0.1:4173/`。基于已更新的 `project-ops/snapshots/current.json` 重建工作台静态副本并执行 smoke：

```powershell
node D:\study\Nuttie-Discovery-Workbench\qa\build-static-snapshot.mjs D:\aaaProject\Nuttie
node D:\study\Nuttie-Discovery-Workbench\qa\smoke-test.mjs http://127.0.0.1:4173
```

若浏览器拒绝直接打开 D-038 本地文件，在仓库同源目录启动只绑定 loopback 的预览：

```powershell
node D:\aaaProject\Nuttie\prototypes\d038-navigation-shell\server.mjs 4175
```

打开 `http://127.0.0.1:4175/`。端口冲突时可以换其他本地端口；不得把工作台或原型部署到公网。

D-039 冻结预览使用独立 loopback 服务，并执行原型 smoke：

```powershell
node D:\aaaProject\Nuttie\prototypes\d039-add-meal-entry\server.mjs 4176
node D:\aaaProject\Nuttie\prototypes\d039-add-meal-entry\qa-smoke.mjs http://127.0.0.1:4176/ $env:TEMP\Nuttie-D039-QA
```

打开 `http://127.0.0.1:4176/`。页面只用于评审，不保存 Owner 选择。

D-040 冻结预览和自动 QA：

```powershell
node D:\aaaProject\Nuttie\prototypes\d040-onboarding-goals\server.mjs 4177
node D:\aaaProject\Nuttie\prototypes\d040-onboarding-goals\qa-smoke.mjs http://127.0.0.1:4177/ $env:TEMP\Nuttie-D040-QA
```

打开 `http://127.0.0.1:4177/`。该页面只比较首启资料与目标流程；固定数值不是健康公式结果，也不保存 Owner 选择。

恢复后至少重新确认：决定是 17/14；事件/消息/角色是 126/114/25 且仅 `root` 活跃；最新事件登记 F22 平台/语言 Release 审计合同且不改变 Gate/Owner intake，必须保持 `BLOCKED + FORMAL_TARGET_ABSENT + PLATFORM_SHAPE_DECISION_REQUIRED + REQUIRED_SURFACE_MISSING`，只固定 D-011 iOS 17.0 与 D-016 首发简中，不得从 D-038/当前 iPhone/工具默认值推导设备族、方向、Mac 或 Vision availability，不得声称已执行 25 面证据、验证决定/报告真实性或关闭发布门禁；F20/F23/F24 仍保持 `BLOCKED + FORMAL_TARGET_ABSENT + REQUIRED_SURFACE_MISSING`，不得声称已运行生产工件扫描、Release 网络或定位权限捕获；F21 仍不得授权权限文案、D-031 保留、视频、定位、持久化、真实原生 API、网络或正式实现；F18 仍不得授权 D-035 明文导出、D-027/D-030 备份恢复、秘密值、真实容器完成、写入或正式实现；F04 Left 必须是 `POLICY_NOT_AUTHORIZED`，其余非生产合同也不得扩大产品规则；OI-03 精确为 iPhone 16 Pro Max / iOS 26.5 / 无 Mac，下一题是 OI-02；G0/G1、G2~G4、G5~G8 状态未被缓存改写；D-032 两阶段语义仍在；D-039 是 `CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW`；D-040 是 `CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`；没有正式 `package.json`、lockfile、Expo config、`ios/`、Apple 资源、签名 Archive 或 TestFlight 产物。
