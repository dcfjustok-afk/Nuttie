# D-040 中国健康评审人交接与签署检查包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001` |
| 状态 | `PACKET_READY / REVIEWER_UNASSIGNED / REVIEW_NOT_STARTED / NOT_APPROVED` |
| 适用范围 | D-040 中国大陆健康内容与模型边界；D-068、D-069、D-063 的前置健康评审 |
| 非目标 | 指定评审人、验证真实资质、作出健康批准、代替 Content QA、选择 Owner 方案或授权实现 |
| 当前门禁 | `CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED` |

## 1. 用途与当前结论

本检查包把已经形成的研究、候选文案、标准证据和模型限制整理成可交给真实健康专业人员的统一入口。项目现在可以发起评审，但尚未获得任何评审结果：

- `ChinaQualifiedHealthReviewer` 仍未具名，资质与胜任范围未核验；
- 六条简中文案、特殊人群停止推导、慢性病/用药处理、估算不确定性和中国宏量参考带都尚未获健康批准；
- Content QA 必须由另一个责任步骤完成，不能由健康评审签署自动代替；
- PM、Owner、Codex/AI、Agent ID 或仅有角色名称都不能被记录为具名健康评审人；
- 本包准备完成不改变 D-068/D-069/D-063 的 `NOT_OWNER_READY`，也不允许实现或发布文案。

## 2. 评审人准入材料

项目接收评审前，至少需要以下可核验信息。身份证号、家庭住址、私人联系方式等与资质核验无关的信息不得进入仓库。

| 字段 | 要求 | 仓库记录方式 |
| --- | --- | --- |
| `reviewerName` | 真实姓名，不接受别名、角色名或 Agent ID | 可记录 |
| `qualificationType` | 与医生、医疗卫生、临床营养或相关健康评审职责相符的专业资质类型 | 可记录 |
| `qualificationIssuer` | 发证或执业登记机构 | 可记录 |
| `qualificationReference` | 可复核的公开查询引用，或受控证据的非敏感引用/hash | 不提交秘密或完整证件扫描 |
| `qualificationValidAt` | 证明审查日期处于有效期/有效执业状态 | 可记录核验结论和日期 |
| `competenceScope` | 与成人体重、营养、慢性病/用药风险或心理支持文案相关的胜任范围 | 由评审人声明并由项目核验 |
| `localeAndRegionFit` | 能审查 `zh-Hans-CN` 和中国大陆服务语境 | 明确 `PASS/FAIL` 与理由 |
| `conflictOfInterest` | 披露与产品、模型、Provider、医疗机构或推荐资源的相关利益 | 记录声明；有冲突时由 ReleaseOwner 决定是否更换评审人 |
| `reviewerContactRef` | 供复核人联系的受控引用 | 仓库只保留非敏感引用，不公开个人联系方式 |

任何一项缺失时，状态保持 `REVIEWER_UNASSIGNED` 或 `QUALIFICATION_NOT_VERIFIED`，不得开始可计入门禁的正式评审。

## 3. 必读工件清单

评审人必须基于同一版本的完整输入，不得只看截图、单条文案或二手摘要。

| 顺序 | 工件 | 评审重点 |
| ---: | --- | --- |
| 1 | [中国支持文案与健康评审治理输入](d040-china-support-health-review-input.md) | 12356/120 用途、六条文案、停止推导、支持称谓、90 天与即时失效 |
| 2 | [PX-0 输入研究](d040-px0-input-research.md) | NASEM EER、Mifflin REE、特殊人群、慢性病/用药、不确定性边界 |
| 3 | [第一批选择卡](d040-first-batch-card-spec.md) | 年龄、年龄来源/表示、公式分支与拒答 |
| 4 | [能量模型选择卡](d040-energy-model-batch-card-spec.md) | 维持 EER、REE≠每日目标、活动缺失、动态模型失败关闭 |
| 5 | [NIDDK 动态模型可行性输入](d040-niddk-dynamic-model-feasibility-input.md) | 来源可定位但许可、稳定版本、oracle corpus、容差和保护线未通过 |
| 6 | [宏量证据](d040-macronutrient-evidence.md) | AMDR/DRI、4/4/9、减重场景与特殊人群非处方边界 |
| 7 | [中国宏量标准输入](d040-china-macronutrient-standard-input.md) | WS/T 578.1-2017 现行状态、健康成人参考带、禁止默认/评分/纠正 |
| 8 | [数据生命周期选择卡](d040-data-lifecycle-batch-card-spec.md) | 健康输入不等于永久保存，历史不回算，删除和 provenance 边界 |
| 9 | [问题分解与顺序](d040-question-allocation.md) | D-068/D-069 先于 D-063 宏量批次，全部仍是预留 ID |

ProjectContentOwner 在交接时必须记录每个工件的 Git commit、文件 SHA-256 或等价不可变引用。评审期间任一工件语义变化，都必须生成新 `packetVersion` 并让受影响条目重新评审。

## 4. 必答评审问题

评审人必须逐项给出 `APPROVE / APPROVE_WITH_REQUIRED_CHANGE / REJECT / OUT_OF_SCOPE`，不能只给总评“没问题”。`OUT_OF_SCOPE` 必须说明需要哪类其他专业人员。

### 4.1 人群与停止推导

1. 普通成人自动维持能量的候选适用边界是否足够保守、可被非专业用户理解？
2. 未成年人、孕期、哺乳期、已确诊/正在治疗或主动自述进食障碍风险的硬停止是否存在遗漏或误伤？
3. 慢性病、用药=`有/不确定` 时暂停自动估算、保留手工/无目标记录，是否需要额外区分而又不让 App 诊断？
4. 是否存在不应由一个通用问题覆盖、必须另立专业路径的情形？
5. App 不从其他资料推断健康状态、公式分支或风险，这一边界是否完整？

### 4.2 模型与数值语义

1. NASEM 2023 EER 只用于体重稳定候选、Mifflin 只显示 REE 信息的命名是否准确？
2. 活动未知不补默认 PAL、不夹取、不从 HealthKit/步数推断，是否为可接受失败关闭？
3. NIDDK 动态模型采用证据未通过时完全隐藏对应 D-062/D-059 选项，是否需要其他保护说明？
4. 群体误差指标不得冒充个人区间；若未来展示模型指标，需要哪些限定文字？
5. 中国宏量参考带只作带版本的健康成人参考信息、不生成默认比例、处方、评分或自动纠正，是否准确？

### 4.3 支持资源与文案

逐条检查 `COPY-D040-ND-01` 至 `COPY-D040-ND-06`：

- 是否准确表达非诊断、非治疗、非紧急救援？
- 停止自动数字后是否仍清楚说明无目标日记和手工目标出口？
- `12356` 是否始终明确为心理援助，不被暗示为医疗急救或进食障碍专线？
- `120` 是否只出现在急危重症/紧急医疗救援语境，且不声称 App 能判断、定位或救援？
- “医生或医疗卫生专业人员”“健康体重管理门诊或相关科室”是否适合当前场景？
- 是否需要增加、删除或重写某条文案；变化会不会扩大触发、诊断或转诊含义？

## 5. 逐条签署表

每个 `copyId` 和每个边界主题都必须有独立结果。可复制下表到正式评审记录，但不得预填批准。

| itemId | 当前状态 | 评审结果 | 必改内容/理由 | 证据引用 | 阻断 Release |
| --- | --- | --- | --- | --- | --- |
| `COPY-D040-ND-01` | `PENDING` |  |  |  |  |
| `COPY-D040-ND-02` | `PENDING` |  |  |  |  |
| `COPY-D040-ND-03` | `PENDING` |  |  |  |  |
| `COPY-D040-ND-04` | `PENDING` |  |  |  |  |
| `COPY-D040-ND-05` | `PENDING` |  |  |  |  |
| `COPY-D040-ND-06` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-AGE` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-PREGNANCY-LACTATION` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-EATING-DISORDER-RISK` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-CHRONIC-MEDICATION` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-EER-REE` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-DYNAMIC-MODEL` | `PENDING` |  |  |  |  |
| `BOUNDARY-D040-CHINA-MACRO` | `PENDING` |  |  |  |  |

空白、口头同意、聊天中的表情或只签总评都不能转成 `APPROVED`。

## 6. 正式评审记录最小 schema

```text
reviewId
packetId = D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001
packetVersion
reviewerName
qualificationType
qualificationIssuer
qualificationReference
qualificationVerifiedAt
qualificationValidAt
competenceScope[]
localeAndRegionFit
conflictOfInterest
reviewedArtifactRefs[]
itemDispositions[]
blockingFindings[]
nonBlockingFindings[]
overallDisposition
reviewedAt
reviewDueAt
signatureMethod
supersedesReviewId
```

约束：

- `overallDisposition=APPROVED` 只有在 13 个条目都有明确结果、`blockingFindings=[]`、资质有效且无未处置利益冲突时成立；
- `APPROVE_WITH_REQUIRED_CHANGE` 在改动完成并 delta 复核前仍是阻断；
- 健康批准只证明受审内容在受审版本内可进入下一步，不选择 D-068/D-069/D-063 的产品方案；
- `reviewDueAt` 不得晚于 `reviewedAt + 90 days`，每个 Release 仍须重新核对一手来源；
- 任何公式、触发、资源号码、用途、专业称谓或安全语义变化立即使相关条目失效；
- 仓库只记录必要的资质引用和核验事实，不存放秘密、证件原件或无关个人数据。

## 7. Content QA 是独立门禁

健康批准后仍需 Content QA 验证：

1. 六个 copy ID 在所有适用/不适用/错误/返回状态中不会串位；
2. 12356 与 120 的名称、用途、动作和 VoiceOver 文本不互换；
3. Dynamic Type、VoiceOver、键盘/焦点和 320pt 小屏不会截断停止条件或号码用途；
4. 离线、无定位、无自动拨号、无分析上报、无“已救援/已转诊”记录；
5. 资源过期或签署缺失时新 Release 失败关闭；
6. 手工/无目标出口始终可达，失败或取消保持资料/目标零写入。

Content QA 的执行人、设备、构建、case ID、结果和时间必须另行记录。健康评审人可以提出 QA 要求，但不能用健康签名替代实际 QA 证据。

## 8. 发起评审的只读消息草案

以下仅供项目在获得联系人和外部联络授权后使用；本工件不发送消息。

```text
主题：Nuttie D-040 中国大陆健康内容与估算边界评审

我们希望请你以具名健康评审人的身份，审查随附版本化材料中的：
1) 非诊断和特殊人群停止推导；
2) 慢性病/用药与不确定回答；
3) NASEM EER、Mifflin REE、动态模型失败关闭；
4) 中国宏量参考带的非处方用途；
5) 12356/120 与六条简中文案。

请先提供可核验的专业资质、胜任范围与利益冲突声明，再按检查包逐条给出
APPROVE / APPROVE_WITH_REQUIRED_CHANGE / REJECT / OUT_OF_SCOPE。
本次评审不要求你选择产品方案，也不会自动授权实现或发布。
```

## 9. 准入结果与授权边界

```text
reviewPacketReady: true
requiredArtifactCount: 9
requiredReviewItemCount: 13
copyReviewItemCount: 6
boundaryReviewItemCount: 7
qualificationFieldCount: 9
formalReviewFieldCount: 21
maximumReviewIntervalDays: 90
sensitiveCredentialDocumentsStored: false
aiOrAgentCanBeHealthReviewer: false
externalMessageSent: false
reviewerNameRecorded: false
reviewerQualificationVerified: false
conflictOfInterestResolved: false
healthReviewStarted: false
healthContentApproved: false
contentQaPassed: false
d068OwnerReady: false
d069OwnerReady: false
d063OwnerReady: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
healthCopyImplementationAuthorized: false
formulaImplementationAuthorized: false
formalImplementationAuthorized: false
packetNext: NAMED_QUALIFIED_HEALTH_REVIEWER_REQUIRED
next: CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED
```
