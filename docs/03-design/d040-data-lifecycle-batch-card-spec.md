# D-040 第三小批资料与目标生命周期选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-DATA-LIFECYCLE-BATCH-CARD-SPEC-001` |
| 范围 | D-064、D-065、D-066、D-067 |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-20（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；四张卡均未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受、持久化实现和正式工程均为 `false` |

## 1. 本批次解决什么

本工件只比较“确认目标后保存什么”“删除资料时清什么”“自动能量结果怎样显示舍入”“资料或公式变化后怎样重算”。它不批准任何资料字段、公式、目标值、数据库或 UI。

固定分层：

```text
CalculationDraft
  本次本地计算的易失输入；取消、失败或转手工时零写入

CurrentProfile
  仅保存未来 Owner 明确批准复用的当前资料

GoalVersion
  用户确认后才保存的目标输出、来源、版本和生效事实

IndependentHistory
  DiaryEntry / NutritionSnapshot / BodyRecord；不由资料删除静默级联
```

所有方案共同遵守：

- 公式需要输入不等于必须持久化输入；保存范围由 D-064 单独决定。
- 删除 CurrentProfile、GoalVersion 输入副本、GoalVersion 本身和独立历史是不同范围；D-065 不得模糊合并。
- 自动结果的精确 `rawResult` 与显示值分开；D-066 只决定显示粒度，不得链式舍入或重写历史 raw。
- 资料/规则变化最多生成 stale 状态或待确认候选；D-067 的任何方案都不能自动生效、回算历史或覆盖用户手工目标。
- 用户取消、拒答、保存失败或确认前退出时，`profileWrites=0`、`goalWrites=0`，原资料、目标和独立历史不变。
- App 无法删除用户已导出到 Files 或其他 App 的副本；删除界面必须明确本地受控范围。

## 2. 宿主原生卡与依赖顺序

未来如获准评审，按以下顺序展示：

```text
D-064 保存范围
  -> D-065 删除语义（必须展示与 D-064 组合后的实际结果）
  -> D-066 显示舍入（仅自动能量路径存在时）
  -> D-067 重算（仅存在可复用资料或版本化公式时）
```

每张卡使用稳定 `questionId` 和 `optionId`。宿主自动提供的 `Other` 只收集待规范化意见；任何无法落入现有删除范围、保存层或重算状态机的意见都暂停该轴，不能直接登记为 accepted。

## 3. D-064 资料与目标保存

```text
decisionId: D-064
questionId: d064_profile_goal_storage
header: 资料与目标保存
question: 用户确认自动目标后，应保存哪些资料与来源？
applicableWhen: 已选择可生成自动目标候选的路径
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `goal_output_with_provenance_only` | 只存输出与来源（推荐） | GoalVersion 保存目标值、算法/规则版本、生效日和必要 provenance，不保存年龄、分支、身高、体重、活动输入副本；数据最少，但无法逐值复算历史目标。 |
| 2 | `complete_reproducible_input_snapshot` | 保存完整复算快照 | 每个 GoalVersion 保存全部原始输入、单位定义、算法、系数、舍入和输出，可精确复算；长期复制健康资料最多，删除和备份成本最高。 |
| 3 | `current_profile_plus_goal_output` | 当前资料加目标输出 | CurrentProfile 保存可复用输入，GoalVersion 只存输出与 provenance；减少历史副本，但资料变化或删除后旧目标不能复算，且不得用新资料改写旧版本。 |

三项是互斥的保存政策。最低 GoalVersion provenance 候选包括 `algorithmFamily/version`、`sourceYear`、`coefficientSetHash`、`unitSchemaVersion`、`activityMappingVersion`、`rawResult`、`roundingPolicyVersion`、`displayedResult`、`generatedAt`、`effectiveFrom` 和 `supersedesGoalId`。这些字段仍须工程 schema 评审，本卡不授权实现。

选择完整快照时，必须把输入副本列入导出、备份、恢复、删除和隐私说明；选择输出与来源时，产品必须明确“可追踪来源但不可逐值复算”，不能伪造复算能力。

## 4. D-065 删除资料语义

```text
decisionId: D-065
questionId: d065_profile_deletion_semantics
header: 删除资料
question: 用户删除当前资料时，目标版本中的资料应怎样处理？
applicableWhen: CurrentProfile 或 GoalVersion 已保存
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `clear_profile_and_goal_input_copies` | 清除资料及目标输入副本（推荐） | 删除 CurrentProfile，并清除 GoalVersion 中的年龄、分支、身高、体重和活动副本；保留目标输出/来源/日期并标记 `inputsRemoved`。兼顾历史展示与数据最小化，但旧目标不可复算。 |
| 2 | `profile_only_keep_goal_snapshots` | 只删当前资料 | 删除 CurrentProfile，历史 GoalVersion 原样保留；历史解释/复算最完整，但若 D-064 选择完整快照，敏感输入副本仍长期存在，必须在确认页逐项说明。 |
| 3 | `cascade_profile_and_goal_versions` | 同时删除目标版本 | 删除 CurrentProfile 与全部 GoalVersion；数据清理最彻底，但历史页面必须显示“目标已删除”，不能用新资料回算。Diary/BodyRecord/NutritionSnapshot 仍独立保留。 |

组合约束：

- D-064=`goal_output_with_provenance_only` 时，方案 1 与 2 对 GoalVersion 输入副本没有差异；宿主必须说明并可把无意义选项记为 `NOT_APPLICABLE`，不能制造虚假区别。
- D-064=`complete_reproducible_input_snapshot` 时，三项差异必须逐项展示，不能只问“删除资料吗”。
- D-064=`current_profile_plus_goal_output` 时，方案 1 等价于删除 CurrentProfile 并保留输出；仍须保留 `inputsRemoved/profileDeletedAt` 事实。
- 本卡不删除独立日记、体重或营养历史，也不代替 D-043“删除全部本地数据”；外部 Files 副本不受 App 控制。

## 5. D-066 自动能量显示舍入

```text
decisionId: D-066
questionId: d066_energy_display_rounding
header: 能量显示舍入
question: 自动能量结果在界面上应显示到什么粒度？
applicableWhen: D-057/D-062 最终允许自动能量候选
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `nearest_10_kcal_half_up` | 最接近 10 kcal（推荐） | 比整数更少制造虚假精度，又比 50 kcal 保留更多差异；必须明确这是显示规则，不是模型准确度。 |
| 2 | `whole_kcal_half_up` | 整数 kcal | 与方程输出最接近、差异比较更细；界面可能暗示公式具有并不存在的个位精度。 |
| 3 | `nearest_50_kcal_half_up` | 最接近 50 kcal | 最能弱化伪精度、读数简单；小幅变化可能在显示上消失，比较与手工调整更粗。 |

所有选项只对非负 kcal 显示使用十进制定点 `round half up`；`rawResult` 保留完整计算精度。kJ 必须从同一个 raw 能量事实换算后独立按批准的 kJ 显示规则处理，不能从已舍入 kcal 再换算。列表、详情、差异卡和导出对同一 GoalVersion 必须使用同一 `roundingPolicyVersion`。

D-066 不批准最低能量、最大变化、热量缺口或模型容差。舍入后的相同显示值不代表 raw 相同，幂等指纹与审计比较不得只依赖显示值。

## 6. D-067 资料或公式变化后的重算

```text
decisionId: D-067
questionId: d067_recalculation_policy
header: 目标重算
question: 资料或公式版本变化后，应怎样处理现有自动目标？
applicableWhen: 已存在自动 GoalVersion 且计算依赖发生变化
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `user_initiated_difference_candidate` | 用户发起差异候选（推荐） | 标记变化原因，只有用户点击“查看新估算”后才计算 before/after 候选；控制最清楚、后台计算最少，但用户可能长期沿用旧目标。 |
| 2 | `mark_stale_without_candidate` | 只标记已过期 | 显示资料/规则已变化，不自动生成新值；最保守，但更新路径最不便，需用户重新走完整设置。 |
| 3 | `automatic_pending_candidate` | 自动生成待确认候选 | 变化时本地计算新的 pending 候选并提示比较；发现变化最快，但需更多后台状态、去重、资源和敏感输入使用审计。候选仍不得自动生效。 |

三项共同固定：

- 变化检测绑定 `profileRevision + algorithmVersion + coefficientSetHash + activityMappingVersion + roundingPolicyVersion`，不能只比较显示值。
- 旧 GoalVersion 继续按原 `effectiveFrom` 服务历史展示；新候选不会回算日记、Left、宏量或过去趋势。
- 用户手工编辑的目标优先，规则升级不得静默覆盖；需要另一次显式确认才能创建 superseding GoalVersion。
- 自动候选必须可取消、去重和恢复，取消/失败不创建 GoalVersion；跨进程未知结果只能按同一不可变命令对账。
- CurrentProfile 已删除或必要输入不可用时，只能标记 stale 并引导重新输入，不能从独立历史静默拼回资料。

## 7. 组合矩阵

| D-064 | D-065 可执行结果 | D-067 输入可用性 |
| --- | --- | --- |
| 输出 + provenance | 删除资料不再触及历史输入副本；可保留或删除 GoalVersion | 没有原始输入时不能自动复算，只能重新收集或 stale |
| 完整复算快照 | 可保留、清除输入副本或删除 GoalVersion | 只有输入副本仍在且用户许可使用时才可能重算候选 |
| 当前资料 + 输出 | 删除 CurrentProfile 后保留不可复算的 GoalVersion | 资料存在且 revision 有效时可算候选；删除后只能 stale/重新输入 |

任何组合都不允许用“可复算”推导为“可自动生效”，也不允许用“删除资料”推导为“删除全部本地数据”。

## 8. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 保存、删除、舍入、重算四轴互斥；收益/代价和组合差异明确 | 前两批依赖、后续特殊人群/宏量卡、独立复核和 Owner 排期未完成 |
| Privacy / Security | `PASS_WITH_GATE` | 最少保存候选、删除范围、备份/Files 边界、输入副本和零写入明确 | 正式容器、导出/恢复/删除实现与隐私文案未授权 |
| Data integrity | `PASS_WITH_GATE` | raw/display 分离、版本 provenance、stale/pending/supersede、历史不回算固定 | schema、事务、时间源、迁移和跨进程 corpus 未完成 |
| QA / Accessibility | `PASS_WITH_GATE` | 组合矩阵、无差异选项、舍入边界、删除回执、取消/未知结果可测试 | 宿主卡、危险操作确认、VoiceOver/Dynamic Type 和真机证据未完成 |

这是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不是独立复核。D-064~D-067 仍只是预留 ID，未进入决定台账或 Owner intake。

## 9. 来源与边界

- [Apple App Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/)要求隐私政策说明收集、用途、保留/删除与撤回，并强调只请求核心功能所需数据。
- 仓库 [D-040 PX-0 输入研究](d040-px0-input-research.md)定义 `CalculationDraft / CurrentProfile / GoalVersion / IndependentHistory`、R1/R2/R3、D1/D2/D3 和历史不回算边界。
- [本地数据访问注册表合同](../04-engineering/testing/local-data-access-registry-harness.md)和 [F18 本地清除协调合同](../04-engineering/testing/local-wipe-coordinator-harness.md)只提供失败关闭的框架无关端口；它们不证明 SQLCipher、Files 副本删除或正式实现已完成。

这些来源约束数据诚实和删除范围，不替 Owner 选择保存量、删除语义、舍入粒度或重算体验。

## 10. 当前门禁

```text
D-040 decisionState: CANDIDATE
authoritativeState: PX-0_INPUT_GAP
firstBatchCardCount: 4
energyBatchCardCount: 5
dataLifecycleBatchCardCount: 4
draftedCardCount: 13
dataLifecycleBatchSelfReviewPassed: true
next: FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_REQUIRED
reservedDecisionIdsRegistered: 0
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
persistenceImplementationAuthorized: false
formalImplementationAuthorized: false
```
