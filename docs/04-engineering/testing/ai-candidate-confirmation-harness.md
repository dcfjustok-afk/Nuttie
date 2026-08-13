# AI 候选确认与幂等保存合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应：F01/F02、REQ-F01/REQ-F02、AT-F01/AT-F02
>
> 实现：[ai-candidate-confirmation-harness.mjs](../../../tools/ai-candidate-confirmation-harness.mjs)；测试：[ai-candidate-confirmation-harness.test.mjs](../../../tools/ai-candidate-confirmation-harness.test.mjs)

## 目的

既有 `ai-policy` 证明 Provider/载荷准入、用户动作和 D-014 标签照片预览门禁，`ai-response-contract` 把不可信响应限制为未持久化候选，`ai-credential-lifecycle` 处理配置与秘密值生命周期。它们都故意不实现 AT-F01/AT-F02 的下游 Application 边界：AI 结果必须先作为可编辑候选，由用户检查并明确保存；失败不能丢本地输入；明确保存前业务 Repository 零写入。

本合同补上这条框架无关确认链，但不实现 AITransport、UI、SQLite 或正式 Repository。

## 三类数据边界

1. `localInput` 是用户本地文字/媒体引用的 opaque、JSON-safe 输入，只保存在 `VOLATILE_APPLICATION_STATE_ONLY` 状态中；transport 或响应失败时原样保留。
2. `candidates` 必须先通过既有 `parseAiResponse` 的严格 schema、未知字段与资源预算校验，只作为未经确认的编辑参考。
3. `AI_CONFIRMED_VALUE_V1` 由调用方提供版本化 definition 与用户确认 payload。本合同不解释 payload 字段，也不把测试中的餐食文字变成正式业务 schema。

保存 effect 只携带第三类数据和审计来源，不携带 `localInput`、原始响应、候选 label/nutrients/confidence 或秘密字段。保存成功后，终态清除本地输入、AI candidate、编辑值和 review 临时对象；Repository 只保留用户确认记录。

## 状态与确认绑定

```text
AWAITING_RESPONSE
  -> EDITING
  -> REVIEW_READY
  -> SAVING
  -> SAVED | SAVE_FAILED
```

- transport/响应失败保持 `AWAITING_RESPONSE` 和原本地输入；手工路径仍可达。
- `EDITING` 必须显式选择一个已校验 candidate，并提供 caller-owned confirmed value。
- `REVIEW_READY` 同时绑定 request context、candidate 和 confirmed value fingerprint；再次编辑会清除旧 review 与保存上下文。
- `SAVING` 之前不会生成 Repository effect；重复保存点击不产生第二个 effect。
- `SAVE_FAILED / NOT_COMMITTED` 可以回到手工草稿；`SAVE_FAILED / UNKNOWN` 必须先用同一命令重放，不能编辑或重新创建记录。
- `SAVED` 是终态，并把 retention 标记为 `VOLATILE_INPUT_PURGED_AFTER_COMMIT`。

所有状态在转换入口按状态 union 重建验证。伪造 `REVIEW_READY`、篡改 request/policy/candidate/review 指纹或替换 pending command 都不能生成或结算保存。

## Repository Port

```text
saveConfirmedRecord(AI_CONFIRMED_RECORD_COMMAND_V1)
  -> AI_CONFIRMED_RECORD_RECEIPT_V1

readConfirmedRecord(recordId)
  -> AI_CONFIRMED_RECORD_V1
```

持久化记录包含 caller-owned `confirmedValue` 和 `AI_CONFIRMED_SOURCE_EVIDENCE_V1`。来源证据绑定 request ID、HTTPS origin、model、payload class、transport/profile 版本、policy evidence、完整 request context、candidate 和 review fingerprint，来源种类固定为 `AI_ASSISTED_USER_CONFIRMED`。

新 `commandId` 必须在同一逻辑事务中写入确认记录和幂等结果。相同命令重放返回 `REPLAYED`；同 ID 不同 payload、不同命令竞争同一 record ID、伪造回执和不一致 readback 都失败关闭。提交后结果丢失或有效回执后的 readback 失败归类为 `UNKNOWN`，只能通过原命令收敛。

内存 Repository 只证明端口语义和单进程并发序列化，不证明 D-020、SQLite/SQLCipher 事务、进程终止恢复或真实持久化。

## 当前自动化证据

20 项 Node 测试覆盖：

- 易失本地输入复制/冻结、失败保留、秘密字段/特殊对象/循环与资源滥用拒绝；
- 复用严格 AI response contract，非法响应不产生 candidate；
- candidate 选择、caller-owned confirmed value、显式 review 与编辑失效；
- request context、policy evidence、candidate、confirmed value 和 review 的完整指纹绑定；
- 保存 effect 不携带原始本地输入或 AI candidate；
- 幂等提交、提交前零写入、提交后未知结果重放和 post-receipt readback 分类；
- command/record 冲突、并发序列化、伪造 effect/receipt/state/readback 和迟到 attempt 拒绝；
- 保存前手工降级与保存后易失输入清理；
- 无网络、文件、系统时钟、原生、日记/目标自动修改或 AITransport 实现。

运行：

```powershell
node --test tools/ai-policy-harness.test.mjs tools/ai-response-contract-harness.test.mjs tools/ai-candidate-confirmation-harness.test.mjs tools/manual-meal-entry-harness.test.mjs
```

## 未授权与后续门禁

本合同没有授权或证明：

- D-031 媒体/AI 内容保留，D-033 非标签载荷确认频率；
- D-034 生产资源预算，D-036 transport/session/redirect profile，D-053 Provider 数据用途准入；
- 真实 AI 请求、Keychain 读取、Authorization/body 组装、Provider adapter、网络抓包或原生 session；
- 首发输入/确认字段、餐食/目标/计划映射、自动改日记/目标、保存后导航、撤销或 UI 文案；
- D-020、SQLite/SQLCipher、正式 Repository、组件/E2E、真机、Release 或 Gate 变更。

下一步仍需 Owner 关闭 AI 相关候选和业务字段/体验规则，在批准的 Repository 上实现同一端口，并用组件、进程终止、真实网络捕获和真机证据复验。本合同只把“AI 候选不能绕过用户确认直接写库”变成可执行 Application 要求。
