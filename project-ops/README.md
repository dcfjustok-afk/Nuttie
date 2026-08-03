# Nuttie Project Ops

本目录是 D-009 的本地项目事件源。它记录真实发生的任务、Agent 消息、Owner 决策和门禁变化，供实时工作台与静态快照消费；不包含业务用户数据，也不连接任何云服务。

## 目录

```text
project-ops/
  decisions.json              # Owner 决策的机器可读权威副本
  schemas/                    # JSON Schema
  events/YYYY-MM-DD.jsonl     # append-only 项目事件
  messages/<role>.jsonl       # Agent 原始协作消息摘要
  snapshots/current.json      # 事件归并后的当前状态
```

## 写入规则

1. 每行 JSONL 是独立、完整、UTF-8 JSON 对象。
2. 已记录事件不原地改写。事实变化时追加 `FACT_CORRECTION`；决定变化时追加新决定并设置 `supersedes`。
3. 工作台当前状态由事件 reducer 生成，静态快照只是一份可重建缓存。
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

在工程脚本建立前，JSON 与 JSONL 至少需要通过解析校验；后续应增加基于 `schemas/*.schema.json` 的自动校验、事件 ID 唯一性检查、时间排序检查和 decision Markdown/JSON 一致性检查。
