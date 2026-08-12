# 本地数据访问清单合同 Harness

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应：F18 / REQ-F18 / AT-F18
>
> 实现：[local-data-access-manifest-harness.mjs](../../../tools/local-data-access-manifest-harness.mjs)；测试：[local-data-access-manifest-harness.test.mjs](../../../tools/local-data-access-manifest-harness.test.mjs)

## 目的与授权边界

F18 要求用户能够在本机访问、更正和删除数据。现有领域事务已经提供更正/删除底座，`local-wipe-coordinator` 已覆盖全量删除的 intent、kill-point 和启动对账；此前仍缺的是一份跨领域、用户可见且能验证完整性的只读访问合同。

本 harness 只建立应用内读取边界，不生成文件，也不替代备份：

- 交付模式固定为 `IN_APP_READ_ONLY`；
- 文件/CSV/JSON 导出、Files picker、分享和剪贴板均不在 API 中，D-035 保持未授权；
- 不创建加密备份，不选择 KDF/envelope，不恢复 generation，D-027/D-030 保持未授权；
- 不提供 create/update/delete 方法，不选择删除确认交互；领域更正、领域删除和全量 wipe 仍由各自合同承担；
- 不读取或返回 Keychain secret value；真实 Keychain、通知、App Group 与容器枚举仍要求原生 adapter；
- 用户选到外部 Files 的备份副本属于用户/系统控制范围，只报告 `OUT_OF_SCOPE_USER_CONTROLLED`，不得枚举、删除或声称清理。

## 调用方领域定义

调用方必须显式提供 `LOCAL_DATA_DOMAIN_DEFINITION_V1`：

```text
{
  domainId,
  definitionVersion,
  position,
  dataClass: "USER_BUSINESS_DATA",
  payloadDefinition
}
```

`payloadDefinition` 是版本化 opaque JSON；harness 只做严格结构、资源预算和 fingerprint 校验，不解释字段。没有内置领域、产品字段或默认排序。`position` 是调用方提供的稳定展示/遍历顺序，domain ID 和 position 都必须唯一。空领域也保留在清单中，避免“零记录”被误解为“该领域不在访问范围”。

访问记录为 `LOCAL_DATA_ACCESS_RECORD_V1`，携带 domain ID、definition version/fingerprint、record ID、revision 和 opaque payload。记录必须绑定精确领域定义；同一领域内 record ID 唯一。规范顺序固定为 domain position，再按 record ID 排序，输入数组顺序不改变 snapshot fingerprint。

只允许 `USER_BUSINESS_DATA` 进入记录页。secret/credential 不能通过换一个调用方 data class 混入清单。

## 稳定快照与分页

调用方打开快照时必须提供：

```text
LOCAL_DATA_ACCESS_REQUEST_V1 {
  requestId,
  expectedRepositoryGeneration,
  pageSize,
  deliveryMode: "IN_APP_READ_ONLY"
}
```

没有隐式当前 generation、默认 page size 或系统时钟。generation 不匹配时 fail closed。快照 descriptor 固定：

- repository identity/generation、request ID 与 delivery mode；
- 完整版本化领域定义及其 fingerprint；
- 每个领域的 record count/fingerprint，包括空领域；
- 总 record/page count 与完整 records fingerprint；
- 固定控制边界；
- 由全部 descriptor 内容派生的 snapshot ID。

读取页只接受 `snapshotId + cursor`。cursor 绑定 descriptor fingerprint、snapshot ID、page size 和 offset；第一页必须用 `null` cursor。每页绑定起止 offset、page index、上一 cursor、记录 fingerprint、下一 cursor 和 page fingerprint。跨快照游标、跳到页中间、改 page size、改 offset 或篡改 fingerprint 都被拒绝。

空快照仍返回一张可验证的空页。这样调用方不需要通过“零次返回”猜测读取是否完成。

## 全量完成证明

`verifyCompleteLocalDataAccessRead` 对所有页面重新校验并要求：

1. page count 与 descriptor 一致；
2. 页号和 offset 连续，无缺页、重复或倒序；
3. 每页 `nextCursor` 与下一页 `cursorUsed` 精确相连；
4. 末页 cursor 为空，总记录数与完整 fingerprint 一致；
5. 由页记录重建的每领域 count/fingerprint 与 descriptor 一致。

成功只返回 `LOCAL_DATA_ACCESS_COMPLETION_V1` 摘要，不再复制全量 payload，也不落盘。

## 固定控制边界

| 边界 | 合同值 |
| --- | --- |
| App 控制内业务数据 | `IN_APP_READ_ONLY_PAGED` |
| Keychain secret values | `EXCLUDED_NEVER_RETURNED` |
| Keychain/通知/App Group 等真实容器 inventory | `REQUIRES_NATIVE_ADAPTER` |
| 用户管理的外部 Files 副本 | `OUT_OF_SCOPE_USER_CONTROLLED` |
| 生成文件/分享等 artifact | `NOT_AUTHORIZED` |
| 数据 mutation | `NOT_AUTHORIZED` |

这些值是安全能力边界，不代表真实 iOS 容器已经完成枚举，也不代表访问清单自动覆盖未来新增领域。正式 Repository 必须从唯一注册表提供完整领域定义，原生 adapter 必须单独给出受控容器 inventory 证据。

## 当前测试证据

19 项 Node 测试覆盖：

- caller-owned 版本化 opaque 定义、空领域和规范顺序；
- secret class、unsafe key、cycle、special object、非有限数字和资源超限拒绝；
- domain ID/position、record identity、未知 domain 与 stale definition binding 冲突；
- generation CAS、显式 page size 和只允许应用内只读交付；
- 多页与空页读取、游标跨快照/offset 篡改；
- descriptor、统计、定义、控制边界、record payload、range、cursor、短中间页重签和 page fingerprint 篡改；
- 缺页、重复页、倒序页和混用快照 fail closed；
- 构造后输入变更不能改 repository 数据；
- 源码不存在文件系统、网络、系统时钟、账号、导出或 mutation 实现；
- public API 只有 `openSnapshot` 和 `readPage`。

运行：

```powershell
node --test tools/local-data-access-manifest-harness.test.mjs
```

## 后续生产门禁

本 harness 不能证明 SQLCipher 一致性读事务、正式 schema adapter、所有业务领域注册完整、动态分页性能、UI 可访问性或真实容器 inventory。进入正式实现前至少还需：

1. 在批准的 Repository/SQLCipher 访问层上绑定一个跨页一致性快照，确保期间写入不造成缺项或重复；
2. 为每个首发业务领域提供版本化 adapter、空领域与历史 schema fixture，并建立唯一领域注册表；
3. 组件/E2E 验证用户能发现、阅读和定位全部数据，同时不会意外触发编辑、删除、分享或 Files 输出；
4. 原生 XCTest/真机分别枚举 Keychain metadata、通知、App Group 与受控文件容器，secret values 永不显示；
5. 继续用 wipe 真机矩阵验证全量删除；若 Owner 未来接受 D-035/D-027/D-030，则为导出/备份/恢复建立独立合同和安全测试，不能扩写本 harness。

因此本证据只把 F18 的“应用内只读访问清单”从合同缺口推进为框架无关覆盖，不关闭 G4/G5/G6，也不授权正式实现。
