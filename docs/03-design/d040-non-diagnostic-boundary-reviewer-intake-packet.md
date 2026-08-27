# D-040 D-068/D-069 非诊断边界独立复核人接入与指派检查包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NON-DIAGNOSTIC-BOUNDARY-REVIEWER-INTAKE-PACKET-001` |
| 状态 | `INTAKE_PACKET_READY / REVIEWERS_UNASSIGNED / NO_EXTERNAL_MESSAGE / REVIEW_NOT_STARTED` |
| 对应复核包 | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 对应回执合同 | `D040-NDB-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 对应指派合同 | `D040-NDB-REVIEWER-ASSIGNMENT-CONTRACT-001` |
| 当前权威状态 | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| 当前下一步 | `REAL_NAMED_REVIEWER_CANDIDATES_HEALTH_REVIEW_CONTENT_QA_AND_CONTACT_AUTHORIZATION_REQUIRED` |
| 非目标 | 预填人名、核验现实身份或胜任、读取联系人、发送消息、创建正式 assignment、开始复核、批准健康内容、通过 Content QA、推进 PX-1/PX-2、提交 Owner 或授权实现 |

## 1. 用途与当前真实状态

[D-040 D-068/D-069 非诊断边界独立复核包](d040-non-diagnostic-boundary-independent-review-packet.md)已经冻结 8 份输入、4 个复核域、D-068/D-069 两卡、10 条跨卡不变量与 P0~P3 标准；[回执机器合同](../04-engineering/testing/d040-non-diagnostic-boundary-independent-review-record-contract.md)及[本地 validator](../04-engineering/testing/d040-non-diagnostic-boundary-independent-review-record-harness.md)只检查未来调用方提供的回执数据；[复核人指派机器合同](../04-engineering/testing/d040-non-diagnostic-boundary-reviewer-assignment-contract.md)及[本地 validator](../04-engineering/testing/d040-non-diagnostic-boundary-reviewer-assignment-harness.md)只检查未来调用方提供的指派数据。

本检查包补齐“材料已冻结”与“正式指派可开始”之间的现实接入步骤，让 PM 在取得真实候选人、受控联系人和联络授权后，按同一 frozen packet 完成候选收集、非敏感核验记录、四域覆盖检查与正式交接。

当前没有候选人输入，也没有外部联络授权：

- 四个复核域的具名人员均为 `0`；身份、逐域胜任、独立性、利益冲突和签署方式均未核验；
- 本文件字段与空白表格不是 assignment record，示例 ID 不是现实证据；
- PM、作者、Owner、Codex/AI、Agent ID、岗位名或领域名不能形成独立复核签署；
- 健康安全域复核不能替代具名健康评审人对健康文案、支持资源和特殊人群边界的正式批准；
- 本检查包不读取联系人、不发送消息，也不保存身份证件、证书原件、私人联系方式、签名图片、健康记录或访问凭据；
- `reviewersAssigned`、`independentReviewStarted`、`nonDiagnosticBoundaryIndependentReviewPassed`、`healthContentApproved`、`contentQaPassed`、`d068OwnerReady`、`d069OwnerReady`、PX/Owner 与全部实现授权继续为 `false`。

## 2. 接入完成的精确定义

只有以下步骤全部留下可追溯的非敏感记录后，状态才可从 `REVIEWERS_UNASSIGNED` 变更为 `REVIEWERS_ASSIGNED / REVIEW_NOT_STARTED`：

1. Owner、PM 或明确获授权的项目协调人提供真实候选人和受控联系人引用；涉及外部联络、费用或第三方系统时另有明确授权引用。
2. 每位候选人明确接受 `PACKET-001-R1`、指定复核域、预计完成时间和正式签署方式。
3. 另一名具名核验人通过受控来源核验候选人身份；仓库只记录结论、时间和非敏感引用。
4. 对候选人声明覆盖的每个域分别核验胜任依据；一条泛化履历或岗位名称不能替代逐域记录。
5. 记录候选人是否参与 8 份冻结输入、D-068/D-069 两卡、回执合同或指派合同的起草，并披露利益冲突；参与起草或冲突未解决者不能计入任何域覆盖。
6. 合并全部有效候选人后，四个复核域都至少由一名合格人员覆盖；允许同一人覆盖多域，不允许缺域或单向矩阵。
7. PM 生成正式 assignment record，绑定本检查包、冻结复核包、候选人接受记录、身份/胜任核验引用、联络授权和域覆盖矩阵。

“指派完成”只允许启动正式独立复核，不证明任何人已经读完材料、生成 attestation、记录 finding 或形成独立复核 PASS；也不补足具名健康批准、Content QA、D-068/D-069 Owner-ready、PX 或实现门禁。

## 3. 四域覆盖与逐域胜任要求

| reviewDomain | 可接受的胜任依据方向 | 必须排除的替代物 | 具名候选人 | 当前状态 |
| --- | --- | --- | --- | --- |
| `PRODUCT_DECISION_QUALITY` | 产品决定拆分、互斥选项、适用/不适用、推荐非选择、Owner 卡与验收门禁的可核验经历或交付引用 | “推荐项就是答案”、作者自审、只看原型、通用产品岗位名称 |  | `UNASSIGNED` |
| `HEALTH_SAFETY` | 非诊断/非治疗边界、慢病/用药/饮食失调风险 fail-closed、不确定性表达、健康免责声明和升级路径的可核验经历或交付引用 | 网页 hash、固定 fixture、泛化健康声明、未核验资质、把群体误差当个人健康上下限 |  | `UNASSIGNED` |
| `PRIVACY_DATA_INTEGRITY` | 最小化健康上下文、诊断/药物/自由文本禁收、版本化来源、raw/display 分离、持久化关闭与数据控制边界的可核验经历或交付引用 | 公式输入即允许持久化、联系人/定位/HealthKit 默认可读、作者单测 |  | `UNASSIGNED` |
| `QA_ACCESSIBILITY` | requirement-to-test 追踪、YES/UNSURE/NOT_APPLICABLE、失败零写入、无障碍文案/焦点/Dynamic Type/VoiceOver 检查的可核验经历或交付引用 | 测试计划、作者自测、局部单测或只有 QA 角色名 |  | `UNASSIGNED` |

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

- `reviewerName` 必须是真实姓名；域名、`PM`、`QA`、`Owner`、`Codex`、`AI`、`Agent` 或别名不能替代。
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
intakePacketId = D040-NON-DIAGNOSTIC-BOUNDARY-REVIEWER-INTAKE-PACKET-001
reviewPacketIdentity {
  packetId = D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001,
  packetVersion = PACKET-001-R1,
  packetEventId = EVT-20260827-007,
  cardSpecEventId = EVT-20260827-005,
  cardHarnessEventId = EVT-20260827-006,
  reviewRecordHarnessEventId = EVT-20260827-008,
  packetArtifactBlobOid = a9538a5caebe205a30be970ea0818bb536a0c3fd,
  packetArtifactSha256 = b5a271797575b72c0e14208394145ea5e16527e9c0eeec7724ae8f20776c7c69
}
reviewers[]
domainCoverage[4] { reviewDomain, candidateIds[] }
externalContactAuthorized
externalContactAuthorizationRef
assignedByName
assignedAt
assignmentEvidenceRefs[]
reviewCanStart
assignmentContentSha256
```

`reviewCanStart=true` 仅在所有候选人接受同一 frozen packet、身份与逐域胜任已核验、未参与起草、冲突已关闭、四域全覆盖、时间关系有效且联络/材料交付已有授权时成立。assignment record 不包含逐卡结论、finding、attestation、`reviewContentSha256` 或 `overallDisposition`；这些只能进入正式复核回执。

## 7. 未发送的接入请求草稿

以下文字只有在获得具名候选人、受控联系人和外部联络授权后才能发送；本工件不发送消息。

```text
主题：Nuttie D-040 D-068/D-069 非诊断边界独立复核接入确认

我们希望邀请你以具名独立复核人的身份审查
D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1。

拟覆盖复核域：<逐项列出>

请先确认：
1) 是否接受该 packet revision、复核域和预计完成时间；
2) 每个复核域的胜任依据；
3) 是否参与 8 份冻结输入、D-068/D-069 两卡、回执合同或指派合同的起草，及是否存在利益冲突；
4) 可使用的受控签署方式。

项目只在仓库记录必要核验结论和非敏感引用，不收集证件原件、私人联系方式、健康记录或签名材料。
完成接入只表示可以开始复核，不批准健康内容、Content QA、Owner 评审、PX 或实现。
```

## 8. 从接入到正式回执的交接

1. PM 校验 assignment record 的四域覆盖、候选接受、联络授权和全部核验引用。
2. 通过受控渠道向已接受指派的复核人提供 frozen `PACKET-001-R1`，不得替换为工作区最新文件。
3. 复核人按 D-068/D-069 两卡、10 条跨卡不变量和 finding 规则执行独立审查。
4. 每位复核人生成绑定同一 `reviewContentSha256` 的 attestation。
5. 使用[本地回执 validator](../04-engineering/testing/d040-non-diagnostic-boundary-independent-review-record-harness.md)做结构检查；candidate 结果仍须由获授权人员核验现实身份、逐域胜任、独立性和签署工件。
6. 只有正式复核记录满足合同且现实核验完成，才能另行登记 D-068/D-069 独立复核结论；健康批准、Content QA、D-068/D-069 Owner-ready、Owner 与实现仍按各自门禁关闭。

## 9. 当前机器可读边界

```text
reviewerIntakePacketReady: true
reviewPacketReady: true
reviewPacketVersion: PACKET-001-R1
requiredReviewerDomainCount: 4
reviewerCandidateCount: 0
reviewerAssignmentRecordCount: 0
controlledContactRecordCount: 0
externalContactAuthorized: false
externalMessageSent: false
identityDocumentStored: false
privateContactStored: false
signatureMaterialStored: false
healthRecordStored: false
reviewersAssigned: false
reviewerIdentityVerified: false
reviewerCompetenceVerified: false
reviewerIndependenceVerified: false
reviewerSignatureVerified: false
conflictOfInterestResolved: false
independentReviewStarted: false
nonDiagnosticBoundaryIndependentReviewPassed: false
currentFindingCountsMeasured: false
formalReviewRecordCount: 0
reviewerAttestationRecordCount: 0
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
d068OwnerReady: false
d069OwnerReady: false
ownerIntakeChanged: false
ownerCardsScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
diagnosisOrTreatmentAuthorized: false
medicationDetailCollectionAuthorized: false
healthFreeTextCollectionAuthorized: false
healthDataPersistenceAuthorized: false
automaticDialAuthorized: false
networkResourceRefreshAuthorized: false
locationReadAuthorized: false
contactsReadAuthorized: false
healthKitWriteAuthorized: false
formulaImplementationAuthorized: false
healthCopyImplementationAuthorized: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
next: REAL_NAMED_REVIEWER_CANDIDATES_HEALTH_REVIEW_CONTENT_QA_AND_CONTACT_AUTHORIZATION_REQUIRED
```
