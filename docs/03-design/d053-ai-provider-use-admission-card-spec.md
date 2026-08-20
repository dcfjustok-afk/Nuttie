# D-053 第三方 AI Provider 数据用途准入选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D053-AI-PROVIDER-USE-ADMISSION-CARD-001` |
| 决定 | `D-053 / CANDIDATE / REGISTERED` |
| 关联阻断 | `D039-PX5-B05 / OPEN` |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / OI07_PROVIDER_EVIDENCE_REQUIRED / APP_PRIVACY_MAPPING_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-20（Asia/Shanghai） |
| Owner intake | 决定候选已在台账；没有 D-053 响应，未排期、未展示、未收集选择 |
| 授权 | Provider 准入、真实网络、Owner 评审、Owner 选择、决定接受、B05 关闭和正式实现均为 `false` |

## 1. 这张卡补齐什么

D-053 已作为权威候选登记，并固定“未接受时所有 Provider/载荷为 `UNKNOWN/BLOCKED`”以及“Apple 明确禁项不可由 Owner 豁免”。现有 AI policy harness 已证明本地裸 `ALLOW`、HTTPS 可达或用户主动点击都不能生成发送资格，但旧 A/B/C 摘要没有形成可比较的完整准入政策包，也没有固定 Provider 身份、产品/套餐、地区、载荷、证据有效期、App Privacy 和隐私政策一致性。

本卡只决定第三方 Provider 对数据的用途是否可准入，不重复决定：

- D-033 的逐次第三方 AI 披露与显式许可；
- D-034 的输入、响应、内存和临时磁盘预算；
- D-036 的 URL、origin、redirect、session、cache、cookie 和 credential 隔离；
- D-031 的本地媒体/AI 历史保留；
- Provider 的模型质量、价格或可用性。

所有方案共同遵守：

- 准入对象必须是精确 `provider legal entity + API product/plan + origin + model family + payload class + region + evidence revision`，不能把品牌名或“OpenAI-compatible”当成全局授权。
- 用户的 API key、HTTPS 连通、D-033 同意、Provider 自述 `ALLOW` 或本地调用方断言都不是 Provider 运营真相，也不能填补未知的保留、训练、人工访问、删除或二次用途。
- 广告、营销、跟踪、数据经纪、与本次健康管理服务无关的画像/数据挖掘，以及通用模型训练，不能由 Owner 或用户同意豁免为 Nuttie 的允许用途。
- 数据用途、产品条款、隐私政策、账户设置、subprocessor、地区、载荷或 App Privacy 映射变化时，旧准入立即失效；失败必须发生在读取 key、生成 Authorization 或序列化敏感 body 之前。
- `UNKNOWN`、`DENY`、`EXPIRED`、证据冲突、无法确认实际 API 产品条款、无法证明删除/撤回路径或 App Privacy 不一致时，保持本地草稿和手工出口，网络字节为 0。

## 2. 宿主原生卡合同

```text
decisionId: D-053
questionId: d053_ai_provider_use_admission
header: AI Provider 准入
question: 在逐 Provider 证据与 App Privacy 映射完成后，首版应采用哪套第三方 AI 数据用途准入政策？
```

只有 OI-07、逐 Provider 证据、App Privacy/隐私政策映射和独立复核全部完成后，宿主卡才可使用以下稳定 `optionId`。当前推荐不是默认答案。

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `documented_compatible_use_only` | 仅证据相容才准入（推荐） | 只允许所有必填事实明确且满足固定用途标准的 Provider/载荷/地区组合；未知立即阻断。最可审计，但可用 Provider 最少、复核维护成本持续存在。 |
| 2 | `provider_specific_residual_risk_review` | 逐 Provider 接受残余风险 | Apple 不可豁免项仍严格阻断；对已知、有限、记录完整的保留期、人工访问、删除 SLA、subprocessor/跨区残余逐项复核并由 Owner 单独接受。兼容面较大，但不能整批授权，复核频率更高。 |
| 3 | `user_consent_broad_admission` | 用户同意广泛准入 | 历史方案允许用户自行配置并同意任意 OpenAI-compatible HTTPS Provider。配置最自由，但同意不能证明用途或覆盖 Apple 禁项；当前在独立政策/法律复核证明可行前不得进入 Owner 卡。 |

宿主自动提供的 `Other` 只收集待规范化意见。任何“key 是用户自己的，所以无需披露”“HTTPS 即可信”“由用户承担全部政策责任”或“Owner 可豁免广告/训练用途”的意见必须拒绝，不能直接登记为 accepted。

## 3. A `documented_compatible_use_only`

每个准入组合必须同时满足：

1. Provider 法律实体、API 产品/套餐、目标 origin、模型范围、账户数据控制、适用地区和载荷类别都有官方且当前的证据；consumer chat 条款不能替代 API 条款。
2. 保留为 `NONE` 或有精确期限、目的、备份/日志范围和终态删除说明的 `BOUNDED`；`UNBOUNDED/UNKNOWN` 阻断。
3. Nuttie 载荷及派生内容不得用于通用模型训练或服务外模型改进；默认设置、账户级 opt-out 和实际套餐必须一致。`ALLOWED/UNKNOWN` 阻断。
4. 人工访问为禁止，或仅限履行请求、安全/滥用调查和用户发起支持的窄用途，并有角色、审计、保密与保留边界；一般质量评审、训练标注或未知人工访问阻断。
5. 有可执行的删除/撤回机制、范围和 SLA，能覆盖请求正文、附件、响应、日志和适用备份；`UNAVAILABLE/UNKNOWN` 阻断。
6. 广告、营销、tracking、data broker、跨服务画像和与本次健康管理功能无关的数据挖掘均明确禁止。
7. Provider 与 subprocessors 对共享数据提供不低于 Nuttie 隐私政策和 Apple 要求的保护；地区/跨境路径、接收方和用途可追踪。
8. App Privacy 与应用内隐私政策已按实际第三方伙伴、数据类型、链接性、用途和保留事实完成映射；若 Provider 只处理请求且不构成 Apple 定义下的“收集”，也必须保留支持该判断的证据，不能默认省略披露。

准入窗口最长 90 天，并以官方条款生效/失效日、账户设置变化或 app 新版本中最早发生者为上限。到期前未复核即转 `EXPIRED/BLOCKED`，不静默沿用。

## 4. B `provider_specific_residual_risk_review`

B 保留 A 的身份绑定、Apple 禁项、训练/广告/无关用途阻断、第三方显式许可、App Privacy 一致性和 key/body 前失败关闭，但允许对以下**已知且有界**残余风险逐组合评审：

- 明确的有限保留期与备份删除延迟；
- 为安全、滥用调查或用户支持而发生的有限人工访问；
- 已列明的 subprocessors、处理地区与跨境路径；
- 删除请求的有限 SLA、服务连续性日志和灾备残留；
- 合同/隐私政策中可解释但比 A 更宽的服务改进用途，前提是不得形成通用模型训练、广告、营销、跟踪、数据经纪或与用户健康管理无关的数据挖掘。

每个残余项必须有 severity、受影响载荷、地区、期限、缓解措施、用户披露、隐私/安全 reviewer 结论和 Owner 单独的 profile-specific 接受记录。一个 Provider 的接受不能复制到另一产品、套餐、origin、模型、地区或 payload class。真实未知项仍阻断，Owner 只能接受已知风险，不能接受“以后再查”。

B 的准入窗口最长 30 天，并在每次 app 发布、Provider 条款/设置变化、subprocessor 变化或 reviewer 指定日期时提前失效。Owner 接受残余风险不等于接受 D-033/D-034/D-036，也不授权真实网络或正式实现。

## 5. C `user_consent_broad_admission`

C 的历史目标是让用户输入任意 OpenAI-compatible HTTPS Provider，并以应用内披露和逐次同意承担选择。但在当前政策事实下：

- 用户同意只能满足“是否愿意发送”的一部分，不能证明 Provider 实际保留、训练、人工访问、删除、广告/营销或 subprocessor 行为。
- Nuttie 仍对第三方 AI 分享、隐私政策、App Privacy 和第三方伙伴的保护负责，不能把责任完全转给 BYOK 用户。
- 任意 Provider 的未知用途无法形成充分且具体的披露，也不能通过本地自我声明生成 Provider 真相。
- Apple 明确禁项继续不可豁免；若要让 C 可执行，必须先由独立政策/法律复核给出一套不依赖未知事实的合规机制，并重写本卡后再展示。

因此 C 当前是完整的历史对照包，但 `ownerOptionReady=false`。这不是替 Owner 选择 A/B，而是避免呈现一个表面可选、实际不能合法执行的按钮。若独立复核确认 C 永远不可行，PM 应保留审计记录并提交只含合规可执行选项的 superseding card，不能静默删除历史方案。

## 6. 十维 Provider 证据合同

每个 profile 必须覆盖以下稳定维度，缺一即 `UNKNOWN`：

| evidenceDimensionId | 必须证明 |
| --- | --- |
| `legal_entity_and_api_product` | 法律实体、API 产品/套餐、账户类型、官方联系和适用合同，不用 consumer 页面代替 |
| `terms_privacy_effective_version` | terms/privacy/DPA 或等价官方来源、抓取时间、生效日、离线快照 SHA-256 和变更监测 |
| `retention_and_backup` | 正文、附件、响应、metadata、日志、缓存、备份的期限、目的与终态 |
| `training_and_model_improvement` | 默认/可选训练、服务改进、标注、opt-out 及对实际账户/套餐是否生效 |
| `human_access` | 谁、为何、何时可访问，角色控制、审计、保密和用户支持边界 |
| `deletion_revocation_and_sla` | 删除/撤回入口、身份验证、范围、SLA、备份/日志例外和失败路径 |
| `advertising_marketing_tracking_broker` | 广告、营销、跨服务 tracking、data broker、画像和数据挖掘用途 |
| `health_data_use_and_repurpose` | 是否仅履行本次用户请求，是否可能转作其他产品、研究、保险或一般分析 |
| `subprocessors_regions_and_transfers` | subprocessors、处理/存储地区、跨境路径、再转委托与地区差异 |
| `app_privacy_and_policy_mapping` | Nuttie App Privacy、隐私政策、应用内披露、D-033 内容与实际 Provider 数据流逐项一致 |

证据来源只能是安全 HTTPS 官方 URL、签名/可验证文件或保存了来源、时间与 SHA-256 的离线快照。营销博客、模型回答、社区帖子、连通测试、API key、截图无来源或调用方一句“已确认”都不能单独支持 `ALLOW`。

## 7. payload、地区和 profile 状态

首版至少分别评估以下 payload class：

```text
nutrition_label_photo
meal_photo
meal_text
trend_summary
guidance_context
```

一类允许不推导其他类允许；去 EXIF、裁剪、摘要或去标识也不自动取消健康/用户内容属性。地区至少绑定用户选择/发布实际覆盖和 Provider 条款适用地区；无法确定地区时阻断。

profile 状态只允许：

- `ALLOW`：所选政策包全部条件满足且证据、配置、地区、载荷、时间一致；
- `DENY`：存在不可接受用途、明确禁项或 reviewer 否决；
- `UNKNOWN`：事实缺失、冲突、产品/套餐不明或映射未签署；
- `EXPIRED`：超过窗口、来源变化或任一绑定 revision 失效。

只有未来 D-053 被 Owner 接受后，`ALLOW` 才可能成为发送门禁的一个必要条件；它仍不是充分条件。当前所有 profile 固定 `UNKNOWN/BLOCKED`。

## 8. App Privacy、隐私政策和用户控制

- 发布前必须从实际 Provider 数据流判断 Apple 定义下哪些数据由 Nuttie 或第三方伙伴“收集”、是否 linked、用途为何，并保持 App Store Connect 回答最新；不能仅按“本地优先”描述整个 app。
- 隐私政策必须列出 Nuttie 收集/发送的数据、用途、第三方接收方类别、同等保护、保留/删除以及撤回/删除请求路径。Provider-specific 细节可通过应用内 policy profile 补充，但不能与公开政策冲突。
- D-033 的确认页必须显示实际第三方、数据类别、用途、host/model 和单次发送动作；D-053 `ALLOW` 不能替代该明确许可。
- 用户撤回、Provider 删除请求或配置移除后，未来请求立即阻断；对已发送数据只能按 Provider 证据描述可请求的删除范围，不能宣称 Nuttie 已从第三方删除。
- App Privacy 与隐私政策映射必须由产品、隐私/安全和发布责任人签署；当前没有 App Store Connect record，也没有完成映射。

## 9. 现有 harness 的使用边界

`tools/ai-policy-harness.mjs` 当前是 `SPIKE / LOCAL_ONLY / NON_PRODUCTION`，其 `CALLER_POLICY_ASSERTION_NOT_PROVIDER_TRUTH` 与 `D053_NOT_AUTHORIZED` 边界继续有效。它能防止裸 `ALLOW` 越级，但不能在 D-053 接受后直接改一个字段变成生产授权证据，因为：

- 当前 risk 枚举没有完整表达精确保留期、有限人工访问、subprocessor、跨境、账户设置和 App Privacy 映射；
- 当前 profile 是调用方声明，不读取或验证 Provider 官方事实；
- 当前授权 evidence 精确冻结 `CANDIDATE / NOT_AUTHORIZED`；
- 当前没有真实网络、Keychain、body、正式 Provider API、E2E 或 Release 抓包。

未来实现必须根据 Owner 选择建立新的版本化 schema、生成/签署职责、吊销/过期机制与 corpus，并保持旧 V1 evidence 失败关闭。

## 10. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 三包差异、Provider 可用面、复核成本、失效频率与本地出口可比较；C 的不可执行风险显式化 | OI-07、目标 Provider、Owner 选择和真实可用性未完成 |
| Privacy / Security | `PASS_WITH_GATE` | 第三方 AI 披露、不可豁免用途、十维证据、同等保护、App Privacy 和旧 harness 边界明确 | 独立政策/安全复核、Provider 真相、隐私政策和发布签署未完成 |
| Data integrity | `PASS_WITH_GATE` | profile 精确绑定、ALLOW/DENY/UNKNOWN/EXPIRED、revision 失效、key/body 前阻断和零业务写入已固定 | 正式 schema/store、签署/吊销、时间源、E2E 与网络证据未授权 |
| QA / Accessibility | `PASS_WITH_GATE` | 五类 payload、地区/套餐变化、过期/冲突、撤回和稳定本地出口已列出 | Owner 卡文案、VoiceOver/Dynamic Type、App Privacy UI 与 Release 抓包未完成 |

这是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不是独立复核。D-053 仍是已登记但未接受的 candidate；`D039-PX5-B05` 继续 `OPEN`。

## 11. 官方事实与推荐边界

- Apple [App Review Guidelines 5.1.2(i)](https://developer.apple.com/app-store/review/guidelines/) 要求在向包括第三方 AI 在内的第三方分享个人数据前，清楚披露分享位置并取得明确许可；同一指南的隐私政策要求覆盖数据用途、第三方同等保护、保留/删除和撤回路径。
- 同页 5.1.3(i) 对健康、健身和医疗情境数据限制广告、营销及与健康管理无关的用途型数据挖掘；这些边界不能由普通 Owner 风险接受替代。
- Apple [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) 要求理解自己与第三方伙伴对每类数据的实际用途、linked/tracking 状态；“只为服务请求且不超过处理所需时间保留”是否构成 collection 取决于实际数据流，因此必须以 Provider 证据判断。
- Apple [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy) 要求 App Store Connect 回答包含第三方伙伴实践并保持准确、最新。

这些官方资料定义审查边界，不替 Nuttie 选择 A/B，也不证明任何 Provider 已相容。A 是内部推荐；在 OI-07 与逐 Provider 真相缺失时，推荐本身不生成 `ALLOW`。

## 12. 当前门禁

```text
D-053 decisionState: CANDIDATE
registeredInDecisionLedger: true
cardState: DRAFT_COMPLETE
selfReviewPassed: true
oi07Complete: false
providerEvidencePassed: false
appPrivacyMappingSigned: false
broadConsentOptionOwnerReady: false
independentReviewPassed: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
providerAdmissionRecords: 0
allProviderPayloadProfiles: UNKNOWN/BLOCKED
D039-PX5-B05: OPEN
remainingOpenBlockerCount: 5
realNetworkRequests: 0
formalImplementationAuthorized: false
```
