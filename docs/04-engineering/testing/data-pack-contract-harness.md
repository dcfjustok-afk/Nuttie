# Data Pack Pre-Auth Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/data-pack-contract-harness.mjs`、`tools/data-pack-contract-harness.test.mjs` 与 `tools/fixtures/data-pack-contract-v1/`

## 目的

这个 harness 把 D-002、D-012、D-013 中可以在真实归档、验签和激活之前独立验证的食品数据包不变量变成 fail-closed 合同。它生成不可变的 pack subject，并要求调用方验证声明绑定该 subject 的精确指纹；它不读取或解压文件、不验证密码学真实性、不访问网络，也不实现 SQLite/ORM 或激活事务。

覆盖范围：

- 预授权 JSON 解析按 UTF-8 字节、真实 object key 数、array item 数、单字符串大小和深度限制输入；拒绝重复 key、尾随内容、非有限数和非对象根；
- 批准的 manifest/entry/NOTICE/provenance/transform 预算只能收紧，不能由调用方放宽；
- manifest 必填来源、版本、兼容范围、七项营养字段、许可证、NOTICE 和 `pending-D-026` 符号签名位；
- 路径按 NFC 规范化，并拒绝绝对路径、遍历、反斜杠、控制字符、超长路径以及大小写/NFC 碰撞；
- manifest 与实际普通文件的 `path`、`size`、SHA-256 和完整集合严格一致；总大小与规范化 manifest 大小受限；
- provenance 的来源/version/license 必须与 manifest 一致，source/catalog record ID 唯一，缺失语义和原始值/单位受严格 shape 约束；
- transform 的 pack version 必须与 manifest 一致，step ID 唯一且数量有界；NOTICE 是 subject 的组成部分；
- manifest、entries、provenance、transforms、NOTICE 与收紧后的 limits 共同形成不可变 subject fingerprint；
- 只接受结构化的调用方 `VERIFIED` 声明，声明同时绑定 subject fingerprint、verifier ID 和 profile ID；裸 `signatureVerified`/`integrityVerified` 布尔值、伪造声明与跨 subject 重放均失败关闭；
- GTIN 只作为保留前导零的 8/12/13/14 位字符串映射，不推断国家、品牌或营养值。

## 明确不授权

`signature.algorithm=pending-D-026`、`signatureProfile=PENDING_D026` 和 `verificationTruth=CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS` 都是显式未决边界。`READY_FOR_ACTIVATION` 只表示调用方对同一 subject 同时提供了结构完整、指纹匹配的签名与完整性声明，不表示 harness 做过 JCS、真实验签、哈希读盘、trust root、撤销或密钥轮换。`activationStrategy` 仍为 `PENDING_APPROVED_STRATEGY`，`committed=false`。

D-026 签名算法与 key lifecycle、D-052 USDA 境外许可/再分发、真实归档格式、解压实现、SQLite staging、durable intent/ref、crash recovery、空间检查、激活/回滚和正式错误映射仍是后续门禁。本合同也不把测试 fixture 当作可分发食品数据。

## 验收标准

当前 20 条顶层测试必须全部通过，并覆盖成功 subject、只收紧预算、解析预算、严格被动 JSON、路径、manifest/entry 集合、总大小、provenance/transform 一致性与唯一性、NOTICE、指纹、结构化验证声明、伪造/重放/篡改拒绝、GTIN 和零副作用。源码审计同时锁定：文件系统读写、网络、原生调用、系统时钟读取、真实密码学验证和激活写入均为零。

```powershell
node --test tools/data-pack-contract-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
```

这些测试是本地框架无关证据，不能升级 G4、替代 Owner/数据许可选择或授权正式 React Native 工程。
