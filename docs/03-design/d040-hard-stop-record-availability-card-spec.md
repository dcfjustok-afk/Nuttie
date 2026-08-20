# D-040 D-072 硬停止后纯记录可用性选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-HARD-STOP-RECORD-AVAILABILITY-CARD-SPEC-001` |
| 决定 ID | `D-072`（仍只是预留候选 ID） |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-21（Asia/Shanghai） |
| 适用条件 | 普通成人自动能量/减重/宏量目标的硬停止或条件停止已触发 |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| Owner intake | 未写入；卡片未排期、未展示、未收集响应 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受、健康文案、持久化和正式工程实现均为 `false` |

## 1. 本卡解决什么

本卡只决定保护条件触发、自动目标入口关闭后，首版是否仍允许新增不带目标的营养事实记录。它不决定谁属于某一健康类别，不诊断、不治疗、不转诊，不允许 Owner 豁免硬停止，也不恢复手工减重数字、宏量目标、自动公式、参考带、评分或纠正动作。

具名健康评审、D-068/D-069、Content QA 和独立复核均未完成。本卡只是把已经存在的二选一研究轴变成可复核规格；没有任何当前产品行为或实现授权。

## 2. 稳定选择卡

```text
decisionId: D-072
questionId: d072_hard_stop_record_availability
header: 无目标记录
question: 自动目标因保护条件暂停后，是否仍允许新增无目标营养事实记录？
applicableWhen: automatic energy/weight-loss/macro target hard stop or conditional stop is active
```

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| ---: | --- | --- | --- |
| 1 | `allow_no_goal_fact_recording` | 允许无目标事实记录（推荐） | 可继续记录用户明确输入的摄入事实，并始终显示“未设置目标”；不能提供达标、剩余、颜色评分、减重数字或自动建议。健康文案与触发细节仍须专业批准。 |
| 2 | `pause_new_fact_creation_keep_data_controls` | 暂停新增事实，保留已有数据控制 | 最保守地避免新增记录体验被误读为目标指导；会降低日记连续性。已有记录的查看、必要纠错、删除和数据访问仍必须可用，不能借此锁住用户数据。 |

推荐项只基于“事实记录与目标建议分离、保留本地日记连续性”的产品逻辑，不表示对任何特殊人群的健康适用性已经批准。宿主 `Other` 只收集待规范化意见。

## 3. 不可由 Owner 豁免的共同边界

无论选择哪项：

- 普通成人自动 EER、REE→每日目标、减重目标、P/C/F 目标和参考带个体化保持关闭；
- 不显示目标进度、剩余量、红绿灯、超标/失败、风险分、连胜、纠正、推荐比例或自动调整；
- 不把无目标记录升级成“安全目标”“医生建议”“适合你”或治疗/康复工具；
- 不根据年龄、孕哺、疾病、用药、进食障碍风险或其他资料推断诊断，也不从日记内容反推健康状态；
- 不删除、改写或回算已有事实、GoalVersion、IndependentHistory、备份或外部 Files 副本；
- 查看、纠错、删除、隐私说明和数据访问入口不得因新增记录选择而消失；
- `12356` 只可在经批准的心理援助语境中出现，`120` 只用于急危重症/紧急医疗救援；本卡不批准文案、自动拨号、定位或转诊。

硬停止优先于 D-063/D-070/D-071。D-072 的答案只能收窄“事实新增”能力，不能打开任何目标路径。

## 4. 条件与非诊断语义

当前研究把以下情况作为候选保护边界，仍需具名健康评审逐条批准：

| 情形 | 固定自动目标边界 | D-072 只决定 |
| --- | --- | --- |
| 未满 18 岁或年龄未知 | 普通成人自动减重/宏量目标关闭 | 是否允许新增无目标事实 |
| 孕期或哺乳期 | 普通成人自动目标关闭；专项路径另案 | 是否允许新增无目标事实 |
| 已确诊、正在治疗或主动自述进食障碍风险 | 减重数字和宏量目标入口关闭，不由 App 诊断 | 是否允许支持性的无目标事实新增 |
| 慢性病、用药=`有/不确定` | 条件复核未关闭前不自动推导 | 是否允许无目标事实新增；专业人员提供的手工目标是其他决定轴 |
| 必需输入缺失、冲突或资格未知 | 不补默认值、不运行自动目标 | 是否允许无目标事实新增 |

D-072 不定义或保存新的疾病、用药、孕哺或风险字段。它只消费由未来已批准规则产生的版本化粗粒度 `targetEligibilityState`，且不能把 UNKNOWN 当作可自动计算。

## 5. `allow_no_goal_fact_recording`

允许的范围仅为调用方已批准字段中的用户输入事实，例如餐食、能量或营养事实；每条记录仍须保留自身来源、单位、时间和 revision。固定结果：

```text
goalVersionId = none
targetComparison = NOT_APPLICABLE
remaining = NOT_APPLICABLE
score = NOT_APPLICABLE
automaticRecommendation = none
```

- 缺失营养字段保持缺失，不补零、不用参考带或最近一次记录填充；
- 可显示事实汇总，但不得把汇总与未设置目标相减或形成达标百分比；
- 若健康内容未批准，只显示中性“目标未设置/自动目标不可用”占位，不显示未经审查的原因或资源文案；
- 事实保存失败、取消或结果未知时遵循原业务事务合同，不创建目标、资料或第二个记录命令。

## 6. `pause_new_fact_creation_keep_data_controls`

- 阻止新的营养事实 create 命令，但不得伪造“健康禁止”或诊断原因；
- 已有事实继续可读；用户仍可执行已批准的纠错、删除、数据访问和全量清除流程；
- 不得用暂停新增阻止导出/访问请求、删除、撤销权限或查看隐私说明；
- 条件变化或以后改选允许记录时，不补记、不从缓存恢复被拒绝的输入，也不自动创建目标；
- UI 必须提供明确返回和退出，不能形成无法离开的阻断页。

## 7. 状态变化与失败关闭

- 停止状态必须绑定规则版本、输入来源和 observation revision；陈旧或冲突状态按 UNKNOWN 处理，自动目标保持关闭；
- D-072 尚未接受时，仓库不宣称任一记录策略已启用；正式实现保持关闭；
- 从停止状态退出时只恢复未来入口资格，不自动运行公式、不恢复旧 pending 目标，也不回算历史；
- 从可用转为停止时不删除草稿或事实；任何草稿处置必须由已有事务/隐私规则决定；
- D-072 变化只影响未来命令，不重写历史决定事件或事实 provenance；
- 所有错误路径 `profileWrites=0`、`goalWrites=0`，事实写入按所选策略与原子事务结果精确决定。

## 8. 依赖与 Owner-ready 门禁

| 条件 | 结果 |
| --- | --- |
| 没有停止状态 | D-072=`NOT_APPLICABLE`，不得展示本卡。 |
| D-068/D-069 或健康内容未批准 | 本卡保持 `NOT_OWNER_READY`；不显示具体健康原因或支持资源。 |
| D-063=`no_macro_target` 但没有健康停止 | 这是普通无目标选择，不自动触发 D-072。 |
| D-072=`allow_no_goal_fact_recording` | 只开放无目标事实；D-063/D-070/D-071 目标路径仍关闭。 |
| D-072=`pause_new_fact_creation_keep_data_controls` | 只暂停新增；已有数据控制不受影响。 |
| 条件未知或 observation 陈旧 | 自动目标关闭；记录策略等待已接受的 D-072 和有效状态，不猜测。 |
| `Other` 提出专项模型、手工目标或新健康路径 | 暂停 D-072，不登记接受；另案研究、健康评审和 Owner 决定。 |

## 9. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 单轴二选一、推荐理由、普通无目标与保护停止分离、Other 明确 | Owner 排期、D-068/D-069 和独立复核未完成 |
| 健康安全 | `PASS_WITH_GATE` | 硬停止不可豁免；无目标事实不冒充指导；不诊断、不评分、不自动恢复 | 具名健康评审、触发边界、健康文案与 Content QA 未完成 |
| Privacy/Data Integrity | `PASS_WITH_GATE` | 不新增健康字段；不删历史；数据访问/删除保留；版本、陈旧、零目标写入明确 | 正式 eligibility schema、事务 adapter 和迁移未授权 |
| QA/Accessibility | `PASS_WITH_GATE` | 两选项、UNKNOWN、状态进出、失败、返回、已有数据控制和文案降级可测试 | 宿主渲染、VoiceOver/Dynamic Type/320pt 和真机证据未完成 |

内部自审不等于独立复核、健康批准、Owner 选择或实现授权。

## 10. 证据边界

- [D-040 P/C/F 宏量营养证据包](d040-macronutrient-evidence.md) 固定保护组、条件复核组、无目标记录和不可豁免的自动推导停止边界。
- [中国支持文案与健康治理输入](d040-china-support-health-review-input.md)提供尚未批准的停止推导、无目标日记与 12356/120 候选文案；本卡不把草案升级为正式内容。
- [中国健康评审人交接包](d040-china-health-reviewer-intake-packet.md)要求具名资质、逐条签署和独立 Content QA；当前未指派、未开始、未批准。
- [D-063 宏量目标来源卡](d040-macro-target-source-card-spec.md)规定 D-072 与来源/输入/显示轴分离，不能借纯记录恢复目标。

## 11. 当前机器可读边界

```text
decisionId: D-072
questionId: d072_hard_stop_record_availability
cardCount: 1
optionCount: 2
recommendedOptionId: allow_no_goal_fact_recording
draftedCardCount: 17
hardStopCannotBeWaived: true
noGoalRecordingCannotCreateGoal: true
automaticTargetOrFormulaShown: false
targetComparisonOrScoringShown: false
existingHistoryRecalculated: false
existingHistoryDeleted: false
dataAccessAndDeletionRemainAvailable: true
recordingChoiceChangesHealthClassification: false
conditionInferredByApp: false
unknownEligibilityEnablesAutomaticTarget: false
supportCopyRequiresHealthApproval: true
d068D069PrerequisitesPassed: false
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
independentReviewPassed: false
d072OwnerReady: false
cardRegisteredInDecisionLedger: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
recordingImplementationAuthorized: false
persistenceImplementationAuthorized: false
formalImplementationAuthorized: false
next: HEALTH_AND_D072_INDEPENDENT_REVIEW_REQUIRED
```
