# 每日能量事实账本合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/daily-energy-ledger-harness.mjs` 与 `tools/daily-energy-ledger-harness.test.mjs`

> 对应能力：F04、REQ-F04、AT-F04；复用 F11 已验证的摄入/消耗事实格式，并严格保持 D-040 公式门禁。

## 目的

公开证据确认日记会同时显示 Eaten、Burned、Left，但没有证明计算公式、目标缺失、缺失消耗、负数、舍入和历史目标删除时的行为。D-040 也明确要求公式、目标调整、舍入和历史语义分别版本化并经 Owner 确认。

这个 harness 因此实现完整的账本事实输入层，而不伪造 Left：它读取指定本地日期的摄入与消耗事实、选择当日生效的既有能量目标版本，并保留所有来源证据。即使目标、摄入和消耗三者都已知，Left 仍固定为 `POLICY_NOT_AUTHORIZED`，值为 `null`。

## 输入事实

摄入与消耗复用 `ENERGY_FACT_V1`：

- `INTAKE` 只能追溯到餐食记录；
- `BURNED` 只能追溯到手工消耗或明确标记的本地估算；
- 原始 kcal/kJ 字符串、精确 kcal 有理数、record ID、revision 和质量状态全部保留；
- 显式零是 `KNOWN`，没有事实是 `MISSING`，不能互相替代。

能量目标使用 `ENERGY_TARGET_VERSION_V1`：

```text
{
  versionId,
  effectiveFrom,
  generatedAt,
  source: {
    sourceKind,
    sourceId,
    sourceVersion,
    ruleId,
    ruleVersion,
    userEdited
  },
  target: {
    status: SET | UNSET,
    inputValue?,
    inputUnit?
  }
}
```

`SET` 只接受明确的无符号 kcal/kJ 十进制事实，并派生精确 kcal；`UNSET` 不带数值。显式零目标与 unset 不同。来源、可选成对 rule 标识、用户编辑状态、生成时点和生效日只被保留，不被解释为已批准公式。

## 指定日期快照与输出

Repository port 返回完整 `DAILY_ENERGY_LEDGER_SNAPSHOT_V1`：

- 指定 `localDate`；
- Repository revision；
- 该日全部摄入/消耗事实与 SHA-256 指纹；
- 完整目标版本集合与 SHA-256 指纹；
- `complete: true`。

读模型会：

- 分流并精确聚合 intake/burned；
- 保留每个底层事实，供修改/删除后的重新查询和来源反查；
- 按 `effectiveFrom` 选择当日目标；
- 区分 `NO_EFFECTIVE_VERSION`、有效版本的 `UNSET` 和 `SET`；
- 让未来目标版本只改变版本集合证据，不倒灌历史目标；
- 完整重建并验真输出，拒绝计数、日期、事实、目标、指纹或 Left 篡改。

Left 输出固定为：

```text
{
  status: "POLICY_NOT_AUTHORIZED",
  exactKcal: null,
  policyId: null,
  policyVersion: null,
  roundingPolicy: "UNSPECIFIED"
}
```

这不是 F04 最终公式，而是对当前权威状态的精确表达。

## 当前自动化证据

19 项测试覆盖：

- 能量目标原值、kcal/kJ 精确换算、来源、用户编辑和生效日；
- 显式零目标与 unset 分离；
- 数字输入、符号/指数、未知单位、非法 instant、rule 半对和伪造换算拒绝；
- 指定日摄入/消耗精确聚合和来源 revision 反查；
- 空日与显式零、无有效目标与有效 unset 分离；
- 历史生效目标、未来版本不重写过去；
- 重复目标版本、同日多版本和重复事实拒绝；
- 输入顺序无关、完整快照和派生账本防篡改；
- Repository revision 变化后修改/删除事实重新计算；
- 查询预算不误变成全历史数据上限；
- 已知 target/intake/burned 时仍不计算 Left；
- 深冻结、不读系统时钟，无 AI、网络、HealthKit、原生、存储、写入和舍入能力。

## 明确不授权

本合同不授权或冻结：

- `Left` 的任何算式或 target/eaten/burned 的符号顺序；
- 缺失 burned 是否按零、未知或其他状态处理；
- Left 为负时是否保留、截断、警告或隐藏；
- 目标生成、默认目标、热量缺口、维持/减重模型或特殊人群适用性；
- 显示精度、舍入、阈值、颜色、文案或 UI；
- 目标或事实创建/修改/删除、Repository 实现、SQLite/SQLCipher schema 或迁移；
- AI、HealthKit、React Native/Expo/原生实现、正式工程、Gate 或 Owner intake 状态变化。

## 验证

```powershell
node --test tools/daily-energy-ledger-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
git diff --check
```

要生成 Left，必须先由 Owner 关闭 D-040 公式、目标缺失、负值、舍入与历史展示子题，再新增独立的版本化 `LeftPolicy` 合同和迁移/回放测试；不得在当前事实层里补一行常见算式来绕过门禁。
