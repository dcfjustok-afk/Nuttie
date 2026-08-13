# AI Provider Policy Authorization Harness

状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`

路径：`tools/ai-policy-harness.mjs` 与 `tools/ai-policy-harness.test.mjs`

## 目的

这个 harness 验证 AI 唯一网络边界在读取 Keychain key、生成 Authorization 或序列化敏感 body 之前的本地准入合同。它把 D-003/D-004/D-014 的已接受约束与 D-053 当前 `CANDIDATE / NOT_AUTHORIZED` 事实同时绑定，防止一个普通对象里的裸 `state: ALLOW` 被解释成真实发送授权。

## Provider policy profile

严格 profile 必须包含：

- `providerId`、规范化 HTTPS origin、model/payload class 集合、profile version 和适用地区；
- terms/privacy 的安全 HTTPS URL 或离线快照 SHA-256；
- 调用方提供的真实 UTC `reviewedAt`/`expiresAt`，且有效期严格有序；harness 不读系统时钟；
- retention、training、human access、deletion mechanism、advertising/marketing 和 health data use 风险枚举；
- `ALLOW/DENY/UNKNOWN/EXPIRED`、review basis 和 `CALLER_POLICY_ASSERTION_NOT_PROVIDER_TRUTH`；
- 覆盖全部字段的不可变 `profileFingerprint`。

scope 数组必须 dense、唯一、非空且不超过 64 项。Apple 禁止用途按不可豁免规则失败关闭：训练或广告营销为 `ALLOWED`、健康数据被用于请求服务以外用途时，profile 即使标成 `ALLOW` 也不能通过。

## 精确请求与 D-053

`POLICY_CHECK_SUBJECT_V1` 把 provider、完整 baseURL、规范化 origin、model、payload class、profile version、region 和调用方提供的 observed instant 绑定为不可变 subject fingerprint。任何一个 scope、证据、时间、地区或 profile version 变化都需要新的检查。

D-053 evidence 精确记录当前治理事实：

```text
decisionId: D-053
decisionState: CANDIDATE
authorization: NOT_AUTHORIZED
authorizationBoundary: CANDIDATE_NOT_OWNER_ACCEPTED
```

因此，即使本地 profile=`ALLOW`、scope 完全匹配、仍在有效期且没有 Apple 禁止用途，当前结果也必须是 `eligible=false / D053_NOT_AUTHORIZED`。伪造 `ACCEPTED/AUTHORIZED`、保留旧指纹、旧裸 ALLOW profile 或松散请求 shape 都失败关闭。

营养标签照片的逐次预览要求直接从已验证 subject 的 `payloadClass=nutrition-label-photo` 得出，不再信任调用方另传的 `labelPhoto` 布尔提示。用户主动触发和预览都不能替代 D-053。

## 明确不授权

本工件不读取 Keychain、不组装 Authorization、不序列化敏感 body、不调用 `fetch`、不连接 Provider、不保存业务数据，也不创建可发送 transport candidate。D-033 预览频率、D-034 资源预算、D-036 URL/session/redirect、D-053 证据标准与 Owner 选择仍未冻结。

policy profile 是本地调用方声明，不等于 Provider 实际运营真值；未来 D-053 获接受后仍须重新设计版本化授权 evidence、逐 Provider/地区审查、网络抓包和 Release 复验，不能直接把本 harness 的 candidate evidence 改字段复用。

## 验收标准

当前 22 条顶层测试覆盖 HTTPS、严格 subject/profile、证据引用、真实 UTC 有效期、scope 预算、风险枚举与 Apple 禁项、profile/D-053 篡改、精确 scope、地区、过期/非 ALLOW、裸 ALLOW 拒绝、subject-bound 标签预览、业务状态不变、重放失败与零副作用源码审计。

```powershell
node --test tools/ai-policy-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
```
