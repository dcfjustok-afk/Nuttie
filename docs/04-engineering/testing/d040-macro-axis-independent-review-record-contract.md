# D-040 四张宏量轴卡独立复核回执机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-MACRO-AXIS-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 状态 | `CONTRACT_READY / NO_FORMAL_RECORD / REVIEW_NOT_STARTED` |
| 绑定复核包 | `D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 合同范围 | 纯本地、调用方提供 JSON、失败关闭、非生产 |
| 非目标 | 指派或冒充复核人、核验现实身份/胜任范围/独立性/签署、发送消息、创建正式回执、宣称独立复核通过、推进健康/Owner/PX/目标/记录/持久化/实现 |

## 1. 目的与权威边界

[四张宏量轴卡独立复核包](../../03-design/d040-macro-axis-independent-review-packet.md)已经冻结十份输入、D-063/D-070/D-071/D-072 四卡逐项处置、四个复核域、十四条跨轴不变量与 P0~P3 标准，但第 7 节仍只是文字字段清单。本合同固定未来独立复核回执 bundle 的严格 JSON 形状、不可变输入、具名 attestation、逐卡与跨轴覆盖、finding 和 disposition 推导，防止漏卡、漏域、漏不变量、跨版本签署，或把角色名、AI、自述签署与四卡总评误写成独立复核通过。

本合同只验证调用方传入的普通 JSON；不读取 Git、证件、签名文件、胜任材料或外部审批系统，不验证现实身份、胜任范围、独立性、利益冲突或签名真值，也不发送消息、不指派复核人、不创建正式复核记录。

当前权威状态继续固定：

```text
reviewersAssigned = false
reviewerIdentityVerified = false
reviewerIndependenceVerified = false
reviewerCompetenceVerified = false
reviewerSignatureVerified = false
independentReviewStarted = false
macroAxisIndependentReviewPassed = false
formalReviewRecordCount = 0
reviewerAttestationRecordCount = 0
healthReviewStillRequired = true
healthReviewerAssigned = false
healthContentApproved = false
contentQaPassed = false
d063Accepted = false
d070Accepted = false
d063OwnerReady = false
d070OwnerReady = false
d071OwnerReady = false
d072OwnerReady = false
ownerIntakeChanged = false
ownerCardScheduled = false
px1Authorized = false
px2Authorized = false
ownerReviewAuthorized = false
ownerChoiceRecorded = false
decisionAcceptedRecorded = false
goalImplementationAuthorized = false
recordingImplementationAuthorized = false
persistenceImplementationAuthorized = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层与资源边界

输入版本为 `D040_MACRO_AXIS_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_REVIEW_RECORD | SYNTHETIC_CONTRACT_FIXTURE
reviewId
packetIdentity
reviewedArtifacts[10]
cardDispositions[4]
crossAxisInvariantResults[14]
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

`reviewId` 使用 `D040-MA-REVIEW-RNNN`；测试专用记录使用 `D040-MA-SYNTHETIC-RNNN`。`supersedesReviewId` 只能是 `null` 或同类稳定 ID，且不能等于当前 ID。时间使用带显式时区的 RFC 3339，不接受本地无偏移时间。

资源上限固定为：最多 16 个 attestation、256 个 finding、每个引用数组 32 项、普通字符串 512 UTF-16 code unit、summary/required change 2,048、总节点 32,000、深度 18、单数组 256 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. Packet 身份和冻结输入

`packetIdentity` 只允许以下字段和值：

```text
packetId = D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001
packetVersion = PACKET-001-R1
packetEventId = EVT-20260821-006
inputManifestEventId = EVT-20260821-007
inputCommit = 47ba4895dac2535682e8d1a8cb985176d6ad45f7
manifestRecordCommit = d8e812f1324590d735f809ea994e8aaa2f6805d8
packetArtifactCommit = d8e812f1324590d735f809ea994e8aaa2f6805d8
packetArtifactBlobOid = ffa60df7e2204607780cd6ac4044a9da659bef90
packetArtifactSha256 = b94af865ab611bc01e4cb75063d45fb65fcc877b207ea9996b4bacb8849bb060
```

`reviewedArtifacts` 必须按顺序恰好复制下表；路径、blob OID 或 SHA-256 任一漂移都属于另一 packet revision：

| 顺序 | path | gitBlobOid | sha256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d040-question-allocation.md` | `9316697b78c6271007c4e051092b4b60308521e7` | `cd3a4c7e6b9fe39faee2fdffe06d9343e991c90f8e7395883afc9fb79db6287f` |
| 2 | `docs/03-design/d040-macronutrient-evidence.md` | `5aa823ba05f77c5d4188521a08603cbf10730afd` | `31755c1ae43edeec4a5a5fbb922679fa29f17eba2b44b70cc534638f1497b93a` |
| 3 | `docs/03-design/d040-china-macronutrient-standard-input.md` | `3988aee30da7968f5a6b588ad81cd96714cdbe44` | `0ad612e7b899cce0d9de5c8ca3f07c490d8e4fcab92e4deaa9b4404a9147616d` |
| 4 | `docs/03-design/d040-macro-target-source-card-spec.md` | `0de4da351719d51fdeb1756564652835672a6966` | `b486c8692db07df49dacbb9f64b52bfc1d77a026cf2d25774e0deca514046ad9` |
| 5 | `docs/03-design/d040-custom-macro-input-shape-card-spec.md` | `80536636d14494d54bfb199464d4b3ab03518a8e` | `dde17d2475113f86f872f62b6feb79993106eca0f895d6422329b6b04c65537b` |
| 6 | `docs/03-design/d040-macro-display-rounding-card-spec.md` | `16c1c674402825d9c879c688e08c5d06fe6c5216` | `781b2b8329382c4f78f58bcbe740d94ef31645285f2ec7c32af9acd759a47b7c` |
| 7 | `docs/03-design/d040-hard-stop-record-availability-card-spec.md` | `e81566c8eef70e1421944c3256dba04e70421195` | `66bb4b5d64e33e57c26c0717f1116be62f972361eb316969a860f8a0363f2afd` |
| 8 | `docs/03-design/d040-data-lifecycle-batch-card-spec.md` | `cbf152542e9c5d6020e311dd2e859e89a7aa3881` | `55cd099d3dad3ddd8244a46e1c78d0d4d31f5426af9b53af73b1f9bf3378a567` |
| 9 | `docs/03-design/d040-china-support-health-review-input.md` | `5e6a1484a214e336ba91416015c7daece765dc24` | `791d5c94fe70ac36c2bc9c2c20e1d2891d0c6b0e5f3820f11d78f8328ddcf0cb` |
| 10 | `docs/03-design/d040-china-health-reviewer-intake-packet.md` | `89f66cb38da0cd2865a343ac471e1cbe63de92c8` | `7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110` |

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

一个具名人员可声明多个域，但 `competenceEvidenceByDomain` 必须与其域集合逐项相等且每域至少一个稳定引用。`reviewerName` 与 `verifiedByName` 必须是不同的非空名称；`PM`、`Project Manager`、`Owner`、`Codex`、`AI`、`Agent`、Agent ID、单纯域名或只有角色名不能作为 reviewer。validator 仍只能把名称、胜任依据和核验引用标为调用方声明。

某 attestation 只有同时满足以下条件才计入域覆盖：

- `participatedInDrafting=false`；
- `identityVerification.state=CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`，且有核验人、引用和时间；
- conflict state 为 `NONE_DECLARED`，或为 `RESOLVED` 且同时有 disclosure/resolution 引用；
- `reviewContentSha256` 精确绑定本 bundle 的复核内容；
- `signatureMethod` 为 `SIGNED_DOCUMENT_REFERENCE`、`VERIFIED_WORKFLOW_REFERENCE` 或 `WET_SIGNATURE_REFERENCE`，并提供引用 ID 与小写 SHA-256；
- attestation ID、reviewer reference 和 signature reference 在 bundle 内唯一。

四域的并集必须完整；域可由多人重复覆盖，但不能用多个角色名代替具名人员。`signatureReference` 只保存外部签署工件的非敏感引用和摘要，不保存签名图、证件、邮箱、电话、住址或胜任材料正文。

未完成签署的部分回执使用 `signatureMethod=NOT_SIGNED`，且 `signedAt` 与 `signatureReference` 都必须为 `null`；该 attestation 可以保留在 bundle 中，但不计入域覆盖。`identityVerification.state=NOT_VERIFIED` 时 `verifiedByName`、`verificationRef` 和 `verifiedAt` 必须全部为 `null`。conflict 尚未披露或未解决时相关引用也必须按 state 显式为 `null`。整体只能推导 `INCOMPLETE`，不能丢弃部分进度后假装完整。

## 5. 四卡逐项处置

`cardDispositions` 必须按复核包第 4 节顺序恰好四项，每项只允许：

```text
decisionId
questionId
disposition
requiredReviewDomain
evidenceRefs[]
findingIds[]
```

精确身份为：

| decisionId | questionId |
| --- | --- |
| `D-063` | `d063_macro_target_source` |
| `D-070` | `d070_custom_macro_input_shape` |
| `D-071` | `d071_macro_display_rounding` |
| `D-072` | `d072_hard_stop_record_availability` |

disposition 只允许 `APPROVE_SPEC`、`APPROVE_WITH_REQUIRED_CHANGE`、`REJECT_SPEC`、`OUT_OF_SCOPE`。每卡至少一个证据引用；`OUT_OF_SCOPE` 必须填写四域之一的 `requiredReviewDomain`，其他 disposition 必须为 `null`。除纯 `APPROVE_SPEC` 外都必须引用至少一个 finding；引用必须存在且 finding 必须反向包含该卡 decision ID。

## 6. 十四条跨轴不变量

`crossAxisInvariantResults` 按复核包第 5 节顺序恰好包含 `D040-MA-XAI-001` 至 `D040-MA-XAI-014`。每项只允许：

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

`findingId` 使用 `D040-MA-IR-FNNN` 且 bundle 内唯一。decision 只能来自本包，数组须唯一且至少一项。P0/P1/P2 为 `CLOSED` 时必须有 closure evidence；为 `OPEN` 时阻断。P3 可以开放，但必须同时给出责任人引用、晚于 `reviewedAt` 的期限和非阻断理由。`CLOSED` finding 不得保留开放 P3 的责任人/期限占位；所有未适用 nullable 字段必须显式为 `null`，不能省略。所有 finding 至少被一卡处置或一条跨轴不变量引用，引用必须双向一致，不能悬空。

## 8. Disposition 推导

`overallDisposition` 只允许：

- `INDEPENDENT_REVIEW_PASS_CANDIDATE`：十份输入精确、四域均有可计数 attestation、四卡全部 `APPROVE_SPEC`、十四条不变量全部 `PASS`、无开放 P0/P1/P2，开放 P3 均有完整处置；
- `REJECTED`：任一卡 `REJECT_SPEC`、任一不变量 `FAIL` 或存在开放 P0；
- `CHANGES_REQUIRED`：无更高优先级失败，但存在 `APPROVE_WITH_REQUIRED_CHANGE` 或开放 P1/P2；
- `INCOMPLETE`：无更高优先级失败，但存在 `OUT_OF_SCOPE`、`NOT_VERIFIED`、四域/身份/独立性/胜任/签署覆盖缺口。

优先级固定为 `REJECTED > CHANGES_REQUIRED > INCOMPLETE > INDEPENDENT_REVIEW_PASS_CANDIDATE`。调用方声明必须与重算值一致，否则输入失败关闭。即使得到 candidate，本地结果也只能是：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
macroAxisIndependentReviewPassCandidate = true
macroAxisIndependentReviewPassed = false
REVIEWER_IDENTITY_INDEPENDENCE_COMPETENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED
healthReviewStillRequired = true
healthReviewerAssigned = false
healthContentApproved = false
contentQaPassed = false
d063Accepted = false
d070Accepted = false
d063OwnerReady = false
d070OwnerReady = false
d071OwnerReady = false
d072OwnerReady = false
```

真实 `D040_MACRO_AXIS_INDEPENDENT_REVIEW_PASS` 必须由获授权人员基于外部身份、胜任范围、独立性与签署工件另行核验并登记；validator 不产生该权威事件，也不替代独立的中国健康评审与 Content QA，不接受 D-063/D-070，也不创建 Owner-ready 事实。

## 9. 指纹、合成 fixture 与脱敏

`reviewContentSha256` 对以下投影做对象 key 排序、数组保留协议顺序的规范 JSON SHA-256：

```text
schemaVersion, recordKind, reviewId, packetIdentity, reviewedArtifacts,
cardDispositions, crossAxisInvariantResults, findings, overallDisposition,
reviewedAt, supersedesReviewId, containsCredential, containsIdentityDocument,
containsSignatureMaterial
```

每个 attestation 必须引用同一摘要。`bundleSha256` 对删除自身后的完整 bundle 计算小写 SHA-256，因而进一步绑定 attestations 和 content hash。

`SYNTHETIC_CONTRACT_FIXTURE` 只用于自动化测试。它可以测试“若为正式回执会得到哪种 disposition”，但 validator 必须返回 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`、`macroAxisIndependentReviewPassCandidate=false`；不得登记为复核记录、复核人、签署、独立复核通过或 Owner-ready 证据。

输入中 `containsCredential`、`containsIdentityDocument` 或 `containsSignatureMaterial` 任一为 true 时立即拒绝，错误只返回稳定 code/path，不能回显 reviewer、evidence、summary、required change 或签署引用原文。结果只允许返回计数、覆盖域、disposition、blocker code、规范摘要与固定边界，不返回完整输入。

## 10. 后续 validator 验收标准

后续纯本地 validator 至少覆盖：严格字段/资源/特殊对象、packet 与十份 frozen blob、具名 reviewer/四域胜任依据/身份/起草参与/利益冲突/签署结构、四卡、十四不变量、finding 双向引用、P0~P3、disposition 优先级、双层 SHA-256、合成 fixture 隔离、敏感材料不回显、深复制冻结和源码零副作用审计。

结果边界必须固定：Git/文件/证件/胜任材料/签署工件读取与写入、网络、Provider、消息和业务写入全部为 0；现实 reviewer assignment/identity/independence/competence/signature verification、review started/passed、健康批准、Content QA、D-063/D-070 接受、四卡 Owner-ready、Owner intake/选择、PX-1/PX-2、目标/记录/持久化/正式实现授权全部为 false。

在获得具名复核人和外部联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假胜任依据、假核验、假签署引用、正式 review record 或独立复核 PASS。
