# ADR-0004：SQLCipher 与 Keychain 数据库密钥

- 状态：accepted
- 日期：2026-07-31
- 关联决策：D-006、D-015
- 决策者：Owner

## 上下文

饮食、体重、目标、备注和图片属于敏感个人数据。普通 SQLite 依赖 App sandbox 和系统文件保护，但设备备份、文件提取或错误配置仍可能暴露内容。数据库加密密钥若与数据库一起保存，则加密没有独立保护价值。

## 决策

1. 主业务数据库使用 SQLCipher。
2. 首次启动使用安全随机数生成独立数据库密钥。
3. 数据库密钥存入 iOS Keychain，使用 ThisDeviceOnly 访问级别，不写入 SQLite、App Group、日志或备份。
4. 数据库文件同时使用 iOS Data Protection。
5. 启动时存在 DB 但 Keychain key 缺失/失效，进入明确恢复态，不创建空库覆盖。
6. 手动加密备份保存逻辑业务数据，恢复时复用目标设备既有 SQLCipher 密钥；只有全新安装且没有本地 DB 时才创建一次目标 key，再用它构建恢复 generation。恢复不替换 Keychain 条目，也不尝试跨 Keychain/文件做全局事务。
7. 删除全部数据必须先持久化 wipe intent，移除 pending/delivered 本地通知，阻断新写入并等待全部已登记 writer/task acknowledgement，再关闭所有 SQLCipher、文件、媒体和 App Group 写连接；只有确认连接关闭后，才能幂等删除数据库/AI Keychain 条目和全部 generation 中的 DB/WAL/SHM、媒体、缩略图/AI 输入普通缓存、URL cache/cookie、明文 staging、App Group 与日志。启动时在初始化 SecretVault 或打开数据库前继续未完成 wipe。
8. 启动必须同时核对业务 generation、安装代标记、wipe/restore intent 与 Keychain 条目：存在任一 generation 而 key 缺失、失效或安装代不匹配时进入恢复态；不存在任何 generation、intent 和 key 时才按新安装生成 key；不存在 generation 但存在无法归属于当前安装代的 key 时，将其视为卸载重装或首次建库中断留下的孤立条目，幂等删除旧 DB key 及同一旧安装代的 AI key 后再生成新 key；存在任何未知 intent/状态组合时保持写入关闭，不删除、不轮换、不猜测。

## 后果

- 数据离开设备容器后仍有静态加密保护。
- 数据库密钥不可迁移；设备丢失或 Keychain 永久失效时，只能依靠用户持有的加密备份恢复。
- Widget/Live Activity 不直接打开主数据库；使用不含密钥的最小 App Group 快照。
- SQLCipher 增加二进制、迁移、rekey、故障恢复和真机测试成本。

## 验证

- 正确 key 可重启打开；错误/空 key 不能读取且不覆盖原库。
- 旧 schema 的 SQLCipher 数据库可逐版本迁移。
- 锁屏、重启、卸载重装、生物识别变化和显式删除在真机测试；覆盖 DB/generation、安装代、wipe/restore intent、DB key 与 AI key 的完整真值表。
- 产物、日志、备份、App Group 和崩溃诊断均不存在数据库密钥。
- 删除状态机每一步强制 kill/restart；包含 gate 后并发写、writer acknowledgement、连接关闭前后、关连接后/删 key 前和删 key 后。完成后 pending/delivered 通知为空、连接关闭，并递归验证所有受控容器只剩安全 allowlist，DB/WAL/SHM、媒体、普通缓存、暂存、App Group、日志和 Keychain 条目不存在。
- 首次建库每个持久化点强制 kill/restart；卸载重装、旧 Keychain service/account 残留、孤立 DB key、孤立 AI key 和安装代不匹配均得到确定性结果，且任何已有 generation 都不会被空库覆盖。

## 复审条件

如果 SQLCipher 与所选 Expo/RN 版本无法稳定归档或迁移，不能直接降级到明文 SQLite；必须向 Owner 提交替代加密方案、风险和迁移证明。
