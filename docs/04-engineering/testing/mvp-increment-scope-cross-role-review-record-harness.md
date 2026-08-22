# 首个 MVP 增量范围跨角色复核回执本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：`G2 IN_PROGRESS / NO_REVIEW_RECORD / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED`
>
> 输入合同：[首个 MVP 增量范围跨角色复核回执机器合同](mvp-increment-scope-cross-role-review-record-contract.md)
>
> 实现：[mvp-increment-scope-cross-role-review-record-harness.mjs](../../../tools/mvp-increment-scope-cross-role-review-record-harness.mjs)；测试：[mvp-increment-scope-cross-role-review-record-harness.test.mjs](../../../tools/mvp-increment-scope-cross-role-review-record-harness.test.mjs)

## 目的

复核包已冻结 11 份输入、A/B/C 三项候选范围、5 个复核域和 12 条跨选项不变量。本校验器把未来回执的形状、覆盖、finding、处置推导和摘要绑定变成可执行的失败关闭合同，避免漏项、错 revision 或把自述身份冒充跨角色复核通过。

它只处理调用方传入的普通 JSON 数据树，不读取 Git、工作区文件、证件、资质或签署工件，不访问网络、Provider 或消息系统，也不创建、保存或批准现实回执。

## 不可变输入

`packetIdentity` 精确绑定：

- `MVP-INCREMENT-SCOPE-REVIEW-PACKET-001 / PACKET-001-R1`；
- 输入冻结事件 `EVT-20260822-010`；
- manifest commit `9891e6a...` 与登记 commit `6be59e5...`；
- packet commit `6be59e5...`、blob `3b23204...` 和 SHA-256 `d17ae5f...`；
- 11 份受审工件的固定顺序、路径、Git blob OID 与 SHA-256。

validator 只把 bundle 与内置常量比较。工作区后续变化不会静默改变受审 revision；摘要匹配也不证明 reviewer 现实中读过这些文件。

## 五域 attestation

bundle 可包含 1~20 个 attestation。每项绑定具名 reviewer reference、五域子集、逐域 competence evidence、是否参与起草、身份核验声明、利益冲突、内容摘要、签署方法/引用和 supersession。

以下 attestation 可以保留为部分进度，但不计入域覆盖：

- 参与过起草；
- identity 状态为 `NOT_VERIFIED`；
- conflict 未披露或未解决；
- `signatureMethod=NOT_SIGNED`。

所声明域必须与 competence evidence 一一对应。具名核验人必须与 reviewer 不同；PM、Owner、只有角色/域名的名称、Codex、AI 或 Agent 不能充当 reviewer。名称、身份、胜任、独立性和签署均只属于调用方声明，校验器不做现实核验。

## 三项范围、十二不变量与 finding

A/B/C 必须按固定顺序绑定：

```text
A = MVP-I1-LOCAL-MEAL
B = MVP-I1-FULL-MANUAL
C = MVP-I1-LOCAL-MEAL-BARCODE
```

每项至少有一个证据引用；除 `APPROVE_SCOPE_OPTION` 外都必须引用与该 option 反向相连的 finding。`OUT_OF_SCOPE` 必须填写一个 required review domain，其他处置必须为 `null`。

跨选项结果按 `MVP-SCOPE-XI-001` 至 `MVP-SCOPE-XI-012` 固定顺序。`PASS` 必须有证据，`FAIL` 必须引用 finding，`NOT_REVIEWED` 保留覆盖缺口。finding ID 使用 `MVP-SCOPE-CR-FNNN`，至少关联一个 A/B/C，并且必须被 option 或不变量引用；`PASS` 不变量不能引用开放 P0/P1/P2。

P0/P1/P2 开放即阻断，关闭时必须有 closure evidence。开放 P3 只有同时具备责任人引用、晚于 review 的期限和非阻断理由时才可保留；其他状态不能携带这些 P3 专用字段。

## Disposition 与双层摘要

重算优先级固定为：

```text
REJECTED > CHANGES_REQUIRED > INCOMPLETE > CROSS_ROLE_REVIEW_PASS_CANDIDATE
```

- reject option、FAIL 不变量或开放 P0 → `REJECTED`；
- required change 或开放 P1/P2 → `CHANGES_REQUIRED`；
- out-of-scope、not-reviewed 或五域可计数覆盖不足 → `INCOMPLETE`；
- 其余严格完整状态才是 candidate。

`reviewContentSha256` 绑定 packet、11 输入、三项处置、12 不变量、finding、disposition 和时间等复核内容；每个 attestation 必须引用它。`bundleSha256` 再绑定完整 bundle 和全部 attestation。任一提交值与重算值不一致即拒绝。

正式 bundle 即使得到 candidate，也只返回：

```text
STRUCTURALLY_COMPLETE_REVIEW_ONLY
crossRoleReviewPassCandidate = true
crossRoleReviewPassed = false
```

真实 PASS 仍需获授权人员核验外部身份、胜任、独立性和签署工件后另行登记。

## 合成 fixture、脱敏与资源边界

`SYNTHETIC_CONTRACT_FIXTURE` 只覆盖算法路径，结果固定为 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`，且 `crossRoleReviewPassCandidate=false`。测试里的 Example reviewer、核验人和 signature reference 都是进程内合成数据，不得保存、外联或登记为现实证据。

输入拒绝 key/token、Bearer、Authorization/password/secret、邮箱、电话、证件号、PEM、签名图片/data URL 等敏感材料，错误只携带稳定字段路径，不回显原值。普通数据树还严格拒绝 cycle、accessor、symbol、特殊 prototype、稀疏数组、额外字段和资源超限；上限与机器合同一致：20 个 attestation、128 个 finding、25,000 个节点、深度 18、单数组 256 项。

## 自动化证据

20 项顶层测试覆盖 schema 与冻结输入、五域 attestation、三项处置、12 不变量、finding 双向引用、P0~P3、disposition 优先级、双层 SHA-256、formal/synthetic 隔离、敏感材料不回显、严格数据树、深复制冻结、结果防伪和源码零副作用审计。

运行：

```powershell
node --test tools/mvp-increment-scope-cross-role-review-record-harness.test.mjs
```

## 固定零授权边界

结果固定 Git/文件/证件/签署工件读写、网络、Provider、消息和业务写入为 0；现实 reviewer assignment、identity/competence/independence/signature verification、review started/passed、Owner intake/选择、决定登记、范围冻结、G2、正式根工程、原生 iOS 与正式实现授权全部为 false。
