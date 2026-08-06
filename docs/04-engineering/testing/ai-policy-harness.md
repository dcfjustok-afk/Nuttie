# AI Policy Contract Harness

状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`

路径：`tools/ai-policy-harness.mjs` 与 `tools/ai-policy-harness.test.mjs`

## 目的

这个 harness 只验证 AI 唯一网络边界的本地准入和失败不变量，不创建真实网络请求。它把已接受的 D-003/D-004/D-014 约束转换为可执行测试，同时保持 D-033、D-036、D-053 的未决细节未冻结。

覆盖范围：

- Base URL 必须使用 `https:`；不实现 Provider endpoint 拼接、重定向或 session profile。
- Provider policy 必须按 origin、model、payload class 和 profile version 精确匹配；`UNKNOWN/DENY/EXPIRED` 和 scope mismatch fail closed。
- 请求必须由前台用户主动发起；营养标签照片必须有本次预览确认。
- 通过本地准入后只产生 `CANDIDATE`，仍标记 `NOT_SENT`、`persisted=false`；未经过用户编辑和明确接受不允许提交。
- 所有阻断和失败结果都返回旧业务状态，证明零写入。

## 明确不授权

本工件不读取 Keychain、不组装 Authorization、不调用 `fetch`、不连接 Provider、不保存健康/营养载荷，也不是正式 AITransport 实现。它不改变 D-053 的 Provider 证据门禁，不替代 D-033 的预览频率选择，也不冻结 D-036 的 URL/session/redirect 细节。

## 验证

```powershell
node --test tools/ai-policy-harness.test.mjs
```
