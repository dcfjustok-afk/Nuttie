# Local Wipe Coordinator Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/local-wipe-coordinator-harness.mjs` 与 `tools/local-wipe-coordinator-harness.test.mjs`

## 目的

这个 harness 把用户已经完成危险操作确认之后的“删除全部本地数据”协议变成可执行编排合同。它覆盖 AT-F18 和安全威胁模型定义的 durable intent、写入静止、连接关闭、密钥失效、本地工件删除、负向枚举验证及最后清除 intent。

它不定义 UXD-08 的确认方式，不创建 React Native 页面，也不实现 SQLCipher、Keychain、UserNotifications、App Group 或文件系统 adapter。内存 fake 只能证明顺序、回执、幂等和重启收敛语义，不能作为 iOS 真机清理通过的证据。

## 状态合同

```text
IDLE
  -> INTENT_DURABLE
  -> WRITES_BLOCKED_AND_QUIESCED
  -> CONNECTIONS_CLOSED
  -> SECRETS_INVALIDATED
  -> LOCAL_ARTIFACTS_REMOVED
  -> VERIFIED_EMPTY
  -> READY_FOR_FRESH_START
```

`phase` 表示最后一个已经由结构有效的调用方观察声明完成的阶段。每个 effect 发出后保存在 `pendingEffect`，只有匹配当前 effect fingerprint 的严格 outcome evidence 才能推进。状态、intent、effect、观察值和回执均被复制并深度冻结，只包含受预算约束的被动 JSON。

`wipe-intent-v1` 只允许以下字段：

```text
operationId
protocolVersion
installationGeneration
inventoryRevision
inventoryFingerprint
writerRegistryRevision
writerRegistryFingerprint
```

`operationId` 与 `installationGeneration` 必须使用固定格式的 opaque 随机 ID；不接受可读名称或自由文本。inventory 与 writer registry 的 revision/fingerprint 必须匹配当前内置 safety contract。任何额外字段、陈旧 contract 或未知协议版本都会被拒绝或进入 `SAFE_RECOVERY_REQUIRED`，保持写入关闭且不生成删除 effect，避免把食品名、健康数据、路径清单、Keychain 标识或密钥写入恢复标记。

协调器状态虽然保持 plain data 和可序列化，但当前进程只接受自己签发的 frozen state；调用方复制后改写 `phase` 不能跳过前置阶段。进程重启后不得反序列化并信任任意内存 state，只能从经过校验的 durable intent 通过 `recoverWipeFromIntent` 重新开始幂等收敛。

## Effect 与完成观察

| Effect | 目标阶段 | 必须证明的观察 |
| --- | --- | --- |
| `PERSIST_INTENT` | `INTENT_DURABLE` | intent 已原子持久化且 fingerprint 匹配 |
| `QUIESCE_WRITERS_AND_TASKS` | `WRITES_BLOCKED_AND_QUIESCED` | registry revision/fingerprint 与内置合同一致；权威 writer 集合逐项 acknowledgement；gate 已关闭；活动任务、pending 通知和 delivered 通知均为 0 |
| `CLOSE_CONNECTIONS` | `CONNECTIONS_CLOSED` | 可写 handle 与活动事务均为 0 |
| `INVALIDATE_SECRETS` | `SECRETS_INVALIDATED` | 数据库 key 不存在，AI key 数为 0 |
| `REMOVE_LOCAL_ARTIFACTS` | `LOCAL_ARTIFACTS_REMOVED` | inventory revision/fingerprint 一致，当前已知工件剩余数为 0；新出现的 entry 由后续负向枚举发现并回到本阶段清理 |
| `VERIFY_EMPTY` | `VERIFIED_EMPTY` | roots、inventory、writer registry 全部匹配；gate、writer、任务、连接、事务、数据库/AI key、业务 generation、工件、未知 entry 和通知均满足空状态；intent 仍在；外部 Files 明确为 `OUT_OF_SCOPE` |
| `CLEAR_INTENT` | `READY_FOR_FRESH_START` | adapter 重新执行完整空状态检查后清除 intent；此前没有新建空库、读取 SecretVault 或渲染业务页面 |
| `RECONCILE_PHASE` | 原目标阶段 | 重新观察当前系统的 phase 后置条件，不能重放旧回执缓存 |

intent 被证明 durable 前，协调器不会产生任何删除 effect。每个后续 effect 都携带完整 intent fingerprint；adapter 必须先核对当前 durable intent，不能覆盖或操作另一个 operation。intent durable 后不能取消或回到正常业务态；失败只能重试，回执未知只能对账。`attempt` 仅用于拒绝迟到回调，adapter 幂等键固定为 `operationId + phase`，重试不得换键。

## 故障语义

每个 adapter outcome 都必须通过 `createWipeEffectOutcome` 形成：

```text
schemaVersion: WIPE_EFFECT_OUTCOME_V1
operationId + phase + attempt + protocolVersion
status: APPLIED | NOT_APPLIED | UNKNOWN
evidenceId + verifierId + profileId
effectFingerprint
observation + observationFingerprint
errorCode
assertionBoundary: CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS
outcomeFingerprint
```

回执输入必须是严格 plain record；观察必须是 dense、无 accessor/symbol/cycle/非有限数的被动 JSON，并受 depth、object key、array item 和单字符串预算限制。`APPLIED` 必须带 observation 且不得带 errorCode；`NOT_APPLIED/UNKNOWN` 必须带 errorCode，`UNKNOWN` 不携带可被信任的 observation。effect、observation 或 outcome 任一字段变化都会破坏指纹；旧裸回执、额外字段和跨 effect 重放都被拒绝。

- `APPLIED`：观察值满足该阶段的负向或完成证明后才推进；证明不完整会转入 `RECONCILING`，不会把 pending effect 锁死。
- `NOT_APPLIED`：保留最后完成阶段，允许用同一幂等键递增 attempt 重试。
- `UNKNOWN`：立即保持写入关闭，进入 `RECONCILING`。不能直接执行下一阶段，也不能假设未执行。
- `RECONCILE_PHASE / APPLIED`：使用原 effect 类型校验观察值后推进。
- `RECONCILE_PHASE / NOT_APPLIED`：回到同一阶段重试，不生成新的 operation。
- `RECONCILE_PHASE / UNKNOWN`：继续对账，不能初始化业务库或读取密钥。
- durable intent 缺失或 fingerprint 冲突：进入 `SAFE_RECOVERY_REQUIRED` 并持续关闭写入，不覆盖、不猜测也不继续 destructive effect。

`CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS` 很重要：结构与指纹只证明“这份调用方声明与当前 effect 一致且未在传递中被改写”，不证明调用方真的枚举了 iOS 容器、删除了 Keychain/通知或执行了任何原生 API。真实 adapter 必须用自己的受审 profile ID 和外部证据，并通过真机负向枚举与 kill/restart 验收。

`VERIFY_EMPTY` 或 final clear 发现任一后置条件漂移后，对账返回 `EMPTY_VERIFICATION_FAILED`，协调器会保守回到 intent durable 阶段，重新执行 writer/通知静止、关连接、密钥失效、递归清理和完整验证。它继续使用同一 operation 与各 phase 幂等键，也不会把未知 entry 名称写进 durable intent。

任何迟到 attempt、错误 phase、伪造 operation、错误协议或不完整观察都会被拒绝，原状态保持不变。

## 内存 adapter 边界

`createInMemoryWipeAdapter` 提供按 phase 幂等的测试 fake，并支持在 effect 应用前失败、应用后丢失回执、阶段间状态漂移和从持久化 runtime snapshot 建立全新 adapter。它模拟 writer、任务、通知、连接、密钥、业务 generation、已知工件、未知容器 entry 和外部 Files 副本。kill-point 测试会丢弃原协调器 state、adapter 实例和内存幂等 Map，再仅凭 durable intent 与部分外部状态收敛；reconciliation 重新读取当前状态，而不是返回旧 observation。`reconcileWipeStartup` 还会在 clear 回执丢失后，从无 intent 的持久状态重新核对安装代、contract、通知、连接、密钥、generation 和 inventory，只有完整空状态才返回 `FRESH_START_ALLOWED`。

fake 明确不证明：

- `fsync`、原子 rename、iOS 文件保护或递归 sandbox 枚举真实有效。
- SQLCipher connection、WAL/SHM、进程内 key material 已真实关闭或清除。
- Keychain service/account、ThisDeviceOnly、卸载重装与安装代绑定正确。
- `removeAllPendingNotificationRequests` 和 `removeAllDeliveredNotifications` 已在真机生效。
- App Group、UserDefaults、URL cache/cookie、日志、媒体与 staging 的真实 inventory 完整。
- 闪存块、系统快照、Apple/TestFlight 诊断、截图或用户导出的 Files 副本被物理擦除。

外部 Files 副本始终报告为 `OUT_OF_SCOPE`，fake 和正式 adapter 都不得删除或声称删除这些用户管理的副本。

## 当前测试证据

41 项测试覆盖：intent-first 顺序、intent 写入失败零删除、完整 happy path、每个后续 phase 的真实进程状态丢弃与恢复、clear 回执丢失后的启动判定、无 intent 但有残留时 fail closed、destructive phase 前 intent 丢失进入安全恢复、`UNKNOWN -> NOT_APPLIED`、各 phase 的提交前失败重试、未来协议和陈旧 contract fail closed、第二 operation 与 intent fingerprint 冲突、复制/伪造 state 跳阶段、opaque ID 与敏感字段拒绝、迟到与伪造 outcome、严格 outcome evidence 身份与三层指纹、裸回执/篡改/重放拒绝、恶意被动 JSON/预算、权威 writer registry、遗漏/新增 writer、pending/delivered 通知、未知容器 entry 清理后收敛、当前状态对账、阶段间连接漂移、关连接前禁止删 key、稳定幂等键、payload 冲突、深拷贝冻结、缺失目标幂等成功、final clear 前后全量重验、漂移后保留 intent 并重新收敛。

运行：

```powershell
node --test tools/local-wipe-coordinator-harness.test.mjs
node --test tools/*.test.mjs
node project-ops/validate.mjs
git diff --check
```

## 后续生产门禁

正式实现前仍需冻结 Keychain service/account、安装代与 generation 绑定、集中式 writable-container inventory、legacy path、系统占位 allowlist、writer registry 和超时策略。React Native 工程门禁、Mac/Xcode 和真实 iPhone 可用后，还必须增加 SQLCipher/Keychain/通知/文件系统 adapter、逐持久化点 kill/restart、卸载重装、App Group、锁屏和真机负向枚举测试。

本 harness 不关闭安全终审 G4/G6，不把 `SPIKE` 改写为生产实现，也不授权任何仍待 Owner 决策的交互、库或原生方案。
