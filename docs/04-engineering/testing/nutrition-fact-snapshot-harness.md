# Nutrition Fact Snapshot V2 Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/nutrition-fact-snapshot-harness.mjs` 与 `tools/nutrition-fact-snapshot-harness.test.mjs`

## 目的

这个共享合同防止食品目录中的可追溯营养事实在进入餐食草稿、幂等命令或 Repository 时退化成七个数字。`NUTRITION_FACT_SNAPSHOT_V2` 在保留 `values` 供现有聚合使用的同时，完整携带 fact 状态、原值/原单位/原文、标准单位、来源类型、原始基准、当前基准和 pack provenance。

## 不变量

- 上游包与用户食品使用不同状态白名单，用户不能自称测量值或来源直接报告值。
- `kcal/kJ/g/mg` 按营养素维度验证；标准值必须等于原值的已知单位换算结果。
- `MISSING`、上游 `TRACE`、用户 `USER_ENTERED_TRACE`、`ESTIMATED` 和数值 `0` 保持不同语义。
- trace 原文原样保存，只使用独立规范化副本做窄格式验证。
- `basis` 与 `originalBasis` 必须显式；当前不授权任何基准转换。
- pack 快照绑定 source record、pack/version、active ref、内容 hash、license、NOTICE hash 和 transform version；用户快照对应字段必须为 `null`。
- 从持久化 plain data 重新规范化时会重算所有派生字段，任何 `values`、状态集合、标准单位或 transform 绑定漂移都会失败关闭。

手工餐食合同兼容原有基础快照和 V2。V2 会在检查、保存命令、Repository 回读和幂等 fingerprint 中完整保留，不再把 `TRACE` 降为 `MISSING` 或丢失 `ESTIMATED`、原值、basis 与 provenance。

## 明确不授权

本合同不批准不同基准之间的换算、份量重量推导、舍入 profile、更多单位、微量营养字段、真实数据库 schema 或数据包转换算法。正式转换需要独立版本、测试 corpus 与 Owner/数据审查门禁。

## 验证

```powershell
node --test tools/nutrition-fact-snapshot-harness.test.mjs
node --test tools/local-food-catalog-harness.test.mjs tools/manual-meal-entry-harness.test.mjs
```
