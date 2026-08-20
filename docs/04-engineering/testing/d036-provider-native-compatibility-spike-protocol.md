# D-036 三 Provider 兼容与原生边界 Spike 协议

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001` |
| 对应决定 | `D-036 / CANDIDATE` |
| 对应阻断 | `D039-PX5-B05 / OPEN` |
| 输入版本 | `PACKET-001-R1`；D-036 卡冻结于 commit `6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117` |
| D-036 输入 blob | Git blob OID `3bc58cebfb45e2046891fb774bc242fe69ee5b30`；SHA-256 `fdfe2fdebce62e4bc7e31e4ba8b358d9780e4b93377907ecd780bcd4dfcdb7ab` |
| 当前状态 | `PROTOCOL_READY / OI07_REQUIRED / PROVIDERS_UNRESOLVED / EXECUTION_NOT_AUTHORIZED / NO_RESULTS` |
| 授权边界 | Provider 选择、凭据、真实网络、Mac/Xcode、原生 harness、兼容结论、Owner 评审、B05 关闭和正式实现均未授权或未发生 |

## 1. 目的与非目标

本协议把 [D-036 AITransport 选择卡](../../03-design/d036-ai-transport-profile-card-spec.md)中的 `OI-07 + 三 Provider 兼容 Spike + 原生边界证据`拆成可执行、可重放和可审计的证据流程。它只准备测试合同，不选择 Provider 或 transport profile，不产生发送许可。

本协议不得被解释为：

- 已收到 OI-07、已确定三家 Provider，或可以从市场知名度推断 Owner 想测试谁；
- 可以把 API key、Authorization、真实用户照片、文字、健康/营养记录或 Provider 正文写进仓库；
- 已授权真实联网、正式 `AITransport`、React Native `fetch`、Swift/Expo Module、`ios/` 或正式根工程；
- Windows Metro export、模拟器、本地 mock、公开文档或一次成功请求可以替代 iOS 原生边界证据；
- Provider 兼容就等于 D-053 数据用途准入、D-033 逐次确认、D-034 预算或 D-036 Owner 接受；
- 协议准备完成就能把 `providerCompatibilitySpikePassed`、`nativeBoundaryEvidencePassed`、`independentReviewPassed`、`b05Closed` 或实现授权改为 `true`。

## 2. OI-07 无密钥输入合同

执行前必须由 Owner 或获授权的项目联系人提供三个明确的 Provider target。每个 target 使用以下字段；缺失项保留 `UNKNOWN` 并阻断相关测试，不能由 PM、AI 或测试者猜测：

```text
providerSlot = P1 | P2 | P3
providerLegalEntity
apiProductName
apiProductRevision
accountRegion
intendedUserRegion
baseUrl
endpointPathShape
queryRequired
redirectDocumented
streamingMode
modelIdentifierForSyntheticTest
officialEndpointEvidenceUrl
officialTermsUrl
officialPrivacyUrl
evidenceObservedAt
credentialOwner
credentialInjectionMethod
maximumAuthorizedTestCost
notesWithoutSecretOrUserData
```

固定规则：

1. 三个 slot 都必须绑定法律实体、API 产品、地区和精确 endpoint；产品名相同但 endpoint/revision 不同也必须分别记录。
2. URL 只允许公开非秘密信息。key、token、signature、cookie、Authorization、账号标识和含 secret 的 query 值不得进入 OI-07、日志或 fixture。
3. `credentialInjectionMethod` 只描述运行时由人或受控 secret store 注入，值本身永不入库；当前没有受批准的注入实现。
4. terms/privacy URL 只满足输入可追溯性，不证明 D-053 十维用途证据已通过；D-053 仍单独保持 `UNKNOWN_BLOCKED`。
5. 任一 target 的 Provider/API/地区/base URL/model/revision 变化都会产生新 OI-07 revision，使旧兼容和 D-033 确认证据失效。
6. 三个 slot 未完整提供前，只能执行离线受控 harness，不得形成真实 Provider 兼容结论。

## 3. 候选与执行矩阵

协议精确覆盖三套候选：

- `strict_ephemeral_no_redirect`
- `confirmed_query_same_origin_redirect`
- `rn_fetch_after_native_boundary_proof`

真实兼容矩阵为：

```text
3 Provider targets
× 3 candidate profiles
× 2 build configurations (DEBUG, RELEASE)
× 2 runtime targets (IOS_SIMULATOR, PHYSICAL_IPHONE)
= 36 required cells
```

模拟器单元用于快速定位配置和协议差异，不能替代对应真机单元。正式签名 Archive 与 Release 全进程捕获仍是后续发布证据；本 Spike 的 `RELEASE` 只表示隔离 harness 的优化 Release 配置。

每个 cell 至少记录：

```text
cellId
oi07Revision
providerSlot
candidateProfileId
buildConfiguration
runtimeTarget
harnessCommit
harnessArtifactSha256
networkCaptureToolAndVersion
syntheticFixtureManifestSha256
attemptIds[]
observedEndpointChain[]
requestCountsByOrigin
authorizationBytesByOrigin
payloadBytesByOrigin
cookieCacheCredentialObservations
cancelTimeoutAndErrorObservations
temporaryResidualCounts
databaseWriteCounts
disposition
findingIds[]
```

## 4. 执行前置条件

只有以下条件全部满足，Spike 才能从 `NOT_AUTHORIZED` 进入 `READY_TO_EXECUTE`：

1. OI-07 三个 target 完整且版本化，公开证据观察时间、地区和最大测试成本已记录。
2. PM 取得仅限合成 fixture 的真实网络测试授权；授权明确 Provider、次数、成本上限、运行时间和操作者，不扩大为生产发送。
3. 可用 Mac、受支持 Xcode、iOS 模拟器和真实 iPhone 已记录；当前 OI-03 的“无 Mac”必须先发生新的权威事实变化。
4. 隔离 harness 的范围、目录、bundle identifier、commit、依赖锁、Debug/Release 设置、签名类别和产物 SHA-256 已冻结；正式根工程仍不存在或不在本授权内。
5. 合成 corpus 不含真实用户数据或健康/营养事实，且每个 request/response fixture 有规范字节计数和 SHA-256。
6. 测试 credential 只在运行时注入，不由 harness、命令历史、环境转储、网络捕获导出、crash buffer 或报告回显。
7. D-034 候选预算被当作测试输入而非 accepted 上限；每个请求还必须保留 D-033/D-053 未授权标记，不能重放到业务 UI。
8. 具名安全与 QA 复核人未指派时可以采样，但结果只能是 `MEASURED / REVIEW_REQUIRED`。

任何前置缺失必须生成结构化 blocker。不得为了“先通一次”临时允许 HTTP、跨 origin redirect、secret query、共享 cookie/cache/credential、TLS 绕过或未记录 Provider。

## 5. 离线受控 harness

真实 Provider 测试之前，先用本地可控 server/注入流完成下列 scenario family；每个候选、Debug/Release 和 simulator/device 组合至少 10 次一致结果：

| family | 必测内容 | 失败关闭断言 |
| --- | --- | --- |
| `URL_PARSE` | HTTPS、空 host、userinfo、fragment、非法 port、反斜杠、IDNA/大小写/默认 443、IPv6、path 逃逸 | 非法输入在读取 key、组装 body 或建 task 前拒绝 |
| `QUERY` | 无 query、重复 key、空值、排序、非秘密值、secret-like 名称和值、用户正文编码 | A/C 拒 query；B 只接受已确认且本地允许的非秘密 query |
| `REDIRECT_STATUS` | 300~308 每个状态；相对/绝对/缺失/重复/非法 Location | A/C 全拒；B 只可能接受规则内 307/308 |
| `REDIRECT_ORIGIN` | 同源、子域、跨 port、HTTPS→HTTP、userinfo、fragment、新 query、循环、超 3 跳、path 逃逸 | 未批准 origin 收到 Authorization 与 payload 字节均为 0 |
| `METHOD_BODY` | POST 经 301/302/303/307/308 的方法/body 行为 | 不依赖平台默认改写；逐跳检查前不转交 body/header |
| `AUTH_TLS` | 401/407、Basic/Digest、proxy auth、client cert、server trust override、自签名/过期证书 | 除系统默认 server trust 外均失败；不读取共享 credential |
| `COOKIE_CACHE_CREDENTIAL` | Set-Cookie、预置 cookie/cache/credential、cache hit、session 内第二请求、跨 attempt/restart | 无自动 cookie、共享/持久 cache 或 credential 复用 |
| `LIFECYCLE` | 连接前/上传/响应中取消、idle/total timeout、前后台、invalidate、kill/restart、结果未知 | 禁止自动重发；临时对象最终为 0；数据库写入为 0 |
| `OBSERVABILITY` | 请求链、逐 origin header/body 计数、日志、错误 UI、crash buffer、网络捕获 | 不含 secret、用户/Provider 正文或未确认 Location |

离线 harness 通过只证明测试工具能发现边界漂移，不证明目标 Provider 兼容、平台默认行为或生产实现。

## 6. 三 Provider 兼容执行

获得全部前置后，每个 36-cell 单元使用相同合成语义 fixture，按 `P1→P2→P3`、`P2→P3→P1`、`P3→P1→P2` 轮换，避免只在单一时段测试某一家。每个授权 cell 至少执行 3 次正常路径、3 次显式取消和 3 次预期错误路径；成本或 Provider 条款不允许时标记 `INCONCLUSIVE`，不能减少次数后按通过处理。

每次执行必须：

1. 先校验 OI-07/profile/harness/corpus 指纹和测试成本剩余额度。
2. 使用合成 Authorization marker 与合成载荷；捕获只保留长度、hash、header 名和逐 origin 到达事实，不把 secret/正文提交仓库。
3. 记录实际请求链、状态、Location 形态、query 需求、streaming、取消和 timeout；Provider 无法稳定触发某负向路径时使用离线 harness 证据并把真实 cell 标记“未观察”，不得伪造响应。
4. 验证未批准 origin 的 Authorization/payload 为 0，cookie/cache/credential 不跨 attempt，终态后无 App 控制临时残留和业务数据库写入。
5. Provider 错误、限流、计费、服务不可用或策略变化不得触发自动切换 Provider/profile 或提高 D-034 预算。

真实 cell 的 disposition 只能是：

- `COMPATIBLE_WITH_CANDIDATE_PROFILE`
- `INCOMPATIBLE_BY_DOCUMENTED_REQUIREMENT`
- `INCOMPATIBLE_BY_OBSERVATION`
- `INCONCLUSIVE_EVIDENCE_GAP`
- `NOT_EXECUTED`

三家都兼容不等于候选已接受；不兼容也不自动选择更宽松方案。结果只进入 Owner 卡的收益/代价与独立复核。

## 7. 原生边界证据面

每个候选 profile 必须对以下 13 个 surface 分别给出 `PROVEN / NOT_PROVEN / NOT_APPLICABLE_WITH_REASON` 和不可变证据引用：

| surfaceId | 必须证明 |
| --- | --- |
| `NB-01_URL_CANONICALIZATION` | 单一 parser、scheme/host/port/path/query/fragment/userinfo 规范化与指纹绑定 |
| `NB-02_REDIRECT_INTERCEPTION` | 平台默认跳转被拦截；逐跳规则可拒绝且不先泄露 header/body |
| `NB-03_METHOD_BODY_PRESERVATION` | 307/308 的方法/body 仅在 B 的完整逐跳检查后保留 |
| `NB-04_ORIGIN_AUTHORIZATION` | Authorization 只到当前已确认 origin；跨 origin 字节为 0 |
| `NB-05_COOKIE_ISOLATION` | 自动 cookie 禁用，Set-Cookie 不进入后续或跨 attempt 请求 |
| `NB-06_CACHE_ISOLATION` | 不读取共享/历史 cache，响应不持久化为可复用 Provider 内容 |
| `NB-07_CREDENTIAL_ISOLATION` | 不使用共享 credential store，不响应 HTTP/proxy/client-cert challenge |
| `NB-08_TLS_TRUST` | 只使用系统 server trust，失败不降级、不绕过、不换 host |
| `NB-09_CANCEL_TIMEOUT_INVALIDATE` | cancel/timeout/invalidate 绑定 attempt，迟到回调不能复活任务 |
| `NB-10_STREAM_AND_BUDGET` | 解压字节、chunk、idle/total 和临时对象仍受 D-034 输入控制 |
| `NB-11_BACKGROUND_KILL_RESTART` | 无后台自动发送；kill/restart 先对账/清理且不自动重发 |
| `NB-12_LOG_CAPTURE_PRIVACY` | Debug/Release 日志、错误、crash 与捕获不含 secret 或正文 |
| `NB-13_RN_FETCH_CAPABILITY` | 精确 RN/Expo/iOS 版本对 redirect/credentials/cache/cancel/stream 的可控与可观测结论 |

候选 C 只有 13 项全部 `PROVEN` 才能保持可行；任一 `NOT_PROVEN` 即 `RN_FETCH_PROFILE_NOT_VIABLE_AT_TESTED_VERSION`。A/B 若需要窄原生 transport，只说明后续实现形态，不能据此创建正式模块或满足 D-032 第二次 Owner 动作。

## 8. 通过、失败与不可判定标准

`D036_PROVIDER_NATIVE_EVIDENCE_PASS_CANDIDATE` 只有在以下条件全部满足时才可提出：

- OI-07 三个 target 完整，36 个兼容 cell 都有结论且无 `NOT_EXECUTED`；
- 离线 scenario family 在候选/构建/runtime 组合中 10/10 稳定，真实授权 cell 的每类 3 次执行无证据缺口；
- 未批准 origin 的 Authorization 和 payload 字节始终为 0；跨 attempt/restart 的 cookie/cache/credential 复用为 0；
- 所有失败、取消、timeout 和结果未知路径的业务写入为 0，App 控制临时残留最终为 0；
- 13 个原生 surface 对每个候选都有结论，C 的不可控能力不会被“文档说应该”替代；
- Debug/Release 与 simulator/device 差异全部形成 finding，不以通过环境覆盖失败环境；
- 具名安全与 QA 独立复核后未处置 P0/P1/P2 均为 0，保留 P3 有责任人、期限与非阻断理由。

出现跨 origin 泄露、secret/正文日志、TLS 绕过、共享状态复用、自动重发、残留不可清理或业务写入时对应候选为 `FAIL`。OI-07、工具、版本、捕获、fixture、次数或 surface 证据缺失时为 `INCONCLUSIVE`。

即使得到 pass candidate，`providerCompatibilitySpikePassed` 和 `nativeBoundaryEvidencePassed` 仍须由独立权威记录另行推进；D-053、Owner、B05、D-032 与正式实现门禁不随之自动变化。

## 9. 报告最小 schema

```text
reportId
protocolId = D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001
protocolRevision
sourcePacketVersion = PACKET-001-R1
sourceCardCommit
sourceCardBlobOid
sourceCardSha256
oi07Revision
providerTargets[3]
candidateProfileCount = 3
buildConfigurationCount = 2
runtimeTargetCount = 2
requiredCompatibilityCellCount = 36
compatibilityCells[36]
nativeBoundarySurfaceCount = 13
nativeBoundaryResults[3][13]
offlineHarnessResults
requestAndLeakageSummary
cookieCacheCredentialSummary
cancelTimeoutRestartSummary
temporaryResidualSummary
databaseWriteSummary
findings[]
independentReviewRefs[]
overallDisposition
generatedAt
reportSha256
```

聚合报告必须能回溯到每个 attempt 的不可变记录。网络捕获中如含 secret 或正文，只能保存在获授权的安全位置并提交脱敏派生证据；仓库永不存原始 secret、Authorization 或用户/Provider 正文。

## 10. 当前阻断与下一动作

当前不能执行，原因是：

1. OI-07 尚未提供三个精确 Provider/API/地区/endpoint target。
2. 当前没有可用 Mac/Xcode；只有 iPhone 16 Pro Max 不能建立原生 harness 或 Debug/Release 证据。
3. 隔离原生 harness、真实网络和 credential 注入均未授权，synthetic corpus 也未物化。
4. 具名安全/QA 复核人未指派，D-053 仍为 `CANDIDATE / UNKNOWN_BLOCKED`。

下一步是先收集无密钥 OI-07，并取得窄范围合成流量 Spike 授权与 Mac/Xcode 资源；随后物化离线 corpus/harness，先证明能发现边界漂移，再执行 36-cell 兼容矩阵。外部条件缺失期间，D-036 保持 `PROVIDER_COMPATIBILITY_SPIKE_REQUIRED / NATIVE_BOUNDARY_EVIDENCE_REQUIRED / NOT_OWNER_READY`。

## 11. 当前机器可读边界

```text
protocolReady: true
sourcePacketVersion: PACKET-001-R1
providerTargetCount: 3
candidateProfileCount: 3
buildConfigurationCount: 2
runtimeTargetCount: 2
requiredCompatibilityCellCount: 36
nativeBoundarySurfaceCount: 13
offlineMeasuredRepetitionMinimum: 10
providerCellPathRepetitionMinimum: 3
oi07Complete: false
providerTargetsResolved: false
macAndSupportedXcodeAvailable: false
physicalIphoneAvailableForHarness: false
isolatedNativeHarnessAuthorized: false
syntheticCorpusMaterialized: false
realNetworkSpikeAuthorized: false
credentialInjectionAuthorized: false
spikeExecutionStarted: false
providerCompatibilityReportRecorded: false
providerCompatibilitySpikePassed: false
nativeBoundaryEvidenceRecorded: false
nativeBoundaryEvidencePassed: false
namedSecurityReviewerAssigned: false
namedQaReviewerAssigned: false
independentReviewPassed: false
externalMessageSent: false
ownerIntakeChanged: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
b05Closed: false
d032SecondOwnerActionSatisfied: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
realNetworkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
next: D036_OI07_SPIKE_AUTHORIZATION_AND_MAC_TOOLCHAIN_REQUIRED
```
