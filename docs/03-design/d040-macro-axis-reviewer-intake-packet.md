# D-040 四张宏量轴卡独立复核人接入与指派检查包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-MACRO-AXIS-REVIEWER-INTAKE-PACKET-001` |
| 状态 | `INTAKE_PACKET_READY / REVIEWERS_UNASSIGNED / NO_EXTERNAL_MESSAGE / REVIEW_NOT_STARTED` |
| 对应复核包 | `D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 对应回执合同 | `D040-MACRO-AXIS-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 当前权威状态 | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| 当前下一步 | `NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED` |
| 非目标 | 预填人名、核验现实身份或胜任、发送消息、开始复核、批准健康内容、推进 PX-1/PX-2、提交 Owner 或授权实现 |

## 1. 用途与当前真实状态

[D-040 四张宏量轴卡独立复核包](d040-macro-axis-independent-review-packet.md)已经冻结十份输入、四个复核域、四卡、十四条跨轴不变量与 P0~P3 标准；[回执机器合同](../04-engineering/testing/d040-macro-axis-independent-review-record-contract.md)及[本地 validator](../04-engineering/testing/d040-macro-axis-independent-review-record-harness.md)只检查未来调用方提供的回执数据。本检查包补齐两者之间的现实接入步骤，让 PM 在取得真实候选人和联络授权后，按同一冻结 packet 完成候选收集、核验、覆盖检查与正式交接。

当前没有候选人输入，也没有外部联络授权：

- 四个复核域的具名人员仍为 `0`，身份、逐域胜任、独立性、利益冲突和签署方式均未核验；
- 本文件的字段与空白表格不是 assignment record，示例值不是现实证据；
- PM、四卡作者、Owner、Codex/AI、Agent ID 或只有岗位名称不能形成独立复核签署；
- 健康/公式域卡片复核不能代替 `ChinaQualifiedHealthReviewer` 对中国健康文案、支持资源和人群边界的正式签署；
- 本检查包不读取联系人、不发送消息，也不保存身份证件、证书原件、私人联系方式、签名图片或访问凭据；
- `reviewersAssigned`、`independentReviewStarted`、`macroAxisIndependentReviewPassed`、D-063/D-070 接受、四卡 Owner-ready、PX-1/PX-2、Owner 与全部实现授权继续为 `false`。

## 2. 接入完成的精确定义

只有以下步骤全部留下可追溯的非敏感记录，状态才可从 `REVIEWERS_UNASSIGNED` 变更为 `REVIEWERS_ASSIGNED / REVIEW_NOT_STARTED`：

1. Owner、PM 或明确获授权的项目协调人提供真实候选人和受控联系人引用；涉及外部联络、费用或第三方系统时另有明确授权引用。
2. 每位候选人明确接受 `PACKET-001-R1`、指定复核域、预计完成时间和正式签署方式。
3. 另一名具名核验人通过受控来源核验候选人身份；仓库只记录结论、时间和非敏感引用。
4. 对候选人声称覆盖的每个域分别核验胜任依据；一条泛化履历或岗位名称不能替代逐域记录。
5. 记录候选人是否参与冻结包、十份受审输入或四卡的起草，并披露利益冲突；参与起草或冲突未解决者不能计入任何域覆盖。
6. 合并全部有效候选人后，四个复核域都至少由一名合格人员覆盖；允许重复覆盖，不允许缺域或单向矩阵。
7. PM 生成正式 assignment record，绑定本检查包、冻结复核包、候选人接受记录、核验引用、联络授权和域覆盖矩阵。

“指派完成”只允许启动正式复核，不证明任何人已经读完材料、生成 attestation、记录 finding 或形成独立复核 PASS；也不补足动态模型采用证据、中国健康批准、Content QA、D-063/D-070 接受、PX 或 Owner 门禁。

## 3. 四域覆盖与逐域胜任要求

| reviewDomain | 可接受的胜任依据方向 | 必须排除的替代物 | 具名候选人 | 当前状态 |
| --- | --- | --- | --- | --- |
| `PRODUCT_DECISION_QUALITY` | 产品决定拆分、互斥选项、依赖排序、适用性、Owner 卡与验收门禁的可核验经历或交付引用 | 推荐就是答案、作者自审、只看原型、通用产品岗位名称 |  | `UNASSIGNED` |
| `HEALTH_FORMULA_EVIDENCE` | 营养/能量公式、适用人群、证据强度、风险分层与失败关闭的可核验经历或交付引用 | 网页 hash、固定 fixture、通用健康声明、未核验许可或“测试绿色” |  | `UNASSIGNED` |
| `PRIVACY_DATA_INTEGRITY` | 最少数据、四层数据分离、保留/删除、raw/display、provenance、pending/supersede 与历史不回算的可核验经历或交付引用 | 公式输入即允许持久化、删除当前资料即删除历史、作者单测 |  | `UNASSIGNED` |
| `QA_ACCESSIBILITY` | 需求—验收—证据追踪、适用/不适用、冲突回退、取消/失败零写入、键盘/焦点、VoiceOver、Dynamic Type、小屏的可核验经历或交付引用 | 测试计划、作者自测、局部单测或只有 QA 角色名 |  | `UNASSIGNED` |

同一具名人员可以覆盖多个域，但每个域都必须有独立的 `competenceEvidenceRefs`、核验结论和核验人。任一域为 `UNASSIGNED / UNVERIFIED / CONFLICT_OPEN / DRAFT_PARTICIPANT` 时，正式 assignment record 必须失败关闭。

## 4. 候选人最小接入字段

每位候选人至少提供以下字段；空白、口头转述、聊天表情或只有角色名不能计入指派：

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

- `reviewerName` 必须是真实姓名；域名、`PM`、`QA`、`Owner`、`Codex`、`AI`、`Agent` 或别名不能代替。
- `controlledContactRef` 只能引用受控联系人记录；仓库不得存储私人邮箱、电话号码或即时通信账号正文。
- `verificationState` 只允许 `VERIFIED / REJECTED / PENDING`；只有 `VERIFIED` 计入域覆盖。
- 身份核验人与候选人必须是不同具名人员；自述身份不等于核验。
- `participatedInDrafting=true` 时必须列出受影响工件，且该人员不能计入本 packet 的任何独立复核域。
- conflict 只允许 `NONE_DECLARED / RESOLVED / OPEN`；`OPEN` 不计入覆盖，`RESOLVED` 必须有处置引用。
- 指派阶段的 `signatureMethod` 只允许 `SIGNED_DOCUMENT_REFERENCE / VERIFIED_WORKFLOW_REFERENCE / WET_SIGNATURE_REFERENCE`；尚未确定签署方式不能进入完整指派。
- `externalContactAuthorizationRef` 为空时不得发送邀请、冻结材料或签署请求。

## 5. 仓库可保存与禁止保存的信息

| 类别 | 可保存 | 禁止保存 |
| --- | --- | --- |
| 身份 | 真实姓名、核验结论、具名核验人、时间、受控引用 | 身份证号、证件照片、住址、生日、私人联系方式 |
| 胜任 | 逐域结论、公开作品/履历引用、受控证据 hash | 账号口令、付费系统凭据、无关雇佣或健康信息 |
| 冲突 | 声明状态、必要摘要、处置引用 | 与复核无关的财务、家庭或私人细节 |
| 联系 | 受控联系人 ID、联络授权引用、邀请状态 | 邮箱/手机号/聊天账号正文、访问 token |
| 签署 | 签署方式、受控引用、摘要 hash | 签名图片、私钥、证书正文、data URL |

发现禁止内容时必须停止入库，并在受控系统中重建非敏感引用；不得把秘密先提交后再删除。

## 6. 正式 assignment record 最小字段

```text
assignmentId
intakePacketId = D040-MACRO-AXIS-REVIEWER-INTAKE-PACKET-001
reviewPacketIdentity {
  packetId = D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001,
  packetVersion = PACKET-001-R1,
  packetEventId = EVT-20260821-006,
  inputManifestEventId = EVT-20260821-007,
  inputCommit = 47ba4895dac2535682e8d1a8cb985176d6ad45f7,
  manifestRecordCommit = d8e812f1324590d735f809ea994e8aaa2f6805d8,
  packetArtifactCommit = d8e812f1324590d735f809ea994e8aaa2f6805d8,
  packetArtifactBlobOid = ffa60df7e2204607780cd6ac4044a9da659bef90,
  packetArtifactSha256 = b94af865ab611bc01e4cb75063d45fb65fcc877b207ea9996b4bacb8849bb060
}
reviewers[]
domainCoverage[4] { reviewDomain, candidateIds[] }
externalContactAuthorized
externalContactAuthorizationRef
assignedByName
assignedAt
assignmentEvidenceRefs[]
reviewCanStart
```

`reviewCanStart=true` 仅在所有候选人接受同一冻结 packet、身份与逐域胜任已核验、未参与起草、冲突已关闭、四域全覆盖、时间关系有效且联络/材料交付已有授权时成立。assignment record 不包含逐卡结论、finding、attestation、`reviewContentSha256` 或 `overallDisposition`；这些只能进入正式复核回执。

## 7. 未发送的接入请求草案

以下文字只有在获得具名候选人、受控联系人和外部联络授权后才能发送；本工件不发送消息。

```text
主题：Nuttie D-040 四张宏量轴卡独立复核接入确认

我们希望邀请你以具名复核人的身份审查
D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1。

拟覆盖复核域：<逐项列出>
请先确认：
1) 是否接受该 packet revision、复核域和预计完成时间；
2) 每个复核域的胜任依据；
3) 是否参与十份冻结输入或四卡的起草及是否存在利益冲突；
4) 可使用的受控签署方式。

项目只在仓库记录必要核验结论和非敏感引用，不收集证件原件、
私人联系方式或签名材料。完成接入只表示可以开始复核，
不批准健康内容、动态模型、Content QA、Owner 评审、PX 或实现。
```

## 8. 从接入到正式回执的交接

1. PM 校验 assignment record 的四域覆盖、候选接受、联络授权和全部核验引用。
2. 通过受控渠道向已接受指派的复核人提供冻结 `PACKET-001-R1`，不得替换为工作区最新文件。
3. 复核人按四卡、十四条跨轴不变量和 finding 规则执行独立审查。
4. 每位复核人生成绑定同一 `reviewContentSha256` 的 attestation。
5. 使用[本地回执 validator](../04-engineering/testing/d040-macro-axis-independent-review-record-harness.md)做结构检查；candidate 结果仍须由获授权人员核验现实身份、逐域胜任、独立性和签署工件。
6. 只有正式复核记录满足合同且现实核验完成，才能另行登记宏量轴独立复核结论；中国健康批准、Content QA、D-063/D-070 接受、四卡 Owner-ready、Owner 与实现仍按各自门禁关闭。

## 9. 当前机器可读边界

```text
reviewerIntakePacketReady: true
reviewPacketReady: true
reviewPacketVersion: PACKET-001-R1
inputManifestFrozen: true
requiredReviewerDomainCount: 4
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
reviewerSignatureVerified: false
conflictOfInterestResolved: false
independentReviewStarted: false
macroAxisIndependentReviewPassed: false
currentFindingCountsMeasured: false
formalReviewRecordCount: 0
reviewerAttestationRecordCount: 0
healthReviewStillRequired: true
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
d063Accepted: false
d070Accepted: false
d063OwnerReady: false
d070OwnerReady: false
d071OwnerReady: false
d072OwnerReady: false
ownerIntakeChanged: false
ownerCardsScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
goalImplementationAuthorized: false
recordingImplementationAuthorized: false
persistenceImplementationAuthorized: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
next: NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED
```
