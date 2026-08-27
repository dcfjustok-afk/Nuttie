# D-040 D-068/D-069 非诊断边界独立复核包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001` |
| 版本 | `PACKET-001-R1` |
| 范围 | D-068 慢性病/用药非诊断输入；D-069 估算不确定性表达 |
| 状态 | `PACKET_READY / REVIEWER_ASSIGNMENT_REQUIRED / REVIEW_NOT_STARTED / NOT_OWNER_READY` |
| 日期 | 2026-08-27（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP / D068_D069_HEALTH_REVIEW_CONTENT_QA_AND_INDEPENDENT_REVIEW_REQUIRED` |
| 授权 | 不指派复核人、不启动复核、不批准健康内容、不通过 Content QA、不提交 Owner、不授权实现 |

## 1. 目的

本包把 D-040 中 D-068/D-069 两张“非诊断边界”内部卡整理成可交给独立复核人的最小材料集。它只定义复核范围、输入清单、处置标准和失败关闭规则，不产生正式复核结论。

复核目标是确认：

1. D-068 不把慢性病、用药或“不确定”处理成诊断、治疗、风险筛查或自动目标许可。
2. D-069 不把群体公式误差、模型不确定性或验证证据解释成个人健康上下限。
3. 两张卡在缺少具名健康批准、Content QA、独立复核、D-063/D-070 接受和动态模型采用证据时保持 `NOT_OWNER_READY`。
4. 本地 harness 只验证调用方数据和结构，不替代现实证据、签署、Owner 选择或实现授权。

## 2. 必读输入

| 序号 | 工件 | 用途 |
| --- | --- | --- |
| 1 | [d040-non-diagnostic-boundary-card-spec.md](d040-non-diagnostic-boundary-card-spec.md) | D-068/D-069 两卡的候选选项、推荐项、适用条件、NOT_APPLICABLE 和失败关闭语义 |
| 2 | [d040-china-support-health-review-input.md](d040-china-support-health-review-input.md) | 中国大陆支持资源、候选健康文案、12356/120 边界与健康评审前置 |
| 3 | [d040-china-health-reviewer-intake-packet.md](d040-china-health-reviewer-intake-packet.md) | 具名健康评审人、资质、逐条签署、90 天周期与独立 Content QA 门禁 |
| 4 | [d040-question-allocation.md](d040-question-allocation.md) | D-040 20 个决定轴、D-054~D-072 预留 ID、依赖顺序和全局不变量 |
| 5 | [d040-energy-model-batch-card-spec.md](d040-energy-model-batch-card-spec.md) | D-057/D-059/D-060/D-061/D-062 自动能量与增减重路径依赖 |
| 6 | [d040-macro-target-source-card-spec.md](d040-macro-target-source-card-spec.md) | D-063 宏量目标来源与 D-068/D-069 前置关系 |
| 7 | [d040-custom-macro-input-shape-card-spec.md](d040-custom-macro-input-shape-card-spec.md) | D-070 自定义宏量输入形态与健康数值边界缺口 |
| 8 | [../04-engineering/testing/d040-non-diagnostic-boundary-card-harness.md](../04-engineering/testing/d040-non-diagnostic-boundary-card-harness.md) | 17 项本地 fail-closed validator 的算法覆盖和零副作用边界 |

这些输入的可读链接不等于内容已被复核；正式复核仍必须由获授权、具名且独立的复核人基于冻结输入逐项签署。

## 3. 复核域

| 复核域 | 必须确认 | 不得确认 |
| --- | --- | --- |
| Product Decision Quality | D-068/D-069 各自只改变一个行为轴；选项互斥；推荐项、Other、NOT_APPLICABLE 和依赖条件不会冒充 Owner 选择 | 不得把推荐项标成默认值、Owner 选择、PX-1/PX-2 完成或 D-040 可提交 |
| Health Safety | 慢病、用药、不确定和进食障碍风险都失败关闭；支持文案仍等待具名健康批准与 Content QA | 不得诊断、治疗、给出医疗建议、转诊承诺、个人误差上下限或健康安全 PASS |
| Privacy / Data Integrity | 当前仅允许最小化选择值和版本化来源；诊断名称、药物详情、健康自由文本、定位、通讯录、HealthKit、自动拨号和联网刷新均关闭 | 不得授权健康资料持久化、资源自动更新、联系人读取、位置读取或自动拨打 |
| QA / Accessibility | 稳定 questionId/optionId、适用/跳过、YES/UNSURE、数值不确定性和失败关闭路径可测试 | 不得把本地 harness 通过当成正式 UI、VoiceOver、Dynamic Type、真机或 Release 证据 |

## 4. 两卡逐项处置要求

| decisionId | 复核问题 | 允许处置 |
| --- | --- | --- |
| `D-068` | 慢性病/用药/不确定是否始终不会产生自动能量、减重或宏量目标的越权行为？ | `APPROVE_SPEC_CANDIDATE`、`CHANGES_REQUIRED`、`REJECT_SPEC`、`NOT_REVIEWED` |
| `D-069` | 估算不确定性是否不会变成个人预测区间、健康风险区间、治疗建议或安全上限？ | `APPROVE_SPEC_CANDIDATE`、`CHANGES_REQUIRED`、`REJECT_SPEC`、`NOT_REVIEWED` |

`APPROVE_SPEC_CANDIDATE` 只表示规格候选可进入后续门禁材料，不表示健康批准、Content QA PASS、Owner-ready、Owner 选择或实现授权。任一卡为 `CHANGES_REQUIRED`、`REJECT_SPEC` 或 `NOT_REVIEWED` 时，D-068/D-069 均不得进入 Owner intake。

## 5. 跨卡不变量

1. `UNSURE` 不得被规范化为 `NO_RISK`、`NO_CONDITION` 或等价无风险状态。
2. 用户自述慢病、用药或进食障碍风险时，自动减重和宏量目标路径必须暂停或失败关闭。
3. 不得收集诊断名称、药物名称、剂量、处方、病历、检查结果、医生身份或健康自由文本。
4. 不得读取定位、通讯录、HealthKit、Provider、App Store Connect、凭证或网络资源。
5. 不得自动拨打 `12356`、`120` 或任何外部号码；支持资源只能是经批准的离线文案候选。
6. D-069 的数值不确定性只能在模型、样本、适用人群、指标和文案证据都已具名批准后显示；当前必须不可用。
7. 群体误差、RMSE、MAPE、置信区间或验证结果不得转换为个人健康上下限或安全边界。
8. `NOT_APPLICABLE` 只是由上游选择触发的条件跳过，不是 Owner 对 D-068/D-069 的选择。
9. 本地 harness 的 synthetic fixture 只验证算法；不得作为现实证据、签署、复核或 PASS。
10. 复核包、输入清单、机器合同或 validator 就绪都不得写入 Owner intake、改变 `project-ops/decisions.json`、关闭 PX-0 或授权正式实现。

## 6. finding 分级

| 等级 | 定义 | 关闭要求 |
| --- | --- | --- |
| `P0` | 诊断/治疗/医疗建议、个人健康上下限、自动拨号、健康数据持久化、联网刷新、Owner/PX/实现越权 | 必须改规格或合同；关闭前不得进入 Owner-ready |
| `P1` | 不确定状态、慢病/用药、进食障碍风险、数值不确定性或 NOT_APPLICABLE 语义可被误解为开放自动目标 | 必须改规格或测试；关闭前不得进入 Owner-ready |
| `P2` | 选项互斥、依赖、Other 归一化、文案归属、引用、边界或测试覆盖不完整 | 必须有明确处置；可进入下一轮复核但不得 Owner-ready |
| `P3` | 非阻断的措辞、索引、可读性、示例或说明改善 | 必须有 owner、到期时间和后续跟踪 |

任一开放 `P0/P1/P2` 都阻断 D-068/D-069 Owner-ready。开放 `P3` 不阻断继续复核，但不能被隐藏或冒充已关闭。

## 7. 当前零授权状态

```text
reviewerAssigned: false
reviewerIdentityVerified: false
reviewerCompetenceVerified: false
reviewerIndependenceVerified: false
reviewerSignatureVerified: false
independentReviewStarted: false
independentReviewPassed: false
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
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
healthCopyImplementationAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
```

## 8. 下一步

下一步只能在获得明确授权后选择其一：

1. 由授权联系人提供具名独立复核候选人、身份/胜任/独立性/利益冲突材料和联络授权；
2. 为本包追加本地回执机器合同与 fail-closed validator，继续只验证调用方数据和零授权边界；
3. 等待具名健康评审人与独立 Content QA 进入正式流程。

在这些条件满足前，本包保持 `PACKET_READY / REVIEWER_ASSIGNMENT_REQUIRED / REVIEW_NOT_STARTED / NOT_OWNER_READY`。
