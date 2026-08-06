# Import Safety Contract Harness

状态：`SPIKE / LOCAL_ONLY / NON_PRODUCTION`

路径：`tools/import-safety-harness.mjs` 与 `tools/import-safety-harness.test.mjs`

## 目的

这个 harness 把数据包/备份导入的通用恶意输入边界转成 Windows 可执行的纯本地测试。它不实现签名、解密、SQLite、文件系统 staging 或 activation，只验证认证前拒绝和失败保持旧状态。

覆盖范围：

- 相对 POSIX 路径、路径穿越、绝对路径、反斜杠、控制字符。
- 重复规范化路径、symlink/special entry、单项/总大小和数量上限。
- 未知关键 manifest 字段拒绝。
- 签名与完整性是显式门禁；缺少任一证据不进入 activation。
- 即使检查结果完整，activation 策略仍保持 `PENDING`，不会覆盖当前状态。

## 明确不授权

本工件不冻结 D-026 的签名算法、trust root、撤销/回滚窗口，也不冻结 D-027 的 KDF/AEAD、header 编码、两遍解密或恢复替换/合并策略。它不创建正式 App 工程、数据库或数据包，也不改变 D-002/D-006/D-012、Owner intake 或任何门禁状态。

## 验证

```powershell
node --test tools/import-safety-harness.test.mjs
```
