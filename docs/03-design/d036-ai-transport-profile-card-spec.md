# D-036 AITransport URL、重定向与会话隔离选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D036-AI-TRANSPORT-PROFILE-CARD-001` |
| 决定 | `D-036 / CANDIDATE` |
| 关联阻断 | `D039-PX5-B05 / OPEN` |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / PROVIDER_COMPATIBILITY_SPIKE_REQUIRED / NATIVE_BOUNDARY_EVIDENCE_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-20（Asia/Shanghai） |
| Owner intake | 未写入；未排期、未展示、未收集响应 |
| 授权 | 真实网络、Provider 兼容结论、原生 transport、Owner 评审、Owner 选择、决定接受、B05 关闭和正式实现均为 `false` |

## 1. 这张卡补齐什么

D-004 与 ADR-0003 已接受 BYOK、HTTPS、用户主动发起和唯一 `AITransport` 网络边界，但没有决定 URL query/fragment/userinfo、3xx、cookie、cache、credential storage、session 生命周期和底层实现。旧 D-036 只有三条方案摘要，不能回答同一请求经过规范化、重定向、认证挑战、取消或 App 重启后，哪些字节可能被发送到哪个 origin，也没有把 React Native `fetch` 的能力缺口转为失败关闭证据。

本卡形成三个完整但仍未批准的候选，统一遵守：

- 只有与稳定 `CONFIGURED` 配置、D-033 单次确认、D-034 预算、D-053 Provider 准入和当前请求 subject 全部精确匹配时，调用方才可请求 transport effect；本卡自身不生成发送许可。
- 任何 Authorization、key、用户载荷、图片、趋势摘要或 Provider 响应都不得进入 URL、query、fragment、userinfo、cookie、共享 cache、共享 credential store、日志或错误文案。
- 初始请求只能使用规范化后的 HTTPS URL；实际 origin 固定为 `scheme + IDNA/小写 host + 显式有效 port`。配置、路径、query 或规则 revision 改变时，旧预检和 D-033 确认失效。
- 不使用 WebView、remote Image、浏览器 cookie 容器、后台传输或系统共享 session 加载 Provider 内容。系统 TLS server trust 失败即终止；不得静默接受自签名证书、降级 HTTP 或自定义跳过验证。
- D-053 单独决定 Provider 的保留、训练、人工访问、删除和广告/营销用途。本卡只决定 transport 行为，不得把“网络隔离通过”写成“Provider 可接收数据”。
- 任一拒绝、超时、取消、超限、认证挑战、重定向、清理失败或结果未知都保持业务数据库零写入；重试必须是新的用户动作并重新执行全部门禁。

## 2. 宿主原生卡合同

```text
decisionId: D-036
questionId: d036_ai_transport_profile
header: AI 传输隔离
question: 在三家目标 Provider 兼容与原生边界验证通过后，首版 AITransport 应采用哪套 URL、重定向和会话隔离规则？
```

未来只有兼容 Spike、原生证据和独立复核全部通过后，宿主卡才可使用以下稳定 `optionId`。当前推荐只表示优先验证顺序，不是默认答案。

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `strict_ephemeral_no_redirect` | 严格隔离（推荐先测） | 拒绝 query/fragment/userinfo 和全部 3xx；每次请求使用显式无 cache/cookie/credential storage 的前台 session。边界最容易证明，但依赖 redirect 或 query 路由的 Provider 会不兼容。 |
| 2 | `confirmed_query_same_origin_redirect` | 受控同源兼容 | 允许经展示确认的非秘密 query，并只按本地固定规则跟随同 origin 的 307/308。兼容性更高，但确认绑定、路径规则、循环和逐跳测试面显著扩大。 |
| 3 | `rn_fetch_after_native_boundary_proof` | 证明后使用 RN fetch | 只有当前精确 RN/Expo/iOS 版本能证明 redirect、credential、cookie、cache、取消和临时数据性质时才使用通用 `fetch`。实现面较小，但任何不可观测或不可控制项都会使该方案失败。 |

宿主自动提供的 `Other` 只收集待规范化意见。要求跨 origin 自动跳转、把 secret 放进 query、接受 HTTP、后台自动发送或绕过 D-053 的意见与已接受边界冲突，不能直接登记为 accepted。

## 3. 三套完整政策包

### 3.1 A `strict_ephemeral_no_redirect`

- Base URL 必须是绝对 HTTPS URL，拒绝 userinfo、query、fragment、空 host、无效/混淆 host、无效 port、反斜杠和解析后 origin 漂移；path 允许配置，但必须规范化并纳入配置指纹。
- 每个 attempt 创建 AITransport 专属前台 session；以 ephemeral 为起点，并显式设置无 URL cache、无 cookie storage、不自动设置 cookie、无 credential storage和忽略本地 cache 的请求策略。终态后取消剩余 task、invalidate session 并清理 App 控制的临时对象。
- 所有 300~399 响应均拒绝，不调用新 Location。响应不得生成候选；错误只显示稳定原因与原始已确认 host，不回显 Location、header 或正文。
- 请求禁止 `Cookie`、`Proxy-Authorization` 和 URL credential；Bearer Authorization 只在最终门禁通过后由 transport 内部加到初始已确认 origin 的一次请求，调用方不能读取或记录 header。
- 除系统 TLS server trust 外，HTTP Basic/Digest、client certificate、server trust override 或其他认证挑战均失败关闭；不从共享 Keychain/credential store 自动取凭据。

### 3.2 B `confirmed_query_same_origin_redirect`

- 保留 A 的 HTTPS、userinfo/fragment 拒绝、显式 session 隔离、无共享状态、认证挑战和清理规则。
- Base URL 可带非秘密 query，但 query 的排序/重复键/空值语义必须保留为规范化配置的一部分，并在 D-033 确认页逐项显示名称和非敏感值；禁止 key/token/auth/signature/password、用户正文、图片或其编码进入 query。无法判定是否秘密时拒绝。
- 只允许本地随 app 版本发布、绑定 Provider profile revision 的 redirect 规则；AI POST 仅可跟随 307/308，同一规范化 origin、允许 path 前缀、无 userinfo/fragment、无新增秘密 query，最多 3 跳且不得重复 URL。301/302/303、跨 origin、scheme/port 改变、相对路径逃逸和无匹配规则全部拒绝。
- 每一跳都重新执行 URL、origin、path、query、预算和 header 断言。Authorization 与 body 只在全部逐跳检查通过后交给下一请求；不得依赖平台默认 redirect 自动转发。
- redirect 规则或 Provider profile revision 变化会使旧配置证据、D-033 确认和 request authorization 全部失效；运行中收到未知 Location 不弹出“继续”并携带原 body 临时放行。

### 3.3 C `rn_fetch_after_native_boundary_proof`

- 产品语义目标仍与 A 相同：query/fragment/userinfo 和全部 3xx 拒绝、无 cookie/cache/credential 持久化、无后台发送、终态清理；“使用 fetch”不降低这些结果要求。
- 在精确 RN、Expo、iOS 和网络实现版本上，必须证明手动拒绝 redirect、`credentials: omit` 等价行为、cookie/cache/credential 隔离、认证挑战、取消、流式上限、临时数据、App kill/restart 和 header 处理均可由正式产物控制与观测。
- 只要任一能力依赖未验证的默认行为、公开文档声明不支持、Debug/Release 不一致或无法稳定自动化，C 即为 `NOT_VIABLE`，不得用“实现最少”覆盖缺口。
- C 失败时只返回卡片重新评估；不能自动切到 A/B 或自行创建原生模块。若 A/B 需要窄 Swift/Expo Module transport，仍须 D-032 最终矩阵与正式实现授权。

## 4. URL、origin 与配置指纹

1. 解析只接受单一权威 URL parser 的成功结果；原始文本、规范化 URL、origin、path、query 规则和 profile revision 全部进入配置证据指纹。
2. host 以 parser 的 ASCII/IDNA 结果做小写比较；省略 port 时 HTTPS 规范化为 443，显式 443 与默认端口在 origin 比较中等价。IPv6 必须使用合法 bracket 形式。
3. `#fragment` 虽不会作为 HTTP request target 发送，仍因配置歧义在三方案中拒绝。userinfo 在三方案中一律拒绝。
4. IP literal、私网/本机地址、DNS 解析变化、代理/VPN 和企业 TLS 的产品支持范围尚未由既有决定批准。本卡不暗中禁止或允许；兼容 Spike 必须记录实际目标形态，出现这些需求时回到 D-036 做显式 delta 评审。
5. UI 只显示经过规范化的 host、必要 port、model 和载荷范围；不得把 key、完整 query、用户正文或重定向 Location 写入可复制诊断。

## 5. session、cache、cookie 与 credential 合同

Apple 当前文档说明 ephemeral session 不把 cache、cookie 或 credential 写入磁盘，但默认仍可使用会话内的私有内存 cache、cookie store 和 credential store。因此 A/B 不能只断言“用了 ephemeral”，还必须显式禁用对应存储并用运行证据验证。

- session 只服务单个 attempt 或一个明确受限的 attempt 生命周期；不能跨 Provider、配置 revision、用户确认或 App 启动复用。
- `urlCache=nil`、cookie storage 禁用、自动 cookie 禁用、credential storage 禁用；请求使用不读取既有 cache 的策略，Provider 响应中的 `Set-Cookie` 不进入后续请求。
- 不将 API key 注册为 URL credential，不响应 HTTP auth challenge，不把 Provider 内容交给共享图片、浏览器、WebView 或系统下载组件。
- memory buffer、response staging 和临时文件仍受 D-034；ephemeral 不等于“不会写任何文件”，显式下载或 App 自建 staging 必须独立清理。
- session invalidate、取消回执、task 终态和临时清理都要绑定 attempt ID；结果未知时先对账，禁止自动重发。

## 6. redirect 与 Authorization 泄露测试

本地可控 harness 至少覆盖：

- 300/301/302/303/304/305/307/308、缺失/重复/非法 Location、相对/绝对 URL、循环、超 3 跳、大小写/默认端口/IDNA 混淆。
- 同 origin、跨子域、跨 port、HTTPS→HTTP、userinfo、fragment、path 逃逸、新增 query、秘密 query、redirect 后方法/body 改写。
- 每个拒绝路径证明目标 server 收到请求数为 0，或仅初始已确认 origin 收到一次；未批准 origin 的 Authorization/header/body 字节为 0。
- `Set-Cookie`、401/407、Basic/Digest、代理认证、server trust/client certificate challenge、cache hit、App 前后台、取消竞态和 session invalidate。
- Debug 与 Release 分别做全进程网络捕获；除当前 attempt 的批准目标外，AI 操作期间没有额外业务请求。日志、crash buffer 和错误 UI 不含 secret、载荷或响应正文。

这些 harness 可以先在无真实用户数据的本地 fixture 上定义，但不能冒充目标 Provider 兼容、真实 iOS 原生或签名 Release 证据。

## 7. 三 Provider 兼容 Spike 门禁

OI-07 尚未提供要测试的 Provider 名称、非秘密 terms/privacy URL 或精确 endpoint 形态，所以当前不能执行真实兼容结论。进入 Owner 卡前至少选择三家目标 OpenAI-compatible Provider，并对每家记录：

- Provider/profile ID 与 revision、官方 endpoint 文档/证据日期、base URL 形态、query 要求、模型路径和预期响应模式；不记录 key。
- A/B/C 各自是否能完成无敏感 fixture 的连接、请求、取消、超时、3xx 和错误路径；HTTP trace 中 secret 使用合成值并验证未泄露。
- 是否依赖 301/302/303、跨 origin redirect、cookie、HTTP auth、持久 session、背景传输、秘密 query 或自定义 TLS。依赖已接受边界禁止项时必须标为不兼容，不能静默开例外。
- 精确 RN/Expo/iOS 版本、Debug/Release、模拟器/真机和网络捕获工具；Windows JavaScript export 不计作原生 transport 证据。

三家全部通过不是选择 A 的充分条件；它只补兼容证据。任何失败必须展示为方案代价，由 PM 与独立 reviewer 决定是否修订卡片，再由 Owner 选择。

## 8. 稳定失败原因与本地出口

| 原因族 | 触发 | 必须结果 | 用户出口 |
| --- | --- | --- | --- |
| `AI_TRANSPORT_URL_REJECTED` | URL、origin、userinfo、query、fragment 或配置指纹不合规 | 不读取 key、不构造 body、不建 task | 修改配置或使用本地手工录入 |
| `AI_TRANSPORT_REDIRECT_BLOCKED` | 3xx 不在当前政策包允许集合 | 终止，不访问 Location，不保留响应正文 | 返回配置/手工录入；显式新任务重试 |
| `AI_TRANSPORT_AUTH_CHALLENGE_BLOCKED` | 非系统默认 TLS trust 的认证挑战 | 不从共享 credential store 取值，不发送额外凭据 | 检查 Provider 配置或停止 |
| `AI_TRANSPORT_SESSION_ISOLATION_FAILED` | cache/cookie/credential/session 证据不满足 | 当前实现/profile 不可发送 | 使用本地功能；等待修订实现证据 |
| `AI_TRANSPORT_CANCELLED` | 用户取消或任务被新状态取代 | 取消 task、清理临时对象、零业务写入 | 修改后重新确认或手工录入 |
| `AI_TRANSPORT_RESULT_UNKNOWN` | 终态/清理回执丢失 | 禁止自动重发；按 attempt 对账 | 告知状态未知，回本地路径 |

网络失败不得删除用户尚未提交的本地输入；也不得把 Provider 错误正文作为诊断直接展示。

## 9. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 三包互斥；严格性、兼容性与实现成本可比较；本地出口一致 | 目标 Provider/OI-07、真实兼容结果和 Owner 选择未完成 |
| Privacy / Security | `PASS_WITH_GATE` | origin、redirect、Authorization、query、cache/cookie/credential、TLS 与日志边界明确；D-053 保持独立 | 独立安全复核、原生 session 与 Release 全进程抓包未完成 |
| Data integrity | `PASS_WITH_GATE` | 单 attempt 指纹、取消/未知结果对账、零业务写入和禁止自动重发已固定 | 正式 transport/repository、kill/restart 和清理回执未授权 |
| QA / Accessibility | `PASS_WITH_GATE` | URL/3xx/auth/session 矩阵、稳定原因族和无敏感错误 UI 已列出 | 三 Provider、Mac/Xcode、真机、Debug/Release 与 VoiceOver/Dynamic Type 证据未完成 |

这是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不是独立复核或实现证据。D-036 未进入机器决定台账或 Owner intake，`D039-PX5-B05` 继续 `OPEN`。

## 10. 官方事实与推荐边界

- Apple 的 [`URLSessionConfiguration.ephemeral`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/ephemeral) 说明会话相关 cache、cookie 和 credential 不持久化到磁盘；[`urlCache`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/urlcache)、[`httpCookieStorage`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/httpcookiestorage) 和 [`urlCredentialStorage`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/urlcredentialstorage) 进一步说明 ephemeral 默认仍有会话内私有存储，可显式设为 `nil` 禁用。
- Apple 的 [`willPerformHTTPRedirection`](https://developer.apple.com/documentation/foundation/urlsessiontaskdelegate/urlsession(_:task:willperformhttpredirection:newrequest:completionhandler:)) 允许 default/ephemeral session 的 delegate 返回 `nil` 拒绝 redirect，因此 A/B 的逐跳规则必须在受控 delegate 中验证。
- React Native 的 [Networking](https://reactnative.dev/docs/network) 当前说明 `fetch` 的 `redirect: manual` 与 `credentials: omit` 不工作，并提示 iOS 可自定义底层 `NSURLSessionConfiguration`。这支持把 C 设为“先证明再选择”，不证明 C 已不可实现或 A/B 已获得授权。

这些是平台能力参考，不是 Nuttie 的已接受产品决定。A 是“推荐先测”的内部候选；只有相同 fixture、三 Provider、精确版本和原生/Release 证据能证明边界且独立 findings 归零，才可进入 Owner 选择。

## 11. 当前门禁

```text
D-036 decisionState: CANDIDATE
cardState: DRAFT_COMPLETE
selfReviewPassed: true
providerCompatibilitySpikePassed: false
nativeBoundaryEvidencePassed: false
independentReviewPassed: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
D039-PX5-B05: OPEN
remainingOpenBlockerCount: 5
realNetworkRequests: 0
formalImplementationAuthorized: false
```
