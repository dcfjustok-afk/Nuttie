# Backup Reconcile Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/backup-reconcile-harness.mjs` 与 `tools/backup-reconcile-harness.test.mjs`

## 目的

这个 harness 将 [手动加密备份与恢复](../data/encrypted-backup-and-restore.md) 中可以脱离平台实现验证的 crash-consistency 合同转成纯状态模型。模型只包含 `activeRef`、`previousRef`、`restore intent` 和 generation 的 `complete/hashMatched` 标志；它不读取文件、不打开 SQLite、不触碰 Keychain，也不生成或解析备份明文。

覆盖：

- final rename 后但 intent 前的孤儿 generation；
- intent 持久化后 pointer 尚未切换；
- pointer 指向完整且哈希匹配的新 generation；
- pointer 指向不完整、缺失或 hash 不匹配的新 generation；
- old/new 都不可用和未知组合的 fail-closed；
- 任意恢复模式、KDF、AEAD、header/AAD 和明文导出策略保持 opaque pending。

## 明确不授权

`PENDING_D-027_D-030_D-035` 只是一串待决 profile 标记。该 harness 不选择 D-027 密码学、D-030 replace/merge/recovery mode 或 D-035 明文导出，也不构成 SQLCipher、Keychain、文件系统、kill/restart 或真机证据。

## 验证

```powershell
node --test tools/backup-reconcile-harness.test.mjs
```

所有状态变换返回克隆状态；失败或未知组合保持 `writesOpen=false`，不会猜测最新目录或创建空库。
