# Restore Reconcile Observation Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/backup-reconcile-harness.mjs` 与 `tools/backup-reconcile-harness.test.mjs`

## 目的

这个 harness 将 [手动加密备份与恢复](../data/encrypted-backup-and-restore.md) 的启动 crash-reconcile 语义转换为纯只读观察模型。它不再接受 `complete/hashMatched` 裸布尔值，也不把“计划回写 pointer/清除 intent”冒充已经执行；调用方必须提供结构化 generation 观察，harness 只返回绑定当前观察快照的未提交行动计划。

## 合同边界

- 每个 generation 观察包含显式状态、artifact fingerprint、evidence/verifier/profile ID 和 `CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS` 边界，并形成 observation fingerprint；
- generation 状态只允许 `COMPLETE_OPENABLE`、`INCOMPLETE`、`HASH_MISMATCH`、`KEY_UNAVAILABLE`、`UNKNOWN`；只有调用方声明为完整且可打开的 active generation 才可能开放写入；
- restore observation 使用严格 plain record、dense array、唯一 generation ID 和固定 64 项预算，并把 active/previous ref、intent 与全部 generation 观察共同绑定到快照指纹；
- 测试 intent 必须保留 `PENDING_D-027_D-030_D-035`、`selectedModeId=null` 和未授权 mode 标记，并绑定确切 new generation observation fingerprint；它只是 hypothetical fixture，不是持久化授权；
- 没有 intent 且 active/previous 引用均安全时返回 `STABLE`；未引用 generation 只作为观察结果列出，`cleanupAuthorized=false`；
- 只要 intent 存在，`writesOpen=false`。状态机只能输出 `FINALIZE_NEW`、`ROLLBACK_TO_OLD` 或 `ABORT_NEW_KEEP_OLD` 行动计划，计划绑定 observation/intent 指纹且 `effectsCommitted=false`；
- 外部 adapter 执行计划后必须重新观察。只有新观察已经没有 intent、active/previous 引用均完整可打开时，下一次对账才返回 `STABLE / writesOpen=true`；
- 缺失、损坏、hash 不匹配、Keychain key 不可用、previous 冲突、未知 pointer/intent 组合和任何指纹篡改均失败关闭。

## 明确不授权

`cryptoProfile=PENDING_D027`、`restoreMode=PENDING_D030`、`plaintextExport=PENDING_D035`。结构化观察是调用方声明，不是本 harness 的密码学、文件、SQLite 或 Keychain 验证。

本合同不选择 KDF/AEAD/流式认证方案，不批准替换/合并或恢复点策略，不批准明文导出，不读取/写入文件，不读写 Keychain，不执行 pointer/intent mutation，不删除 generation，不调用原生 API，也不构成 kill/restart 或真机证据。

## 验收标准

当前 21 条顶层测试必须全部通过，覆盖稳定状态、全部失败状态、previous 引用、结构化观察、严格 shape/预算、pending intent、orphan 只读发现、三类行动计划、不可用 old 不进入 previous、new observation 替换、old/new 双失败、未知组合、计划指纹、执行后重新观察和零副作用源码审计。

```powershell
node --test tools/backup-reconcile-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
```

所有结果都是框架无关的决策合同，不能升级 G4 或替代 D-027/D-030/D-035、SQLCipher/Keychain/Files adapter、持久化 kill-point 和真机测试。
