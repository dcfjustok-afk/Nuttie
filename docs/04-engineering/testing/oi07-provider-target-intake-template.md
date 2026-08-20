# Nuttie OI-07 Provider 目标统一输入模板

| 项目 | 值 |
| --- | --- |
| 模板 ID | `OI07-PROVIDER-TARGET-INTAKE-TEMPLATE-001` |
| 当前状态 | `TEMPLATE_READY / OWNER_INPUT_NOT_RECEIVED / ALL_TARGETS_UNKNOWN_BLOCKED` |
| 消费协议 | `D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001`、`D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001` |
| 固定范围 | `3` 个 Provider slot；每个 target `29` 个字段；加 `1` 个共享 revision，共 `30` 个联合字段 |
| 本地校验 | [OI-07 Provider target 本地校验合同](oi07-provider-target-intake-harness.md)；只检查结构/格式/UNKNOWN，不验证 Provider 真相或授权 |
| 授权边界 | 填写模板不授权 Provider 选择、付费、凭证创建/注入、真实网络、证据外联、D-036/D-053 通过、Owner 评审、B05 关闭或正式实现 |

## 1. 目的与非目标

本模板把 [D-036 Provider/原生兼容协议](d036-provider-native-compatibility-spike-protocol.md)与 [D-053 Provider 证据/App Privacy 协议](d053-provider-evidence-app-privacy-protocol.md)的 OI-07 字段合并为唯一输入面。两个协议必须消费同一个 `oi07Revision` 和同一组 `P1/P2/P3` target，不能各自维护 Provider 名称、产品、地区或 origin 的不同副本。

本模板只收集无密钥的事实输入，不代表：

- 已选择、推荐或准入任何 Provider；
- Provider 是“OpenAI-compatible”就满足 transport、用途或 App Privacy 标准；
- 公开 URL 存在就证明条款、保留、训练、人工访问、删除或广告/营销用途相容；
- 已允许创建账户、购买额度、保存 key、发送合成流量或真实用户数据；
- `UNKNOWN`、空值、过期来源或未经授权者填写的内容可以被默认值补齐。

## 2. 填写责任与值规则

OI-07 必须由 Owner 或 Owner 明确授权的项目联系人提供。PM、开发者、测试者、研究者、AI 或 Agent 可以检查格式和指出缺口，但不能替输入责任人猜测 Provider、套餐、地区、账户控制或费用上限。

每个格子只能使用以下三类值：

1. **明确值**：目标产品或官方公开事实的无密钥值。
2. **`UNKNOWN`**：事实尚未确认；保留阻断，不得自动推断。
3. **`N/A(reason, sourceRef)`**：该字段对目标确实不适用，并同时写明原因和可复核的公开来源引用。只写 `N/A` 不算完整。

额外格式规则：

- `oi07Revision` 使用 `OI07-RNNN`，从 `OI07-R001` 开始单调递增；同一 revision 只能对应一组完整 target 快照。
- `baseUrl` 只填 HTTPS origin，不含 userinfo、path、query 或 fragment；路径形态单独填入 `endpointPathShape`。
- `queryRequired` 使用 `TRUE`、`FALSE` 或 `UNKNOWN`；不得填写 query 中的 secret 或真实值。
- `documentEffectiveDates[]` 使用 ISO `YYYY-MM-DD` 数组；页面未标日期时保留 `UNKNOWN`，不能用抓取日期代替生效日。
- `evidenceObservedAt` 使用带时区的 ISO 8601 时间；它只表示观察时间，不表示证据已审核。
- `credentialInjectionMethod` 只描述 `HUMAN_RUNTIME_ENTRY`、获批准 secret store 等机制；不能包含 key、token、store secret 路径、账号标识或恢复信息。
- `maximumAuthorizedTestCost` 必须同时写金额和币种，或写 `ZERO`/`UNKNOWN`。该字段只是输入上限，真实付费和联网仍需另行明确授权。
- 所有 URL 必须是公开、无认证、无 secret 的来源；带跟踪参数或签名 query 的 URL 先净化为稳定公开地址。
- `notesWithoutSecretOrUserData` 不得包含密码、2FA、key、token、cookie、Authorization、合同/付款账号、个人邮箱、用户正文、照片、健康/营养记录或 Provider 请求/响应正文。

## 3. 统一回填表

先填写一次共享 revision，再完成三个 slot。`协议来源`用于防止后续删掉任一协议要求的字段。

```text
oi07Revision: UNKNOWN
providedBy: UNKNOWN
providedAt: UNKNOWN
ownerAuthorizationRef: UNKNOWN
```

`providedBy`、`providedAt` 和 `ownerAuthorizationRef` 是接收审计元数据，不计入冻结的 30 个协议输入字段，也不得包含联系方式、证件或 secret。

| 协议来源 | 字段 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| 共享 | `providerSlot` | `P1` | `P2` | `P3` |
| 共享 | `providerLegalEntity` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `apiProductName` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `apiProductPlan` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `apiProductRevision` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `accountType` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `accountRegion` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `intendedUserRegion` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `baseUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `endpointPathShape` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `queryRequired` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `redirectDocumented` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `streamingMode` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `modelIdentifierForSyntheticTest` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `modelFamily` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `accountDataControlState` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `officialEndpointEvidenceUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `officialTermsUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `officialPrivacyUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `officialApiDataUseUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `officialRetentionUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `officialSubprocessorUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `officialDeletionOrSupportUrl` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-053 | `documentEffectiveDates[]` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `evidenceObservedAt` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `credentialOwner` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `credentialInjectionMethod` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| D-036 | `maximumAuthorizedTestCost` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |
| 共享 | `notesWithoutSecretOrUserData` | `UNKNOWN` | `UNKNOWN` | `UNKNOWN` |

字段覆盖固定为：

```text
sharedRevisionFieldCount: 1
perTargetFieldCount: 29
sharedPerTargetFieldCount: 12
d036OnlyPerTargetFieldCount: 8
d053OnlyPerTargetFieldCount: 9
unionInputFieldCount: 30
providerTargetCount: 3
```

## 4. 接收校验与分流

输入接收者必须逐项执行以下检查，并保留结果：

| 检查 | 通过条件 | 失败处置 |
| --- | --- | --- |
| 身份/授权 | `providedBy` 可追溯到 Owner 或获授权联系人，且授权范围包含 OI-07 事实输入 | `INPUT_AUTHORITY_UNVERIFIED`；不采用 |
| revision | 唯一 `OI07-RNNN`，三个 slot 同 revision | `REVISION_SPLIT`；D-036/D-053 同时阻断 |
| slot | 恰好 `P1/P2/P3`，无重复、遗漏或额外 target | `TARGET_SET_INCOMPLETE` |
| 字段 | 29 个 target 字段全部存在；值为明确值、`UNKNOWN` 或带理由/来源的 `N/A` | `FIELD_CONTRACT_INVALID` |
| origin/endpoint | `baseUrl` 为无 secret 的 HTTPS origin，路径单独记录 | `TARGET_ORIGIN_INVALID` |
| 来源 | URL 公开可复核，产品/套餐/地区适用范围不冲突 | `SOURCE_SCOPE_UNRESOLVED` |
| 安全 | 仓库和消息中无 secret、账号标识、用户/Provider 正文或不必要个人信息 | 停止处理，按安全事件流程清理；不得复制扩散 |
| 权限 | 费用、凭证、联网和外联都有独立显式授权 | 未授权动作继续为 `false`，不得由 OI-07 推导 |

接收结果只能是：

- `ACCEPTED_COMPLETE_FOR_D036_AND_D053_INTAKE`：三个 target 完整、无 `UNKNOWN`，所有 `N/A` 均有原因和来源；这只允许进入后续准备，不代表测试或准入通过。
- `ACCEPTED_PARTIAL_UNKNOWN_BLOCKED`：格式安全但仍有 `UNKNOWN` 或未关闭的来源范围；可以保存输入 revision，但真实 Provider 执行和准入结论继续阻断。
- `REJECTED_UNSAFE_OR_UNAUTHORIZED`：包含 secret/用户数据、来源不可接收或填写者无授权；不得进入权威输入。

完整输入按消费者分流：D-036 读取共享字段与 8 个 transport 字段；D-053 读取共享字段与 9 个用途字段。任何共享字段不得在分流后改写；需要更正时创建下一 `oi07Revision`。

## 5. 变更与失效规则

以下任一变化都必须生成新 revision，并让旧 D-036 compatibility cell 与 D-053 admission profile 至少转为 `EXPIRED_REASSESSMENT_REQUIRED`：

- Provider 法律实体、API 产品/套餐/revision、账户类型或账户数据控制变化；
- account/intended-user region、base URL、endpoint、model identifier/family 变化；
- terms/privacy/data-use/retention/subprocessor/deletion 来源、适用范围或生效日变化；
- credential owner/injection mechanism、允许费用或测试授权范围变化；
- 原输入被发现有冲突、错误、secret 或未经授权的信息。

旧 revision 只保留审计引用，不能作为发送前的当前准入依据。系统不得在读取 key、构造 Authorization 或序列化敏感 body 后才发现 revision 已过期。

## 6. 当前机器可读边界

```text
templateReady: true
templateId: OI07-PROVIDER-TARGET-INTAKE-TEMPLATE-001
localValidationHarnessReady: true
localValidationSchemaVersion: OI07_PROVIDER_TARGET_INTAKE_INPUT_V1
providerTargetCount: 3
perTargetFieldCount: 29
unionInputFieldCount: 30
oi07RevisionAssigned: false
ownerInputReceived: false
inputAuthorityVerified: false
providerTargetsResolved: false
allTargets: UNKNOWN/BLOCKED
credentialsReceived: false
credentialInjectionAuthorized: false
testCostAuthorized: false
realNetworkAuthorized: false
providerEvidenceCollectionAuthorized: false
externalMessageSent: false
d036ExecutionAuthorized: false
d053EvidenceCollectionStarted: false
d053AdmissionRecords: 0
ownerReviewAuthorized: false
b05Closed: false
formalImplementationAuthorized: false
next: OWNER_OR_AUTHORIZED_CONTACT_PROVIDES_SECRET_FREE_OI07_REVISION
```
