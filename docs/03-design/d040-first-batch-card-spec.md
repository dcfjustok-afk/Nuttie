# D-040 第一小批选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-FIRST-BATCH-CARD-SPEC-001` |
| 范围 | D-054、D-055、D-056、D-058 |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-15（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；四张卡均未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受和正式实现均为 `false` |

## 1. 本批次解决什么

本工件把第一批四个决定轴写成可以审查和自动校验的选择卡规格，但不替 Owner 作答，也不把研究建议解释为产品决定。每张卡只改变一个行为轴，选项必须互斥、可执行，并说明直接收益和代价。

当前证据只证明：

- 2023 NASEM 成人 EER 方程从 19 岁开始，使用年龄、身高、体重以及四类身体活动水平，并按已发表的两个公式分支计算；3 至 18.99 岁使用另一组儿童与青少年方程。
- Mifflin 原始研究纳入 19 至 78 岁健康受试者，输出是静息能量消耗 `REE`，同样使用两个已发表分支；它不是每日维持目标。
- 身体活动水平存在分类与测量不确定性；临床状况和用药需要额外考量，不能由 App 自行诊断或静默修正公式。
- 健康资料应只收集功能所需的最少信息；这支持把“每次输入但不长期保存”作为低数据保留候选，不代表 Owner 已接受该候选。

因此，旧草案中的“为 18 岁提供另一个经验证模型”不是当前可执行选项：仓库没有定义、验证或批准这样的模型。未来若取得适用证据和治理批准，应以新的决定变更现有边界，不能用占位选项假装能力已存在。

## 2. 宿主原生渲染合同

四张卡未来如获准进入 Owner 评审，必须使用宿主原生选择工具，并满足：

1. 每张卡使用稳定 `questionId`，提供 2 至 3 个互斥选项；稳定 `optionId` 不因文案微调改变。
2. 只有确有低风险理由时才把候选排在第一位，并在实际渲染标签末尾添加“（推荐）”；推荐只表达当前风险/复杂度判断，不是已经接受的默认值。
3. 宿主自动提供的自由输入 `Other` 只收集待规范化意见。PM 必须先判断它是现有选项、需要新选项还是需要新决定，不得把原文直接登记为已接受政策。
4. 未满足适用条件的卡记录 `NOT_APPLICABLE`，不得强迫 Owner 为无意义路径作答。
5. 当前文案只是内部规格。`project-ops/owner-intake.json` 中计划中的 D-040 占位卡不因此变成可展示卡。

## 3. D-054 自动公式年龄范围

```text
decisionId: D-054
questionId: d054_formula_age_scope
header: 自动公式年龄
question: 首版自动能量估算应覆盖哪个年龄范围？
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `adult_19_plus` | 19 岁及以上（推荐） | 与当前已审查的成人 NASEM EER 边界及 Mifflin 研究年龄范围一致；18 岁及以下不生成自动结果，只能手工设置或不设目标。 |
| 2 | `manual_only_all_ages` | 停用自动估算 | 所有年龄都只走手工设置或无目标，公式风险最低；便利性和自动解释能力也最低。 |

精确语义：`19 岁及以上` 表示计算当日 `ageYears >= 19`，不是“超过 19 岁”。本卡只决定自动公式年龄范围，不决定年龄如何取得、保存或表示。

## 4. D-055 年龄来源与保留

```text
decisionId: D-055
questionId: d055_age_source_retention
header: 年龄来源
question: 自动估算需要年龄时，应怎样取得和保留？
applicableWhen: D-054 = adult_19_plus
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `ephemeral_age_per_calculation` | 每次输入年龄（推荐） | 每次计算时询问，不持久保存年龄或出生日期，数据最少；不能自动沿用、按生日更新或在缺少原输入时复算。 |
| 2 | `stored_age_with_recorded_date` | 保存年龄与日期 | 保存当时的年龄值和 `recordedAt`，可以解释历史计算；该值会过期，重新计算前必须提示确认或更新。 |
| 3 | `stored_date_of_birth` | 保存出生日期 | 可按版本化日期/时区规则推导年龄并支持生日后的重算候选；识别性和保留成本最高，必须进入删除、备份与恢复范围。 |

三项是完整且互斥的持久化政策。选择第三项不授权自动覆盖既有目标；任何重新计算仍须遵守 D-067 的候选/过期策略和用户确认。

## 5. D-056 公式年龄表示

```text
decisionId: D-056
questionId: d056_formula_age_representation
header: 年龄表示
question: 向自动公式传入年龄时，应使用哪种表示？
applicableWhen: D-054 = adult_19_plus
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `completed_years_integer` | 完整年数（推荐） | 使用上一个生日以来的完整年数，输入和解释最简单；生日当天会出现阶跃变化。 |
| 2 | `decimal_year_one_place` | 一位小数年 | 年龄变化更连续；必须固定日期、时区、舍入和版本规则，而当前来源没有指定这一精度。 |

D-055 选择即时年龄时，由用户按本卡表示输入；选择出生日期时，由版本化规则派生。两张卡不得相互推断默认答案。

## 6. D-058 公式分支与拒答

```text
decisionId: D-058
questionId: d058_formula_branch_policy
header: 公式分支
question: 所选公式需要已发表的两个分支时，产品应怎样处理？
applicableWhen: D-057 选择需要分支的自动公式
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `explicit_branch_with_skip` | 询问并可跳过（推荐） | 明示“已发表公式有两个计算分支”，让使用者选择或跳过；不得从姓名、身份、照片或其他资料推断。跳过时不生成依赖该分支的自动结果。 |
| 2 | `disable_branch_dependent_formulas` | 停用分支公式 | 不收集分支，D-057 必须排除所有依赖该输入的公式；继续保留手工设置或无目标。 |

本卡决定产品如何处理公式分支，不是让 Owner 代替最终使用者选择某一分支。面向最终使用者的准确称谓与解释文案仍需健康安全和内容复核。

## 7. 依赖、跳过与失败关闭

| 条件 | 结果 |
| --- | --- |
| D-054 = `manual_only_all_ages` | D-055、D-056 记录 `NOT_APPLICABLE`；所有自动公式相关卡跳过。 |
| D-057 最终选择手工设置或无目标 | D-058 记录 `NOT_APPLICABLE`。 |
| D-058 = `disable_branch_dependent_formulas` | D-057 不得保留需要两个分支输入的 NASEM/Mifflin 选项；若此前选择冲突，先回到 D-057 重新选择，不静默改答案。 |
| 任何必需输入拒答或缺失 | 不推断、不填默认值、不生成自动结果；提供手工设置或无目标出口。 |
| `Other` 提出未覆盖的年龄、保留或分支政策 | 暂停该轴，不登记接受；由 PM 规范化为已有选项、修订卡或新决定。 |

`NOT_APPLICABLE` 是有条件跳过，不是选择结果，也不计为 Owner 接受。依赖变化后必须重新计算适用性，但不得自动删除历史决定事件。

## 8. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS` | 每卡单轴；2 至 3 个选项；收益与代价可比较；没有不可执行的 18 岁占位模型 | 全部后续决定轴完成前，D-040 最终结构不可提交 |
| 健康安全 | `PASS_WITH_GATE` | 成人年龄边界、EER/REE 区分、分支拒答、手工/无目标失败关闭 | 独立复核和最终使用者分支文案仍未完成 |
| 隐私 | `PASS_WITH_GATE` | 年龄收集与保留拆分；最少数据候选有明确代价；不推断身份 | 若选择持久化年龄/出生日期，删除、备份和恢复合同必须联动 D-064/D-065 |
| QA | `PASS_WITH_GATE` | 稳定 ID、互斥选项、适用条件、冲突回退、`Other` 规范化均可生成测试 | 卡尚未进入 Owner intake，宿主原生呈现与实际响应记录尚未测试 |

自审结论是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不等于独立复核、PX-0 完成或 Owner 评审授权。下一门禁为 `FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED`。

## 9. 来源与证据边界

- [NASEM 2023：成人总能量消耗与 EER 方程](https://www.ncbi.nlm.nih.gov/books/NBK591021/)：成人 19+ 范围、输入变量、活动类别和分支方程。
- [NASEM 2023：EER 应用](https://www.ncbi.nlm.nih.gov/books/NBK591020/)：活动水平不确定性及临床情况/用药的额外考量。
- [Mifflin 等 1990 原始研究（PubMed）](https://pubmed.ncbi.nlm.nih.gov/2305711/)：19 至 78 岁样本、分支方程和 REE 输出边界。
- [Apple App Review Guidelines 5.1.1 与 1.4.1](https://developer.apple.com/app-store/review/guidelines/)：数据最小化与健康数据准确性审查边界。
- [Apple Health & Fitness](https://developer.apple.com/health-fitness/)：最少收集健康数据与优先设备端处理的隐私方向。

这些来源约束卡片能否准确描述候选，不选择产品答案，也不证明对单个使用者的估算准确性。

## 10. 当前门禁

```text
D-040 decisionState: CANDIDATE
authoritativeState: PX-0_INPUT_GAP
firstBatchCardCount: 4
firstBatchSelfReviewPassed: true
next: FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
formalImplementationAuthorized: false
```
