# D-034 benchmark corpus manifest 机器输入合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D034-BENCHMARK-CORPUS-MANIFEST-CONTRACT-001` |
| 对应协议 | `D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001` |
| 对应决定 / 阻断 | `D-034 / CANDIDATE`；`D039-PX5-B05 / OPEN` |
| 来源输入 | `PACKET-001-R1`；D-034 卡 commit `6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117`、blob `3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c`、SHA-256 `a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6` |
| 当前状态 | `CONTRACT_READY / CORPUS_NOT_MATERIALIZED / EXECUTION_NOT_AUTHORIZED` |

## 1. 目的和边界

本合同把 [D-034 最低支持 iPhone benchmark 协议](d034-minimum-iphone-benchmark-protocol.md)第 2、4 节转换为严格、可执行的 manifest 输入面，供未来隔离 corpus 物化后做本地结构校验。它不生成图片、响应或恶意载荷，不读取工件内容，也不验证调用方声明的 SHA-256；结构通过只表示 manifest 可进入后续人工与真机证据核验。

以下状态始终保持不变：

- `corpusMaterialized = false`、`fixtureArtifactsVerified = false`；
- `minimumPhysicalDeviceResolved = false`、`macAndSupportedXcodeAvailable = false`；
- `isolatedNativeHarnessAuthorized = false`、`benchmarkExecutionAuthorized = false`、`benchmarkExecutionStarted = false`；
- `deviceBenchmarkPassed = false`、`independentReviewPassed = false`、`ownerReviewAuthorized = false`；
- `D039-PX5-B05 = OPEN`、`formalImplementationAuthorized = false`。

合成单测中的摘要、计数与 `.example.test` 风格标识不是 corpus、设备、工具链、原生执行或独立复核证据。

## 2. 顶层输入

输入版本固定为 `D034_BENCHMARK_CORPUS_MANIFEST_INPUT_V1`，只允许以下字段：

```text
schemaVersion
contractId
protocolId
protocolRevision
sourcePacketVersion
sourceCardCommit
sourceCardBlobOid
sourceCardSha256
corpusRevision
generatedBy
generatedAt
profileMatrix
fixtures
containsRealUserData = false
containsCredential = false
```

`corpusRevision` 使用 `D034-CORPUS-RNNN`；`generatedBy` 只允许 `AUTHORIZED_CORPUS_BUILDER` 或 `SYNTHETIC_CONTRACT_FIXTURE`。时间由调用方显式传入，校验器不得读取系统时钟。所有对象拒绝未知字段、accessor、symbol、循环、特殊原型、过深树和超长字符串。

## 3. 三档 21 行矩阵

`profileMatrix` 必须严格按 A/B/C 顺序包含：

```text
conservative_fixed_limits
balanced_fixed_limits
provider_profile_with_global_ceiling
```

每档必须按协议顺序包含 21 个 `{ key, classification, unit, value }`。其中 19 行是 `DIRECT_HARD_LIMIT`，`image.jpegQuality` 是 `EXACT_CONTROL`，`memory.controlledWorkingBytes` 是 `COMPANION_CONTROL`。MiB/KiB 一律先换算为二进制字节，MP 使用十进制像素；禁止用显示字符串、近似单位或远端可变值代替机器值。

| key | unit | A | B | C |
| --- | --- | ---: | ---: | ---: |
| `input.imageBytes` | `BYTE` | 16777216 | 26214400 | 33554432 |
| `input.imagePixels` | `PIXEL` | 40000000 | 60000000 | 80000000 |
| `input.textUtf8Bytes` | `BYTE` | 32768 | 65536 | 131072 |
| `input.trendEntryCount` | `COUNT` | 128 | 256 | 512 |
| `image.longestEdgePx` | `PIXEL` | 1536 | 2048 | 2560 |
| `image.jpegQuality` | `NORMALIZED_RATIO` | 0.78 | 0.82 | 0.84 |
| `image.encodedBytes` | `BYTE` | 2097152 | 4194304 | 6291456 |
| `request.logicalBytes` | `BYTE` | 3145728 | 6291456 | 8388608 |
| `response.headerBytes` | `BYTE` | 16384 | 32768 | 65536 |
| `response.decodedBodyBytes` | `BYTE` | 1048576 | 2097152 | 4194304 |
| `time.totalSeconds` | `SECOND` | 60 | 90 | 120 |
| `time.idleSeconds` | `SECOND` | 10 | 15 | 20 |
| `stream.nonEmptyChunkCount` | `COUNT` | 1024 | 2048 | 4096 |
| `json.depth` | `COUNT` | 24 | 32 | 32 |
| `json.objectKeyCount` | `COUNT` | 4096 | 10000 | 20000 |
| `json.arrayElementCount` | `COUNT` | 4096 | 10000 | 20000 |
| `json.stringUtf8Bytes` | `BYTE` | 65536 | 262144 | 524288 |
| `json.nodeCount` | `COUNT` | 16384 | 32768 | 65536 |
| `concurrency.foregroundRequestCount` | `COUNT` | 1 | 1 | 1 |
| `temp.taskBytes` | `BYTE` | 33554432 | 67108864 | 100663296 |
| `memory.controlledWorkingBytes` | `BYTE` | 100663296 | 167772160 | 234881024 |

## 4. 必需语义槽位

三个 profile 使用同一组语义 fixture。manifest 必须恰好一次覆盖下列 85 个必需槽位；可以追加 `extension.*` fixture，但不能以扩展项替代必需槽位。

| family | 必需数 | 稳定槽位规则 |
| --- | ---: | --- |
| `NORMAL` | 8 | `normal.{meal-image,nutrition-label,plain-text,trend-summary}.{01,02}` |
| `DIRECT_LIMIT` | 38 | 19 个 `DIRECT_HARD_LIMIT` key 各有 `.at-limit` 与 `.plus-one`；`EXACT_CONTROL` 和 `COMPANION_CONTROL` 不混入 38 个计数 |
| `IMAGE_ADVERSARIAL` | 7 | `image.{corrupted,animated,transparent,pixel-bomb,invalid-orientation,frame-overflow,encoding-expansion}` |
| `STREAM_ADVERSARIAL` | 6 | `stream.{duplicate-header,compression-expansion,slow-drip,empty-heartbeat,chunk-overflow,declared-length-mismatch}` |
| `JSON_ADVERSARIAL` | 9 | `json.{invalid-utf8,duplicate-key,dangerous-key,depth-overflow,string-overflow,array-overflow,node-overflow,trailing-data,non-finite-number}` |
| `LIFECYCLE` | 11 | `lifecycle.{cancel-before-preprocess,cancel-after-preprocess,cancel-before-connect,cancel-during-upload,cancel-during-response,cancel-during-parse,foreground-background,memory-warning,low-disk,repeated-tap,kill-restart}` |
| `QUALITY_ACCESSIBILITY` | 6 | `quality.{meal-image,nutrition-label}.{normal,large-text,voiceover}` |

`DIRECT_LIMIT` 的 `fixtureId` 使用 `direct.<benchmark-key>.at-limit` 或 `direct.<benchmark-key>.plus-one`。边界项的对应逻辑计数必须等于每档矩阵值；`+1` 必须精确加一，预期在相应阶段失败关闭。JPEG 质量仍须由所有图片类 fixture 的 profile 参数绑定到矩阵精确值；受控工作内存、进程 high-water mark 与相对空闲基线增量留给每次 measured run 采集，不能伪装成 direct-limit fixture。

## 5. 单个 fixture schema

每项只允许以下字段：

```text
fixtureId
family
generatorVersion
profileParameterization = [
  conservative_fixed_limits,
  balanced_fixed_limits,
  provider_profile_with_global_ceiling
]
payloadClass
expectedStage
expectedDisposition
expectedReasonCode
exactLogicalCounts[]
artifactSha256[]
containsRealUserData = false
containsCredential = false
```

`exactLogicalCounts` 是非空、key 唯一的 `{ key, unit, valuesByProfile }` 数组；`valuesByProfile` 必须按 A/B/C 提供三个非负有限机器数。`artifactSha256` 至少一项且只能是 64 位小写十六进制摘要。校验器只检查声明形状和绑定关系，不读取摘要对应字节，也不得回显 fixture 内容、文件路径、用户文本或凭据。

稳定 disposition 只有 `ALLOW_TO_NEXT_CONTROL_ONLY`、`REJECT_AT_EXPECTED_STAGE`、`OBSERVE_WITHOUT_PASS_CLAIM`。任何 `ALLOW` 都只允许进入下一预算/解析控制，不产生 transport、Provider 请求、候选、业务写入或发送授权。

## 6. 结构通过标准

本地合同只有同时满足以下条件才返回 `STRUCTURALLY_COMPLETE_MANIFEST_ONLY`：

1. 来源身份、三档顺序、21 行 key/classification/unit/value 与协议完全一致；
2. 19/2 口径不漂移，38 个 direct-limit 必需槽位完整且边界/`+1` 精确；
3. 85 个必需槽位恰好一次出现，ID、family、profile 参数和逻辑计数无重复或缺口；
4. 每个 fixture 明确无真实用户数据、无凭据，并提供至少一个声明摘要；
5. 输入不含敏感材料、特殊对象或额外字段，规范化副本与结果均不可变并绑定 SHA-256 指纹。

即使结构通过，结果仍必须包含 `FIXTURE_ARTIFACTS_CALLER_ASSERTED_NOT_VERIFIED`、`CORPUS_NOT_MATERIALIZED`、`BENCHMARK_EXECUTION_NOT_AUTHORIZED`、`MINIMUM_DEVICE_UNRESOLVED`、`MAC_XCODE_UNAVAILABLE`、`INDEPENDENT_REVIEW_REQUIRED`。校验器不得返回 `BENCHMARK_PASS`、不得更改 Owner intake 或 ProjectOps Gate。

## 7. 后续工作

下一小件是在 `tools/` 实现纯本地 validator 与负向测试；再之后才可由另一个权威事件登记该合同。真正物化 corpus、建立原生 harness 或执行真机 benchmark 仍须按原协议取得窄范围授权、最低设备与 Mac/Xcode 资源，不能由本合同推导。
