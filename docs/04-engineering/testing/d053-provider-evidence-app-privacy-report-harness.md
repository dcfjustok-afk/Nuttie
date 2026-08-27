# D-053 Provider 证据与 App Privacy 报告本地校验合同

> 对应：D-053、OI-07、`D039-PX5-B05`（均不因本合同获得授权、接受或通过）

> 输入合同：[D-053 Provider 证据与 App Privacy 报告机器合同](d053-provider-evidence-app-privacy-report-contract.md)

> 实现：[d053-provider-evidence-app-privacy-report-harness.mjs](../../../tools/d053-provider-evidence-app-privacy-report-harness.mjs)；测试：[d053-provider-evidence-app-privacy-report-harness.test.mjs](../../../tools/d053-provider-evidence-app-privacy-report-harness.test.mjs)

## 目的

D-053 协议已经规定 OI-07、三家 Provider、五类 payload、十维证据、App Privacy/隐私政策映射、失效和签署流程，但纯文档无法阻止报告漏掉一个 Provider/payload、合并维度、跨 Provider 复用证据、把 URL 或用户同意当成相容事实、把过期快照继续用于 A/B candidate，或把调用方填写的签名引用冒充现实签署。

本地校验器只接收调用方传入的普通 JSON 数据树，在内存中验证结构、顺序、交叉绑定、派生 disposition 与多层摘要。它不扫描目录，不读取 OI-07、Provider 页面、离线快照、受控合同、隐私政策、App Store Connect、签名或复核回执，不访问网络、凭据、用户数据或原生工具，也不创建报告或准入记录。

## 固定覆盖

正式报告精确固定：

```text
3 Provider targets
× 5 payload classes
= 15 admission profiles

15 profiles
× 10 evidence dimensions
= 150 dimension assessments

15 profiles
× A / B / C
= 45 policy-package comparisons
```

Provider target 必须与既有 OI-07 输入和结果的双 fingerprint、revision 及 D-053 字段逐项一致。正式矩阵必须按 P1/P2/P3、五类 payload、十维协议顺序排列；删除、重复、重排或跨 target 引用均失败关闭。

缩小的 `SYNTHETIC_CONTRACT_FIXTURE` 必须使用正式集合的真子集，来源只能是 `SYNTHETIC_CONTRACT_SOURCE`。它固定 `INCONCLUSIVE / SYNTHETIC_CONTRACT_FIXTURE_ONLY`，不能登记为 Provider 证据、App Privacy 映射或 D-053 报告。

## 来源、冲突与十维结论

每份来源绑定 Provider target、产品套餐、地区、公开 URL 或安全引用、观察/生效/失效时间、规范快照 SHA-256、claim、supersede、重放状态和自身 fingerprint。校验器只核对调用方声明，不读取摘要对应字节，因此正式来源始终保留 `SOURCE_SNAPSHOTS_CALLER_ASSERTED_NOT_VERIFIED`。

冲突记录至少引用两份同 target 证据。开放冲突不能被静默覆盖，引用它的维度必须是 `UNKNOWN`；已解决冲突必须有 resolver 引用、处置时间和摘要，但现实身份与处置真值仍未核验。

每个 profile 的十个评估逐项固定：

- `SUPPORTED_COMPATIBLE`
- `SUPPORTED_INCOMPATIBLE`
- `UNKNOWN`
- `EXPIRED`

相容、不相容和过期结论必须引用同 target 来源。只有不相容结论可以标记 `NON_WAIVABLE` 或 `BOUNDED_RESIDUAL`；其他状态必须为 `NONE`。每项理由、来源/冲突、时间及完整 assessment fingerprint 都参与重算。

## App Privacy、签署和 A/B/C

每个 profile 至少绑定一行 App Privacy 映射。collection、linked、tracking 独立判断并分别引用来源；final Apple data types、purpose、第三方 target、隐私政策条款、choices/deletion、D-033 字段和保留/删除摘要不能由一个总开关替代。隐私政策与 D-033 映射每个 profile 各一项，并与 App Privacy 行交叉绑定。

具名角色固定为 `PRODUCT / PRIVACY_SECURITY / RELEASE`。校验器只验证稳定 signature ref、角色、工件摘要、签署方法、时间和 fingerprint，不读取签名或验证现实身份；所有结果始终保留 `SIGNATURES_CALLER_ASSERTED_NOT_VERIFIED`。

A/B/C 对每个 profile 分别重算：

- A 要求十维全相容、无开放冲突、映射一致且三角色签署；否则按事实派生拒绝、未知或过期；
- B 不能覆盖 `NON_WAIVABLE`；每个 `BOUNDED_RESIDUAL` 必须由具备责任人、期限和非阻断理由的 P3 finding 覆盖；
- C 固定 `C_NOT_OWNER_READY`，不能变成 A/B candidate 或发送许可。

profile disposition 必须与其候选政策包的比较结果一致。即使 15 个 profile 全部成为 A candidate，本地结果仍固定 `d053PassCandidate=false / providerAdmissionGranted=false`。

## 失效、finding 与总体优先级

A profile 最长 90 天，B 最长 30 天；C 只能保持 `NOT_ASSESSED`。十二类协议 change trigger 必须完整保留，且 `failBeforeCredentialRead=true / gracePeriodAllowed=false`。到报告生成时已过期的 A/B profile 不能继续保持 candidate。

开放 P0/P1/P2 finding 使总体为 `FAIL`。开放 P3 只有在责任人、期限和非阻断理由完整时才可保留。没有 FAIL 时，OI-07、来源可重放、维度、冲突、五类 payload 映射、签署或监控任一不完整都为 `INCONCLUSIVE`；全部结构完整只到 `EVIDENCE_REVIEW_REQUIRED`，不是 D-053 PASS。

## 安全与不可变边界

校验器先拒绝 accessor、symbol、特殊对象、cycle、超深/超大数据，再执行精确字段、枚举、唯一性、顺序、引用和摘要验证。明显的 key/token、Bearer、Authorization/password/secret/cookie、个人邮箱、敏感 query、合同账号、用户或 Provider 正文触发 `UNSAFE_D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT`；错误只返回字段路径和稳定 code，不回显 canary。

规范化复制并深冻结输入。结果只返回计数、disposition、blocker、指纹和关闭边界，不回显 Provider 名称、URL、claim、签名人或 finding 摘要。

`D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_BOUNDARY_V1` 固定全部来源/快照/签名/Apple/Provider/网络/凭据/业务读写与外部消息为 0；现实 OI-07、Provider 事实、证据采集、映射签署、独立复核、Owner、D-053 接受、准入、B05、真实网络和实现均为 false。

## 当前测试

19 项本地测试覆盖：

- 常量、15/150/45 矩阵和零授权边界；
- 缩小 synthetic 隔离与完整正式结构重算；
- OI-07 双 fingerprint、target revision/fingerprint；
- 缺失笛卡尔行与跨 Provider 来源/冲突/评估/映射复用；
- 来源要求、开放冲突、A/B/C 派生与 B 残余风险覆盖；
- App Privacy 决定、映射覆盖、签名缺失/错角色；
- A/B 失效窗口、生成时过期、C 未评估；
- P0~P3 优先级、所有工件 fingerprint、结果 fingerprint；
- 敏感材料、特殊对象、资源边界、深冻结与零副作用源码约束。

执行：

```bash
node --test tools/d053-provider-evidence-app-privacy-report-harness.test.mjs
```

真实 OI-07、来源采集、快照、映射、签署和复核到达后，仍须由获授权人员在受控环境执行并另行登记权威事件；本地 validator 不替代这些步骤。
