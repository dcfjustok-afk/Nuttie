# D-040 第二小批能量模型选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-ENERGY-MODEL-BATCH-CARD-SPEC-001` |
| 范围 | D-057、D-059、D-060、D-061、D-062 |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / DYNAMIC_MODEL_EVIDENCE_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-20（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；五张卡均未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受、公式实现和正式工程均为 `false` |

## 1. 本批次解决什么

本工件把基础能量、活动输入、活动缺失、Mifflin REE 用途和体重增减路径写成一条可审查的依赖链。它不选择公式，也不把研究推荐当成 Owner 答案。

所有卡共同遵守：

- NASEM 2023 成人 EER 只形成体重稳定语境的维持能量候选；不能改名为减重、增重或个体处方。
- Mifflin-St Jeor 只输出 `REE`；活动乘数、`TDEE`、热量缺口、目标速度和 P/C/F 都不属于原研究。
- 动态体重模型必须先有精确模型/代码/许可证、适用人群、输入范围、保护线、测试向量和回归容差；NIDDK 网页工具或其默认 `PAL 1.6` 不能直接成为 Nuttie 规则。
- 活动未知、拒答、越界或无法归类时，不使用默认 PAL、不夹取到边界、不从步数/HealthKit 推断。
- 任何自动结果都只是待确认候选；取消、拒答、冲突或失败时保留手工目标和无目标日记，资料与目标写入为 0。
- D-054/D-055/D-056/D-058 尚未独立复核；本批次不能反向把第一批卡升级为 Owner-ready。

## 2. 卡片评审顺序

未来只有在前置卡已记录且本批次独立复核通过后，才能按以下顺序显示：

```text
D-057 基础路径
  -> D-061（仅当 D-057 = Mifflin）
  -> D-062 体重增减路径
  -> D-059（仅当有效路径需要活动输入）
  -> D-060（仅当有效路径允许处理活动缺失）
```

依赖变化时重新计算适用性；`NOT_APPLICABLE` 不是 Owner 选择，也不得删除历史决定事件。宿主 `Other` 只收集待规范化意见，不能直接登记为接受。

## 3. D-057 基础能量路径

```text
decisionId: D-057
questionId: d057_base_energy_path
header: 基础能量路径
question: 首版应采用哪条基础能量路径？
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `nasem_2023_maintenance_eer` | NASEM 维持 EER（推荐） | 对 19+、体重稳定且输入完整的成人生成维持能量候选，方程、PAL 类别和误差来源明确；活动分类仍不确定，不能生成增减重目标。 |
| 2 | `mifflin_ree_only` | Mifflin 静息能量 | 以较少输入生成明确标记的 REE 信息；它不是每日目标，是否显示由 D-061 决定，当前没有获批的 REE→每日目标策略。 |
| 3 | `manual_or_no_goal` | 仅手工或无目标 | 不运行自动能量公式，数据和模型风险最低；失去自动估算便利，但日记和手工目标保持可用。 |

D-057 不决定年龄取得/表示、公式分支文案、活动表示、增减重模型、舍入或保存。选择 NASEM 或 Mifflin 也不授权计算，仍须通过适用性、输入、健康边界和后续卡。

## 4. D-061 Mifflin REE 当前用途

```text
decisionId: D-061
questionId: d061_mifflin_ree_use
header: Mifflin REE 用途
question: 如果选择 Mifflin，首版应怎样使用 REE？
applicableWhen: D-057 = mifflin_ree_only
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `show_ree_information_only` | 只显示 REE 信息（推荐） | 明确说明是静息能量估算，用户可另行手工设每日目标；保留可解释信息，但必须防止被误读为维持或减重热量。 |
| 2 | `do_not_calculate_or_display_mifflin` | 不显示 Mifflin | 避免 REE 与每日目标混淆；若选择此项，D-057 必须返回改选 NASEM 或手工/无目标，不能保留一条无输出路径。 |

本卡没有“REE × 通用活动系数”“自动 TDEE”或“减去固定热量”选项。未来若提出具体转换策略，必须另立决定并提供来源、版本、适用范围、误差和测试 corpus。

## 5. D-062 体重增减目标路径

```text
decisionId: D-062
questionId: d062_weight_change_goal_path
header: 体重增减路径
question: 当用户希望增重或减重时，首版应采用哪条目标路径？
applicableWhen: D-057 != manual_or_no_goal
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `maintenance_only_manual_or_no_goal_for_change` | 自动只做维持（推荐） | NASEM 自动结果只服务体重稳定；增减重转到显式手工目标或无目标，不制造未验证的热量差。自动便利有限，但当前证据边界最清楚。 |
| 2 | `validated_dynamic_change_model` | 经验证的动态模型 | 可表达目标体重、达成时间和活动变化；必须先完成模型/许可/人群/保护线/测试专项证据，成本和健康风险最高。 |

`validated_dynamic_change_model` 是完整的条件方案，但当前 `ownerOptionReady=false`：仓库没有已批准的本地模型实现、许可结论、保护线、跨实现向量或健康评审。独立复核必须选择“补齐证据后保留”或产出移除该项的 superseding card，不能把 NIDDK 工具截图或默认值冒充实现证据。

## 6. D-059 活动输入表示

```text
decisionId: D-059
questionId: d059_activity_input_representation
header: 活动输入
question: 有效能量路径需要活动输入时，应采用哪种表示？
applicableWhen: D-057 = nasem_2023_maintenance_eer OR D-062 = validated_dynamic_change_model
```

| 顺序 | optionId | 适用路径 | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- | --- |
| 1 | `nasem_four_category_self_report` | NASEM | 四类活动自报（推荐） | 使用 Inactive/Low active/Active/Very active 的模型原生类别并说明分类不确定性；可直接选对应方程，但仍依赖用户主观判断。 |
| 2 | `model_native_numeric_pal` | 已验证动态模型 | 模型原生数值 PAL | 只按获批模型自己的范围、UI 和版本使用数值 PAL；表达更细，但不得跨模型复用、默认 1.6 或映射成 NASEM 类别。 |
| 3 | `no_activity_disable_automatic_daily_energy` | 任一路径 | 不收集活动 | 数据最少；停用所有依赖活动的自动每日能量结果，继续手工目标或无目标。 |

宿主只展示与已接受路径相容的选项，但稳定 `optionId` 不变。`model_native_numeric_pal` 随 D-062 动态模型方案一起保持 `ownerOptionReady=false`；首版不从 HealthKit、步数、训练分钟、职业或设备传感器推断 PAL。

## 7. D-060 活动缺失行为

```text
decisionId: D-060
questionId: d060_missing_activity_behavior
header: 活动缺失
question: 活动拒答、未知或无法归类时，应显示什么？
applicableWhen: D-059 != no_activity_disable_automatic_daily_energy
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `no_automatic_result_or_target` | 不显示自动结果（推荐） | 不生成 EER、动态计划或每日目标，直接保留手工/无目标出口；最不易误导，但缺少局部公式反馈。 |
| 2 | `mifflin_ree_information_only` | 仅显示 Mifflin REE | 仅当 D-057=Mifflin 且 D-061 允许显示时，活动缺失仍可展示明确标记的 REE；不能显示 TDEE、维持或增减重目标。 |

在 NASEM 或动态模型路径中，第二项不适用；活动缺失始终产生 `NOT_CALCULATED`。输入异常、PAL 越界或类别冲突与拒答同样处理，不能静默回退到 Inactive、1.6 或最近一次值。

## 8. 依赖、冲突与失败关闭

| 条件 | 结果 |
| --- | --- |
| D-054 = `manual_only_all_ages` | 本批五卡全部 `NOT_APPLICABLE`。 |
| D-058 = `disable_branch_dependent_formulas` | NASEM/Mifflin 不能留在 D-057；回到 D-057 选择手工/无目标。 |
| D-057 = `manual_or_no_goal` | D-059/D-060/D-061/D-062 全部 `NOT_APPLICABLE`。 |
| D-057 = `mifflin_ree_only` 且 D-061 拒绝显示 | 回到 D-057 改选；不生成隐藏 REE 或每日目标。 |
| D-062 动态模型证据未通过 | `validated_dynamic_change_model` 与 `model_native_numeric_pal` 不得进入 Owner 卡。 |
| D-059 = `no_activity_disable_automatic_daily_energy` | D-060 `NOT_APPLICABLE`；不生成依赖活动的自动结果。 |
| 活动拒答、未知、越界或冲突 | 不默认、不夹取、不推断；依 D-060 失败关闭。 |
| 用户取消、稍后或保存失败 | `profileWrites=0`、`goalWrites=0`；原资料、目标和历史不变。 |

所有自动输出必须保留 `algorithmFamily/version`、适用性、输入 revision、原始未舍入结果和不确定性 provenance；但字段/持久化政策仍由 D-064/D-065/D-066/D-067 决定，本卡不授权保存。

## 9. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 五卡单轴、模型输出名称、条件选项、跳过和回退顺序明确 | 第一批依赖、动态模型证据、独立复核和 Owner 排期未完成 |
| 健康安全 | `PASS_WITH_GATE` | EER=维持、REE≠每日目标、增减重不拼固定缺口、活动未知失败关闭 | 健康评审责任人/周期、动态模型/保护线、用户文案未完成 |
| Privacy | `PASS_WITH_GATE` | 不要求活动永久保存，不从 HealthKit/步数推断，取消和失败零写入 | D-064/D-065 的保存/删除组合尚未选择 |
| QA | `PASS_WITH_GATE` | 稳定 ID、条件适用、冲突回退、PAL 越界、零写入与旧答案保留可测试 | 独立复核、宿主渲染、模型 corpus 和真机证据未完成 |

这是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不是独立复核。D-057/D-059/D-060/D-061/D-062 仍只是预留 ID，未进入决定台账或 Owner intake。

## 10. 一手来源与证据边界

- [NASEM 2023 成人 EER 汇总表](https://www.ncbi.nlm.nih.gov/books/NBK591034/?report=reader)列出 19+、两个公式分支和四类 PAL 的独立方程。
- [NASEM 2023 EER 应用章节](https://www.ncbi.nlm.nih.gov/books/NBK591020/)说明 PAL 选择具有不确定性，EER 用于体重维持，增减重、极高活动和临床情况需要额外考量。
- [Mifflin 等 1990 原始研究](https://pubmed.ncbi.nlm.nih.gov/2305711/)以 498 名 19–78 岁健康受试者建立 REE 方程；它没有定义活动乘数或每日目标。
- [NIDDK Body Weight Planner](https://www.niddk.nih.gov/bwp)展示动态体重工具需要年龄、身高、体重、公式分支、PAL、目标体重和时间，并排除未成年人、孕妇和哺乳期使用；其网页默认值只属于该工具。

这些来源只约束候选含义。它们不证明 Nuttie 应选择某一模型，不授权移植 NIDDK 算法，也不替代中国大陆内容/健康治理。

## 11. 当前门禁

```text
D-040 decisionState: CANDIDATE
authoritativeState: PX-0_INPUT_GAP
firstBatchCardCount: 4
energyBatchCardCount: 5
draftedCardCount: 9
energyBatchSelfReviewPassed: true
dynamicModelEvidencePassed: false
dynamicModelOptionOwnerReady: false
next: FIRST_TWO_BATCHES_INDEPENDENT_REVIEW_REQUIRED
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
formulaImplementationAuthorized: false
formalImplementationAuthorized: false
```
