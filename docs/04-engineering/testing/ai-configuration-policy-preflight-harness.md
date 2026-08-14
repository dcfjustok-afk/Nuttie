# AI 配置与策略预检合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：F01/F02、D-033/D-034/D-036/D-053（均不因本合同获得授权）
>
> 实现：[ai-configuration-policy-preflight-harness.mjs](../../../tools/ai-configuration-policy-preflight-harness.mjs)；测试：[ai-configuration-policy-preflight-harness.test.mjs](../../../tools/ai-configuration-policy-preflight-harness.test.mjs)

## 目的

AI 凭据生命周期保存的是非敏感连接配置和 opaque `credentialRef`，AI policy 则按 `providerId`、origin、model、载荷、profile 和地区判断治理范围。此前两份合同各自成立，但没有一个共同入口证明“当前稳定配置”与“本次策略 subject”至少使用同一 baseURL、origin 和 model，也没有明确记录配置本身不含 `providerId`，不能据此推导 Provider 身份。

本合同建立发送前的本地预检证据链，但故意不创建发送能力。它将稳定 `CONFIGURED` 生命周期导出的 `AI_ACTIVE_CONFIGURATION_EVIDENCE_V1` 与 `AI_REQUEST_EVIDENCE_CONTEXT_V2` 共同规范化、比较和指纹绑定。

## 配置证据边界

`createActiveAIConfigurationEvidence` 只允许稳定的 `CONFIGURED` 状态导出以下非敏感元数据：

- installation generation 与 configuration revision；
- 规范化的 baseURL、origin、host、model 和 opaque `credentialRef`；
- 与当前配置一致的密钥槽元数据，不包含、读取或复制密钥内容；
- 固定边界 `NON_SENSITIVE_METADATA_ONLY_NOT_SEND_AUTHORIZATION`；
- 覆盖全部字段的 `evidenceFingerprint`。

未配置、运行中、恢复中、revision/slot 不一致、跨安装代、篡改指纹、未知字段、accessor、symbol 或非枚举属性均失败关闭。导出和规范化不会读取 SecretVault/Keychain。

## 预检结论

预检精确比较配置与 policy subject 的 `baseURL`、`origin`、`model`。任何一项不匹配时，首个 blocker 是 `CONFIGURATION_SUBJECT_MISMATCH`。

即使三项全部匹配，结果仍固定为 `BLOCKED`，因为当前配置格式没有 `providerId`，不能把“相同 endpoint/model”冒充“Provider 身份已绑定”。随后仍保留：

- `PROVIDER_IDENTITY_NOT_BOUND_TO_CONFIGURATION`；
- `D033_CONFIRMATION_SCOPE_NOT_EVALUATED`；
- `D034_RESOURCE_PROFILE_NOT_AUTHORIZED`；
- `D036_TRANSPORT_PROFILE_NOT_AUTHORIZED`；
- `D053_NOT_AUTHORIZED`。

结果同时绑定配置证据、共享请求上下文、policy subject/profile、D-053 authorization 和 policy-check 的全部指纹。任何重放、替换、篡改或伪造授权字段都无法通过完整结果重建。

## 固定未授权边界

`AI_CONFIGURATION_POLICY_PREFLIGHT_BOUNDARY_V1` 固定声明不读取密钥、不构造 Authorization header、不序列化敏感 body、不创建 transport、不联网、不写业务状态，并且 `sendAuthorization=NOT_GRANTED`。本合同不定义 Provider 配置格式的正式迁移，不授权真实请求，也不代替 D-033/D-034/D-036/D-053 的 Owner 决定和生产证据。

## 当前自动化证据

8 项顶层测试覆盖稳定配置导出、非敏感与不可变边界、异常状态和篡改拒绝、配置/subject 三字段比较、Provider 身份缺口、剩余治理 blocker、完整结果重建以及零副作用源码审计。

运行：

```powershell
node --test tools/ai-configuration-policy-preflight-harness.test.mjs tools/ai-credential-lifecycle-harness.test.mjs tools/ai-policy-harness.test.mjs tools/ai-request-evidence-context-harness.test.mjs
```

正式 transport 接入前，必须先通过独立、版本化的 Provider 配置身份绑定和 D-033/D-034/D-036/D-053 门禁；本地测试 fixture 的精确匹配永远不能直接升级为发送许可。
