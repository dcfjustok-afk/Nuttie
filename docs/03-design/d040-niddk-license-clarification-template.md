# D-040 NIDDK 动态模型许可澄清模板

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-NIDDK-LICENSE-CLARIFICATION-TEMPLATE-001` |
| 状态 | `DRAFT_READY / NOT_SENT / RESPONSE_NOT_RECEIVED / NOT_OWNER_READY` |
| 适用范围 | D-062 `validated_dynamic_change_model` 与 D-059 `model_native_numeric_pal` 的许可证据前置 |
| 冻结研究输入 | `b5c16332ac42437b019383bff4b93733d0a729fe` / blob `15b1a664e1db490697eaa85d8fd56b0f5e7af174` |
| 权威状态 | D-040 仍为 `CANDIDATE / PX-0_INPUT_GAP` |
| 当前许可路径 | NIH Technology Transfer `TAB-2436 / E-160-2012-0`，`Prototype / Licensing` |
| 当前边界 | 官方路径已定位，但七项资产覆盖、逐文件许可、稳定版本和 oracle 均未确认 |
| 外联状态 | 未发送消息、未提交表单、未接受条款或费用 |

## 1. 用途

本模板只为以后获得明确外联授权的责任人准备一份最小、可归档、不会扩大用途的澄清清单。它不代表 Nuttie 已决定联系 NIH，不代表 NIH 已答复，也不是许可、法律意见、健康批准、Owner 选择或实现授权。

如果 Owner 或获授权责任人未来决定发起澄清，必须基于本模板生成独立的请求记录，并在发送前重新核对官方联络入口。不得直接把模板正文、网页通用版权页或技术转移目录摘要当成许可证明。

## 2. 必须绑定的目标资产

以下观察点来自 2026-08-20 的只读网页取证。澄清必须逐项回答，不能只笼统写“Body Weight Planner code”。

| 序号 | NIDDK 相对路径 | 观察字节数 | 观察 SHA-256 | 当前覆盖状态 |
| ---: | --- | ---: | --- | --- |
| 1 | `services/baseline.js` | 8,447 | `67aee491c02ccfcf68a417ce1839cae47f1fa422855c95590c12815e6aa18c76` | `UNCONFIRMED` |
| 2 | `services/bodychange.js` | 422 | `fc574dc5fba715850679f73b01d2acd391a42e0e4c52722fd3757e256229699c` | `UNCONFIRMED` |
| 3 | `services/bodymodel.js` | 10,291 | `6656bfd2190f3acf9e0225e051ff7fe305bec9f25510da9dc0a3926967be245b` | `UNCONFIRMED` |
| 4 | `services/dailyparams.js` | 8,553 | `245fa691ebf3ce01de846cae50d570649a9eacfd76e506d95d85400e16013d0f` | `UNCONFIRMED` |
| 5 | `services/intervention.js` | 6,333 | `769c118685f541f0517eee0724d8e9817de7d2635404a95dbb7bf8116d6a9144` | `UNCONFIRMED` |
| 6 | `constants/constants.js` | 1,446 | `20434e365f42ae238b43c24911795bc54d87bae545bbd51313424ab9559a586e` | `UNCONFIRMED` |
| 7 | `controllers/appController.js` | 59,460 | `4cc3627c24f2eb2fed34de67ee70373a48a2a513618105eeab2984ac0df1d67d` | `UNCONFIRMED` |

请求中必须同时说明：这些是某次公开网页观察值，不声称是发布版本、最新文件、完整依赖图或 NIH 提供的稳定归档。

## 3. 必须取得的澄清

### 3.1 资产与权利主体映射

对七项资产逐一确认：

1. 是否属于 `TAB-2436 / E-160-2012-0`；若否，属于哪个技术、版权主体或第三方；
2. 是否含第三方代码、联合赞助内容、受限图形或其他不能由 NIDDK 单独许可的部分；
3. 回答适用的是当前观察 hash、某个版本、某个日期区间，还是全部后续版本；
4. 能否提供可归档的正式许可文本、协议编号、政策条款或明确的“不适用”说明。

### 3.2 允许动作

逐项回答下列动作，禁止用一个不带范围的“可以使用”代替：

| 动作 | 必需答案 | 缺失时处理 |
| --- | --- | --- |
| 下载和保存源码副本 | `ALLOWED / NOT_ALLOWED / OUT_OF_SCOPE` + 条款引用 | 阻断 vendoring |
| 修改源码 | 同上 | 阻断派生代码 |
| 随 App 分发源码或二进制 | 同上，并说明个人自用、测试分发、商业分发差异 | 阻断任何分发 |
| 从已发表方程独立重实现 | 同上，并说明是否受专利、协议或其他限制 | 阻断独立实现采用结论 |
| 生成或保存网页输入/输出 oracle | 同上，并说明自动化访问和归档边界 | 阻断 corpus 生成 |
| 引用论文、模型名称和来源 | 同上，并给出署名文本 | 阻断正式产品署名 |

### 3.3 条款与持续治理

至少明确：

- 费用、地域、期限、使用领域、设备/用户范围、转授权和终止条件；
- 署名、NOTICE、版权声明、商标/logo 和不得暗示 NIH/NIDDK 背书的要求；
- 是否存在版本化发行、归档 URL、changelog、签名或 hash manifest；
- 当前网页更新后，旧版本能否继续使用，还是必须重新取得许可；
- 是否存在官方版本化输入/输出向量、验证 corpus、参考实现或建议回归容差；
- 答复人的组织、授权范围、答复日期和可复核的官方来源。

## 4. 对外请求前置

只有以下字段全部存在，才允许责任人另行创建“待发送请求候选”；模板自身永远不能发送：

```text
authorizationRecordId
authorizedBy
authorizedAt
authorizedChannel
authorizedPurpose
approvedRecipientOrganization
approvedOfficialRoute
approvedAssetCount = 7
approvedQuestionSections = [ASSET_MAPPING, ALLOWED_ACTIONS, TERMS_AND_GOVERNANCE]
personalOrHealthDataIncluded = false
credentialsIncluded = false
commercialCommitmentAuthorized = false
```

缺少任一字段时保持 `NOT_AUTHORIZED_TO_CONTACT`。即使允许发送澄清，也不自动允许接受条款、支付费用、签署协议、下载材料、联网执行模型或改变产品计划。

## 5. 正式答复记录最小 schema

未来若收到真实答复，必须保存答复原文或可验证引用，并建立以下结构；只把人工摘要写入 ProjectOps 不足以关闭门禁：

```text
responseId
receivedAt
sourceChannel
requestRecordId
respondingAuthority.organization
respondingAuthority.name
respondingAuthority.role
respondingAuthority.authorityScope
respondingAuthority.officialReference
technologyTransferId
technologyEId
assets[7].path
assets[7].observedSha256
assets[7].coverageDisposition
assets[7].rightsHolder
assets[7].thirdPartyComponents
assets[7].allowedActions
assets[7].termsReference
independentReimplementationDisposition
oracleGenerationDisposition
attributionRequirements
endorsementAndLogoRestrictions
feesTerritoryTermAndField
versionAndUpdatePolicy
officialOracleAvailability
attachments[].artifactId
attachments[].sha256
verifiedBy
verifiedAt
verificationNotes
```

`respondingAuthority`、附件、签署和来源核验必须由具名责任人完成；AI/Agent 只能检查结构，不能冒充答复人、法律审查人或授权人。

## 6. 失败关闭处置

| 处置 | 条件 | 对 D-059/D-062 的影响 |
| --- | --- | --- |
| `CLARIFICATION_NOT_AUTHORIZED` | 没有外联授权 | 继续隐藏动态模型与数值 PAL 选项 |
| `CLARIFICATION_INCOMPLETE` | 有答复但资产、动作、条款、权威性或附件不完整 | 继续阻断，不从沉默推导允许 |
| `USE_NOT_PERMITTED` | 明确不允许目标动作 | 停止对应采用路径；是否研究替代方案另立任务 |
| `LICENSE_EVIDENCE_CANDIDATE` | 七资产、动作、条款和权威性结构完整 | 只进入独立许可/安全/产品复核，不自动 Owner-ready |
| `INDEPENDENT_REIMPLEMENTATION_EVIDENCE_CANDIDATE` | 只确认独立重实现路径 | 仍需版本、oracle、容差、保护线和健康评审 |

任何候选处置都必须再通过具名责任人和独立复核；不得把“许可联系人存在”“个人自用”“公开可访问”“美国政府网站”或“论文公开”当作自动允许复制、修改、分发或产品采用。

## 7. 当前机器事实

```text
templateReady: true
targetAssetCount: 7
technologyTransferRecordFound: true
technologyTransferId: TAB-2436
technologyEId: E-160-2012-0
developmentStatus: PROTOTYPE
collaborationRoute: LICENSING
currentSevenAssetsCoverageConfirmed: false
explicitPerFileSoftwareLicenseFound: false
stableSemanticReleaseFound: false
officialVersionedOracleCorpusFound: false
licensingClarificationAuthorized: false
licensingClarificationRequested: false
responseReceived: false
externalMessagesSent: 0
formsSubmitted: 0
commercialTermsAccepted: false
niddkSourceCodeVendored: false
niddkRemoteCodeExecuted: false
dynamicModelEvidencePassed: false
dynamicModelOptionOwnerReady: false
ownerIntakeChanged: false
ownerReviewAuthorized: false
formulaImplementationAuthorized: false
formalImplementationAuthorized: false
next: EXTERNAL_CONTACT_AUTHORIZATION_OR_ALTERNATIVE_MODEL_RESEARCH_REQUIRED
```

## 8. 自审与授权边界

| 自审域 | 结果 | 说明 |
| --- | --- | --- |
| 范围 | `PASS` | 精确绑定七资产、技术编号和问题范围 |
| 隐私安全 | `PASS` | 禁止用户/健康数据、凭据和自动联网 |
| 许可中立性 | `PASS_WITH_GATE` | 不预设允许或禁止；正式结论依赖真实权威答复和具名复核 |
| QA | `PASS_WITH_GATE` | 回执 schema 与失败关闭处置已定义；尚无真实答复可验证 |

本模板不改变任何决定、Owner intake、PX、Gate、健康内容或实现状态。未经另行授权，不得使用[官方技术转移条目](https://www.techtransfer.nih.gov/tech/tab-2436)的联络信息发送消息或提交表单。
