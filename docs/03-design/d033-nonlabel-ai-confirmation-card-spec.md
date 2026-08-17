# D-033 非标签 AI 上传确认选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D033-NONLABEL-AI-CONFIRMATION-CARD-001` |
| 决定 | `D-033 / CANDIDATE` |
| 关联阻断 | `D039-PX5-B05 / OPEN` |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-17（Asia/Shanghai） |
| Owner intake | 未写入；未排期、未展示、未收集响应 |
| 授权 | Owner 评审、Owner 选择、决定接受、B05 关闭和正式实现均为 `false` |

## 1. 这张卡补齐什么

D-014 已接受营养标签照片的首次说明和每次上传预览，但没有决定非标签餐食照片、自由文本描述或未来所选趋势摘要是否使用同样的逐次预览。仅有“用户主动发起”不能说明发送前应给出怎样的最后确认、配置变化后能否沿用旧确认，也不能约束取消、失败或重试。

本卡把 D-033 补为三套完整且互斥的确认频率政策包。它只决定非标签 AI 载荷的上传前确认体验，不决定 Provider 准入、资源上限、底层 transport、数据保留或 AI 结果是否能进入业务记录。所有选项共同遵守：

- 营养标签照片仍严格按已接受 D-014 执行首次说明和每次独立预览；D-033 不能缩小、替代或把它推广为已经获准的所有 AI 上传。
- 每一次实际发送都必须是当前用户任务中的明确操作。App 不得后台预取、自动重试、队列重放、因页面恢复而继续发送，或把一次确认当作会话级、账号级或永久授权。
- 确认只可绑定一个不可变的本地发送主体：任务类型、非标签载荷类别、用户可见的实际内容或范围、规范化 HTTPS origin/host、model、配置 revision、资源预算 revision 和 payload 指纹。任一项改变、任务离开、进程重启、取消、失败、超限或 policy 阻断都会使确认失效。
- 预览或就地发送信息必须向用户显示实际 host、model、所发送的类别与范围；不得显示占位 Provider 名称、旧配置、key、Authorization、完整内部路径或未选择的本地内容。图片预览显示本次派生副本，文本/摘要显示将发送的文字或可审计范围，而不是只显示笼统的“使用 AI”。
- D-034、D-036、D-053 任一项未授权或证据不匹配时，AI 入口固定为 `BLOCKED`。确认 UI 不能绕过 Provider 数据用途、资源预算、origin/redirect/session 或 `AITransport` 边界，也不得建立真实请求。
- 未确认的输入、确认 token、Provider 原始响应和失败正文均不成为业务历史；临时内容的清理和持久媒体范围继续由 D-031、D-034、D-036 约束。用户确认 AI 候选与“确认上传”是两个独立动作。

这里的“非标签载荷”只包括现有候选范围：餐食照片、用户输入的文本描述和未来由用户选择的本地趋势摘要。视频、定位、后台采集、HealthKit、自动档案拼接、远程图片或未获批准的新载荷均不因本卡而获得发送资格。

## 2. 宿主原生卡合同

```text
decisionId: D-033
questionId: d033_nonlabel_ai_confirmation_scope
header: 非标签 AI 上传确认
question: 首版在发送餐食照片、文字描述或趋势摘要前，应提供怎样的独立确认？
```

未来若独立复核通过并获准进入 Owner 评审，宿主卡必须使用以下稳定 `optionId`。推荐标签只表达当前隐私一致性、错误恢复和 D-039 兼容性判断，不是默认答案。

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `per_request_preview_all_nonlabel_payloads` | 所有非标签载荷逐次预览（推荐） | 每次发送前都展示本次图片、文字或摘要范围以及实际 host/model，再由用户确认。边界一致、配置误配更易发现，但高频文字输入多一步。 |
| 2 | `per_request_preview_images_explicit_text_send` | 图片逐次预览，文字和摘要就地明确发送 | 图片保留独立预览；文字和摘要在当前页持续显示实际 host/model 与发送范围，以明确“发送”操作确认。录入更快，但不同载荷的确认路径不同。 |
| 3 | `d014_label_only_explicit_send_others` | 仅标签照片独立预览 | 只有 D-014 的营养标签照片进入独立预览，其他非标签任务在当前页以明确发送操作确认并持续显示 host/model。步骤最少，但用户对不同 AI 入口获得的隐私反馈最不一致。 |

宿主自动提供的 `Other` 只收集待规范化意见。PM 必须先判断它等同于现有包、需要修订 D-033，还是应拆出新的决定轴；不得直接把自由文本登记为已接受的发送授权。

## 3. 共同确认主体与失效规则

所有选项都必须先在设备内形成只读 `AIUploadReviewSubject`，再决定是否进入独立预览。它至少包含以下可显示、不可回填的字段：

| 字段 | 共同规则 |
| --- | --- |
| `taskKind` / `payloadKind` | 仅允许 `meal_photo`、`meal_text` 或经用户选择的 `trend_summary`；未知类别失败关闭 |
| `contentScope` | 图片显示本次派生副本；文本显示实际发送文字；趋势摘要显示选定日期、指标和条目范围，不能用“全部数据”替代 |
| `origin` / `model` | 显示当前配置解析出的实际 HTTPS origin/host 与 model；D-036 未冻结时不得假设 redirect 或 session 行为 |
| `configRevision` / `policyRevision` | 必须绑定当前非秘密配置证据、D-033 方案、D-034 预算、D-036 profile 和 D-053 准入状态；任一不匹配不生成发送资格 |
| `payloadFingerprint` | 绑定用户可见内容与预算内派生结果；编辑文字、换图、改变趋势范围或重新生成副本后必须重新确认 |
| `attemptId` | 只允许一次明确发送尝试；取消、失败、未知结果或返回后不可复用，也不得用作重试 token |

当用户取消、屏幕失焦后任务被替换、配置或 model 改变、payload 改变、预算检查失败、Provider policy 变为 `BLOCKED`、发送完成/失败、App 被终止或启动恢复发现旧 token 时，发送资格必须立即失效。重新进入只能基于最新主体重走各选项规定的确认步骤。

确认 UI 需支持 VoiceOver 顺序为“将发送什么、发送到哪里、model、继续发送、取消/返回”；长文本、图片说明、动态字体和错误提示不得遮蔽 host/model 或把发送操作变为默认焦点。取消始终回到本地编辑或手工录入，不写业务数据，也不发网络。

## 4. 选项 A：`per_request_preview_all_nonlabel_payloads`

- 餐食照片、文本描述和趋势摘要每一次发送前都进入独立预览页。预览页必须展示本次内容/范围、payload 类别、实际 host、model、预计资源信息和取消路径。
- 只有用户在该页选择本次“发送”才取得绑定 `attemptId` 的单次资格；从任务页直接点击、返回到预览前的旧按钮、语音快捷操作或恢复任务都不能绕过预览。
- 文字编辑、图片替换、摘要范围改变、host/model/revision 改变后，旧预览和资格均失效，必须重新显示完整最新预览。
- 成功、失败、取消、超限、policy 阻断和未知结果均使资格失效。失败可保留易失编辑输入供用户修改，但下一次尝试必须重新预览，不得自动再发。
- 该包把 D-014 标签照片与三类非标签载荷的“最后一次发送确认”统一为同一可访问的交互模型；具体文案、组件、正式路由和真机验证仍需后续授权。

## 5. 选项 B：`per_request_preview_images_explicit_text_send`

- 非标签餐食照片每次发送前使用与选项 A 相同的独立预览、单次 `attemptId` 和失效规则。
- 文字描述和趋势摘要不进入独立预览页，但在用户编辑/选择所在页面，发送操作附近必须持续显示本次文字或范围、实际 host、model 和“将发送到第三方 AI”的明确结果。该页面只允许一个清晰的当前发送操作，不能用输入完成、键盘 return、自动保存或普通导航触发。
- 就地发送同样绑定 payload/config/policy/attempt 指纹；任何编辑、范围或配置变化都要求用户再次执行明确发送操作。页面文案或上一次点击不能作为可迁移 token。
- 如当前页无法同时可靠呈现内容、目的地、model、取消和可访问读序，则该任务必须回退为选项 A 的独立预览，不能静默按较弱路径发送。
- 该包降低文本和摘要的额外步骤，但不允许把“明确按钮”弱化成只显示 Provider 名称的装饰信息。

## 6. 选项 C：`d014_label_only_explicit_send_others`

- 营养标签照片继续严格走 D-014 的独立预览；非标签餐食照片、文本描述和趋势摘要不额外进入预览页。
- 每个非标签任务仍必须在当前页显示当前内容或范围、实际 host、model 和明确的发送结果，并通过一次用户操作建立单次 `attemptId`。它不是首次说明后的默认同意，也不是后台继续发送许可。
- 配置、payload、policy、任务或结果状态变化后的失效、失败关闭、取消返回、零自动重试和 D-053 阻断仍与共同规则一致。
- 该包不允许把非标签照片伪装成营养标签照片，也不允许通过复用 D-014 token、保留旧弹窗状态或把“下一步”自动连接到 network effect 来规避较少的预览步骤。
- 该包需要特别的可用性与隐私测试，证明用户能够在发送前辨识图片/文本/摘要的实际范围和目的地；该证据完成前，未来选择 C 也不能直接授权实现。

## 7. 取消、失败与恢复矩阵

| 场景 | A | B | C |
| --- | --- | --- | --- |
| 编辑内容、换图、改摘要范围或 host/model | 旧预览/资格失效，重新预览 | 图片同 A；文字/摘要须再次明确发送 | 再次明确发送；不得沿用旧资格 |
| 发送前取消或返回 | 清除资格，保留易失编辑输入 | 同 A | 同 A |
| D-034/D-036/D-053 阻断或配置不匹配 | 不生成资格、不发请求，给出本地出口 | 同 A | 同 A |
| 超时、TLS/Provider/解析失败或用户取消请求 | 清除资格和请求临时内容；不自动重试 | 同 A | 同 A |
| 发送结果 `UNKNOWN` | 禁止新发送，按同一 `attemptId` 对账；不得复制请求 | 同 A | 同 A |
| App 终止或下次启动 | 旧 token 无效，清理/对账易失 staging | 同 A | 同 A |
| AI 候选已返回 | 上传资格已结束；候选仍须独立 review 与用户确认后才可写业务值 | 同 A | 同 A |

所有路径的遥测、调试或诊断只能记录状态码、类别、revision 和非正文指纹。不得记录文本、图片、趋势明细、key、Authorization、Provider 原始响应或由路径泄露的用户内容。

## 8. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- |
| Product | `PASS` | 三包互斥；非标签类别、用户操作、配置变化、取消、重试和 D-014 保留范围明确 | 仍需独立复核与 Owner 明确选择 |
| Privacy / Security | `PASS_WITH_GATE` | 内容/host/model 可见；单次绑定；token 不可迁移；不展示 secret；D-053 不可绕过 | D-034/D-036/D-053、Provider 证据与正式 transport 未关闭 |
| Data integrity | `PASS_WITH_GATE` | 发送确认与 AI 候选/业务提交分离；未知结果只按同一尝试对账；失败零业务写入 | 正式 attempt/schema、事务端口和持久化实现未授权 |
| QA / Accessibility | `PASS_WITH_GATE` | 三包均可产生配置漂移、取消、失败、无障碍读序、动态字体、重复点击和零网络用例 | 宿主卡、正式组件、网络捕获、VoiceOver 和真机证据未完成 |

这是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不是独立复核。D-033 仍未进入机器决定台账或 Owner intake，`D039-PX5-B05` 继续 `OPEN`。

## 9. 证据与推荐边界

- [AI transport 唯一网络边界](../04-engineering/adr/0003-ai-transport-only-network-boundary.md) 已接受用户主动发起、D-014 标签照片逐次预览和候选确认前零写入；非标签载荷范围明确留给 D-033。
- [D-033 候选决定](../04-engineering/decisions/decision-candidates.md) 已列出 A/B/C 的体验取舍，但没有完整的 token、取消、失败或配置漂移合同。
- [D-039 PX-5 实现就绪评估](../05-quality/d039-px5-dor-assessment.md) 将 D-033、D-034、D-036、D-053 共同列为 B05；本卡不使 B05 关闭。
- [Apple App Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/) 要求数据处理符合告知与同意边界。该原则不能替 Owner 决定具体确认频率，也不能证明某个 Provider 的数据用途可接受。

据此，A 的“所有非标签载荷逐次预览并确认”是当前内部推荐：它能把三类载荷和 D-014 的最后确认模型对齐，并在 host/model 或内容变化时清晰重现边界。这是团队对可发现性、隐私最小化和错误恢复的综合判断，不是已接受答案，也不授权任何发送。

## 10. 当前门禁

```text
D-033 decisionState: CANDIDATE
cardState: DRAFT_COMPLETE
selfReviewPassed: true
independentReviewPassed: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
D039-PX5-B05: OPEN
remainingOpenBlockerCount: 5
formalImplementationAuthorized: false
```
