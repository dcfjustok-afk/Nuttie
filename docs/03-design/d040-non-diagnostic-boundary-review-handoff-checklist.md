# D-040 D-068/D-069 非诊断边界正式复核交接清单

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NON-DIAGNOSTIC-BOUNDARY-REVIEW-HANDOFF-CHECKLIST-001` |
| 状态 | `HANDOFF_CHECKLIST_READY / REVIEW_NOT_STARTED / NOT_OWNER_READY` |
| 对应接入包 | `D040-NON-DIAGNOSTIC-BOUNDARY-REVIEWER-INTAKE-PACKET-001` |
| 对应指派合同 | `D040-NDB-REVIEWER-ASSIGNMENT-CONTRACT-001` |
| 对应回执合同 | `D040-NDB-INDEPENDENT-REVIEW-RECORD-CONTRACT-001` |
| 对应复核包 | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` |
| 当前权威状态 | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| 当前下一步 | `REAL_NAMED_REVIEWER_CANDIDATES_HEALTH_REVIEW_CONTENT_QA_AND_CONTACT_AUTHORIZATION_REQUIRED` |

## 1. 用途

本清单把“复核人接入资料已经写清楚”到“可以开始正式独立复核”之间的硬闸门拆成可核对项目。它只是一份本地治理工件，不包含真实复核人、联系方式、签名材料、健康记录、Owner 选择或实现授权。

它约束三件事：

1. 哪些前置记录必须已经存在，才能把 `reviewCanStart` 置为 `true`。
2. 哪些信息只能保存非敏感引用，不能进入仓库正文。
3. 哪些状态即使清单完成，也必须继续保持关闭。

## 2. 交接前置物

| 前置物 | 必须绑定的身份 | 当前状态 |
| --- | --- | --- |
| 冻结复核包 | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1` | `READY` |
| D-068/D-069 卡片规范 | `EVT-20260827-005` | `READY` |
| 卡片本地 validator | `EVT-20260827-006` | `READY / SYNTHETIC_ONLY` |
| 正式复核回执机器合同 | `EVT-20260827-008` | `READY / SYNTHETIC_ONLY` |
| 复核人指派机器合同 | `EVT-20260827-009` | `READY / SYNTHETIC_ONLY` |
| 复核人接入包 | `EVT-20260827-010` | `READY / NO_REAL_CANDIDATE` |

这些前置物只证明材料形状与本地校验边界已经固定；它们不证明任何人已经被联系、接受指派、开始复核或给出结论。

## 3. `reviewCanStart=true` 的全部必要条件

正式复核只能在以下条件全部为真时启动：

- `assignmentRecord` 存在，且绑定同一份 `PACKET-001-R1`、`EVT-20260827-007`、`EVT-20260827-008`、`EVT-20260827-009`、`EVT-20260827-010`。
- 至少一名真实具名候选人完成非敏感接入记录；角色名、团队名、AI、Agent、PM、Owner 或作者都不能替代真实姓名。
- 四个复核域 `PRODUCT_DECISION_QUALITY / HEALTH_SAFETY / PRIVACY_DATA_INTEGRITY / QA_ACCESSIBILITY` 都至少有一名有效候选人覆盖。
- 每个候选人的身份核验、逐域胜任依据、独立性、利益冲突处置、packet 接受记录、预计完成时间和签署方式均已记录为可追溯的非敏感引用。
- 外部联系与材料发送已被显式授权；授权记录只保存引用，不保存私人邮箱、手机号、IM 账号、token 或凭据正文。
- 指派时间早于预计完成时间，且晚于或等于接入授权时间。
- `assignmentContentSha256` 已基于规范化 assignment record 生成，且不包含敏感正文。
- 回执 validator 的输入只来自调用方显式提交的数据，不读取仓库外身份文件、联系人、凭据、HealthKit 或线上系统。

任一条件缺失时，`reviewCanStart` 必须保持 `false`，不得生成“正式复核已开始”的事件。

## 4. 禁止交接的情况

出现以下任一情况时必须失败关闭：

- 候选人仅为占位符、岗位名、角色名、组织名或 AI/Agent 身份。
- 候选人参与过 8 份冻结输入、D-068/D-069 卡片、复核包、回执合同或指派合同的起草，且未从覆盖矩阵中排除。
- 健康安全域仅有泛化健康文案经验、网页 hash、测试 fixture 或未经核验资质。
- 使用群体误差、公式来源或 UI 文案推断个人健康边界。
- 指派记录缺少外部联系授权，却声称材料已经发送、复核已经开始或签名已经取得。
- 仓库存入证件照片、私人联系方式、签名图片、健康记录、访问 token、付费凭据或 data URL。
- 用本地 validator 的 synthetic pass candidate 冒充正式复核结论。
- 把交接完成误写为健康批准、Content QA 通过、Owner-ready、PX-1/PX-2 授权或正式实现授权。

## 5. 最小可记录交接状态

当前仓库只能记录以下状态：

```text
handoffChecklistReady: true
reviewPacketReady: true
reviewerIntakePacketReady: true
assignmentContractReady: true
reviewRecordContractReady: true
requiredInputCount: 8
requiredReviewDomainCount: 4
requiredCardDispositionCount: 2
requiredCrossCardInvariantCount: 10
reviewerCandidateCount: 0
formalAssignmentRecordCount: 0
controlledContactRecordCount: 0
externalContactAuthorized: false
externalMessagesSent: 0
reviewCanStart: false
formalReviewRecordCount: 0
reviewerAttestationRecordCount: 0
independentReviewStarted: false
independentReviewPassed: false
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
d068OwnerReady: false
d069OwnerReady: false
ownerIntakeChanged: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
px1Authorized: false
px2Authorized: false
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
```

## 6. 下一步仍然阻断

本清单完成后，下一步没有改变：仍需真实具名复核候选人、受控联系记录、外部联系授权、健康评审、Content QA 与正式 assignment record。没有这些输入，D-068/D-069 不得进入 Owner 评审，D-040 不得进入 PX-1/PX-2，任何非诊断边界文案、公式、HealthKit、联系人、定位或网络刷新能力也不得进入正式实现。
