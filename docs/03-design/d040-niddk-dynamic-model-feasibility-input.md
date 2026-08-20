# D-040 NIDDK 动态模型采用可行性输入

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NIDDK-DYNAMIC-MODEL-FEASIBILITY-INPUT-001` |
| 范围 | D-062 `validated_dynamic_change_model` 与 D-059 `model_native_numeric_pal` 的采用前置 |
| 状态 | `RESEARCH_COMPLETE / ADOPTION_EVIDENCE_NOT_PASSED / NOT_OWNER_READY` |
| 核验时间 | 2026-08-20（Asia/Shanghai） |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| 结论 | 模型身份、方程和当前网页代码表面可定位；许可澄清、稳定版本、产品保护线、官方 oracle corpus、回归容差与具名健康评审均未关闭 |
| 授权 | 将源码入库或 vendoring、执行远端模型代码、D-062 Owner 展示、公式实现、正式工程与发布均为 `false` |

## 1. 结论

NIDDK Body Weight Planner 是可以继续研究的候选模型来源，但当前不能成为 Nuttie 首版动态增减重模型：

- NIDDK 已公开模型研究页、2011 年论文和同行评审方程附录，可以定位模型家族与科学语境；
- 当前网页会从 NIDDK 域名直接加载七个与模型/控制器有关的 JavaScript 资产，2026-08-20 只读 HTTP 核验已记录字节数与 SHA-256；
- 这些资产没有逐文件许可证、发布版本或 changelog；HTTP 元数据只证明当前可获取内容，不能充当稳定软件发行版；
- NIDDK 通用版权页说明多数站点信息可自由下载和复制，但同时列明例外，并要求存疑时联系；该通用说明不足以替代产品代码采用所需的明确复用结论；
- 在本次核验的一手材料中未找到版本化官方输入/输出测试向量、跨实现 oracle corpus 或数值回归容差；网页当前结果不能自行升级为规范测试集；
- 官方工具自己的年龄、PAL、最低能量与 BMI 文案边界不能直接成为 Nuttie 的中国大陆产品保护线。

因此，本工件只把“动态模型采用缺什么”变成可验证清单。`dynamicModelSourceAssessmentComplete=true`，但 `dynamicModelEvidencePassed=false`、`dynamicModelOptionOwnerReady=false`；D-062 的动态模型项和 D-059 的数值 PAL 项继续从 Owner 卡中排除。

## 2. 一手来源与可证明事实

| 来源 | 可证明事实 | 不能证明 |
| --- | --- | --- |
| [NIDDK 模型研究页](https://www.niddk.nih.gov/research-funding/at-niddk/labs-branches/laboratory-biological-modeling/integrative-physiology-section/research/body-weight-planner) | 模型研究归属 Hall 团队；要求引用 2011 年论文；链接完整方程附录；页面最近评审为 2025-02 | 当前网页代码的独立软件许可、语义版本或 Nuttie 采用授权 |
| [Hall 等 2011 论文](https://pubmed.ncbi.nlm.nih.gov/21872751/) | 论文身份、DOI `10.1016/S0140-6736(11)60812-X` 与成人动态能量失衡研究 | 当前网页实现与论文逐行等价，或对 Nuttie 个体结果作保证 |
| [NIDDK 方程附录](https://www.niddk.nih.gov/-/media/Files/BWP/Hall_Lancet_Web_Appendix.pdf) | 给出成人动态体重模型方程、参数语境，并说明曾用未参与开发的人体喂养研究验证 | 网页当前代码版本、完整 UI 保护线、产品适用性或可执行测试 corpus |
| [Body Weight Planner](https://www.niddk.nih.gov/bwp) | 当前工具要求年龄、公式分支、身高、体重、PAL、目标体重/时间；仅供 18+ 成人，排除未成年人、孕期与哺乳期 | Nuttie 可以采用 `PAL 1.6`、`1000 kcal/day`、BMI 提示或任何默认值 |
| [NIDDK Copyright](https://www.niddk.nih.gov/copyright) | 多数站点信息通常可复制并要求署名；存在联合赞助、第三方图形等例外；编辑内容不得暗示背书，存疑需联系 | 七个 JavaScript 资产具有明确 OSI 软件许可证，或修改后可直接随 App 分发 |
| [NIDDK Disclaimers](https://www.niddk.nih.gov/disclaimers) | 内容是公共摘要，不替代专业医疗建议；NIDDK 不背书商业产品 | Nuttie 获得医学批准、政府背书或个体诊疗能力 |

研究页还展示另一个加入专利跟踪/反馈技术的 `Personalized Body Weight Management System` 可许可项目。它与基础 Body Weight Planner 不是同一个采用结论，本工件不把该许可邀约外推为“基础网页代码必然受同一许可约束”，也不反向推导“基础网页代码无需澄清”。

## 3. 当前网页代码表面

下表来自 2026-08-20 对 `https://www.niddk.nih.gov/bwp/` 页面实际引用资产的只读 GET。未把源码写入仓库、未 vendoring、未执行模型代码，也没有向模型提交任何用户数据。

| NIDDK 相对路径 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `services/baseline.js` | 8,447 | `67aee491c02ccfcf68a417ce1839cae47f1fa422855c95590c12815e6aa18c76` |
| `services/bodychange.js` | 422 | `fc574dc5fba715850679f73b01d2acd391a42e0e4c52722fd3757e256229699c` |
| `services/bodymodel.js` | 10,291 | `6656bfd2190f3acf9e0225e051ff7fe305bec9f25510da9dc0a3926967be245b` |
| `services/dailyparams.js` | 8,553 | `245fa691ebf3ce01de846cae50d570649a9eacfd76e506d95d85400e16013d0f` |
| `services/intervention.js` | 6,333 | `769c118685f541f0517eee0724d8e9817de7d2635404a95dbb7bf8116d6a9144` |
| `constants/constants.js` | 1,446 | `20434e365f42ae238b43c24911795bc54d87bae545bbd51313424ab9559a586e` |
| `controllers/appController.js` | 59,460 | `4cc3627c24f2eb2fed34de67ee70373a48a2a513618105eeab2984ac0df1d67d` |

七个响应在核验时都返回 `200`、`Content-Type: text/javascript`，并呈现相同的 `Last-Modified: Fri, 07 Aug 2026 15:09:31 GMT` 与 `ETag: "19277913"`。这些值只建立某次可重复取证的观察点：

- 相同 ETag 不等于七个不同文件具有相同内容；
- `Last-Modified` 不等于发布版本，也没有固定依赖图、签名或归档承诺；
- 页面可变更，未来若继续研究必须重新抓取 manifest；
- 只有 hash、没有明确许可证和来源归档策略，不能满足 vendoring 门禁。

## 4. 产品边界不能从官方工具默认值继承

| 官方工具可见行为 | Nuttie 当前处理 |
| --- | --- |
| 成人定义为 18+ | Nuttie 已有更严格的 19+ 候选边界时保持更严格；不得自动放宽到 18 岁 |
| 排除未成年人、孕妇和哺乳期用户 | 继续保持硬停止；不代表慢性病、用药或进食障碍风险已获得规则 |
| PAL 常见范围 `1.4–2.5`、默认 `1.6` | 只记录为该工具 UI 事实；D-059 不显示默认 PAL，不夹取、不跨模型映射 |
| 低于 `1000 kcal/day` 时阻断 | 只记录为该工具产品保护线；不得作为 Nuttie 通用临床安全线或中国大陆规则 |
| 低/高 BMI 警示 | 不授权 Nuttie 诊断、评分、转诊或把 BMI 单独用作模型适用性判断 |
| 百分比不确定性、碳水与钠等高级输入 | 不自动扩大 Nuttie D-040 字段、持久化或健康声明范围 |

Nuttie 若以后选择动态模型，必须独立定义并评审 `productGuardrail`，同时记录来源、版本、适用人群、触发结果、用户文案和失败关闭测试。网页默认值只能帮助发现需要哪些问题，不能直接回答这些问题。

## 5. 测试与可追溯缺口

当前可定位论文验证语境，但仍缺少能让移动端实现通过的产品级证据：

1. **规范版本缺失。** 必须选择确切方程集和代码来源，记录其版本、hash、依赖和变更策略。
2. **许可结论缺失。** 必须由具名责任人确认是独立重实现、经许可复制，还是停止采用；通用网页版权说明不能自动代签。
3. **官方 oracle corpus 缺失。** 至少覆盖两个公式分支、边界年龄、PAL 边界、体脂已知/未知、维持、增重、减重、不同目标时间、活动变化、低能量和 BMI 警示。
4. **回归容差缺失。** 每个输出字段须定义单位、时间步、舍入位置、允许误差和平台一致性；只比较网页可见整数不够。
5. **保护线与本地化缺失。** 需具名中国大陆健康评审人批准适用人群、硬停止、用户文案和支持资源。
6. **实现独立复核缺失。** 未来 Spike 必须证明没有把网页 UI 默认值当模型常量，没有网络依赖或隐式用户数据发送，并与锁定 oracle 做跨实现复测。

在这些条件全部通过前，不创建本地模型实现、不抓取远端代码入库、不从网页批量生成测试答案，也不把研究完成误写成模型验证通过。

## 6. 对 D-059 / D-062 的影响

| 决定项 | 当前结果 |
| --- | --- |
| D-062 `maintenance_only_manual_or_no_goal_for_change` | 继续保留为当前推荐；这只是卡片推荐，不是 Owner 选择 |
| D-062 `validated_dynamic_change_model` | 完整选项定义保留在内部规格中，但 `ownerOptionReady=false`，不得进入 Owner 卡 |
| D-059 `model_native_numeric_pal` | 与动态模型共同保持隐藏；不得显示 `1.6` 默认值 |
| D-057 NASEM / Mifflin | 不受此工件授权；仍按各自维持 EER / REE 信息边界和独立评审门禁处理 |

## 7. 当前机器事实

```text
D-040 decisionState: CANDIDATE
authoritativeState: PX-0_INPUT_GAP
dynamicModelSourceAssessmentComplete: true
observedPublicCodeAssetCount: 7
publicCodeAssetHashesRecorded: true
explicitPerFileSoftwareLicenseFound: false
stableSemanticReleaseFound: false
officialVersionedOracleCorpusFound: false
regressionToleranceDefined: false
productGuardrailsApproved: false
healthReviewerAssigned: false
dynamicModelEvidencePassed: false
dynamicModelOptionOwnerReady: false
niddkSourceCodeVendored: false
niddkRemoteCodeExecuted: false
ownerIntakeChanged: false
ownerCardScheduled: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
formulaImplementationAuthorized: false
formalImplementationAuthorized: false
next: CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED
```
