# D-036 Provider/原生兼容 run 与报告机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-CONTRACT-001` |
| 对应协议 | `D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001 / D036-PROTOCOL-R001` |
| OI-07 前置 | `OI07-PROVIDER-TARGET-INTAKE-TEMPLATE-001`；必须复用 D-036/D-053 同一 revision |
| 对应决定 / 阻断 | `D-036 / CANDIDATE`；`D039-PX5-B05 / OPEN` |
| 当前状态 | `CONTRACT_READY / OI07_REQUIRED / NO_RUNS / NO_REPORT / EXECUTION_NOT_AUTHORIZED` |

## 1. 目的与非目标

[D-036 三 Provider 兼容与原生边界 Spike 协议](d036-provider-native-compatibility-spike-protocol.md)已经固定 36 个 Provider/profile/build/runtime 单元、9 类离线 scenario family、13 个原生证据面与最低重复次数，但协议中的报告字段仍不足以阻止以下漂移：删除失败 attempt、只汇总成功路径、把跨 origin 泄露藏进总计、用文档引用代替原生观测、让 D-036 与 D-053 消费不同 OI-07 revision，或把合成 fixture 冒充 Provider/真机证据。

本合同只冻结未来执行器、报告生成器与本地 validator 的机器输入。它不读取 OI-07 文件、Provider 文档、凭据、设备、Mac/Xcode、抓包、签名或证据引用，不创建请求或原生 harness，也不授权费用、联网、Owner 评审、B05 关闭或正式实现。

当前固定保持：

```text
oi07Complete = false
providerTargetsResolved = false
attemptRecordCount = 0
compatibilityReportRecorded = false
nativeBoundaryEvidenceRecorded = false
macAndSupportedXcodeAvailable = false
isolatedNativeHarnessAuthorized = false
realNetworkSpikeAuthorized = false
credentialInjectionAuthorized = false
providerCompatibilitySpikePassed = false
nativeBoundaryEvidencePassed = false
independentReviewPassed = false
ownerReviewAuthorized = false
D039-PX5-B05 = OPEN
formalImplementationAuthorized = false
```

## 2. Bundle 顶层

输入版本为 `D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_INPUT_V1`，只允许：

```text
schemaVersion
reportId
recordKind
protocolIdentity
oi07Intake
oi07IntakeResult
matrixScope
environmentArtifacts[]
corpusIdentity
executionAuthorization
offlineHarnessResults[]
compatibilityCells[]
attemptRecords[]
nativeBoundaryResults[]
findings[]
independentReviewRefs[]
overallDisposition
generatedAt
reportSha256
containsRealUserData = false
containsCredential = false
containsProviderBody = false
```

`reportId` 使用 `D036-REPORT-RNNN`。`recordKind` 只能为 `FORMAL_SPIKE_REPORT` 或 `SYNTHETIC_CONTRACT_FIXTURE`。`reportSha256` 对删除自身后的完整 bundle 做 key 排序规范 JSON SHA-256；数组严格保留协议顺序。validator 只验证传入数据的结构、交叉绑定、重算结果与调用方声明，不访问任何引用。

### 2.1 协议身份

`protocolIdentity` 必须精确包含：

```text
protocolId = D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001
protocolRevision = D036-PROTOCOL-R001
protocolArtifactCommit = a21110dc651cad83b0c77e4fee5f2e96ac51ef88
protocolArtifactBlobOid = c72ae3f053f7beaa5ab2cea8fa730ab2b18c82c1
protocolArtifactSha256 = 381059a017ec9284b56c49c92e9fcd6f0e36959996deb1897a788275af47f2dd
sourcePacketVersion = PACKET-001-R1
sourceCardCommit = 6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117
sourceCardBlobOid = 3bc58cebfb45e2046891fb774bc242fe69ee5b30
sourceCardSha256 = fdfe2fdebce62e4bc7e31e4ba8b358d9780e4b93377907ecd780bcd4dfcdb7ab
```

这些值绑定协议和 frozen D-036 卡，不证明对应提交、文件或字节在调用时真实存在；本地 validator 仍按“调用方声明、未做 Git/文件读取”处理。

### 2.2 OI-07 绑定

`oi07Intake` 必须满足 `OI07_PROVIDER_TARGET_INTAKE_INPUT_V1`，`oi07IntakeResult` 必须与既有本地校验器对该输入重算的 `OI07_PROVIDER_TARGET_INTAKE_RESULT_V1` 完全一致。两者必须同时绑定：

- 单一 `oi07Revision`；
- 恰好按 `P1 / P2 / P3` 排列的三个 target；
- `inputFingerprint` 与 `resultFingerprint`；
- `d036IntakeContractComplete`、`inputAuthorityMetadataComplete` 和全部 D-036 所需字段无 `UNKNOWN` 的状态。

正式报告若 OI-07 不完整、authority 元数据缺失或 target revision 分裂，只能 `INCONCLUSIVE`。即使结构完整，Provider 法律实体、产品、地区、endpoint、费用和授权仍是调用方声明；validator 不核验现实真值，也不能把完整 OI-07 解释为凭据、费用或联网授权。

## 3. 固定矩阵与缩小合成 fixture

`matrixScope` 只允许以下字段：

```text
providerSlots[]
candidateProfileIds[]
buildConfigurations[]
runtimeTargets[]
requiredCompatibilityCellCount
offlineScenarioFamilyIds[]
nativeBoundarySurfaceIds[]
```

正式报告必须精确使用：

```text
providerSlots = [P1, P2, P3]
candidateProfileIds = [strict_ephemeral_no_redirect,
  confirmed_query_same_origin_redirect,
  rn_fetch_after_native_boundary_proof]
buildConfigurations = [DEBUG, RELEASE]
runtimeTargets = [IOS_SIMULATOR, PHYSICAL_IPHONE]
requiredCompatibilityCellCount = 36
offlineScenarioFamilyIds = [URL_PARSE, QUERY, REDIRECT_STATUS, REDIRECT_ORIGIN,
  METHOD_BODY, AUTH_TLS, COOKIE_CACHE_CREDENTIAL, LIFECYCLE, OBSERVABILITY]
nativeBoundarySurfaceIds = [NB-01_URL_CANONICALIZATION, NB-02_REDIRECT_INTERCEPTION,
  NB-03_METHOD_BODY_PRESERVATION, NB-04_ORIGIN_AUTHORIZATION,
  NB-05_COOKIE_ISOLATION, NB-06_CACHE_ISOLATION, NB-07_CREDENTIAL_ISOLATION,
  NB-08_TLS_TRUST, NB-09_CANCEL_TIMEOUT_INVALIDATE, NB-10_STREAM_AND_BUDGET,
  NB-11_BACKGROUND_KILL_RESTART, NB-12_LOG_CAPTURE_PRIVACY,
  NB-13_RN_FETCH_CAPABILITY]
```

`SYNTHETIC_CONTRACT_FIXTURE` 可以使用上述有序集合的非空真子集，并把最低重复数缩小到每类 1 次来验证算法；它必须至少包含一个 Provider、一个 profile、一个 build、一个 runtime、一个离线 family 和一个原生 surface。缩小 fixture 永远不能返回 Provider compatibility、native boundary 或独立复核 PASS，也不得登记为执行结果。

## 4. 环境、harness、corpus 与执行授权

`environmentArtifacts` 对 `buildConfigurations × runtimeTargets` 每一组合恰好一项，并只允许：

```text
environmentArtifactId
buildConfiguration
runtimeTarget
macModelIdentifier
macosVersion
xcodeVersion
iosSdkVersion
runtimeModelIdentifier
runtimeOsVersion
runtimeOsBuild
harnessCommit
dependencyLockSha256
compilerSettingsSha256
harnessArtifactSha256
bundleIdentifier
signingClass
networkCaptureToolAndVersion
bootSessionId
identityFingerprint
```

正式报告中任一值为 `UNKNOWN`、同一组合重复/缺失、fingerprint 漂移，或 `PHYSICAL_IPHONE` 没有明确 runtime 身份时只能 `INCONCLUSIVE`。`signingClass` 只描述隔离 harness 的实际签名类别，不等于正式 Release Archive 或 D-032 第二次 Owner 动作已满足。

`corpusIdentity` 固定 revision、fixture count、manifest SHA-256、规范字节数与 `containsRealUserData=false / containsCredential=false / containsProviderBody=false`。每个 attempt 绑定同一 corpus fingerprint；validator 不读取或物化 fixture。

`executionAuthorization` 固定 authorization ID、授权者引用、授权时间/到期时间、允许的 Provider slot、attempt path、最大总成本与币种、credential 注入方式引用和 `callerAssertedAuthorized`。正式报告只有声明完整且未过期时才可形成结构完整候选；这些字段仍不构成现实授权核验。合成 fixture 必须使用 `SYNTHETIC_CONTRACT_ONLY`，费用为零，真实联网与 credential 注入始终为 false。

## 5. Raw attempt record

每条 `D036_PROVIDER_NATIVE_COMPATIBILITY_ATTEMPT_V1` 只允许：

```text
schemaVersion
attemptId
cellId
pathKind
repetitionIndex
identityFingerprint
startedMonotonicNs
endedMonotonicNs
hopRecords[]
stateIsolationObservation
lifecycleObservation
observedDisposition
reasonCode
captureEvidenceFingerprint
diagnosticFingerprint
containsRealUserData = false
containsCredential = false
containsProviderBody = false
```

`pathKind` 固定为 `NORMAL / CANCEL / EXPECTED_ERROR`。`attemptId` 在 bundle 内唯一；同一 cell/path 的 `repetitionIndex` 从 1 连续递增。失败、取消、超时、证据缺口和重试都保留原记录；重试必须使用新的 attempt ID，不能覆盖失败记录。

`identityFingerprint` 绑定 protocol、OI-07、environment artifact、corpus、execution authorization、Provider slot、profile、build 和 runtime。`diagnosticFingerprint` 绑定去除自身后的完整 attempt。两层任一不匹配即拒绝 bundle。

### 5.1 Hop 记录与泄露计数

`hopRecords` 按 `hopIndex` 从 0 连续排列，每项固定：

```text
hopIndex
originFingerprint
originApprovalState = APPROVED | UNAPPROVED
requestCount
authorizationByteCount
payloadByteCount
responseStatusCode
redirectDisposition
captureFingerprint
```

报告只保存规范 origin fingerprint、计数与脱敏证据 fingerprint，不保存 Authorization、key、完整 URL/query、请求/响应正文或 Location。任一 `UNAPPROVED` origin 的 `requestCount`、Authorization 或 payload 字节非零，或 evidence 显示 HTTPS 降级、未批准 host/port、默认跳转先发送后检查，均使对应 cell 为 `INCOMPATIBLE_BY_OBSERVATION`，整体为 `FAIL`。

### 5.2 状态与生命周期观察

`stateIsolationObservation` 精确记录自动 cookie 发送、共享 cache 读取、共享 credential 读取、持久 cookie/cache/credential 写入和跨 attempt 状态复用次数。`lifecycleObservation` 精确记录自动重试、业务写入、终态临时对象、终态临时文件和迟到回调 mutation 次数。所有值为非负整数。

上述任一计数非零，或取消/timeout/结果未知后发生自动重发、业务写入、不可清理残留或迟到 mutation，均为安全/数据完整性失败；不能降级为 `INCONCLUSIVE` 或通过删除 attempt 隐藏。

## 6. Cell、离线结果与覆盖重算

每个 `compatibilityCells` 项严格对应 matrix 笛卡尔积中的一个唯一 cell，并只允许：

```text
cellId
providerSlot
candidateProfileId
buildConfiguration
runtimeTarget
environmentArtifactId
attemptIds[]
normalAttemptCount
cancelAttemptCount
expectedErrorAttemptCount
observedOriginCount
unapprovedRequestCount
unapprovedAuthorizationByteCount
unapprovedPayloadByteCount
stateIsolationViolationCount
lifecycleViolationCount
disposition
findingIds[]
cellFingerprint
```

计数、attempt 列表和 disposition 必须从同 bundle 的 raw attempt 重算。正式已执行 cell 的 `NORMAL / CANCEL / EXPECTED_ERROR` 各至少 3 次；未执行 cell 必须保留 `NOT_EXECUTED` 和空 attempt 列表。cell disposition 只允许协议定义的五项：

- `COMPATIBLE_WITH_CANDIDATE_PROFILE`
- `INCOMPATIBLE_BY_DOCUMENTED_REQUIREMENT`
- `INCOMPATIBLE_BY_OBSERVATION`
- `INCONCLUSIVE_EVIDENCE_GAP`
- `NOT_EXECUTED`

`offlineHarnessResults` 必须按 `profile × build × runtime × family` 的协议顺序完整覆盖；每项绑定 execution identity、measured count、passed count、failed count、finding IDs 与 evidence fingerprint。正式结构候选要求每项至少 10 次且 `10/10` 以上一致通过；合成 fixture 最低 1 次。离线通过只证明 harness 能发现边界漂移，不会把 Provider cell 或原生 surface 改成已通过。

## 7. 原生边界结果

`nativeBoundaryResults` 必须按 `candidateProfileIds × nativeBoundarySurfaceIds` 顺序完整覆盖，每项只允许：

```text
candidateProfileId
surfaceId
state
rationaleCode
evidenceRefs[]
environmentArtifactIds[]
findingIds[]
resultFingerprint
```

`state` 只能为 `PROVEN / NOT_PROVEN / NOT_APPLICABLE_WITH_REASON`。`NOT_APPLICABLE_WITH_REASON` 必须带稳定、非敏感 rationale 与证据引用；不得用它绕过实际适用 surface。`rn_fetch_after_native_boundary_proof` 的 13 个 surface 必须全部 `PROVEN` 才能保持可行；任一 `NOT_PROVEN` 或 `NOT_APPLICABLE_WITH_REASON` 都使该 profile 成为 `RN_FETCH_PROFILE_NOT_VIABLE_AT_TESTED_VERSION`，但不会自动选择 A 或 B。

证据引用只验证稳定 ID、摘要、hash 和环境关联，不验证真实 Xcode 工件、系统行为、签名、截图或抓包内容。因此本地 validator 始终返回 `NATIVE_EVIDENCE_CALLER_ASSERTED_NOT_VERIFIED`。

## 8. Findings、复核与 disposition

`findings` 每项固定 finding ID、P0~P3 severity、状态、关联 cell/attempt/surface、责任人引用、期限、处置摘要与 finding fingerprint；不得包含 secret、用户或 Provider 正文、完整 URL/query、个人联系方式或证件。P0/P1/P2 任一未关闭时 overall 必须 `FAIL` 或 `INCONCLUSIVE`；开放 P3 必须有责任人、期限与非阻断理由。

`independentReviewRefs` 只保存未来具名 Security/QA 复核回执的稳定 ID、角色、签署方式、签署时间和摘要。validator 不核验现实身份、独立性、胜任或签署真值，因此始终保留 `INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED`。

正式 `overallDisposition` 只允许：

- `MEASURED_REVIEW_REQUIRED`：36 cells 全部执行，三类 path 覆盖满足，9 类离线矩阵全部取得结论，所有已观察泄露/状态/生命周期安全计数为零，13×3 surface 都有合同允许的结论，且无开放 P0/P1/P2。某个 Provider/profile 被明确判定为不兼容，或 C 因 surface `NOT_PROVEN` 被判为不可行，仍可以是完整的 measured report；它们必须作为候选代价进入独立复核，不能被改写成该 profile 已通过；
- `FAIL`：出现跨 origin 字节泄露、TLS/认证/共享状态越界、自动重发、业务写入、不可清理残留、敏感日志、证据/身份篡改或阻断 finding；
- `INCONCLUSIVE`：OI-07、环境、授权、corpus、cell、重复、surface、引用或计数证据缺失，且未出现必须判 `FAIL` 的已观察越界。

即使所有结构与测量满足，本地 validator 也只能输出 `STRUCTURALLY_COMPLETE_REPORT_ONLY / INDEPENDENT_REVIEW_REQUIRED`，不得输出 `D036_PROVIDER_NATIVE_EVIDENCE_PASS_CANDIDATE`、`PROVIDER_COMPATIBILITY_SPIKE_PASS` 或 `NATIVE_BOUNDARY_PASS`。现实通过必须另有具名独立复核和权威事件，且不自动接受 D-036、D-053、D-032 或关闭 B05。

## 9. 资源、安全与不可变边界

后续 validator 必须先拒绝 accessor、symbol、非枚举字段、特殊对象、cycle、超深节点、超长字符串和超大数组，再执行精确字段、枚举、顺序、唯一性、交叉引用和指纹校验。明显的 key/token、Bearer、Authorization/password/secret、个人邮箱、用户/Provider 正文或完整敏感 URL 触发 `UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT`；错误只能返回字段路径和稳定 code，不得回显 canary。

规范化必须复制并深冻结输入。结果只输出 schema、report ID、计数、结构 disposition、blocker、fingerprint 与关闭边界，不回显 OI-07 target 内容、环境详情、hop、finding 摘要或 raw attempt。

`D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_BOUNDARY_V1` 固定：

```text
oi07Reads = 0
providerDocumentReads = 0
attemptRecordReads = 0
attemptRecordWrites = 0
captureArtifactReads = 0
nativeArtifactReads = 0
networkRequests = 0
providerRequests = 0
credentialReads = 0
credentialWrites = 0
businessWrites = 0
externalMessagesSent = 0
oi07Complete = false
providerTargetsResolved = false
macAndSupportedXcodeAvailable = false
physicalIphoneAvailableForHarness = false
isolatedNativeHarnessAuthorized = false
syntheticCorpusMaterialized = false
realNetworkSpikeAuthorized = false
credentialInjectionAuthorized = false
spikeExecutionStarted = false
providerCompatibilityReportRecorded = false
providerCompatibilitySpikePassed = false
nativeBoundaryEvidenceRecorded = false
nativeBoundaryEvidencePassed = false
independentReviewPassed = false
ownerReviewAuthorized = false
ownerChoiceRecorded = false
decisionAcceptedRecorded = false
b05Closed = false
d032SecondOwnerActionSatisfied = false
formalRootProjectAuthorized = false
nativeIosWorkAuthorized = false
realNetworkAuthorized = false
formalImplementationAuthorized = false
px5ImplementationDorSatisfied = false
```

## 10. 后续实现标准

后续纯本地 validator 至少覆盖：严格数据树与精确字段、协议/OI-07 双 fingerprint、正式 36-cell 笛卡尔积、缩小合成隔离、attempt ID/repetition/身份/诊断 fingerprint、三类 path 最低次数、失败记录保留、hop 与未批准 origin 字节为零、cookie/cache/credential 隔离、取消/timeout/restart 与零写入/零残留、离线 9-family 矩阵 10 次一致、13×3 原生 surface、C 全 `PROVEN` 条件、P0~P3、聚合重算、disposition 优先级、敏感材料不回显、不可变结果与全部现实授权位关闭。

在 OI-07、Mac/Xcode、隔离原生 harness、合成 corpus、credential 注入和窄范围真实网络授权到位前，只允许继续完善合同与本地 validator；不得创建假 attempt、假 report、假 native evidence、假 reviewer 或 PASS。
