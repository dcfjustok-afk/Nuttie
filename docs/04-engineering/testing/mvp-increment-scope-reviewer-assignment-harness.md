# 首个 MVP 增量范围跨角色复核人指派本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：`G2 / MVP-INCREMENT-SCOPE-REVIEWER-INTAKE-PACKET-001 / REVIEWERS_UNASSIGNED`
>
> 机器合同：[mvp-increment-scope-reviewer-assignment-contract.md](mvp-increment-scope-reviewer-assignment-contract.md)
>
> 实现：[mvp-increment-scope-reviewer-assignment-harness.mjs](../../../tools/mvp-increment-scope-reviewer-assignment-harness.mjs)；测试：[mvp-increment-scope-reviewer-assignment-harness.test.mjs](../../../tools/mvp-increment-scope-reviewer-assignment-harness.test.mjs)

## 目的

本 validator 把复核人接入包物化为严格、无网络的 `MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_INPUT_V1`。它验证冻结 packet 身份、具名候选记录形状、五域逐域胜任、身份核验、起草参与、利益冲突、联络授权、覆盖矩阵、接受/指派/截止时序、签署计划和 assignment SHA-256。

它只处理调用方普通 JSON，不读取 Git、文件、联系人、证件、履历、授权系统或签署工件，不发送消息，也不创建现实 assignment。名称、核验、胜任、冲突处置和联络授权始终只是调用方声明。

## 固定合同

输入顶层精确包含：

```text
schemaVersion
recordKind
assignmentId
intakePacketId
reviewPacketIdentity
reviewers
domainCoverage
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

`reviewPacketIdentity` 精确绑定 `MVP-INCREMENT-SCOPE-REVIEW-PACKET-001 / PACKET-001-R1 / EVT-20260822-010` 及冻结 packet 的 commit、blob OID、SHA-256。五域顺序固定为 Product、Design、Architecture/Data、Security/Privacy、QA/Traceability；候选声明域、逐域 competence 和 coverage candidate ID 必须双向一致。

候选人只有同时满足以下结构条件才计入域覆盖：

- 未参与起草；
- 身份由另一具名人员声明为 `VERIFIED`；
- 每个声明域都有证据、另一具名核验人、核验引用和时间，且状态为 `VERIFIED`；
- conflict 为 `NONE_DECLARED` 或带处置引用的 `RESOLVED`；
- 接受精确 packet、assignment 和签署计划；
- packet 接受时间不晚于 assignment 接受时间，assignment 接受时间不晚于指派时间，截止时间晚于指派时间；
- 候选级和 bundle 级联络授权引用完整。

全部候选有效、五域均至少有一名有效候选、指派证据非空且联络已授权时，调用方声明的 `reviewCanStart` 才能为 true；该值由 validator 重算，不能伪造。

## 结果语义

- 完整正式输入：`STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE`，只表示 JSON 可以交给获授权人员做现实核验。
- 完整合成输入：`SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY`，并把 `reviewerAssignmentReadyCandidate` 固定为 false。
- 任一核验、时序、证据或授权缺口：`ASSIGNMENT_INCOMPLETE`。

所有结果都固定：

```text
reviewersAssignedReturned: false
reviewCanStartReturned: false
formalAssignmentRecordCount: 0
controlledContactRecordCount: 0
identityDocumentReads: 0
competenceEvidenceReads: 0
contactRecordReads: 0
signatureArtifactReads: 0
gitReads: 0
fileReads: 0
fileWrites: 0
networkRequests: 0
externalMessagesSent: 0
businessWrites: 0
crossRoleReviewStarted: false
crossRoleReviewPassed: false
ownerChoiceRecorded: false
mvpIncrementScopeFrozen: false
g2Passed: false
formalImplementationAuthorized: false
```

## 安全与不可变性

输入先检查普通数据树、深度、节点、数组、字符串、cycle、accessor、symbol、非枚举字段、特殊 prototype、稀疏数组与非有限数，再检查精确字段。明显的 key/token/Bearer/Authorization、邮箱、电话、证件号、签名图片、data URL、私钥/证书正文和敏感字段名会触发 `UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT`；错误只带稳定字段路径，不回显原值。

`assignmentContentSha256` 对删除自身后的完整规范 bundle 计算。规范化输入、边界和结果都深复制、深冻结，并绑定输入与结果指纹；结果校验会精确重建并拒绝伪造 candidate、授权、计数、边界或摘要。

## 自动化证据

20 项顶层测试覆盖：

- 完整合成五域路径仍不产生现实 candidate、指派或授权；
- 正式/合成 identity、ID 与引用隔离；
- PENDING、REJECTED、起草参与和 OPEN 冲突失败关闭；
- 顶层、packet、candidate、固定五域、逐域 competence 和双向 coverage；
- 身份/胜任自核验拒绝、角色名拒绝和重复身份拒绝；
- 联络授权、assignment evidence、packet 接受、时序与签署计划；
- `reviewCanStart` 重算与 assignment SHA-256；
- 敏感字段名/值不回显；
- special object、accessor、cycle、资源上限；
- 深冻结、完整结果重建、伪造结果拒绝和源码零副作用审计。

运行：

```powershell
node --test tools/mvp-increment-scope-reviewer-assignment-harness.test.mjs
```

测试 fixture 使用 `Example` 名称与 `.example.test` 引用，只存在于测试进程。它不是联系人、核验、指派、复核或签署证据，不得写入 ProjectOps 作为现实 assignment。
