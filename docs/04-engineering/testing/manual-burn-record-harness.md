# 手工消耗事实事务合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应能力：F13、REQ-F13、AT-F13；对应旅程：J-06
>
> 已接受边界：D-007（首版手工本地记录，HealthKit 二阶段另决）

## 1. 目的与结论

`tools/manual-burn-record-harness.mjs` 建模首版唯一已确定的消耗上游：用户直接录入一条能量事实，并可修改或删除。它不把运动类型、时长、步数或体重代入任何公式。

合同固定以下不变量：

- 原始 kcal/kJ 十进制字符串与单位保留，kJ 精确投影为 `125/523 kcal`；
- 日期与带显式 offset 的记录时间一致；不隐式读取设备时区；
- 创建、修改、删除使用 revision compare-and-swap；
- `commandId` 与不可变命令指纹绑定，提交后回执丢失时只重试同一命令；
- 回执同时包含完整记录集合和 F11 能量事实投影，二者必须与整个事务一致；
- F11 投影固定为 `BURNED / MANUAL_BURN / USER_ENTERED`，并携带原记录 ID 和 revision；
- 并发相同命令收敛为一次提交与一次回放，竞争修改只有一个 revision 可以成功。

## 2. 明确不包含

本合同没有运动类型、时长、距离、步数、心率、MET、体重输入或消耗计算器。用户输入的能量只是用户声明的事实，不能显示为测量值或算法估算。

同日可以存在多条独立记录；底层合同不自动合并、平均、撤销或选择默认运动。F11 负责只读聚合并保留每条来源。

## 3. 自动化证据

执行：

```powershell
node --test tools/manual-burn-record-harness.test.mjs
```

13 项测试覆盖 kcal/kJ 保真、日期/offset/未知字段、F11 来源投影、创建/修改/删除、revision CAS、提交前失败、提交后未知结果、幂等冲突、并发竞争、伪造 effect/receipt、不可变性，以及端到端进入 F11 七日消耗流且不暴露公式、步数、HealthKit、AI 或网络 API。

## 4. 尚未授权的内容

- 运动类型、时长、消耗估算公式与输入字段仍待 Owner 和公式审查。
- 步数、HealthKit、自动读取和来源去重属于 D-007 二阶段候选。
- 快捷值、撤销、异常阈值、单位展示精度与 UI 仍待设计/产品门禁。
- SQLite/SQLCipher repository、迁移、组件与真机证据必须在获授权工程阶段完成。
