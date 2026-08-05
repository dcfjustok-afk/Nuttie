# Phase 0 机器一致性验证基线（2026-08-05）

状态：`PASS_WITH_GATE_BLOCKERS`
日期：2026-08-05（Asia/Shanghai）
角色：项目经理复验；独立 Agent 审计结论已回收
范围：治理、研究、产品、设计、工程、质量、`project-ops`、本地工作台和 D-039 冻结原型

## 1. 结论

当前 Phase 0 权威数据、人工归并快照、本地工作台和 D-039 冻结原型在本轮检查范围内相互一致。4 个 Draft 2020-12 schema 均在严格模式下编译成功，31 项决定、1 份 Owner intake、77 个事件和 86 条 Agent 消息全部通过实例校验；事件与消息链、快照计数、竞品证据统计和工作台动态/静态数据也均通过复核。

该结论不代表产品、体验或 Build Ready 已完成。G2、G3、G4 继续为 `IN_PROGRESS`；G5 至 G8 因尚无对应退出证据保持 `FAIL`。D-039 仅通过 PX-2 并达到 Owner 评审条件，Owner 尚未选择 A/B/C，也未授权正式 React Native 实现。

## 2. 验证结果

| 检查项 | 结果 | 可复核结果 |
| --- | --- | --- |
| Draft 2020-12 schema | PASS | `decision-register`、`owner-intake`、`event`、`message` 共 4 个 schema 以严格模式编译；1 份决定台账、1 份 Owner intake、77 个事件和 86 条消息全部有效 |
| 决定台账 | PASS | 共 31 项：17 项 `ACCEPTED`、14 项 `CANDIDATE`；决定 ID 唯一 |
| 事件流 | PASS | 共 77 个事件：2026-07-31 为 59 个、2026-08-03 为 13 个、2026-08-05 为 5 个；各日 ID 前缀正确且序号连续，全局 ID 唯一 |
| Agent 消息链 | PASS | 共 86 条消息；`messageId` 唯一，所有非空 `responseTo` 均可解析到既有消息或事件 |
| Owner intake | PASS | 1 份 intake 保持 `IN_PROGRESS_MODE_INTERRUPTED`，`acceptanceStateChanged=false`；OI-03 仍是下一张 Plan 模式原生 `request_user_input` 选择卡 |
| 快照与角色 | PASS | `current.json` 与源数据一致：17 个角色、仅 PM `root` 为 active；决定、事件和消息计数全部一致 |
| 竞品证据 | PASS | 66 条唯一行级证据：37 `confirmed` + 24 `cross-source` + 5 `pending`；五条 pending 精确为 `LOG-08`、`LOG-09`、`AI-06`、`DATA-07`、`DATA-08` |
| Markdown 本地链接 | PASS | 报告写入前有 54 份受跟踪 Markdown、114 个仓库相对本地链接、0 个断链；本报告及交接入口加入后复验为 55 份、115 个、0 个断链 |
| 工作台一致性 | PASS | `http://127.0.0.1:4173/` 的动态状态与静态副本全量一致；smoke 返回 31 项决定、77 个事件、86 条消息、17 个角色和 66 条证据 |
| D-039 自动流程 | PASS | 19/19 流程通过；320、375、430、desktop 四视口通过；`externalRequests=0`、`runtimeProblems=0` |

## 3. D-039 门禁解释

D-039 的权威原型状态保持为：

```text
CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW
```

该状态只证明 D039-QA-001 至 D039-QA-010 已关闭，冻结原型可进入 PX-3 Owner 评审。它不产生以下效果：

- 不把 D-039 登记为 `ACCEPTED`，当前 `project-ops/decisions.json` 仍没有 D-039 条目。
- 不从原型默认显示、字母顺序或 PX-2 结果推导 Owner 选择。
- 不授权创建正式餐食录入页面、路由、React Native 根工程、正式 lockfile 或 `ios/`。

Owner 后续必须通过聊天内单独的原生 A/B/C 选择卡完成 PX-3。当前 Default 模式不能调用该卡，因此门禁继续 fail closed。

## 4. 当前 Gate 与阻断

| Gate | 状态 | 本报告后的解释 |
| --- | --- | --- |
| G0 项目立项 | `PASS` | 不变 |
| G1 调研可信 | `PASS` | 不变；五条 pending 继续限制竞品功能宣称，但不阻断 G1 |
| G2 产品基线 | `IN_PROGRESS` | Owner 待回读批次、OI-02/OI-03 和其他产品候选尚未关闭 |
| G3 体验基线 | `IN_PROGRESS` | D-038 与 D-039 均缺 Owner 最终选择 |
| G4 Build Ready | `IN_PROGRESS` | 缺版本矩阵最终冻结、工程实现、依赖锁定、安全执行证据和 Apple 设备事实 |
| G5-G8 | `FAIL` | 尚无经批准实现、增量验收、Beta、Release 或复盘退出证据；不表示项目异常 |

Windows 环境没有产生 Mac、macOS、Xcode、CocoaPods、真实 iPhone、签名、Archive、Keychain、相机、通知、迁移或 Release 网络证据。正式 iOS 原生结论仍须在受支持的 Mac/Xcode 和真实 iPhone 上取得。

## 5. 方法与边界

- Schema 校验使用 AJV Draft 2020-12 严格模式和标准 format 校验；本轮没有为此向仓库增加依赖、`package.json` 或 lockfile。
- JSONL 逐行解析后检查 schema、全局 ID 唯一性、每日事件连续性和跨文件 `responseTo`。
- Markdown 基线检查覆盖所有受 Git 跟踪的 `*.md`；链接统计只计仓库相对本地链接，不把 README 中指向 `D:\study` 的绝对交付物路径计入 114。
- 工作台使用 `D:\study\Nuttie-Discovery-Workbench\qa\smoke-test.mjs` 复核动态服务与静态副本；D-039 使用仓库内 `qa-smoke.mjs` 执行全流程复验。
- `project-ops/snapshots/current.json` 仍由 PM 根据事件、消息、决定和门禁人工归并；仓库当前没有 reducer。静态 builder 只打包该快照，不能被描述为权威状态 reducer。

## 6. Disposition

最终 disposition 为 `PASS_WITH_GATE_BLOCKERS`。本轮质量基线可以交接，项目继续进行文档、低保真原型、测试设计、许可证据和本地工作台工作；任何被 Owner 门禁或原生设备证据阻断的正式实现仍不得提前开始。
