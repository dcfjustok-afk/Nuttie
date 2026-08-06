# Nuttie Project Ops

本目录是 D-009 的本地项目事件源。它记录真实发生的任务、Agent 消息、Owner 决策和门禁变化，供实时工作台与静态快照消费；不包含业务用户数据，也不连接任何云服务。

## 目录

```text
project-ops/
  decisions.json              # Owner 决策的机器可读权威副本
  schemas/                    # JSON Schema
  events/YYYY-MM-DD.jsonl     # append-only 项目事件
  messages/<role>.jsonl       # Agent 原始协作消息摘要
  snapshots/current.json      # PM 按源记录人工归并并校验的当前状态
  validate.mjs                # 无第三方依赖的运营一致性校验器
  validate.test.mjs           # 当前基线与单点突变负向测试
```

## 写入规则

1. 每行 JSONL 是独立、完整、UTF-8 JSON 对象。
2. 已记录事件不原地改写。事实变化时追加 `FACT_CORRECTION`；决定变化时追加新决定并设置 `supersedes`。
3. 当前仓库尚未实现事件 reducer；`snapshots/current.json` 由 PM 按 `events/*.jsonl`、`messages/*.jsonl`、决定台账和门禁文档人工归并并完成一致性校验。工作台静态快照只打包这份已校验状态，不得宣称自动重建；未来建立 reducer 后再切换为自动生成。
4. Agent 只能写其任务指定的消息文件；PM 负责合并、校验和门禁事件。
5. 时间使用 RFC 3339 和明确时区；当前项目默认 Asia/Shanghai。
6. 项目事件不得包含 API key、Authorization、健康记录、个人照片、完整 prompt、AI 响应或其他业务隐私数据。
7. `source.kind=agent_message` 只表示实际收到/发出的 Agent 消息；计划中的沟通不能预先记录为已发生。

## 工作台语义

- `active`：Agent 当前有已分配且未结束的任务。
- `waiting_review`：产物已交接，正在等待指定审查者答复。
- `completed`：本次任务已提交产物和总结，不代表门禁通过。
- `blocked`：存在明确阻断，且已按工作流升级。
- `idle`：没有当前任务；不应显示成持续工作。

## 校验

在仓库根目录执行：

```powershell
node project-ops/validate.mjs
node --test project-ops/validate.test.mjs
```

`validate.mjs` 不安装或加载第三方依赖，当前固定 `PHASE0_2026_08_06` 基线并检查：

- JSON/JSONL 解析、决定/事件/消息/证据 ID 唯一性。
- 每日事件文件、日期前缀、连续序号、记录日期和版本化的 `59/13/5/5` 日分布。历史事件存在已知的时间回填逆序，因此不以物理行时间单调作为失败条件。
- Agent 消息 `responseTo`、证据状态与五条 pending 集合。
- 决定、事件、消息、角色、证据和 gap theme 的源计数、快照计数与版本化基线。
- Agent ID 唯一性与唯一 active 角色 `root`；Owner intake 精确 12 项候选、未完成状态、D-047 A→C 审计链和 OI-03 原生选择卡入口。
- D-039 保持 `CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW`，且没有 Owner 选择或正式实现授权。
- D-040 保持 `CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`；首轮 reviewer 的临时 PX-1 表述未被 PM 接受，delta 回执不得授权 PX-1、PX-2、Owner 评审、决定接受或正式实现，也不得抢占 OI-03。

退出码约定为：`0` 校验通过，`1` 解析成功但一致性断言失败，`2` 用法、文件读取或 JSON/JSONL 解析失败。Owner 真正回答 OI-03、完成 D-039 PX-3、关闭 D-040 PX-0 输入，或权威计数合法变化时，必须在对应原子提交中显式升级版本化基线和测试，不能静默放宽断言。

该脚本只负责 Project Ops 解析和跨源运营一致性，不实现完整 Draft 2020-12 JSON Schema。`schemas/*.schema.json` 的严格合规仍须使用 AJV 8 + `ajv-formats` 或后续经批准的等价 validator；不得把本脚本的 PASS 描述为 schema PASS。
