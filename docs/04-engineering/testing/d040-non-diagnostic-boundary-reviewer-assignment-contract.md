# D-040 D-068/D-069 非诊断边界独立复核人指派机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NDB-REVIEWER-ASSIGNMENT-CONTRACT-001` |
| 对应接入包 | `D040-NON-DIAGNOSTIC-BOUNDARY-REVIEWER-INTAKE-PACKET-001` |
| 对应复核包 | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 当前状态 | `CONTRACT_READY / NO_ASSIGNMENT_RECORD / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED` |
| 非目标 | 读取联系人、核验现实身份/胜任、发送邀请、创建正式指派、开始复核、批准健康内容、推进 PX-1/PX-2、提交 Owner 或授权实现 |

## 1. 目的与零事实边界

[复核人接入与指派检查包](../../03-design/d040-non-diagnostic-boundary-reviewer-intake-packet.md)已经固定四域覆盖、候选人最小字段、身份/逐域胜任/独立性/冲突核验、敏感信息最小化和正式回执交接。本合同进一步固定未来 assignment bundle 的严格 JSON、域覆盖推导、失败关闭状态与摘要，防止遗漏核验、缺域、角色名冒充真人，或把接入准备冒充正式指派。

本合同只允许后续本地 validator 检查调用方提供的普通 JSON。validator 不读取 Git、联系人、证件、履历、签署工件或授权系统，不访问网络，不发送消息，也不保存 assignment。即使结构完整，现实状态仍必须保持：

```text
formalAssignmentRecords = 0
controlledContactRecords = 0
reviewersAssigned = false
reviewerIdentityVerified = false
reviewerCompetenceVerified = false
reviewerIndependenceVerified = false
reviewerSignatureVerified = false
conflictOfInterestResolved = false
independentReviewStarted = false
nonDiagnosticBoundaryIndependentReviewPassed = false
healthReviewerAssigned = false
healthContentApproved = false
contentQaPassed = false
d068OwnerReady = false
d069OwnerReady = false
ownerIntakeChanged = false
ownerCardsScheduled = false
px1Authorized = false
px2Authorized = false
ownerReviewAuthorized = false
ownerChoiceRecorded = false
decisionAcceptedRecorded = false
diagnosisOrTreatmentAuthorized = false
medicationDetailCollectionAuthorized = false
healthFreeTextCollectionAuthorized = false
healthDataPersistenceAuthorized = false
automaticDialAuthorized = false
networkResourceRefreshAuthorized = false
locationReadAuthorized = false
contactsReadAuthorized = false
healthKitWriteAuthorized = false
formulaImplementationAuthorized = false
healthCopyImplementationAuthorized = false
formalRootProjectAuthorized = false
nativeIosWorkAuthorized = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层

输入版本为 `D040_NON_DIAGNOSTIC_BOUNDARY_REVIEWER_ASSIGNMENT_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_ASSIGNMENT_RECORD | SYNTHETIC_CONTRACT_FIXTURE
assignmentId
intakePacketId = D040-NON-DIAGNOSTIC-BOUNDARY-REVIEWER-INTAKE-PACKET-001
reviewPacketIdentity
reviewers[]
domainCoverage[4]
externalContactAuthorized
externalContactAuthorizationRef
assignedByName
assignedAt
assignmentEvidenceRefs[]
reviewCanStart
containsCredential = false
containsIdentityDocument = false
containsPrivateContact = false
containsSignatureMaterial = false
assignmentContentSha256
```

正式 ID 使用 `D040-NDB-ASSIGNMENT-ANNN`，测试 ID 使用 `D040-NDB-SYNTHETIC-ANNN`。时间必须是带显式时区的 RFC 3339，并且日期部分必须构成真实公历日期。所有 nullable 字段都必须显式存在，不得用字段缺失表达 `null`。

资源上限固定为：最多 20 名候选人、每人最多 4 个域、每个引用数组最多 32 项、普通字符串最多 512 UTF-16 code unit、总节点 12,000、深度 16、单数组 128 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. 冻结复核包身份

`reviewPacketIdentity` 只允许以下精确值：

```text
packetId = D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001
packetVersion = PACKET-001-R1
packetEventId = EVT-20260827-007
cardSpecEventId = EVT-20260827-005
cardHarnessEventId = EVT-20260827-006
reviewRecordHarnessEventId = EVT-20260827-008
packetArtifactBlobOid = a9538a5caebe205a30be970ea0818bb536a0c3fd
packetArtifactSha256 = b5a271797575b72c0e14208394145ea5e16527e9c0eeec7724ae8f20776c7c69
```

assignment 只绑定冻结包，不复制或替换 8 份受审输入。任一身份值漂移都属于另一 packet revision，既有候选人接受和指派记录不能沿用。

## 4. 候选人记录

每个 `reviewers` 项只允许：

```text
candidateId
reviewerName
controlledContactRef
proposedReviewDomains[]
competenceEvidenceByDomain[] {
  reviewDomain,
  evidenceRefs[],
  verificationState,
  verifiedByName,
  verificationRef,
  verifiedAt
}
participatedInDrafting
draftingArtifactRefs[]
identityVerification {
  state,
  verifiedByName,
  verificationRef,
  verifiedAt
}
conflictOfInterest {
  state,
  disclosureRef,
  resolutionRef
}
packetAccepted {
  packetId,
  packetVersion,
  acceptedAt
}
expectedReviewDueAt
signatureMethod
signatureReferencePlanned
externalContactAuthorizationRef
assignmentAcceptedAt
```

正式 candidate ID 使用 `D040-NDB-REVIEWER-CNNN`，合成 ID 使用 `D040-NDB-SYNTHETIC-CNNN`。正式 `reviewerName` 必须是非空真实姓名形态；`PM`、`QA`、`Owner`、`Codex`、`AI`、`Agent`、四个域名、`Example/Test/Synthetic` 或只有岗位名称都拒绝。合成 fixture 必须使用明显的 Example 身份和 `.example.test` 风格非现实引用，不能与正式记录混用。

四个精确域按固定顺序为 `PRODUCT_DECISION_QUALITY`、`HEALTH_SAFETY`、`PRIVACY_DATA_INTEGRITY`、`QA_ACCESSIBILITY`。每位候选人的 `proposedReviewDomains` 必须非空、去重并按该顺序排列；`competenceEvidenceByDomain` 必须与其一一对应。

`verificationState` 只允许 `VERIFIED / REJECTED / PENDING`：

- `VERIFIED` 必须有另一名具名核验人、非敏感核验引用、带时区时间和逐域证据；
- `PENDING` 必须把核验人、引用和时间显式置为 `null`；
- `REJECTED` 必须有具名核验人、引用和时间，但不能计入覆盖。

身份核验遵循同一规则，且 `verifiedByName` 不能等于 `reviewerName`。`conflictOfInterest.state` 只允许 `NONE_DECLARED / RESOLVED / OPEN`：三类都要 disclosure 引用，`RESOLVED` 还要 resolution 引用，其他状态的 `resolutionRef` 必须为 `null`。`OPEN` 不计入覆盖。

本地结构完整候选人还必须满足：未参与 8 份冻结输入、D-068/D-069 两卡、回执合同或指派合同的起草；身份为 `VERIFIED`；声明域的胜任核验全部为 `VERIFIED`；冲突为 `NONE_DECLARED` 或 `RESOLVED`；接受精确 packet；完成时间晚于接受与正式指派时间；签署方式为 `SIGNED_DOCUMENT_REFERENCE / VERIFIED_WORKFLOW_REFERENCE / WET_SIGNATURE_REFERENCE`；候选人接受时间、签署计划和联络授权引用完整。

本合同对 `participatedInDrafting=true` 统一失败关闭为不计入任何域。现实项目若要允许其审查未参与起草的其他材料，必须为本 frozen packet 另行指派不参与起草的合格人员；不得通过 validator 自动放宽。

## 5. 四域覆盖矩阵

`domainCoverage` 必须按固定顺序恰好包含四项：

```text
{ reviewDomain, candidateIds[] }
```

每个 `candidateIds` 必须非空、去重、只引用 `reviewers` 中存在的 candidate，并与候选人声明域双向一致。被引用候选人必须满足上一节的结构完整条件；未满足者即使出现在矩阵中也不计数，并使 `reviewCanStart=false`。

全部候选人声明的域都必须出现在覆盖矩阵中，禁止悬空候选域；矩阵也不能静默遗漏候选人的声明域。四域必须各至少有一名结构完整的候选人。允许同一名合格候选人覆盖多域和多人重复覆盖同一域。

## 6. 指派人与联络授权

`assignedByName` 必须是具名人员形态，不能只写 `PM/Owner/Agent` 或合成角色。正式记录的 `externalContactAuthorized=true` 必须同时具备顶层 `externalContactAuthorizationRef`、每位候选人的同类引用和至少一个 `assignmentEvidenceRef`；false 时所有候选人都不能被判定结构完整，`reviewCanStart` 必须为 false。

`assignedAt` 必须不早于所有候选人的 `packetAccepted.acceptedAt` 与 `assignmentAcceptedAt`，并早于每个 `expectedReviewDueAt`。合同只检查调用方声明的时间关系和引用形态，不证明授权人现实权限、候选人实际同意或消息实际送达。

## 7. 结果与授权边界

正式 bundle 只有全部候选记录有效、四域全覆盖、packet 身份精确、联络授权与指派证据完整、声明的 `reviewCanStart=true` 与重算结果一致时，才返回：

```text
STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE
reviewerAssignmentReadyCandidate: true
reviewersAssignedReturned: false
reviewCanStartReturned: false
CALLER_ASSERTED_IDENTITY_COMPETENCE_INDEPENDENCE_AND_AUTHORIZATION_NOT_VERIFIED
```

任一缺口返回 `ASSIGNMENT_INCOMPLETE`，且必须保持 candidate 为 false。合成完整路径返回 `SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY`；它只覆盖算法，`reviewerAssignmentReadyCandidate` 必须仍为 false，不能保存、登记或外联。

即使正式 bundle 得到 candidate，也必须由获授权人员在受控系统中核验现实身份、逐域胜任、独立性、冲突处置、联络授权与接受记录后，另行创建正式 assignment record。validator 不得直接把 `reviewersAssigned` 或 `reviewCanStart` 返回为 true。

## 8. 摘要、脱敏和不可变输出

`assignmentContentSha256` 对删除自身后的完整规范 bundle 计算 SHA-256；对象 key 排序，数组保留协议顺序。任何字段、候选顺序、域覆盖、时间或引用变化都必须重算。

明显的 key/token、Bearer、Authorization/password/secret、邮箱、电话号码、证件号码、住址、签名图片/data URL、私钥或证书正文，以及 `email/phone/address/identityDocument/signatureImage/privateKey` 等敏感字段名都必须在结构处理前拒绝。错误只返回稳定路径和代码，不回显原值。

规范化输入、边界与结果必须深复制、深冻结，并分别绑定输入/结果指纹。校验函数必须精确重建结果，拒绝 caller 伪造 candidate、授权、计数、边界或指纹。

## 9. 后续 validator 验收标准

后续本地 validator 至少覆盖：

- 顶层、packet、候选、核验、冲突和覆盖矩阵的严格字段与资源上限；
- 正式/合成 ID 与身份隔离、角色名和自核验拒绝；
- 四域固定顺序、逐域胜任证据、双向引用、缺域与悬空候选；
- 起草参与者、PENDING/REJECTED、OPEN 冲突和未授权联络失败关闭；
- packet 接受、指派、截止时间和签署计划的时序与真实公历日期；
- 禁止敏感字段名与值且错误不回显；
- `reviewCanStart` 重算、assignment SHA-256、不可变输出、结果重建和源码零副作用审计；
- 合成完整路径不产生 candidate，正式完整路径只产生结构 candidate；
- Git/文件/证件/联系人/签署工件读写、网络、Provider、外部消息、业务写入与正式 assignment record 全部为 0；现实复核人、核验、指派、复核、非诊断边界独立复核 PASS、健康批准、Content QA、D-068/D-069 Owner-ready、Owner、PX-1/PX-2、正式工程、原生与实现授权全部为 false。

在获得具名候选人和联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假核验、假联系人、假 assignment、假复核或独立复核 PASS。
