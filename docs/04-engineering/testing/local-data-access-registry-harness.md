# 本地数据领域注册表与一致性读取合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应：F18 / REQ-F18 / AT-F18
>
> 实现：[local-data-access-registry-harness.mjs](../../../tools/local-data-access-registry-harness.mjs)；测试：[local-data-access-registry-harness.test.mjs](../../../tools/local-data-access-registry-harness.test.mjs)

## 目的

既有 `local-data-access-manifest` 合同能够验证调用方提供的领域定义、记录、分页和全量完成证明，但不会证明正式 Repository 从一个完整注册表读取，也不会证明多个领域来自同一个一致性事务。F18 如果缺少这层组合根，新增业务领域可能被访问清单静默遗漏，跨领域读取也可能混合写入前后的 generation。

本合同补充两个框架无关边界：

1. 所有纳入应用内数据访问的业务领域必须来自一份版本化 `LOCAL_DATA_DOMAIN_REGISTRY_V1`；
2. 打开访问快照必须通过一个绑定 `repositoryGeneration + registryFingerprint` 的只读事务端口，恰好读取每个注册领域一次并关闭事务后，才能交给既有清单合同生成 descriptor 和页面。

它不实现 SQLite/SQLCipher，不选择 D-020 访问层，也不宣称首发真实领域 adapter 已完成。

## 唯一注册表

注册表由调用方提供：

```text
LOCAL_DATA_DOMAIN_REGISTRY_V1 {
  registryId,
  registryVersion,
  entries: [
    LOCAL_DATA_DOMAIN_REGISTRY_ENTRY_V1 {
      adapterId,
      domainDefinition: LOCAL_DATA_DOMAIN_DEFINITION_V1
    }
  ]
}
```

`domainDefinition` 完全复用访问清单合同的 caller-owned、版本化 opaque 定义。本合同不内置 diary、water、profile 等产品领域，也不解释 payload 字段。`domainId`、`position` 和 `adapterId` 都必须唯一；注册表不能为空；规范顺序只由显式 position 决定。

Repository source 必须为每个注册领域提供且只提供一个记录集合。缺少领域或夹带未注册领域都会在组装端口时失败，空领域必须以空数组显式存在，不能被省略。

## 一致性只读事务

组合层只接受以下事务证据：

```text
LOCAL_DATA_READ_TRANSACTION_V1 {
  transactionId,
  repositoryId,
  repositoryGeneration,
  registryFingerprint,
  isolation: "CONSISTENT_READ_SNAPSHOT",
  readOnly: true
}
```

打开前必须以请求中的 `expectedRepositoryGeneration` 做 CAS，并绑定当前注册表 fingerprint。每个领域读取请求同时绑定 transaction、repository、generation、registry、adapter、domain definition version/fingerprint。适配器回执改绑到另一个领域、定义、adapter、generation 或注册表均失败关闭。

完成读取后，事务必须返回绑定完整读取集合的关闭回执。任一领域失败时仍发送 `ABORTED` 关闭请求；关闭回执缺失或无效时不得发布 descriptor。只有全部领域读取和 `COMPLETED` 关闭均成功后，才调用既有 `local-data-access-manifest` 合同创建稳定分页快照。

内存端口会在事务打开时复制 generation 与全部领域记录，用于证明读取期间发生的源写入不会污染当前快照。这是端口语义的可执行模型，不是 SQLCipher 的实际 snapshot-isolation 证据。

## 当前自动化证据

15 项 Node 测试覆盖：

- caller-owned 注册表规范化、显式顺序和 immutable fingerprint；
- 空注册表、额外字段、secret data class、重复 domain/position/adapter 拒绝；
- 缺少注册领域和夹带未知领域在端口组装时失败；
- 每个注册领域进入同一个只读 descriptor，空领域保持可见；
- generation 陈旧时读取任何 adapter 前失败；
- transaction evidence、adapter result 和关闭回执的跨边界绑定；
- adapter 返回的记录在事务内按既有 manifest 合同重新校验，非法记录进入 `ABORTED`；
- 领域读取失败仍以 `ABORTED` 关闭事务；
- 读取期间源 generation/记录变化不混入已打开快照；
- 后续源变化不能改写已发布页面；
- public API 仍只有 `openSnapshot` / `readPage`；
- 源码不新增 SQL、文件、网络、系统时钟、原生或 mutation 实现。

运行：

```powershell
node --test tools/local-data-access-manifest-harness.test.mjs tools/local-data-access-registry-harness.test.mjs
```

## 未授权与后续门禁

本合同没有授权或证明：

- D-020 的 SQLite 访问层、SQLCipher schema、migration、WAL、真实 snapshot transaction 或并发性能；
- 首发业务领域集合、产品字段、adapter mapping、历史 schema fixture 或正式 Repository；
- React Native 页面、导航、搜索、可访问性、编辑、删除、分享、Files 输出或 E2E；
- D-035 明文 JSON/CSV 导出，或 D-027/D-030 备份和恢复；
- Keychain secret value、通知、App Group、受控文件容器 inventory 或外部 Files 副本枚举；
- 原生、真机、Release、Gate 变更或正式实现。

下一步仍需在 Owner 批准的 Repository 访问层上实现真实一致性读事务，为每个首发领域提供版本化 adapter/fixture，并完成 UI 与原生容器证据。本合同把遗漏和混代风险转化为可执行端口要求，但不把框架无关内存模型冒充为 SQLCipher 已完成。
