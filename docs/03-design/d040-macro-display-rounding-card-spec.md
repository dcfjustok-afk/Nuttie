# D-040 D-071 宏量展示与舍入选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-MACRO-DISPLAY-ROUNDING-CARD-SPEC-001` |
| 决定 ID | `D-071`（仍只是预留候选 ID） |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-21（Asia/Shanghai） |
| 适用条件 | D-063=`user_defined_macro_target` 时进入选择；参考带分支只执行固定信息展示合同 |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；卡片未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受、换算、展示实现、持久化和正式工程实现均为 `false` |

## 1. 本卡解决什么

本卡只决定用户自定义宏量目标在界面中的单位层级和显示小数位：保留输入单位主显，是否在换算前置完整时显示第二单位，以及显示一位还是两位小数。它同时固定 raw/display 分离、十进制定点舍入和残差披露边界。

本卡不选择目标来源、P/C/F 数值、能量目标、输入形态、健康上下限、转换基准、特殊人群规则或 D-066 的自动能量结果舍入。D-063/D-070 尚未接受，D-068/D-069、健康数值边界、Content QA 和独立复核也未完成，因此任何选项都不是当前产品行为。

## 2. 早期草案消歧

早期输入把“百分比与克数并列 / 仅克数 / 保留小数或显示舍入残差”写在同一层，混合了单位层级和精度，不能形成互斥答案。本卡改为三个完整策略包：

- “仅克数”不再作为独立选项。百分比来源在没有显式能量目标时无法得到克数，强制仅克数会隐藏用户原值或暗中选择能量目标；
- 原始输入单位在所有策略中都必须可见且可追溯；
- 第二单位只在所有显式转换输入和版本齐全时出现，否则明确显示“未换算”，不能补默认值；
- 舍入残差不分配给蛋白质、碳水或脂肪中的任何一项。

## 3. 稳定选择卡

```text
decisionId: D-071
questionId: d071_macro_display_rounding
header: 宏量显示
question: 用户自定义宏量目标应怎样显示单位与小数？
applicableWhen: D-063 = user_defined_macro_target
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| ---: | --- | --- | --- |
| 1 | `source_primary_optional_derived_one_decimal` | 原单位主显，可换算时并列第二单位（1 位小数，推荐） | 始终保留用户输入语义；前置完整时可同时理解比例和克数，一位小数兼顾可读性。信息较多，且独立舍入后三项显示合计可能不是恰好 100%。 |
| 2 | `source_unit_only_one_decimal` | 只显示原输入单位（1 位小数） | 不需要额外换算基准，界面最简，也不会把派生值误作用户输入；无法直接跨单位比较。 |
| 3 | `source_primary_optional_derived_two_decimals` | 原单位主显，可换算时并列第二单位（2 位小数） | 更接近 raw 值并保留较小差异；界面更密集，也更容易让人误读为模型或健康建议具有两位小数精度。 |

推荐项只基于“保留用户原值，同时在证据完整时提供可解释派生值”的产品可理解性，不声称一位小数具有健康学优越性。宿主 `Other` 只收集待规范化意见，不能直接登记接受。

## 4. 共同显示合同

三个选项共同固定：

- `rawMacroValues` 和原始单位定义是权威事实；`displayMacroValues` 是可重建投影，不得反写或替换 GoalVersion 原值；
- 显示舍入采用版本化十进制定点 `ROUND_HALF_UP`，不能使用二进制浮点的隐式格式化结果作为保存值；
- 一位或两位小数只控制显示，不声明公式、食品事实或健康建议具有对应精度；
- 每次换算都从 raw 值和显式版本化转换输入开始，不能从已舍入百分比、克数或 kcal 链式换算；
- 列表、详情、编辑回读、比较和导出预览对同一 GoalVersion 必须使用同一 `macroDisplayPolicyVersion`；机器导出仍保留 raw 和 provenance，不能只导出显示值；
- locale 可以改变小数分隔符和数字排版，但不能改变数值、舍入模式、单位或指纹；VoiceOver 值必须读出 P/C/F 名称、单位、是否约数和未换算/缺失状态；
- 显示相同不代表 raw 相同；比较、幂等、审计、supersede 和 stale 检测不得只依赖显示字符串。

## 5. 第二单位与转换边界

### 5.1 百分比来源

固定 `100%` 三元组只有在另有已确认且适用的 raw 能量目标、`4/4/9` 转换规则版本和单位定义时，才可显示派生克数。缺任一前置时：

```text
derivedGrams = NOT_DERIVED_ENERGY_TARGET_OR_RULE_MISSING
```

D-071 不选择能量目标，也不复用 D-066 舍入后的 kcal。派生克数必须从 raw 能量与 raw 百分比计算，再按所选 D-071 策略独立显示。

### 5.2 克数来源

完整或部分克数始终以克数为来源单位。若没有另行明确的比例分母/能量基准，就不派生百分比；不能把 `P×4+C×4+F×9` 的宏量换算能量自动冒充每日能量目标或比例分母。部分克数永远不能被补齐成完整百分比三元组。

### 5.3 中国健康成人参考带

当 D-063=`china_adult_reference_band_information_only` 时，不显示本卡的三项 Owner 选择，D-071 只执行固定信息合同：

```text
carbohydrate = 50–65% E
fat = 20–30% E
protein = 10–15% E
source = WS/T 578.1-2017
derivedGrams = NOT_APPLICABLE
goalVersion = none
```

范围端点按来源原值展示，不生成中点、默认三元组、派生克数、达标状态、评分、诊断或纠正。

## 6. 残差与近似语义

- 百分比三项 raw 合计仍必须精确满足 D-070 的 `100`；若各项独立显示舍入后合计为 `99.9/100.1` 等，不调整最后一项，不把差额归给脂肪，也不改写 raw；
- 派生克数独立舍入后按 `4/4/9` 回算的显示能量可能与 raw 能量不同。界面应标明“约”，并允许查看由显示舍入产生的差异说明，但差异不是第四个宏量值；
- 实际食品标称能量与实际 P/C/F 回算差异可能来自特异 Atwater 因子、纤维或糖醇规则，不得归类为本卡的舍入残差或数据错误；
- 缺失宏量仍显示“未设置”，不能显示 `0.0 g`、`0%`、剩余量或达标状态；
- 显示 residual/disclosure 只解释投影，不授权自动纠正、评分、颜色告警或目标再平衡。

## 7. 失败关闭与版本

任一显示投影至少绑定：

```text
goalVersionId
sourceInputShape
sourceUnitDefinitionVersion
macroDisplayPolicyVersion
roundingMode
decimalPlaces
conversionRuleVersion (only when derived values exist)
energyGoalVersionId (only when percent-to-gram conversion occurs)
rawFingerprint
```

规则：

- 显示策略缺失、版本未知、转换前置不完整、raw 指纹不匹配或 locale 格式失败时，只回退为来源 raw 的安全文本或“暂无法显示”，`goalWrites=0`；
- 不得因显示失败重算、替换或删除 GoalVersion；不得创建新的目标命令；
- D-071 以后变化只改变新投影或形成待确认候选，不回写旧 raw，不回算历史日记；
- 当前卡只定义候选合同，不授权 schema、formatter、持久化 adapter、UI 或迁移实现。

## 8. 依赖、适用与跳过

| 条件 | 结果 |
| --- | --- |
| D-063=`no_macro_target` | D-071=`NOT_APPLICABLE`；不显示目标百分比、目标克数、残差或达标状态。 |
| D-063=`china_adult_reference_band_information_only` | 不展示本卡选择，只按 §5.3 显示来源范围；不创建 GoalVersion。 |
| D-063=`user_defined_macro_target` 且 D-070 未接受 | 本卡保持内部草案，不进入 Owner intake。 |
| D-070=`fixed_100_percent_triplet` 且能量前置缺失 | 始终显示来源百分比；第二单位明确未换算。 |
| D-070=`partial_macro_grams_explicit_missing` | 只显示已设置项；缺失项不为零，不派生完整比例。 |
| D-068/D-069、健康数值边界或独立复核未关闭 | 卡片保持 `NOT_OWNER_READY / NOT_IMPLEMENTABLE`。 |
| `Other` 提出新精度、单位或残差规则 | 暂停 D-071，不登记接受；由 PM 修订卡或另立决定。 |

`NOT_APPLICABLE` 和固定参考带展示都不是 Owner 对 D-071 的答案，不得伪造选择事件。

## 9. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 三个完整策略包互斥；来源单位、第二单位、1/2 位小数、推荐和 Other 明确 | D-063/D-070 未接受，Owner 排期和独立复核未完成 |
| 健康安全 | `PASS_WITH_GATE` | 显示精度不冒充健康精度；参考带不生成目标；实际能量差异不误判为残差 | 健康数值边界、D-068/D-069、具名健康批准和 Content QA 未完成 |
| Privacy/Data Integrity | `PASS_WITH_GATE` | raw/display 分离、无链式舍入、版本/指纹、失败零写入和历史不回算明确 | D-064/D-065 未接受，正式 schema/formatter/adapter 未授权 |
| QA/Accessibility | `PASS_WITH_GATE` | 稳定 ID、两种精度、缺前置、99.9/100.1、缺失、locale、VoiceOver 和版本漂移可测试 | 独立复核、宿主渲染、Dynamic Type/320pt 和真机证据未完成 |

内部自审不等于独立复核、健康批准、Owner 选择或实现授权。

## 10. 证据边界

- [D-070 自定义宏量输入形态卡](d040-custom-macro-input-shape-card-spec.md)固定来源形态、完整/部分语义、显式能量前置、缺失不为零和失败零写入。
- [D-040 P/C/F 宏量营养证据包](d040-macronutrient-evidence.md)固定 `4/4/9` 换算、实际食品能量差异和未批准的精度/残差问题。
- [D-066 自动能量结果显示舍入](d040-data-lifecycle-batch-card-spec.md)只处理自动能量结果；其 raw/display 和禁止链式舍入不变量可复用，但具体 kcal 粒度不能替代 D-071。
- [宏量目标历史读模型](../04-engineering/testing/macro-target-history-harness.md)只证明既有原值与版本事实可读，当前 `roundingPolicy=UNSPECIFIED`，不授权本卡的换算、舍入或写入。

## 11. 当前机器可读边界

```text
decisionId: D-071
questionId: d071_macro_display_rounding
cardCount: 1
optionCount: 3
recommendedOptionId: source_primary_optional_derived_one_decimal
draftedCardCount: 16
referenceBandInformationOnly: true
referenceBandDerivedGramsAllowed: false
sourceUnitAlwaysPreserved: true
derivedUnitRequiresExplicitConversionInputs: true
displayDecimalRoundingMode: ROUND_HALF_UP
recommendedDecimalPlaces: 1
highPrecisionOptionDecimalPlaces: 2
rawValuesAuthoritative: true
displayValuesPersistedAsGoal: false
conversionsUseDisplayRoundedValues: false
residualAllocatedToMacro: false
displayedPercentTripletForcedTo100: false
roundingDisclosureRequired: true
actualEnergyMismatchTreatedAsRoundingResidual: false
energyRoundingPolicyReused: false
d063Accepted: false
d070Accepted: false
d068D069PrerequisitesPassed: false
numericHealthBoundsApproved: false
healthContentApproved: false
contentQaPassed: false
independentReviewPassed: false
d071OwnerReady: false
cardRegisteredInDecisionLedger: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
macroDisplayImplementationAuthorized: false
persistenceImplementationAuthorized: false
formalImplementationAuthorized: false
next: D063_D070_ACCEPTANCE_HEALTH_AND_D071_INDEPENDENT_REVIEW_REQUIRED
```
