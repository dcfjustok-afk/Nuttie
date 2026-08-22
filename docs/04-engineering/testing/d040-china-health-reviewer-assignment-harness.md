# D-040 中国健康评审人指派本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：`D-040 / PX-0_INPUT_GAP / D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001 / REVIEWER_UNASSIGNED`
>
> 机器合同：[d040-china-health-reviewer-assignment-contract.md](d040-china-health-reviewer-assignment-contract.md)
>
> 实现：[d040-china-health-reviewer-assignment-harness.mjs](../../../tools/d040-china-health-reviewer-assignment-harness.mjs)；测试：[d040-china-health-reviewer-assignment-harness.test.mjs](../../../tools/d040-china-health-reviewer-assignment-harness.test.mjs)

## 目的

本 validator 把健康评审人接入包物化为严格、无网络的 `D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_INPUT_V1`。它验证冻结 packet 身份、具名候选记录、唯一入选人、身份/资质/五项胜任/简中与中国大陆地域适配、起草参与、利益冲突、联络授权、覆盖矩阵、接受/核验/指派/90 天截止时序、真实公历日期、签署计划和 assignment SHA-256。

它只处理调用方普通 JSON，不读取 Git、文件、联系人、证件、执业注册、履历、授权系统或签署工件，不发送消息，也不创建现实 assignment。名称、身份、资质观察、胜任、地域适配、冲突处置和联络授权始终只是调用方声明。

## 固定合同

输入顶层精确包含：

```text
schemaVersion
recordKind
assignmentId
intakePacketId
reviewPacketIdentity
reviewerCandidates
selectedCandidateId
requiredScopeCoverage
externalContactAuthorized
externalContactAuthorizationRef
assignedByName
assignedAt
assignmentEvidenceRefs
reviewCanStart
containsCredential
containsIdentityDocument
containsPrivateContact
containsSignatureMaterial
assignmentContentSha256
```

`reviewPacketIdentity` 精确绑定 `D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001 / PACKET-001-R1 / EVT-20260820-008`、input commit `5c32cfb...`、packet artifact commit `0fd261e...` 及冻结 packet 的 blob OID、SHA-256。五项胜任范围顺序固定为成人体重/能量/停止规则、慢性病/用药/进食障碍边界、模型数值健康语义、中国宏量参考带非处方边界、简中支持文案与紧急资源语境；候选声明、逐项 competence 核验和 coverage candidate ID 必须双向一致。

入选候选人只有同时满足以下结构条件才进入结构就绪状态：

- 未参与九份冻结输入与十三项受审内容的起草；
- 身份由另一具名人员声明为 `VERIFIED`；
- 资质由另一具名人员声明为 `CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF`，并记录核验时间和“观察时显示有效”的时间；
- 五项范围都有证据、另一具名核验人、核验引用和时间，且状态为 `VERIFIED`；
- `zh-Hans-CN` 与中国大陆语境适配由另一具名人员声明为 `PASS`；
- conflict 为 `NONE_DECLARED` 或带处置引用的 `RESOLVED`；
- 接受精确 packet、assignment 和签署计划；
- packet 接受时间不晚于 assignment 接受时间，全部核验与观察时间不晚于指派时间，截止时间晚于指派时间且不超过 90×24 小时；
- 候选级和 bundle 级联络授权引用完整。

唯一 `selectedCandidateId` 必须引用一名独自覆盖全部五项的结构完整候选人，不能把多人范围拼接成单人健康签署。未入选候选人允许保持待核验；五项覆盖、指派证据和联络授权全部满足时，调用方声明的 `reviewCanStart` 才能为 true。该值由 validator 重算，不能伪造。

## 结果语义

- 完整正式输入：`STRUCTURALLY_COMPLETE_HEALTH_REVIEWER_ASSIGNMENT_CANDIDATE`，只表示 JSON 可以交给获授权人员做现实核验。
- 完整合成输入：`SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY`，并把 `healthReviewerAssignmentReadyCandidate` 固定为 false。
- 任一核验、时序、证据或授权缺口：`ASSIGNMENT_INCOMPLETE`。

所有结果都固定：

```text
reviewerAssignedReturned: false
reviewCanStartReturned: false
reviewerCandidateCount: 0
reviewerAssignmentRecordCount: 0
controlledContactRecordCount: 0
formalHealthReviewRecordCount: 0
reviewerAttestationRecordCount: 0
syntheticFixturePersistedCount: 0
identityDocumentReads: 0
qualificationRegistryReads: 0
competenceEvidenceReads: 0
contactRecordReads: 0
signatureArtifactReads: 0
gitReads: 0
fileReads: 0
fileWrites: 0
networkRequests: 0
providerRequests: 0
externalMessagesSent: 0
businessWrites: 0
externalContactAuthorized: false
reviewerAssigned: false
reviewerIdentityVerified: false
reviewerQualificationVerified: false
reviewerCompetenceVerified: false
reviewerLocaleFitVerified: false
reviewerIndependenceVerified: false
reviewerSignatureVerified: false
conflictOfInterestResolved: false
healthReviewStarted: false
healthReviewStillRequired: true
healthContentApproved: false
contentQaPassed: false
d068OwnerReady: false
d069OwnerReady: false
d063OwnerReady: false
firstThreeBatchesIndependentReviewPassed: false
ownerIntakeChanged: false
ownerCardsScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
healthCopyImplementationAuthorized: false
formulaImplementationAuthorized: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
```

## 安全与不可变性

输入先检查普通数据树、深度、节点、数组、字符串、cycle、accessor、symbol、非枚举字段、特殊 prototype、稀疏数组与非有限数，再检查精确字段。明显的 key/token/Bearer/Authorization、邮箱、电话、证件号、签名图片、data URL、私钥/证书正文和敏感字段名会触发 `UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT`；错误只带稳定字段路径，不回显原值。

`assignmentContentSha256` 对删除自身后的完整规范 bundle 计算。规范化输入、边界和结果都深复制、深冻结，并绑定输入与结果指纹；结果校验会精确重建并拒绝伪造 candidate、授权、计数、边界或摘要。

## 自动化证据

23 项顶层测试覆盖：

- 完整合成五项路径仍不产生现实 candidate、指派或授权；
- 完整正式输入只返回调用方声明的结构 candidate，全部现实/健康/Content QA/Owner/PX-1/PX-2/实现状态仍关闭；
- 正式/合成 identity、ID 与引用隔离；
- 唯一入选人、未入选待核验候选人与禁止自我指派；
- PENDING/REJECTED/NOT_VERIFIED、地域 FAIL、起草参与和 OPEN 冲突失败关闭；
- 顶层、packet、candidate、固定五项、逐项 competence 和双向 coverage；
- 身份/资质/胜任/地域自核验拒绝、角色名拒绝和重复身份拒绝；
- 联络授权、assignment evidence、packet 接受、核验/90 天时序与签署计划；
- `reviewCanStart` 重算与 assignment SHA-256；
- 敏感字段名/值不回显；
- special object、accessor、cycle、资源上限；
- 深冻结、完整结果重建、伪造结果拒绝和源码零副作用审计。

运行：

```powershell
node --test tools/d040-china-health-reviewer-assignment-harness.test.mjs
```

测试 fixture 只存在于测试进程。`SYNTHETIC_CONTRACT_FIXTURE` 使用 `Example` 名称与 `.example.test` 引用；形式完整的 `FORMAL_ASSIGNMENT_RECORD` 路径仍被明确标记为调用方声明，且不会保存、登记或形成现实 assignment。两者都不得写入 ProjectOps 作为真实联系人、核验、指派、复核、健康批准、Content QA 或签署证据。
