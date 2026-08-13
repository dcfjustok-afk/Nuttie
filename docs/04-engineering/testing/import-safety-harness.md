# F19 导入预检合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/import-safety-harness.mjs` 与 `tools/import-safety-harness.test.mjs`

## 目的

本合同把数据包或备份在真正验签、解密、暂存和激活之前必须满足的通用安全边界变成可执行测试。它只生成不可变的导入对象、调用方验证声明和激活前准备证据，不读取归档、不验证密码学真实性，也不改变当前活动数据。

## 已覆盖边界

- 默认限制覆盖条目数量、单项/总字节、manifest、路径、字符串、嵌套深度、JSON 节点和对象键数量；调用方只能收紧，不能放宽。
- 外部结构必须是无 accessor、symbol、非枚举字段、稀疏项、额外字段或循环引用的普通 JSON；非有限数字和超预算元数据失败关闭。
- 路径统一到 NFC 相对 POSIX 形式，拒绝绝对路径、穿越、反斜杠、控制字符、空段、特殊条目、重复路径和大小写不敏感冲突。
- manifest 文件集合必须与实际条目精确相等；未知 `!` 关键字段拒绝，普通扩展字段仍保留，因此本合同没有擅自冻结 D-026 正式 manifest schema。
- 规范化 manifest、条目及限制形成 `IMPORT_SUBJECT_V1`，并由确定性 SHA-256 指纹绑定；任何内容或派生证据篡改都会拒绝。
- 签名与完整性使用结构化、与目标 subject 精确绑定的调用方声明，替代可伪造语义过强的裸布尔值。其真实性边界固定为 `CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS`，不冒充真实验签。
- 准备结果绑定当前活动条目指纹；准备后活动状态发生变化时拒绝继续。无论输入是否完整，激活都固定返回 `PENDING_D026_D027_D030`，旧状态保持不变。

## 明确不授权

本工件不选择或实现 D-026 的签名算法、trust root、撤销/回滚窗口和正式 manifest；不选择或实现 D-027 的 KDF/AEAD、header、流式/两遍认证解密；不选择 D-030 的替换/合并、恢复点和回滚策略。它不读取或写入文件系统，不联网，不调用 SQLite、SQLCipher、Keychain、Files 或任何原生 API，也不创建正式 App 工程或改变 Gate/Owner intake。

`READY_FOR_ACTIVATION` 只表示“预检材料结构完整并已绑定”，不是“密码学已被本 harness 验真”，更不是“允许激活”。

## 验证

```powershell
node --test tools/import-safety-harness.test.mjs
```

当前共有 19 条顶层测试，覆盖正常路径、结构攻击、资源耗尽、路径碰撞、证据重放/篡改、活动状态漂移、伪造准备结果以及零 I/O/网络/原生/激活副作用。
