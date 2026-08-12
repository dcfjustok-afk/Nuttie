# Manual Meal Entry Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/manual-meal-entry-harness.mjs` 与 `tools/manual-meal-entry-harness.test.mjs`

## 目的

这个 harness 把“检查并保存一条手工餐食”的 Application 合同变成可执行证据。它复用现有 `dailyNutritionSummary`，但不创建正式 React Native 页面、状态管理模块、SQLite schema、ORM adapter 或生产 Repository。

合同只接收调用方显式提供的 `entryId`、`commandId`、`localDate` 与七项营养快照。它兼容明确无版本的基础数字快照与 `NUTRITION_FACT_SNAPSHOT_V2`，未知版本失败关闭；V2 的 fact 状态、原值/原单位、basis 和 provenance 会完整进入草稿、命令与 Repository 回读，幂等 fingerprint 也覆盖完整快照。pack V2 在 Repository plain-data 往返时必须注入由已验证 catalog 快照建立的 trust context。它不读取当前时钟、不生成标识，也不推导默认餐次、营养目标、`Left`、宏量比例、健康评分或建议。

## 状态合同

| 当前状态 | 操作 | 下一状态 | 约束 |
| --- | --- | --- | --- |
| `EDITING` | 检查有效草稿 | `REVIEW_READY` | 通过 `dailyNutritionSummary` 生成单条预览 |
| `EDITING` | 检查无效草稿 | `EDITING` | 保留草稿与稳定错误码，不产生保存 effect |
| `REVIEW_READY` | 编辑草稿 | `EDITING` | 旧预览、命令和保存错误全部失效 |
| `REVIEW_READY` | 请求保存 | `SAVING` | 调用方必须提供 `commandId`，状态先变化，再执行 effect |
| `SAVING` | 再次请求保存 | `SAVING` | 不产生第二个 effect |
| `SAVING` | 提交或幂等重放成功 | `SAVED` | 查询当日规范记录并复用 `dailyNutritionSummary` |
| `SAVING` | 保存失败 | `SAVE_FAILED` | 保留冻结命令、草稿和 `commandId`，不做乐观汇总 |
| `SAVE_FAILED / retryable` | 重试 | `SAVING` | 重用原 `commandId`、fingerprint 和 payload，并递增 attempt |
| `SAVE_FAILED / non-retryable` | 重试 | 拒绝 | 幂等冲突和重复记录必须先由调用方处理 |
| `SAVE_FAILED / NOT_COMMITTED` | 编辑 | `EDITING` | 清除旧命令，允许形成新草稿 |
| `SAVE_FAILED / UNKNOWN` | 编辑 | 拒绝 | 必须先用原命令重试或对账，防止重复记录 |
| `SAVED` | 编辑、保存或迟到回调 | 拒绝 | `SAVED` 是当前状态机的终态 |

状态只保存由 primitive、array 和 plain record 组成的可序列化值，不保存 `Map`、`Set`、`Date`、raw `Error`、stack、Repository 对象或 UI 实例。草稿、命令、结果和 Repository 返回值会先经过字段 allowlist，再被复制并冻结，调用方后续修改不能重写已建立的状态。V2 的派生 `values`、状态集合和 provenance 会在每次进入合同边界时重新核对，不能只改写派生字段。

每个保存 effect 同时携带 `commandId`、canonical payload fingerprint 和单调递增的 attempt。结算必须三者都匹配当前 pending 状态；retry 开始后，旧 attempt 的迟到结果不能覆盖新状态。

## Repository Port

```text
saveManualMeal(command)
  -> Promise<{ commandId, disposition, entryId, localDate }>

listMealsByLocalDate(localDate)
  -> Promise<Array<{ id, localDate, nutrition }>>
```

`disposition` 只能为 `COMMITTED` 或 `REPLAYED`。port 的语义要求如下：

- 新 `commandId` 在一个逻辑事务中同时保存餐食和幂等结果。
- 同 `commandId` 与相同 payload 返回 `REPLAYED`，不得新增第二条餐食。
- 同 `commandId` 与不同 payload 返回 `IDEMPOTENCY_CONFLICT`，两类集合都不改变。
- 新 `commandId` 与既有 `entryId` 返回 `DUPLICATE_MEAL_ID`，两类集合都不改变。
- 提交前失败返回 `NOT_COMMITTED`，餐食和幂等结果均不写入。
- commit 后、结果送达前失败返回 `UNKNOWN`；两类集合可能已经完整提交，但绝不能只存在一类。调用方必须用同一命令重试，由 `REPLAYED` 收敛。
- 有效提交回执到达后，查询或汇总阶段的任何失败都强制归类为 `UNKNOWN`；即使下游错误自称 `NOT_COMMITTED`，也不能开放编辑。
- `UNKNOWN` 必须始终允许同一命令继续对账重放；下游的 `retryable:false` 不能把状态机锁在既不可编辑又不可对账的死路。
- 当日查询必须只返回请求日期的唯一记录；错日期、重复 ID、非法营养、快照被改写或缺少刚保存记录时，Application 不进入 `SAVED`。

这里保证的是“要么完整未提交，要么完整已提交”，不是“调用方看到失败时数据库一定零写入”。`UNKNOWN` 正是对 commit 后响应丢失的诚实建模。

## 内存证据

`createInMemoryManualMealRepository` 只是测试 fake。它提供同一 `commandId` 幂等表、餐食集合、提交前故障和提交后响应丢失的注入点，以证明上述语义；它不决定 D-020、SQLite 表、索引、事务 API 或 ORM。

当前 24 项测试覆盖：初始无默认值、有效/无效检查、未知版本拒绝、V2 fact-only 幂等冲突、预览失效、可观察 `SAVING`、重复点击抑制、完整提交、既有记录聚合、缺失值保留、提交前零写入、提交后未知结果重放、幂等冲突、重复 `entryId`、attempt 迟到回调、伪造结算、Repository 内部一致性、canonical 字段 allowlist、plain-data 边界、深拷贝冻结与终态保护。catalog 测试另覆盖 pack V2 的 commit、settle 与 replay。

两个 `Promise.all` 用例只证明当前单进程 fake 会把“同命令并发”收敛为 `COMMITTED + REPLAYED`，并把“不同命令争用同一 entry”收敛为一次提交和一次拒绝。它们不证明真实 SQLite adapter 的进程/线程并发；正式实现仍需 barrier、事务竞争和进程终止集成测试。

`listMealsByLocalDate` 的数组在这个窄合同中被视为 Repository 的权威当日结果。Application 可以发现错日期、重复 ID、缺少刚保存记录和快照改写，但仅凭返回数组无法证明 Repository 没有遗漏更早的当日记录。正式 adapter 必须通过事务一致查询、当日 revision/count 或集成测试补足完整性证据，当前 harness 不宣称已经解决该问题。

## 明确不授权

本 harness 不改变 D-039、D-040，也不冻结 D-018、D-019、D-020、D-021、D-023、D-024、D-025、D-032 或 D-037。以下内容仍是候选或输入缺口：添加餐食首层方式、默认/自定义餐次、最近与收藏、份量单位与舍入、高级编辑/删除/恢复、补记与跨时区产品规则、目标公式、评分阈值、保存后导航、toast、撤销和自动重试。

## 验证

```powershell
node --test tools/manual-meal-entry-harness.test.mjs
node --test tools/domain-contract-harness.test.mjs tools/domain-fixture-corpus.test.mjs
node project-ops/validate.mjs
git diff --check
```

`createManualMealEntryState`、`reviewManualMeal`、`requestManualMealSave`、Repository fake 与执行器均显式接收同一个 catalog trust context。测试先对 pack V2 做 `structuredClone` 模拟数据库回读/进程重启，再覆盖 review、commit、settle 与 replay，避免只依赖同进程对象身份。

这些命令只证明框架无关合同。正式 Repository 必须在 Owner 门禁满足、工程初始化和 D-020 选型完成后，用 SQLite/SQLCipher 事务、进程终止恢复和真机测试重新提供证据。
