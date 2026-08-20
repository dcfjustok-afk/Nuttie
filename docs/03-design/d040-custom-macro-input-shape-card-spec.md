# D-040 D-070 自定义宏量输入形态选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-CUSTOM-MACRO-INPUT-SHAPE-CARD-SPEC-001` |
| 决定 ID | `D-070`（仍只是预留候选 ID） |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-21（Asia/Shanghai） |
| 适用条件 | 仅当 D-063=`user_defined_macro_target` |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；卡片未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受、宏量换算、持久化和正式工程实现均为 `false` |

## 1. 本卡解决什么

本卡只决定用户自定义 P/C/F 目标时一次提交采用哪一种互斥输入形态：完整百分比三元组、完整克数三元组，或显式部分克数。它不选择目标值、健康上下限、能量目标、参考带、展示精度、舍入、保存层级或特殊人群豁免。

D-063 尚未被 Owner 接受，D-068/D-069、具名健康评审、Content QA 和独立复核也未完成，因此本卡目前只是可复核草案。任何推荐都不是默认业务行为。

## 2. 稳定选择卡

```text
decisionId: D-070
questionId: d070_custom_macro_input_shape
header: 自定义宏量输入
question: 用户自定义蛋白质、碳水和脂肪目标时，应采用哪种输入形态？
applicableWhen: D-063 = user_defined_macro_target
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| ---: | --- | --- | --- |
| 1 | `complete_macro_grams` | 完整克数三元组（推荐） | 用户直接填写 P/C/F 三项克数，不依赖能量目标即可表达；必须明确三项都有值，并避免把 `4/4/9` 回算能量冒充每日能量目标。 |
| 2 | `fixed_100_percent_triplet` | 完整 100% 比例三元组 | 三项百分比必须显式填写并合计 100%，结构清楚；换算克数还需要另有已确认的能量目标，不能从参考带或示例补值。 |
| 3 | `partial_macro_grams_explicit_missing` | 部分克数 | 一次只设置 P/C/F 中明确选择的一项或两项，未设置项保持缺失；灵活但比较、汇总和界面解释成本最高，不能把缺失当 0 或自动补余量。 |

推荐 `complete_macro_grams` 只基于“值由用户直接拥有、无需能量目标即可表达”的产品可解释性，不声称克数优于比例，也不替代健康边界。宿主 `Other` 只能收集待规范化意见。

## 3. 三种输入合同

### 3.1 `complete_macro_grams`

一次提交必须同时包含：

```text
protein_g
carbohydrate_g
fat_g
```

- 三项都必须是用户明确输入的规范十进制；不得用旧目标、参考带、当前摄入或示例填充。
- 在健康数值范围尚未批准前，产品不得假定零值、极端值或最大值可发布；越界策略保持 `HEALTH_NUMERIC_BOUNDS_NOT_APPROVED`。
- `P×4 + C×4 + F×9` 只能形成带来源的宏量换算能量，不得覆盖或自动创建每日能量目标。
- 实际食品标称能量与三项回算不一致不能直接判为数据错误。

### 3.2 `fixed_100_percent_triplet`

一次提交必须同时包含：

```text
protein_percent
carbohydrate_percent
fat_percent
sum = 100
```

- 三项都由用户明确输入，合计必须在规范十进制语义下精确为 `100`；不能选择参考范围端点、中点或按残差自动补第三项。
- 没有已确认且适用的能量目标时，可以保留百分比目标候选，但克数派生状态必须是 `NOT_DERIVED_ENERGY_TARGET_MISSING`。
- 有明确能量目标时，`4/4/9` 只作百分比到克数换算；D-071 仍须决定显示与舍入，D-066 的能量舍入不能进入换算链。
- 参考带内不等于个体正确，参考带外也不能自动评分、诊断或纠正。

### 3.3 `partial_macro_grams_explicit_missing`

- 一次提交必须恰好设置 P/C/F 中一项或两项；三项都有值属于 `complete_macro_grams`，三项都缺失属于 D-063 的无目标状态。
- 每个未设置项保留 `MISSING_NOT_ZERO`，不计算余量、不生成百分比、不自动达到能量目标。
- 比较界面只能比较已设置且单位合同相容的项；不能把未设置项展示为“剩余 0 g”或“已达标”。
- 以后补齐第三项必须创建新的待确认 GoalVersion 候选，并保留旧版本的输入形态与 provenance。

## 4. 共同数据与失败关闭边界

任一输入形态都必须保存或产生以下版本事实候选，但具体持久化仍等待 D-064/D-065 的接受：

```text
inputShape
explicitMacroValues
explicitMissingMacroIds
unitDefinitionVersion
conversionRuleVersion (only when conversion occurs)
source = USER_DEFINED
userEdited
createdAt / effectiveAt
supersedesGoalVersionId
```

共同规则：

- 一次命令不能混用百分比和克数，也不能同时声明完整与部分形态。
- 草稿预览不等于 GoalVersion；只有用户复核、显式确认且仓储命令成功后才可能生效。
- 取消、拒答、解析失败、合计不符、健康边界未批准、保存前失败或提交结果未知时，不创建第二个命令，旧目标继续有效。
- 未知提交只允许用同一不可变命令对账；不能重新计算数值、换 option 或占用新幂等键。
- D-067 的资料/规则变化只能生成可拒绝候选，不自动覆盖目标或回算历史日记。
- 删除、备份、恢复、Files 副本和 IndependentHistory 仍由已接受的数据生命周期决定控制，本卡不扩大范围。

## 5. 依赖、适用与跳过

| 条件 | 结果 |
| --- | --- |
| D-063 不是 `user_defined_macro_target` | D-070=`NOT_APPLICABLE`，不能展示本卡或制造默认形态。 |
| D-063 尚未接受 | 本卡保持内部草案，不得排入 Owner intake。 |
| D-070 选择任一形态 | 进入 D-071 决定该形态的显示、精度、舍入和残差语义。 |
| D-068/D-069 或健康数值边界未关闭 | 卡片与数值输入保持 `NOT_OWNER_READY / NOT_IMPLEMENTABLE`。 |
| 输入形态冲突或 `Other` 提出新合同 | 暂停 D-070，不登记接受；由 PM 修订卡或另立决定。 |
| 用户取消、输入无效或确认失败 | `goalWrites=0`，旧目标和历史不变。 |

适用性变化不得删除历史决定事件。`NOT_APPLICABLE` 不是 Owner 答案，也不能被实现层改写成推荐项。

## 6. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 单轴、三形态互斥、完整/部分边界、推荐理由、Other 与 D-071 依赖明确 | D-063 未接受，Owner 排期和独立复核未完成 |
| 健康安全 | `PASS_WITH_GATE` | 不选择目标值；参考带不补值；换算不冒充能量目标；实际能量差异不判错 | 数值健康边界、D-068/D-069、具名健康批准和 Content QA 未完成 |
| Privacy/Data Integrity | `PASS_WITH_GATE` | 用户来源、显式缺失、禁止混形、候选/版本、失败零写入、未知提交与历史不回算明确 | D-064/D-065 未接受，正式 schema/adapter 未授权 |
| QA/Accessibility | `PASS_WITH_GATE` | 稳定 ID、1/2/3 项分区、合计、缺能量、冲突、取消和对账可测试 | D-071、独立复核、宿主渲染和真机证据未完成 |

内部自审不等于独立复核、健康批准、Owner 选择或实现授权。

## 7. 证据边界

- [D-040 P/C/F 宏量营养证据包](d040-macronutrient-evidence.md)规定参考范围不产生默认三元组、`4/4/9` 只作换算，以及实际食品能量可能与 P/C/F 回算不同。
- [D-063 宏量目标来源卡](d040-macro-target-source-card-spec.md)规定本卡只在 `user_defined_macro_target` 下适用，并把 D-070/D-071/D-072 分开。
- [资料与目标生命周期卡](d040-data-lifecycle-batch-card-spec.md)规定 CalculationDraft/GoalVersion/IndependentHistory 分层、保存/删除和历史不回算候选边界。
- [宏量目标历史读模型](../04-engineering/testing/macro-target-history-harness.md)只证明既有版本事实的只读历史语义，不授权本卡的输入、换算、比较、舍入或写入。

## 8. 当前机器可读边界

```text
decisionId: D-070
questionId: d070_custom_macro_input_shape
cardCount: 1
optionCount: 3
recommendedOptionId: complete_macro_grams
draftedCardCount: 15
inputShapesMutuallyExclusive: true
percentAllThreeRequired: true
percentSumRequired: 100
completeGramsAllThreeRequired: true
partialGramsSetCountRange: [1, 2]
missingMacroTreatedAsZero: false
residualAutoFilled: false
mixedInputShapesAllowed: false
percentToGramConversionRequiresExplicitEnergyTarget: true
conversionSelectsEnergyOrMacroTarget: false
actualEnergyMismatchIsDataError: false
numericHealthBoundsApproved: false
d063Accepted: false
d068D069PrerequisitesPassed: false
healthContentApproved: false
contentQaPassed: false
independentReviewPassed: false
d070OwnerReady: false
cardRegisteredInDecisionLedger: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
macroConversionImplementationAuthorized: false
persistenceImplementationAuthorized: false
formalImplementationAuthorized: false
next: D063_ACCEPTANCE_HEALTH_AND_D070_INDEPENDENT_REVIEW_REQUIRED
```
