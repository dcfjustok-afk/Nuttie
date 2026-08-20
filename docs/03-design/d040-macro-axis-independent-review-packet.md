# D-040 四张宏量轴卡独立复核包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001` |
| 状态 | `PACKET_READY / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED` |
| 复核范围 | D-063、D-070、D-071、D-072 四张已形成内部规格的宏量轴卡 |
| 当前权威状态 | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| 非目标 | 选择 Owner 答案、批准健康内容、把预留 ID 写入决定台账、授权目标/记录/持久化/实现或发布 |
| 当前下一门禁 | `MACRO_AXIS_INPUT_FREEZE_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED` |

## 1. 用途与独立性

本包把四张宏量轴卡整理成可交给未参与起草的真实复核人的统一入口。当前只完成材料准备，不记录任何复核通过：

- Product、健康/公式、Privacy/Data Integrity、QA/Accessibility 四个复核域都尚未指派具名人员；
- PM、卡片作者、Codex/AI、Agent ID 或只有角色名称都不能被当作独立复核人；
- 同一具名人员可以覆盖多个域，但必须分别证明对应胜任范围、披露利益冲突并逐域签署；
- 健康/公式域的卡片复核不能代替 `ChinaQualifiedHealthReviewer` 对人群边界、健康数值、简中文案和支持资源的正式健康签署；
- 独立复核通过也只让四张卡具备下一步资格，不接受 D-063/D-070，不自动排入 Owner intake，不改变任何授权位。

## 2. 必读输入

正式复核必须基于同一 `packetVersion` 的完整输入。交接时为每项记录 Git commit 与 blob OID 或规范 SHA-256；任一语义变化都会使受影响结论失效。

| 顺序 | 工件 | 作用 |
| ---: | --- | --- |
| 1 | [问题分解与全局 ID 预留](d040-question-allocation.md) | 四个宏量轴、依赖顺序和未授权状态 |
| 2 | [P/C/F 宏量证据](d040-macronutrient-evidence.md) | 目标来源、输入、显示和硬停止研究边界 |
| 3 | [中国宏量标准输入](d040-china-macronutrient-standard-input.md) | WS/T 578.1-2017 现行证据与信息用途限制 |
| 4 | [D-063 宏量目标来源卡](d040-macro-target-source-card-spec.md) | 无目标、参考带信息、用户自定义三项来源 |
| 5 | [D-070 自定义宏量输入形态卡](d040-custom-macro-input-shape-card-spec.md) | 完整克数、完整比例、显式部分克数三项输入 |
| 6 | [D-071 宏量展示与舍入卡](d040-macro-display-rounding-card-spec.md) | 来源/派生单位、raw/display、十进制舍入与残差 |
| 7 | [D-072 硬停止后纯记录可用性卡](d040-hard-stop-record-availability-card-spec.md) | 硬停止后允许无目标事实或暂停新增 |
| 8 | [资料与目标生命周期卡](d040-data-lifecycle-batch-card-spec.md) | 四层数据、保存/删除、raw/display 与历史不回算 |
| 9 | [中国支持文案与健康评审治理输入](d040-china-support-health-review-input.md) | 人群停止、12356/120、文案和复核周期 |
| 10 | [中国健康评审人交接包](d040-china-health-reviewer-intake-packet.md) | 证明健康签署是另一门禁，当前仍未开始 |

本次原子任务只建立复核包结构。下一原子任务必须把这 10 份输入冻结到同一 Git commit 并记录 blob OID 与规范 SHA-256；冻结清单形成前不得发起可计入门禁的正式复核。

## 3. 复核域与责任

| reviewDomain | 必查内容 | 不得声称 |
| --- | --- | --- |
| `PRODUCT_DECISION_QUALITY` | 四卡各自单轴、选项互斥可执行、适用条件、收益/代价、推荐与 `Other`、依赖顺序 | 推荐就是 Owner 答案；预留 ID 已接受；无目标就是硬停止 |
| `HEALTH_FORMULA_EVIDENCE` | 参考带只作信息、4/4/9、无默认/处方/评分、健康停止不可豁免、UNKNOWN 失败关闭 | 个体准确、诊断/治疗、参考带已获产品批准或复核替代健康签署 |
| `PRIVACY_DATA_INTEGRITY` | 来源单位、版本/provenance、raw/display、GoalVersion、历史不回算、删除与数据访问 | 卡片选择已经授权 schema、持久化、级联删除、备份、恢复或历史改写 |
| `QA_ACCESSIBILITY` | 稳定 ID、条件适用/不适用、冲突、缺失、舍入/残差、硬停止进出、返回、失败零写入、VoiceOver/Dynamic Type/320pt | 规格审查就是宿主 UI、真机、健康文案或实现验收 |

复核人必须记录真实姓名、复核域、胜任依据、是否参与起草、利益冲突、受审不可变引用和签署时间。`participatedInDrafting=true` 或未处置利益冲突时，该域不能计入独立复核。

## 4. 四卡逐条处置表

每张卡必须给出 `APPROVE_SPEC / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SPEC / OUT_OF_SCOPE`。不能只签总评，也不能把 `NOT_APPLICABLE` 当作复核结论。

| decisionId | questionId | 当前特殊门禁 | 复核结论 | findingIds |
| --- | --- | --- | --- | --- |
| `D-063` | `d063_macro_target_source` | 参考带只作信息；不得生成默认三元组、GoalVersion、评分或纠正 |  |  |
| `D-070` | `d070_custom_macro_input_shape` | 只在用户自定义来源适用；三种形态互斥，缺失不补零/残差 |  |  |
| `D-071` | `d071_macro_display_rounding` | 来源单位保留；派生显式；display 不反写 raw、不链式换算 |  |  |
| `D-072` | `d072_hard_stop_record_availability` | 只在硬/条件停止适用；不得解除停止、生成目标/评分或锁住数据控制 |  |  |

`APPROVE_WITH_REQUIRED_CHANGE` 在改动落盘并完成 delta 复核前仍是阻断；`OUT_OF_SCOPE` 必须指定需要的复核域，不能被 PM 自行改成通过。

## 5. 跨轴不变量检查

独立复核必须至少执行以下组合，不得只逐卡朗读：

1. D-063=`no_macro_target` 时，D-070/D-071 都为 `NOT_APPLICABLE`；没有健康停止时不得仅因“无目标”触发 D-072。
2. D-063=`china_adult_reference_band_information_only` 时，D-070 不适用，D-071 只能显示带版本的范围信息；不得派生克数、创建 GoalVersion、评分或纠正。
3. D-063=`user_defined_macro_target` 时，必须先关闭 D-070 输入形态；没有完整且已批准的转换输入时，D-071 不得制造派生单位。
4. D-070 的完整克数、完整 100% 三元组和显式部分克数互斥；不得混合形态或静默转换保存形态。
5. D-070 的显式部分克数必须保持 1~2 项已设置与其余项缺失；缺失不补零、不补残差、不从历史/参考带推断。
6. D-070 的百分比必须三项齐全且和为 100；百分比转克数需要另一个已接受且适用的能量目标，换算本身不得选择目标。
7. D-071 始终保留来源单位；派生单位只有在显式输入、版本和前置决定齐全时可选，且必须标明派生。
8. D-071 的显示舍入不得反写 raw、GoalVersion、比较或审计，不得使用显示值继续换算；显示策略变化不得改写历史。
9. D-071 的舍入残差必须披露，不得强制三项显示和为 100、自动分配到某一宏量或把能量不一致冒充舍入误差。
10. D-066 能量显示舍入与 D-071 宏量显示舍入保持两个决定轴；任一方都不能静默复用另一方策略。
11. D-072 只在已批准规则产生有效硬停止或条件停止时适用；条件未知或 observation 陈旧时自动目标关闭，但不得猜测记录策略。
12. D-072 的任一答案都不能豁免停止、显示公式/目标/剩余/评分、改变健康分类或让 App 推断诊断。
13. D-072 暂停新增时，已有事实仍可查看、纠错、删除和访问；两项答案都不得删除/回算历史，状态变化只影响未来命令。
14. 任一轴中的 `Other`、冲突、缺失证据、失败或取消都暂停受影响路径；Owner intake、决定台账、健康文案、目标/记录/持久化和正式实现授权保持不变。

## 6. Finding 与通过标准

| 等级 | 定义 | 对门禁的影响 |
| --- | --- | --- |
| `P0` | 会造成严重健康伤害、不可逆数据损失、越权或伪造决定/证据 | 立即阻断；修复并完整复核 |
| `P1` | 会让 Owner 选择错误语义、解除硬停止、制造目标/评分、破坏删除/历史或关键失败关闭 | 阻断；修复并 delta 复核 |
| `P2` | 选项不互斥、依赖/证据/隐私/QA 合同不完整，可能造成实现歧义 | 阻断；修复并 delta 复核 |
| `P3` | 不改变当前安全语义的可读性、维护性或非关键补强 | 可带责任人、期限和理由作为非阻断项 |

四卡只在以下条件全部满足时得到 `MACRO_AXIS_INDEPENDENT_REVIEW_PASS`：

- 4 张卡均有逐卡结论，且只能是 `APPROVE_SPEC`；
- 四个复核域均由满足独立性条件的具名人员签署，或同一具名人员分别证明每个域的胜任范围；
- 14 条跨轴不变量都有证据引用与明确结果；
- 未处置 P0/P1/P2 数量均为 0；每个保留 P3 都有责任人、期限和非阻断理由；
- 中国健康评审仍保持独立门禁，健康数值、适用人群、简中文案和 Content QA 不因本复核自动通过；
- D-063/D-070 仍未接受，四卡仍未进入决定台账或 Owner intake，全部实现授权位仍为 `false`。

通过四卡独立复核不等于 D-040 可以提交 Owner：还必须完成具名健康签署、D-068/D-069、健康数值边界、Content QA、D-063/D-070 的前序决定和所有适用 PX 门禁。

## 7. 正式复核记录最小 schema

```text
reviewId
packetId = D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001
packetVersion
reviewerName
reviewDomains[]
competenceEvidenceRefs[]
participatedInDrafting
conflictOfInterest
conflictDisposition
reviewedArtifactRefs[]
cardDispositions[4]
crossAxisInvariantResults[14]
findings[] { findingId, severity, domain, decisionIds[], summary, evidenceRefs[], requiredChange, state }
nonBlockingP3Dispositions[]
overallDisposition
reviewedAt
signatureMethod
supersedesReviewId
```

正式记录必须严格区分 `reviewerName` 与角色/Agent ID。任何 `requiredChange` 修改 option ID、适用条件、证据语义、来源/换算/显示、硬停止、历史或数据控制时，都必须升级 `packetVersion` 并重审所有受影响卡和组合。

## 8. 发起复核的只读消息草案

以下文字只有在项目取得具名联系人和外部联络授权后才能使用；本工件不发送消息。

```text
主题：Nuttie D-040 四张宏量轴选择卡独立复核

请基于同一版本的冻结材料，独立审查 D-063、D-070、D-071、D-072 四张卡。
需要逐卡给出 APPROVE_SPEC / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SPEC / OUT_OF_SCOPE，
并检查包内 14 条跨轴不变量。请先声明真实姓名、胜任域、是否参与起草和利益冲突。

本次复核不要求选择产品答案，也不批准健康内容，不授权 Owner 评审、目标、记录、
持久化或实现。中国健康评审、D-068/D-069、健康数值边界和 Content QA 仍是独立门禁。
```

## 9. 当前机器可读边界

```text
reviewPacketReady: true
reviewPacketVersion: PACKET-001-R1
inputManifestFrozen: false
requiredArtifactCount: 10
requiredCardCount: 4
cardDecisionCount: 4
requiredReviewerDomainCount: 4
requiredCrossAxisInvariantCount: 14
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
externalMessageSent: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
goalImplementationAuthorized: false
recordingImplementationAuthorized: false
persistenceImplementationAuthorized: false
formalImplementationAuthorized: false
next: INPUT_FREEZE_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED
```
