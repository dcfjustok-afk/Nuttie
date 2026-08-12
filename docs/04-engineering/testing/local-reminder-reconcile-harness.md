# 本地提醒规则与调度对账合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应能力：F15、REQ-F15、AT-F15；对应旅程：J-08
>
> 已确定边界：规则本地保存；通知权限拒绝/受限/撤销时规则保留为未安排；本地通知不是可靠闹钟

## 1. 目的与结论

`tools/local-reminder-reconcile-harness.mjs` 把提醒拆成两个不能混为一谈的事实域：

1. 本地规则 repository 是用户配置的真源，支持创建、修改、删除、revision CAS、幂等回放和单调 `rulesGeneration`；
2. 平台调度是可失败、可撤权、可部分提交的副作用，必须通过重新枚举 Nuttie 自己的 pending/delivered 请求与 desired state 对账。

因此，权限或系统调度失败不会回滚、删除或冒充本地规则保存失败。规则保存成功后，即使权限是 `NOT_DETERMINED`、`DENIED` 或 `RESTRICTED`，规则仍存在并显示为未安排。

## 2. 未决规则语义的隔离

提醒类型、重复方式、补发规则、文案和默认时区尚未批准。合同不解释这些字段，而是保存一个版本化、受资源预算约束的 opaque `REMINDER_RULE_DEFINITION_V1` envelope。外部规划器根据未来获批准的产品规则生成有限的具体 occurrence plan；每个 occurrence 必须携带：

- 请求的本地墙钟时间；
- 解析后的本地墙钟时间与显式 offset 时刻；
- IANA 类时区 ID、时区规则版本；
- 明确的 DST 解析 policy ID；
- 与本地规则定义绑定的 SHA-256 指纹。

合同保留这些证据但不选择 DST 默认策略。空的有限规划窗口不等于删除规则，而是 `NO_OCCURRENCES_IN_WINDOW`。

## 3. 对账与并发语义

- pending 请求使用稳定的 Nuttie 命名空间 ID；对账 scope 固定为 `NUTTIE_REMINDERS_ONLY`，不得枚举或删除其他 App 的通知。
- `rulesGeneration` 每次成功的本地规则事务递增一次。
- `desiredStateGeneration` 同时覆盖权限与规则状态；规则改变或权限刷新都必须生成新的 desired state。
- 平台快照保存已应用的 desired-state/rules generation 与指纹。旧 generation 被拒绝；同 generation 不同内容被视为冲突，防止旧授权或旧规则乱序覆盖新状态。
- 调度结果未知时没有“盲重试旧 effect”API；必须重新枚举平台快照，再生成新的对账 effect。
- 回执必须证明 pending 已收敛、平台 generation/指纹匹配、整个 snapshot 指纹一致，并且 effect 输入中已观察到的 delivered 历史没有丢失。
- 权限拒绝、受限或撤销时，目标 pending 为空；本地规则和 delivered 历史保持可辨。

`AUTHORIZED` 与文档允许的 `LIMITED` 只表示可尝试安排，不表示系统一定呈现。所有 observation 固定 `systemPresentationGuaranteed = false`，因为 Focus、静音、通知摘要和系统策略可能延迟或抑制通知。

## 4. 自动化证据

执行：

```powershell
node --test tools/local-reminder-reconcile-harness.test.mjs
```

18 项测试覆盖 opaque 规则定义与指纹、DST 请求/解析证据、非法时间和资源预算、空滚动窗口、本地 CRUD、revision CAS、权限独立保存、本地提交前/后失败、幂等冲突、authorized/limited 调度、拒权/撤权、pending 与 delivered 分离、规则更新/删除、部分/全部平台提交未知结果、重新枚举修复、并发旧 generation/权限竞态、伪造 effect/snapshot/receipt、输入不可变性，以及禁止暴露提醒类型、重复默认值、通知内容、Push/APNs、网络或后台定时器 API。

夹具中的 4096 条规则/occurrence 和定义大小限制仅用于防止测试合同资源滥用，不是 iOS 平台待处理通知上限、产品滚动窗口大小或性能承诺。真实上限仍须在获授权的 Mac + 真机原生 Spike 中测量。

## 5. 尚未授权的内容

- 提醒类型、时间/重复 UI、默认时区、DST 处理、补发、滚动窗口大小、通知标题/正文和默认启用状态。
- 权限用途说明和系统设置入口的最终简中文案及组件交互。
- Expo/RN 通知库、`UNUserNotificationCenter` adapter、真实权限请求和 iOS 调度调用。
- 远程 Push、APNs token、远程通知 entitlement、后台 JS 定时器和“可靠闹钟”宣称全部不在合同内。
- SQLite/SQLCipher repository、迁移、组件、无障碍、Focus/通知摘要与真机证据必须在获授权工程阶段完成。
