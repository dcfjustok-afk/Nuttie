# Data Pack Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/data-pack-contract-harness.mjs`、`tools/data-pack-contract-harness.test.mjs` 与 `tools/fixtures/data-pack-contract-v1/`

## 目的

这个 harness 把已接受的 D-002、D-012、D-013 中可以先独立验证的食品数据包不变量变成 synthetic corpus。它不创建真实食品数据库、不解压 ZIP、不验签、不访问网络，也不实现 SQLite/ORM。

覆盖范围：

- manifest 版本、必填来源和官方 HTTPS URL；
- 能量、蛋白质、碳水、脂肪、纤维、糖、钠七项字段白名单；
- `path`、`size`、SHA-256、NFC/大小写碰撞和 manifest/entry 完整集合；
- provenance 的 `sourceId`、`sourceVersion`、原始值/单位和 `missingFields`；
- transforms、NOTICE 和许可证显名边界；
- GTIN 只作为保留前导零的字符串映射，不推断国家、品牌或营养值；
- 重复 JSON key、未知 critical key、JSON 深度/大小预算和非有限数拒绝。

## 明确不授权

`signature.algorithm` 使用 `pending-D-026` 作为符号标记；JCS/签名字节、信任根、撤销、密钥轮换、D-026/D-052、激活策略和真实包发布仍未决。`validatePackContract` 只有在注入 `signatureVerified` 和 `integrityVerified` 后才返回 `READY_FOR_ACTIVATION`，且 `activation` 仍为 `PENDING_APPROVED_STRATEGY`。

## 验证

```powershell
node --test tools/data-pack-contract-harness.test.mjs
```

合并前还应运行现有 domain/import/AI/RN 预检套件与 `node project-ops/validate.mjs`、`node project-ops/reconcile.mjs`。这些测试是本地框架无关证据，不能升级 G4、替代 Owner 选择或授权正式 RN 工程。
