# OI-07 Provider target 本地校验合同

> 状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`
>
> 对应：OI-07、D-036、D-053、`D039-PX5-B05`（均不因本合同获得授权或通过）
>
> 输入模板：[OI-07 Provider 目标统一输入模板](oi07-provider-target-intake-template.md)
>
> 实现：[oi07-provider-target-intake-harness.mjs](../../../tools/oi07-provider-target-intake-harness.mjs)；测试：[oi07-provider-target-intake-harness.test.mjs](../../../tools/oi07-provider-target-intake-harness.test.mjs)

## 目的

D-036 与 D-053 已共用同一个 OI-07 Markdown 输入模板，但纯文本回填仍可能出现字段遗漏、额外字段、slot 重复、revision 形态漂移、带 userinfo/query/fragment 的 URL、无来源 `N/A` 或敏感材料混入。该类错误若到真实 Provider 执行或证据采集阶段才发现，会让两个协议消费不同 target，或者在构造凭证/载荷后才失败。

本合同把模板物化为严格、无网络的 `OI07_PROVIDER_TARGET_INTAKE_INPUT_V1`。它只判断结构、格式和显式 `UNKNOWN` 状态，不查询 URL、不验证 Provider 真相、不验证填写者现实身份，也不保存 Owner 输入。

## 固定输入

顶层只允许：

```text
schemaVersion = OI07_PROVIDER_TARGET_INTAKE_INPUT_V1
oi07Revision = OI07-RNNN | UNKNOWN
providedBy = OWNER | AUTHORIZED_CONTACT | UNKNOWN
providedAt = RFC3339 | UNKNOWN
ownerAuthorizationRef = non-secret reference | UNKNOWN
targets = [P1, P2, P3]
```

每个 target 必须精确包含模板的 29 个字段；不允许遗漏、额外字段、重复/重排 slot 或第四个 target。字段覆盖固定为 `12 shared + 8 D-036-only + 9 D-053-only = 29`，再加唯一 `oi07Revision` 共 30 个联合输入字段。

值规则保持模板边界：

- `UNKNOWN` 可被接收，但阻断相应消费者；共享字段未知同时阻断 D-036 与 D-053。
- `N/A(reason, https://public-source)` 只有理由与无认证公开 HTTPS 来源同时存在时才算结构完整；法律实体、产品、revision、账户/用户地区、origin、model family、账户控制、观察时间和 credential owner 等具体 target 身份不得写 `N/A`。
- `baseUrl` 必须是无 userinfo、path、query、fragment 的 HTTPS origin；endpoint path 单独记录且不得含 query/fragment。
- 官方来源 URL 必须是无认证、无 query/fragment 的稳定 HTTPS URL；合同不访问这些地址。
- 日期必须是实际存在的 ISO 日期，观察时间必须是带时区 RFC 3339；query 使用 `TRUE/FALSE/UNKNOWN`，费用使用 `ZERO/UNKNOWN`、有来源 `N/A` 或 `CCC 0.00` 形式。

## 失败关闭与脱敏

输入先经过普通 JSON 树、深度、节点、数组、字符串长度、cycle、prototype、accessor、symbol 和非枚举属性检查，再做精确字段校验。明显的 key/token/Authorization/cookie/password、Bearer、常见 key 前缀或邮箱形态会触发 `UNSAFE_OI07_PROVIDER_TARGET_INTAKE`；错误不回显原值。

结果只包含 revision、固定 slot、计数、blocker、输入/结果 SHA-256 和边界，不回显 Provider 名称、产品、URL、model、备注或 `N/A` 原文。该扫描只是防误提交保护线，不能证明任意自由文本绝不含用户数据或秘密；现实接收者仍须按模板执行安全检查。

## 结果语义

结果只有两类：

- `STRUCTURALLY_COMPLETE_INTAKE_ONLY`：审计元数据与 D-036/D-053 所需字段没有 `UNKNOWN`，格式完整；只允许进入后续人工核验和准备。
- `PARTIAL_UNKNOWN_BLOCKED`：任一审计、共享或协议独有字段仍是 `UNKNOWN`；分别报告 D-036/D-053 intake completeness，不把一个协议的完整度扩张到另一个。

两类结果都固定保留：

```text
INPUT_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED
PROVIDER_FACTS_NOT_VERIFIED
D036_EXECUTION_NOT_AUTHORIZED
D053_EVIDENCE_COLLECTION_NOT_AUTHORIZED
D053_NOT_AUTHORIZED
```

`OI07_PROVIDER_TARGET_INTAKE_BOUNDARY_V1` 同时固定：不读取/存储凭证、不授权费用、不创建 transport、不联网、不采集 Provider 证据、不改 Owner intake、不关闭 B05、不授权 Owner 评审、发送或正式实现。

## 自动化证据

11 项顶层测试覆盖：

- 30 字段联合合同与完整输入仍不授权；
- D-036/D-053 对独有 `UNKNOWN` 的独立阻断和共享字段联动阻断；
- 有来源 `N/A` 与具体 target 身份禁止 `N/A`；
- 字段、slot、target 数量、revision、授权元数据、日期、时间、query 和费用格式；
- HTTPS origin、来源 URL、endpoint path；
- secret/邮箱 canary 不回显；
- special object、accessor、symbol、cycle、深度和资源上限；
- 不可变规范化、完整结果重建、伪造授权/指纹拒绝和零副作用源码审计。

运行：

```powershell
node --test tools/oi07-provider-target-intake-harness.test.mjs
```

本地测试 fixture 使用 `.example.test` 合成值，不是 Provider 选择、官方来源、OI-07 Owner 输入或准入证据。真实输入到达后仍须核验输入权威、保存安全引用并按 D-036/D-053 分别执行后续协议。
