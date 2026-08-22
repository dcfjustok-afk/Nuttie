# D-040 中国健康评审回执本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：D-040 `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`
>
> 输入合同：[D-040 中国健康评审回执机器合同](d040-china-health-review-record-contract.md)
>
> 实现：[d040-china-health-review-record-harness.mjs](../../../tools/d040-china-health-review-record-harness.mjs)；测试：[d040-china-health-review-record-harness.test.mjs](../../../tools/d040-china-health-review-record-harness.test.mjs)

## 目的

健康评审交接包已经固定材料和检查项，但文字表格无法阻止回执漏掉资质核验、地域适配、逐项处置、利益冲突、签署或 90 天周期，也无法证明签署引用确实绑定同一内容。本校验器把未来回执的结构、冻结输入、逐项处置、finding 和摘要关系变成可执行失败关闭合同，同时保留现实身份、资质与签署核验的人工门禁。

它只处理调用方传入的普通 JSON 数据树，不读取 Git、当前文件、证件、执业注册或签署工件，不访问网络、Provider 或消息系统，也不判断医疗内容、不创建或保存正式回执。

## 不可变输入

`packetIdentity` 精确绑定：

- `D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001 / PACKET-001-R1`；
- packet 事件 `EVT-20260820-008`；
- 九份输入提交 `5c32cfb...`；
- 带冻结清单的 packet 提交 `0fd261e...`、blob `89f66cb...` 和 SHA-256 `7e48fa2...`；
- 九份受审工件的固定顺序、路径、Git blob OID 与 SHA-256。

validator 使用内置常量比较调用方 bundle；工作区文件后来发生变化不会静默改变受审 revision，摘要匹配也不等于评审人实际阅读过文件。

## 评审人、资质与签署声明

attestation 绑定具名 reviewer、非敏感 reviewer/contact 引用、资质类型/机构/引用、调用方声明的具名非本人核验、1~8 个胜任范围、简中/中国大陆语境适配、起草参与、利益冲突、内容摘要和签署引用。

以下状态可以保留为部分回执，但不能形成 structurally complete candidate：

- 评审人参与过起草；
- 资质尚未核验，两个资质观察时间为 `null`；
- 地域适配为 `FAIL / NOT_VERIFIED`；
- 利益冲突未披露或未解决；
- `signatureMethod=NOT_SIGNED`。

正常逐项处置只能引用 reviewer 已声明的胜任范围；`OUT_OF_SCOPE` 反而必须至少列出一个 reviewer 未声明、需要另请人员的范围。PM、Owner、ProjectContentOwner、Codex、AI、Agent 或角色名不能充当具名健康评审人。名称、机构、资质、核验、地域、冲突和签署引用全部保持 `CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS`。

## 十三项、finding 与处置

逐项结果按六个 `COPY-D040-ND-*` 和七个 `BOUNDARY-D040-*` 固定顺序。每项必须有胜任范围与证据引用；非 `APPROVE` 必须引用 finding。change/reject 必须描述 required change，out-of-scope 的 item-level required change 保持 `null` 并由 finding 说明后续要求。

finding 使用 P0~P3，且与 item 引用精确双向一致：

- 开放 P0 → `REJECTED`；
- required-change 或开放 P1/P2 → `CHANGES_REQUIRED`；
- out-of-scope 或 attestation 缺口 → `INCOMPLETE`；
- 其余严格完整状态才可能是 `HEALTH_REVIEW_APPROVAL_CANDIDATE`。

开放 P3 只有同时存在责任人引用、晚于 reviewedAt 的期限和非阻断理由时才可保留。`reviewDueAt` 必须晚于 reviewedAt，绝对时间差不得超过 90×24 小时。

## 两层摘要与证据边界

`reviewContentSha256` 绑定 packet、九份输入、十三项、finding、disposition、reviewedAt/reviewDueAt 和禁止材料标志；attestation 引用该摘要。`bundleSha256` 再绑定完整 bundle 和 reviewer/资质/签署声明。提交值与重算值任一不一致即拒绝。

正式回执即使得到 candidate，结果也只返回：

```text
STRUCTURALLY_COMPLETE_HEALTH_REVIEW_ONLY
healthReviewApprovalCandidate = true
healthContentApproved = false
contentQaPassed = false
```

只有外部人工核验身份、资质、胜任范围、地域适配和签署工件后，才可能另行登记权威健康批准事件；Content QA 仍是独立门禁。

## 合成 fixture、脱敏与自动化证据

测试使用 `SYNTHETIC_CONTRACT_FIXTURE` 在内存中覆盖完整算法路径。其结果固定为 `SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY`；即使 `wouldBeHealthReviewApprovalCandidate=true`，`healthReviewApprovalCandidate` 仍为 false，不创建 reviewer、资质核验、正式回执或批准证据。

输入拒绝 key/token、Bearer、Authorization/password/secret、邮箱、电话、身份证号、PEM、签名图片/data URL 等敏感材料，错误只携带稳定字段路径，不回显原值。普通数据树还严格拒绝 cycle、accessor、symbol、特殊 prototype、稀疏数组、额外字段和资源超限。

20 项测试覆盖：

- V1 schema、packet、九份 frozen blob、十三项与四类 disposition；
- 合成 fixture 与正式 candidate 的证据隔离；
- 起草参与、资质核验时间、胜任范围、地域适配、冲突与签署；
- finding 双向引用、P0~P3、处置优先级和开放 P3；
- 90 天周期、实际日历日期、ID 与 supersession；
- review content/attestation/bundle 双层 SHA-256；
- 敏感材料不回显、严格数据树、不可变结果、结果防伪与源码零副作用审计。

运行：

```powershell
node --test tools/d040-china-health-review-record-harness.test.mjs
```

测试内的 Example reviewer、核验人、资质和 signature reference 全部是进程内合成合同 fixture，不得保存、外联或登记为现实健康评审证据。

## 固定零授权边界

结果固定 Git/文件/证件/执业注册/签署工件读写、网络、Provider、消息和业务写入为 0；现实 reviewer assignment/identity/qualification/competence/locale/signature verification、health review started/approved、Content QA、D-068/D-069/D-063 Owner-ready、Owner intake/选择、PX-1/PX-2、健康文案/公式/正式实现授权全部为 false。
