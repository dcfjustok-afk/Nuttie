# D-040 前三批十三卡独立复核回执机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 状态 | `CONTRACT_READY / NO_FORMAL_RECORD / REVIEW_NOT_STARTED` |
| 绑定复核包 | `D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 合同范围 | 纯本地、调用方提供 JSON、失败关闭、非生产 |
| 非目标 | 指派或冒充复核人、核验现实身份/胜任范围/独立性/签署、发送消息、创建正式回执、宣称独立复核通过、推进 Owner/PX/公式/持久化/实现 |

## 1. 目的与权威边界

[前三批十三卡独立复核包](../../03-design/d040-first-three-batches-independent-review-packet.md)已经冻结七份输入、十三卡逐项处置、四个复核域、十二条跨批不变量与 P0~P3 标准，但第 7 节仍只是文字字段清单。本合同固定未来独立复核回执 bundle 的严格 JSON 形状、不可变输入、具名 attestation、逐卡与跨批覆盖、finding 和 disposition 推导，防止漏卡、漏域、漏不变量、跨版本签署，或把角色名、AI、自述签署与批次总评误写成独立复核通过。

本合同只验证调用方传入的普通 JSON；不读取 Git、证件、签名文件、资质注册表或外部审批系统，不验证现实身份、胜任范围、独立性、利益冲突或签名真值，也不发送消息、不指派复核人、不创建正式复核记录。

当前权威状态继续固定：

```text
reviewersAssigned = false
reviewerIdentityVerified = false
reviewerIndependenceVerified = false
reviewerSignatureVerified = false
independentReviewStarted = false
firstThreeBatchesIndependentReviewPassed = false
formalReviewRecordCount = 0
reviewerAttestationRecordCount = 0
dynamicModelOptionOwnerReady = false
modelNativeNumericPalOptionOwnerReady = false
healthReviewStillRequired = true
healthContentApproved = false
contentQaPassed = false
ownerIntakeChanged = false
ownerCardScheduled = false
px1Authorized = false
px2Authorized = false
ownerReviewAuthorized = false
ownerChoiceRecorded = false
decisionAcceptedRecorded = false
formulaImplementationAuthorized = false
persistenceImplementationAuthorized = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层与资源边界

输入版本为 `D040_FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_REVIEW_RECORD | SYNTHETIC_CONTRACT_FIXTURE
reviewId
packetIdentity
reviewedArtifacts[7]
cardDispositions[13]
crossBatchInvariantResults[12]
findings[]
overallDisposition
reviewedAt
supersedesReviewId
containsCredential = false
containsIdentityDocument = false
containsSignatureMaterial = false
reviewContentSha256
reviewerAttestations[]
bundleSha256
```

`reviewId` 使用 `D040-FTB-REVIEW-RNNN`；测试专用记录使用 `D040-FTB-SYNTHETIC-RNNN`。`supersedesReviewId` 只能是 `null` 或同类稳定 ID，且不能等于当前 ID。时间使用带显式时区的 RFC 3339，不接受本地无偏移时间。

资源上限固定为：最多 16 个 attestation、256 个 finding、每个引用数组 32 项、普通字符串 512 UTF-16 code unit、summary/required change 2,048、总节点 32,000、深度 18、单数组 256 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. Packet 身份和冻结输入

`packetIdentity` 只允许以下字段和值：

```text
packetId = D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001
packetVersion = PACKET-001-R1
packetEventId = EVT-20260821-001
inputCommit = b39a8f09ae544d7c3276f532b536c67ade75b446
packetArtifactCommit = 3d63bafdcf82b588a3d344c9a4185bd8edabadec
packetArtifactBlobOid = 8ed92648876431cdd30ffc047d83fd6e8a05dd88
packetArtifactSha256 = 1f632603de373ef10af07d1da9513d0822a7b01f4890fcff12d907aaf57e7a06
```

`reviewedArtifacts` 必须按顺序恰好复制下表；路径、blob OID 或 SHA-256 任一漂移都属于另一 packet revision：

| 顺序 | path | gitBlobOid | sha256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d040-question-allocation.md` | `380435e7bbe611319b102052662da471ff9e49b1` | `20fd5c4671419c17ab06d99a8f1241169b67b8009b86b51fc1181fb66847ce08` |
| 2 | `docs/03-design/d040-px0-input-research.md` | `f3b9e68d4b181b761e21a57ba476291d7410cf36` | `bf7b4c6e74307b93a15c38c47cf3c81a3c5b45e651fcb4b1b3a02ef9b2a51381` |
| 3 | `docs/03-design/d040-first-batch-card-spec.md` | `c55e5d73a8cffc31ee81fb9d72dd2c252ea08282` | `8489e99efbdb2f2f410eb1005909dd2b1732d8a8ce69616aca6eec51f8d86ef9` |
| 4 | `docs/03-design/d040-energy-model-batch-card-spec.md` | `46f3a6b353ebfa9c2ab73f76b291873dbd9f6569` | `e776e8f7ca9aa9649849ef2b6cc814e6e0c461c8b55e7f0f0f6ae4e517373835` |
| 5 | `docs/03-design/d040-niddk-dynamic-model-feasibility-input.md` | `409119ac4af1691791794a733364d50f847653b2` | `6feeba9bf07991c66254cf42250eefdf5d082de155417d2c7490a59a679b00b0` |
| 6 | `docs/03-design/d040-data-lifecycle-batch-card-spec.md` | `cbf152542e9c5d6020e311dd2e859e89a7aa3881` | `55cd099d3dad3ddd8244a46e1c78d0d4d31f5426af9b53af73b1f9bf3378a567` |
| 7 | `docs/03-design/d040-china-health-reviewer-intake-packet.md` | `89f66cb38da0cd2865a343ac471e1cbe63de92c8` | `7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110` |

validator 只比较调用方数据与内置常量，不从工作区当前文件推导受审版本，也不能把摘要匹配解释为已实际阅读。

## 4. Reviewer attestation

每个 `reviewerAttestations` 项只允许：

```text
attestationId
reviewerName
reviewerReferenceId
reviewDomains[]
competenceEvidenceByDomain[] { reviewDomain, evidenceRefs[] }
participatedInDrafting
identityVerification { state, verifiedByName, verificationRef, verifiedAt }
conflictOfInterest { state, disclosureRef, resolutionRef }
reviewContentSha256
signedAt = RFC3339 | null
signatureMethod
signatureReference = null | { referenceId, sha256 }
supersedesAttestationId
```

四个精确 `reviewDomain` 为：

```text
PRODUCT_DECISION_QUALITY
HEALTH_FORMULA_EVIDENCE
PRIVACY_DATA_INTEGRITY
QA_ACCESSIBILITY
```

一个具名人员可声明多个域，但 `competenceEvidenceByDomain` 必须与其域集合逐项相等且每域至少一个稳定引用。`reviewerName` 与 `verifiedByName` 必须是不同的非空名称；`PM`、`Project Manager`、`Owner`、`Codex`、`AI`、`Agent`、Agent ID、单纯域名或只有角色名不能作为 reviewer。validator 仍只能把名称和引用标为调用方声明。

某 attestation 只有同时满足以下条件才计入域覆盖：

- `participatedInDrafting=false`；
- `identityVerification.state=CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`，且有核验人、引用和时间；
- conflict state 为 `NONE_DECLARED`，或为 `RESOLVED` 且同时有 disclosure/resolution 引用；
- `reviewContentSha256` 精确绑定本 bundle 的复核内容；
- `signatureMethod` 为 `SIGNED_DOCUMENT_REFERENCE`、`VERIFIED_WORKFLOW_REFERENCE` 或 `WET_SIGNATURE_REFERENCE`，并提供引用 ID 与小写 SHA-256；
- attestation ID、reviewer reference 和 signature reference 在 bundle 内唯一。

四域的并集必须完整；域可由多人重复覆盖，但不能用多个角色名代替具名人员。`signatureReference` 只保存外部签署工件的非敏感引用和摘要，不保存签名图、证件、邮箱、电话、住址或胜任材料正文。

未完成签署的部分回执使用 `signatureMethod=NOT_SIGNED`，且 `signedAt` 与 `signatureReference` 都必须为 `null`；该 attestation 可以保留在 bundle 中，但不计入域覆盖。`identityVerification.state=NOT_VERIFIED` 时 `verifiedByName`、`verificationRef` 和 `verifiedAt` 必须全部为 `null`。conflict 尚未披露或未解决时相关引用也必须按 state 显式为 `null`。整体只能推导 `INCOMPLETE`，不能丢弃部分进度后假装完整。

## 5. 十三卡逐项处置

`cardDispositions` 必须按复核包第 4 节顺序恰好十三项，每项只允许：

```text
batchId = BATCH_1 | BATCH_2 | BATCH_3
decisionId
questionId
disposition
requiredReviewDomain
evidenceRefs[]
findingIds[]
```

精确身份为：

| batchId | decisionId | questionId |
| --- | --- | --- |
| `BATCH_1` | `D-054` | `d054_formula_age_scope` |
| `BATCH_1` | `D-055` | `d055_age_source_retention` |
| `BATCH_1` | `D-056` | `d056_formula_age_representation` |
| `BATCH_1` | `D-058` | `d058_formula_branch_policy` |
| `BATCH_2` | `D-057` | `d057_base_energy_path` |
| `BATCH_2` | `D-059` | `d059_activity_input_representation` |
| `BATCH_2` | `D-060` | `d060_missing_activity_behavior` |
| `BATCH_2` | `D-061` | `d061_mifflin_ree_use` |
| `BATCH_2` | `D-062` | `d062_weight_change_goal_path` |
| `BATCH_3` | `D-064` | `d064_profile_goal_storage` |
| `BATCH_3` | `D-065` | `d065_profile_deletion_semantics` |
| `BATCH_3` | `D-066` | `d066_energy_display_rounding` |
| `BATCH_3` | `D-067` | `d067_recalculation_policy` |

disposition 只允许 `APPROVE_SPEC`、`APPROVE_WITH_REQUIRED_CHANGE`、`REJECT_SPEC`、`OUT_OF_SCOPE`。每卡至少一个证据引用；`OUT_OF_SCOPE` 必须填写四域之一的 `requiredReviewDomain`，其他 disposition 必须为 `null`。除纯 `APPROVE_SPEC` 外都必须引用至少一个 finding；引用必须存在且 finding 必须反向包含该卡 decision ID。

## 6. 十二条跨批不变量

`crossBatchInvariantResults` 按复核包第 5 节顺序恰好包含 `D040-FTB-XCI-001` 至 `D040-FTB-XCI-012`。每项只允许：

```text
invariantId
result = PASS | FAIL | NOT_VERIFIED
evidenceRefs[]
findingIds[]
```

`PASS` 至少有一个证据引用且不得引用开放 P0/P1/P2；`FAIL` 必须引用 finding；`NOT_VERIFIED` 不得冒充覆盖完成。finding ID 必须存在，不能跨 bundle 悬空。

## 7. Finding 与关闭规则

每个 finding 只允许：

```text
findingId
severity = P0 | P1 | P2 | P3
reviewDomain
decisionIds[]
summary
evidenceRefs[]
requiredChange
state = OPEN | CLOSED
closureEvidenceRefs[]
accountableOwnerRef
dueAt
nonBlockingRationale
```

`findingId` 使用 `D040-FTB-IR-FNNN` 且 bundle 内唯一。decision 只能来自本包，数组须唯一且至少一项。P0/P1/P2 为 `CLOSED` 时必须有 closure evidence；为 `OPEN` 时阻断。P3 可以开放，但必须同时给出责任人引用、晚于 `reviewedAt` 的期限和非阻断理由。`CLOSED` finding 不得保留开放 P3 的责任人/期限占位；所有未适用 nullable 字段必须显式为 `null`，不能省略。所有 finding 至少被一卡处置或一条跨批不变量引用，引用必须双向一致，不能悬空。

## 8. Disposition 推导

`overallDisposition` 只允许：

- `INDEPENDENT_REVIEW_PASS_CANDIDATE`：七份输入精确、四域均有可计数 attestation、十三卡全部 `APPROVE_SPEC`、十二条不变量全部 `PASS`、无开放 P0/P1/P2，开放 P3 均有完整处置；
- `REJECTED`：任一卡 `REJECT_SPEC`、任一不变量 `FAIL` 或存在开放 P0；
- `CHANGES_REQUIRED`：无更高优先级失败，但存在 `APPROVE_WITH_REQUIRED_CHANGE` 或开放 P1/P2；
- `INCOMPLETE`：无更高优先级失败，但存在 `OUT_OF_SCOPE`、`NOT_VERIFIED`、四域/身份/独立性/签署覆盖缺口。

优先级固定为 `REJECTED > CHANGES_REQUIRED > INCOMPLETE > INDEPENDENT_REVIEW_PASS_CANDIDATE`。调用方声明必须与重算值一致，否则输入失败关闭。即使得到 candidate，本地结果也只能是：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
firstThreeBatchesIndependentReviewPassCandidate = true
firstThreeBatchesIndependentReviewPassed = false
REVIEWER_IDENTITY_INDEPENDENCE_COMPETENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED
dynamicModelOptionOwnerReady = false
modelNativeNumericPalOptionOwnerReady = false
healthReviewStillRequired = true
healthContentApproved = false
contentQaPassed = false
```

真实 `D040_FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_PASS` 必须由获授权人员基于外部身份、胜任范围、独立性与签署工件另行核验并登记；validator 不产生该权威事件，也不替代独立的中国健康评审与 Content QA。

## 9. 指纹、合成 fixture 与脱敏

`reviewContentSha256` 对以下投影做对象 key 排序、数组保留协议顺序的规范 JSON SHA-256：

```text
schemaVersion, recordKind, reviewId, packetIdentity, reviewedArtifacts,
cardDispositions, crossBatchInvariantResults, findings, overallDisposition,
reviewedAt, supersedesReviewId, containsCredential, containsIdentityDocument,
containsSignatureMaterial
```

每个 attestation 必须引用同一摘要。`bundleSha256` 对删除自身后的完整 bundle 计算小写 SHA-256，因而进一步绑定 attestations 和 content hash。

`SYNTHETIC_CONTRACT_FIXTURE` 只用于自动化测试。它可以测试“若为正式回执会得到哪种 disposition”，但 validator 必须返回 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`、`firstThreeBatchesIndependentReviewPassCandidate=false`；不得登记为复核记录、复核人、签署、独立复核通过或 Owner-ready 证据。

输入中 `containsCredential`、`containsIdentityDocument` 或 `containsSignatureMaterial` 任一为 true 时立即拒绝，错误只返回稳定 code/path，不能回显 reviewer、evidence、summary、required change 或签署引用原文。结果只允许返回计数、覆盖域、disposition、blocker code、规范摘要与固定边界，不返回完整输入。

## 10. 后续 validator 验收标准

后续纯本地 validator 至少覆盖：严格字段/资源/特殊对象、packet 与七份 frozen blob、具名 reviewer/四域胜任依据/身份/起草参与/利益冲突/签署结构、十三卡、十二不变量、finding 双向引用、P0~P3、disposition 优先级、双层 SHA-256、合成 fixture 隔离、敏感材料不回显、深复制冻结和源码零副作用审计。

结果边界必须固定：Git/文件/证件/胜任材料/签署工件读取与写入、网络、Provider、消息和业务写入全部为 0；现实 reviewer assignment/identity/independence/competence/signature verification、review started/passed、动态模型 Owner-ready、健康批准、Content QA、Owner intake/选择、PX-1/PX-2、公式/持久化/正式实现授权全部为 false。

在获得具名复核人和外部联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假胜任依据、假核验、假签署引用、正式 review record 或独立复核 PASS。
