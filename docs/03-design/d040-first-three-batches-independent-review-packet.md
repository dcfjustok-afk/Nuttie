# D-040 前三批十三卡独立复核包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001` |
| 状态 | `PACKET_READY / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED` |
| 复核范围 | D-054~D-067 中已形成规格的 13 张卡；不包含已另行成包的 D-063/D-070/D-071/D-072，也不包含尚未形成卡片的 D-068/D-069 |
| 当前权威状态 | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| 非目标 | 选择 Owner 答案、批准健康内容、补足动态模型采用证据、把预留 ID 写入决定台账、授权实现或发布 |
| 当前下一门禁 | `FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_REQUIRED` |

## 1. 用途与独立性

本包把前三批十三张内部选择卡整理成可交给未参与卡片起草的真实复核人的统一入口。当前只完成材料准备，不记录任何复核通过：

- Product、健康/公式、Privacy/Data Integrity、QA/Accessibility 四个复核域都尚未指派具名人员；
- PM、卡片作者、Codex/AI、Agent ID 或只有角色名称都不能被当作独立复核人；
- 同一具名人员可以覆盖多个域，但必须分别证明对应胜任范围、披露利益冲突并逐域签署；
- 健康/公式域的卡片复核不能代替 `ChinaQualifiedHealthReviewer` 对中国文案、支持资源和人群边界的正式健康签署；
- 独立复核通过也只让受审卡片具备下一步资格，不自动排入 Owner intake，不改变任何授权位。

## 2. 必读冻结输入

正式复核必须基于同一 `packetVersion` 的完整输入。交接时为每项记录 Git commit 与 blob OID 或规范 SHA-256；任一语义变化都会使受影响结论失效。

| 顺序 | 工件 | 作用 |
| ---: | --- | --- |
| 1 | [问题分解与全局 ID 预留](d040-question-allocation.md) | 20 个决定轴、批次边界、依赖顺序和未授权状态 |
| 2 | [PX-0 输入研究](d040-px0-input-research.md) | 字段、公式、人群、持久化、删除和证据限制 |
| 3 | [第一批卡片规格](d040-first-batch-card-spec.md) | D-054/D-055/D-056/D-058 |
| 4 | [第二批能量模型卡片规格](d040-energy-model-batch-card-spec.md) | D-057/D-059/D-060/D-061/D-062 |
| 5 | [NIDDK 动态模型可行性输入](d040-niddk-dynamic-model-feasibility-input.md) | 证明来源可定位，同时固定采用证据仍未通过 |
| 6 | [第三批资料与目标生命周期卡片规格](d040-data-lifecycle-batch-card-spec.md) | D-064/D-065/D-066/D-067 |
| 7 | [中国健康评审人交接包](d040-china-health-reviewer-intake-packet.md) | 证明健康签署是另一门禁，当前仍未开始 |

### 2.1 冻结输入清单

`PACKET-001-R1` 的七份输入冻结在 Git commit `b39a8f09ae544d7c3276f532b536c67ade75b446`。下表中的 Git blob OID 与 SHA-256 都基于该提交中的原始 blob 字节计算，不使用工作区换行、文件时间或后续提交内容。正式复核记录必须逐项引用这些值；任一项不一致都视为另一 packet revision，既有签署不能沿用。

| 顺序 | 仓库路径 | Git blob OID | 规范 SHA-256 |
| ---: | --- | --- | --- |
| 1 | `docs/03-design/d040-question-allocation.md` | `380435e7bbe611319b102052662da471ff9e49b1` | `20fd5c4671419c17ab06d99a8f1241169b67b8009b86b51fc1181fb66847ce08` |
| 2 | `docs/03-design/d040-px0-input-research.md` | `f3b9e68d4b181b761e21a57ba476291d7410cf36` | `bf7b4c6e74307b93a15c38c47cf3c81a3c5b45e651fcb4b1b3a02ef9b2a51381` |
| 3 | `docs/03-design/d040-first-batch-card-spec.md` | `c55e5d73a8cffc31ee81fb9d72dd2c252ea08282` | `8489e99efbdb2f2f410eb1005909dd2b1732d8a8ce69616aca6eec51f8d86ef9` |
| 4 | `docs/03-design/d040-energy-model-batch-card-spec.md` | `46f3a6b353ebfa9c2ab73f76b291873dbd9f6569` | `e776e8f7ca9aa9649849ef2b6cc814e6e0c461c8b55e7f0f0f6ae4e517373835` |
| 5 | `docs/03-design/d040-niddk-dynamic-model-feasibility-input.md` | `409119ac4af1691791794a733364d50f847653b2` | `6feeba9bf07991c66254cf42250eefdf5d082de155417d2c7490a59a679b00b0` |
| 6 | `docs/03-design/d040-data-lifecycle-batch-card-spec.md` | `cbf152542e9c5d6020e311dd2e859e89a7aa3881` | `55cd099d3dad3ddd8244a46e1c78d0d4d31f5426af9b53af73b1f9bf3378a567` |
| 7 | `docs/03-design/d040-china-health-reviewer-intake-packet.md` | `89f66cb38da0cd2865a343ac471e1cbe63de92c8` | `7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110` |

冻结清单只证明“复核输入是哪一版”，不证明内容正确、评审人合格或复核通过。当前包自身仍是 `REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED`。

## 3. 复核域与责任

| reviewDomain | 必查内容 | 不得声称 |
| --- | --- | --- |
| `PRODUCT_DECISION_QUALITY` | 每卡单轴、选项互斥且可执行、收益/代价平衡、推荐不制造默认、`Other` 规范化、依赖顺序 | 推荐就是 Owner 答案；预留 ID 已接受 |
| `HEALTH_FORMULA_EVIDENCE` | 19+ 边界、EER/REE 命名、分支拒答、活动缺失、动态模型隐藏、手工/无目标出口 | 个体准确、诊断/治疗、动态模型已获许可或健康批准 |
| `PRIVACY_DATA_INTEGRITY` | 最少数据、四层数据分离、保存/删除组合、raw/display、provenance、stale/pending/supersede、历史不回算 | 卡片选择已经授权持久化、备份、恢复、级联删除或 schema |
| `QA_ACCESSIBILITY` | 稳定 ID、适用/不适用、冲突回退、取消/失败零写入、危险确认、键盘/焦点、VoiceOver、Dynamic Type、320pt | 规格审查就是宿主 UI、真机或实现验收 |

复核人必须记录真实姓名、复核域、胜任依据、是否参与起草、利益冲突、受审不可变引用和签署时间。`participatedInDrafting=true` 或未处置利益冲突时，该域不能计入独立复核。

## 4. 十三卡逐条处置表

每张卡必须给出 `APPROVE_SPEC / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SPEC / OUT_OF_SCOPE`。不能只签批次总评，也不能把 `NOT_APPLICABLE` 当作复核结论。

| 批次 | decisionId | questionId | 当前特殊门禁 | 复核结论 | findingIds |
| --- | --- | --- | --- | --- | --- |
| 1 | `D-054` | `d054_formula_age_scope` | 19+ 与全手工必须互斥 |  |  |
| 1 | `D-055` | `d055_age_source_retention` | 只在 D-054 自动路径适用；三种保留政策完整互斥 |  |  |
| 1 | `D-056` | `d056_formula_age_representation` | 只在 D-054 自动路径适用；不暗定日期/时区/舍入 |  |  |
| 1 | `D-058` | `d058_formula_branch_policy` | 只在所选公式需要分支时适用；不得推断分支 |  |  |
| 2 | `D-057` | `d057_base_energy_path` | EER=维持；REE≠每日目标；手工/无目标始终可用 |  |  |
| 2 | `D-059` | `d059_activity_input_representation` | 数值 PAL 随动态模型保持隐藏；无默认 1.6/步数推断 |  |  |
| 2 | `D-060` | `d060_missing_activity_behavior` | 未知/拒答/越界不默认、不夹取、不产生自动目标 |  |  |
| 2 | `D-061` | `d061_mifflin_ree_use` | 只显示明确命名的 REE 或返回改选 |  |  |
| 2 | `D-062` | `d062_weight_change_goal_path` | 动态模型选项当前 `ownerOptionReady=false` |  |  |
| 3 | `D-064` | `d064_profile_goal_storage` | 公式输入不等于持久化；四层对象不得混写 |  |  |
| 3 | `D-065` | `d065_profile_deletion_semantics` | 不得静默删除独立历史；Files 副本明确不受控 |  |  |
| 3 | `D-066` | `d066_energy_display_rounding` | raw 与 display 分离；禁止链式舍入 |  |  |
| 3 | `D-067` | `d067_recalculation_policy` | 新结果只能 pending；不得改写历史日记/自动覆盖 |  |  |

`APPROVE_WITH_REQUIRED_CHANGE` 在改动落盘并完成 delta 复核前仍是阻断；`OUT_OF_SCOPE` 必须指定需要的复核域，不能被 PM 自行改成通过。

## 5. 跨批不变量检查

独立复核必须至少执行以下组合，不得只逐卡朗读：

1. D-054=`manual_only_all_ages` 时，其余自动公式相关卡全部 `NOT_APPLICABLE`，手工/无目标仍可用。
2. D-058=`disable_branch_dependent_formulas` 时，D-057 不得保留 NASEM/Mifflin；冲突必须回退重选，不静默改答案。
3. D-057=`manual_or_no_goal` 时，D-059/D-060/D-061/D-062 均跳过，不能创建空的自动路径。
4. D-057=Mifflin 且 D-061 不显示时必须返回 D-057；不得生成隐藏 REE、TDEE 或每日目标。
5. `dynamicModelEvidencePassed=false` 时，`validated_dynamic_change_model` 与 `model_native_numeric_pal` 不出现在 Owner 卡；网页 hash、截图和固定 fixture 不得替代许可/oracle/容差/保护线。
6. D-059 不收集活动时 D-060 跳过；活动未知、拒答、越界或冲突不得回退默认值。
7. D-064 的任一保存策略都不能反向扩大 D-055 年龄保留，也不能让 CalculationDraft 自动成为 CurrentProfile/GoalVersion。
8. D-065 删除 CurrentProfile 时，IndependentHistory 不得静默级联；保留 GoalVersion 不得暗示仍可完整复算。
9. D-066 只改变显示值，公式链、审计、比较和持久化继续使用 raw；任何展示改动不得改写既有 GoalVersion。
10. D-067 的重算只产生可拒绝的 pending candidate；取消、失败、未知结果或版本变化保持旧目标有效且历史日记不回算。
11. 任一组合中的 `Other`、冲突或证据缺口都必须暂停受影响轴；不能由 PM、默认排序或实现便利补答案。
12. 所有取消、拒答、失败和不适用路径保持 `profileWrites=0 / goalWrites=0`，除非未来另有已经接受且精确适用的保存决定。

## 6. Finding 与通过标准

| 等级 | 定义 | 对门禁的影响 |
| --- | --- | --- |
| `P0` | 会造成严重健康伤害、不可逆数据损失、越权或伪造决定/证据 | 立即阻断；修复并完整复核 |
| `P1` | 会让 Owner 选择错误语义、开放未验证公式、破坏删除/历史或关键失败关闭 | 阻断；修复并 delta 复核 |
| `P2` | 选项不互斥、依赖/证据/隐私/QA 合同不完整，可能造成实现歧义 | 阻断；修复并 delta 复核 |
| `P3` | 不改变当前安全语义的可读性、维护性或非关键补强 | 可带责任人、期限和理由作为非阻断项 |

批次只在以下条件全部满足时得到 `INDEPENDENT_REVIEW_PASS`：

- 13 张卡均有逐卡结论，且只能是 `APPROVE_SPEC`；
- 四个复核域均由满足独立性条件的具名人员签署，或同一具名人员分别证明每个域的胜任范围；
- 12 条跨批不变量都有证据引用与明确结果；
- 未处置 P0/P1/P2 数量均为 0；每个保留 P3 都有责任人、期限和非阻断理由；
- 动态模型两个受限选项仍保持 `NOT_OWNER_READY`，中国健康签署仍保持独立门禁；
- Owner intake、Owner 卡排期、决定台账和全部实现授权位仍未改变。

通过前三批独立复核不等于 D-040 可以提交 Owner：[D-063/D-070/D-071/D-072 四张宏量轴卡独立复核包](d040-macro-axis-independent-review-packet.md)、D-068/D-069 健康签署和其他未完成轴仍须各自关闭。

## 7. 正式复核记录最小 schema

```text
reviewId
packetId = D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001
packetVersion
reviewerName
reviewDomains[]
competenceEvidenceRefs[]
participatedInDrafting
conflictOfInterest
conflictDisposition
reviewedArtifactRefs[]
cardDispositions[13]
crossBatchInvariantResults[12]
findings[] { findingId, severity, domain, decisionIds[], summary, evidenceRefs[], requiredChange, state }
nonBlockingP3Dispositions[]
overallDisposition
reviewedAt
signatureMethod
supersedesReviewId
```

正式记录必须严格区分 `reviewerName` 与角色/Agent ID。任何 `requiredChange` 修改了 option ID、适用条件、证据语义、保存/删除或失败关闭时，都必须升级 `packetVersion` 并重审所有受影响卡和组合。

## 8. 发起复核的只读消息草案

以下文字只有在项目取得具名联系人和外部联络授权后才能使用；本工件不发送消息。

```text
主题：Nuttie D-040 前三批十三张选择卡独立复核

请基于同一版本的冻结材料，独立审查 D-054~D-067 中已形成规格的 13 张卡。
需要逐卡给出 APPROVE_SPEC / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SPEC / OUT_OF_SCOPE，
并检查包内 12 条跨批不变量。请先声明真实姓名、胜任域、是否参与起草和利益冲突。

本次复核不要求选择产品答案，也不授权 Owner 评审、公式、持久化或实现。
动态模型采用证据和中国健康内容签署仍是独立门禁，不能由本次卡片复核替代。
```

## 9. 当前机器可读边界

```text
reviewPacketReady: true
reviewPacketVersion: PACKET-001-R1
requiredArtifactCount: 7
requiredCardCount: 13
requiredReviewerDomainCount: 4
requiredCrossBatchInvariantCount: 12
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
dynamicModelOptionOwnerReady: false
modelNativeNumericPalOptionOwnerReady: false
healthReviewStillRequired: true
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
formulaImplementationAuthorized: false
persistenceImplementationAuthorized: false
formalImplementationAuthorized: false
next: REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_EXECUTION_REQUIRED
```
