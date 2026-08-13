# F16 AI 参考草稿合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应：F16、REQ-F16、AT-F16
>
> 实现：[ai-guidance-reference-harness.mjs](../../../tools/ai-guidance-reference-harness.mjs)；测试：[ai-guidance-reference-harness.test.mjs](../../../tools/ai-guidance-reference-harness.test.mjs)

## 目的

F01/F02 的 `ai-candidate-confirmation` 处理“AI 候选经用户确认后生成业务值”的事务边界。F16 的权威要求不同：健康分析、食谱和饮食方案首先是可编辑、可放弃的参考草稿，不能自动修改目标、创建日记或覆盖本地趋势。

本合同补上 F16 的框架无关终态边界，但不实现 AITransport、Provider adapter、UI、正式字段、医疗/高风险规则、保存历史或 Repository。

## 固定边界

每个状态都包含不可变 `AI_GUIDANCE_REFERENCE_BOUNDARY_V1`：

- `contentUse = REFERENCE_ONLY`；
- `medicalStatus = NOT_MEDICAL_ADVICE`；
- `medicalSafetyEvaluation = NOT_PERFORMED`；
- `highRiskUse = NOT_AUTHORIZED`；
- `businessMutation = NOT_AUTHORIZED`；
- `persistence = UXD_11_NOT_DECIDED`。

这里的“非医疗”只限制用途，不代表合同会识别医疗内容、证明建议安全或批准特殊人群使用。高风险规则和正式免责声明仍须领域评审与 Owner 决定。

## 数据与状态

调用方必须提供两个版本化、带指纹且非空的 opaque 定义：

1. `AI_GUIDANCE_CONTENT_DEFINITION_V1` 描述调用方理解的草稿内容；
2. `AI_GUIDANCE_DISCLAIMER_DEFINITION_V1` 描述调用方选择的免责声明内容或引用。

合同不解释两者的字段，也不内建分析、食谱、方案、疾病、过敏、孕产、儿童或目标语义。AI response 顶层只允许 `schemaVersion` 和 `content`，拒绝重复 JSON key、未知字段、秘密字段、特殊对象、访问器、循环和超预算内容。原始响应文本不进入状态；只保留规范化原始内容和指纹。

```text
REVIEWING
  -> EDITING
  -> DISCARDED
```

- `REVIEWING` 保留规范化 AI 原始内容、生成时间、HTTPS origin、model、request/policy 证据和调用方定义。
- `EDITING` 通过 revision CAS 接受本地修改，继续保留 AI 原始内容与来源，但将当前内容指纹与原始内容指纹分离。
- `DISCARDED` 是幂等终态，清除原始内容和当前内容，只保留绑定来源、定义、最终 revision 和内容指纹的清除证据。

活跃状态可用保留的规范化 AI 原始内容独立重建并核对 source evidence。放弃后内容已经清除，只能核对清除证据内部的指纹绑定；普通 SHA-256 不含秘密，不能证明 Provider、网络响应或外部来源的真实性。

所有状态的 `effect` 恒为 `null`。模块不导出保存、Repository、日记、目标、transport 或自动修改 API。

## 当前自动化证据

12 项 Node 测试覆盖：

- 参考用途、非医疗、高风险未授权、业务零修改和 UXD-11 未决边界；
- 调用方定义的非空、指纹、复制与冻结；
- 严格 response 顶层、重复 key、资源预算和秘密/特殊值拒绝；
- 显式 HTTPS request context、policy evidence 和调用方生成时间；
- AI 原始内容、当前编辑内容、来源、model、定义与 revision 指纹绑定；
- stale edit、伪造状态、伪造来源和伪造清除证据拒绝；
- 放弃后易失内容清除与幂等终态；
- 无网络、文件、系统时钟、原生、持久化、日记/目标写入或健康分类实现。

运行：

```powershell
node --test tools/ai-guidance-reference-harness.test.mjs
```

## 未授权与后续门禁

本合同没有授权或证明：

- UXD-04 的 IA 位置、UXD-11 的默认/可选/禁止保存策略；
- D-033 非标签载荷确认频率、D-053 Provider 数据用途准入；
- 分析/食谱/方案的正式 payload、数据范围、字段、排序、编辑或转日记映射；
- 医疗安全分类、特殊人群停止规则、诊断/治疗建议或正式免责声明文案；
- 真实 AI 请求、Keychain、Authorization/body、正式 Repository、SQLite/SQLCipher、组件/E2E、原生或 Release。

后续只有在 Owner 与领域门禁关闭后，才能为批准的内容定义和保存策略增加新版本、正式端口与 UI。任何转入日记或目标的动作仍必须进入独立的用户确认事务，不能由本草稿合同自动产生。
