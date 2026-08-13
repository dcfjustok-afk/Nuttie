# F01/F02 不可信 AI 响应合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/ai-response-contract-harness.mjs` 与 `tools/ai-response-contract-harness.test.mjs`

该合同位于真实 Provider transport 之后、候选编辑流程之前，把所有响应正文视为 `UNTRUSTED_PROVIDER_OUTPUT`。它只证明本地纯解析边界，不证明响应来自目标 Provider，也不证明内容正确、营养有效或适合直接保存。

## 已锁定边界

- 先按 16 KiB 字节、JSON 深度、累计 object key、array item 和字符串字节预算扫描，再调用 JSON 解析；解码后重复 key、尾随数据、非有限数值和资源超限全部失败关闭。
- 顶层只接受 `schemaVersion=1` 与非空 `candidates`；candidate 只接受 `label`、`nutrients` 和可选 `confidence`，营养字段只允许 D-013 七项。
- 标签必须非空、无首尾空白、已为 NFC，且不含控制字符、零宽字符或双向覆盖/隔离控制符；营养值和置信度拒绝负数、负零、非有限数和技术范围外数值。
- 缺失营养项规范化为 `null`，不制造零或估算值。解析结果深度冻结，并以规范化语义生成 `responseFingerprint`，因此 JSON 空白和 key 插入顺序不改变指纹。
- `validateResponseCandidate` 只复制严格被动 JSON 状态；拒绝 accessor、symbol、特殊原型、稀疏数组、循环与超预算状态。失败结果只返回稳定错误码，不回显 Provider 正文。
- 空候选直接 `BLOCKED`，不会进入一个表面可编辑、实际无法选择的候选状态。成功结果仍只是 `UNCONFIRMED_EDITABLE_REFERENCE_ONLY`，持久化固定为未授权。

## 没有授权的事项

- schema 只是 `TEST_CONTRACT_NOT_FORMAL_PROVIDER_API`，不冻结正式 Provider API、模型、字段映射或营养真实性规则；
- 不读取 Keychain，不组装 Authorization 或敏感请求体，不联网，不写文件或业务数据；
- 不绕过 D-033/D-034/D-036/D-053，不自动确认候选，不自动修改日记、目标或 F16 参考草稿；
- 不构成 React Native、原生、正式工程、真机或 Release 证据。

验证：

```powershell
node --test tools/ai-response-contract-harness.test.mjs tools/ai-candidate-confirmation-harness.test.mjs
```
