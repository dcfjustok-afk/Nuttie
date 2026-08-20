# D-039 B03~B05 六张 Owner 依赖卡独立复核包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001` |
| 状态 | `PACKET_READY / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED` |
| 复核范围 | B03 的 D-045、B04 的 D-031、B05 的 D-033/D-034/D-036/D-053 六张内部卡 |
| 当前权威状态 | `D-039 = ACCEPTED / PX-4_BASELINE_FROZEN / PX-5_DOR_NOT_READY` |
| 非目标 | 替 Owner 选择答案、关闭 B03/B04/B05、伪造 benchmark/Provider/原生/政策证据、授权 Owner 评审或正式实现 |
| 当前下一门禁 | `B03_B05_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED` |

## 1. 用途与独立性

本包把 D-039 PX-5 的六张 Owner 依赖卡整理成可交给未参与起草的真实复核人的统一入口。当前只完成材料准备，不记录任何复核通过：

- Product、Privacy/Data Integrity、Security/Transport/Resource Evidence、QA/Accessibility 四个复核域均未指派具名人员；
- PM、卡片作者、Codex/AI、Agent ID 或只有角色名称都不能被当作独立复核人；
- 同一具名人员可以覆盖多个域，但必须分别证明胜任范围、披露利益冲突并逐域签署；
- 卡片规格独立复核不能替代 D-034 最低支持 iPhone benchmark、D-036 三 Provider 兼容 Spike/原生边界证据、D-053 OI-07/逐 Provider 十维证据/App Privacy 映射或 D-032 第二次 Owner 动作；
- 即使六卡规格全部通过，也只获得后续资格，不接受任何决定，不关闭 B03/B04/B05，不排入 Owner intake，不改变 PX-5 或实现授权。

## 2. 必读输入

正式复核必须基于同一 `packetVersion` 的完整输入。交接时为每项记录 Git commit 与 blob OID 或规范 SHA-256；任一语义变化都会使受影响结论失效。

| 顺序 | 工件 | 作用 |
| ---: | --- | --- |
| 1 | [D-039 PX-4 设计基线](d039-px4-design-baseline.md) | 已接受 A 的本地优先、最近、扫描/AI 层级和失败关闭边界 |
| 2 | [D-039 PX-5 DoR 评估](../05-quality/d039-px5-dor-assessment.md) | B03~B05 的开放状态、额外证据和 B06/B07 依赖 |
| 3 | [D-039 正式验收矩阵](../05-quality/d039-formal-acceptance-matrix.md) | 24 条用例及 D-045/D-031/AI 决定链的条件化验收 |
| 4 | [D-039 路由与可观测性合同](d039-route-observability-contract.md) | route、testID、返回焦点、探针和非法恢复边界 |
| 5 | [D-045 最近与收藏卡](d045-recent-favorites-card-spec.md) | B03 的最近派生、收藏、清空与删除三包 |
| 6 | [D-031 媒体与 AI 保留卡](d031-media-ai-retention-card-spec.md) | B04 的工作副本、业务附件、AI 历史、备份与删除三包 |
| 7 | [D-033 非标签 AI 确认卡](d033-nonlabel-ai-confirmation-card-spec.md) | B05 的逐次载荷/host/model 确认三包 |
| 8 | [D-034 AI 资源预算卡](d034-ai-resource-budget-card-spec.md) | B05 的 19 维固定上限、清理和设备实证门禁 |
| 9 | [D-036 AITransport 隔离卡](d036-ai-transport-profile-card-spec.md) | B05 的 URL、redirect、session、cache/cookie/credential 隔离三包 |
| 10 | [D-053 Provider 用途准入卡](d053-ai-provider-use-admission-card-spec.md) | B05 的十维 Provider 真相、五类载荷、Apple 禁项与 UNKNOWN 阻断 |

### 2.1 冻结输入清单

`PACKET-001-R1` 的十份输入冻结在 Git commit `6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117`。下表中的 Git blob OID 与 SHA-256 都基于该提交中的原始 blob 字节计算，不使用工作区换行、文件时间或后续提交内容。正式复核记录必须逐项引用这些值；任一项不一致都视为另一 packet revision，既有签署不能沿用。

| 顺序 | 仓库路径 | Git blob OID | 规范 SHA-256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d039-px4-design-baseline.md` | `a1d5018d0c579a04ce799d169ce51d0f00924703` | `15dabd5dc75443f0fe1711b9a1dac931b5e462508ab39efe25554fd6b3b970b5` |
| 2 | `docs/05-quality/d039-px5-dor-assessment.md` | `484b6344c97fe39fe578043dbc960ee147c5495d` | `2d647534e697193045786cc424986b898bf0204e71511a6e12867b50e003a75a` |
| 3 | `docs/05-quality/d039-formal-acceptance-matrix.md` | `c158896b2cd008f2c315994c4b2acc812de6c035` | `007b034dcd865091ec87cf43a3bf35a4e9aaea51dfb2f5646d01c8f00a56ba86` |
| 4 | `docs/03-design/d039-route-observability-contract.md` | `fd1f1db0f54d4f5054b22305f39ae2735c9c216e` | `4947904bb18bf94c55b030d8ef737cff1f4f65a5bdc10686584b42a71d8b0475` |
| 5 | `docs/03-design/d045-recent-favorites-card-spec.md` | `f41fb50964d869946bf4accf381df8267bca68cb` | `f2195d4fe8fef9637efb1cff30139ee1b11c915503e16275a9d720b06fa6cf04` |
| 6 | `docs/03-design/d031-media-ai-retention-card-spec.md` | `9dcff0e98f10f8e1c96a7742afbe887adce5bd8c` | `a93604d1e2dd2c057fbb1e1353f4c09105ad19185938ae75db66bab3efb8b3d0` |
| 7 | `docs/03-design/d033-nonlabel-ai-confirmation-card-spec.md` | `35df3b5a37220521870d0ad1a90bb7f1161d5e42` | `68446272e3203113bad8c9a4d00bfc430203dd82f22294039e0bb650ef1f0a8b` |
| 8 | `docs/03-design/d034-ai-resource-budget-card-spec.md` | `3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c` | `a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6` |
| 9 | `docs/03-design/d036-ai-transport-profile-card-spec.md` | `3bc58cebfb45e2046891fb774bc242fe69ee5b30` | `fdfe2fdebce62e4bc7e31e4ba8b358d9780e4b93377907ecd780bcd4dfcdb7ab` |
| 10 | `docs/03-design/d053-ai-provider-use-admission-card-spec.md` | `d406e17c8e7b0e11218a8907e757a603df01e465` | `9c1cc88d34ec116f2825d6a71dd580ac8c625d99b30c87a8a06cf7086b894caf` |

冻结清单只证明“复核输入是哪一版”，不证明卡片正确、外部证据齐备、评审人合格或复核通过。当前包自身仍是 `REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED`。

## 3. 复核域与责任

| reviewDomain | 必查内容 | 不得声称 |
| --- | --- | --- |
| `PRODUCT_DECISION_QUALITY` | 六卡单轴、选项互斥可执行、收益/代价、推荐与 `Other`、D-039 A/PX-4 兼容性、B03~B05 关闭条件 | 推荐就是 Owner 答案；卡片通过就关闭阻断；D-045 可静默移除最近入口 |
| `PRIVACY_DATA_INTEGRITY` | COMMITTED 来源、最近/收藏、系统媒体与 App 副本、易失/持久内容、备份/恢复、删除、UNKNOWN 对账、最小化 | 取得/预览/发送就是保留同意；清空辅助状态会删除日记；App 可删除系统照片或外部 Files 副本 |
| `SECURITY_TRANSPORT_RESOURCE_EVIDENCE` | 逐次确认、19 维预算、URL/redirect/session 隔离、Provider 十维事实、Apple 禁项、原生和 benchmark 采用证据 | 任一卡能覆盖其余发送门禁；用户同意能证明 Provider 真相；Windows JS export 就是原生证据 |
| `QA_ACCESSIBILITY` | 稳定 ID、适用/不适用、取消/失败/超限/UNKNOWN、零写入/零网络、返回焦点、VoiceOver/Dynamic Type/320pt、真机待办 | 规格审查就是宿主卡、组件、E2E、真机或 Release 验收 |

复核人必须记录真实姓名、复核域、胜任依据、是否参与起草、利益冲突、受审不可变引用和签署时间。`participatedInDrafting=true` 或未处置利益冲突时，该域不能计入独立复核。

## 4. 六卡逐条处置表

每张卡必须给出 `APPROVE_SPEC / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SPEC / OUT_OF_SCOPE`。不能只签总评，也不能把 `NOT_APPLICABLE` 当作复核结论。

| blockerId | decisionId | questionId | 当前特殊门禁 | 复核结论 | findingIds |
| --- | --- | --- | --- | --- | --- |
| `D039-PX5-B03` | `D-045` | `d045_recent_favorites_scope` | 只取 COMMITTED 本地事实；清空不删日记；选项 B 需补 PX-4，C 需重开 D-039 |  |  |
| `D039-PX5-B04` | `D-031` | `d031_media_ai_retention` | 取得/发送不授权保留；系统来源不改；原始响应/未确认候选不入业务历史 |  |  |
| `D039-PX5-B05` | `D-033` | `d033_nonlabel_ai_confirmation_scope` | D-014 标签照片范围保留；非标签载荷逐次绑定实际 payload/host/model |  |  |
| `D039-PX5-B05` | `D-034` | `d034_ai_resource_budget_profile` | 固定全局天花板、Provider 只可收紧；最低支持 iPhone benchmark 未通过 |  |  |
| `D039-PX5-B05` | `D-036` | `d036_ai_transport_profile` | URL/redirect/session 失败关闭；三 Provider Spike 与原生边界证据未通过 |  |  |
| `D039-PX5-B05` | `D-053` | `d053_ai_provider_use_admission` | Apple 禁项不可豁免、UNKNOWN 阻断；OI-07/Provider/App Privacy 证据未通过 |  |  |

`APPROVE_WITH_REQUIRED_CHANGE` 在改动落盘并完成 delta 复核前仍是阻断；`OUT_OF_SCOPE` 必须指定需要的复核域，不能被 PM 自行改成通过。

## 5. 跨卡不变量检查

独立复核必须至少执行以下组合，不得只逐卡朗读：

1. D-045 最近只派生自未删除的 `COMMITTED` 本地餐食事实；草稿、失败、`UNKNOWN`、AI 候选和浏览行为不能进入最近或收藏。
2. D-045 清空最近只影响水位，收藏动作与最近分开；两者都不删除食品/日记，底层删除后不能通过辅助状态复活对象，全量删除覆盖所有辅助状态。
3. D-045 选项 A 与已冻结 PX-4 兼容；选项 B 需要补充收藏层级与焦点基线；选项 C 必须重开 D-039 PX-4，不能隐藏最近入口后继续当前增量。
4. D-031 的拍摄、系统选择、裁剪、预览或发送确认都不授权持久保留；业务附件/历史必须在保存前另行明确选择，App 不删除或改写系统照片来源。
5. D-031 的 Provider 原始响应、失败正文、请求/响应临时文件、未确认候选与易失输入不得进入业务历史或备份；只允许既有合同批准的非正文指纹与用户确认结构化值。
6. D-031 的取消、失败、超限、`NOT_COMMITTED`、`UNKNOWN`、启动恢复、记录删除和全量删除均有确定清理/对账；外部 Files 副本和系统照片库必须明确为 App 控制边界外。
7. D-033 必须保持 D-014 营养标签照片的独立预览范围；每次非标签确认绑定精确任务、规范化载荷范围、实际 host/model、策略与预算版本，不能复用或从上次继承。
8. D-033 的取消、编辑、配置/策略/host/model/载荷变化使旧确认失效；确认本身不读取 key、不序列化正文、不创建 transport，也不授权保留或业务保存。
9. D-034 必须覆盖输入字节/像素、派生发送副本、请求/响应、压缩/流/JSON、并发、时长、临时磁盘、预留空间和受控内存；超限在解析/持久化前失败并清理。
10. D-034 的全局天花板固定且 Provider profile 只能收紧；平衡/兼容数值在最低支持 iPhone benchmark 前都不是性能事实，不能用桌面或 JS export 代替。
11. D-036 对 scheme/origin/port/path/query/fragment/userinfo、redirect 跳数与方法、cache/cookie/credential storage、取消和临时文件实行显式失败关闭；不能从通用 `fetch` 默认行为推断隔离。
12. D-036 的任一选项都必须先有 OI-07 精确 Provider/API/地区，完成三 Provider 兼容 Spike 和当前 RN/Expo/iOS 原生边界证据；未证明行为一律不创建正式 transport。
13. D-053 准入绑定精确法律实体、API 产品、地区和载荷类别的十维证据；缺失、过期、冲突或 UNKNOWN 立即阻断，Apple 5.1.2(i)/5.1.3 禁项不可由 Owner 或用户同意豁免。
14. D-033 逐次确认不能覆盖 D-031 保留、D-034 预算、D-036 transport 或 D-053 准入；D-031 保留选择、D-034 预算或 D-036 兼容性也都不能反向授权发送。
15. D-053 未授权、Provider 未配置或任一 D-033/D-034/D-036/D-053 门禁失败时，Authorization 读取、敏感正文组装、transport 创建、业务网络和日记写入均为 0；本地搜索、最近、手工录入与创建食品保持可用。
16. 六卡复核通过不关闭 B03/B04/B05，不接受决定、不排 Owner 卡、不满足 B06/B07、PX-5 或正式实现；任何 `Other`、冲突、缺失证据、失败或取消都保持受影响路径关闭。

## 6. Finding 与通过标准

| 等级 | 定义 | 对门禁的影响 |
| --- | --- | --- |
| `P0` | 会造成敏感载荷越权发送、不可逆数据损失、秘密泄露或伪造决定/证据 | 立即阻断；修复并完整复核 |
| `P1` | 会让 Owner 选择错误语义、复用发送同意、绕过准入/预算/隔离、保留禁止内容或破坏删除/UNKNOWN | 阻断；修复并 delta 复核 |
| `P2` | 选项不互斥、依赖/证据/隐私/QA 合同不完整，可能造成实现歧义 | 阻断；修复并 delta 复核 |
| `P3` | 不改变当前安全语义的可读性、维护性或非关键补强 | 可带责任人、期限和理由作为非阻断项 |

六卡只在以下条件全部满足时得到 `D039_B03_B05_CARD_INDEPENDENT_REVIEW_PASS`：

- 6 张卡均有逐卡结论，且只能是 `APPROVE_SPEC`；
- 四个复核域均由满足独立性条件的具名人员签署，或同一具名人员分别证明每个域的胜任范围；
- 16 条跨卡不变量都有证据引用与明确结果；
- 未处置 P0/P1/P2 数量均为 0；每个保留 P3 都有责任人、期限和非阻断理由；
- D-034 benchmark、D-036 Provider/原生证据、D-053 OI-07/十维/App Privacy 和 D-032/B06/B07 仍保持独立门禁；
- D-045/D-031/D-033/D-034/D-036 未进入决定台账，D-053 仍只是 candidate；六卡未进入 Owner intake，B03/B04/B05 仍开放，全部实现授权位仍为 `false`。

## 7. 正式复核记录最小 schema

```text
reviewId
packetId = D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001
packetVersion
reviewerName
reviewDomains[]
competenceEvidenceRefs[]
participatedInDrafting
conflictOfInterest
conflictDisposition
reviewedArtifactRefs[]
cardDispositions[6]
crossCardInvariantResults[16]
findings[] { findingId, severity, domain, blockerIds[], decisionIds[], summary, evidenceRefs[], requiredChange, state }
nonBlockingP3Dispositions[]
overallDisposition
reviewedAt
signatureMethod
supersedesReviewId
```

正式记录必须严格区分 `reviewerName` 与角色/Agent ID。任何 `requiredChange` 修改 option ID、适用条件、保留/删除、确认、预算、URL/session、Provider 准入或 D-039/PX-5 依赖时，都必须升级 `packetVersion` 并重审所有受影响卡和组合。

## 8. 发起复核的只读消息草案

以下文字只有在项目取得具名联系人和外部联络授权后才能使用；本工件不发送消息。

```text
主题：Nuttie D-039 B03~B05 六张 Owner 依赖卡独立复核

请基于同一版本的冻结材料，独立审查 D-045、D-031、D-033、D-034、D-036、D-053。
需要逐卡给出 APPROVE_SPEC / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SPEC / OUT_OF_SCOPE，
并检查包内 16 条跨卡不变量。请先声明真实姓名、胜任域、是否参与起草和利益冲突。

本次复核不要求选择产品答案，也不关闭 B03~B05，不替代 benchmark、Provider/原生/政策证据，
不授权 Owner 评审、AI 发送、媒体保留、正式根工程或实现。
```

## 9. 当前机器可读边界

```text
reviewPacketReady: true
reviewPacketVersion: PACKET-001-R1
inputManifestFrozen: true
requiredArtifactCount: 10
requiredCardCount: 6
requiredBlockerCount: 3
cardDecisionCount: 6
requiredReviewerDomainCount: 4
requiredCrossCardInvariantCount: 16
allowedCardDispositionCount: 4
reviewersAssigned: false
reviewerIdentityVerified: false
reviewerIndependenceVerified: false
conflictOfInterestResolved: false
independentReviewStarted: false
independentReviewPassed: false
unresolvedP0Count: NOT_MEASURED
unresolvedP1Count: NOT_MEASURED
unresolvedP2Count: NOT_MEASURED
currentFindingCountsMeasured: false
d034DeviceBenchmarkPassed: false
d036Oi07InputComplete: false
d036ProviderCompatibilitySpikePassed: false
d036NativeBoundaryEvidencePassed: false
d053Oi07EvidenceComplete: false
d053ProviderEvidenceReady: false
d053AppPrivacyMappingApproved: false
d045Accepted: false
d031Accepted: false
d033Accepted: false
d034Accepted: false
d036Accepted: false
d053Accepted: false
b03Closed: false
b04Closed: false
b05Closed: false
externalMessageSent: false
ownerIntakeChanged: false
ownerCardsScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
d032SecondOwnerActionSatisfied: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
next: REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED
```
