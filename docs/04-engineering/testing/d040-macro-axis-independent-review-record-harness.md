# D-040 四张宏量轴卡独立复核回执本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：D-040 `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`
>
> 输入合同：[D-040 四张宏量轴卡独立复核回执机器合同](d040-macro-axis-independent-review-record-contract.md)
>
> 实现：[d040-macro-axis-independent-review-record-harness.mjs](../../../tools/d040-macro-axis-independent-review-record-harness.mjs)；测试：[d040-macro-axis-independent-review-record-harness.test.mjs](../../../tools/d040-macro-axis-independent-review-record-harness.test.mjs)

## 目的

四张宏量轴卡复核包已经冻结，但文字表格无法阻止回执漏掉复核域、卡片或跨轴不变量，也无法证明 attestation 确实绑定同一内容。本校验器把未来回执的结构、覆盖、finding 和摘要关系变成可执行失败关闭合同，同时保留现实身份与签署核验的人工门禁。

它只处理调用方传入的普通 JSON 数据树，不读取 Git 或当前文件，不打开签署工件、证件或资质材料，不访问网络、Provider 或消息系统，也不创建/保存正式回执。

## 不可变输入

`packetIdentity` 精确绑定：

- `D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001 / PACKET-001-R1`；
- 复核包事件 `EVT-20260821-006` 与输入冻结事件 `EVT-20260821-007`；
- 输入 commit `47ba489...` 与 manifest/packet 工件 commit `d8e812f...`；
- 带冻结清单的 packet blob `ffa60df...` 和 SHA-256 `b94af86...`；
- 10 份受审工件的固定顺序、路径、Git blob OID 与 SHA-256。

validator 使用内置常量比较调用方 bundle；工作区文件后来发生变化不会静默改变受审 revision，摘要匹配也不等于复核人实际阅读过文件。

## 四域 attestation

bundle 可保留 1~16 个 attestation。每项绑定具名 reviewer reference、所覆盖的四域子集、逐域 competence evidence、是否参与起草、身份核验声明、利益冲突、内容摘要、签署方法/引用和 supersession。

以下四类 attestation 可以保留为部分进度，但不计入域覆盖：

- 参与过起草；
- identity 状态为 `NOT_VERIFIED`；
- conflict 为未披露或未解决；
- `signatureMethod=NOT_SIGNED`。

未覆盖某一所声明域的 competence evidence 属于形状错误并直接拒绝；上述部分进度的整体只能推导 `INCOMPLETE`。具名核验人必须与 reviewer 不同，角色名、PM、Owner、Codex、AI 或 Agent 不能充当 reviewer。名称、胜任依据、核验引用和 signature reference 仍是 `CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS`。

## 四卡、十四不变量与 finding

四卡按 D-063/D-070/D-071/D-072 固定顺序，身份同时绑定 decision/question。每卡必须有证据引用；非 `APPROVE_SPEC` 必须引用与该卡 decision 反向相连的 finding。

跨轴结果按 `D040-MA-XAI-001` 至 `D040-MA-XAI-014` 固定顺序。`PASS` 必须有证据，`FAIL` 必须有 finding；`NOT_VERIFIED` 保留覆盖缺口。所有 finding 都必须至少被卡或不变量引用，禁止悬空；`PASS` 不变量不能引用开放 P0/P1/P2。

P0/P1/P2 开放即阻断，关闭时必须有 closure evidence。开放 P3 只有同时存在责任人引用、晚于本次 review 的期限和非阻断理由时才可保留；其他状态不得携带这些 P3 专用字段。

## Disposition 与两层摘要

重算优先级固定为：

```text
REJECTED > CHANGES_REQUIRED > INCOMPLETE > INDEPENDENT_REVIEW_PASS_CANDIDATE
```

- reject 卡、FAIL 不变量或开放 P0 → `REJECTED`；
- required change 卡或开放 P1/P2 → `CHANGES_REQUIRED`；
- out-of-scope、not-verified 或四域可计数覆盖不足 → `INCOMPLETE`；
- 其余严格完整状态才是 candidate。

`reviewContentSha256` 绑定 packet、10 输入、四卡、14 不变量、finding、disposition 和时间等复核内容；每个 attestation 引用该摘要。`bundleSha256` 再绑定完整 bundle 和全部 attestations。提交值与重算值任一不一致即拒绝。

正式回执即使得到 candidate，结果也只返回：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
macroAxisIndependentReviewPassCandidate = true
macroAxisIndependentReviewPassed = false
```

只有外部人工核验身份、胜任、独立性和签署工件后，才可能另行登记权威复核事件。

## 合成 fixture 与脱敏

测试使用 `SYNTHETIC_CONTRACT_FIXTURE` 在内存中覆盖完整算法路径。其结果固定为 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`；即使 `wouldBeMacroAxisIndependentReviewPassCandidate=true`，`macroAxisIndependentReviewPassCandidate` 仍为 false，不创建 reviewer、attestation、正式回执或 PASS 证据。

输入拒绝 key/token、Bearer、Authorization/password/secret、邮箱、电话、证件号、PEM、签名图片/data URL 等敏感材料，错误只携带稳定字段路径，不回显原值。普通数据树还严格拒绝 cycle、accessor、symbol、特殊 prototype、稀疏数组、额外字段和资源超限。

## 自动化证据

20 项顶层测试覆盖：

- V1 schema、冻结 packet、10 输入、4 域、4 卡和 14 不变量；
- 合成 fixture 与正式 candidate 的证据边界；
- 起草参与、身份、conflict、签署与域覆盖缺口；
- reject/change/incomplete/pass 四类 disposition 和优先级；
- 卡片/不变量顺序、finding 双向引用、P0~P3 与 closure；
- review content/attestation/bundle 双层 SHA-256；
- formal/synthetic ID、supersession、重复身份和 competence；
- 敏感材料不回显、严格数据树、深复制冻结、结果防伪与源码零副作用审计。

运行：

```powershell
node --test tools/d040-macro-axis-independent-review-record-harness.test.mjs
```

测试内的 Example reviewer、核验人和 signature reference 全部是进程内合成合同 fixture，不得保存、外联或登记为现实复核证据。

## 固定零授权边界

结果固定 Git/文件/签署工件/证件/胜任材料读写、网络、Provider、消息和业务写入为 0；reviewer assignment、现实身份/独立性/胜任范围/签名核验、review started/passed、健康评审人指派、健康批准、Content QA、D-063/D-070 接受、四卡 Owner-ready、Owner intake/选择、PX-1/PX-2、目标/记录/持久化/正式根工程、原生 iOS 与正式实现授权全部为 false。
