# ADR-0007: 跨端客户端存储边界

- 状态：accepted
- 日期：2026-08-31
- 关联决策：D-006、D-015、ADR-0004、ADR-0006

## 背景

Nuttie 同时运行在 Android、iOS、React Native Web 和移动 H5。客户端必须支持离线记录，但不能因为多个账号共用一个设备而泄露记录，也不能把 access token 写入普通应用存储。

## 决策

1. refresh token 只保存在原生 `expo-secure-store`，使用 `WHEN_UNLOCKED_THIS_DEVICE_ONLY`；Web 只使用 API 管理的 HttpOnly refresh cookie。
2. access token 只存在 Zustand 内存状态，禁止写入 AsyncStorage、文件、导出内容或同步 payload。
3. 业务缓存使用 AsyncStorage 的分区 key：匿名数据使用 `nuttie.cache.v1.anonymous`，登录数据使用 `nuttie.cache.v1.account.<encoded-user-id>`。
4. 启动时必须先恢复会话，再读取对应分区；退出账号只重置内存视图，不把账号缓存加载为匿名数据；删除账号必须清理对应账号分区。
5. 升级前的未分区 `nuttie.cache.v1` 无法证明归属，启动时直接丢弃，不自动归属到当前账号。
6. 记录和离线队列当前仍是 AsyncStorage 的过渡实现。SQLCipher 和独立数据库密钥仍按 ADR-0004 作为原生发布前置条件，不能把本过渡实现描述为已完成的静态加密。

## 结果

- 同一设备上的账号不会共享业务缓存。
- Web 不需要在客户端保存 refresh token；原生端不会把 access token 落盘。
- 旧版本未分区缓存会被清除，换取明确的账号隔离边界；云端数据可通过同步恢复。
- 真正的原生发布仍需在 Android/iOS 真机验证 SecureStore、SQLCipher 和删除后的文件清理。

## 验证要求

- 单元或集成测试覆盖匿名、账号 A、账号 B 三个分区的读写隔离。
- 测试退出后切换账号不会显示上一账号记录，删除后账号分区不存在。
- 静态门禁检查 `PersistedSession` 不包含 access token，且业务缓存 key 不再使用未分区名称。
