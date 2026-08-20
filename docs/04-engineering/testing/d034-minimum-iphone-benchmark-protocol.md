# D-034 最低支持 iPhone 资源预算 benchmark 协议

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001` |
| 对应决定 | `D-034 / CANDIDATE` |
| 对应阻断 | `D039-PX5-B05 / OPEN` |
| 输入版本 | `PACKET-001-R1`；D-034 卡冻结于 commit `6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117` |
| D-034 输入 blob | Git blob OID `3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c`；SHA-256 `a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6` |
| 当前状态 | `PROTOCOL_READY / EXECUTION_NOT_AUTHORIZED / MINIMUM_DEVICE_UNRESOLVED / NO_RESULTS` |
| 当前可用设备 | `iPhone 16 Pro Max / iOS 26.5`，只可作为高端补充观察，不是最低设备证据 |
| 授权边界 | fixture、原生 harness、真机执行、结论、Owner 评审、B05 关闭和正式实现均未授权或未发生 |

## 1. 目的与非目标

本协议把 [D-034 三档资源预算卡](../../03-design/d034-ai-resource-budget-card-spec.md)中的真机门禁变成可重复执行、可比较、可失败关闭的测试合同。它只规定如何取得证据，不提供设备结果，也不把任何候选数值升级为性能事实。

本协议不得被解释为：

- 已确定“最低支持 iPhone”的具体机型；D-011 只接受了 iOS 17+，没有单独接受最低物理机型；
- 已授权创建正式 React Native 根工程、`ios/`、原生 transport、真实 Provider 请求或读取生产凭据；
- 当前 iPhone 16 Pro Max、Windows JS export、模拟器、桌面脚本或合成报告可以替代最低设备真机；
- D-034 benchmark 可以替代 D-033 逐次确认、D-036 transport 隔离、D-053 Provider 用途准入或六卡独立复核；
- 协议准备完成就能把 `deviceBenchmarkPassed`、`ownerReviewAuthorized`、`formalImplementationAuthorized` 或 `D039-PX5-B05` 改为通过。

## 2. 预算维度口径

冻结卡的数值矩阵共有 21 行。治理事件中的 `budgetDimensionCount = 19` 专指可在对应阶段直接计数并执行 allow/reject 的硬上限；另外两行仍必须测试和报告，但不混入该计数：

- `image.jpegQuality` 是精确编码参数，不是“最大质量”天花板；实际编码必须等于当前 profile 值。
- `memory.controlledWorkingBytes` 是 Nuttie 可归因缓冲与派生对象的聚合规划预算，并要求同时记录进程 high-water mark；它不能冒充 iOS 对进程总内存的硬限制。

因此执行与报告必须同时保留 `profileMatrixRowCount = 21`、`directHardLimitCount = 19` 和 `companionControlCount = 2`。不得用“19 维”跳过 JPEG 参数或内存证据，也不得把 21 行误报成 21 个独立输入上限。

| 顺序 | benchmark key | A | B | C | 分类与断言 |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | `input.imageBytes` | 16 MiB | 25 MiB | 32 MiB | 硬上限；读取像素前计数 |
| 2 | `input.imagePixels` | 40 MP | 60 MP | 80 MP | 硬上限；方向校正后的宽×高，拒绝溢出 |
| 3 | `input.textUtf8Bytes` | 32 KiB | 64 KiB | 128 KiB | 硬上限；按 UTF-8 字节计数 |
| 4 | `input.trendEntryCount` | 128 | 256 | 512 | 硬上限；不按序列化后偶然长度代替 |
| 5 | `image.longestEdgePx` | 1536 | 2048 | 2560 | 硬上限；直接下采样，不先建全尺寸副本 |
| 6 | `image.jpegQuality` | 0.78 | 0.82 | 0.84 | 精确控制；不计入 19 项硬上限 |
| 7 | `image.encodedBytes` | 2 MiB | 4 MiB | 6 MiB | 硬上限；去元数据发送副本 |
| 8 | `request.logicalBytes` | 3 MiB | 6 MiB | 8 MiB | 硬上限；未压缩逻辑 header + body |
| 9 | `response.headerBytes` | 16 KiB | 32 KiB | 64 KiB | 硬上限；重复 header 累计 |
| 10 | `response.decodedBodyBytes` | 1 MiB | 2 MiB | 4 MiB | 硬上限；按解压后的实际字节计数 |
| 11 | `time.totalSeconds` | 60 | 90 | 120 | 硬上限；各阶段仍须记录分段耗时 |
| 12 | `time.idleSeconds` | 10 | 15 | 20 | 硬上限；只由非空解压 body 字节重置 |
| 13 | `stream.nonEmptyChunkCount` | 1024 | 2048 | 4096 | 硬上限；空 heartbeat 不累计也不延长 idle |
| 14 | `json.depth` | 24 | 32 | 32 | 硬上限；建树前或建树中执行 |
| 15 | `json.objectKeyCount` | 4096 | 10,000 | 20,000 | 硬上限；重复 key 仍按非法输入拒绝 |
| 16 | `json.arrayElementCount` | 4096 | 10,000 | 20,000 | 硬上限；跨数组累计 |
| 17 | `json.stringUtf8Bytes` | 64 KiB | 256 KiB | 512 KiB | 硬上限；按单字符串 UTF-8 字节计数 |
| 18 | `json.nodeCount` | 16,384 | 32,768 | 65,536 | 硬上限；所有 JSON 节点累计 |
| 19 | `concurrency.foregroundRequestCount` | 1 | 1 | 1 | 硬上限；重复点击不得创建第二请求 |
| 20 | `temp.taskBytes` | 32 MiB | 64 MiB | 96 MiB | 硬上限；任务控制内全部临时对象累计 |
| 21 | `memory.controlledWorkingBytes` | 96 MiB | 160 MiB | 224 MiB | 聚合规划/证据控制；不计入 19 项硬上限 |

MiB/KiB 均按二进制计算。任何执行工具若不能精确实现上述单位、计数阶段或分类，必须在 preflight 失败，不能用近似换算继续生成结果。

## 3. 执行前置条件

只有以下条件全部满足，benchmark run 才能从 `NOT_AUTHORIZED` 进入 `READY_TO_EXECUTE`：

1. PM 记录一个明确且仅限 benchmark 的执行授权；该授权不能扩大为正式根工程或生产 AI transport。
2. 冻结最低物理设备身份：精确机型标识、容量、iOS 17.x 精确版本、可用存储、最大电池容量、供电方式和是否经过维修。iOS 版本下限不能自动推导具体机型。
3. 准备可运行受支持 Xcode 的 Mac、精确 Xcode/SDK/工具版本和受控真机；模拟器只能做 corpus 预检。
4. 冻结隔离 benchmark harness 的 commit、构建配置、签名身份类别、bundle identifier、依赖锁文件、编译器设置和产物 SHA-256。正式 App 不存在时必须明确标记 `ISOLATED_BENCHMARK_HARNESS`。
5. 冻结三个 profile 的 21 行矩阵和同一 corpus manifest；每个 fixture 都有生成参数、期望阶段、期望结果、字节/结构计数与 SHA-256。
6. harness 不读取真实 Keychain secret、不使用真实用户照片/文字、不连接真实 Provider、不写业务数据库；需要流语义时使用离线注入流，或在另行授权后使用无凭据的受控测试 transport。
7. 建立可验证的临时目录枚举、数据库变更集、请求计数、取消/kill 注入、日志脱敏和启动清理探针。
8. 具名安全与 QA 复核人尚未指派时可以执行采样，但结果只能是 `MEASURED / REVIEW_REQUIRED`，不能成为 `BENCHMARK_PASS`。

任一前置缺失必须形成结构化 blocker，不允许执行者在报告里补写假定值。

## 4. Corpus manifest

三个 profile 必须使用同一组语义场景；仅边界参数随 profile 注入。manifest 至少包含以下 scenario family：

| family | 最小覆盖 | 必须结果 |
| --- | ---: | --- |
| `NORMAL` | 餐食图、细字标签、纯文本、趋势摘要各至少 2 个 | 在预算内完成；不 crash/jetsam；不产生未经确认业务写入 |
| `DIRECT_LIMIT` | 19 项硬上限各 1 个精确边界与 1 个 `+1` | 边界样本按 schema 有效性得到预期允许；`+1` 在指定阶段稳定拒绝 |
| `IMAGE_ADVERSARIAL` | 损坏、动画、透明、像素炸弹、错误方向、超 frame、编码膨胀 | 解码/编码前后对应阶段失败关闭，不产生全尺寸失控副本 |
| `STREAM_ADVERSARIAL` | header 重复、压缩膨胀、慢滴流、空 heartbeat、超 chunk、声明长度欺骗 | 实际计数优先；关闭流并丢弃全部未验证响应 |
| `JSON_ADVERSARIAL` | 无效 UTF-8、重复/危险 key、深度、长字符串、大数组、节点、尾随数据、非有限数 | 受控 parser 中拒绝，不回显正文、不产生候选 |
| `LIFECYCLE` | 预处理前后、连接前、上传/响应/解析中取消；前后台、内存警告、低磁盘、重复点击、kill/restart | 请求数、数据库写入、临时残留和重放语义符合预期 |
| `QUALITY_ACCESSIBILITY` | 三档下同一餐食图/细字标签；正常、放大文字与 VoiceOver 流程 | 记录可读性与任务完成证据，不自动把主观观察写成通过 |

每个 fixture 记录：

```text
fixtureId
family
generatorVersion
profileParameterization
payloadClass
expectedStage
expectedDisposition
expectedReasonCode
exactLogicalCounts
artifactSha256[]
containsRealUserData = false
containsCredential = false
```

`DIRECT_LIMIT` 的最低数量是 38 个参数化场景（19×边界/`+1`）；这不包含两项 companion control。JPEG 质量必须在所有图片场景验证为当前 profile 精确值；controlled working memory、进程 high-water mark 和相对空闲基线增量必须在所有 measured run 中采集。

## 5. 设备与环境控制

每个 run group 开始前记录：

- `deviceModelIdentifier`、容量、iOS build、battery health、可用存储、供电状态；
- harness commit/build/产物 SHA-256、profile ID/revision、corpus manifest SHA-256；
- Xcode/SDK/测量工具版本、网络模式、系统区域/语言、Low Power Mode、thermal state；
- 冷启动/热启动、前台/后台、空闲基线时长与清理前目录快照。

除专门的低存储、内存警告、后台与 thermal scenario 外，常规组必须在同一供电策略、无其他前台负载和可比较 thermal state 下执行。A/B/C 顺序按 `A→B→C`、`B→C→A`、`C→A→B` 轮换；出现不受控 thermal escalation 时丢弃该组并记录，不得只重跑失败 profile。

每个 scenario/profile 先做 3 次不计结果的 warm-up，再做至少 10 次 measured repetition。失败重试必须使用新 run ID，原失败记录永久保留。

## 6. 单次执行与采样

1. 校验所有输入 hash、profile revision、设备/产物身份和目录/数据库空闲基线。
2. 启动采样后才触发一个 scenario；不得预先把完整图片或响应载入内存。
3. 记录预检、元数据、下采样、编码、请求组装、响应计数、解析、清理各阶段的单调时钟耗时。
4. 同时记录 CPU time、Nuttie 可归因工作内存、进程 high-water mark、相对空闲基线增量、临时磁盘峰值、请求数、数据库变更数、取消/kill 点和终态原因码。
5. allowed case 只到“受控候选形成前”或显式本地 fake-confirm 边界；不得发送真实 Provider 请求或写正式业务库。
6. rejected/cancelled case 必须验证流已关闭、未验证缓冲已丢弃、临时对象最终为空、数据库变更为 0，且新任务不会复用旧确认或 attempt。
7. kill/restart case 在下一次冷启动先完成旧 staging 对账，再允许新任务；不得把未知结果自动重发。
8. 保存结构化指标与脱敏诊断；不保存图片/文字正文、响应正文、Authorization、真实路径中的用户内容或 Provider secret。

## 7. 通过、失败与不可判定标准

单个 profile 只有同时满足以下条件，才能得到 `MEASURED_PROFILE_PASS_CANDIDATE`：

- 所有 required scenario 均执行，输入/产物/设备证据完整，10 次 measured repetition 无缺口；
- allowed case 为 10/10 预期终态，且无 crash、jetsam、watchdog termination、hang 或未解释的内存峰值；
- 每个 `+1`、恶意和非法 case 为 10/10 在预期阶段失败，未越过昂贵分配、transport、parser 或持久化边界；
- 取消、失败、超限和启动恢复后的业务写入数均为 0，App 控制内最终临时残留数均为 0；
- 并发场景始终只有 1 个前台任务；重复点击未生成第二请求或复用旧授权；
- 21 行 profile 都有可追溯断言；JPEG 质量精确匹配，controlled working memory 与进程 HWM 均已报告；
- 正常/边界图片的可读性证据完整，未通过提高尺寸、质量或 profile 绕过限制。

出现任一安全边界越过、数据写入、秘密/正文日志、残留不可清理、crash/jetsam、计数不可信或 fixture/hash 漂移时，profile 为 `FAIL`。设备、工具、产物、corpus、采样或计数证据缺失时为 `INCONCLUSIVE`，不得按通过或失败样本择优重跑后删除原记录。

`MEASURED_PROFILE_PASS_CANDIDATE` 仍不是 `deviceBenchmarkPassed = true`。只有 A/B/C 同 corpus 报告完成、具名安全与 QA 独立复核的 P0/P1/P2 均归零、保留 P3 有责任人与期限，且 PM 明确记录可进入 Owner 对比的 profile 集合后，才能另行登记 D-034 benchmark 门禁结果。

## 8. 报告最小 schema

```text
reportId
protocolId = D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001
protocolRevision
sourcePacketVersion = PACKET-001-R1
sourceCardCommit
sourceCardBlobOid
sourceCardSha256
deviceIdentity
environmentIdentity
harnessIdentity
corpusManifestSha256
profileMatrixRowCount = 21
directHardLimitCount = 19
companionControlCount = 2
profileReports[3]
  profileId
  scenarioCount
  measuredRunCount
  allowedExpectedAndObserved
  rejectedExpectedAndObserved
  latencyDistributionByStage
  cpuDistribution
  controlledWorkingMemoryDistribution
  processHighWaterMarkDistribution
  temporaryDiskPeakDistribution
  crashJetsamWatchdogCounts
  requestCountDistribution
  databaseWriteCountDistribution
  residualObjectCounts
  qualityAccessibilityEvidenceRefs
  disposition
findings[]
independentReviewRefs[]
overallDisposition
generatedAt
reportSha256
```

原始 run 记录必须可从报告引用并重算聚合值。不得只提交截图、平均值或手工表格；至少报告最小值、中位数、p95、最大值和 10 次原始值，且不得以平均值掩盖一次越界。

## 9. 当前阻断与下一动作

当前不能执行，原因是：

1. 最低物理 iPhone 机型未冻结；现有 iPhone 16 Pro Max 不是最低设备证据。
2. 当前没有可用 Mac、受支持 Xcode、隔离原生 harness 或最低设备。
3. 正式根工程、原生 iOS 工作和真实 transport 均未授权；本协议不扩大 D-032 授权。
4. fixture/corpus 尚未物化和冻结，安全/QA 具名复核人也未指派。

下一步是先由 PM 取得窄范围 benchmark 执行授权，并确认最低设备与 Mac/Xcode 资源；随后在独立目录建立合成 corpus 与 harness，冻结 manifest 后执行。若这些外部条件仍缺失，D-034 必须继续保持 `DEVICE_BENCHMARK_REQUIRED / NOT_OWNER_READY`。

## 10. 当前机器可读边界

```text
protocolReady: true
sourcePacketVersion: PACKET-001-R1
profileCount: 3
profileMatrixRowCount: 21
directHardLimitCount: 19
companionControlCount: 2
directLimitScenarioMinimum: 38
fixtureManifestRequired: true
minimumPhysicalDeviceResolved: false
macAndSupportedXcodeAvailable: false
isolatedNativeHarnessAuthorized: false
corpusMaterialized: false
benchmarkExecutionStarted: false
benchmarkResultRecorded: false
deviceBenchmarkPassed: false
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
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
next: D034_BENCHMARK_AUTHORIZATION_DEVICE_AND_TOOLCHAIN_REQUIRED
```
