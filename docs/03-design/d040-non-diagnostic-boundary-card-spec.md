# D-040 D-068/D-069 非诊断边界内部卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NON-DIAGNOSTIC-BOUNDARY-CARD-SPEC-001` |
| 范围 | D-068 慢性病/用药非诊断输入；D-069 估算不确定性表达 |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-27（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；D-068/D-069 均未排期、未展示、未收集响应 |
| 授权 | 健康批准、Content QA、独立复核、PX-1、PX-2、Owner 评审、Owner 选择、决定接受和正式实现均为 `false` |

## 1. 本批次解决什么

本规格把 D-040 中会影响自动能量、减重和宏量目标的两个“非诊断边界”轴先写成可审查的内部卡：

- D-068：用户声明慢性病、用药或不确定时，产品如何处理自动估算。
- D-069：产品展示自动估算时，如何表达群体公式的不确定性，避免把误差指标冒充个人上下限。

这两张卡只固定候选行为与失败关闭边界，不让 App 诊断疾病、判断用药影响、筛查进食障碍、提供治疗建议，或把群体模型误差解释为个人健康结论。

当前 [中国大陆支持文案与健康评审治理输入包](d040-china-support-health-review-input.md) 已形成术语、资源和候选文案草案；[中国健康评审人交接包](d040-china-health-reviewer-intake-packet.md) 已定义具名健康评审、资质、逐条签署、90 天复核和 Content QA 门禁。但具名健康评审人、资质核验、正式健康批准、Content QA 和独立复核都没有发生，因此本规格仍是 `NOT_OWNER_READY`。

## 2. 宿主原生渲染合同

未来若 D-068/D-069 获准进入 Owner 评审，必须使用宿主原生选择工具，并满足：

1. 每张卡使用稳定 `questionId`，提供 2 到 3 个互斥选项；稳定 `optionId` 不因文案微调改变。
2. 推荐项只表达当前风险、复杂度与本地优先目标下的低风险建议，不是默认值，也不是 Owner 已选择。
3. 宿主自动提供的 `Other` 只收集待规范化意见；PM 必须先判断它是已有选项、新选项还是新决定，不能把原文直接登记为已接受政策。
4. 未满足健康评审、Content QA、独立复核或上游适用条件时，卡片保持 `NOT_OWNER_READY`，不得写入 `project-ops/owner-intake.json`。
5. 任一回答都不能授权诊断、治疗、自动拨号、联网拉取资源、读取定位、写入健康事实、创建自动目标或正式实现。

## 3. D-068 慢性病或用药的非诊断输入

```text
decisionId: D-068
questionId: d068_non_diagnostic_health_context
header: 健康边界
question: 当用户说明慢性病、正在用药或不确定时，自动估算应该如何处理？
applicableWhen: D-057 != manual_or_no_goal OR D-063 != no_macro_target
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `pause_automatic_estimates_on_yes_or_unsure` | 有或不确定时暂停自动估算（推荐） | 慢性病、用药或不确定回答都不会进入自动能量、减重或宏量推导；用户仍可使用无目标日记，或手工录入由了解其健康情况的医生或医疗卫生专业人员给出的目标。安全边界最清晰，但自动化便利性最低。 |
| 2 | `pause_only_on_yes_unsure_requires_manual_review` | 有则暂停，不确定需手动确认 | 用户明确“有”时暂停自动估算；“不确定”时继续要求用户确认是否改走无目标/手工路径。减少误停，但多一步确认，且必须避免把“不确定”解释为“无风险”。 |
| 3 | `manual_only_for_health_context` | 涉及健康情况时只允许手工或无目标 | 任何需要询问慢性病、用药或健康不确定性的路径都不生成自动结果；产品复杂度和健康风险最低，但会放弃相关自动估算能力。 |

D-068 不收集诊断名称、药物名称、剂量、病历、处方、检查结果或医生身份。若未来业务必须保存更具体健康事实，必须另行建立数据最小化、删除、备份、恢复、安全与健康评审门禁；本卡不授权这些字段。

## 4. D-069 估算不确定性的界面表达

```text
decisionId: D-069
questionId: d069_estimate_uncertainty_copy
header: 估算说明
question: 自动估算结果旁边应该如何说明不确定性？
applicableWhen: D-057 or D-062 produces an automatic estimate candidate
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `plain_language_no_numeric_error_bounds` | 只用普通语言说明估算（推荐） | 明确“这是群体公式估算，不是个人精确测量”，不展示 RMSE、MAPE、置信区间或上下限。误解风险最低，信息密度较低。 |
| 2 | `model_named_general_uncertainty` | 显示模型名称与一般不确定性 | 可说明使用了哪个已接受模型，并提示输入和活动分类会影响结果；不展示具体误差数值。透明度更高，但需要更严格的文案与模型名称治理。 |
| 3 | `validated_numeric_uncertainty_when_available` | 有验证证据时显示数值不确定性 | 只有当模型、样本、适用人群、误差指标和健康文案都经具名评审批准时，才可显示数值不确定性。解释能力最强，但当前证据不足，必须保持不可用。 |

D-069 不允许把群体误差指标转换成个人预测区间、健康风险区间或安全上限；也不允许把“估算不确定”当作让用户调整用药、饮食治疗或医疗行为的依据。

## 5. 依赖、跳过与失败关闭

| 条件 | 结果 |
| --- | --- |
| D-054 = `manual_only_all_ages` | D-068/D-069 记录 `NOT_APPLICABLE`；不生成自动公式相关结果。 |
| D-057 = `manual_or_no_goal` 且 D-063 = `no_macro_target` | D-068/D-069 记录 `NOT_APPLICABLE`；保留无目标日记或手工目标。 |
| 用户回答慢性病/用药为“有” | 按 D-068 选定策略暂停相关自动估算；不得要求用户输入诊断或药物详情。 |
| 用户回答“不确定” | 不得改写为“没有”；默认失败关闭或进入显式确认。 |
| 用户主动自述进食障碍风险 | 暂停自动减重和宏量目标；只能显示经健康评审批准的支持文案候选，当前仍未批准。 |
| D-069 数值不确定性证据不足 | 不显示 RMSE/MAPE/区间；使用普通语言边界。 |
| 具名健康评审、Content QA 或独立复核缺失 | D-068/D-069 均保持 `NOT_OWNER_READY`。 |

`NOT_APPLICABLE` 是条件跳过，不是 Owner 选择，也不关闭 D-040。任何后续改变触发条件、术语、风险文案、保存字段或数值不确定性展示的行为，都必须重新评审。

## 6. 健康内容与数据边界

- 产品可以记录用户对 D-068 问题的明确选择值和版本化来源，但当前规格不授权保存诊断名称、药物名称、处方、病历、检查结果或自由文本健康描述。
- “不确定”是一个受保护状态，不得被统计、归类或自动转换为“无慢性病/无用药”。
- 支持资源只能使用已评审的离线文案和号码名称；当前 `12356` 与 `120` 的候选文案仍等待健康批准和 Content QA。
- 不读取定位，不访问通讯录，不自动拨号，不联网更新资源，不写入 HealthKit，不创建医疗事件记录。
- 自动估算被暂停时，仍保留用户的手工记录、无目标日记、数据访问和删除路径；不得删除或回算既有历史。

## 7. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 两张卡各自只改变一个行为轴；选项互斥；推荐、收益、代价和 Other 归一化边界明确 | 尚未进入 Owner intake；D-040 最终结构不能提交 |
| 健康安全 | `PASS_WITH_GATE` | 非诊断、不转诊、不把不确定改写为无风险、不把群体误差冒充个人区间 | 具名健康评审、健康批准、Content QA 和独立复核缺失 |
| 隐私安全 | `PASS` | 最小化数据字段；不保存诊断/药物详情；无联网、定位、通讯录、HealthKit 或自动拨号 | 若未来保存更具体健康资料，必须另建门禁 |
| QA | `PASS_WITH_GATE` | 稳定 ID、适用条件、NOT_APPLICABLE、失败关闭和数值不确定性禁令可测试 | 尚无 UI、VoiceOver、正式文案或 Release 证据 |

这是内部自审，不是独立复核、健康批准、Owner 选择或实现授权。

## 8. 当前门禁

```text
D-040 decisionState: CANDIDATE
authoritativeState: PX-0_INPUT_GAP
d068CardState: DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY
d069CardState: DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY
d068OptionCount: 3
d069OptionCount: 3
d068RecommendedOptionId: pause_automatic_estimates_on_yes_or_unsure
d069RecommendedOptionId: plain_language_no_numeric_error_bounds
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
independentReviewPassed: false
d068OwnerReady: false
d069OwnerReady: false
ownerIntakeChanged: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
healthDataPersistenceAuthorized: false
automaticDialAuthorized: false
networkResourceRefreshAuthorized: false
formulaImplementationAuthorized: false
formalImplementationAuthorized: false
```
