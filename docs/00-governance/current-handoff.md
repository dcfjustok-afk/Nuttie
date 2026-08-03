# Nuttie 当前交接

| 字段 | 当前事实 |
| --- | --- |
| 快照日期 | 2026-07-31（Asia/Shanghai） |
| 项目阶段 | Phase 0，产品、体验与 Build Ready 基线形成中 |
| Gate | G0/G1 `PASS`；G2/G3/G4 `IN_PROGRESS`；G5~G8 `FAIL` |
| 权威决定 | 17 项 `ACCEPTED`；14 项 `CANDIDATE` |
| 当前允许 | 文档、低保真原型、测试设计、许可证据、工作台维护；满足首批门槛后才可另行执行隔离 Spike |
| 当前禁止 | 正式 React Native 根工程、正式 lockfile、`ios/`、Apple 注册/付费、TestFlight 上传、发布或其他线上变更 |
| 下一位责任人 | Owner 将当前任务切换到 Plan 模式；PM 从 OI-03 设备条件原生选择卡继续，不重复已完成的 12 项选择 |

本文件是恢复入口，不是新的决定源。事实冲突时按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的优先级处理：Owner 明确回复和有效决定事件优先，其次是 [决定台账](decision-register.md) 与 `project-ops/decisions.json` 的一致副本；原型、推荐、工作台和本文件都不能替代 Owner 选择。

## 1. 权威状态与运行快照

`project-ops/decisions.json` 生成于 `2026-07-31T17:42:28+08:00`，与 [决定台账](decision-register.md) 一致，当前包含 17 项 `ACCEPTED` 和 14 项 `CANDIDATE`。

`project-ops/snapshots/current.json` 已于 `2026-07-31T18:33:21+08:00` 完成 Owner 交接封口，当前记录 17 项 accepted、14 项 candidate、59 个事件、74 条 Agent 消息、13 个角色和 1 个活跃角色；唯一活跃角色是 PM `root`。事件文件和消息 JSONL 的实际计数与快照一致，`owner_gate_reviewer` 与 `rn_stack_reviewer` 均为 `completed`。工作台静态副本已据此重建，新版 smoke、桌面/移动浏览器和 D-038 A/B/C 关键交互验收均通过；旧静态页面的 2 项 candidate/11 个角色/2 个活跃角色计数已经失效。

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
| [Phase 0 机器一致性验证](../05-quality/phase0-validation-report.md) | `PASS_WITH_GATE_BLOCKERS` | 报告验证的是首批候选登记前的历史快照；当前运行缓存必须重建后再声称一致 |
| [React Native / Expo 技术栈独立复核](../05-quality/rn-stack-independent-review.md) | `CONDITIONAL PASS`；重写要求已落实到当前决策包 | 没有初始化工程、安装依赖、生成 lockfile、Prebuild 或 Archive |
| [Owner 启动门禁独立审查](owner-startup-gate-independent-review.md) | 审查完成；发现的两阶段、选项完整性和候选登记问题已由当前决策包/台账收口 | 它是历史审查证据，文中的旧候选计数不能覆盖当前 17/14 权威状态 |
| [安全终审](../05-quality/security-review.md) | 总体 `BLOCKED`；安全协议文档发现已关闭 | 无实现、构建、真机、跨工具 corpus 或 Release 抓包证据，G4 不可 PASS |
| [食品数据许可审查](../05-quality/data-license-review.md) | `CONDITIONAL` | 台湾包须显名；USDA 境外分发由 D-052 fail closed |
| [iOS Release 独立审查](../05-quality/ios-release-readiness-review.md) | `BLOCKED` | 开发准备、G6 和 G7 都没有退出证据，不得宣称 Beta/Release Ready |
| [D-038 原型 Manifest](../03-design/prototype-manifest.md) | `CANDIDATE / OWNER_DECISION_PENDING`；DesignOps 与主 Agent 浏览器验收通过 | A/B/C 同等完整；初始 A 仅按字母顺序；只剩 Owner 明确选择 |
| [原型与 Owner 评审流程](../03-design/prototype-and-owner-review-workflow.md) | 流程草案已形成 | 设计必须先原型、跨角色审查、Owner 明确选择，再进入正式规格与实现 |

D-038 仓库同源为 [交互原型](../../prototypes/d038-navigation-shell/index.html)。它只比较产品导航外壳，不决定 D-018 导航库、React Native 版本、正式视觉或任何 Apple/发布事项。

## 5. 五条 pending evidence

当前研究总数是 `66 = 37 confirmed + 24 cross-source + 5 pending`。以下五条均因公开资料不足而保持 `pending`：

| Evidence ID | 公开资料不能证明什么 | Nuttie 处理边界 |
| --- | --- | --- |
| `LOG-08` | AI 识别结果是否有人工纠正入口及纠错范围 | 完整本地记录闭环需要，但只能标为 `Nuttie-required`，交互仍待 Owner |
| `LOG-09` | 手工搜索、自建食品、最近使用和收藏是否属于竞品功能 | 作为 Nuttie 本地闭环候选，不能合称竞品已证实 |
| `AI-06` | 协议免责声明提到的健康知识、营养知识和成功故事是否对应实际内容模块 | 只留研究台账，不进入确定 UI |
| `DATA-07` | 协议“可能包含广告”是否证明当前广告位或频率 | 不进入 Nuttie 目标实现 |
| `DATA-08` | 竞品是否存在导入、导出、备份、iCloud 或恢复流程 | D-006/D-012 的加密 Files 备份属于 `Nuttie-required`，不是竞品事实 |

权威逐行记录见 [竞品证据矩阵](../01-research/competitor-evidence-matrix.md)。EG-01~EG-09 是九组跨行 gap themes，不是另外九条 evidence，也不能与 66 相加。这五条 pending 不阻断 G1，但持续约束产品文案和“竞品全部功能”的宣称。

## 6. 当前阻塞

1. **Owner 第 1 批已开始但尚未完成回读。** 12 项候选已通过原生选择卡取得待回读输入；D-047 最新输入已回正为 C“当前不付费、只自用”，OI-01 为尚未加入，OI-02/OI-03 仍未关闭。全部内容见 [Owner 待回读输入](owner-intake-pending.md) 与 `project-ops/owner-intake.json`。整批最终确认前不能授权正式实现；D-032=A 即使最终回读确认，也只进入隔离 Spike 授权。
2. **D-038 尚未通过最终 Owner Gate。** DesignOps 与主 Agent 的桌面/移动视觉、console 和关键交互验收已完成；仍须由 Owner 明确选择 A/B/C，未选择前正式 IA/路由外壳保持阻断。
3. **G4 只有文档合同，没有执行证据。** 版本、库、密码学、AI policy 和相关产品候选仍未关闭；没有 SQLCipher/Keychain/备份/数据包的跨实现 Spike、构建、迁移、kill/restart、真机或 Release 网络证据。
4. **数据与 AI 分发 fail closed。** D-052 未处理前不向美国境外朋友分发 USDA；D-053 和 Provider 证据未满足前不向第三方 AI 发送健康/营养载荷。
5. **Apple 与设备事实缺失。** 尚无已核验的 Mac、macOS、Xcode、CocoaPods、真实 iPhone、Apple Developer Program 身份、Bundle ID、签名链、App Store Connect record 或 TestFlight build。

最终机器验收已完成：`31` 条决定记录为 `17 accepted + 14 candidate`，事件为 `59`，消息为 `74`，角色为 `13` 且仅 `root` 活跃；49 份 Markdown 的 96 个本地链接无断链。工作台在 `1280x720`、`375x812`、`320x700` 下无根级横向溢出或控件裁切；D-038 的 B 集中新增、C 更多菜单到食品资料均通过，直达页 console 为空，最终恢复 A 与页面顶部。

## 7. 下一步 Owner 互动

Owner 决策已经改为主 Codex 聊天内的原生 `request_user_input` 选择卡逐题进行，不再使用静态网页、复制式回复模板或字母文字回复。D-038、D-032、D-037、D-048、D-018、D-020、D-019、D-021、D-025、D-023、D-024、D-047 已取得待回读输入；不得重复询问。D-047 的最新 Owner 说明是当前只开发给自己使用、不付会员费、不做 TestFlight、暂不考虑朋友，因此待回读选项为 C；原始 A 只保留审计历史。

当前任务又处于 Default 模式，原生工具不可调用。Owner 切换到 Plan 模式并继续后，PM 从 OI-03 设备条件卡开始，随后关闭 OI-02 的 Bundle ID 状态；SKU 因当前不使用 App Store Connect 可记为 `N/A`。事实输入不得包含密码、2FA、私钥或设备 UDID。

首批逐题选择完成后，PM 必须把全部答案规范化回读为 `ACCEPTED`、`CANDIDATE + SPIKE_AUTHORIZED` 或 `DEFERRED`，并复述 OI 事实，再通过原生选择卡请求最终确认。Owner 点击确认前，不追加 `DECISION_ACCEPTED`，不静默采用推荐项，也不自动切换失败方案。D-032 的 A/B 仍只表示第一次隔离 Spike 授权。

## 8. 恢复与验证命令

先按 [Codex 连续性运行手册](codex-continuity-runbook.md) 的启动顺序读取权威文件。Windows PowerShell 中启动本地工作台：

```powershell
node D:\study\Nuttie-Discovery-Workbench\server.mjs --port 4173 --workspace D:\github\Nuttie
```

打开 `http://127.0.0.1:4173/`。基于已更新的 `project-ops/snapshots/current.json` 重建工作台静态副本并执行 smoke：

```powershell
node D:\study\Nuttie-Discovery-Workbench\qa\build-static-snapshot.mjs D:\github\Nuttie
node D:\study\Nuttie-Discovery-Workbench\qa\smoke-test.mjs http://127.0.0.1:4173
```

若浏览器拒绝直接打开 D-038 本地文件，在仓库同源目录启动只绑定 loopback 的预览：

```powershell
node D:\github\Nuttie\prototypes\d038-navigation-shell\server.mjs 4175
```

打开 `http://127.0.0.1:4175/`。端口冲突时可以换其他本地端口；不得把工作台或原型部署到公网。

恢复后至少重新确认：决定是 17/14；G0/G1、G2~G4、G5~G8 状态未被缓存改写；D-032 两阶段语义仍在；D-038 仍是 `CANDIDATE`；没有正式 `package.json`、lockfile、Expo config、`ios/`、Apple 资源或 TestFlight 产物。
