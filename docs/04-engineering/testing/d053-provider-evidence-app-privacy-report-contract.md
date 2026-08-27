# D-053 Provider 证据与 App Privacy 报告机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D053-PROVIDER-EVIDENCE-APP-PRIVACY-REPORT-CONTRACT-001` |
| 对应协议 | `D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001 / D053-PROTOCOL-R001` |
| OI-07 前置 | `OI07-PROVIDER-TARGET-INTAKE-TEMPLATE-001`；必须复用 D-036/D-053 同一 revision |
| 对应决定 / 阻断 | `D-053 / CANDIDATE`；`D039-PX5-B05 / OPEN` |
| 当前状态 | `CONTRACT_READY / OI07_REQUIRED / NO_PROVIDER_EVIDENCE / NO_MAPPING / NO_ADMISSION` |

## 1. 目的与边界

[D-053 Provider 用途证据与 App Privacy 映射协议](d053-provider-evidence-app-privacy-protocol.md)已经固定三家 Provider、五类 payload、十个证据维度、至少五行 App Privacy 映射、失效规则和具名复核要求。本合同把这些约束冻结为未来报告生成器与本地 validator 的唯一 JSON 输入，防止遗漏 Provider/payload、合并维度、把 URL 当成证据、用用户同意覆盖未知事实、复用过期快照、伪造签署或把部分覆盖率解释为准入。

合同与 validator 只处理调用方传入的普通数据树。它们不读取 OI-07 文件、Provider 页面、离线快照、受控合同、App Store Connect、隐私政策、签名或复核回执，不访问网络、凭据或用户数据，也不创建证据、报告、准入记录或发送许可。

## 2. 顶层 bundle 与冻结身份

输入版本为 `D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_INPUT_V1`，顶层只允许：

```text
schemaVersion
reportId
recordKind
protocolIdentity
oi07Intake
oi07IntakeResult
matrixScope
providerTargets[]
sourceSnapshots[]
conflicts[]
admissionProfiles[]
dimensionAssessments[]
appPrivacyMappingRows[]
privacyPolicyMappings[]
d033DisclosureMappings[]
policyPackageComparisons[]
signatures[]
independentReviewRefs[]
findings[]
expiryAndChangeMonitoring
overallDisposition
generatedAt
reportSha256
containsRealUserData = false
containsCredential = false
containsProviderBody = false
containsRestrictedContract = false
```

`reportId` 使用 `D053-REPORT-RNNN`。`recordKind` 只能为 `FORMAL_EVIDENCE_REPORT` 或 `SYNTHETIC_CONTRACT_FIXTURE`。`reportSha256` 对删除自身后的完整 bundle 做 key 排序规范 JSON SHA-256；数组保留协议顺序。

`protocolIdentity` 精确绑定：

```text
protocolId = D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001
protocolRevision = D053-PROTOCOL-R001
protocolArtifactCommit = d6e72dd449c8de8b385b6f9e6427cb0fd99f7ce7
protocolArtifactBlobOid = d422ad302e8d2c32fc9184557bf5f458693ceaad
protocolArtifactSha256 = 30ca6cb9e4c4878f1fb761fdd571f29a449d582a058dd9142200da0e60e3fe84
sourcePacketVersion = PACKET-001-R1
sourceCardCommit = 6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117
sourceCardBlobOid = d406e17c8e7b0e11218a8907e757a603df01e465
sourceCardSha256 = 9c1cc88d34ec116f2825d6a71dd580ac8c625d99b30c87a8a06cf7086b894caf
```

这些身份仍是调用方声明；validator 不读取 Git 或文件系统验证对应字节。

## 3. OI-07 与固定矩阵

`oi07Intake` 必须通过既有 OI-07 validator，`oi07IntakeResult` 必须与输入重算结果逐字段一致。正式报告只有在 `d053IntakeContractComplete=true` 且 authority metadata 完整时才可能结构完整；这不证明现实 Provider、账户控制或输入授权。

正式 `matrixScope` 精确为：

```text
providerSlots = [P1, P2, P3]
payloadClasses = [nutrition_label_photo, meal_photo, meal_text,
  trend_summary, guidance_context]
evidenceDimensionIds = [legal_entity_and_api_product,
  terms_privacy_effective_version, retention_and_backup,
  training_and_model_improvement, human_access,
  deletion_revocation_and_sla, advertising_marketing_tracking_broker,
  health_data_use_and_repurpose, subprocessors_regions_and_transfers,
  app_privacy_and_policy_mapping]
policyPackages = [A, B, C]
requiredAdmissionProfileCount = 15
requiredDimensionAssessmentCount = 150
requiredPolicyPackageComparisonCount = 45
appPrivacyMappingRowMinimum = 5
applePolicySourceCount = 3
```

`providerTargets` 按 P1/P2/P3 排列，每项绑定 OI-07 revision、D-053 所需法律实体/API/套餐/origin/model/地区/账户控制字段和完整 target fingerprint。它不能包含 key、账户号、个人联系人或受限合同正文。

`SYNTHETIC_CONTRACT_FIXTURE` 必须使用 Provider、payload 和维度集合的非空真子集，且来源只能标为 `SYNTHETIC_CONTRACT_SOURCE`。它只验证算法，永远保持 `INCONCLUSIVE`，不能登记为证据报告。

## 4. 来源快照、冲突与十维评估

每份 `sourceSnapshots` 记录 `evidenceId`、target fingerprint、来源种类、公开 URL 或安全位置引用、最终 URL、HTTP 状态、观察/生效/失效时间、适用套餐/地区、规范快照 SHA-256、claim IDs、supersede 关系、重放状态和自身 fingerprint。正式来源只允许官方公开 HTTPS、受控签名引用或规范离线快照；`CALLER_ASSERTED_REPLAYABLE` 仍不等于 validator 已读到快照字节。

冲突不能通过删除旧证据或主观优先级消失。`conflicts` 必须绑定双方证据与 claim；开放冲突会使所有引用它的维度和 profile 固定为未知。已处置冲突需要 resolver 引用、处置时间和摘要 SHA-256，但 resolver 身份仍未由 validator 核验。

`dimensionAssessments` 按 profile、再按十维协议顺序完整排列。每项固定状态：

- `SUPPORTED_COMPATIBLE`
- `SUPPORTED_INCOMPATIBLE`
- `UNKNOWN`
- `EXPIRED`

每项还必须有理由摘要、证据/冲突引用、评估和失效时间、风险处理及完整 fingerprint。相容或不相容结论必须引用同一 Provider target 的来源；`SUPPORTED_INCOMPATIBLE` 的风险处理只能为 `NON_WAIVABLE` 或 `BOUNDED_RESIDUAL`，其余状态只能为 `NONE`。到 `generatedAt` 已过期的记录必须是 `EXPIRED`。

## 5. Profile、映射与 A/B/C 比较

每个 `admissionProfiles` 精确对应一个 Provider × payload，绑定 target、地区、来源、冲突、App Privacy/隐私政策/D-033 映射、复核引用、候选政策包、失效时间、派生 disposition 和 fingerprint。正式报告必须恰好 15 个；一个 profile 的证据不能复制成另一个 Provider、payload、地区、套餐、origin 或 model 的结论。

App Privacy 行逐项记录 transmitted element 摘要、数据来源、Apple 候选/最终类型、第三方 target、collection/linked/tracking 三项独立判断及依据、purposes、保留/删除摘要、隐私政策/choices/D-033 引用、profile 引用和三角色签名引用。正式报告至少覆盖五类 payload；映射决定未知、引用不一致或缺少签署时，相应 profile 不能成为 A/B candidate。

`privacyPolicyMappings` 与 `d033DisclosureMappings` 每个 profile 各一项，必须和 App Privacy 行、来源及三角色签名交叉绑定。签名角色固定为 `PRODUCT / PRIVACY_SECURITY / RELEASE`；签名只保存稳定 signer ref、签署工件摘要、方法和时间，不保存联系方式、证件或签名原文。validator 始终标记签名为 caller-asserted。

`policyPackageComparisons` 对每个 profile 按 A/B/C 各一项：

- A 只有十维全相容、无开放冲突、映射完整签署且未过期时才是 `A_COMPATIBLE_CANDIDATE`；
- B 只有无不可豁免事实，且每个 `BOUNDED_RESIDUAL` 都由 P3 finding 的责任人、期限和非阻断理由承接时才是 `B_REVIEWABLE_CANDIDATE`；
- C 永远为 `C_NOT_OWNER_READY`，用户同意不能填补未知事实或 Apple 禁项；
- 其余按证据派生为 `DENY_BY_DOCUMENTED_FACT`、`UNKNOWN_EVIDENCE_GAP_OR_CONFLICT` 或 `EXPIRED_REASSESSMENT_REQUIRED`。

profile disposition 必须与其 `candidatePolicyPackage` 对应的比较结果一致；C 不能成为 profile candidate。

## 6. 失效、finding 与总体结果

A profile 最长 90 天，B 最长 30 天；C 无有效窗口。`expiryAndChangeMonitoring` 固定协议要求的 12 类 change trigger、监控证据引用和 `failBeforeCredentialRead=true / gracePeriodAllowed=false`。任何 target、来源、账户控制、payload schema、D-033、D-034、D-036、App Privacy、隐私政策、App Store Connect 或发布范围变化都要求重新评估。

finding 使用 P0~P3、profile/assessment/mapping/conflict 引用、状态、责任人、期限和摘要 SHA-256。开放 P0/P1/P2 强制总体 `FAIL`；开放 P3 必须有责任人、期限和非阻断理由，并只能承接明确的 B 有界残余风险。

总体只允许：

- `EVIDENCE_REVIEW_REQUIRED`：正式矩阵与三套比较完整、OI-07 完整、所有来源/冲突/映射/签署/失效关系结构成立且没有未知、过期或开放 P0/P1/P2；它仍不是 PASS；
- `FAIL`：存在开放阻断 finding、映射冲突或内部声明与可重算结果矛盾；
- `INCONCLUSIVE`：OI-07、覆盖、来源、重放、评估、映射、签署或复核证据不完整，且没有更高优先级 FAIL。

本地结果固定为 `STRUCTURALLY_VALIDATED_REPORT_ONLY`，并始终保留 `SOURCE_SNAPSHOTS_CALLER_ASSERTED_NOT_VERIFIED`、`SIGNATURES_CALLER_ASSERTED_NOT_VERIFIED`、`INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED`、`D053_NOT_AUTHORIZED` 和 `PROVIDER_ADMISSION_NOT_GRANTED`。

## 7. 资源、安全和零授权边界

validator 在业务校验前拒绝 accessor、symbol、特殊对象、cycle、过深节点、超长字符串和超大数组；之后执行精确字段、枚举、协议顺序、唯一性、交叉引用、所有聚合与多层 SHA-256 重算。明显的 key/token、Bearer、Authorization/password/secret/cookie、个人邮箱、用户或 Provider 正文、带敏感 query 的 URL、合同账号或受限合同正文触发 `UNSAFE_D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT`，错误不得回显 canary。

规范化复制并深冻结输入。结果只输出 schema、报告 ID、计数、disposition、blocker、fingerprint 和关闭边界，不回显 Provider 名称、URL、claim、签名人、finding 摘要或映射正文。

`D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_BOUNDARY_V1` 固定所有文件/快照/签名/Provider/App Store Connect/网络/凭据/业务读写与外部消息为 0；OI-07 现实完整、Provider 事实核验、证据采集、映射签署、独立复核、Owner 评审、D-053 接受、Provider 准入、B05 关闭、真实网络和正式实现均为 false。

在 OI-07、Provider targets、获授权来源采集、快照、公开隐私政策/App Store Connect、具名三角色签署、独立复核和 Owner 决定到位前，只允许继续维护合同与本地 validator；不得创建假证据、假签名、假 reviewer、`ALLOW` 或准入 PASS。
