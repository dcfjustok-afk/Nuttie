# AI 请求证据共享上下文合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：F01/F02、F16、D-033/D-034/D-036/D-053（均不因本合同获得授权）
>
> 实现：[ai-request-evidence-context-harness.mjs](../../../tools/ai-request-evidence-context-harness.mjs)；测试：[ai-request-evidence-context-harness.test.mjs](../../../tools/ai-request-evidence-context-harness.test.mjs)

## 目的

F01/F02 候选确认和 F16 参考草稿此前各自维护一份松散的 `AI_REQUEST_CONTEXT_V1`，只记录 origin、model、payload/profile 版本和一个调用方哈希。它不能证明这些字段来自同一个严格 policy subject，也不能独立核验 profile、D-053 evidence 和发送前检查结果。

本合同用唯一 `AI_REQUEST_EVIDENCE_CONTEXT_V2` 取代两份重复定义。它只为调用方注入的不可信响应样本提供本地来源绑定，不证明真实请求发生、Provider 返回过响应或发送获得授权。

## 完整证据与失败关闭

上下文精确绑定：

- `requestId` 和 transport profile 版本；
- 完整 `POLICY_CHECK_SUBJECT_V1`，包括 provider、baseURL/origin、model、payload class、profile 版本、地区、观察时间和 subject 指纹；
- 完整 `PROVIDER_POLICY_PROFILE_V1`，包括 terms/privacy 引用、风险、有效期、地区、状态和 profile 指纹；
- 完整 `D053_AUTHORIZATION_EVIDENCE_V1`；
- 由同三份证据重新计算的 `POLICY_CHECK_RESULT_V1`；
- 对全部字段和固定边界计算的 `contextFingerprint`。

只有 scope 精确匹配、观察时间落在有效期、profile=`ALLOW`、Apple 禁项满足，且唯一剩余阻断为 `D053_NOT_AUTHORIZED` 时才可创建上下文。subject/profile/authorization/check/boundary/context 任一字段或指纹变化、旧 V1、额外字段、访问器和特殊对象均失败关闭。

## 固定未授权边界

`AI_REQUEST_EVIDENCE_BOUNDARY_V1` 固定声明：

```text
evidenceKind       = CALLER_SUPPLIED_UNTRUSTED_RESPONSE_FIXTURE
transportOccurrence = NOT_ESTABLISHED
sendAuthorization  = NOT_GRANTED
downstreamUse      = PROVENANCE_ONLY
networkRequests    = 0
```

因此完整 policy 证据不是发送许可。当前 D-053 仍是 `CANDIDATE / NOT_AUTHORIZED`；本合同不读取 Keychain、不组装 Authorization/body、不联网、不持久化业务数据，也不把本地 policy 声明冒充 Provider 运营真值。

[AI 配置与策略预检](./ai-configuration-policy-preflight-harness.md)会把本上下文与稳定非敏感配置证据共同绑定，并比较 baseURL/origin/model。即使三项完全一致，配置仍没有 `providerId` 身份，因此预检保持 `BLOCKED`，且 D-033/D-034/D-036/D-053 均继续独立阻断。

## 当前自动化证据

7 项 Node 测试覆盖完整证据/指纹绑定、未授权边界、旧版和异常对象拒绝、嵌套篡改、scope/有效期/ALLOW 前置条件、请求/subject 差异检测，以及零网络/持久化/凭据/系统时钟副作用源码审计。

运行：

```powershell
node --test tools/ai-policy-harness.test.mjs tools/ai-request-evidence-context-harness.test.mjs tools/ai-candidate-confirmation-harness.test.mjs tools/ai-guidance-reference-harness.test.mjs
```

正式 transport 实现前仍须由 Owner 关闭 D-033/D-034/D-036/D-053，建立真实 Provider/地区审查与授权 evidence 新版本，并在读取 key、序列化 body 和发出网络字节前重新执行 fail-closed 准入。本 V2 不能直接改字段升级为生产发送授权。
