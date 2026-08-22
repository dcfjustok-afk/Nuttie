# 首个 MVP 增量范围跨角色复核回执机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `MVP-INCREMENT-SCOPE-CROSS-ROLE-REVIEW-RECORD-CONTRACT-001` |
| 对应复核包 | `MVP-INCREMENT-SCOPE-REVIEW-PACKET-001 / PACKET-001-R1` |
| 对应冻结事件 | `EVT-20260822-010 / MVP_INCREMENT_SCOPE_INPUT_MANIFEST_FROZEN` |
| 当前状态 | `CONTRACT_READY / NO_REVIEW_RECORD / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED` |
| 非目标 | 生成真实复核、核验身份/签名、替 Owner 选择、冻结范围、关闭 G2 或授权实现 |

## 1. 目的与零授权边界

[首个 MVP 增量范围跨角色复核包](../../02-product/mvp-increment-scope-review-packet.md)已固定 11 份输入、A/B/C 三项逐项处置、5 个复核域、12 条跨选项不变量与 P0~P3 标准，并把输入冻结到同一提交的原始 Git blob 与规范 SHA-256。本合同固定未来回执的严格 JSON 形状、不可变输入、域覆盖、finding、处置推导和双层摘要，防止漏项、错 revision 或把自述身份与总评冒充跨角色 PASS。

合同只验证调用方传入的普通 JSON。它不读取 Git、当前文件、证件、资质或签署工件，不访问网络或审批系统，不发送消息，也不创建、保存或批准现实回执。当前必须保持：

```text
formalReviewRecords = 0
reviewersAssigned = false
reviewerIdentityVerified = false
reviewerCompetenceVerified = false
reviewerIndependenceVerified = false
crossRoleReviewStarted = false
crossRoleReviewPassed = false
ownerChoiceRecorded = false
mvpIncrementScopeFrozen = false
g2Passed = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层与资源边界

输入版本为 `MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_BUNDLE_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_REVIEW_RECORD | SYNTHETIC_CONTRACT_FIXTURE
reviewId
packetIdentity
reviewedArtifacts[11]
optionDispositions[3]
crossOptionInvariantResults[12]
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

正式 ID 使用 `MVP-SCOPE-REVIEW-RNNN`，测试 ID 使用 `MVP-SCOPE-SYNTHETIC-RNNN`。`supersedesReviewId` 只能是 `null` 或同类 ID，且不能等于当前 ID。时间必须是带显式时区的 RFC 3339。

资源上限固定为：最多 20 个 attestation、128 个 finding、每个引用数组 32 项、普通字符串 512 UTF-16 code unit、summary/required change 2,048、总节点 25,000、深度 18、单数组 256 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. Packet 身份和 11 项冻结输入

`packetIdentity` 只允许以下字段和值：

```text
packetId = MVP-INCREMENT-SCOPE-REVIEW-PACKET-001
packetVersion = PACKET-001-R1
inputManifestEventId = EVT-20260822-010
manifestCommit = 9891e6ac75d02df3d85a6b13cb094cd80e7fe808
manifestRecordCommit = 6be59e5df3c1d06416f87950308bcb9a5df2aab0
packetArtifactCommit = 6be59e5df3c1d06416f87950308bcb9a5df2aab0
packetArtifactBlobOid = 3b232045cdf791454ef269d0f7a1e632e72ef1c0
packetArtifactSha256 = d17ae5fa7567486e14741a3fecf252abf0b13414bb50c935403cc206b5b59a0e
```

`reviewedArtifacts` 必须按顺序恰好复制下表；任一路径、blob OID 或 SHA-256 漂移都属于另一 packet revision：

| 顺序 | path | gitBlobOid | sha256 |
| ---: | --- | --- | --- |
| 1 | `docs/00-governance/project-charter.md` | `ac4f3a5f13d00bd4180e69157eea9db446ca33e7` | `2273d63a56fb57fda8dc44d79864b18a8cce3b61958591103509df84ab76c1cb` |
| 2 | `docs/02-product/scope-baseline.md` | `99d476df2634cc59a463692cd304fdf95388918f` | `ea27092b2a1feae54a9f325adfcd459c0a994bdce5063c5102c813e43b24f808` |
| 3 | `docs/02-product/requirements-and-phasing.md` | `73c805674b7ffb99435b7e03f3a8bd4546b0ecf2` | `ef0ee4e873e5ca8f14c3daa2e572f7af17527ea32ae5b74f9d68553e639d3a67` |
| 4 | `docs/02-product/acceptance-traceability.md` | `b02c8431bbc2b20354c333b70716b5426548991e` | `d9b95b8cc10912ad132308f396fd9ecce3e585fba62a0a58453a71bca6a0325d` |
| 5 | `docs/02-product/mvp-increment-scope-card.md` | `117b2babffb85fcf91cd8cde5532ce7a37b8d4b2` | `abb359732d22bd49d26068678af85773328d0f5a0453eeb9d5e4664e96339208` |
| 6 | `docs/03-design/key-user-journeys.md` | `317452c6baa0f8cba5aea6337e3205c70abb8e57` | `d29949fafc878acc7877b1bb03d0e45b3111591f40e34e30d9d79de7a2d2cb82` |
| 7 | `docs/03-design/states-content-accessibility.md` | `3acd3f87a038f0a471d71777b938cb3867f8449a` | `a774f32aee8577b7921559e0aa49ec3097603fbc59aefcb180ea7ee0ebde121c` |
| 8 | `docs/04-engineering/architecture/feature-boundary-map.md` | `ecd4b144349313b9042d06ee23a053de21cd6025` | `4bcfa1ac7a44e0a8f4739d42d560857a69438f28d090e8066ca8e3bd70492721` |
| 9 | `docs/04-engineering/testing/feature-contract-coverage.md` | `9eab3e4b5e760f44867ed6c859202c1fd6219891` | `26579a33c119676c76947b3d62efa21946acbd865dec86f8b4701076c07982c5` |
| 10 | `docs/05-quality/d039-px5-dor-assessment.md` | `e260d56f755dc3194b10e46df05783fece9d6099` | `af0d11cd2f005fff8aec7962d509f57a252aefea91c3b2c8951de2fb73c64ec4` |
| 11 | `docs/05-quality/security-review.md` | `60912529f5a4cbabfe01647da26ecf449145fab4` | `12176c3dad8d96e72d522b3dc670f9b02bec277dab65edf041cfa2af04c8ff08` |

validator 只比较调用方 bundle 与内置常量；摘要匹配不等于复核人现实中阅读过文件。

## 4. 五域 reviewer attestation

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
signedAt
signatureMethod
signatureReference = null | { referenceId, sha256 }
supersedesAttestationId
```

五个精确域为 `PRODUCT_SCOPE`、`DESIGN_EXPERIENCE`、`ARCHITECTURE_DATA`、`SECURITY_PRIVACY`、`QA_TRACEABILITY`。同一具名人员可覆盖多个域，但必须逐域提供 competence evidence。作者或 PM 不能单独批准自己起草的包；`PM`、`Project Manager`、`Codex`、`AI`、`Agent`、域名或只有角色名不能充当 reviewer。

attestation 只有同时满足以下条件才计入域覆盖：未参与起草；身份由另一具名人员声明核验且有引用/时间；conflict 为 `NONE_DECLARED` 或已带引用解决；绑定本 bundle 的 `reviewContentSha256`；使用 `SIGNED_DOCUMENT_REFERENCE`、`VERIFIED_WORKFLOW_REFERENCE` 或 `WET_SIGNATURE_REFERENCE` 并提供引用摘要。未签署或未核验的部分记录可以保留，但整体只能 `INCOMPLETE`。validator 对名称、身份、胜任、独立性和签署都只标记为调用方声明。

## 5. 三项范围处置

`optionDispositions` 必须按 A/B/C 顺序恰好三项：

```text
optionKey
incrementId
disposition
requiredReviewDomain
evidenceRefs[]
findingIds[]
```

精确身份为 A=`MVP-I1-LOCAL-MEAL`、B=`MVP-I1-FULL-MANUAL`、C=`MVP-I1-LOCAL-MEAL-BARCODE`。disposition 只允许 `APPROVE_SCOPE_OPTION`、`APPROVE_WITH_REQUIRED_CHANGE`、`REJECT_SCOPE_OPTION`、`OUT_OF_SCOPE`。每项至少一个证据引用；`OUT_OF_SCOPE` 必须填写五域之一的 `requiredReviewDomain`，其他 disposition 必须为 `null`。除纯批准外都必须引用至少一个与该 option 反向相连的 finding。

## 6. 十二条不变量与 finding

`crossOptionInvariantResults` 按顺序恰好包含 `MVP-SCOPE-XI-001` 至 `MVP-SCOPE-XI-012`。每项只允许 `invariantId`、`result=PASS|FAIL|NOT_REVIEWED`、`evidenceRefs[]`、`findingIds[]`。`PASS` 必须有证据且不得引用开放 P0/P1/P2；`FAIL` 必须引用 finding；`NOT_REVIEWED` 保留覆盖缺口。

每个 finding 只允许：

```text
findingId = MVP-SCOPE-CR-FNNN
severity = P0 | P1 | P2 | P3
reviewDomain
optionKeys[]
summary
evidenceRefs[]
requiredChange
state = OPEN | CLOSED
closureEvidenceRefs[]
accountableOwnerRef
dueAt
nonBlockingRationale
```

finding 必须至少关联一个 A/B/C；P0/P1/P2 开放即阻断，关闭时必须有 closure evidence。开放 P3 只有同时具备责任人引用、晚于本次 review 的期限和非阻断理由时才可保留。所有 finding 必须被 option 或不变量引用，禁止悬空；所有未适用 nullable 字段必须显式为 `null`。

## 7. Disposition 推导

`overallDisposition` 只允许：

- `CROSS_ROLE_REVIEW_PASS_CANDIDATE`：11 输入精确、五域都有可计数 attestation、A/B/C 全部 `APPROVE_SCOPE_OPTION`、12 条不变量全部 `PASS`、无开放 P0/P1/P2，开放 P3 均完整处置；
- `REJECTED`：任一选项被拒、任一不变量 `FAIL` 或存在开放 P0；
- `CHANGES_REQUIRED`：无更高优先级失败，但存在 required change 或开放 P1/P2；
- `INCOMPLETE`：无更高优先级失败，但存在 out-of-scope、not-reviewed 或五域/身份/独立性/签署覆盖缺口。

优先级固定为 `REJECTED > CHANGES_REQUIRED > INCOMPLETE > CROSS_ROLE_REVIEW_PASS_CANDIDATE`。即使正式 bundle 得到 candidate，本地结果也只能是：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
crossRoleReviewPassCandidate = true
crossRoleReviewPassed = false
REVIEWER_IDENTITY_COMPETENCE_INDEPENDENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED
```

真实 `MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_PASS` 必须由获授权人员核验外部身份、胜任、独立性和签署工件后另行登记；它不会自动创建 Owner 卡、选择范围或通过 G2。

## 8. 两层摘要、合成 fixture 与脱敏

`reviewContentSha256` 对以下投影做对象 key 排序、数组保留协议顺序的规范 JSON SHA-256：

```text
schemaVersion, recordKind, reviewId, packetIdentity, reviewedArtifacts,
optionDispositions, crossOptionInvariantResults, findings, overallDisposition,
reviewedAt, supersedesReviewId, containsCredential,
containsIdentityDocument, containsSignatureMaterial
```

每个 attestation 必须引用该值。`bundleSha256` 对删除自身后的完整 bundle 计算，从而绑定全部 attestation。

`SYNTHETIC_CONTRACT_FIXTURE` 只能验证算法；即使它覆盖 candidate 路径，返回也必须是 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY` 且 `crossRoleReviewPassCandidate=false`。不得保存、外联或登记任何合成 reviewer、attestation、签署引用或回执。

字段名或值中出现 key/token、Bearer、Authorization/password/secret、邮箱、电话、证件号、签名图片/data URL、私钥/证书正文等敏感材料时，错误只返回稳定路径与代码，不回显原值。

## 9. 后续 validator 验收标准

后续本地 validator 至少覆盖：严格字段/资源/特殊对象、packet 与 11 项 frozen blob、五域 competence/身份/独立性/conflict/signature、三项处置、12 不变量、finding 双向引用、P0~P3、disposition 优先级、双层 SHA-256、合成隔离、敏感材料不回显、深复制冻结和源码零副作用审计。

结果必须固定 Git/文件/签署工件/证件读写、网络、Provider、消息和业务写入为 0；现实 reviewer assignment/identity/competence/independence/signature verification、review started/passed、Owner intake/选择、决定登记、范围冻结、G2、正式根工程、原生 iOS 与实现授权全部为 false。

在获得具名复核人前，只允许实现与测试本合同；不得创建假 reviewer、假正式回执或跨角色 PASS。
