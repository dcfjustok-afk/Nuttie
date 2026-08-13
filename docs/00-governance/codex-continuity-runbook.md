# Nuttie Codex 连续性运行手册

> 状态：项目级工作规范
>
> 生效日期：2026-07-31
>
> 目的：即使新的 Codex 实例无法读取历史会话，也能只依赖仓库文件恢复项目事实、决策边界、当前门禁、工作包和验证方法。

## 1. 新实例启动顺序

新的主 Agent 在执行任何产品、设计、工程或发布动作前，必须按下列顺序读取：

1. 根目录 `README.md` 与 `AGENTS.md`（若存在）。
2. `docs/00-governance/current-handoff.md`，恢复当前阶段、已完成事项、开放问题和下一步。
3. `docs/00-governance/decision-register.md` 与 `project-ops/decisions.json`，确认哪些决定已经接受、哪些仍是候选。
4. `docs/00-governance/stage-gates.md`、`risk-register.md` 和 `operating-model.md`，确认门禁与角色责任。
5. `docs/02-product/owner-decision-packs.md`，只读取当前批次，不把推荐项当作 Owner 选择。
6. 与当前工作包相关的研究、产品、设计、工程和质量文档；不要为了省时跳过其直接引用的验收或安全材料。
7. `project-ops/snapshots/current.json`、最新事件 JSONL 和相关 Agent 消息 JSONL，核对工作台状态是否与文档一致。

若 `current-handoff.md` 与权威决策、事件源或专业报告冲突，必须停止扩展实现，按第 2 节的优先级确定事实并修订交接文档。

## 2. 权威事实优先级

从高到低使用以下优先级：

1. Owner 最新明确回复，以及引用该回复的有效 `DECISION_ACCEPTED` 事件。
2. `decision-register.md` 与 `project-ops/decisions.json` 的一致副本。
3. 已签署的阶段门禁和独立质量/安全审查结论。
4. Feature、Requirement、Acceptance Traceability 和 ADR 等受控项目文档。
5. `project-ops` 原始事件与 Agent 消息。
6. `current-handoff.md`、静态快照和工作台渲染结果。
7. 聊天摘要、Agent 自述、建议、原型和未登记草案。

推荐、`proposed`、`CANDIDATE`、原型默认状态、Spike 结果和常见技术惯例都不能替代 Owner 的明确选择。若 Markdown 与机器副本不一致，保持 fail closed，并由项目经理修复双副本后再推进。

Owner 决策的主交互通道是当前 Codex 聊天中的原生 `request_user_input` 选择卡。PM 每轮只弹出一个稳定 D 编号，等待 Owner 点击选项后再问下一项；不得要求 Owner 输入字母，也不得让 Owner 从静态网页复制整批表单。逐题答案先暂存，批次完成后由 PM 统一规范化回读，并再次用原生选择卡请求最终确认，确认后才更新权威决定和事件流。D-032 的 A/B 在第一次动作中只可记录为 `CANDIDATE + SPIKE_AUTHORIZED`，仍需 Spike 证据后的第二次 Owner 动作才能最终接受。若当前任务处于 Default 模式且工具不可用，先请求 Owner 切换到 Plan 模式；不得以网页弹窗替代。

## 3. 阶段恢复检查

新实例必须回答并在 commentary 中简短说明以下问题：

- 当前处于哪个 Gate，哪些 Gate 是 `PASS`、`IN_PROGRESS` 或 `FAIL`？
- 当前允许执行的是调研、原型、Spike、正式实现、TestFlight 还是仅文档工作？
- 是否存在尚未处理的 Owner 候选或事实输入？
- 当前工作是否会创建 `package.json`、lockfile、`ios/`、Apple 资源、付费或外部数据？
- 需要哪些独立角色互审，哪些交接尚未收到？
- 这轮结束时必须更新哪些文档、事件、消息和验证证据？

任何一个问题无法从仓库回答时，不得猜测为已批准；先把缺口登记到 `current-handoff.md` 或 Owner 决策包。

## 4. 设计必须先原型后实现

产品设计工作遵循以下强制顺序：

1. 从 Feature、Requirement、Acceptance、信息架构和状态基线建立原型范围。
2. 对存在实质差异的方案制作同等完整的低保真原型，不把推荐方案做得更完整来诱导选择。
3. 使用适合任务的设计开发工具生成可检查产物；交互、布局或状态比较优先使用可交互原型，视觉资产需要时再使用图像工具。
4. 在桌面、320 pt、375 pt 和 430 pt 宽度下检查文字、焦点、键盘、Dynamic Type 风险、减少动态效果和状态完整性。
5. 将原型登记到 `docs/03-design/prototype-manifest.md`，记录版本、范围、关联决定、工具、路径、验证和已知限制。
6. 向 Owner 展示实际效果并收集明确选择；未确认前保持 `CANDIDATE`。
7. Owner 选择写入权威台账后，设计师再产出高保真规范、组件状态和开发交接。
8. 工程只实现已批准方案；原型代码不是生产代码，也不能直接复制为正式架构。

原型评审细节由 `docs/03-design/prototype-and-owner-review-workflow.md` 规定。原型预览可以放在 `D:\study`，但仓库中的 manifest、设计决定、评审结论和重建方法必须足以让另一台设备继续工作。

## 5. 多 Agent 协作记录

主 Agent 可以按工作包并行激活产品、设计、架构、安全、数据许可、发布和 QA 角色。每条工作线必须满足：

- 任务边界、允许修改的文件和禁止动作明确。
- 至少有一次真实的跨角色交接或互审；不能只由各 Agent 单向回复项目经理。
- 只有实际发生的派单、消息、审查、风险和交接才能写入 `project-ops`。
- Agent 未交付或被中断时如实记录，不补写 `HANDOFF_READY` 或 `TASK_COMPLETED`。
- 专业 Agent 不自行接受 Owner 决定、不改变 Gate、不执行发布。
- 项目经理负责归并冲突、回读 Owner 选择、维护事件连续性和最后汇报。

工作台是事件源的视图，不是事实源。办公室动画、在线状态或回放不能被解释为 Agent 在后台持续运行。工作台可以显示当前问题、候选参考和决策进度，但不得保存 Owner 点击、生成回复模板或提供复制/下载答案；只有主聊天原生选择卡中的点击和后续最终确认具有决策输入资格。

## 6. 每轮结束的持久化清单

只要本轮产生阶段性结论，主 Agent 在结束前必须按实际范围完成以下项目：

- 更新 `docs/00-governance/current-handoff.md` 的快照日期、结论、开放决定、风险、当前工作和下一步。
- 将新决定同步到 Markdown 台账与机器副本，并追加引用 Owner 回复的事件；未接受项保持候选。
- 将真实 Agent 派单、互审和交接追加到对应 JSONL，不改写历史行。
- 新增或更新专业文档，并在 manifest/README 中提供入口。
- 若工作台数据变化，重建静态快照并核对实时/静态计数一致。
- 运行与风险相称的语法、schema、链接、smoke、测试和视觉检查。
- 明确记录未执行的项目，例如未初始化工程、未真机构建、未上传 TestFlight、未 commit/push。

不得只把阶段结论留在聊天、最终回复或不可重建的本机 UI 状态中。

## 7. 本地工作台恢复

仓库路径必须从当前线程的 workspace root 或 `git rev-parse --show-toplevel` 读取，不能假定旧 checkout。外部工作台默认路径仍为 `D:\study\Nuttie-Discovery-Workbench`。该目录不存在时如实记录“未运行”，不要伪造 smoke。存在时在 Windows PowerShell 中：

```powershell
$repoRoot = (git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $repoRoot -PathType Container)) { throw "无法解析当前仓库根目录" }
$repoRoot = (Resolve-Path -LiteralPath $repoRoot).Path
$workbenchRoot = 'D:\study\Nuttie-Discovery-Workbench'
if (-not (Test-Path -LiteralPath $workbenchRoot -PathType Container)) { throw "工作台目录不存在：$workbenchRoot" }
node (Join-Path $workbenchRoot 'server.mjs') --port 4173 --workspace $repoRoot
```

浏览器打开：

```text
http://127.0.0.1:4173/
```

重建可离线读取的静态快照：

```powershell
node (Join-Path $workbenchRoot 'qa\build-static-snapshot.mjs') $repoRoot
```

运行工作台 smoke：

```powershell
node (Join-Path $workbenchRoot 'qa\smoke-test.mjs') http://127.0.0.1:4173
```

若端口被占用，使用其他本地端口；不要把本地工作台部署到公网。静态快照不得包含 API key、Authorization、健康记录、照片、完整 prompt 或 AI 响应。

## 8. 工程与外部动作边界

- 在当前 Owner 批次和受控 Spike 边界明确前，不创建正式 React Native 工程、正式 lockfile 或 `ios/`。
- 除用户主动发起的 AI 请求外，Nuttie 业务能力不得联网。
- API key 只进入本机安全存储，不进入 Git、文档、事件、原型或工作台。
- 未经 Owner 对具体动作的明确授权，不注册 Apple 资源、不付费、不上传、不发布、不修改线上配置。
- Git commit 只在用户明确要求时执行；未明确要求绝不 push。
- Windows 不能替代 Mac/Xcode/真实 iPhone 的 iOS 原生与 TestFlight 证据。

## 9. 交接质量门槛

`current-handoff.md` 只有在以下条件满足时才能标记为可接续：

- 所有路径存在，关键链接可解析。
- 决策状态、Gate、Agent 名册和计数与项目事件源一致。
- 已完成、部分完成、候选、阻断和未开始清楚分离。
- 每个下一步都有依赖、责任角色、允许动作和验证方式。
- 新实例无需访问旧聊天即可知道下一条应做什么，以及为什么当前不能做更多。
