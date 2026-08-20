# D-040 PX-0 问题分解与全局 ID 预留

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-QUESTION-ALLOCATION-001` |
| 状态 | `CANDIDATE_ALLOCATION_COMPLETE / FIRST_THREE_BATCHES_SPEC_COMPLETE / D063_D070_D071_D072_SPEC_COMPLETE / CHINA_SUPPORT_INPUT_DRAFT_COMPLETE / PX-0_INPUT_GAP` |
| 日期 | 2026-08-15（Asia/Shanghai） |
| 输入 | `D040-RESEARCH-001` 的 17 个草案问题；`D040-RESEARCH-002` 的 4 个宏量轴 |
| 结果 | 保留 D-040 作为最终首启结构；预留 D-054 至 D-072，共 19 个新的候选 ID |
| Owner intake | 未写入；`d040_onboarding_goals` 仍只是队列占位，不是可展示卡 |
| 授权 | PX-1、PX-2、Owner 评审、Owner 选择、决定接受和正式实现均为 `false` |

## 1. 为什么不能只询问 D-040 A/B/C

最终首启结构会隐含年龄、公式分支、活动、能量路径、宏量、数据保留、删除、舍入、重算和特殊人群等多项独立行为。把这些答案压进一条 D-040 响应，会让 Owner 无法分别接受、拒绝或以后替换，也无法为保存的数据和目标版本记录准确的决定来源。

`D040-RESEARCH-002` 又把原研究第 10 题“当前阶段 P/C/F 行为”拆成四个互不等价的轴：目标来源、输入形态、展示/舍入、硬停止后的纯记录可用性。因此，本工件采用“D-040 保留为最终结构 + 19 个新 ID”的方案，不扩展父子决定 schema。

ID 预留只建立命名和依赖，不等于候选已进入 `project-ops/decisions.json`，更不等于 Owner 已收到或接受选择卡。

## 2. 研究问题到全局候选 ID

| 研究轴 | 预留 ID | 候选题目 | 来源与处理 |
| --- | --- | --- | --- |
| 01 | D-054 | 自动公式适用年龄 | 保留 19+、经验证覆盖 18 岁、停用自动公式三类边界 |
| 02 | D-055 | 年龄来源与保存 | 区分瞬时年龄、当前年龄记录、出生日期 |
| 03 | D-056 | 方程年龄表示 | 完整年数或小数年；不得从来源推导默认精度 |
| 04 | D-057 | 基础能量路径 | NASEM EER、Mifflin REE、手工/无目标；名称与输出不能混用 |
| 05 | D-058 | 二元公式分支与拒答 | 明示公式分支、允许跳过、不推断身份 |
| 06 | D-059 | 活动输入表示 | NASEM 类别、模型对应 PAL 或停用自动每日能量 |
| 07 | D-060 | 活动输入缺失行为 | 不静默补默认；只允许明确的无结果或 REE 信息路径 |
| 08 | D-061 | Mifflin REE 当前用途 | 只显示 REE 信息或不显示；不自动转换为每日目标 |
| 09 | D-062 | 体重增减目标路径 | 维持、另经验证的动态模型、手工/无目标 |
| 10 / Macro-01 | D-063 | 宏量目标来源 | 替代原第 10 题；无目标、条件成立时的参考带、用户自定义 |
| 11 | D-064 | 资料与目标存储 | R1/R2/R3；必须与删除语义联合解释 |
| 12 | D-065 | 删除资料语义 | D1/D2/D3；不得含糊承诺删除外部 Files 副本 |
| 13 | D-066 | 自动能量结果显示舍入 | 整数、10 kcal、50 kcal；raw 不链式舍入 |
| 14 | D-067 | 资料或公式变化后的重算 | 主动差异候选、仅 stale、自动生成待确认候选；均不自动生效 |
| 15 | D-068 | 慢性病或用药的非诊断性输入 | 总问题、拆分问题、停用自动公式；不由 App 诊断 |
| 16 | D-069 | 估算不确定性的界面表达 | 用户说明、群体指标或经验证个体区间；不得把群体误差冒充个人上限 |
| 17 | D-040 | 最终首启资料与目标结构 | 只有所有必需前置轴关闭后才比较 A/B/C |
| Macro-02 | D-070 | 自定义宏量输入形态 | 固定 100% 三元组、完整克数、部分克数；互斥保存合同 |
| Macro-03 | D-071 | 宏量展示与舍入 | 百分比/克数呈现、小数和残差；与能量舍入 D-066 分开 |
| Macro-04 | D-072 | 硬停止后的纯记录可用性 | 只决定无目标记录是否可用，不允许豁免硬停止或显示自动目标 |

`D-054` 至 `D-072` 是连续、未占用的全局候选 ID。本工件不会占用或改写已规划的 D-041 至 D-053，也不会把任何预留 ID 写入权威决定台账。

## 3. 固定安全不变量，不交给 Owner 豁免

下列内容不是选择项：

- 未成年人、孕期、哺乳期以及已确诊、正在治疗或主动自述进食障碍风险时，普通成人自动减重和宏量推导保持关闭；
- 年龄、公式分支、活动或模型所需输入缺失时，不静默补值；
- Mifflin REE 不得冒充每日维持目标，NASEM EER 不得冒充增减重处方；
- 公式候选、资料变化或规则升级不得自动覆盖生效目标或回算历史日记；
- 所有路径保留手工或无目标出口，除非 D-072 以后明确限制“新增记录”本身；即使限制，也不能显示自动目标；
- 中国宏量标准证据已由 `WS/T 578.1-2017` 现行状态输入包关闭；只允许带版本的健康成人参考带候选，不得生成默认比例、个体处方、评分或自动纠正；
- App 不诊断、不转诊、不从其他资料推断公式分支或健康状态。

## 4. 依赖与提交顺序

正式选择卡必须逐张通过中立性、互斥性、收益/代价、拒答路径和安全复核，且一次最多提交一个小批次：

1. 基础适用性：D-054、D-055、D-056、D-058；
2. 能量模型：D-057、D-059、D-060、D-061、D-062；
3. 数据生命周期：D-064、D-065、D-066、D-067；
4. 非诊断边界：D-068、D-069，并先关闭中国大陆支持称谓/资源文案和健康评审责任人/复核周期；
5. 宏量轴：D-063、D-070、D-071、D-072；中国现行标准证据输入已完成，但具名健康评审和前序卡未关闭，D-063 仍不得进入 Owner 评审；
6. 最终 D-040：只在所有会改变 A/B/C 含义的前置决定已经记录后提交。

依赖关系不是默认答案。前一项被拒绝或选择“停用自动公式”时，后续不适用卡应跳过并记录 `NOT_APPLICABLE`，不得强迫 Owner 选择无意义选项。

## 5. 前三小批与中国支持输入结果

第一小批 D-054/D-055/D-056/D-058 已形成[选择卡规格](d040-first-batch-card-spec.md)，完成 Product、健康安全、隐私和 QA 四域自审。规格移除了当前没有模型定义和验证证据的“18 岁专用模型”占位选项，固定了稳定问题/选项 ID、互斥选项、`NOT_APPLICABLE` 条件和 `Other` 规范化路径。

第二小批 D-057/D-059/D-060/D-061/D-062 已形成[能量模型选择卡规格](d040-energy-model-batch-card-spec.md)，固定 EER/REE 名称、活动输入/缺失、增减重路径和模型相容性。动态模型与 model-native PAL 方案当前另需模型/许可/保护线/corpus 证据，不能进入 Owner 卡。

[NIDDK 动态模型采用可行性输入](d040-niddk-dynamic-model-feasibility-input.md)已完成来源可行性核验：论文、方程和七个当前网页代码资产可定位并记录 hash，但逐文件许可、稳定语义版本、官方版本化 oracle corpus、回归容差、产品保护线和健康评审仍未通过。因此动态模型研究不再是“来源未知”，但 D-062/D-059 对应选项继续 `NOT_OWNER_READY`。

第三小批 D-064/D-065/D-066/D-067 已形成[资料与目标生命周期选择卡规格](d040-data-lifecycle-batch-card-spec.md)，固定 CalculationDraft/CurrentProfile/GoalVersion/IndependentHistory 分层、保存/删除组合、raw/display 舍入分离和 stale/pending/supersede 边界。

[中国大陆支持文案与健康评审治理输入包](d040-china-support-health-review-input.md) 已区分 `12356` 心理援助与 `120` 医疗急救，形成稳定支持称谓、六条候选文案、责任矩阵、90 天/每次 Release 来源复核和即时失效条件。它只完成输入草案；具名健康评审人、资质证据、健康批准和 Content QA 均缺失，因此 D-068/D-069 仍不能形成 Owner-ready 卡。

[中国健康评审人交接与签署检查包](d040-china-health-reviewer-intake-packet.md) 已把九份版本化输入、十三个逐条处置项、九项资质字段、利益冲突、90 天复核和独立 Content QA 整理成统一入口。它只把状态推进到 `PACKET_READY`；评审人仍未具名，资质未核验，评审未开始，批准/Content QA 未发生，也没有发送外部消息。

[前三批十三卡独立复核包](d040-first-three-batches-independent-review-packet.md) 已把四个复核域、十三卡逐项结论、十二条跨批不变量和 P0~P3 关闭标准整理成统一入口。它也只推进到 `PACKET_READY`；具名复核人、身份/胜任范围/独立性/利益冲突核验和实际复核都未发生。

[中国宏量营养标准输入包](d040-china-macronutrient-standard-input.md) 已核验 `WS/T 578.1-2017` 的国家卫健委页面/PDF与全国标准平台现行状态，固定健康成人 P/C/F `50–65% / 20–30% / 10–15% E`、`4/4/9` 换算和修订失效边界。[D-063 宏量目标来源选择卡](d040-macro-target-source-card-spec.md) 已固定三项互斥来源；[D-070 自定义宏量输入形态卡](d040-custom-macro-input-shape-card-spec.md) 已固定三项互斥输入合同；[D-071 宏量展示与舍入卡](d040-macro-display-rounding-card-spec.md) 已固定三项互斥显示策略、来源单位、显式派生、raw/display、十进制舍入和残差披露边界；[D-072 硬停止后纯记录可用性卡](d040-hard-stop-record-availability-card-spec.md) 已固定允许无目标事实或暂停新增二选一、硬停止不可豁免、无目标事实不创建目标、历史不删不回算和数据控制持续可用。四卡完成内部四域自审，但 D-063/D-070 未接受，具名健康评审、前序 D-068/D-069、健康数值边界与文案、Content QA 和独立复核尚未完成，仍为 `NOT_OWNER_READY`。

三批卡片与支持输入仍只是内部草案。下一步需要为十三卡复核包指派满足独立性的具名复核人并执行逐卡/跨批复核，同时由 ProjectContentOwner 指派并核验具名中国健康评审人后按健康交接包逐条签署；关闭前不得把任何卡写入 `project-ops/owner-intake.json` 或展示给 Owner。

当前继续保持：

```text
D-040 decisionState: CANDIDATE
authoritativeState: PX-0_INPUT_GAP
firstBatchCardCount: 4
energyBatchCardCount: 5
dataLifecycleBatchCardCount: 4
macroTargetSourceCardCount: 1
customMacroInputShapeCardCount: 1
macroDisplayRoundingCardCount: 1
hardStopRecordAvailabilityCardCount: 1
draftedCardCount: 17
firstBatchSelfReviewPassed: true
energyBatchSelfReviewPassed: true
dynamicModelEvidencePassed: false
dataLifecycleBatchSelfReviewPassed: true
chinaSupportCopyDraftComplete: true
healthReviewGovernanceDraftComplete: true
healthReviewPacketReady: true
requiredHealthReviewArtifactCount: 9
requiredHealthReviewItemCount: 13
healthReviewerAssigned: false
reviewerQualificationVerified: false
healthReviewStarted: false
healthContentApproved: false
contentQaPassed: false
firstThreeBatchesIndependentReviewPacketReady: true
requiredIndependentReviewCardCount: 13
requiredIndependentReviewDomainCount: 4
requiredCrossBatchInvariantCount: 12
independentReviewersAssigned: false
reviewerIndependenceVerified: false
independentReviewStarted: false
firstThreeBatchesIndependentReviewPassed: false
chinaMacroCurrentStandardEvidenceComplete: true
d063ChinaReferenceBandEvidenceReady: true
d063CardSelfReviewPassed: true
d063D068D069PrerequisitesPassed: false
d063HealthContentApproved: false
d063IndependentReviewPassed: false
d063OwnerReady: false
d070CardSelfReviewPassed: true
d070D063Accepted: false
d070NumericHealthBoundsApproved: false
d070IndependentReviewPassed: false
d070OwnerReady: false
d071CardSelfReviewPassed: true
d071D063D070Accepted: false
d071NumericHealthBoundsApproved: false
d071IndependentReviewPassed: false
d071OwnerReady: false
d072CardSelfReviewPassed: true
d072D068D069PrerequisitesPassed: false
d072HealthContentApproved: false
d072IndependentReviewPassed: false
d072OwnerReady: false
dynamicModelSourceAssessmentComplete: true
dynamicModelEvidencePassed: false
dynamicModelOptionOwnerReady: false
d068OwnerReady: false
d069OwnerReady: false
next: CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED
formulaEvidenceReviewComplete: true
formulaChoiceResolved: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
formalImplementationAuthorized: false
```
