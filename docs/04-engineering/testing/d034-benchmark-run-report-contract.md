# D-034 benchmark raw run 与报告 bundle 机器合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D034-BENCHMARK-RUN-REPORT-CONTRACT-001` |
| 对应协议 | `D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001` |
| manifest 前置 | `D034-BENCHMARK-CORPUS-MANIFEST-CONTRACT-001` |
| 对应决定 / 阻断 | `D-034 / CANDIDATE`；`D039-PX5-B05 / OPEN` |
| 当前状态 | `CONTRACT_READY / NO_RUNS / NO_REPORT / EXECUTION_NOT_AUTHORIZED` |

## 1. 目的和非目标

[D-034 benchmark 协议](d034-minimum-iphone-benchmark-protocol.md)第 8 节列出了报告最小字段，但尚未固定 raw run 的严格形状、丢弃组与重试的保留方式、统计算法和 disposition 推导。只提交平均值、截图或手工汇总会掩盖单次越界，也无法证明三档使用同一 corpus。

本合同只冻结未来执行器和报告 validator 的机器输入；它不创建 run、不读取设备、不授权 Xcode/原生 harness、不访问 fixture/Provider/网络/凭据，也不把合成测试记录解释为测量结果。

当前固定保持：

```text
rawRunRecords = 0
benchmarkReportRecorded = false
minimumPhysicalDeviceResolved = false
macAndSupportedXcodeAvailable = false
isolatedNativeHarnessAuthorized = false
benchmarkExecutionAuthorized = false
benchmarkExecutionStarted = false
deviceBenchmarkPassed = false
independentReviewPassed = false
ownerReviewAuthorized = false
D039-PX5-B05 = OPEN
formalImplementationAuthorized = false
```

## 2. Bundle 顶层

输入版本为 `D034_BENCHMARK_RUN_REPORT_BUNDLE_INPUT_V1`，只允许：

```text
schemaVersion
reportId
protocolIdentity
manifestIdentity
deviceIdentity
environmentIdentity
harnessIdentity
executionAuthorizationRef
profileReports[3]
runRecords[]
findings[]
independentReviewRefs[]
generatedAt
reportSha256
containsRealUserData = false
containsCredential = false
```

`reportId` 使用 `D034-REPORT-RNNN`。`reportSha256` 是对去除该字段后的规范 JSON 计算的小写 SHA-256；对象 key 排序，数组保留协议顺序。validator 不访问任何引用，只验证结构、交叉绑定、计算和调用方声明。

### 2.1 身份绑定

- `protocolIdentity` 必须精确包含协议 ID/revision、`PACKET-001-R1` 和冻结 D-034 卡 commit/blob/SHA-256。
- `manifestIdentity` 必须包含 corpus revision、manifest SHA-256、结构 validator 输入/结果指纹、fixture 总数和 85 个必需槽位已覆盖声明；声明不是工件真值验证。
- `deviceIdentity` 必须包含精确机型标识、容量、iOS version/build、可用存储、最大电池容量、供电与维修状态，以及外部最低设备决议引用。当前 iPhone 16 Pro Max 不能自动写成最低设备。
- `environmentIdentity` 必须包含 Mac 型号、macOS、Xcode、iOS SDK、测量工具版本、网络模式、区域/语言、Low Power Mode 与 thermal 起始状态。
- `harnessIdentity` 必须包含隔离 harness commit、构建配置、签名类别、bundle identifier、依赖锁/编译设置/产物 SHA-256 和 `ISOLATED_BENCHMARK_HARNESS` 类型。

任一身份字段缺失、为 `UNKNOWN`、引用漂移或三档不一致时，bundle 只能 `INCONCLUSIVE`。validator 不能把调用方身份声明升级为设备、签名、工件或权限真值。

## 3. Raw run record

每条 `D034_BENCHMARK_RUN_RECORD_V1` 只允许：

```text
runId
runGroupId
profileId
fixtureId
fixtureArtifactSha256[]
repetitionKind = WARMUP | MEASURED
repetitionIndex
profileOrderInGroup
identityFingerprint
startedMonotonicNs
endedMonotonicNs
stageRecords[]
metrics
observedDisposition
observedReasonCode
discardState
discardReasonCode
cleanupEvidence
diagnosticFingerprint
containsRealUserData = false
containsCredential = false
```

`runId` 全 bundle 唯一且不可复用；失败重试必须新建 run，原记录永久保留。`identityFingerprint` 绑定 protocol、manifest、device、environment、harness、profile 和 fixture 身份，禁止只绑定 report。

### 3.1 阶段记录

`stageRecords` 必须按以下固定顺序恰好包含 8 项，每阶段一次：

```text
PREFLIGHT
METADATA
DOWNSAMPLE
ENCODE
REQUEST_ASSEMBLY
RESPONSE_COUNT
PARSE
CLEANUP
```

每项记录单调开始/结束纳秒、是否进入、字节/结构计数、终态与稳定 reason code。未进入的昂贵阶段必须显式 `NOT_REACHED` 并将阶段时间留空，不能省略后假装早期拒绝。单调时间只能比较同一 boot/session 内的 run，不转换为墙钟或跨重启相减。

### 3.2 指标

`metrics` 固定包含：

```text
cpuTimeNs
controlledWorkingBytesPeak
processHighWaterMarkBytes
idleBaselineDeltaBytes
temporaryDiskPeakBytes
foregroundRequestCountPeak
databaseWriteCount
residualObjectCount
crashCount
jetsamCount
watchdogCount
hangCount
unexplainedMemoryPeakCount
secretOrBodyLogFindingCount
```

所有值为非负整数。`processHighWaterMarkBytes` 与 `idleBaselineDeltaBytes` 不得被 controlled working memory 代替；拒绝、取消、超限和启动恢复的 `databaseWriteCount`、最终 `residualObjectCount` 必须为 0。任何 crash/jetsam/watchdog/hang、未解释内存峰值或正文/秘密日志发现都不能进入 pass candidate。

### 3.3 丢弃与重试

`discardState` 只有 `COUNTED`、`DISCARDED_UNCONTROLLED_THERMAL`、`DISCARDED_IDENTITY_DRIFT`、`DISCARDED_MEASUREMENT_INVALID`。丢弃记录仍保留完整身份、指标和原因，但不进入聚合；补跑使用新 run ID。不得只重跑失败 profile，也不得删除原失败/丢弃记录。

每个有效 run group 的 profile 顺序只允许 `A→B→C`、`B→C→A`、`C→A→B`，三个轮换都必须至少出现一次。组内设备、环境、harness、manifest 和 fixture 身份必须相同；出现 thermal escalation 时整组丢弃，不能只丢一个 profile。

## 4. 数量与覆盖

对 manifest 中每个 fixture、每个 profile：

- 至少 3 条 `WARMUP / COUNTED`，不进入统计；
- 至少 10 条 `MEASURED / COUNTED`，全部进入统计；
- 被丢弃或重试的记录不抵消以上最低数；
- measured repetition index 不得有缺口或重复。

若 manifest 只有 85 个必需槽位，三档最低为 765 条 counted warm-up 和 2,550 条 counted measured 记录；扩展 fixture 按同一公式增加。任何缺口使相应 profile 为 `INCONCLUSIVE`，不能从已完成子集外推。

## 5. Profile report 与统计

`profileReports` 必须严格按 A/B/C 顺序，每项只允许：

```text
profileId
scenarioCount
countedWarmupRunCount
countedMeasuredRunCount
discardedRunCount
allowedExpectedAndObserved
rejectedExpectedAndObserved
stageLatencyDistributions
cpuDistribution
controlledWorkingMemoryDistribution
processHighWaterMarkDistribution
idleBaselineDeltaDistribution
temporaryDiskPeakDistribution
requestCountDistribution
databaseWriteCountDistribution
residualObjectCountDistribution
crashJetsamWatchdogHangCounts
qualityAccessibilityEvidenceRefs
disposition
```

所有聚合必须从同 bundle 的 `COUNTED / MEASURED` raw records 重算，报告值与重算值逐字段一致。统计规则固定：

- `minimum`、`maximum` 取完整原始序列极值；
- `median` 对排序序列取中位数，偶数数量取中间两项算术平均；
- `p95` 使用 nearest-rank：排序后索引 `ceil(0.95 × n) - 1`；
- 不舍入原始整数；需要小数的 median 以精确 `.5` 保留；
- 平均值可以作为附加观察，但不能替代上述四项或 raw records。

`qualityAccessibilityEvidenceRefs` 只能引用独立保存的无正文证据摘要；validator 不判断图片是否可读，也不能把自述转为产品/无障碍通过。

## 6. Disposition 推导

单档只允许：

- `MEASURED_PROFILE_PASS_CANDIDATE`：覆盖和身份完整，所有 expected allow/reject 均 10/10 符合，21 行断言齐备，安全/写入/残留/并发边界为 0/1 要求，且质量证据引用完整；
- `FAIL`：存在安全边界越过、业务写入、不可清理残留、crash/jetsam/watchdog/hang、正文/秘密日志、计数不可信或工件漂移；
- `INCONCLUSIVE`：设备、工具、工件、corpus、采样、覆盖或计数证据缺失。

`INCONCLUSIVE` 优先于“选择性成功”，`FAIL` 记录不得通过删除/丢弃改成 candidate。Bundle overall disposition 只允许 `MEASURED_REVIEW_REQUIRED`、`FAIL`、`INCONCLUSIVE`。

即使 A/B/C 都是 `MEASURED_PROFILE_PASS_CANDIDATE`，本地 validator 也只返回 `STRUCTURALLY_COMPLETE_REPORT_ONLY / INDEPENDENT_REVIEW_REQUIRED`，不得输出 `BENCHMARK_PASS` 或把 `deviceBenchmarkPassed` 改为 true。具名安全与 QA 复核、P0/P1/P2 归零、P3 责任人与期限、PM 选择可提交档位以及 Owner 后续动作均属于单独权威事件。

## 7. Findings 与复核引用

`findings` 每项固定 finding ID、P0~P3 severity、profile/fixture/run refs、状态、责任人引用和期限；不得包含图片、文字、响应正文、Authorization、真实用户路径或 secret。P0/P1/P2 任一未关闭时 overall 必须 `FAIL` 或 `INCONCLUSIVE`；P3 保留项必须有责任人与期限。

`independentReviewRefs` 只保存未来具名复核回执的稳定 ID/摘要，不保存证件或敏感资质材料。本地 validator 只验证引用形状，不能验证现实身份、独立性或签署真值，因此始终保留 `INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED`。

## 8. 后续实现标准

后续纯本地 validator 必须至少覆盖：严格字段/资源/特殊对象、三档身份、run 唯一性、85 槽位最低 2,550 measured/765 warm-up 公式、轮换整组丢弃、重试保留、阶段不越界、聚合重算、disposition 推导、敏感材料不回显、不可变指纹与全部授权位关闭。合成测试可以缩小 fixture 集合验证算法，但结果必须标注 `SYNTHETIC_CONTRACT_FIXTURE_ONLY`，不能登记为 benchmark run 或 report。

在最低设备、Mac/Xcode、隔离原生 harness、真实 corpus 和窄范围执行授权到位前，只允许继续完善合同与 validator；不得创建假 run、假 report、假 reviewer 或 `BENCHMARK_PASS`。
