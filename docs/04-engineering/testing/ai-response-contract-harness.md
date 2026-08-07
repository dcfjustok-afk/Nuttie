# AI Response Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/ai-response-contract-harness.mjs` 与 `tools/ai-response-contract-harness.test.mjs`

该 harness 把 AI 返回值视为不可信的 `unknown`，只验证版本化 JSON、候选字段、七项营养字段、有限深度/大小/数量、数值范围和零写入失败语义。通过解析只产生未持久化 `CANDIDATE`，不会调用网络、读取 Keychain、发送 Authorization 或写 SQLite。

它不决定 D-033 的逐次预览范围，不冻结 D-034 资源预算，不实现 D-036 session/redirect profile，也不改变 D-053 Provider 用途准入；响应 schema 仅为测试合同，正式 API 仍需 Owner 决策和原生 Spike。

验证：

```powershell
node --test tools/ai-response-contract-harness.test.mjs
```
