# 首个 MVP 增量范围跨角色复核人接入与指派检查包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `MVP-INCREMENT-SCOPE-REVIEWER-INTAKE-PACKET-001` |
| 状态 | `INTAKE_PACKET_READY / REVIEWERS_UNASSIGNED / NO_EXTERNAL_MESSAGE / REVIEW_NOT_STARTED` |
| 对应复核包 | `MVP-INCREMENT-SCOPE-REVIEW-PACKET-001 / PACKET-001-R1` |
| 对应回执合同 | `MVP-INCREMENT-SCOPE-CROSS-ROLE-REVIEW-RECORD-CONTRACT-001` |
| 对应门禁 | `G2 产品基线` |
| 当前下一步 | `NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED` |
| 非目标 | 预填人名、核验现实身份或胜任、发送消息、开始复核、产生 PASS、替 Owner 选择或授权实现 |

## 1. 用途与当前真实状态

[首个 MVP 增量范围跨角色复核包](mvp-increment-scope-review-packet.md)已冻结十一份输入、A/B/C 三项范围处置、五个复核域、十二条跨选项不变量与 P0~P3 标准；[回执机器合同](../04-engineering/testing/mvp-increment-scope-cross-role-review-record-contract.md)及本地 validator 只校验未来调用方数据。本检查包补齐两者之间的现实接入步骤，让 PM 在获得真实候选人和联络授权后，可以按同一字段收集、核验和交接，不靠聊天印象或角色名称冒充指派。

当前没有候选人输入，也没有外部联络授权：

- 五个域的具名复核人仍为 `0`，身份、逐域胜任范围、独立性、利益冲突和签署方式均未核验；
- 本文件中的空白表格不是 assignment record，示例字段不是现实证据；
- PM、范围卡作者、Owner、Codex/AI、Agent ID 或只有岗位名称不能单独形成跨角色签署；
- 本检查包不读取联系人、不发送消息、不保存身份证件、证书原件、私人邮箱、电话号码或住址；
- `reviewersAssigned`、`crossRoleReviewStarted`、`crossRoleReviewPassed`、Owner 选择、范围冻结、G2 与全部实现授权继续为 `false`。

## 2. 接入完成的精确定义

只有以下步骤全部留下可追溯记录，才能把状态从 `REVIEWERS_UNASSIGNED` 变更为 `REVIEWERS_ASSIGNED / REVIEW_NOT_STARTED`：

1. Owner、PM 或明确获授权的项目协调人提供真实候选人及受控联系引用；如涉及外部联络、费用或第三方系统，另有明确授权引用。
2. 每位候选人明确接受指定复核域、`PACKET-001-R1`、预计完成时间和正式签署方式。
3. 另一名具名核验人按受控来源核验候选人身份；仓库只记录结论、核验时间和非敏感引用。
4. 对候选人声称覆盖的每个域分别核验胜任依据，不能用一条泛化履历覆盖五域。
5. 记录是否参与本范围包或受审输入的起草，并披露利益冲突；冲突未解决时该人员不能计入域覆盖。
6. 合并全部有效候选人后，五个复核域恰好全部被至少一名合格人员覆盖；重复覆盖允许，缺域不允许。
7. PM 生成正式 assignment record，绑定本检查包、冻结复核包、候选人接受记录、核验引用和域覆盖矩阵。

“指派完成”只允许启动正式复核，不证明任何人已经读完材料、签署 attestation、给出 finding 或形成 PASS。

## 3. 五域覆盖与逐域胜任要求

| reviewDomain | 可接受的胜任依据方向 | 必须排除的替代物 | 具名候选人 | 当前状态 |
| --- | --- | --- | --- | --- |
| `PRODUCT_SCOPE` | 产品范围切片、需求优先级、依赖与验收管理的可核验经历或交付引用 | “了解产品”、作者自审、Owner 偏好、推荐 A |  | `UNASSIGNED` |
| `DESIGN_EXPERIENCE` | 移动端交互、失败恢复、简中、小屏、Dynamic Type、VoiceOver 的可核验经历或交付引用 | 只看静态截图、浏览器原型通过、通用设计岗位名称 |  | `UNASSIGNED` |
| `ARCHITECTURE_DATA` | 本地优先、事务、迁移、Repository/adapter、iOS 能力边界的可核验经历或交付引用 | 只会 JavaScript、Windows Metro export、框架无关单测绿色 |  | `UNASSIGNED` |
| `SECURITY_PRIVACY` | 数据最小化、权限、密钥、删除/备份、网络失败关闭和移动端隐私审查的可核验经历或交付引用 | Owner 豁免、通用安全称谓、未核实自述或 AI 判断 |  | `UNASSIGNED` |
| `QA_TRACEABILITY` | 需求—验收—证据追踪、负向场景、门禁强度和移动端可访问性测试的可核验经历或交付引用 | 测试计划、作者自测、局部单测通过或角色名称 |  | `UNASSIGNED` |

同一具名人员可以覆盖多个域，但每个域都必须有独立的 `competenceEvidenceRefs`、核验结论和核验人。只要任一域为 `UNASSIGNED / UNVERIFIED / CONFLICT_OPEN`，正式 assignment record 就必须失败关闭。

## 4. 候选人最小接入字段

每位候选人必须提供以下最小字段；空白、口头转述、聊天表情或只有角色名都不能计入指派：

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

字段约束：

- `reviewerName` 必须是真实姓名；域名、`PM`、`QA`、`Codex`、`AI`、`Agent` 或别名不能代替。
- `controlledContactRef` 只能引用受控联系人记录；仓库不得存储私人邮箱、电话号码或即时通信账号正文。
- `verificationState` 只允许 `VERIFIED / REJECTED / PENDING`；只有 `VERIFIED` 计入域覆盖。
- 身份核验人与候选人必须是不同具名人员；自述身份不等于核验。
- `participatedInDrafting=true` 时必须列出受影响工件，且该人员不能独立批准自己起草的部分；需要另一名合格人员覆盖受影响域。
- conflict 只允许 `NONE_DECLARED / RESOLVED / OPEN`；`OPEN` 不计入覆盖，`RESOLVED` 必须有处置引用。
- `signatureMethod` 只允许回执合同定义的 `SIGNED_DOCUMENT_REFERENCE / VERIFIED_WORKFLOW_REFERENCE / WET_SIGNATURE_REFERENCE`。
- `externalContactAuthorizationRef` 为空时不得发送任何邀请或材料。

## 5. 仓库可保存与禁止保存的信息

| 类别 | 可保存 | 禁止保存 |
| --- | --- | --- |
| 身份 | 真实姓名、核验结论、核验人、时间、受控引用 | 身份证号、证件照片、住址、生日、私人联系方式 |
| 胜任 | 逐域结论、公开作品/履历引用、受控证据 hash | 账号口令、付费系统凭证、无关雇佣或健康信息 |
| 冲突 | 声明状态、必要摘要、处置引用 | 与复核无关的财务、家庭或私人细节 |
| 联系 | 受控联系人 ID、联络授权引用、邀请状态 | 邮箱/手机号/聊天账号正文、访问 token |
| 签署 | 签署方式、受控引用、摘要 hash | 签名图片、私钥、证书正文、data URL |

发现禁止内容时必须停止入库并要求在受控系统中重建非敏感引用；不得把秘密先提交后再删除。

## 6. 正式 assignment record 最小字段

```text
assignmentId
intakePacketId = MVP-INCREMENT-SCOPE-REVIEWER-INTAKE-PACKET-001
reviewPacketIdentity {
  packetId = MVP-INCREMENT-SCOPE-REVIEW-PACKET-001,
  packetVersion = PACKET-001-R1,
  inputManifestEventId = EVT-20260822-010,
  packetArtifactCommit = 6be59e5df3c1d06416f87950308bcb9a5df2aab0,
  packetArtifactBlobOid = 3b232045cdf791454ef269d0f7a1e632e72ef1c0,
  packetArtifactSha256 = d17ae5fa7567486e14741a3fecf252abf0b13414bb50c935403cc206b5b59a0e
}
reviewers[]
domainCoverage[5] { reviewDomain, candidateIds[] }
externalContactAuthorized
externalContactAuthorizationRef
assignedByName
assignedAt
assignmentEvidenceRefs[]
reviewCanStart
```

`reviewCanStart=true` 仅在所有候选人接受、身份已核验、逐域胜任已核验、冲突已关闭、五域全覆盖、packet 身份精确且联络/材料交付符合授权时成立。assignment record 不包含逐项范围结论、finding、attestation 或 `overallDisposition`；这些只能出现在正式复核回执中。

## 7. 未发送的接入请求草案

以下文字只有在获得具名候选人、受控联系方式和外部联络授权后才能发送；本工件不发送消息。

```text
主题：Nuttie 首个 MVP 增量范围跨角色复核接入确认

我们希望邀请你以具名复核人的身份审查
MVP-INCREMENT-SCOPE-REVIEW-PACKET-001 / PACKET-001-R1。

拟覆盖复核域：<逐项列出>
请先确认：
1) 是否接受该 packet revision、复核域和预计完成时间；
2) 每个复核域的胜任依据；
3) 是否参与受审材料起草及利益冲突；
4) 可使用的受控签署方式。

项目只在仓库记录必要核验结论和非敏感引用，不收集证件原件、
私人联系方式或签名材料。完成接入只表示可以开始复核，
不要求选择 Owner 方案，也不自动形成 G2 PASS 或实现授权。
```

## 8. 从接入到正式回执的交接

1. PM 校验 assignment record 的五域覆盖与全部核验引用。
2. 通过受控渠道向已接受指派的复核人提供冻结 `PACKET-001-R1`，不得替换为工作区最新文件。
3. 复核人按 A/B/C、十二条不变量和 finding 规则执行审查。
4. 每位复核人生成绑定同一 `reviewContentSha256` 的 attestation。
5. 使用[本地回执 validator](../04-engineering/testing/mvp-increment-scope-cross-role-review-record-harness.md)做结构检查；validator 的 candidate 结果仍须由获授权人员核验现实身份、胜任、独立性与签署工件。
6. 只有正式复核记录满足合同且现实核验完成，才能另行登记跨角色复核结论；之后才可把范围卡排入 Owner 评审。

## 9. 当前机器可读边界

```text
reviewerIntakePacketReady: true
requiredReviewerDomainCount: 5
reviewerCandidateCount: 0
reviewerAssignmentRecordCount: 0
controlledContactRecordCount: 0
externalContactAuthorized: false
externalMessageSent: false
identityDocumentStored: false
privateContactStored: false
signatureMaterialStored: false
reviewersAssigned: false
reviewerIdentityVerified: false
reviewerCompetenceVerified: false
reviewerIndependenceVerified: false
conflictOfInterestResolved: false
crossRoleReviewStarted: false
crossRoleReviewPassed: false
formalReviewRecordCount: 0
reviewerAttestationRecordCount: 0
ownerIntakeChanged: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
selectedIncrementId: null
decisionIdAllocated: false
decisionRegistered: false
mvpIncrementScopeFrozen: false
g2Passed: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
next: NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED
```
