# D-040 D-068/D-069 非诊断边界独立复核回执机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 状态 | `CONTRACT_READY / NO_FORMAL_RECORD / REVIEW_NOT_STARTED` |
| 绑定复核包 | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 合同范围 | 纯本地、调用方提供 JSON、失败关闭、非生产 |
| 非目标 | 指派或冒充复核人、核验现实身份/胜任范围/独立性/签署、发送消息、创建正式回执、宣称独立复核通过、推进健康批准、Content QA、Owner/PX、健康数据持久化、拨号、联网、原生或实现 |

## 1. 目的与权威边界

[D-068/D-069 非诊断边界独立复核包](../../03-design/d040-non-diagnostic-boundary-independent-review-packet.md)已经固定 8 份输入、4 个复核域、2 卡逐项处置、10 条跨卡不变量与 P0~P3 标准。本合同把未来复核回执 bundle 的严格 JSON 形状、冻结输入、具名 attestation、逐卡与跨卡覆盖、finding 和 disposition 推导固定下来，防止漏卡、漏域、漏不变量、跨版本签署，或把角色名、AI、自述签署、健康文案自审与本地 harness 通过误写成独立复核通过。

本合同只验证调用方传入的普通 JSON；不读取 Git、证件、签名文件、胜任材料、HealthKit、联系人、定位、Provider 或外部审批系统，不验证现实身份、胜任范围、独立性、利益冲突或签名真值，也不发送消息、不指派复核人、不创建正式复核记录。

当前权威状态继续固定：

```text
reviewersAssigned = false
reviewerIdentityVerified = false
reviewerIndependenceVerified = false
reviewerCompetenceVerified = false
reviewerSignatureVerified = false
independentReviewStarted = false
nonDiagnosticBoundaryIndependentReviewPassed = false
healthReviewStillRequired = true
healthReviewerAssigned = false
healthContentApproved = false
contentQaPassed = false
d063Accepted = false
d070Accepted = false
d068OwnerReady = false
d069OwnerReady = false
diagnosisOrTreatmentAuthorized = false
medicationDetailCollectionAuthorized = false
healthFreeTextCollectionAuthorized = false
healthDataPersistenceAuthorized = false
automaticDialAuthorized = false
networkResourceRefreshAuthorized = false
locationReadAuthorized = false
contactsReadAuthorized = false
healthKitWriteAuthorized = false
ownerIntakeChanged = false
ownerCardScheduled = false
px1Authorized = false
px2Authorized = false
ownerReviewAuthorized = false
ownerChoiceRecorded = false
decisionAcceptedRecorded = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层与资源边界

输入版本为 `D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_REVIEW_RECORD | SYNTHETIC_CONTRACT_FIXTURE
reviewId
packetIdentity
reviewedArtifacts[8]
cardDispositions[2]
crossAxisInvariantResults[10]
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

`reviewId` 使用 `D040-NDB-REVIEW-RNNN`；测试专用记录使用 `D040-NDB-SYNTHETIC-RNNN`。`supersedesReviewId` 只能是 `null` 或同类稳定 ID，且不能等于当前 ID。时间使用带显式时区的 RFC 3339，不接受本地无偏移时间。

资源上限固定为：最多 16 个 attestation、256 个 finding、每个引用数组 32 项、普通字符串 512 UTF-16 code unit、summary/required change 2,048、总节点 32,000、深度 18、单数组 256 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. Packet 身份和冻结输入

`packetIdentity` 只允许以下字段和值：

```text
packetId = D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001
packetVersion = PACKET-001-R1
packetEventId = EVT-20260827-007
cardSpecEventId = EVT-20260827-005
cardHarnessEventId = EVT-20260827-006
packetArtifactBlobOid = a9538a5caebe205a30be970ea0818bb536a0c3fd
packetArtifactSha256 = b5a271797575b72c0e14208394145ea5e16527e9c0eeec7724ae8f20776c7c69
```

`reviewedArtifacts` 必须按顺序恰好复制下表；路径、blob OID 或 SHA-256 任一漂移都属于另一 packet revision：

| 顺序 | path | gitBlobOid | sha256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d040-non-diagnostic-boundary-card-spec.md` | `f217f13f37715a7f37178e0bb295e19c8f2332d9` | `cb7334f47ccd11cf14639f2addc33cf9d19cbdaff36227e6d738ba88e4189a2d` |
| 2 | `docs/03-design/d040-china-support-health-review-input.md` | `5e6a1484a214e336ba91416015c7daece765dc24` | `c20b58b7af4ffdc08e05c306b122d17b51429e2e879b8bf5e96dd22b43e753af` |
| 3 | `docs/03-design/d040-china-health-reviewer-intake-packet.md` | `89f66cb38da0cd2865a343ac471e1cbe63de92c8` | `ab466430768643052553fa1bf4b001503c618c5a1362f185b7f3146942606d38` |
| 4 | `docs/03-design/d040-question-allocation.md` | `c412d5f4168ae9828870fc6b79372541aa2f0840` | `299cd01148cf4372e88bb55efe47d12b93419d192f5be1c7f8c487190d2295e7` |
| 5 | `docs/03-design/d040-energy-model-batch-card-spec.md` | `46f3a6b353ebfa9c2ab73f76b291873dbd9f6569` | `6cdbf2db6219804d004d4b65ea1c09c093150d6fe8eb22027245de97501b569d` |
| 6 | `docs/03-design/d040-macro-target-source-card-spec.md` | `0de4da351719d51fdeb1756564652835672a6966` | `2dc30267c77a27e80003e661906c0ee1e166d4fad24d4201ade55a92d2156e47` |
| 7 | `docs/03-design/d040-custom-macro-input-shape-card-spec.md` | `80536636d14494d54bfb199464d4b3ab03518a8e` | `db34dfb40b27856692aca666be2efd3fa47625135c2958b055cb92810279a8c9` |
| 8 | `docs/04-engineering/testing/d040-non-diagnostic-boundary-card-harness.md` | `7263d2f151ce9e7ddc5aedce3127153264866b06` | `0a9e0ddda5f05b1f5d1a3f6184ce121f92c7b88617867ef01e718259f5bead7f` |

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
HEALTH_SAFETY
PRIVACY_DATA_INTEGRITY
QA_ACCESSIBILITY
```

一个具名人员可声明多个域，但 `competenceEvidenceByDomain` 必须与其域集合逐项相等且每域至少一个稳定引用。`reviewerName` 与 `verifiedByName` 必须是不同的非空名称；`PM`、`Project Manager`、`Owner`、`Codex`、`AI`、`Agent`、Agent ID、单纯域名或只有角色名不能作为 reviewer。validator 仍只能把名称、胜任依据和核验引用标为调用方声明。

可计数 attestation 必须同时满足：未参与起草；身份核验状态为 `CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`；conflict 为 `NONE_DECLARED` 或已解决；`reviewContentSha256` 精确绑定本 bundle；使用 `SIGNED_DOCUMENT_REFERENCE`、`VERIFIED_WORKFLOW_REFERENCE` 或 `WET_SIGNATURE_REFERENCE` 并提供引用 ID 与小写 SHA-256。未签署、未核验、冲突未披露/未解决或参与起草的 attestation 可保留为部分进度，但不计入域覆盖，整体只能推导 `INCOMPLETE`。

## 5. 两卡逐项处置

`cardDispositions` 必须按复核包第 4 节顺序恰好两项：

| decisionId | questionId |
| --- | --- |
| `D-068` | `d068_non_diagnostic_health_context` |
| `D-069` | `d069_estimate_uncertainty_copy` |

disposition 只允许 `APPROVE_SPEC_CANDIDATE`、`CHANGES_REQUIRED`、`REJECT_SPEC`、`NOT_REVIEWED`。每卡至少一个证据引用；`NOT_REVIEWED` 必须填写四域之一的 `requiredReviewDomain`，其他 disposition 必须为 `null`。除 `APPROVE_SPEC_CANDIDATE` 外都必须引用至少一个 finding；引用必须存在且 finding 必须反向包含该卡 decision ID。

## 6. 十条跨卡不变量

`crossAxisInvariantResults` 按复核包第 5 节顺序恰好包含 `D040-NDB-XCI-001` 至 `D040-NDB-XCI-010`。每项只允许：

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

`findingId` 使用 `D040-NDB-IR-FNNN` 且 bundle 内唯一。decision 只能来自 D-068/D-069，数组须唯一且至少一项。P0/P1/P2 为 `CLOSED` 时必须有 closure evidence；为 `OPEN` 时阻断。P3 可以开放，但必须同时给出责任人引用、晚于 `reviewedAt` 的期限和非阻断理由。`CLOSED` finding 不得保留开放 P3 的责任人/期限占位；所有未适用 nullable 字段必须显式为 `null`，不能省略。所有 finding 至少被一卡处置或一条跨卡不变量引用，引用必须双向一致，不能悬空。

## 8. Disposition 推导

`overallDisposition` 只允许：

- `INDEPENDENT_REVIEW_PASS_CANDIDATE`：8 份输入精确、四域均有可计数 attestation、两卡全部 `APPROVE_SPEC_CANDIDATE`、10 条不变量全部 `PASS`、无开放 P0/P1/P2，开放 P3 均有完整处置；
- `REJECTED`：任一卡 `REJECT_SPEC`、任一不变量 `FAIL` 或存在开放 P0；
- `CHANGES_REQUIRED`：无更高优先级失败，但存在 `CHANGES_REQUIRED` 卡或开放 P1/P2；
- `INCOMPLETE`：无更高优先级失败，但存在 `NOT_REVIEWED`、`NOT_VERIFIED`、四域/身份/独立性/胜任/签署覆盖缺口。

优先级固定为 `REJECTED > CHANGES_REQUIRED > INCOMPLETE > INDEPENDENT_REVIEW_PASS_CANDIDATE`。调用方声明必须与重算值一致，否则输入失败关闭。即使得到 candidate，本地结果也只能是：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
nonDiagnosticBoundaryIndependentReviewPassCandidate = true
nonDiagnosticBoundaryIndependentReviewPassed = false
REVIEWER_IDENTITY_INDEPENDENCE_COMPETENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED
healthReviewStillRequired = true
healthReviewerAssigned = false
healthContentApproved = false
contentQaPassed = false
d068OwnerReady = false
d069OwnerReady = false
```

真实 `D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_PASS` 必须由获授权人员基于外部身份、胜任范围、独立性与签署工件另行核验并登记；validator 不产生该权威事件，也不替代独立的中国健康评审与 Content QA，不接受 D-063/D-070，也不创建 Owner-ready 事实。

## 9. 指纹、合成 fixture 与脱敏

`reviewContentSha256` 对以下投影做对象 key 排序、数组保留协议顺序的规范 JSON SHA-256：

```text
schemaVersion, recordKind, reviewId, packetIdentity, reviewedArtifacts,
cardDispositions, crossAxisInvariantResults, findings, overallDisposition,
reviewedAt, supersedesReviewId, containsCredential, containsIdentityDocument,
containsSignatureMaterial
```

每个 attestation 必须引用同一摘要。`bundleSha256` 对删除自身后的完整 bundle 计算小写 SHA-256，因而进一步绑定 attestations 和 content hash。

`SYNTHETIC_CONTRACT_FIXTURE` 只用于自动化测试。它可以测试“若为正式回执会得到哪种 disposition”，但 validator 必须返回 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`、`nonDiagnosticBoundaryIndependentReviewPassCandidate=false`；不得登记为复核记录、复核人、签署、独立复核通过、健康批准、Content QA 或 Owner-ready 证据。

输入中 `containsCredential`、`containsIdentityDocument` 或 `containsSignatureMaterial` 任一为 true 时立即拒绝，错误只返回稳定 code/path，不能回显 reviewer、evidence、summary、required change 或签署引用原文。结果只允许返回计数、覆盖域、disposition、blocker code、规范摘要与固定边界，不返回完整输入。

## 10. 后续 validator 验收标准

后续纯本地 validator 至少覆盖：严格字段/资源/特殊对象、packet 与 8 份 frozen 输入、具名 reviewer/四域胜任依据/身份/起草参与/利益冲突/签署结构、两卡、十不变量、finding 双向引用、P0~P3、disposition 优先级、双层 SHA-256、合成 fixture 隔离、敏感材料不回显、深复制冻结和源码零副作用审计。

结果边界必须固定：Git/文件/证件/胜任材料/签署工件读取与写入、网络、Provider、消息和业务写入全部为 0；现实 reviewer assignment/identity/independence/competence/signature verification、review started/passed、健康批准、Content QA、D-068/D-069 Owner-ready、Owner intake/选择、PX-1/PX-2、健康数据持久化、拨号、联网刷新、原生与正式实现授权全部为 false。

在获得具名复核人和外部联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假胜任依据、假核验、假签署引用、正式 review record 或独立复核 PASS。
