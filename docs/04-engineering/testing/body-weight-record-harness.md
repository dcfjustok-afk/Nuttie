# 体重记录事务合同

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应能力：F10、REQ-F10、AT-F10；对应旅程：J-06
>
> 已接受边界：D-007（首版仅本地手工记录，HealthKit 后续再决定）

## 1. 目的与结论

`tools/body-weight-record-harness.mjs` 把体重创建、修改、删除和趋势重算建模为框架无关的本地事务合同。它证明 AT-F10 的确定部分可以在不猜测产品默认值的前提下实现：

- 保存用户输入的十进制字符串和原始 `KG` / `LB` 单位，单位切换或回读不能抹掉原始输入；
- kg 以十进制精确换算，lb 固定采用 `1 lb = 45359237 / 100000 g` 的有理数换算，不在存储合同内进行显示舍入；
- `localDate` 与带显式偏移的 `recordedAt` 必须一致；趋势按真实时刻和稳定 ID 排序；
- 同一天允许多条独立记录，不自动求平均、不覆盖、不合并；
- 创建、修改和删除在结算后都返回完整记录集合及当前趋势证据，修改/删除使用 revision compare-and-swap；
- `commandId` 与命令指纹绑定幂等写入，写入后回执丢失时只能重试同一不可变命令；
- 回执必须与命令前的完整基线和预期事务结果一致，不能只证明目标行存在而静默丢失其他记录。

该夹具不实现 React Native、SQLite/SQLCipher、HealthKit、图表 UI 或真实持久化，不是 G4 PASS、原生实现或发布证据。

## 2. 状态与事务语义

状态流为 `EDITING → REVIEW_READY → SAVING → SAVED`；校验失败保持 `EDITING`，明确未提交或未知提交进入 `SAVE_FAILED`。进入 `SAVING` 后重复点击不会产生第二个 effect。

Repository port 接受两种严格变体：

- `UPSERT`：新建要求 `expectedRevision = null`，修改要求命中当前 revision；成功后 revision 为 1 或加 1；
- `DELETE`：要求记录 ID 与当前 revision 同时匹配，成功后完整趋势立即重算。

测试内存仓库串行化并发命令，并保留与原命令绑定的事务后快照。相同命令回放返回原提交证据；另一个 payload 复用同一 `commandId` 会被拒绝。

## 3. 输入、日期与趋势边界

- 体重值必须是大于零的无符号十进制字符串；上限仅是防止资源滥用的位数预算，不是医学或产品阈值。
- 时间必须是合法 ISO 时间且显式包含 `Z` 或 UTC offset；不存在隐式设备时区推导。
- `localDate` 表示记录发生时写入的本地日历日，必须等于 `recordedAt` 字符串中的日期部分。
- 当前体重只是按时刻排序后的最后一条事实记录，不代表“今日值”、目标达成、健康判断或异常检测。

## 4. 自动化证据

执行：

```powershell
node --test tools/body-weight-record-harness.test.mjs
```

18 项测试覆盖精确 kg/lb 换算、非法日期和偏移、同日多记录、创建/修改/删除、revision CAS、重复点击、提交前失败、提交后未知结果、幂等冲突、并发竞争、伪造/不完整事务回执与反序列化状态、严格 outcome/错误码、输入与快照不可变性，以及禁止暴露网络、HealthKit、BMI、目标、异常、舍入和按日去重 API。

## 5. 尚未授权的内容

- AT-F10 中显示精度、极端值提示和 kg/lb 切换交互仍待 Owner；本合同只保存原始输入和精确换算事实。
- BMI、目标体重、热量/宏量公式和特殊人群规则属于 D-040 等未决范围，不进入本合同。
- 同日多条记录如何在 UI 中聚合或强调尚未决定；底层事实不得先行合并。
- HealthKit 读取/写入、权限、去重与来源优先级不在首版授权内。
- SQLite schema、迁移、索引、SQLCipher 接入和 iOS 真机证据必须在后续获授权工程阶段完成。
