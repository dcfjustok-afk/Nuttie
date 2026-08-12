# Date Navigation Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/date-navigation-harness.mjs` 与 `tools/date-navigation-harness.test.mjs`

> 对应能力：F08、REQ-F08、AT-F08；对应旅程：J-02

## 目的

这个 harness 把 F08 中不依赖未决产品规则的部分变成框架无关合同：调用方显式观察某一 instant 在某个 IANA 时区、某版时区规则和 Gregorian 日历下对应的“今天”，状态据此判定当前选择日期是 `PAST / TODAY / FUTURE`；用户请求切换日期时，只有与该请求完整绑定的外部版本化策略决定为 `ALLOW`，选择才会改变。

合同不读取系统当前时间，不创建计时器，也不自行决定未来日、补记、跨时区重基或默认回到今天。这样可以先证明日期事实、DST、状态更新和防回放语义，同时继续把产品规则留在 Owner 门禁内。

## 日期观察

`DATE_OBSERVATION_V1` 必须由调用方完整提供：

```text
{
  generation,
  observedAt,           // 带显式 UTC offset 的 ISO instant
  timeZoneId,           // IANA time-zone ID
  timeZoneRulesVersion, // 调用方记录的规则版本
  calendarId: "gregory",
  todayLocalDate
}
```

合同会使用运行时 IANA 时区规则复核 `observedAt` 的本地墙钟、offset 和 `todayLocalDate`。春季 DST gap 中不存在的墙钟组合会被拒绝；秋季 overlap 的两个相同墙钟必须以各自正确 offset 区分。`timeZoneRulesVersion` 被保留并进入观察指纹，但 harness 不宣称验证该字符串对应哪个真实 tzdb 包；正式实现必须由平台适配器提供可信规则来源。

观察使用单调 `generation` 防止旧上下文回滚：

- 更小 generation：`STALE_DATE_OBSERVATION`；
- 同 generation、相同内容：幂等 `UNCHANGED`；
- 同 generation、不同内容：`DATE_OBSERVATION_GENERATION_CONFLICT`；
- 更大 generation：更新观察并重新计算 `PAST / TODAY / FUTURE`，但保留用户已选择的日期。

因此午夜滚日或设备时区变化不会擅自把查看页跳回今天，也不会静默把原日期重新解释成另一个日期。是否需要提示、回到今天或重基历史记录仍是外部产品策略。

## 导航请求与外部策略

`DATE_NAVIGATION_REQUEST_V1` 绑定以下事实：

- `requestId`；
- 当前 `fromLocalDate`；
- `targetLocalDate`；
- 当前 observation generation 与完整 observation fingerprint；
- 完整 request fingerprint。

外部策略返回 `DATE_NAVIGATION_POLICY_DECISION_V1`，必须包含 `policyId`、`policyVersion`、`ALLOW / DENY`、稳定 `reasonCode`，并绑定原请求指纹。执行时再次核对当前选择和观察；午夜滚日、时区变化或另一笔导航导致状态变化后，旧请求均以 `STALE_DATE_NAVIGATION_REQUEST` 失败，不可回放覆盖新状态。

Harness 故意允许外部策略对过去、今天或未来日期分别返回 `ALLOW` 或 `DENY`。这证明合同里没有偷偷写入“未来日一定禁用”“历史日一定可补记”等 Owner 尚未批准的规则。

## 当前自动化证据

19 项测试覆盖：

- 严格日期、显式 offset、IANA 时区、Gregorian 日历与观察指纹；
- 上海时区、洛杉矶 DST gap/overlap、午夜滚日、闰日、月/年边界；
- `PAST / TODAY / FUTURE` 只作为事实关系，不作为授权；
- 时区变化与规则版本进入 generation/fingerprint，选择日期保持不变；
- 同 generation 幂等回放、冲突和旧 generation 拒绝；
- 请求与当前选择/观察绑定，旧选择和旧观察请求拒绝；
- 外部 `ALLOW` 应用、外部 `DENY` 保持原状态、决策错绑拒绝；
- 返回值深冻结，系统时钟、网络、React Native、Expo、存储和原生 API 均未使用。

## 明确不授权

本合同不授权或冻结：

- 未来日期是否可达、历史补记窗口、历史编辑期限；
- 跨时区后是否重基记录、采用创建时区还是当前时区；
- 默认选中今天、午夜自动跳转、周起始日、周历范围；
- 日历 UI、动画、手势、日期格式、文案或无障碍实现；
- SQLite/SQLCipher schema、Repository、迁移或持久化；
- React Native/Expo/原生日历 API、后台定时器或通知；
- D-018~D-025、D-032、D-037，或 D-039/D-040 的 Owner/正式实现门禁。

## 验证

```powershell
node --test tools/date-navigation-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
git diff --check
```

这些结果只构成 F08 的框架无关合同证据。正式工程仍需在门禁满足后补齐批准后的产品策略、组件/E2E、持久化集成以及 Mac/真实 iPhone 的时区与日历验证。
