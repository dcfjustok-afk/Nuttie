# AI 凭据生命周期合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应旅程：J-09 配置或移除个人 AI 凭据
>
> 适用决定：D-003、D-004（已接受）；D-033、D-034、D-036、D-053（仍待 Owner）

## 1. 结论与边界

`tools/ai-credential-lifecycle-harness.mjs` 把 AI Provider 的非敏感配置与 API key 生命周期建模为可恢复的本地状态机。它证明配置、替换、移除和启动对账可以遵守以下不变量：

- 每个人只配置自己的 `baseURL`、`model` 与 key，不存在内置或共享 key；
- key 只作为单次调用的独立参数进入 SecretVault/Keychain port，不进入状态、intent、effect、receipt、inspection、错误、快照或普通数据库；
- 新 key 使用新的版本化 `credentialRef`，不覆盖当前活动 key；
- SQLite 类配置提交与 Keychain 类密钥写入不是全局原子事务，因此必须使用 durable intent 和启动对账；
- 任何 intent、未知结果、密钥缺失、孤儿密钥、跨安装代或 SecretVault 不可用状态都关闭 AI 网络门；
- 移除时先关闭入口并等待活动任务归零，再删除全部应用自有 AI 密钥、配置和连接状态，最后以负向检查确认不存在残留；
- 配置完成不等于允许发请求。D-053 未接受或 Provider/载荷 policy 不是 `ALLOW` 时，真实 AI 发送仍为 `BLOCKED`。

该夹具不实现 React Native、Keychain、SQLCipher、真实 Provider、连接测试或任何网络请求，不是原生实现或发布证据。

## 2. 公开状态与敏感值边界

可持久化状态只包含安装代、配置修订、非敏感 Provider 配置、opaque `credentialRef`、密钥槽元数据、durable intent、重试计数和恢复状态。公共记录采用精确字段集合，拒绝未知扩展字段、特殊对象和值。

API key 保存在模块内的临时内存槽中，并只在 `WRITE_NEW_SECRET` 时作为第二个参数传给适配器。成功写入或确认该写入已经生效后，临时引用立即丢弃；进程丢失且 durable intent 已存在、但目标 key 尚未写入时，状态进入 `KEY_REENTRY_REQUIRED`。

JavaScript 运行时不能保证字符串内存被确定擦除。生产实现必须缩短 key 在 JS 中的寿命，禁止日志、错误回显、持久化、备份和跨任务缓存；是否进一步采用原生安全输入/存储桥接，要由原生 Spike 证明。

## 3. 保存与替换时序

同一 `operationId` 和 `commandFingerprint` 绑定一次不可变命令；配置修订使用 compare-and-swap 防止旧页面覆盖新状态。

1. `PERSIST_INTENT`：先持久化不含 key 的 SAVE intent；
2. `WRITE_NEW_SECRET`：向新的版本化槽写入 key；
3. `QUIESCE_AI`：关闭 AI 网络门并等待活动任务归零；
4. `ACTIVATE_CONFIG`：提交目标配置和新修订；
5. `DELETE_OLD_SECRET`：替换场景删除旧槽，首次配置跳过；
6. `VERIFY_AND_CLEAR_INTENT`：验证活动配置只绑定一个目标槽，再清除 intent 并开放配置生命周期门。

旧 key 不会被新值覆盖，也不会在新配置失败后作为隐式 fallback 使用。这里的“开放配置生命周期门”只表示凭据状态一致；真正的发送仍须通过独立 AI policy、预览确认和资源预算门。

## 4. 移除时序

1. `PERSIST_INTENT`：持久化 REMOVE intent；
2. `QUIESCE_AI`：关闭网络门并等待活动任务归零；
3. `DELETE_ALL_SECRETS`：删除当前安装可见的全部应用自有 AI 密钥槽，包括孤儿槽；
4. `DELETE_CONFIG`：删除 Provider 配置与连接状态并推进修订；
5. `VERIFY_AND_CLEAR_INTENT`：确认配置、连接状态和密钥槽均为空，再清除 intent。

移除不读取 key，也不影响本地饮食、体重、活动或设置数据。跨安装代、SecretVault 不可用或无法枚举/证明删除范围时必须 fail closed，不得宣称清理完成。

## 5. 未知结果与启动对账

每个 effect 都携带 phase、attempt、command/effect fingerprint。适配器回执只提供匹配线索，状态机还会独立校验 inspection 是否满足该 phase 的完整后置条件。

- 明确 `NOT_APPLIED`：保留同一不可变命令，允许递增 attempt 重试；
- `UNKNOWN`：禁止直接重放，先产生 `RECONCILE_EFFECT`；
- 对账证明 `APPLIED`：从已验证的实际状态继续下一阶段；
- 对账证明 `NOT_APPLIED`：只有实际状态仍等于阶段前状态时才允许重试；
- 对账 `INDETERMINATE` 或证据互相矛盾：进入 `SAFE_RECOVERY_REQUIRED`，网络保持关闭；
- 启动发现 durable SAVE intent 且 key 尚未写入：要求重新输入 key；
- 启动发现活动配置缺少唯一对应 key：要求重新配置；存在无关/额外槽时进入安全恢复，不能把孤儿密钥冒充活动密钥。

## 6. 自动化证据

执行：

```powershell
node --test tools/ai-credential-lifecycle-harness.test.mjs
```

测试覆盖：

- HTTPS、默认 443 归一化及 URL 携带凭据/查询/fragment 的 fail-closed 行为；
- 首次保存、替换、移除、CAS 和并发命令阻断；
- 每个保存与移除阶段的 apply 前失败、apply 后回执丢失、对账和收敛；
- durable intent 后进程丢失、密钥写入后进程丢失、SecretVault 暂时不可用；
- key 缺失、孤儿/额外槽、跨安装代和无法读取 SecretVault；
- 伪造匹配回执但不满足实际后置状态时拒绝结算；
- 所有可观察状态、命令、回执、错误和适配器快照不含 canary key，且不触发密钥读取、请求体组装或网络传输。

## 7. 尚未授权的内容

- D-036 尚未冻结 URL path、query、redirect、session 和 origin 变化规则。当前合同只接受可证明的 HTTPS host/path，并对 userinfo、query、fragment 返回固定错误，不回显输入中的秘密；这不是 D-036 最终结论。
- D-033 尚未冻结除营养标签照片外的逐次预览和同意范围。
- D-034 尚未冻结请求/响应大小、超时、并发和成本预算。
- D-053 尚未接受，也没有真实 Provider 用途证据；因此“连接测试”和真实载荷发送都不在本合同内。
- iOS Keychain accessibility、service/account 命名、卸载重装、锁屏/重启与原生错误映射必须在受支持 Mac/Xcode 和真实 iPhone 上取得证据。
