# D-034 benchmark corpus manifest 本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：D-034、`D039-PX5-B05`（均不因本合同获得授权或通过）
>
> 输入合同：[D-034 benchmark corpus manifest 机器输入合同](d034-benchmark-corpus-manifest-contract.md)
>
> 实现：[d034-benchmark-corpus-manifest-harness.mjs](../../../tools/d034-benchmark-corpus-manifest-harness.mjs)；测试：[d034-benchmark-corpus-manifest-harness.test.mjs](../../../tools/d034-benchmark-corpus-manifest-harness.test.mjs)

## 目的

D-034 真机协议已经固定三档 21 行矩阵和 scenario family，但未来 corpus manifest 若只靠手工表格，仍可能出现十进制/二进制单位漂移、把 JPEG 与内存控制混入 19 项硬上限、遗漏 direct-limit `+1`、不同 profile 使用不同语义场景、图片未绑定精确 JPEG 参数或摘要/数据边界缺失。

本合同实现纯本地 `D034_BENCHMARK_CORPUS_MANIFEST_INPUT_V1` 校验。它只验证声明结构和绑定关系，不读取摘要对应工件、不生成 fixture、不运行模拟器/真机、不访问设备、Mac/Xcode、Provider、网络或凭据。

## 固定输入

来源身份必须精确绑定 `PACKET-001-R1`、D-034 冻结卡 commit/blob/SHA-256 和版本化 protocol/corpus revision。三档按 A/B/C 固定顺序，各自包含同一 21 个 key：

- 19 个 `DIRECT_HARD_LIMIT`；
- `image.jpegQuality / EXACT_CONTROL`；
- `memory.controlledWorkingBytes / COMPANION_CONTROL`。

机器值直接使用 `BYTE`、`PIXEL`、`COUNT`、`SECOND`、`NORMALIZED_RATIO`，不接受 `MB`、显示字符串、近似值或重排字段。

manifest 必须恰好一次包含 85 个必需语义槽位：

| family | 必需数 |
| --- | ---: |
| `NORMAL` | 8 |
| `DIRECT_LIMIT` | 38 |
| `IMAGE_ADVERSARIAL` | 7 |
| `STREAM_ADVERSARIAL` | 6 |
| `JSON_ADVERSARIAL` | 9 |
| `LIFECYCLE` | 11 |
| `QUALITY_ACCESSIBILITY` | 6 |

允许追加严格 schema 的 `extension.*` 项，但扩展项不能替代必需槽位。19 个硬上限各有一个精确边界与一个精确 `+1`；所有 `IMAGE` fixture（包括扩展项）必须绑定 A/B/C 的 `0.78/0.82/0.84` JPEG 参数。

## 失败关闭与脱敏

输入先经过普通 JSON 树、节点、深度、数组、字符串、cycle、prototype、accessor、非枚举字段和 symbol 检查，再做精确字段、来源、矩阵、槽位、计数、摘要与数据标志校验。明显的 key/token/Authorization/password/secret、Bearer 或邮箱形态触发 `UNSAFE_D034_BENCHMARK_CORPUS_MANIFEST`；错误不回显 canary。

每个 fixture 必须声明 `containsRealUserData = false`、`containsCredential = false`，并提供至少一个小写 64 位 SHA-256。校验器不读取摘要对应字节，因此摘要只属于调用方声明，不能据此把 corpus 标为已物化或已核验。

规范化会复制并深冻结输入，并按 `fixtureId` 排序后计算 SHA-256；同一 manifest 的 fixture 输入顺序不会改变指纹。结果只返回合同/协议 ID、计数、family 汇总、blocker 和指纹，不返回 generator、逻辑计数或工件摘要。

## 结果语义

有效输入只返回 `STRUCTURALLY_COMPLETE_MANIFEST_ONLY`，同时固定保留：

```text
FIXTURE_ARTIFACTS_CALLER_ASSERTED_NOT_VERIFIED
CORPUS_NOT_MATERIALIZED
BENCHMARK_EXECUTION_NOT_AUTHORIZED
MINIMUM_DEVICE_UNRESOLVED
MAC_XCODE_UNAVAILABLE
INDEPENDENT_REVIEW_REQUIRED
```

`D034_BENCHMARK_CORPUS_MANIFEST_BOUNDARY_V1` 进一步固定：fixture 工件读写、网络、Provider 请求与业务写入均为 0；最低设备、Mac/Xcode、隔离原生 harness、benchmark 执行、真机结果、独立复核、Owner、B05 和正式实现都未授权或未通过。伪造 `BENCHMARK_PASS`、清空 blocker、改变计数/指纹或把任一门禁改为 `true` 均被完整结果重建拒绝。

## 自动化证据

13 项顶层测试覆盖：

- 3 档、21 行、19+2 口径、85 个必需槽位和七类 family 计数；
- profile 身份/顺序/key/classification/unit/value/字段漂移；
- 来源身份、revision、生成者、RFC 3339 时间和顶层 schema；
- 必需槽位缺失、重复、改名、跨 family 与语义漂移；
- 38 个 direct-limit 边界/`+1` 精确绑定；
- 必需与扩展图片的 JPEG 精确参数；
- 受控扩展项、逻辑计数、摘要、真实用户数据和凭据边界；
- secret/邮箱 canary 不回显；
- accessor、非枚举字段、symbol、特殊对象、cycle、深度和资源上限；
- 不可变复制、顺序无关指纹、伪造结果拒绝与零副作用源码审计。

运行：

```powershell
node --test tools/d034-benchmark-corpus-manifest-harness.test.mjs
```

测试只在内存中生成合成 manifest 和摘要。它不是 corpus 物化、最低设备证据、原生 harness、benchmark 授权、真机采样或独立复核。
