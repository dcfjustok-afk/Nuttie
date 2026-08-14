# D-039 路由、可观测性与返回契约

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D039-ROUTE-OBSERVABILITY-CONTRACT-001` |
| 决定 | `D-039 / ACCEPTED / A` |
| 设计基线 | `PX-4_BASELINE_FROZEN` |
| 参数 schema | `D039RouteParamsV1` |
| 返回描述符 | `D039ReturnDescriptorV1` |
| 规格状态 | `SPEC_COMPLETE / IMPLEMENTATION_NOT_AUTHORIZED` |
| 关闭阻断 | `D039-PX5-B02` |
| 仍开放 | `D039-PX5-B03` 至 `D039-PX5-B07` |

## 1. 范围与安全边界

本契约把 D-039 的稳定设计 ID 映射为未来正式实现必须遵守的逻辑 route、运行时参数、`testID`、返回焦点和非法 deep-link 行为。它不创建 `app/`、React Native 页面、Expo Router 配置或原生工程，也不授权实现。

约束如下：

- D-018 已接受 Expo Router，但 beta typed routes 保持关闭；生成的 TypeScript 类型不能替代运行时校验。
- D-039 外部 deep link 为 `NOT_SUPPORTED`。所有自定义 scheme、universal link、冷启动 URL 和外部前后台 URL 都按不可信输入处理。
- 日期、餐次、搜索词、GTIN、食品 ID、图片、AI 文本、Provider、营养值和草稿内容均不得进入 URL、route 名、`testID`、错误日志或持久化导航状态。
- route 参数只携带不含业务语义的进程内短生命周期令牌；进程终止、登出、显式退出添加流程或上下文失效时立即不可解析。
- 任何参数、状态或依赖未知时先恢复到安全页面；恢复动作的业务写入、网络、权限请求和 AI 请求必须全部为 0。

## 2. 稳定 route 映射

URL path 是未来 Expo Router 的稳定 Router path；route group 和物理文件目录可在不改变这些 path 与 route ID 的前提下由正式工程决定。path 可被系统看到不代表它接受外部 deep link，第 6 节的入口来源门禁始终先于参数解析。

| Route ID | 稳定 path | 对应设计 ID | 允许参数 | 说明 |
| --- | --- | --- | --- | --- |
| `D039-RTE-ENTRY` | `/journal/add-meal` | `D039-ENTRY`、`D039-LOCAL-SEARCH`、`D039-RECENT` | `ctx` | 添加餐食首层；搜索与最近均为首层内联区域，不新增子路由 |
| `D039-RTE-SCAN` | `/journal/add-meal/scan` | `D039-SCAN` | `ctx` | 扫描、手工 GTIN 和批准的本地降级入口 |
| `D039-RTE-AI` | `/journal/add-meal/ai` | `D039-AI` | `ctx` | AI 次级选择与候选；所有发送仍受 D-053 等门禁约束 |
| `D039-RTE-CREATE-FOOD` | `/journal/add-meal/create-food` | `D039-CREATE-FOOD` | `ctx` | 创建用户食品候选，不绕过统一检查 |
| `D039-RTE-REVIEW-SAVE` | `/journal/add-meal/review-save` | `D039-REVIEW-SAVE` | `ctx`、`candidate` | 统一检查与保存；`candidate` 只解析进程内候选 |

允许转换：

```text
D039-RTE-ENTRY -> D039-RTE-SCAN | D039-RTE-AI | D039-RTE-CREATE-FOOD | D039-RTE-REVIEW-SAVE
D039-RTE-SCAN -> D039-RTE-CREATE-FOOD | D039-RTE-REVIEW-SAVE | D039-RTE-ENTRY
D039-RTE-AI -> D039-RTE-REVIEW-SAVE | D039-RTE-ENTRY
D039-RTE-CREATE-FOOD -> D039-RTE-REVIEW-SAVE | prior D039 route
D039-RTE-REVIEW-SAVE -> origin journal context after COMMITTED | prior D039 route after cancel/failure
```

未列出的转换必须拒绝。拒绝不自动切换录入方式，不创建候选，不触发相机、媒体或网络。

## 3. `D039RouteParamsV1`

所有 URL 参数先作为 `unknown` 进入严格解析器；未知字段、重复字段、数组值、非字符串值和编码后超长值全部拒绝。

| 字段 | 路由 | 规则 | 解析结果 |
| --- | --- | --- | --- |
| `ctx` | 全部 | 必填；URL-safe opaque token；`^[A-Za-z0-9_-]{22,64}$`；最多一个值 | 仅用于查找进程内 `D039LaunchContextV1` |
| `candidate` | 仅 `D039-RTE-REVIEW-SAVE` | 必填；同一字符与长度规则；最多一个值 | 仅用于查找同一 `ctx` 下的进程内候选 |

`D039LaunchContextV1` 不进入 URL，至少包含：

```text
schemaVersion: 1
contextToken: opaque token equal to ctx
originRouteId: stable journal route identifier
originRevision: non-negative integer
localDate: valid YYYY-MM-DD calendar date
mealSlotId: opaque application identifier, 1..64 chars
originFocusTestId: allow-listed stable testID
navigationGeneration: non-negative integer
```

`originRouteId` 的唯一允许值为 `D038-RTE-JOURNAL`，它只表示 D-038 已接受的日记目的地；`originFocusTestId` 的唯一允许值为 `d038.journal.addMeal.open`。这一个祖先焦点 ID 不计入 D-039 自身的 43 个静态 `testID`。正式工程可以自行决定 route group 和文件位置，但不能把返回目标改为趋势、食品资料、设置或记忆中的上次录入方式。

解析必须同时满足：token 存在、未失效、当前账户/进程会话相同、字段严格合法、route 转换已登记、`navigationGeneration` 与活动栈一致。`candidate` 还必须属于同一 `ctx`，且状态为可检查候选。不得从无效 token 猜测日期、餐次或食品。

## 4. 稳定测试标识

`testID` 只表达组件职责，不使用本地化文案或业务数据。可访问名称仍使用本地化、面向用户的文本；`testID` 不得代替 label、role、hint 或状态。

### 4.1 首层与通用焦点

| 区域 | 稳定 `testID` |
| --- | --- |
| 首层容器 / 标题 / 上下文 | `d039.entry.screen` / `d039.entry.heading` / `d039.entry.context` |
| 本地搜索输入 / 清除 / 结果容器 / 空态 | `d039.entry.localSearch.input` / `d039.entry.localSearch.clear` / `d039.entry.localSearch.results` / `d039.entry.localSearch.empty` |
| 最近标题 / 列表 / 空态 | `d039.entry.recent.heading` / `d039.entry.recent.list` / `d039.entry.recent.empty` |
| 打开扫描 / AI / 创建食品 | `d039.entry.scan.open` / `d039.entry.ai.open` / `d039.entry.createFood.open` |
| 安全恢复消息 | `d039.routeRecovery.message` |

动态列表只允许两个模式：`d039.entry.localSearch.result.item-{n}` 和 `d039.entry.recent.item-{n}`。`{n}` 是当前确定排序后的 1-based 两位序号，例如 `item-01`；它不是食品身份，重新查询后可以重排。测试若需断言具体食品，必须使用受控 fixture 的可访问名称和来源，而不是解析 `testID`。

### 4.2 子路由

| 路由 | 稳定 `testID` |
| --- | --- |
| 扫描 | `d039.scan.screen`、`d039.scan.heading`、`d039.scan.permission.explanation`、`d039.scan.manualGtin.input`、`d039.scan.manualGtin.submit`、`d039.scan.mediaPicker.open`、`d039.scan.settings.open`、`d039.scan.createFood.open` |
| AI | `d039.ai.screen`、`d039.ai.heading`、`d039.ai.text.input`、`d039.ai.mediaPicker.open`、`d039.ai.camera.open`、`d039.ai.submit`、`d039.ai.cancel`、`d039.ai.error` |
| 创建食品 | `d039.createFood.screen`、`d039.createFood.heading`、`d039.createFood.name.input`、`d039.createFood.submit`、`d039.createFood.cancel`、`d039.createFood.error` |
| 统一检查 | `d039.reviewSave.screen`、`d039.reviewSave.heading`、`d039.reviewSave.form`、`d039.reviewSave.confirm`、`d039.reviewSave.cancel`、`d039.reviewSave.error`、`d039.reviewSave.status` |

本契约冻结 43 个静态 `testID` 和 2 个动态模式。新增、重命名或删除必须先更新本契约、验收矩阵和测试；不得通过坐标、DOM/原生层级索引或可变文案代替。

## 5. 返回与焦点

每次受控前进都在进程内压入 `D039ReturnDescriptorV1`：

```text
schemaVersion: 1
contextToken: ctx
fromRouteId: stable D039 route ID
returnRouteId: stable D039 route ID or origin journal route ID
triggerTestId: exact static ID or validated dynamic pattern
fallbackHeadingTestId: heading ID owned by returnRouteId
navigationGeneration: active stack generation
```

返回时按以下顺序执行：

1. 严格验证 descriptor、`ctx`、route 关系和 generation；无效则进入第 6 节安全恢复。
2. 先完成 route 返回并等待目标视图可见，不依赖过渡动画或固定毫秒延迟。
3. 若原触发控件仍存在、可见且可聚焦，恢复 `triggerTestId`；动态条目已消失时不得聚焦同序号的另一条目。
4. 触发控件不存在时聚焦 `fallbackHeadingTestId`。D039 子路由的 fallback 是返回页标题；离开 D039 时是发起日记上下文的 allow-listed 标题或新增按钮。
5. 保存只有在 `COMMITTED` 后才能回原日记上下文；`NOT_COMMITTED` 留在检查页并聚焦首错，`UNKNOWN` 留在检查页并只允许原命令对账/重试。

Back、Escape、取消、权限拒绝和系统 picker 取消都不等于发送、保存或偏好同意；这些路径的业务写入和非必要网络均为 0。

## 6. 非法 route / deep-link 失败关闭矩阵

| 恢复 ID | 输入 | 必须结果 |
| --- | --- | --- |
| `D039-RC-001` | 缺失、格式错误、重复、数组或超长 `ctx` | replace 到安全日记根；显示 `d039.routeRecovery.message`；写入/网络/权限/AI 均为 0 |
| `D039-RC-002` | 格式合法但未知、过期、跨账户或跨进程的 `ctx` | 与 RC-001 相同；不披露 token 是否曾存在 |
| `D039-RC-003` | 未登记转换直接进入 scan/AI/create/review | 有效上下文回 `D039-RTE-ENTRY` 并聚焦 `d039.entry.heading`；无效上下文回安全日记根 |
| `D039-RC-004` | review 缺少、未知、过期或跨 `ctx` 的 `candidate` | 清除 route 候选引用，回 `D039-RTE-ENTRY`；候选/日记写入和网络为 0 |
| `D039-RC-005` | 任一路由出现未知参数、敏感参数或未批准 query/fragment | 整体拒绝，不做宽松丢弃；按上下文有效性执行 RC-001 或 RC-003 |
| `D039-RC-006` | 自定义 scheme、universal link、冷启动或外部前后台 URL 命中任一 D039 path | 一律视为外部 deep link，不解析为内部导航；回安全日记根并公布恢复消息，所有副作用为 0 |

不存在记录、解析异常或恢复 UI 自身失败时也不得崩溃、循环导航、回显原 URL 或降级为隐式创建。

## 7. 测试可观测性

未来正式实现必须通过依赖注入的 test probe 暴露以下计数/事实；Release 默认使用无状态 no-op 实现，不持久化、不联网、不包含 URL、token、食品、图片、文本或营养值：

| Probe ID | 只允许记录 |
| --- | --- |
| `d039.probe.routeVisible` | route ID 与单调序号 |
| `d039.probe.focusRestored` |目标静态 `testID` 类别、成功/回退布尔值 |
| `d039.probe.businessWriteAttempt` | 命令类型与尝试次数，不含 payload |
| `d039.probe.networkAttempt` | 请求类别与尝试次数，不含 host、URL、header 或正文 |
| `d039.probe.permissionAttempt` | 相机/媒体类别与尝试次数，不含系统标识 |

自动化必须能断言 RC-001 至 RC-006、D039-AC-001 至 024 中的零写入/零网络/零权限要求，以及一次 `COMMITTED` 恰好产生一次餐食写入。probe 不是分析埋点，禁止作为用户画像、遥测或生产调试日志。

## 8. 当前边界

```text
D039-PX5-B01: CLOSED
D039-PX5-B02: CLOSED
stableRouteAndTestIdsMapped: true
returnDeepLinkContractComplete: true
externalDeepLinksSupported: false
remainingOpenBlockerIds: [D039-PX5-B03, D039-PX5-B04, D039-PX5-B05, D039-PX5-B06, D039-PX5-B07]
remainingOpenBlockerCount: 5
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
```
