# D-040 D-063 宏量目标来源选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-MACRO-TARGET-SOURCE-CARD-SPEC-001` |
| 决定 ID | `D-063`（仍只是预留候选 ID） |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-21（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；卡片未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受、宏量目标和正式工程实现均为 `false` |

## 1. 本卡解决什么

本卡只决定首版宏量目标的来源层级：不设置目标、只展示带版本的中国健康成人参考范围，或让用户另行定义自己的目标。它不选择具体 P/C/F 比例、克数、显示精度、舍入、能量目标、特殊饮食模式或特殊人群规则。

当前只完成内部规格与四域自审。`WS/T 578.1-2017` 的现行来源链已经补齐，但具名健康评审、D-068/D-069 前置决定、独立复核和 Content QA 都未完成，所以本卡不能进入 Owner 评审。

## 2. 稳定选择卡

```text
decisionId: D-063
questionId: d063_macro_target_source
header: 宏量目标来源
question: 首版应怎样提供蛋白质、碳水和脂肪目标？
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| ---: | --- | --- | --- |
| 1 | `no_macro_target` | 不设置宏量目标（推荐） | 只记录实际摄入并显示“未设置”，不会把一般人群范围误作个体目标；缺少目标对比和自动换算便利。 |
| 2 | `china_adult_reference_band_information_only` | 仅显示中国健康成人参考带 | 显示 `WS/T 578.1-2017` 的三项独立范围与来源，帮助理解一般参考；不生成单点、GoalVersion、达标状态、风险分或自动纠正，只适用于通过健康边界的成人候选。 |
| 3 | `user_defined_macro_target` | 用户自定义宏量目标 | 使用者可明确创建自己的目标，表达灵活；必须再由 D-070 决定互斥输入合同，并由 D-071 决定展示/舍入，不能从参考带、示例或现有摄入自动补值。 |

推荐项只是当前证据和未关闭健康门禁下风险最小的产品建议，不是 Owner 答案。宿主 `Other` 只收集待规范化意见，不得直接登记为接受或自动映射到任一 option ID。

## 3. 三个选项的精确语义

### 3.1 `no_macro_target`

- 不创建或更新 P/C/F `GoalVersion`；日记中的实际营养事实保持可记录、可缺失。
- 不显示达标百分比、剩余克数、红绿灯、超标、风险或纠正动作。
- 不妨碍 D-072 以后决定硬停止场景是否仍允许新增无目标记录。
- 以后改选其他来源时只创建待确认的新候选，不回算历史日记。

### 3.2 `china_adult_reference_band_information_only`

固定来源身份与范围：

```text
standardId = WS/T 578.1-2017
carbohydrateEnergyPercentRange = [50, 65]
fatEnergyPercentRange = [20, 30]
proteinEnergyPercentRange = [10, 15]
defaultTriplet = none
```

这三个区间是分别展示的健康成人参考范围，下端合计 `80%`、上端合计 `110%`，不能选择中点或端点凑成默认 `100%` 三元组。界面必须显示标准身份、健康成人语境和来源说明；不得：

- 把参考带保存为用户目标或暗示使用者已经选择目标；
- 把范围外摄入写成诊断、处方、不健康、超标、失败或安全风险；
- 生成达标环、风险分、自动纠正、减重比例或个体上下限；
- 在来源超过 90 天未复核、Release 状态链不完整或正式替代标准出现后继续标成“中国现行标准”；
- 在未成年人、孕哺期、进食障碍风险或尚未关闭的慢性病/用药条件中把一般成人范围当个体建议。

来源失效时回退为无目标记录，不静默切换到 NASEM AMDR，也不运行时联网下载规则或使用远程开关改变已安装版本。

### 3.3 `user_defined_macro_target`

- D-070 必须先选择固定 `100%` 三元组、完整克数或另经批准的部分克数合同；三种形态不能在一次保存中混用。
- D-071 必须定义百分比/克数展示、小数、舍入与残差；D-066 的能量显示舍入不能替代宏量舍入。
- `4/4/9` 只在能量和比例都已明确时执行单位换算，不负责选择能量、比例、精度或默认值。
- 用户取消、拒答、输入不完整、合计不满足所选合同、保存失败或结果未知时，`goalWrites=0`，旧目标继续有效。
- 特殊饮食模式、自动个体处方、运动/减脂最优比例和疾病模型均不属于本项；如以后提出，必须另案研究、健康审查和 Owner 决定。

## 4. 依赖、适用与跳过

| 条件 | 结果 |
| --- | --- |
| D-068/D-069、具名健康评审或 Content QA 未关闭 | 整张 D-063 卡保持 `NOT_OWNER_READY`，不得展示给 Owner。 |
| D-063 = `no_macro_target` | D-070/D-071 记录 `NOT_APPLICABLE`；D-072 仍按硬停止后的纯记录问题独立处理。 |
| D-063 = `china_adult_reference_band_information_only` | D-070 `NOT_APPLICABLE`；D-071 只处理参考带的信息展示，不得产生目标；D-072 仍独立处理。 |
| D-063 = `user_defined_macro_target` | 依次进入 D-070、D-071；二者未接受前不创建 GoalVersion。 |
| 来源状态过期、冲突或无法核验 | 隐藏“中国现行”参考带，保留无目标路径，不自动改选其他 option。 |
| 健康边界不满足或输入拒答/未知 | 不自动推导宏量目标；D-072 只决定无目标纯记录是否可用，不能豁免硬停止。 |
| `Other` 提出新来源或专项模式 | 暂停 D-063，不登记接受；由 PM 规范化为既有选项、修订卡或新决定。 |

`NOT_APPLICABLE` 是依赖结果，不是 Owner 选择。任何依赖变化只影响未来候选和呈现，不得删除历史决定事件、覆盖既有目标或回算日记。

## 5. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 单轴、三项互斥、收益/代价、推荐、Other 与 D-070~D-072 跳过关系明确 | D-068/D-069、独立复核和 Owner 排期未完成 |
| 健康安全 | `PASS_WITH_GATE` | 参考带只作一般健康成人信息；禁止默认、处方、评分、纠正和特殊人群泛化 | 具名健康评审、健康批准与 Content QA 未完成 |
| Privacy/Data Integrity | `PASS_WITH_GATE` | 参考带不创建 GoalVersion；用户目标需显式合同；失败零写入、来源失效和历史不回算明确 | 最终保存选择仍依赖 D-064/D-065，D-070/D-071 未形成 |
| QA/Accessibility | `PASS_WITH_GATE` | 稳定 ID、条件适用、来源过期、冲突、拒答、取消和零写入可测试 | 独立复核、宿主渲染、VoiceOver/Dynamic Type/320pt 和真机证据未完成 |

内部自审只证明卡片已达到可交给独立复核与健康评审的草案质量，不证明健康内容已批准，也不让任何 option 进入 Owner intake。

## 6. 证据边界

- [D-040 P/C/F 宏量营养证据包](d040-macronutrient-evidence.md)固定 AMDR/DRI、减重非唯一比例、`4/4/9` 换算和失败关闭边界。
- [中国宏量营养标准输入包](d040-china-macronutrient-standard-input.md)固定 `WS/T 578.1-2017` 的官方来源、现行状态、成人范围、90 天/Release 复核与禁止默认/评分/纠正语义。
- [中国健康评审人交接包](d040-china-health-reviewer-intake-packet.md)规定具名资质、逐条健康签署和独立 Content QA；当前仍未指派评审人、未开始、未批准。
- [D-040 问题分解](d040-question-allocation.md)把 D-063 与 D-070/D-071/D-072 分成四个轴，并规定 D-068/D-069 先于宏量批次。

这些来源约束候选含义，不选择 Owner 答案，不证明个人准确性，也不授权正式公式、schema、UI、持久化或发布。

## 7. 当前机器可读边界

```text
decisionId: D-063
questionId: d063_macro_target_source
cardCount: 1
optionCount: 3
recommendedOptionId: no_macro_target
draftedCardCount: 14
chinaReferenceBandEvidenceReady: true
referenceBandInformationOnly: true
referenceBandCreatesGoalVersion: false
referenceBandCanTriggerScoringDiagnosisOrCorrection: false
d068D069PrerequisitesPassed: false
healthReviewPacketReady: true
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
productSelfReviewPassed: true
healthEvidenceSelfReviewPassed: true
privacySelfReviewPassed: true
qaSelfReviewPassed: true
independentReviewPassed: false
d063OwnerReady: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
macroImplementationAuthorized: false
formalImplementationAuthorized: false
next: NAMED_HEALTH_REVIEW_AND_MACRO_CARD_INDEPENDENT_REVIEW_REQUIRED
```
