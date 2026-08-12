# Meal Correction Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

计划路径：`tools/meal-correction-harness.mjs` 与 `tools/meal-correction-harness.test.mjs`

## 目的与追踪

这个 harness 把 J-05“修改、移动或删除食物记录”中可在 Windows 上验证的 Application / Repository 合同变成纯状态模型。它只覆盖单条记录纠错，并复用每日营养汇总和营养事实快照 V2 合同；不创建正式 React Native 页面、SQLite schema、ORM adapter 或生产 Repository。

权威追踪为 `F06/F07 -> REQ-F06/REQ-F07 -> AT-F06/AT-F07 -> J-05`，并用 `AT-F04` 验证修改或删除后的本地汇总重算、用 `AT-F09` 与 `NFR-DATA-01` 验证营养快照来源和缺失语义不退化。完整 CRUD 是 Nuttie 本地闭环，不得写成公开资料已确认的竞品事实。

## 记录与纠错命令

Harness 使用以下最小记录：

```text
MealRecord {
  id: string,
  revision: positive integer,
  localDate: YYYY-MM-DD,
  mealSlotId: opaque string | null,
  nutrition: BasicNutritionSnapshot | NUTRITION_FACT_SNAPSHOT_V2
}
```

`mealSlotId` 必须由调用方显式提供或明确为 `null`；合同不创建“早餐”等默认值，也不冻结默认或自定义餐次规则。`revision` 是单条记录的乐观并发版本，新成功的 `EDIT` 或 `MOVE` 精确递增 1；`DELETE` 后没有 resulting revision。

纠错草稿是严格判别联合：

```text
EDIT   { kind: "EDIT", nutrition: complete normalized snapshot }
MOVE   { kind: "MOVE", targetLocalDate, targetMealSlotId }
DELETE { kind: "DELETE" }
```

- `EDIT` 以一份完整、已验证的快照替换原营养快照，不接受部分字段 patch，也不改变日期、餐次或记录 ID。
- 原记录是 V2 时，`EDIT` 后仍必须是 V2；用户修正 pack 数据形成 `USER / USER_CONFIRMED` V2，不得继续冒充 `TW_FDA` 或 `USDA_*` 来源。
- `MOVE` 支持同日换餐次和跨日期移动；记录 ID 与完整营养快照必须保持深等。
- `DELETE` 不接受其他载荷字段。
- EDIT 前后完全相同，或 MOVE 的日期和餐次都未变化，返回稳定的 `NO_CHANGES`，不产生 effect。

命令必须完整携带乐观并发前置条件：

```text
MealCorrectionCommand {
  commandId,
  entryId,
  expectedRevision,
  expected: { localDate, mealSlotId, nutrition },
  change: EDIT | MOVE | DELETE
}
```

除 revision CAS 外，Repository 还必须把当前记录与 `expected` 深等比较。同 revision 但内容不一致是 `REVISION_INTEGRITY_CONFLICT`，不能继续猜测或覆盖。

## Application API 与预览

计划导出的框架无关 API：

```text
createMealCorrectionState({ context })
setMealCorrectionDraft(state, change)
reviewMealCorrection(state, { dayViews })
requestMealCorrectionSave(state, { commandId })
retryMealCorrectionSave(state)
restoreMealCorrectionState(serializedState)
executeMealCorrection(repository, effect)
settleMealCorrection(state, outcome)
```

初始 `context` 必须包含权威 `entry` 和来源日期的记录视图；跨日 MOVE 还必须提供目标日期视图。每个 day view 只包含该日期的唯一记录 ID，来源日期必须包含与 baseline 深等的唯一目标记录。缺失、错日期、重复 ID 或被改写的 baseline 均失败关闭。

review 不写 Repository，而是生成：

```text
preview {
  kind,
  afterEntry: MealRecord | null,
  affectedDays: [
    { localDate, beforeSummary, afterSummary }
  ]
}
```

受影响日期去重并按日期稳定排序：EDIT、DELETE 和同日 MOVE 只有来源日期；跨日 MOVE 精确包含来源和目标两个日期。`beforeSummary` 与 `afterSummary` 都由规范记录重新调用 `dailyNutritionSummary` 计算，不接受调用方传入的汇总数字。

## 状态机

| 当前状态 | 操作 | 下一状态 | 约束 |
| --- | --- | --- | --- |
| `EDITING` | 编辑纠错草稿 | `EDITING` | 清除旧校验、预览与 effect 上下文 |
| `EDITING` | review 有效草稿 | `REVIEW_READY` | 生成受影响日期的 before/after 预览 |
| `EDITING` | review 无效草稿 | `EDITING` | 保留草稿和稳定错误码；不产生 effect |
| `REVIEW_READY` | 再编辑 | `EDITING` | 旧预览必须失效 |
| `REVIEW_READY` | 请求保存 | `SAVING` | 调用方显式提供 `commandId`；先改变状态再执行 effect |
| `SAVING` | 重复请求保存 | `SAVING` | 不产生第二个 effect |
| `SAVING` | 提交或幂等重放成功 | `SAVED` | 核对 receipt、最终记录与全部受影响日期 |
| `SAVING` | 失败 | `SAVE_FAILED` | 保留冻结命令、attempt 与 fingerprint；不乐观修改汇总 |
| `SAVE_FAILED / NOT_COMMITTED / retryable` | 重试 | `SAVING` | 复用原命令与 fingerprint，attempt 递增 |
| `SAVE_FAILED / NOT_COMMITTED` | 重新编辑 | `EDITING` | 清除旧命令；后续仍由 revision CAS 防止覆盖并发修改 |
| `SAVE_FAILED / UNKNOWN` | 重试 | `SAVING` | 始终允许用原命令对账；下游不得将其锁死 |
| `SAVE_FAILED / UNKNOWN` | 编辑或换命令 | 拒绝 | 提交结果未明时禁止制造第二个纠错命令 |
| `SAVED` | 编辑、保存、重试或迟到回调 | 拒绝 | `SAVED` 是当前状态机终态 |

状态只保存 primitive、array 和 plain record。草稿、baseline、命令、预览、outcome 和 Repository 返回值必须先经过字段 allowlist、复制并递归冻结；拒绝 `Date`、`Map`、`Set`、class instance、循环、非有限数和危险 key。

## Effect、fingerprint 与 outcome

```text
MealCorrectionEffect {
  type: "APPLY_MEAL_CORRECTION",
  command: MealCorrectionCommand,
  attempt: positive integer,
  fingerprint: canonical command fingerprint
}
```

fingerprint 必须使用稳定 canonical serialization 覆盖命令全部字段，不能依赖调用方对象的插入顺序。V2 fingerprint 必须覆盖 schema、来源、basis、完整 provenance、七项 facts 的状态/原值/原单位/原文/标准单位/transform version、派生 values，以及 missing/trace/estimated 字段集合。

每个 outcome 同时携带 `commandId`、`fingerprint` 和 `attempt`。settle 必须三者都与当前 pending 状态一致；新 attempt 开始后，旧 attempt 的迟到结果不能覆盖状态。

```text
SUCCESS {
  status: "SUCCESS",
  commandId, fingerprint, attempt,
  receipt,
  committedBeforeDays,
  committedDays,
  error: null
}

FAILURE {
  status: "FAILURE",
  commandId, fingerprint, attempt,
  receipt: null,
  committedBeforeDays: null,
  committedDays: null,
  error: { outcome: "NOT_COMMITTED" | "UNKNOWN", code, retryable }
}
```

只有 Repository 明确保证发生在 commit 前的失败才能成为 `NOT_COMMITTED`；未知异常默认 `UNKNOWN`。一旦获得有效 commit receipt，后续最终日期视图读取、V2 规范化或汇总校验失败都必须升级为 `UNKNOWN`。`UNKNOWN` 强制可用原命令重试，即使下游声称 `retryable:false`。

## Repository Port 与事务语义

```text
applyMealCorrection(command)
  -> Promise<{
       receipt,
       committed: { beforeDays, affectedDays }
     }>
```

receipt 的最小结构：

```text
MealCorrectionReceipt {
  commandId,
  fingerprint,
  disposition: "COMMITTED" | "REPLAYED",
  kind: "EDIT" | "MOVE" | "DELETE",
  entryId,
  previousRevision,
  resultingRevision: integer | null
}
```

Repository 必须遵守以下顺序和语义：

1. 先查 idempotency，再检查记录与 revision。相同 `commandId + fingerprint` 返回原结果的 `REPLAYED`；相同 commandId、不同 fingerprint 返回 `IDEMPOTENCY_CONFLICT / NOT_COMMITTED / retryable:false`。
2. 新命令才检查记录存在、`expectedRevision` 和完整 `expected`：分别失败为 `MEAL_NOT_FOUND`、`REVISION_CONFLICT` 或 `REVISION_INTEGRITY_CONFLICT`，且记录、日期视图和幂等集合均不改变。
3. 一个逻辑事务同时提交记录变化、幂等结果，以及 transaction-bound `beforeDays + affectedDays` 双快照。EDIT 原位替换完整 nutrition 并 revision+1；MOVE 从源视图移除、向目标视图写入同 ID/同 nutrition 且 revision+1；DELETE 移除并将 resultingRevision 设为 null。
4. 跨日 MOVE 绝不能只删除源记录或只写入目标记录；两侧日期与幂等结果必须同成同败。
5. commit 前失败返回 `NOT_COMMITTED`，所有集合保持原样。commit 后响应丢失返回 `UNKNOWN`；原命令重试必须先命中幂等结果并以 `REPLAYED` 收敛。
6. `beforeDays` 和 `affectedDays` 必须按日期稳定排序并精确覆盖受影响日期；每个日期正确、记录 ID 在两侧均全局唯一。Application 从事务前快照应用唯一目标 delta，要求结果与事务后快照深等，从而允许事务开始前已经存在的合法并发变化，同时证明本事务没有误删或篡改其他餐食。
7. Application 重新规范化记录并计算 summary，不直接信任 Repository 提供的聚合值。成功结算必须证明：EDIT 后位置不变且 nutrition/revision 精确；MOVE 后源位置不存在、目标位置存在且 nutrition 深等；DELETE 后所有受影响日期均不存在该 ID。多余/缺失/逆序日期、重复 ID、其他餐食漂移、快照改写或错误 revision 一律不得进入 `SAVED`。

内存 Repository 只能证明单进程 fake 的合同。它不代表 SQLite 事务、WAL、进程终止、跨线程竞争或 SQLCipher adapter 已实现。

## V2 保真与持久化信任

`NUTRITION_FACT_SNAPSHOT_V2` 在 baseline、draft、command、fingerprint、Repository 结果和 committed entry 中都必须完整保留。每次跨边界都重新计算并核对派生字段，不能把 `TRACE` 当作普通 `MISSING`，也不能丢失 `ESTIMATED`、数值零、原值/原单位、basis 或 provenance。

共享 V2 harness 已把可信 catalog 签发入口与持久化 plain snapshot 复核入口分开：pack 快照只有在 catalog 签发或由显式 trust context 的完整内容指纹绑定时才能跨 clone、Repository roundtrip 与进程重启恢复；任意调用方仍不能自行伪造 pack 信任。状态恢复会重新验证状态判别联合、草稿、预览、冻结命令、fingerprint 和事务证据，不把序列化对象直接视为可信运行态。

## 验收测试清单

### 草稿、预览与状态

- 初始状态不生成日期、餐次、命令、目标或默认营养；非法 plain-data 边界失败。
- EDIT 有效预览、完全相同拒绝、不得改变 placement；V2 不得降级。
- 同日 MOVE、跨日 MOVE 和无变化 MOVE；跨日预览精确生成两侧 before/after 汇总。
- DELETE 产生 `afterEntry:null`；来源记录或目标 day view 缺失、错日期、重复 ID、baseline 不一致均失败。
- review 后编辑使旧预览失效；`SAVING` 可观察；重复点击只产生一个 effect；`SAVED` 保护终态。

### 成功后置条件

- EDIT 保持 ID/日期/餐次，revision+1，并用完整新快照重算当日汇总。
- 同日 MOVE 只返回一个受影响日期；跨日 MOVE 原子更新两侧日期和两侧汇总。
- DELETE 移除目标记录、重算来源日期，且不改变其他记录。
- Repository 返回多余或缺失 affected day、错误 revision、重复 ID、错日期、被改写的 nutrition 或缺少目标记录时，不能结算成功。

### 幂等、并发与故障

- 同命令同 payload 收敛为 `REPLAYED`；同 commandId 不同 payload 返回 `IDEMPOTENCY_CONFLICT` 且零变化。
- 陈旧 expectedRevision 和同 revision/异内容分别返回稳定冲突码且零变化。
- 两个不同命令竞争同一 revision 只有一个提交；同命令并发收敛为一次 COMMITTED 和一次 REPLAYED。
- commit 前故障保持记录、两侧日期和幂等表不变；commit 后响应丢失进入 UNKNOWN，再用原命令重放收敛。
- UNKNOWN 禁止编辑或换命令；有效 receipt 后的结果读取/校验失败仍为 UNKNOWN。
- 伪造 commandId/fingerprint/attempt/receipt 被拒绝，旧 attempt 的迟到回调不能覆盖新状态。

### V2 与不可变性

- 来源矩阵分别覆盖关键路径：USER V2 的 EDIT/commit；TW_FDA 的 clone/load/MOVE/commit/replay 与 pack-to-user EDIT/commit/replay；USDA Foundation 的 ESTIMATED MOVE/commit/replay；USDA SR Legacy 的进程状态序列化恢复/DELETE/commit/replay。
- `TRACE`、`ESTIMATED`、`MISSING` 和数值 `0` 保持不同；任意 provenance、basis、facts 或派生字段篡改失败关闭。
- pack 快照 MOVE 前后深等；用户修正不得继续使用 pack sourceKind；调用方事后修改原对象不能污染状态、命令或 fingerprint。

## 明确不授权

本 harness 不改变 D-039、D-040，也不冻结 D-018、D-019、D-020、D-021、D-023、D-024、D-025、D-032 或 D-037。它明确不授权：

- React Native 页面、路由、导航、toast、乐观 UI、保存后落点或自动重试节奏；
- SQLite/SQLCipher/Drizzle schema、migration、生产事务或真机证据；
- 默认/自定义餐次规则，以及早餐、午餐、晚餐、零食的存储枚举；
- 名称、份量、单位、basis 换算或舍入；本合同中的 EDIT 只替换完整营养快照；
- 补记、未来日期或跨时区产品规则；这里只验证调用方显式提供的 canonical localDate；
- 复制、批量操作、最近、收藏、搜索、撤销窗口、软删除或修订历史 UI；
- 目标、`Left`、宏量比例、健康评分、建议、AI 或 HealthKit。

Windows 上的纯合同通过不能替代正式 Repository 的 SQLite 事务竞争、进程 kill/restart、Mac、真实 iPhone 或 Release 证据。
