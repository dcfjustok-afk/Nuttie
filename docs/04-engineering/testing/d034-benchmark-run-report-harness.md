# D-034 benchmark raw run/report 本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：D-034、`D039-PX5-B05`（均不因本合同获得授权或通过）
>
> 输入合同：[D-034 benchmark raw run 与报告 bundle 机器合同](d034-benchmark-run-report-contract.md)
>
> 实现：[d034-benchmark-run-report-harness.mjs](../../../tools/d034-benchmark-run-report-harness.mjs)；测试：[d034-benchmark-run-report-harness.test.mjs](../../../tools/d034-benchmark-run-report-harness.test.mjs)

## 目的

D-034 已固定 benchmark 协议、corpus manifest 合同和 raw run/report bundle 合同，但纯文档不能阻止报告只交平均值、遗漏失败 run、只丢弃一个 profile、篡改 p95，或把调用方填写的设备/复核引用直接解释为 benchmark 已通过。

本校验器只接收调用方传入的普通 JSON 数据树，在内存中验证结构、交叉绑定和可重算字段。它不扫描目录，不读取 fixture 或 raw run 文件，不访问设备、Mac/Xcode、Provider、网络、凭据或原生工具，也不写入报告。

## 严格输入

顶层固定为 `D034_BENCHMARK_RUN_REPORT_BUNDLE_INPUT_V1`，run 固定为 `D034_BENCHMARK_RUN_RECORD_V1`。协议身份精确绑定 `PACKET-001-R1`、D-034 冻结卡 commit/blob/SHA-256；manifest 身份进一步绑定 revision、manifest SHA-256、结构校验输入/结果指纹和按 `fixtureId` 排序的 fixture 身份。

manifest 身份只允许两种来源：

- `AUTHORIZED_CORPUS_MANIFEST`：至少 85 个 fixture，必需槽位覆盖数必须为 85；
- `SYNTHETIC_CONTRACT_FIXTURE`：只允许 1~16 个缩小 fixture，必需槽位不得伪装为已完整覆盖。

必需槽位覆盖数不能大于 fixture 总数或 85。每个 fixture 固定工件摘要、预期 allow/reject、稳定 reason code 和质量/无障碍证据要求；这些仍是调用方声明，不是对应字节或证据的现实真值验证。

设备、环境和 harness 字段必须完整出现；允许显式 `UNKNOWN`，但只会推导 `INCONCLUSIVE`。当前可用的 iPhone 不能被 validator 自动写成“最低设备”，任意签名类别、构建摘要或授权引用也不能由本地代码升级为现实授权。

## Raw run、组与重试

每条 run 都绑定协议、manifest、设备、环境、harness、profile、fixture 和工件摘要的身份指纹，并另外绑定去除 `diagnosticFingerprint` 后完整 run 的诊断指纹。`runId` 全 bundle 唯一。

每个 `runGroupId` 必须恰好保留 A/B/C 三条记录：

- profile 顺序只能是 `A→B→C`、`B→C→A`、`C→A→B`；
- fixture、warm-up/measured 类别和 repetition index 必须相同；
- counted group 必须覆盖三种轮换；
- 丢弃状态和 reason 必须整组三条一致，禁止只丢失败 profile；
- 丢弃组保留在 bundle，补跑必须使用新的 run/group ID，原组不进入聚合。

每条 run 恰好按顺序包含 `PREFLIGHT`、`METADATA`、`DOWNSAMPLE`、`ENCODE`、`REQUEST_ASSEMBLY`、`RESPONSE_COUNT`、`PARSE`、`CLEANUP` 八阶段。进入的阶段必须有 run 范围内单调时间；未进入阶段必须显式保存全零、空时间的 `NOT_REACHED`，不能省略。

14 个非负整数指标分别保留 controlled working memory、process high-water mark 和 idle baseline delta。写入、残留、并发超过 1、crash/jetsam/watchdog/hang、未解释内存峰值、正文/秘密日志发现、清理不完整或 expected 结果不匹配都会推导 `FAIL`。

## 覆盖、统计与 disposition

对 manifest 的每个 fixture 和每个 profile，counted repetition index 必须从 1 连续且不重复：

- warm-up 至少 3 次，不进入统计；
- measured 至少 10 次，全部进入统计；
- 扩展 fixture 自动按相同公式增加样本；
- 85 个必需槽位因此仍要求最低 765 counted warm-up 与 2,550 counted measured。

每个 profile report 的计数、expected/observed 汇总、八阶段延迟、八类指标分布和 crash/jetsam/watchdog/hang 总数都从同 bundle 的 `COUNTED / MEASURED` raw records 重建。每个分布固定 `sampleCount` 以及 `minimum/median/p95/maximum`；median 保留精确 `.5`，p95 使用 `ceil(0.95 × n) - 1` nearest-rank。调用方提交值只要与重算值不一致，整个输入失败关闭。

推导优先级为：安全/完整性失败或开放 P0/P1/P2 → `FAIL`；身份、采样、三轮换或质量证据缺失 → `INCONCLUSIVE`；否则单档最多为 `MEASURED_PROFILE_PASS_CANDIDATE`。开放 P3 必须同时给出责任人引用和期限。

即使三个 profile 都是 candidate，结果也只返回：

```text
STRUCTURALLY_COMPLETE_REPORT_ONLY
overallDisposition = MEASURED_REVIEW_REQUIRED
benchmarkPass = false
INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED
```

未来回填的安全/QA 复核引用仅校验稳定 ID、角色、摘要和时间形状；validator 不验证现实身份、独立性或签署真值，也不会据此清除 blocker。

## 失败关闭与脱敏

输入先经过节点、深度、数组、字符串、cycle、prototype、accessor、非枚举字段和 symbol 检查，再做精确字段与资源校验。明显的 key/token、Bearer、Authorization/password/secret 或邮箱形态触发 `UNSAFE_D034_BENCHMARK_RUN_REPORT`，错误只返回字段路径，不回显 canary。

`reportSha256` 对删除自身后的完整 bundle 做 key 排序规范 JSON SHA-256；数组保留协议顺序。规范化结果复制并深冻结输入。结果只输出 ID、计数、disposition、blocker、指纹和关闭边界，不回显 fixture 摘要、设备字段或 raw run。

`D034_BENCHMARK_RUN_REPORT_BOUNDARY_V1` 固定 raw/fixture 读写、网络、Provider 与业务写入为 0；最低设备、Mac/Xcode、隔离原生 harness、corpus、执行、结果、真机通过、独立复核、Owner、B05 和正式实现均为 false。

## 自动化证据

17 项顶层测试覆盖：

- V1 bundle/run、三档、八阶段、14 指标与三轮换；
- 39 条缩小合成 run 对算法的结构验证，不冒充真实 run/report；
- 3 warm-up/10 measured 缺口与 `UNKNOWN` 身份的 `INCONCLUSIVE`；
- 写入等安全越界的 `FAIL` 和永不输出 `BENCHMARK_PASS`；
- run ID、身份/诊断指纹、阶段顺序、时间与显式 `NOT_REACHED`；
- 整组 thermal 丢弃、原记录保留和新 ID 重试；
- 聚合重算、精确 median、nearest-rank p95 与伪造结果拒绝；
- P0~P3、具名复核引用仍为调用方声明、敏感材料不回显；
- accessor、symbol、特殊对象、cycle、额外字段、资源上限、不可变复制和零副作用源码审计。

运行：

```powershell
node --test tools/d034-benchmark-run-report-harness.test.mjs
```

测试生成的 39 条记录只存在于测试进程内，是 `SYNTHETIC_CONTRACT_FIXTURE_ONLY`。它们不是 raw benchmark 采样、报告工件、最低设备证据、corpus、原生 harness、执行授权或独立复核。
