# Meal Slot Grouping Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/meal-slot-grouping-harness.mjs` 与 `tools/meal-slot-grouping-harness.test.mjs`

> 对应能力：F06、REQ-F06、AT-F06；对应旅程：J-02、J-05 的只读分组分支

## 目的

这个 harness 把 F06 中可在未批准默认餐次规则前安全实现的部分变成只读合同：调用方显式提供一个版本化餐次定义集合及顺序，餐食记录只提供绑定该定义指纹的餐次引用；读模型按指定本地日期输出有序餐次、空餐次、明确未分配记录和当前无法解析的旧引用。

合同没有内建“早餐、午餐、晚餐、零食”，不会从时间、名称、营养、创建顺序或当前系统时钟猜餐次。餐次名称、图标和文案也不属于本合同；这里只保留 opaque `slotId` 和显式 `position`。

## 餐次定义

`MEAL_SLOT_DEFINITION_SET_V1` 必须包含：

```text
{
  definitionId,
  definitionVersion,
  slots: [
    { slotId, position }
  ]
}
```

约束：

- 定义 ID、版本和每个 slot ID 都由调用方提供；
- position 必须唯一，并形成从 0 开始的连续显式顺序；
- slot 输入数组顺序不重要，规范结果按 position 排列；
- 空 slots 合法，合同不会补入任何默认值；
- 完整规范定义进入 SHA-256 指纹，版本、slot 集合或顺序变化都会形成新定义身份。

17 个 slot/record 用例只是测试数据，不是产品默认值；128 个 slot 和 4096 条事实是 harness 的反滥用预算，不是 iOS 或产品上限。

## 分配事实与三类输出

`MEAL_SLOT_ASSIGNMENT_FACT_V1` 只含 `recordId`、`revision`、`localDate` 和 `slotRef`：

- `slotRef = null`：记录明确未分配；
- `slotRef.definitionFingerprint` 等于当前定义，且 slotId 存在：进入对应餐次；
- 引用当前定义中不存在的 slot：进入 `unresolved / SLOT_NOT_IN_DEFINITION`；
- 引用另一个定义指纹：进入 `unresolved / DEFINITION_NOT_AVAILABLE`。

未知旧定义绝不被降级成“未分配”，也不会自动映射到同名或同位置 slot。未来若要迁移或映射，必须有单独、可审计的外部策略和事务合同。

每个餐次即使没有记录也保留在结果中，并明确标为 `EMPTY`。记录只输出 `recordId + revision` 反查证据；本合同不复制营养快照、份量、热量、目标或 UI 文案。

## 当前自动化证据

17 项测试覆盖：

- 调用方定义、版本、顺序与定义指纹；
- 空定义不生成默认餐次；
- 重复 ID/position、position 缺口、未知字段和资源预算拒绝；
- 指定日期过滤、稳定记录顺序、revision 反查；
- 空餐次保持、明确未分配、未知 slot、旧定义分离；
- 定义版本/顺序变化后旧引用保持 unresolved，不静默迁移；
- 输入顺序不影响规范指纹和分组；
- 结果完整重建校验，计数、状态、顺序、定义绑定和指纹篡改拒绝；
- 返回值深冻结，不读取系统时钟，不使用网络、原生、存储、营养或目标 API。

## 明确不授权

本合同不授权或冻结：

- 默认餐次数量、名称、顺序、图标或时间范围；
- 用户自定义餐次、重命名、排序、删除或历史迁移；
- 餐食移动、复制、批量操作、最近、收藏或恢复；
- 添加入口、空态布局、交互、动画、文案和无障碍实现；
- 餐次目标、日目标、热量/营养计算或健康建议；
- SQLite/SQLCipher schema、Repository、事务或迁移；
- React Native/Expo/原生实现、正式工程或 Gate/Owner 状态变化。

## 验证

```powershell
node --test tools/meal-slot-grouping-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
git diff --check
```

正式实现仍须等待 Owner 批准默认/自定义规则，并补齐组件、Repository、迁移、E2E 与真实设备证据。
