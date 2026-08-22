# D-040 中国健康评审人指派机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-CHINA-HEALTH-REVIEWER-ASSIGNMENT-CONTRACT-001` |
| 对应接入与复核包 | `D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001 / PACKET-001-R1` |
| 对应决定 / 门禁 | `D-040 / CANDIDATE / PX-0_INPUT_GAP`；`CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED` |
| 当前状态 | `CONTRACT_READY / NO_ASSIGNMENT_RECORD / REVIEWER_UNASSIGNED / REVIEW_NOT_STARTED / NOT_APPROVED` |
| 非目标 | 读取联系人或证件、核验现实身份/资质/胜任、发送邀请、创建正式指派、开始健康评审、代替 Content QA、提交 Owner 或授权实现 |

## 1. 目的与零事实边界

[中国健康评审人交接与签署检查包](../../03-design/d040-china-health-reviewer-intake-packet.md)已经固定九份输入、十三项评审内容、候选人的九类准入材料、90 天周期和正式回执字段；[健康评审回执机器合同](d040-china-health-review-record-contract.md)已经固定未来逐项签署的结构，但两者都不定义候选人如何被选择并转交给受控指派流程。本合同补齐 assignment bundle 的严格 JSON、唯一入选候选人、五项胜任范围、资质与地域核验、失败关闭时序和摘要边界。

本合同只允许后续本地 validator 检查调用方提供的普通 JSON。validator 不读取 Git、联系人、证件、执业注册、履历、签署工件或授权系统，不访问网络，不发送消息，也不保存 assignment。即使正式输入结构完整，现实状态仍必须保持：

```text
reviewerCandidateCount = 0
controlledContactRecordCount = 0
reviewerAssignmentRecordCount = 0
externalContactAuthorized = false
externalMessagesSent = 0
reviewerAssigned = false
reviewerIdentityVerified = false
reviewerQualificationVerified = false
reviewerCompetenceVerified = false
reviewerLocaleFitVerified = false
reviewerIndependenceVerified = false
reviewerSignatureVerified = false
conflictOfInterestResolved = false
healthReviewStarted = false
healthContentApproved = false
contentQaPassed = false
d068OwnerReady = false
d069OwnerReady = false
d063OwnerReady = false
firstThreeBatchesIndependentReviewPassed = false
ownerIntakeChanged = false
ownerCardsScheduled = false
px1Authorized = false
px2Authorized = false
ownerReviewAuthorized = false
ownerChoiceRecorded = false
decisionAcceptedRecorded = false
healthCopyImplementationAuthorized = false
formulaImplementationAuthorized = false
formalRootProjectAuthorized = false
nativeIosWorkAuthorized = false
formalImplementationAuthorized = false
```

## 2. Bundle 顶层

输入版本为 `D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_INPUT_V1`。顶层只允许：

```text
schemaVersion
recordKind = FORMAL_ASSIGNMENT_RECORD | SYNTHETIC_CONTRACT_FIXTURE
assignmentId
intakePacketId = D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001
reviewPacketIdentity
reviewerCandidates[]
selectedCandidateId
requiredScopeCoverage[5]
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

正式 ID 使用 `D040-CHINA-HEALTH-ASSIGNMENT-ANNN`，测试 ID 使用 `D040-CHINA-HEALTH-SYNTHETIC-ANNN`。`selectedCandidateId` 允许为 `null`，但此时只能返回 `ASSIGNMENT_INCOMPLETE`；结构完整的正式或合成输入都必须引用且只引用一个现有候选人，合成输入仍不能返回现实 candidate。所有 nullable 字段必须显式存在，不能用缺失表达 `null`。

资源上限固定为：最多 20 名候选人、每人最多 5 个胜任范围、每个引用数组最多 32 项、普通字符串最多 512 UTF-16 code unit、总节点 12,000、深度 16、单数组 128 项。cycle、accessor、symbol、非枚举字段、特殊 prototype、`Map`、`Set`、typed array、稀疏数组、非有限数和额外字段全部拒绝。

## 3. 冻结复核包身份

`reviewPacketIdentity` 只允许以下精确值：

```text
packetId = D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001
packetVersion = PACKET-001-R1
packetEventId = EVT-20260820-008
inputCommit = 5c32cfb2083bbe904c458b68d92a97e1f8479ce5
packetArtifactCommit = 0fd261ebf886a6d4c71042655ec1e28c9ba85bb0
packetArtifactBlobOid = 89f66cb38da0cd2865a343ac471e1cbe63de92c8
packetArtifactSha256 = 7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110
```

assignment 只绑定该 frozen packet，不复制、替换或从当前工作区重新推导九份输入。任一身份值漂移都属于另一 packet revision；既有接受、候选选择、指派或未来评审回执均不能沿用。

## 4. 候选人记录

每个 `reviewerCandidates` 项只允许：

```text
candidateId
reviewerName
controlledContactRef
qualificationType
qualificationIssuer
qualificationReference
competenceScopeIds[]
participatedInDrafting
draftingArtifactRefs[]
identityVerification {
  state,
  verifiedByName,
  verificationRef,
  verifiedAt
}
qualificationVerification {
  state,
  verifiedByName,
  verificationRef,
  verifiedAt,
  qualificationObservedValidAt
}
competenceVerificationByScope[] {
  competenceScopeId,
  evidenceRefs[],
  state,
  verifiedByName,
  verificationRef,
  verifiedAt
}
localeAndRegionFit {
  state,
  rationaleRef,
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

正式 candidate ID 使用 `D040-CHINA-HEALTH-REVIEWER-CNNN`，合成 ID 使用 `D040-CHINA-HEALTH-SYNTHETIC-CNNN`；同一 bundle 内 candidate ID 与规范化姓名都必须唯一。正式 `reviewerName` 必须是非空真实姓名形态；`PM`、`Owner`、`ProjectContentOwner`、`QA`、`Codex`、`AI`、`Agent`、稳定范围 ID、`Example/Test/Synthetic` 或只有岗位名称都拒绝。合成 fixture 必须使用明显的 Example 身份和 `.example.test` 非现实引用，不能与正式记录混用。

`identityVerification.state` 只允许 `VERIFIED / REJECTED / PENDING`。`VERIFIED` 和 `REJECTED` 必须有另一名具名核验人、非敏感引用和带显式时区的时间；`PENDING` 必须把核验人、引用和时间显式置为 `null`。核验人不得与候选人相同。

`qualificationVerification.state` 只允许 `CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF / REJECTED / NOT_VERIFIED`。第一种状态必须同时提供具名非本人核验人、引用、核验时间和 `qualificationObservedValidAt`；两项时间都表示调用方声明的观察事实，不是现实执业注册或未来有效期证明。`REJECTED` 必须有具名核验人、引用和核验时间，且 `qualificationObservedValidAt=null`；`NOT_VERIFIED` 的四个证明字段必须全为 `null`。

## 5. 五项胜任范围与地域适配

五个稳定范围按固定顺序为：

```text
ADULT_WEIGHT_ENERGY_AND_STOP_RULES
CHRONIC_MEDICATION_AND_EATING_DISORDER_BOUNDARIES
MODEL_NUMERIC_HEALTH_SEMANTICS
CHINA_MACRONUTRIENT_REFERENCE_AND_NON_PRESCRIPTION
ZH_HANS_CN_SUPPORT_COPY_AND_EMERGENCY_RESOURCE_CONTEXT
```

`competenceScopeIds` 必须非空、去重并按上述顺序排列；`competenceVerificationByScope` 必须与之逐项、双向一一对应。每项 `state` 只允许 `VERIFIED / REJECTED / PENDING`，证明字段语义与身份核验相同。入选候选人必须声明并通过全部五项，不能由多人拼接后写成一个健康评审回执；未入选候选人允许仍有待核验项，其中状态仍待核验的范围不得被计入覆盖，已核验范围仍按下文精确列出。

`requiredScopeCoverage` 必须按同一顺序恰好包含五项 `{ competenceScopeId, candidateIds[] }`。每项必须按 `reviewerCandidates` 顺序精确列出已声明该范围且该范围核验为 `VERIFIED` 的候选人；没有已核验候选人时数组必须为空，入选候选人必须出现在全部五项中。矩阵不得静默遗漏已核验范围，也不得添加候选人未声明或未通过核验的范围。

`localeAndRegionFit.state` 只允许 `PASS / FAIL / NOT_VERIFIED`。三类都必须有非敏感 `rationaleRef`；`PASS/FAIL` 还必须有具名非本人核验人、核验引用和时间，`NOT_VERIFIED` 的三个证明字段必须为 `null`。只有 `PASS` 能计入结构完整候选人。

`conflictOfInterest.state` 只允许 `NONE_DECLARED / RESOLVED / OPEN`：三类都必须有 disclosure 引用，`RESOLVED` 还必须有 resolution 引用，其他状态的 `resolutionRef` 必须为 `null`；`OPEN` 不能计入结构完整候选人。

本地结构完整的入选候选人还必须满足：未参与九份 frozen 输入或十三项内容的起草；身份为 `VERIFIED`；资质为 `CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`；五项胜任均为 `VERIFIED`；地域适配为 `PASS`；冲突为 `NONE_DECLARED` 或 `RESOLVED`；接受精确 packet；签署方式为 `SIGNED_DOCUMENT_REFERENCE / VERIFIED_WORKFLOW_REFERENCE / WET_SIGNATURE_REFERENCE`；候选人接受时间、签署计划、受控联系人和联络授权引用完整。

本合同对 `participatedInDrafting=true` 统一失败关闭。现实项目若需拆分健康主题或引入第二专业人员，必须升级 packet 与回执合同，不能让 validator 把多人覆盖自动合并成单人资质或签署。

## 6. 指派、联络授权与 90 天时序

`assignedByName` 必须是具名人员形态，不能只写 `PM/Owner/Agent` 或合成角色，也不能与入选健康评审人相同。正式记录的 `externalContactAuthorized=true` 必须同时具备顶层授权引用、入选候选人的同类引用和至少一个 assignment 证据引用；false 时不得产生结构完整 candidate，`reviewCanStart` 必须为 false。

入选候选人的 packet 接受时间必须不晚于 assignment 接受时间；`assignedAt` 必须不早于两项接受时间、身份/资质/五项胜任/地域核验时间和 `qualificationObservedValidAt`，并早于 `expectedReviewDueAt`。`expectedReviewDueAt - assignedAt` 按绝对时间差不得超过 `90 × 24` 小时。所有时间必须是带显式时区的有效 RFC 3339，日期部分必须构成真实公历日期。

合同只检查调用方声明的引用与时序，不证明指派人现实权限、候选人实际同意、资质当前有效、联系人可达、邀请已送达或评审已经开始。

## 7. 结果与授权边界

正式 bundle 只有 packet 精确、唯一入选候选人满足全部准入、五项覆盖一致、联络授权与指派证据完整、90 天时序正确，并且声明的 `reviewCanStart=true` 与重算结果一致时，才返回：

```text
STRUCTURALLY_COMPLETE_HEALTH_REVIEWER_ASSIGNMENT_CANDIDATE
healthReviewerAssignmentReadyCandidate: true
reviewerAssignedReturned: false
reviewCanStartReturned: false
IDENTITY_QUALIFICATION_COMPETENCE_LOCALE_INDEPENDENCE_CALLER_ASSERTED_NOT_VERIFIED
```

任一缺口返回 `ASSIGNMENT_INCOMPLETE`，candidate 必须为 false。合成完整路径返回 `SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY`；它只覆盖算法，`healthReviewerAssignmentReadyCandidate` 必须仍为 false，不能保存、登记或外联。

即使正式 bundle 得到结构 candidate，也必须由获授权人员在受控系统中核验现实身份、资质、胜任范围、地域适配、独立性、冲突处置、联络授权与接受记录后，另行创建正式 assignment record。validator 不得直接把 `reviewerAssigned`、`reviewCanStart`、`healthReviewStarted` 或 `healthContentApproved` 返回为 true。

## 8. 摘要、脱敏和不可变输出

`assignmentContentSha256` 对删除自身后的完整规范 bundle 计算 SHA-256；对象 key 排序，数组保留协议顺序。任何字段、候选顺序、入选项、范围覆盖、时间或引用变化都必须重算。

明显的 key/token、Bearer、Authorization/password/secret、邮箱、电话号码、证件号码、住址、签名图片/data URL、私钥或证书正文，以及 `email/phone/address/identityDocument/signatureImage/privateKey` 等敏感字段名都必须在结构处理前拒绝。错误只返回稳定路径和代码，不回显原值。

规范化输入、边界与结果必须深复制、深冻结，并分别绑定输入/结果指纹。校验函数必须精确重建结果，拒绝 caller 伪造 candidate、入选人、授权、计数、边界或指纹。

## 9. 后续 validator 验收标准

后续纯本地 validator 至少覆盖：

- 顶层、packet、候选、身份、资质、胜任、地域、冲突和五项覆盖的严格字段与资源上限；
- 正式/合成 ID 与身份隔离、角色名、自核验及起草参与拒绝；
- 单一入选候选人必须独立覆盖五项胜任范围，不允许多人拼接成单人回执；
- 资质观察时间不冒充现实有效期，`NOT_VERIFIED/REJECTED`、地域 `FAIL/NOT_VERIFIED` 和 `OPEN` 冲突失败关闭；
- packet/assignment 接受、核验、指派、90 天截止和签署计划的时序与真实公历日期；
- 禁止敏感字段名与值且错误不回显；
- `reviewCanStart` 重算、assignment SHA-256、不可变输出、结果重建和源码零副作用审计；
- 合成完整路径不产生 candidate，正式完整路径只产生结构 candidate；
- Git/文件/证件/注册表/联系人/签署工件读写、网络、Provider、外部消息、业务写入与正式 assignment record 全部为 0；
- 现实候选人、受控联系人、联络授权、正式指派、身份/资质/胜任/地域/独立性/签署核验、健康评审、健康批准、Content QA、D-068/D-069/D-063 Owner-ready、前三批独立复核 PASS、Owner、PX-1/PX-2、正式工程、原生与实现授权全部为 false。

在获得具名候选人和联络授权前，只允许实现与测试本合同；不得创建假 reviewer、假资质、假核验、假联系人、假 assignment、假健康批准或 Content QA PASS。
