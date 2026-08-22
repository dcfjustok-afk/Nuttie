# D-039 B03~B05 六卡独立复核回执机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D039-B03-B05-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 对应复核包 | `D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 对应决定 / 阻断 | `D-039 / ACCEPTED / PX-4_BASELINE_FROZEN`；`D039-PX5-B03~B05 / OPEN` |
| 当前状态 | `CONTRACT_READY / NO_REVIEW_RECORD / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED` |

## 1. 目的与非目标

[六卡独立复核包](../../03-design/d039-b03-b05-independent-review-packet.md)已经固定 10 份输入、6 卡逐项处置、4 个复核域、16 条跨卡不变量与 P0~P3 标准，但第 7 节仍只是文字字段清单。若没有严格机器合同，未来回执可能漏卡、漏域、漏不变量、引用另一版输入、保留未处置 finding，或把角色名、Agent、自述签署和总评误写成独立复核通过。

本合同固定未来复核回执 bundle 的严格 JSON 形状、不可变输入、内容签署绑定、覆盖与 disposition 推导。它只验证调用方传入的普通 JSON；不读取 Git、证件、签名文件或外部审批系统，不验证现实身份、资质、独立性或签名真值，也不发送消息、不指派复核人、不创建复核记录。

当前必须保持：

```text
formalReviewRecords = 0
reviewersAssigned = false
reviewerIdentityVerified = false
reviewerIndependenceVerified = false
independentReviewStarted = false
independentReviewPassed = false
b03Closed = false
b04Closed = false
b05Closed = false
ownerIntakeChanged = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层与资源边界

输入版本为 `D039_B03_B05_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_REVIEW_RECORD | SYNTHETIC_CONTRACT_FIXTURE
reviewId
packetIdentity
reviewedArtifacts[10]
cardDispositions[6]
crossCardInvariantResults[16]
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

`reviewId` 使用 `D039-B03-B05-REVIEW-RNNN`；测试专用记录使用 `D039-B03-B05-SYNTHETIC-RNNN`。`supersedesReviewId` 只能是 `null` 或同类稳定 ID，且不能等于当前 ID。时间使用带显式时区的 RFC 3339，不接受本地无偏移时间。

资源上限固定为：最多 16 个 attestation、128 个 finding、每个引用数组 32 项、普通字符串 512 UTF-16 code unit、summary/required change 2,048、总节点 25,000、深度 18、单数组 256 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. Packet 身份和冻结输入

`packetIdentity` 只允许以下字段和值：

```text
packetId = D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001
packetVersion = PACKET-001-R1
inputManifestEventId = EVT-20260821-009
manifestCommit = 6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117
manifestRecordCommit = 19f2119abcd8ca25bf59b177910a5af1f34e9abb
packetArtifactCommit = 19f2119abcd8ca25bf59b177910a5af1f34e9abb
packetArtifactBlobOid = d96a28560fa20399260ee3522a0fc2c21465220b
packetArtifactSha256 = 580c1a4849e99580127afb47faa0c96407ff8913e6c2dda177c2147135a88ad1
```

`reviewedArtifacts` 必须按顺序恰好复制下表；路径、blob OID 或 SHA-256 任一漂移都属于另一 packet revision：

| 顺序 | path | gitBlobOid | sha256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d039-px4-design-baseline.md` | `a1d5018d0c579a04ce799d169ce51d0f00924703` | `15dabd5dc75443f0fe1711b9a1dac931b5e462508ab39efe25554fd6b3b970b5` |
| 2 | `docs/05-quality/d039-px5-dor-assessment.md` | `484b6344c97fe39fe578043dbc960ee147c5495d` | `2d647534e697193045786cc424986b898bf0204e71511a6e12867b50e003a75a` |
| 3 | `docs/05-quality/d039-formal-acceptance-matrix.md` | `c158896b2cd008f2c315994c4b2acc812de6c035` | `007b034dcd865091ec87cf43a3bf35a4e9aaea51dfb2f5646d01c8f00a56ba86` |
| 4 | `docs/03-design/d039-route-observability-contract.md` | `fd1f1db0f54d4f5054b22305f39ae2735c9c216e` | `4947904bb18bf94c55b030d8ef737cff1f4f65a5bdc10686584b42a71d8b0475` |
| 5 | `docs/03-design/d045-recent-favorites-card-spec.md` | `f41fb50964d869946bf4accf381df8267bca68cb` | `f2195d4fe8fef9637efb1cff30139ee1b11c915503e16275a9d720b06fa6cf04` |
| 6 | `docs/03-design/d031-media-ai-retention-card-spec.md` | `9dcff0e98f10f8e1c96a7742afbe887adce5bd8c` | `a93604d1e2dd2c057fbb1e1353f4c09105ad19185938ae75db66bab3efb8b3d0` |
| 7 | `docs/03-design/d033-nonlabel-ai-confirmation-card-spec.md` | `35df3b5a37220521870d0ad1a90bb7f1161d5e42` | `68446272e3203113bad8c9a4d00bfc430203dd82f22294039e0bb650ef1f0a8b` |
| 8 | `docs/03-design/d034-ai-resource-budget-card-spec.md` | `3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c` | `a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6` |
| 9 | `docs/03-design/d036-ai-transport-profile-card-spec.md` | `3bc58cebfb45e2046891fb774bc242fe69ee5b30` | `fdfe2fdebce62e4bc7e31e4ba8b358d9780e4b93377907ecd780bcd4dfcdb7ab` |
| 10 | `docs/03-design/d053-ai-provider-use-admission-card-spec.md` | `d406e17c8e7b0e11218a8907e757a603df01e465` | `9c1cc88d34ec116f2825d6a71dd580ac8c625d99b30c87a8a06cf7086b894caf` |

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
PRIVACY_DATA_INTEGRITY
SECURITY_TRANSPORT_RESOURCE_EVIDENCE
QA_ACCESSIBILITY
```

一个具名人员可声明多个域，但 `competenceEvidenceByDomain` 必须与其域集合逐项相等且每域至少一个稳定引用。`reviewerName` 与 `verifiedByName` 必须是不同的非空名称；`PM`、`Project Manager`、`Codex`、`AI`、`Agent`、单纯域名或只有角色名不能作为 reviewer。validator 仍只能把名称和引用标为调用方声明。

某 attestation 只有同时满足以下条件才计入域覆盖：

- `participatedInDrafting=false`；
- `identityVerification.state=CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`，且有核验人、引用和时间；
- conflict state 为 `NONE_DECLARED`，或为 `RESOLVED` 且同时有 disclosure/resolution 引用；
- `reviewContentSha256` 精确绑定本 bundle 的复核内容；
- `signatureMethod` 为 `SIGNED_DOCUMENT_REFERENCE`、`VERIFIED_WORKFLOW_REFERENCE` 或 `WET_SIGNATURE_REFERENCE`，并提供引用 ID 与小写 SHA-256；
- attestation ID、reviewer reference 和 signature reference 在 bundle 内唯一。

四域的并集必须完整；域可由多人重复覆盖，但不能用多个角色名代替具名人员。`signatureReference` 只保存外部签署工件的非敏感引用和摘要，不保存签名图、证件、邮箱、电话、住址或资质文件正文。

未完成签署的部分回执使用 `signatureMethod=NOT_SIGNED`，且 `signedAt` 与 `signatureReference` 都必须为 `null`；该 attestation 可以保留在 bundle 中，但不计入域覆盖。identity 尚未核验或 conflict 尚未披露/解决时同理：相关详情使用显式 `null`，整体只能推导 `INCOMPLETE`，不能丢弃该部分进度后假装完整。

## 5. 六卡逐项处置

`cardDispositions` 必须按 D-045、D-031、D-033、D-034、D-036、D-053 顺序恰好六项，每项只允许：

```text
blockerId
decisionId
questionId
disposition
requiredReviewDomain
evidenceRefs[]
findingIds[]
```

精确身份为：

| blockerId | decisionId | questionId |
| --- | --- | --- |
| `D039-PX5-B03` | `D-045` | `d045_recent_favorites_scope` |
| `D039-PX5-B04` | `D-031` | `d031_media_ai_retention` |
| `D039-PX5-B05` | `D-033` | `d033_nonlabel_ai_confirmation_scope` |
| `D039-PX5-B05` | `D-034` | `d034_ai_resource_budget_profile` |
| `D039-PX5-B05` | `D-036` | `d036_ai_transport_profile` |
| `D039-PX5-B05` | `D-053` | `d053_ai_provider_use_admission` |

disposition 只允许 `APPROVE_SPEC`、`APPROVE_WITH_REQUIRED_CHANGE`、`REJECT_SPEC`、`OUT_OF_SCOPE`。每卡至少一个证据引用；`OUT_OF_SCOPE` 必须填写四域之一的 `requiredReviewDomain`，其他 disposition 必须为 `null`。除纯 `APPROVE_SPEC` 外都必须引用至少一个 finding；引用必须存在且与该卡 decision/blocker 反向相连。

## 6. 十六条跨卡不变量

`crossCardInvariantResults` 按复核包第 5 节顺序恰好包含 `D039-XCI-001` 至 `D039-XCI-016`。每项只允许：

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
blockerIds[]
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

`findingId` 使用 `D039-IR-FNNN` 且 bundle 内唯一。blocker/decision 只能来自本包，数组须唯一且至少各一项。P0/P1/P2 为 `CLOSED` 时必须有 closure evidence；为 `OPEN` 时阻断。P3 可以开放，但必须同时给出责任人引用、未来期限和非阻断理由。`CLOSED` finding 不得保留 P3 的责任人/期限占位；所有未适用 nullable 字段必须显式为 `null`，不能省略。

## 8. Disposition 推导

`overallDisposition` 只允许：

- `INDEPENDENT_REVIEW_PASS_CANDIDATE`：10 项输入精确、四域均有可计数 attestation、六卡全部 `APPROVE_SPEC`、16 条不变量全部 `PASS`、无开放 P0/P1/P2，开放 P3 均有完整处置；
- `REJECTED`：任一卡 `REJECT_SPEC`、任一不变量 `FAIL` 或存在开放 P0；
- `CHANGES_REQUIRED`：无更高优先级失败，但存在 `APPROVE_WITH_REQUIRED_CHANGE` 或开放 P1/P2；
- `INCOMPLETE`：无更高优先级失败，但存在 `OUT_OF_SCOPE`、`NOT_VERIFIED`、四域/身份/独立性/签署覆盖缺口。

优先级固定为 `REJECTED > CHANGES_REQUIRED > INCOMPLETE > INDEPENDENT_REVIEW_PASS_CANDIDATE`。调用方声明必须与重算值一致，否则输入失败关闭。即使得到 candidate，本地结果也只能是：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
independentReviewPassCandidate = true
independentReviewPassed = false
REVIEWER_IDENTITY_INDEPENDENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED
```

真实 `D039_B03_B05_CARD_INDEPENDENT_REVIEW_PASS` 必须由获授权人员基于外部身份、资质、独立性与签署工件另行核验并登记；validator 不产生该权威事件。

## 9. 指纹、合成 fixture 与脱敏

`reviewContentSha256` 对以下投影做对象 key 排序、数组保留协议顺序的规范 JSON SHA-256：

```text
schemaVersion, recordKind, reviewId, packetIdentity, reviewedArtifacts,
cardDispositions, crossCardInvariantResults, findings, overallDisposition,
reviewedAt, supersedesReviewId, containsCredential,
containsIdentityDocument, containsSignatureMaterial
```

每个 attestation 必须引用同一摘要。`bundleSha256` 对删除自身后的完整 bundle 计算小写 SHA-256，因而进一步绑定 attestations 和 content hash。

`SYNTHETIC_CONTRACT_FIXTURE` 只用于自动化测试。它可以测试“若为正式回执会得到哪种 disposition”，但 validator 必须返回 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`、`independentReviewPassCandidate=false`；不得登记为复核记录、复核人或通过证据。

字段名或值中出现 key/token、Bearer、Authorization/password/secret、邮箱、电话、证件号、签名图片/data URL、私钥/证书正文等敏感材料时，错误只返回稳定路径与代码，不回显原值。

## 10. 后续 validator 标准与零授权边界

后续纯本地 validator 至少覆盖：严格字段/资源/特殊对象、packet 与 10 项 frozen blob、四域 competence/身份/独立性/conflict/signature 结构、六卡、16 不变量、finding 双向引用、P0~P3、disposition 优先级、双层 SHA-256、合成 fixture 隔离、敏感材料不回显、深复制冻结和源码零副作用审计。

结果边界必须固定：Git/文件/外部签署工件读取与写入、网络、Provider、消息、业务写入全部为 0；真实 reviewer assignment/identity/independence/signature verification、review started/passed、Owner intake/选择、B03/B04/B05、PX-5、正式根工程、原生 iOS 和实现授权全部为 false。

在获得具名复核人和外部联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假 attestation、假签署引用、正式 review record 或独立复核 PASS。
