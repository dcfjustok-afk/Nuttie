# D-036 Provider/原生兼容报告本地校验合同

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-HARNESS-001` |
| 对应机器合同 | `D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-CONTRACT-001` |
| 输入版本 | `D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_INPUT_V1` |
| attempt 版本 | `D036_PROVIDER_NATIVE_COMPATIBILITY_ATTEMPT_V1` |
| 结果版本 | `D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_RESULT_V1` |
| 边界版本 | `D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_BOUNDARY_V1` |
| 当前状态 | `SPIKE / LOCAL_ONLY / NON_PRODUCTION` |

## 1. 目的

本地 validator 把 [D-036 run 与报告机器合同](d036-provider-native-compatibility-report-contract.md)落实为可执行的失败关闭检查。它接收调用方提供的完整 bundle，复用 [OI-07 Provider target validator](oi07-provider-target-intake-harness.md)，重算 raw attempt、cell、离线矩阵、原生 evidence surface、finding、整体 disposition 与各层 SHA-256。

它不读取 OI-07 文件、Git、Provider 文档、capture、Xcode/native 工件、凭据或真实 attempt，不创建本地 server、网络请求、原生 harness、报告、复核回执或 ProjectOps 事件。

## 2. 可执行 schema 收口

机器合同中的嵌套对象固定为以下执行字段：

- `corpusIdentity`：revision、fixture count、manifest SHA-256、规范字节数、corpus fingerprint 与三项敏感材料 false 声明；
- `executionAuthorization`：authorization ID、authorizer 引用、起止时间、Provider/path 范围、最大总成本/币种、credential 注入引用、三项调用方授权声明与 authorization fingerprint；
- `offlineHarnessResults`：profile/build/runtime/family、environment、identity、measured/passed/failed、finding/evidence 与 result fingerprint；
- `nativeBoundaryResults[].evidenceRefs[]`：稳定 evidence ID/type、summary/artifact SHA-256 与 environment 关联；
- `findings[]`：P0~P3、OPEN/CLOSED、cell/attempt/surface 引用、Owner/期限、处置与非阻断摘要 SHA-256、finding fingerprint；
- `independentReviewRefs[]`：稳定 review ID、Security/QA 角色、被复核工件 SHA-256、disposition、签署方式/时间和摘要 SHA-256。

所有对象使用精确字段，数组保持协议顺序。正式报告必须完整覆盖 `3 × 3 × 2 × 2 = 36` 个 cell、`3 × 2 × 2 × 9 = 108` 个离线结果和 `3 × 13 = 39` 个原生边界结果。每个正式 cell 的 `NORMAL / CANCEL / EXPECTED_ERROR` 各至少 3 次；缩小合成 fixture 各至少 1 次，并且必须使用正式集合的非空真子集。

## 3. 重算与失败优先级

validator 从 raw attempt 重算：

- attempt ID、连续 repetition、协议/OI-07/environment/corpus/authorization identity 和 diagnostic fingerprint；
- 逐 origin request、Authorization byte、payload byte 以及未批准 origin 汇总；
- 自动 cookie、共享 cache/credential、持久状态和跨 attempt 复用；
- 自动 retry、业务写入、终态临时对象/文件和迟到 callback mutation；
- cell 的 path 次数、origin 数、finding 引用、disposition 与 cell fingerprint；
- 离线 `measured = passed + failed`、最低次数、identity 与 result fingerprint；
- 13 个 native surface 的状态、evidence/environment 引用和 result fingerprint；
- P0~P3 finding 引用、开放项责任人与期限，以及整体 disposition。

优先级固定为：已观察越界、离线失败或开放 P0/P1/P2 先得到 `FAIL`；无失败但存在输入、环境、授权、cell、次数或证据缺口得到 `INCONCLUSIVE`；只有完整正式报告可得到 `MEASURED_REVIEW_REQUIRED`。Provider/profile 明确不兼容和 C profile 不可行仍可进入完整 measured report，不能被改写成 profile PASS。

无论结构结果为何，validator 只返回 `STRUCTURALLY_COMPLETE_REPORT_ONLY`，并始终返回：

```text
providerCompatibilityPass = false
nativeBoundaryPass = false
independentReviewPassed = false
ownerReviewAuthorized = false
b05Closed = false
formalImplementationAuthorized = false
```

## 4. 安全与资源边界

输入在业务校验前拒绝 accessor、symbol、非枚举字段、特殊对象、cycle、超深节点、超长字符串和超大数组。key/token、Bearer、Authorization/password/secret、个人邮箱、带敏感 query 的 URL 或正文形态触发 `UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT`；错误只含稳定 code 与字段路径，不回显 canary。

规范化结果复制并深冻结。返回结果只含计数、状态、blocker、fingerprint 和关闭边界，不回显 OI-07 target、environment 详情、hop、finding 摘要或 raw attempt。

## 5. 验证

运行：

```powershell
node --test tools/d036-provider-native-compatibility-report-harness.test.mjs
```

当前 20 项测试覆盖：

1. V1 bundle/attempt/result/boundary、3 Provider、3 profile、2 build、2 runtime、9 family、13 surface；
2. 缩小合成 fixture 只能得到 `INCONCLUSIVE`，完整正式 36-cell/324-attempt 只能得到 `MEASURED_REVIEW_REQUIRED`；
3. attempt 删除、repetition 重排、聚合伪造和各层 fingerprint 漂移；
4. 未批准 origin 字节、cookie/cache/credential、retry/write/residual/late callback；
5. 离线失败优先级、RN fetch 13 surface 可行性、P0~P3；
6. OI-07 input/result 双 fingerprint、environment/corpus/authorization 绑定与过期处理；
7. review 引用不授予 PASS、result/boundary 防篡改、深冻结、敏感材料不回显；
8. 零 filesystem、network、clock、process、Provider、corpus 与 native side effect。

测试使用的 formal-looking 数据由内存中合成，仅验证算法，不保存为 run/report，不是现实 OI-07、Provider、Mac/Xcode、真机、capture、原生证据、复核或授权。

## 6. 当前事实

当前仍为：

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

下一步仍是取得真实无密钥 OI-07、Mac/Xcode/真机、隔离原生 harness、合成 corpus、credential 注入和窄范围真实网络授权；本 validator 不关闭其中任何一项。
