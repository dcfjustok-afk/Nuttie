# D-053 Provider 用途证据与 App Privacy 映射协议

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001` |
| 对应决定 | `D-053 / CANDIDATE / REGISTERED` |
| 对应阻断 | `D039-PX5-B05 / OPEN` |
| 输入版本 | `PACKET-001-R1`；D-053 卡冻结于 commit `6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117` |
| D-053 输入 blob | Git blob OID `d406e17c8e7b0e11218a8907e757a603df01e465`；SHA-256 `9c1cc88d34ec116f2825d6a71dd580ac8c625d99b30c87a8a06cf7086b894caf` |
| 当前状态 | `PROTOCOL_READY / OI07_REQUIRED / PROVIDERS_UNRESOLVED / EVIDENCE_COLLECTION_NOT_STARTED / APP_PRIVACY_MAPPING_NOT_STARTED / NO_ADMISSION_RECORDS` |
| 授权边界 | Provider 选择、证据结论、App Privacy/隐私政策签署、D-053 Owner 评审、Provider 准入、真实网络、B05 关闭和正式实现均未授权或未发生 |

## 1. 目的与非目标

本协议把 [D-053 Provider 用途准入选择卡](../../03-design/d053-ai-provider-use-admission-card-spec.md)中的 `OI-07 + 逐 Provider 十维证据 + App Privacy/隐私政策映射`拆成可采集、可复核、可失效和可审计的流程。它只冻结证据合同，不选择 Provider，不替 Owner 选择 A/B/C，也不产生 `ALLOW` 或发送许可。

本协议不得被解释为：

- 已收到 OI-07、已确定三家 Provider，或可以用市场知名度、OpenAI-compatible 标签和当前配置猜测 Owner 的目标；
- 可以把 API key、账户标识、合同账号、真实用户照片、文字、健康/营养记录、Provider 请求或响应正文写入仓库；
- 公开 terms/privacy URL、HTTPS 可达、用户自带 key、用户同意或调用方声明本身可以证明 Provider 用途相容；
- Provider 的 consumer chat 条款可以替代目标 API 产品、套餐、地区和账户控制的证据；
- D-036 兼容结果、D-033 单次确认或 D-034 预算可以替代 D-053 数据用途准入；
- 协议准备完成就能把 `oi07Complete`、`providerEvidencePassed`、`appPrivacyMappingSigned`、`independentReviewPassed`、`ownerReviewAuthorized`、`b05Closed` 或实现授权改为 `true`。

## 2. OI-07 无密钥输入合同

执行前必须由 Owner 或获授权的项目联系人提供三个明确的 Provider target。应复用 D-036 同一 OI-07 revision，并为用途证据补齐以下字段；缺失项必须保留 `UNKNOWN`，不得由 PM、AI、研究者或测试者补猜：

```text
oi07Revision
providerSlot = P1 | P2 | P3
providerLegalEntity
apiProductName
apiProductPlan
apiProductRevision
accountType
accountRegion
intendedUserRegion
baseUrl
modelFamily
accountDataControlState
officialTermsUrl
officialPrivacyUrl
officialApiDataUseUrl
officialRetentionUrl
officialSubprocessorUrl
officialDeletionOrSupportUrl
documentEffectiveDates[]
evidenceObservedAt
credentialOwner
notesWithoutSecretOrUserData
```

固定规则：

1. 三个 slot 都必须绑定法律实体、API 产品/套餐、origin、model family、账户类型、账户数据控制和单一适用地区；品牌名不能代替这些字段。
2. URL 只允许公开非秘密信息。key、token、Authorization、cookie、付款/合同账号、个人邮箱和带 secret 的 query 不得进入 OI-07、证据快照或报告。
3. Provider/API/plan/origin/model/account control/region/evidence revision 任一变化都会生成新 target revision，使旧 profile 至少转为 `EXPIRED` 并重新评估。
4. 官方 URL 只是来源入口；必须进一步记录观察时间、生效版本、规范快照 hash 和逐维事实，不能因页面存在就标记相容。
5. 三个 target 未完整提供前，可以维护协议和空白模板，但不得建立具名 Provider 结论、发起外联或形成真实准入记录。

## 3. 固定评估矩阵

首轮必须使用与 D-036 相同的三个 Provider slot，并分别评估 D-053 固定的五类载荷：

```text
nutrition_label_photo
meal_photo
meal_text
trend_summary
guidance_context
```

最小矩阵为：

```text
3 Provider targets
× 5 payload classes
= 15 minimum admission profiles

15 admission profiles
× 10 evidence dimensions
= 150 required dimension assessments
```

每个 profile 精确绑定一个 `provider legal entity + API product/plan + origin + model family + payload class + region + account control + evidence revision`。同一 Provider 覆盖多个地区、套餐、origin 或账户控制时必须新增 profile；不能用一行“全球相同”省略差异。

一份官方证据可以被多行引用，但 150 项维度评估必须逐项有状态和理由。载荷较少、去 EXIF、裁剪、摘要或去标识不自动让另一 payload class 获准，也不自动取消 Health & Fitness、Photos or Videos 或 Other User Content 等映射候选。

每个 profile 至少记录：

```text
profileId
oi07Revision
providerSlot
providerTargetFingerprint
payloadClass
intendedUserRegion
candidatePolicyPackage = A | B | C
dimensionAssessments[10]
appPrivacyMappingRef
privacyPolicyMappingRef
d033DisclosureMappingRef
sourceSnapshotRefs[]
conflictIds[]
expiryAt
profileDisposition
reviewRefs[]
```

## 4. 十维证据评估合同

每个 profile 必须完整评估以下十维。维度不能删除、合并或用 `N/A` 跳过；事实为“没有 subprocessor”“不保留”或“不训练”时，也必须有支持该否定结论的官方证据。

| evidenceDimensionId | 必须记录的最小事实 | 失败关闭条件 |
| --- | --- | --- |
| `legal_entity_and_api_product` | 法律实体、API 产品/套餐、账户类型、origin、model family、官方联系与适用合同 | 只找到品牌/consumer 页面，或套餐/合同归属不明 |
| `terms_privacy_effective_version` | terms/privacy/DPA 来源、观察时间、生效日、变更/失效日、快照 SHA-256 | 页面无版本边界、来源不可验证或快照不可重放 |
| `retention_and_backup` | 请求、附件、响应、metadata、日志、缓存、备份的期限、目的和终态 | 任一适用数据的期限/目的/备份终态未知或无限 |
| `training_and_model_improvement` | 默认训练、服务改进、标注、opt-out、账户设置及对实际产品是否生效 | 通用训练/服务外改进允许，或实际账户控制未知 |
| `human_access` | 访问角色、目的、触发条件、审计、保密、保留和支持边界 | 一般质量评审/训练标注未排除，或访问范围未知 |
| `deletion_revocation_and_sla` | 删除/撤回入口、身份验证、正文/附件/响应/日志/备份范围、SLA、失败路径 | 不可执行、范围或 SLA 未知，或只说明本地删 key |
| `advertising_marketing_tracking_broker` | 广告、营销、tracking、data broker、跨服务画像与数据挖掘用途 | 任一用途允许、条款含糊或无法证明不发生 |
| `health_data_use_and_repurpose` | 是否仅服务当前用户请求，以及研究、保险、通用分析、其他产品再利用边界 | 与健康管理无关的再利用允许或用途未知 |
| `subprocessors_regions_and_transfers` | subprocessor、处理/存储地区、跨境/再转委托、地区差异和更新机制 | 接收方/地区/再转委托未知或与 target 地区不符 |
| `app_privacy_and_policy_mapping` | Apple 数据类型、collection/linked/tracking/purpose、第三方接收者、隐私政策、D-033 披露逐项一致 | 映射缺失、冲突、未签署或依据不是实际数据流 |

维度状态只允许：

- `SUPPORTED_COMPATIBLE`：官方事实完整且与被评估政策包相容；
- `SUPPORTED_INCOMPATIBLE`：官方事实完整，但存在明确阻断；
- `UNKNOWN`：事实缺失、冲突、产品/地区不明或无法验证；
- `EXPIRED`：来源、账户设置、产品 revision、地区或复核窗口失效。

`SUPPORTED_COMPATIBLE` 只是维度结论，不是 profile `ALLOW`，更不是网络发送授权。

## 5. 证据来源、快照与冲突处理

可接受的来源优先级：

1. 目标 API 产品的官方、公开 HTTPS 文档、terms、privacy、DPA、数据控制、retention、subprocessor 和 deletion/support 页面；
2. Provider 提供的签名或可验证合同/说明，存放在获授权的安全位置，仓库只记录非敏感摘要、hash 和访问引用；
3. 保存完整来源 URL、最终 URL、HTTP 状态、观察时间、页面标题、适用产品/地区、生效日和 SHA-256 的离线快照。

营销博客、销售口头承诺、搜索摘要、社区帖子、模型回答、API 连通测试、截图无来源、调用方裸 `ALLOW`、key 所有权或用户同意都不能单独支持 `SUPPORTED_COMPATIBLE`。

每份证据记录至少包含：

```text
evidenceId
providerTargetFingerprint
sourceKind
sourceUrlOrSecureReference
finalUrl
observedAt
documentTitle
effectiveAt
expiresAt
applicableProductPlan
applicableRegions[]
canonicalSnapshotSha256
claimIds[]
supersedesEvidenceId
```

冲突处理固定为：

- 更具体的 API 产品/套餐证据优先于通用品牌页，但不能静默覆盖冲突；
- 更新来源只有在生效范围明确时才能 supersede 旧来源；
- 官方来源之间冲突、账户设置与文档冲突或快照无法验证时，相关维度和 profile 都转 `UNKNOWN`；
- 研究者不能通过“更可信”主观选择消除冲突，必须生成 conflict record 并由具名复核人处置；
- 页面变化监测、账户控制变化或任何 binding revision 变化都会立即失效旧 profile。

## 6. App Privacy 与隐私政策映射

Apple 当前官方边界在执行时必须重新观察并保存 revision；本协议创建时核对的入口为：

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)：隐私政策必须描述数据、用途、第三方保护、保留/删除和撤回；向第三方（包括第三方 AI）分享个人数据前需要清晰披露和明确许可；健康语境数据的广告、营销和用途型数据挖掘受额外限制。
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)：映射必须覆盖 app 与第三方伙伴的数据类型、用途、linked 与 tracking；“实时服务请求后不保留”是否属于 collection 取决于实际第三方数据流，不能预设答案。
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)：App Store Connect 回答按 app 级覆盖实际平台和第三方伙伴实践，并在实践变化时保持准确、最新。

至少建立 5 行 payload 映射；若一个 payload 包含多个独立数据元素或用途，必须拆成更多行：

```text
mappingRowId
payloadClass
transmittedElement
sourceDataOrigin
appleDataTypeCandidates[]
finalAppleDataTypes[]
thirdPartyRecipient
collectionDecision
collectionRationaleEvidenceRefs[]
linkedDecision
linkedRationaleEvidenceRefs[]
trackingDecision
trackingRationaleEvidenceRefs[]
purposes[]
retentionAndDeletionSummary
privacyPolicyClauseRefs[]
privacyChoicesOrDeletionRefs[]
d033DisclosureFieldRefs[]
providerProfileRefs[]
productSigner
privacySecuritySigner
releaseSigner
signedAt
```

固定规则：

1. `Health & Fitness / Health`、`Photos or Videos`、`Other User Content` 只是当前 payload 的候选分类，不得在没有实际数据流和 Apple 定义核对时自动确定或省略。
2. collection、linked、tracking 和 purpose 必须分别判断；“BYOK”“本地优先”“不自建账号”或“用户主动点击”不能替代这些字段。
3. Provider 只为实时请求处理且不保留的主张必须由保留、日志、人工访问、subprocessor 和账户设置证据共同支持；否则 collection decision 为 `UNKNOWN`。
4. App Privacy 回答、公开隐私政策、应用内披露、D-033 单次确认与实际 profile 不一致时，profile 固定 `UNKNOWN/BLOCKED`。
5. 当前没有 App Store Connect record、隐私政策公开 URL 或具名签署；协议不能生成最终 App Privacy answers，也不能声称 `Data Not Collected`。

## 7. 政策包评估与 profile disposition

由于 D-053 尚未接受，证据报告必须对 A/B/C 分别评估，不能先按内部推荐 A 过滤事实：

- A `documented_compatible_use_only`：十维全部 `SUPPORTED_COMPATIBLE`，无冲突/过期，App Privacy/隐私政策映射已签署，才可成为 `A_COMPATIBLE_CANDIDATE`；
- B `provider_specific_residual_risk_review`：保留 A 的不可豁免阻断；每个已知有界残余还必须有 severity、载荷、地区、期限、缓解、用户披露、具名隐私/安全意见和独立 Owner 接受入口，才可成为 `B_REVIEWABLE_CANDIDATE`；
- C `user_consent_broad_admission`：当前卡固定 `ownerOptionReady=false`；协议只能记录 `C_NOT_OWNER_READY`，不得用用户同意填补未知 Provider 真相或 Apple 禁项。

profile disposition 只允许：

- `A_COMPATIBLE_CANDIDATE`
- `B_REVIEWABLE_CANDIDATE`
- `DENY_BY_DOCUMENTED_FACT`
- `UNKNOWN_EVIDENCE_GAP_OR_CONFLICT`
- `EXPIRED_REASSESSMENT_REQUIRED`
- `NOT_ASSESSED`

即使 profile 成为 A/B candidate，当前 `allProviderPayloadProfiles` 仍保持 `UNKNOWN/BLOCKED`，直到 D-053 Owner 决定、独立复核和权威准入记录另行完成。一个 profile 的结果不能复制到另一个 payload、地区、套餐、origin、model 或 Provider。

## 8. 失效、变更监测与复核窗口

所有 profile 都必须有明确 `expiresAt`：

- A 的最长窗口为 90 天；
- B 的最长窗口为 30 天；
- 任一官方来源生效/失效日、账户设置变化、app 新版本、Provider product/plan/model/origin/subprocessor/地区变化或 reviewer 指定日期更早时，以最早时间为准；
- C 当前没有可用窗口，因为它不是 Owner-ready 方案。

以下事件必须立即把相关 profile 转为 `EXPIRED_REASSESSMENT_REQUIRED`，无需等待定时复核：

- terms/privacy/DPA/retention/subprocessor/deletion 页面或 hash 变化；
- OI-07、Provider target、账户数据控制或 credential owner revision 变化；
- payload schema、D-033 披露、D-034 预算、D-036 transport profile 或 App Privacy 分类变化；
- Provider 实际响应、支持答复或账户行为与保存证据冲突；
- 隐私政策、App Store Connect answers、发布地区或应用版本变化。

失效后必须在读取 key、构造 Authorization 或序列化敏感 body 之前阻断；不能保留“宽限期发送”。

## 9. 独立复核、签署与通过标准

证据收集完成不等于独立复核。至少需要具名产品、隐私/安全和发布责任人对各自映射签署，并由 D-039 六卡统一复核包的独立 reviewer 处理跨卡不变量。作者、PM、AI 或 Agent 不能冒充具名独立复核人。

`D053_PROVIDER_EVIDENCE_APP_PRIVACY_PASS_CANDIDATE` 只有在以下条件全部满足时才可提出：

- 三个 OI-07 Provider target 完整且与 D-036 使用同一 revision；
- 15 个最小 profile 全部建立，150 项维度评估无 `NOT_ASSESSED`；
- 所有 source snapshot 可重放，适用产品/套餐/地区/时间明确，冲突都有正式处置；
- 至少 5 行 App Privacy 映射覆盖五类 payload，collection/linked/tracking/purpose 与实际第三方数据流逐项有依据；
- App Privacy、公开隐私政策、应用内披露与 D-033 映射由具名产品、隐私/安全和发布责任人签署；
- A/B/C 的可行性分别报告，未知或过期不会被总体百分比、用户同意或 Owner 风险接受掩盖；
- 具名独立复核后未处置 P0/P1/P2 均为 0，P3 有责任人、期限和非阻断理由；
- 仓库和报告中没有 key、Authorization、用户正文、Provider 正文、合同账号或不必要个人信息。

任一 profile 含 `UNKNOWN/EXPIRED`、映射未签署、来源不可验证、广告/营销/tracking/data broker/通用训练/健康无关再利用未排除，或删除/人工访问/subprocessor/地区事实不完整时，都不能提出 A compatible candidate。报告可以部分完成，但不得把部分覆盖率解释为准入通过。

## 10. 报告最小 schema

```text
reportId
protocolId = D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001
protocolRevision
sourcePacketVersion = PACKET-001-R1
sourceCardCommit
sourceCardBlobOid
sourceCardSha256
oi07Revision
providerTargetCount = 3
payloadClassCount = 5
minimumAdmissionProfileCount = 15
evidenceDimensionCount = 10
requiredDimensionAssessmentCount = 150
providerTargets[3]
admissionProfiles[]
dimensionAssessments[]
sourceSnapshots[]
conflicts[]
appPrivacyMappingRows[]
privacyPolicyMappings[]
d033DisclosureMappings[]
expiryAndChangeMonitoring
policyPackageComparisons
signatures[]
independentReviewRefs[]
findings[]
overallDisposition
generatedAt
reportSha256
```

报告只保留公开证据、非敏感摘要、规范 hash 和安全位置引用。受限合同或安全证件不得因“需要审计”被复制进仓库。

## 11. 当前阻断与下一动作

当前不能开始具名 Provider 证据结论，原因是：

1. OI-07 尚未提供三个精确 Provider/API 产品/套餐/地区/账户控制 target。
2. 当前没有 App Store Connect record、隐私政策公开 URL、Privacy Choices URL 或最终发布地区。
3. Provider 官方快照、15 个 profile、150 项维度评估和至少 5 行 App Privacy 映射均未物化。
4. 具名产品、隐私/安全、发布签署人与独立 reviewer 均未指派，D-053 仍为 `CANDIDATE / UNKNOWN_BLOCKED`。

下一步是先收集无密钥 OI-07，使 D-036 和 D-053 共享同一 Provider target revision；再由获授权研究者保存官方来源快照、完成十维评估和 App Privacy 草案。外部条件缺失期间，D-053 保持 `OI07_POLICY_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY / ALL_PROFILES_UNKNOWN_BLOCKED`。

## 12. 当前机器可读边界

```text
protocolReady: true
sourcePacketVersion: PACKET-001-R1
providerTargetCount: 3
payloadClassCount: 5
minimumAdmissionProfileCount: 15
evidenceDimensionCount: 10
requiredDimensionAssessmentCount: 150
appPrivacyMappingRowMinimum: 5
applePolicySourceCount: 3
oi07Complete: false
providerTargetsResolved: false
providerEvidenceCollectionAuthorized: false
providerEvidenceCollectionStarted: false
sourceSnapshotsRecorded: false
admissionProfilesRecorded: 0
dimensionAssessmentsRecorded: 0
appPrivacyMappingStarted: false
appPrivacyMappingRowCount: 0
appPrivacyMappingSigned: false
privacyPolicyPublicUrlAvailable: false
privacyChoicesUrlAvailable: false
appStoreConnectRecordAvailable: false
namedProductSignerAssigned: false
namedPrivacySecuritySignerAssigned: false
namedReleaseSignerAssigned: false
independentReviewerAssigned: false
independentReviewPassed: false
providerEvidencePassed: false
externalMessageSent: false
ownerIntakeChanged: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
providerAdmissionRecords: 0
allProviderPayloadProfiles: UNKNOWN/BLOCKED
b05Closed: false
realNetworkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
next: D053_OI07_PROVIDER_EVIDENCE_AND_APP_PRIVACY_MAPPING_REQUIRED
```
