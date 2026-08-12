# 宏量目标版本事实与历史读取合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/macro-target-history-harness.mjs` 与 `tools/macro-target-history-harness.test.mjs`

> 对应能力：F05、REQ-F05、AT-F05；复用既有每日营养事实读模型，但不授权任何目标算法。

## 目的

这个 harness 只实现 F05 在 D-040 仍为 `PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED` 时可以安全落地的事实边界：读取调用方已提供的蛋白质、碳水、脂肪目标版本，按明确的本地生效日重建历史，再与同一天的实际营养事实并列输出。

它不会计算“应该是多少”，不会把比例换成克数，也不会判断达标、超标或剩余。实际事实固定以既有营养合同的克数和缺失语义输出；目标值的单位定义是调用方提供的 opaque、版本化事实。二者是否可比较仍明确为 `UNSPECIFIED`，不能由本合同推断。

## 目标版本事实

`MACRO_TARGET_VERSION_V1` 必须包含：

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
  targets: {
    protein,
    carbohydrate,
    fat
  }
}
```

三个目标各自只能是：

- `{ status: "UNSET" }`：没有目标事实；
- `{ status: "SET", inputValue, unitDefinition }`：保留调用方原始无符号十进制字符串和 `MACRO_TARGET_UNIT_DEFINITION_V1`；合同只派生精确有理数 `exactValue`，不解释单位 payload。

显式零是一个已设置事实，与 `UNSET` 不同。`unitDefinitionId + unitDefinitionVersion + payload` 全部进入版本指纹；它们不是产品默认单位，也不证明该值可与实际克数比较。

来源必须携带稳定的 kind、ID、版本和 `userEdited`。可选 rule ID/version 必须同时存在或同时为空；本合同保留而不解释这些标识。`generatedAt` 必须带明确时区偏移，`effectiveFrom` 必须是真实公历日期。

## 历史与联合读模型

`buildMacroTargetHistory`：

- 按 `effectiveFrom` 排序并在每个生效日切分历史区间；
- 首个版本之前输出 `NO_EFFECTIVE_VERSION`，不补默认目标；
- 全部 unset、部分 set、全部 set 分别输出 `NO_TARGETS_SET`、`PARTIALLY_SET`、`ALL_TARGETS_SET`；
- 拒绝重复 version ID 和同日多个生效版本；
- 拒绝相同单位定义 ID+版本在历史中对应不同 payload；
- 新增未来版本不会重写更早日期的 effective segment；
- 返回完整版本集合 SHA-256 指纹，并可重建验真全部派生证据。

`buildMacroActualTargetView` 在指定本地日期复用每日营养汇总，只并列输出：

- 实际 P/C/F 的 `COMPLETE / PARTIAL / MISSING`、克数和来源质量计数；
- 当日生效的完整目标版本或明确无版本；
- `comparisonPolicy: "UNSPECIFIED"`；
- `roundingPolicy: "UNSPECIFIED"`。

因此缺失实际值不会变成零，缺失目标不会被制造，历史目标也不会随当前版本倒灌。

## 当前自动化证据

18 项测试覆盖：

- 原始十进制、精确有理数、opaque 版本化单位定义和来源保真；
- 显式零与 unset、全部 unset 与部分 set 分离；
- 未知字段、伪造派生值、不安全/过大 payload、版本数和日期范围预算拒绝；
- 显式来源、成对 rule 标识、带偏移 instant 和公历日期验证；
- 首版本前空段、生效日精确切段、未来版本不改写过去；
- 输入顺序无关、版本/区间/计数/指纹篡改拒绝；
- 实际 P/C/F 完整、部分和缺失语义保留；
- 深冻结、不读取系统时钟，无网络、原生、存储和写入能力；
- 静态护栏拒绝目标公式、百分比换算、实际舍入调用和达成比较。

## 明确不授权

本合同不授权或冻结：

- 热量或 P/C/F 目标公式、默认值、推荐范围、适用人群或健康建议；
- grams / percent 模式、百分比到克数换算、4/4/9 或其他能量换算；
- 实际与目标的单位兼容性、剩余、达成、超标、颜色或文案；
- 显示精度、舍入、阈值、排序或 UI 交互；
- 创建、编辑、删除、默认目标、Repository、SQLite/SQLCipher schema 或迁移；
- React Native/Expo/原生实现、正式工程、Gate 或 Owner intake 状态变化。

## 验证

```powershell
node --test tools/macro-target-history-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
git diff --check
```

若未来要实现目标生成、编辑、比例换算或达成展示，必须先完成 D-040 的公式/字段/适用范围与 Owner 门禁，再新增独立的版本化策略、事务和 UI 合同；不得扩写本读取层来绕过授权。
