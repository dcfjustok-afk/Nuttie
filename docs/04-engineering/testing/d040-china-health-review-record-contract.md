# D-040 中国健康评审回执机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-CHINA-HEALTH-REVIEW-RECORD-CONTRACT-001` |
| 对应交接包 | `D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001 / PACKET-001-R1` |
| 对应决定 / 门禁 | `D-040 / CANDIDATE / PX-0_INPUT_GAP`；`CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED` |
| 当前状态 | `CONTRACT_READY / NO_FORMAL_REVIEW_RECORD / REVIEWER_UNASSIGNED / REVIEW_NOT_STARTED / NOT_APPROVED` |

## 1. 目的与非目标

[中国健康评审交接包](../../03-design/d040-china-health-reviewer-intake-packet.md)已经冻结九份输入、十三个逐条评审项、资质与利益冲突字段、90 天复核周期和独立 Content QA 门禁，但第 6 节仍只是文字字段清单。本合同固定未来健康评审回执 bundle 的严格 JSON 形状、冻结输入、逐项处置、资质声明、签署绑定、finding 和 disposition 推导，防止漏项、跨版本签署或把角色名、AI、未核验资质及总评误写成健康批准。

本合同只验证调用方传入的普通 JSON。它不读取 Git、证件、执业注册、签名文件或外部系统，不判断医疗内容是否正确，不验证现实身份、资质、胜任范围、地域适配或签名真值，也不发送消息、不指派评审人、不创建正式记录。

当前必须保持：

```text
formalHealthReviewRecords = 0
reviewerAssigned = false
reviewerQualificationVerified = false
healthReviewStarted = false
healthContentApproved = false
contentQaPassed = false
d068OwnerReady = false
d069OwnerReady = false
d063OwnerReady = false
ownerIntakeChanged = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层与资源边界

输入版本为 `D040_CHINA_HEALTH_REVIEW_BUNDLE_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_HEALTH_REVIEW_RECORD | SYNTHETIC_CONTRACT_FIXTURE
reviewId
packetIdentity
reviewedArtifacts[9]
reviewerAttestation
itemDispositions[13]
findings[]
overallDisposition
reviewedAt
reviewDueAt
supersedesReviewId
containsCredential = false
containsIdentityDocument = false
containsSignatureMaterial = false
reviewContentSha256
bundleSha256
```

正式 ID 使用 `D040-CHINA-HEALTH-REVIEW-RNNN`；测试专用 ID 使用 `D040-CHINA-HEALTH-SYNTHETIC-RNNN`。`supersedesReviewId` 只能为 `null` 或同类稳定 ID，且不能等于当前 ID。所有时间必须是带显式时区的有效 RFC 3339 时间。

资源上限固定为：最多 128 个 finding、每个引用数组 32 项、普通字符串 512 UTF-16 code unit、summary/required change 2,048、总节点 25,000、深度 18、单数组 256 项。cycle、accessor、symbol、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. Packet 身份和九份冻结输入

`packetIdentity` 只允许以下字段和值：

```text
packetId = D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001
packetVersion = PACKET-001-R1
packetEventId = EVT-20260820-008
inputCommit = 5c32cfb2083bbe904c458b68d92a97e1f8479ce5
packetArtifactCommit = 0fd261ebf886a6d4c71042655ec1e28c9ba85bb0
packetArtifactBlobOid = 89f66cb38da0cd2865a343ac471e1cbe63de92c8
packetArtifactSha256 = 7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110
```

`reviewedArtifacts` 必须按顺序恰好复制下表；路径、blob OID 或 SHA-256 任一漂移都属于另一 packet revision：

| 顺序 | path | gitBlobOid | sha256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d040-china-support-health-review-input.md` | `5e6a1484a214e336ba91416015c7daece765dc24` | `791d5c94fe70ac36c2bc9c2c20e1d2891d0c6b0e5f3820f11d78f8328ddcf0cb` |
| 2 | `docs/03-design/d040-px0-input-research.md` | `f3b9e68d4b181b761e21a57ba476291d7410cf36` | `bf7b4c6e74307b93a15c38c47cf3c81a3c5b45e651fcb4b1b3a02ef9b2a51381` |
| 3 | `docs/03-design/d040-first-batch-card-spec.md` | `c55e5d73a8cffc31ee81fb9d72dd2c252ea08282` | `8489e99efbdb2f2f410eb1005909dd2b1732d8a8ce69616aca6eec51f8d86ef9` |
| 4 | `docs/03-design/d040-energy-model-batch-card-spec.md` | `46f3a6b353ebfa9c2ab73f76b291873dbd9f6569` | `e776e8f7ca9aa9649849ef2b6cc814e6e0c461c8b55e7f0f0f6ae4e517373835` |
| 5 | `docs/03-design/d040-niddk-dynamic-model-feasibility-input.md` | `409119ac4af1691791794a733364d50f847653b2` | `6feeba9bf07991c66254cf42250eefdf5d082de155417d2c7490a59a679b00b0` |
| 6 | `docs/03-design/d040-macronutrient-evidence.md` | `5aa823ba05f77c5d4188521a08603cbf10730afd` | `31755c1ae43edeec4a5a5fbb922679fa29f17eba2b44b70cc534638f1497b93a` |
| 7 | `docs/03-design/d040-china-macronutrient-standard-input.md` | `3988aee30da7968f5a6b588ad81cd96714cdbe44` | `0ad612e7b899cce0d9de5c8ca3f07c490d8e4fcab92e4deaa9b4404a9147616d` |
| 8 | `docs/03-design/d040-data-lifecycle-batch-card-spec.md` | `cbf152542e9c5d6020e311dd2e859e89a7aa3881` | `55cd099d3dad3ddd8244a46e1c78d0d4d31f5426af9b53af73b1f9bf3378a567` |
| 9 | `docs/03-design/d040-question-allocation.md` | `300504fb4a37fd36b32ee80d08df66da71e1af6d` | `55ccd4d3b895f7d73fd387ee0acedd773e2ba5c84a674aba955b4479fe6faecb` |

validator 只能比较调用方数据与内置常量，不能从当前工作区重新推导受审版本，也不能把摘要匹配解释为评审人实际阅读过材料。

## 4. Reviewer attestation 与资质声明

`reviewerAttestation` 只允许：

```text
attestationId
reviewerName
reviewerReferenceId
qualificationType
qualificationIssuer
qualificationReference
qualificationVerifiedAt
qualificationValidAt
competenceScope[]
localeAndRegionFit { state, rationaleRef }
participatedInDrafting
qualificationVerification { state, verifiedByName, verificationRef, verifiedAt }
conflictOfInterest { state, disclosureRef, resolutionRef }
reviewerContactRef
reviewContentSha256
signedAt
signatureMethod
signatureReference
supersedesAttestationId
```

`reviewerName` 与 `verifiedByName` 必须是不同的非空名称；`PM`、`Owner`、`ProjectContentOwner`、`Codex`、`AI`、`Agent`、Agent ID 或只有角色名不能作为健康评审人。`competenceScope` 使用 1~8 个稳定的调用方范围 ID；`localeAndRegionFit.state` 只允许 `PASS / FAIL / NOT_VERIFIED` 并携带非敏感理由引用。

`qualificationVerification.state` 只允许 `NOT_VERIFIED` 或 `CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`。后者必须同时提供具名非本人核验人、引用和时间；validator 仍只能把名称、机构、资质、胜任范围、地域适配和核验引用标为调用方声明。

`qualificationVerifiedAt` 与 `qualificationValidAt` 都使用 RFC 3339，且不得晚于 `reviewedAt`；前者表示调用方声明的核验发生时间，后者表示调用方声明“外部来源在该观察时间显示资质有效”。单个时间戳不是执业有效期，validator 不得从中推断现实资质持续有效。

利益冲突只允许 `UNDISCLOSED / NONE_DECLARED / RESOLVED / UNRESOLVED`。`RESOLVED` 必须同时提供 disclosure 和 resolution 引用；`NONE_DECLARED` 只需 disclosure 引用；未披露或未解决时不能形成 structurally complete candidate。

签署方式只允许 `NOT_SIGNED / SIGNED_DOCUMENT_REFERENCE / VERIFIED_WORKFLOW_REFERENCE / WET_SIGNATURE_REFERENCE`。未签署时 `signedAt` 与 `signatureReference` 必须为 `null`；已签署时二者必填，引用只保存稳定 ID 和小写 SHA-256，不保存签名图、证件、私人联系方式或资质文件正文。

该 attestation 只有同时满足“未参与起草、调用方声明的具名非本人资质核验、两个资质观察时间存在且不晚于 reviewedAt、地域适配 PASS、利益冲突无或已解决、内容摘要一致、已签署”时才计为结构完整。部分回执可以保留，但整体只能推导 `INCOMPLETE`。

## 5. 十三项逐条处置

`itemDispositions` 必须按以下顺序恰好包含十三项：

```text
COPY-D040-ND-01
COPY-D040-ND-02
COPY-D040-ND-03
COPY-D040-ND-04
COPY-D040-ND-05
COPY-D040-ND-06
BOUNDARY-D040-AGE
BOUNDARY-D040-PREGNANCY-LACTATION
BOUNDARY-D040-EATING-DISORDER-RISK
BOUNDARY-D040-CHRONIC-MEDICATION
BOUNDARY-D040-EER-REE
BOUNDARY-D040-DYNAMIC-MODEL
BOUNDARY-D040-CHINA-MACRO
```

每项只允许：

```text
itemId
itemKind = COPY | BOUNDARY
disposition = APPROVE | APPROVE_WITH_REQUIRED_CHANGE | REJECT | OUT_OF_SCOPE
competenceScopeRefs[]
evidenceRefs[]
findingIds[]
requiredChange
```

六个 `COPY-*` 的 kind 必须为 `COPY`，七个 `BOUNDARY-*` 必须为 `BOUNDARY`。每项至少一个 competence scope 和 evidence 引用，且 scope 必须存在于 attestation。`APPROVE` 的 `requiredChange=null`；其他处置必须引用与该 item 反向相连的 finding。required-change 和 reject 必须给出 `requiredChange`；out-of-scope 必须把所需专业范围放入 `competenceScopeRefs`，不能由 PM 改成通过。

## 6. Finding 与关闭规则

每个 finding 只允许：

```text
findingId
severity = P0 | P1 | P2 | P3
itemIds[]
summary
evidenceRefs[]
requiredChange
state = OPEN | CLOSED
closureEvidenceRefs[]
accountableOwnerRef
dueAt
nonBlockingRationale
```

`findingId` 使用 `D040-CHR-FNNN` 且 bundle 内唯一。P0/P1/P2 开放即阻断；关闭时必须有 closure evidence。P3 可以开放，但必须同时有责任人引用、晚于 reviewedAt 的期限和非阻断理由。`CLOSED` finding 不得保留开放 P3 的责任人/期限占位。所有 finding 至少被一项处置引用，item/finding 引用必须双向一致，不能悬空。

## 7. Disposition 与 90 天复核周期

`overallDisposition` 只允许：

- `HEALTH_REVIEW_APPROVAL_CANDIDATE`：九份输入精确、attestation 结构完整、十三项全部 `APPROVE`、无开放 P0/P1/P2，开放 P3 均有完整非阻断处置；
- `REJECTED`：任一项 `REJECT` 或存在开放 P0；
- `CHANGES_REQUIRED`：无更高优先级失败，但存在 `APPROVE_WITH_REQUIRED_CHANGE` 或开放 P1/P2；
- `INCOMPLETE`：无更高优先级失败，但存在 `OUT_OF_SCOPE`、attestation/资质/地域/冲突/签署缺口或逐项覆盖缺口。

优先级固定为 `REJECTED > CHANGES_REQUIRED > INCOMPLETE > HEALTH_REVIEW_APPROVAL_CANDIDATE`。`reviewDueAt` 必须晚于 `reviewedAt`，且按绝对时间差不得超过 90×24 小时；超过即输入无效，不能静默降级。

即使正式记录得到 candidate，本地结果也只能是：

```text
STRUCTURALLY_COMPLETE_HEALTH_REVIEW_ONLY
healthReviewApprovalCandidate = true
healthContentApproved = false
CONTENT_QA_REQUIRED
REVIEWER_IDENTITY_QUALIFICATION_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED
```

真实健康批准必须由获授权人员基于外部身份、资质、胜任范围、地域适配和签署工件另行核验并登记；Content QA 仍须独立执行，validator 不产生这两个权威结果。

## 8. 指纹、合成 fixture 与脱敏

`reviewContentSha256` 对以下投影做对象 key 排序、数组保留协议顺序的规范 JSON SHA-256：

```text
schemaVersion, recordKind, reviewId, packetIdentity, reviewedArtifacts,
itemDispositions, findings, overallDisposition, reviewedAt, reviewDueAt,
supersedesReviewId, containsCredential, containsIdentityDocument,
containsSignatureMaterial
```

attestation 必须绑定同一内容摘要。`bundleSha256` 对删除自身后的完整 bundle 计算小写 SHA-256，进一步绑定资质与签署声明。

`SYNTHETIC_CONTRACT_FIXTURE` 只用于自动化测试。它可以测试“若为正式回执会得到哪种 disposition”，但结果必须为 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`、`healthReviewApprovalCandidate=false`；不得登记为健康评审人、资质核验、正式记录或批准证据。

字段名或值中出现 key/token、Bearer、Authorization/password/secret、邮箱、电话、身份证号、签名图片/data URL、私钥/证书正文等敏感材料时，错误只返回稳定路径与代码，不回显原值。

## 9. 后续 validator 标准与零授权边界

后续纯本地 validator 至少覆盖：严格字段/资源/特殊对象、packet 与九份 frozen blob、具名 reviewer/资质/核验/胜任范围/地域适配/利益冲突/签署结构、十三项、finding 双向引用、P0~P3、disposition 优先级、90 天周期、双层 SHA-256、合成 fixture 隔离、敏感材料不回显、深复制冻结和源码零副作用审计。

结果边界必须固定：Git/文件/证件/执业注册/签署工件读取与写入、网络、Provider、消息和业务写入全部为 0；现实 reviewer assignment/identity/qualification/competence/locale/signature verification、health review started/approved、Content QA、D-068/D-069/D-063 Owner-ready、Owner intake/选择、PX-1/PX-2、健康文案/公式/正式实现授权全部为 false。

在获得具名评审人和外部联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假资质、假核验、假签署引用、正式 health review record 或健康批准。
