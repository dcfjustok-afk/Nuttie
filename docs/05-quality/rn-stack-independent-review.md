# Nuttie React Native / Expo 技术栈独立复核

> 角色：Staff Mobile Architect（独立审查）
>
> 快照日期：2026-07-31
>
> 审查结论：`CONDITIONAL PASS / DECISION PACK REWRITE REQUIRED`
>
> 治理边界：本报告只提供建议，不接受任何 D 项，不改变 `project-ops`，也不授权初始化工程、安装依赖、生成 lockfile、Prebuild 或创建 `ios/`。

## 1. 结论先行

现有技术方向总体成立：iOS 17+、Expo Development Build、Prebuild 后检入 `ios/`、SQLCipher + Keychain、本地业务闭环、唯一 `AITransport` 网络出口，彼此没有结构性冲突。当前仓库也正确保持在 Phase 0：没有 `package.json`、lockfile、Expo config、`ios/` 或 `Podfile.lock`。

但当前 Owner 决策包还不能直接作为一次回复后的可执行初始化合同，主要原因如下：

1. D-032 同时要求“初始化前冻结版本”和“初始化后用原生 Spike 证明版本”，形成循环。必须在同一个 D-032 内区分“Owner 批准用于隔离 Spike 的候选基线”和“Spike 通过后由 Owner 最终冻结的精确矩阵”；本报告不擅自增加 D 编号或治理状态。
2. Expo SDK 55+ 的 New Architecture 始终启用且不能关闭。SDK 57/RN 0.86 下它不是待选开关；D-032 只能记录“强制启用”及第三方库验证结果。现有“RN 0.76 起默认启用”的表述已经不足以描述当前约束。
3. D-018 的 Expo Router typed routes 仍为 beta 且默认关闭，不能把“typed routes”当成无条件成熟收益或验收硬依赖。
4. D-020 的 Drizzle 可以连接 `expo-sqlite`，但不能接管 Nuttie 的 SQLCipher 开库、取 key、立即设 key、验证 cipher、迁移、故障恢复和连接关闭协议。访问层只能建立在一个 Nuttie 自有的 `DatabaseSession`/repository 边界之上。
5. Drizzle 官方当前页面默认展示 1.0 RC 安装路径，而 npm `latest` 稳定线仍为 `drizzle-orm 0.45.2` / `drizzle-kit 0.31.10`。若选 D-020-A，必须明确稳定线或明确接受预发布风险，不能混用文档与包版本。
6. D-023 应写成 `jest-expo + Jest + React Native Testing Library`，而不只是泛称 Jest。Expo 官方已经说明 React 19 下弃用 `react-test-renderer` 路径。
7. D-024-A 可行，但 Maestro 的 iOS 官方主路径是 Xcode Simulator 的黑盒测试。真实 iPhone 上的 Keychain、SQLCipher、通知、锁屏/重启和 TestFlight 升级证据仍必须由 XCTest/XCUITest 与真机检查承担；Maestro Cloud 不在已批准边界内。
8. D-037-C、D-023-B、D-025-B/C 目前没有精确到可执行 profile；D-048-C 也缺 iPad 方向及 Mac/Apple Vision Pro availability。不能让 Owner 选择一个仍包含“等”“组合”或未指定 major/node linker 的选项。

### 1.1 独立推荐总表

| 决策 | 独立建议 | 结论强度 | 必要限定 |
| --- | --- | --- | --- |
| D-037 包管理器 | A：pnpm profile | `CONDITIONAL RECOMMEND` | 当前精确候选 `pnpm 11.18.0`、`node-linker=hoisted`、唯一 `pnpm-lock.yaml`；Mac/Windows/Prebuild 通过后才最终冻结 |
| D-032 版本矩阵 | A：SDK 57 profile 先做隔离 Spike | `CONDITIONAL RECOMMEND` | 不是直接最终接受；New Architecture 强制启用；使用 Expo 兼容集合，不从 npm 各自抓 `latest` |
| D-038 产品导航外壳 | A：四个稳定目的地 + 情境新增 | `RECOMMEND` | 产品 IA 决定，不等于 D-018 库选择，也不是 scaffold 硬门槛 |
| D-018 导航实现 | A：Expo Router 先 Spike | `CONDITIONAL RECOMMEND` | typed routes beta 不作为硬依赖；A 失败后停止并回报，不自动切 B |
| D-020 SQLite 访问层 | A：Drizzle 稳定线 + 受控直接 SQL | `CONDITIONAL RECOMMEND` | SQLCipher lifecycle 归 Nuttie adapter；迁移 SQL 可审查；B 为失败后的首选回退 |
| D-019 UI 状态 | A：Zustand 仅短寿命 UI/session | `RECOMMEND` | 禁止 repository 镜像、`persist` 业务数据和不可恢复草稿；SQLite 仍是唯一业务真源 |
| D-021 表单/校验 | A：React Hook Form + Zod | `RECOMMEND` | UI coercion、外部 `unknown` 与 Domain invariant 分层，不共享一个万能 schema |
| D-025 样式/Token | A：StyleSheet + typed tokens | `STRONG RECOMMEND` | 首版不增加 Babel/Metro/原生样式运行时；品牌方向仍由 Owner/Design 决定 |
| D-023 单元/组件 | A：`jest-expo` + Jest + RNTL | `STRONG RECOMMEND` | 使用 Expo 匹配版本；不引入 `react-test-renderer`；纯 Domain 与 RN mock 隔离 |
| D-024 E2E/原生 | A：本地 Maestro + XCTest/XCUITest | `CONDITIONAL RECOMMEND` | Maestro 负责 Simulator 核心旅程；真机/系统边界归原生测试；不启用 Maestro Cloud |

“Recommended”只表示本独立审查意见，不代表 Owner 已接受。

## 2. 仓库现状与审查范围

核验时仓库根目录只有文档、项目运行记录和 README。下列实现工件均不存在：

- `package.json`；
- `pnpm-lock.yaml`、`package-lock.json`、`yarn.lock`；
- `app.json` / `app.config.*`；
- `ios/` 与 `Podfile.lock`；
- 可执行 React Native、Expo、SQLite、测试或原生代码。

因此，本报告只能评价选型合同和公开兼容证据，不能把任何库写成“已集成”、把 Archive 写成“已通过”，也不能给出真机性能或迁移通过结论。

本次重点复核 D-018、D-019、D-020、D-021、D-023、D-024、D-025、D-032、D-037、D-038，并核对它们与 D-005、D-006、D-011、D-015、D-048、OI-02/OI-03 和 TestFlight 门禁的关系。

## 3. 2026-07-31 可验证版本基线

### 3.1 Expo SDK 57 候选不是一组独立的 npm latest

Expo 官方 latest 矩阵在核验日给出：

| Expo SDK | React Native | React | 最低 Node | 最低 iOS | 最低 Xcode |
| --- | --- | --- | --- | --- | --- |
| 57.0.0 系列 | 0.86 | 19.2.3 | 22.13.x | 16.4+ | 26.4+ |
| 56.0.0 系列 | 0.85 | 19.2.3 | 20.19.x | 16.4+ | 26.4+ |

SDK 57 官方分支在核验日进一步给出可用于 Spike 的精确兼容候选：

| 工件 | SDK 57 分支候选 |
| --- | --- |
| `expo` | `~57.0.9` |
| `react-native` | `0.86.2` |
| `react` | `19.2.3` |
| `expo-router` | `~57.0.9` |
| `expo-sqlite` | `~57.0.1` |
| `expo-secure-store` | `~57.0.1` |
| `expo-camera` | `~57.0.3` |
| `expo-notifications` | `~57.0.8` |
| `react-native-reanimated` | `4.5.1` |

同日 npm registry 的独立 `latest` 已出现 `react 19.2.8`、`react-native 0.86.2`、`expo 57.0.9` 等不同节奏。Nuttie 不应把这些包分别升级到 registry latest；应先由 SDK 57 模板/`expo install` 产生 Expo 兼容集合，再由唯一 lockfile 固定解析后的精确版本。

### 3.2 建议的 D-032-A Spike 工具链候选

在 Owner 明确选择前，下表只是可复现候选，不是项目冻结值：

| 层 | 2026-07-31 候选 | 理由/限制 |
| --- | --- | --- |
| Node | `22.23.2` LTS（npm `10.9.8` 随发行版） | 满足 Expo 的 22.13.x 最低线，并包含同 major 后续修复；不可只写 `22` |
| Expo/RN/React | 上节 SDK 57 精确候选 | 从官方 SDK 57 分支取兼容集合 |
| Xcode | `26.6` | Apple 核验日稳定版本；需要 macOS Tahoe 26.2+；Expo 最低为 26.4+ |
| CocoaPods | `1.16.2` 作为首个候选 | Expo SDK 57 仓库 Gemfile 使用 `~> 1.16.2`；registry 更新的 1.17.0 不应未经 Spike 自动替换 |
| deployment target | `17.0` | 继承已接受 D-011，高于 Expo 16.4 最低线 |
| New Architecture | 强制启用 | SDK 55+ 不能关闭，不是 A/B 子选项 |
| Hermes | 采用 Expo/RN 默认 profile并记录实际产物 | 需纳入 PrivacyInfo、依赖和 Archive 审计；不凭默认值宣称通过 |

若 Owner 选择 D-032-B，应把“前一稳定 SDK”改成明确 profile，例如 SDK 56 / RN 0.85.3 / React 19.2.3 / `expo-sqlite ~56.0.5` / `expo-secure-store ~56.0.4`，并在相同 Mac/Xcode/Node 条件下做对照。SDK 56 同样属于 New Architecture-only，不提供关闭新架构的逃生路径。

### 3.3 New Architecture 必须改写为事实字段

Expo 官方说明“SDK 55 and later run entirely on the New Architecture. The New Architecture is always enabled and cannot be disabled”。React Native 0.82 是仅支持 New Architecture 的首个 RN 版本；RN 0.86 继承该行为。

因此 D-032 最终矩阵应记录：

- `newArchitecture: required/enabled`，不是 `true/false` 待选；
- 每个原生依赖是否通过 React Native Directory/Expo Doctor 与真实 Archive；
- 失败时比较 SDK 57 与仍受支持 SDK 56，而不是静默写 `newArchEnabled=false`；
- 任何要求 Legacy Architecture 的库直接视为不兼容候选。

## 4. 初始化与发布门禁重排

### 4.1 D-032 的循环修复

不新增 D 编号也能解除循环。建议原 D-032 台账至少包含两组字段和两次 Owner 动作：

1. **Spike candidate baseline**：Owner 选择 A/B/C 策略，并明确是否授权创建隔离 Spike；记录候选 Node、package manager、Expo/RN/React、Xcode、CocoaPods、deployment target 和高风险原生包。此时不得标记“最终兼容已证明”。
2. **Final frozen matrix**：Spike 完成后，把 lockfile/Podfile.lock 实际解析版本、Mac/macOS/Xcode、New Architecture 强制状态、SQLCipher/Keychain/Camera/Notifications、Prebuild diff、Debug/Release/Archive 结果提交 Owner；Owner 再决定接受、改候选或停止。

D-032-C “等待所有高风险 Spike 再冻结”也必须先说明用哪一组版本创建 Spike，否则仍不可执行。可改为“暂不授权任何工程/Spike，等待 OI-03 设备事实”，而不能称为一个可以运行的技术 profile。

### 4.2 不同阶段真正需要什么决定

| 阶段 | 硬门槛 | 可延后 |
| --- | --- | --- |
| 创建 scaffold / `package.json` / 唯一 lockfile | D-037 精确 profile；D-032 的 Spike candidate baseline；若模板会生成正式 `app/` 路由，先定 D-018，否则必须用 blank/minimal Spike | D-038、D-019、D-021、D-025、D-023、D-024 |
| 首次 Prebuild | D-032 candidate；D-048 精确设备族/方向；OI-02 Bundle ID；已接受 D-015 的 `useSQLCipher` config；生成前 config 审查 | D-047 会员身份不是无签名模拟器 Prebuild 的技术前提 |
| 原生兼容 Spike | 受控 Mac/Xcode；D-037；D-032 candidate；D-015；D-020 对比时需固定实验 profile | D-020 最终接受、D-018 最终接受可在证据后完成 |
| 正式导航/schema/组件实现 | 分别需要 D-038/D-018、D-020、D-021、D-025；跨页状态前需要 D-019；首个正式测试配置前需要 D-023 | D-024 可到 G5 前，但 `testID`/可访问名称/可观测性约定必须随组件开始 |
| 真机稳定签名/TestFlight | D-047/OI-01、OI-02、D-048、最终 D-032、Archive、SQLCipher/Keychain/升级证据 | 不能用“工具已选”代替 D-024 规定的证据 |

D-047 不应阻断创建 package、无签名 iOS Simulator 或隔离 Spike；它会阻断稳定真实设备签名、App Store Connect 和 TestFlight。D-015 已经决定 SQLCipher；`useSQLCipher`/Prebuild 属于该已接受边界，不依赖 D-020 先选 ORM。只有为了比较 D-020 A/B/C 的实验代码时，才需要固定该实验的访问层 profile。

## 5. D-037 包管理器独立审查

### 5.1 结论

维持 A 为首选，但必须把 A/B/C 都写成精确 profile。Expo 官方明确支持 npm、Yarn、pnpm 和 Bun 入口，也明确说明：

- pnpm 创建的项目默认使用 `nodeLinker=hoisted`；
- Yarn 2+ 的 PnP 不适用于 React Native，Expo 默认改为 `nodeLinker=node-modules`；
- Prebuild 从 lockfile 推断包管理器；混入第二个 lockfile 会让原生生成失去确定性。

### 5.2 可执行选项改写

| 选项 | 2026-07-31 精确候选 profile | 备注 |
| --- | --- | --- |
| A | `pnpm 11.18.0`；`packageManager` 精确字段；`.npmrc` 为 `node-linker=hoisted`；唯一 `pnpm-lock.yaml`；frozen install | 推荐用于 Spike；仍需 Windows/Mac/Prebuild/Pods 验证 |
| B | `npm 11.19.0`；唯一 `package-lock.json`；`npm ci`；记录 Node 自带 npm 与项目要求的关系 | 依赖面最普通；不要因 registry latest 已到 npm 12 就自动跨 major |
| C | `Yarn 4.18.0`；`packageManager` 精确字段；`.yarnrc.yml` 为 `nodeLinker: node-modules`；唯一 `yarn.lock` | 原“Yarn”不可执行；必须排除未说明的 Classic/PnP 语义 |

这些是当前精确候选，不是最终冻结。它们都必须在所选 D-032 Node 矩阵下验证；不能在 Owner 选择前创建任何配置。

无论选择哪项，最终合同都应要求：

- 一个且只有一个 lockfile；
- package manager 精确版本，不只写 major；
- 本地和门禁使用 frozen/immutable install；
- `expo install --check` 与 `expo-doctor` 使用项目本地 CLI，不通过无版本 `npx ...@latest` 改写依赖；
- 改 package manager 是新决策/迁移，不是删除 lockfile 后重装；
- `ios/Podfile.lock` 与对应原生依赖变更同批提交。

## 6. D-018 与 D-038：产品外壳和导航库

### 6.1 D-038

推荐 A：日记、趋势、食品资料、设置四个稳定目的地，新增餐食/扫码/AI 作为情境动作。理由是它保持离线食品资料与备份设置可发现，同时不把 AI 提升成产品主轴。该决定属于 IA，不应由 Expo Router 默认模板倒推。

D-038 不是 package/lockfile 硬门槛。团队可以先做无正式路由的原生兼容 Spike；但一旦开始正式导航原型、VoiceOver 顺序、deep link 和返回行为，就必须先接受 D-038。

### 6.2 D-018

推荐 A 只作为 Spike 候选。Expo 的 default template 会直接包含 Expo Router；blank template 不配置导航；官方也提供 plain React Navigation example。这意味着在 D-018 未决时，不能为了省事使用 default template 并把生成的 `app/` 目录当作既定路由合同。

Expo Router A 的 Spike 至少覆盖：

1. 四个稳定目的地和每个 tab 的独立返回栈；
2. 新增餐食、扫码、AI 发送预览、设置、备份恢复 modal；
3. 冷启动 deep link、前后台 deep link、非法参数与不存在记录；
4. 取消系统相机/照片/Files picker 后返回原上下文；
5. 数据库锁定、恢复态和首次启动 gate，确保受保护页面不会先渲染再闪回；
6. 未来 Widget URL contract 的纯解析测试，不提前创建 Widget target；
7. VoiceOver 焦点、320/375pt、Dynamic Type 与 modal 返回行为。

Expo Router typed routes 在官方文档中仍为 beta、默认关闭，类型由开发服务器生成且默认不提交 Git。因此：

- 不把 typed routes 作为采用 A 的必要条件；
- 若启用，必须显式记录 `experiments.typedRoutes`，并验证 clean clone/无缓存类型检查；
- route 参数仍在运行时验证，不能把生成 TS 类型当作不可信 deep link 的安全边界；
- A 任一硬场景失败时停止并向 Owner 提交证据；不得自动切换 B。

B（React Navigation 直接配置）是合理回退：路由图更集中，类型与 linking 更显式，但模板和维护成本增加。它不是“失败后自动生效”的预授权默认值。

## 7. D-019：UI 状态管理

推荐 Zustand，但只允许保存可丢失、可重建的展示状态。2026-07-31 registry 稳定线为 5.0.14；最终版本仍应随 lockfile 和 React 19 Spike 冻结。

建议边界：

| 可以进入 Zustand | 不得进入 Zustand |
| --- | --- |
| 当前 tab 的临时筛选、未提交 picker 状态、modal 开关、当前 operation ID、一次会话内排序 | 餐食、体重、目标、提醒、收藏、历史统计、Provider key、DB key、迁移状态、备份状态真源 |
| 可由 URL/SQLite 重建的短寿命导航协调 | repository 查询结果的长期镜像、完整表副本、离线数据包内容 |
| 明确允许丢失的表单 UI 辅助状态 | 用户合理期望杀进程后恢复的草稿；这类草稿应进入 SQLite 草稿表 |

首版禁止对业务 store 使用 Zustand `persist` middleware/AsyncStorage。组件局部状态仍优先用 React state；只有跨 route 或跨组件协调才进入小型 slice。选择 Zustand 不应催生一个全局巨型 store。

验收包括：杀进程后所有已提交业务数据仍完整；清空 Zustand 不影响领域结果；repository 更新不会因镜像滞后显示旧值；静态边界阻止 UI store 导入数据库 adapter 内部类型。

## 8. D-020：SQLCipher 与数据库访问层

### 8.1 官方事实和关键风险

Expo 官方确认：

- `expo-sqlite` 在 iOS/Android/macOS 支持 SQLCipher；
- `useSQLCipher` 是 build-time config plugin 属性，修改后必须生成新原生 binary；
- SQLCipher 不支持 Expo Go；
- 打开数据库后必须立即执行 `PRAGMA key`；
- `execAsync()` 不转义参数；
- 普通 `withTransactionAsync()` 可能把作用域外同时发生的查询卷入事务；需要严格顺序时使用 transaction handle 的 `withExclusiveTransactionAsync()`；
- Expo 提供 Drizzle integration 入口，但没有替 Nuttie 证明 SQLCipher 生命周期和 crash consistency。

这与 D-005/D-015 一致，也说明 Expo Go、任意并发开库和“ORM 自动迁移后再设 key”均不可接受。

### 8.2 推荐结构

```text
Keychain SecretVault
        |
        v
Nuttie DatabaseSession state machine
  open -> PRAGMA key -> cipher/version check -> integrity/open check
       -> fixed PRAGMAs -> exclusive reviewed migrations -> READY
        |
        +-- Drizzle stable query/schema adapter (application write DB)
        +-- controlled parameterized SQL (FTS, integrity, pack queries)
        +-- Nuttie migration runner / reviewed SQL artifacts
```

Drizzle 和任何 React hook 只能在 `READY` 后取得受限 repository；不得直接持有未初始化的 `SQLiteDatabase`。

`DatabaseSession` Spike 必须证明：

1. Keychain 状态机先按 ADR-0004 判断新安装、孤立 key、缺 key、wipe/restore intent，再决定是否生成 key；
2. 开库后在任何 schema 查询前立即设 key，且 key 不进入日志、错误文本、普通 store 或持久化调试工件；
3. 验证实际 `cipher_version`、错误/空 key、损坏页、旧 SQLCipher fixture、WAL/SHM 恢复；
4. `foreign_keys`、journal mode、busy timeout 和其他 PRAGMA 的精确顺序固定并有测试；
5. migration gate 阻断所有 repository 并发，使用 transaction handle；每个 migration 与 `user_version` 一致提交；
6. migration 失败关闭 handle、保持旧 generation，不创建空库覆盖；
7. Files 恢复、数据包激活和 wipe 能等待全部 writer acknowledgement 后关闭连接；
8. Archive 中 SQLCipher 确实链接，Debug/Release 行为一致；
9. 记录 DB 大小、首开、重开、典型写事务、FTS 和 365 天聚合的真实 iPhone 基线；
10. 若 DB key 进入 JS 字符串不能满足最终威胁模型，停止并比较窄接口 Expo/Swift module，而不是降低到明文 SQLite。

### 8.3 D-020-A 的精确限定

推荐 A，但改写为：

- 使用 `drizzle-orm` npm stable 与配套 `drizzle-kit` stable；核验日分别为 0.45.2 和 0.31.10；
- 不采用官方页面当前展示的 `@rc` 安装命令，除非 Owner 另行明确接受预发布依赖；
- Drizzle 负责应用写库的 schema/query 类型，不能负责 SecretVault 或 SQLCipher open protocol；
- 每个 migration 提交最终 SQL，代码评审不只看 TypeScript schema diff；
- migration runner、FTS、integrity、签名食品包和故障恢复允许并预期使用受控直接 SQL；
- 任何用户/AI/文件值都使用绑定参数，只有仓库内受信 migration/PRAGMA 常量允许 `execAsync` 静态 SQL；
- stable/RC 文档差异、Babel `inline-import`、migration bundling 和 clean Release bundle 都是 Spike 项。

若 A 不能通过，B（`expo-sqlite` + repository-owned SQL）是首选回退，因为它保留所有 SQLCipher 控制面；C 需要自建 Kysely Expo adapter/migration，新增价值不足以抵消额外适配面，不推荐。

## 9. D-021：表单与运行时校验

推荐 React Hook Form + Zod。核验日 registry 稳定线为 RHF 7.83.0、Zod 4.4.3、`@hookform/resolvers` 5.5.7；resolver 元数据声明同时支持 Zod 3.25+ 和 4.x。精确版本仍须由所选 React 19/Expo lockfile 验证。

不要建立一个同时承担 UI、AI、文件和 Domain 的万能 schema。建议分层：

1. **UI form schema**：处理文本框字符串、空值、locale 输入与字段级错误；
2. **transport/import schema**：把 AI、备份、数据包和 deep link 全部当 `unknown`，按版本严格解析，安全关键对象拒绝未知字段；
3. **application command mapping**：把已解析 DTO 映射为明确命令和单位；
4. **pure Domain invariant**：营养、份量、日期、目标等不变量仍为纯 TypeScript，不导入 Zod/RHF。

验收应覆盖动态食材数组、单位切换、最大 Dynamic Type、VoiceOver 错误摘要、重复提交、取消、AI 恶意/超大响应，以及校验失败数据库零写入。Formik + Yup 没有提供足以抵消当前 TypeScript 推导和动态表单成本的优势；自研 reducer/schema 则维护风险最高。

## 10. D-025：样式与设计 Token

强烈推荐 A：React Native `StyleSheet` + TypeScript semantic tokens + 小型可访问组件层。它不增加 Babel、Metro 或原生运行时变量，最符合当前本地单机 iOS 应用和高风险原生依赖预算。

Token 至少分为：

- 语义颜色（背景、表面、正文、次级、危险、成功、焦点），而非页面直接引用品牌色；
- 字体 role/weight/line-height，遵循 Dynamic Type，不以 viewport 宽度缩放字号；
- spacing、尺寸、圆角、边框、阴影/层级；
- motion duration 与 Reduce Motion 行为；
- control state（normal/pressed/disabled/focused/error）；
- iOS safe area、最小触控尺寸与图标尺寸。

A 只决定表达和依赖边界，不决定 Nuttie 的品牌色、图标、明暗模式或视觉方向。

当前 B/C 不可直接选择：

- B 必须明确 NativeWind 4.2.6、Tailwind major、Babel/Metro 配置和 New Architecture/Release bundle Spike；只写 NativeWind 不足以生成一致工程。
- C 必须点名实现。核验日 `react-native-unistyles 3.3.0` 的 peer metadata 还引入 Reanimated、Nitro Modules、edge-to-edge 等原生依赖；“Unistyles 等”会把未知原生依赖带进 D-032，不能成为 Owner 的可执行选项。

## 11. D-023：单元与组件测试

推荐把 A 精确写为：

```text
jest-expo (与 Expo SDK 57 匹配)
+ Jest（由 expo install/兼容 Spike 解析）
+ @testing-library/react-native 14.x 候选
+ pure Domain tests isolated from RN native mocks
```

Expo 官方说明 `jest-expo` 提供 Expo SDK 原生部分 mock 与基础配置，并推荐 RNTL；同一页面明确指出 `react-test-renderer` 不支持 React 19+，应由 RNTL 替代。核验日 `jest-expo` 为 57.0.3，RNTL 为 14.0.1；RNTL 14 的 engine/peer metadata 与 Node 22.13+、React 19、RN 0.78+、Jest 29+ 相容，但仍必须由实际 SDK 57 lockfile 和测试证明。

建议单一 Jest runner 内分离两类 project/config：

- Domain/Application：Node-like 环境、无 RN/Expo 全局 mock，帮助发现领域层错误依赖；
- Component/adapter：`jest-expo` preset + RNTL，按公共行为查询，不依赖内部实现。

测试不得以大量 snapshot 替代交互、无障碍名称、错误态和零写入断言。

D-023-B 当前不可执行。Vitest 4.1.10 本身是成熟 runner，但没有 Expo 官方等价 RN preset；必须先指定 React Native transform、环境、组件测试库、native mock、coverage 和与 Metro/Babel 的兼容方案。未补齐前，B 只能是独立 Spike 题目，不能让 Owner 一次选择后直接实施。

## 12. D-024：E2E 与原生测试

推荐 A，但明确责任分配：

| 工具 | 负责 | 不负责/不能替代 |
| --- | --- | --- |
| Maestro CLI（本地） | Xcode Simulator 上的首启离线、手工记录、扫码未命中、AI 预览确认、备份恢复 UI、删除全部 UI 等黑盒旅程 | 不作为真实 iPhone Keychain、锁屏/重启、SQLCipher 文件、通知可靠性或 TestFlight 升级证明 |
| XCTest | SQLCipher adapter、Keychain wrapper、文件属性、migration、加密/签名 golden fixture、原生模块 | 完整跨页面用户旅程 |
| XCUITest（真实设备和 Simulator） | 系统权限、通知、文档 picker、相机入口、锁屏/重启后的恢复、安装/升级路径和必要的原生旅程 | 纯 Domain 规则和大规模组合 |

核验日 Maestro 最新公开 release 为 CLI 2.7.0。其 iOS 文档描述通过 Accessibility 层控制 Xcode Simulator，并明确测试 `.app` Simulator build；因此现有“A + XCTest/XCUITest”比“只用 Maestro”严谨。Maestro Cloud、第三方设备云和远端产物上传都需要 D-029/数据边界新决定，本报告不批准。

采用 A 前定义可量化 Spike gate：

1. 选定 6 条核心旅程在 clean state 下连续本地运行 20 次，无无法解释失败；
2. 失败必须保留本地截图、命令、系统日志和 app 日志，且不含 key/个人数据；
3. 动画、时间、权限和系统 picker 不依赖任意 sleep；
4. 所有关键控件从组件开发开始提供稳定可访问名称/必要 `testID`，不使用坐标定位；
5. Release-like Simulator build 与 Development Build 分开执行；
6. 真实 iPhone 原生矩阵独立通过，不能用 Simulator 20/20 替代。

若 A 达不到上述稳定性或诊断要求，再向 Owner 提交 B（Detox 20.51.x + XCTest/XCUITest）及迁移成本。Detox 的 gray-box 同步更强，但增加 instrumentation、构建配置和维护面；不得默认长期并存两套完整 RN E2E。C（仅 XCUITest）可行但会把 RN 页面维护成本集中到 Swift 测试，当前不推荐。

## 13. 版本冻结与升级策略

最终 D-032/D-037 接受后，建议使用以下可审计规则：

1. `packageManager` 写精确版本；Node 写精确 patch 到 `.node-version` 或团队选定的等价文件，并在文档记录下载来源。
2. Expo/RN/React 按官方兼容集合安装；Expo 原生包通过所选 package manager 执行项目本地 `expo install`，不独立追 npm latest。
3. 唯一 JS lockfile 必须提交；门禁使用 frozen install。
4. `ios/`、`Podfile.lock`、必要的 `Gemfile`/`Gemfile.lock` 一并提交；CocoaPods 由 Bundler 或等价受控方式固定，不依赖某台 Mac 的全局最新 gem。
5. 在兼容矩阵中记录：macOS、Xcode、Command Line Tools、Ruby、CocoaPods、Node、package manager、Expo CLI、Expo/RN/React、Hermes、SQLCipher、SecureStore、Camera、Notifications、Router、Drizzle、测试工具的精确解析版本。
6. 直接依赖可保留 Expo 推荐的 compatible range，但 lockfile 是构建输入；高风险原生依赖升级必须单独批次，不与产品功能混合。
7. 每次升级运行 `expo install --check`、`expo-doctor`、clean install、Prebuild diff、Pods、Debug/Release、Archive、SQLCipher 历史 migration、Keychain 真值表、权限、网络捕获和 TestFlight 升级。
8. `prebuild --clean` 会删除并重建 native directories。由于 D-005 要检入并可能手工维护 `ios/`，每个原生差异必须由 config plugin/可重复脚本表达或明确列入手工 ownership；执行 clean 前先审查，生成后逐文件 diff。
9. 不启用 EAS Update/OTA，不让 package、数据包或 schema 在运行时在线自更新；食品签名包只沿 D-012 已接受路径更新。
10. 升级失败时保留旧 lockfile/Podfile.lock 和可构建旧版本，不静默降级 SQLCipher、关闭 New Architecture 或删除测试。

### 13.1 D-032 最终冻结证据包

最终提交 Owner 的证据至少包含：

- 候选矩阵与实际解析矩阵 diff；
- `expo config`、Prebuild 生成 diff、Xcode build settings 和 deployment target；
- Debug/Release/Archive 命令及结果；
- `Podfile.lock` 中 SQLCipher/Expo/RN/Hermes 版本与 PrivacyInfo 审计；
- SQLCipher 开库、错误 key、旧库 migration、WAL/SHM、wipe/restore kill-point；
- SecureStore `WHEN_UNLOCKED_THIS_DEVICE_ONLY`、锁屏/重启、卸载重装残留与安装代真值表；
- 相机、照片 picker、Files、仅本地通知权限矩阵；
- 非 AI 完整流程零业务网络请求；
- 至少一台 iOS 17.x 和一台最新支持 iOS 的真实 iPhone 结果；
- clean clone 在受控 Mac 上的可重复命令。

## 14. Owner 决策包建议改写

Owner 仍需亲自选择，建议问题写成以下可执行语义：

```text
D-037：选择 A/B/C 的精确 profile，是否只授权其用于 D-032 原生 Spike？
D-032：选择 A(SDK57) / B(SDK56 对照) / C(暂不授权工程，等待设备)；
       A/B 只批准 candidate baseline，最终精确矩阵在 Spike 证据后再次确认。
D-048：明确 supportsTablet、iPhone/iPad 方向集合，以及 Mac/Apple Vision Pro availability；
       不接受未说明方向和 availability 的 C。
D-038：选择产品 IA A/B/C。
D-018：选择 A 作为 Router Spike 候选或 B 直接配置；A 失败时停止回报，不自动切换。
D-020：选择 A/B/C 的 Spike profile；SQLCipher 本身继承 D-015，不由本项重新决定。
D-019：选择 A/B/C，并明确“业务真源只在 SQLite、可恢复草稿进 SQLite”。
D-021：选择 A/B/C；A 明确 RHF/Zod/Resolvers 的兼容线和 schema 分层。
D-025：A 可直接选择；B/C 先补精确库版本和 build 配置后才可选。
D-023：A 写成 jest-expo/Jest/RNTL；B 在 RN transform/mock profile 补齐前仅可授权 Spike。
D-024：A 写成本地 Maestro Simulator + XCTest/XCUITest 真机；任何 Cloud 均不在本决定内。
```

建议依赖顺序：

```text
OI-03 设备实况
  -> D-037 精确工具 profile
  -> D-032 Spike candidate baseline
  -> D-048 精确原生配置 + OI-02 Bundle ID
  -> Owner 单独授权隔离原生 Spike
  -> D-032 最终冻结
  -> D-038
  -> D-018 / D-020 最终选择
  -> D-025 / D-021 / D-019
  -> D-023
  -> D-024（可观测性契约提前，完整 E2E 管线可后置）
```

D-047/OI-01 可与前段并行；它不是 scaffold 门槛，但在稳定真机签名/TestFlight 前必须完成。

## 15. 主要风险与处置

| 风险 | 严重度 | 处置 |
| --- | --- | --- |
| D-032 初始化/Spike 循环导致“未证明即冻结”或永远不初始化 | P0 | 同一 D-032 内分 candidate baseline 与 final freeze 两次 Owner 动作 |
| SDK 57 被错误配置为 Legacy Architecture | P0 | 记录 New Architecture 强制事实；不提供关闭路径 |
| SQLCipher 在设 key 前发生 schema/ORM 查询 | P0 | Nuttie `DatabaseSession` gate；Drizzle 仅接 READY handle；原生/集成测试 |
| Keychain 卸载重装残留与新 DB 错配 | P0 | `WHEN_UNLOCKED_THIS_DEVICE_ONLY` + 安装代真值表；不得把残留视为可靠持久化承诺 |
| Drizzle stable 与 1.0 RC 文档/迁移产物混用 | P1 | 明确 stable pair；评审 SQL；RC 需新风险接受 |
| Expo Router typed routes beta 被当作运行时安全 | P1 | runtime validation；typed routes 非硬依赖；clean clone 类型测试 |
| pnpm/Yarn linker 不明确导致 Metro/Pods/autolinking 差异 | P1 | 精确 profile；pnpm hoisted / Yarn node-modules；唯一 lockfile |
| Maestro Simulator 通过被误写成真机原生通过 | P0 | XCTest/XCUITest + 真实 iPhone 独立证据 |
| 样式方案引入额外原生 runtime 扩大 D-032 | P1 | 首版 StyleSheet；NativeWind/Unistyles 仅在精确 Spike 后重开决定 |
| npm latest 与 Expo 兼容集合错位 | P0 | 只用 Expo compatible install + lockfile；依赖升级独立审查 |

## 16. 公开来源

### Expo、React Native 与 Apple

- Expo SDK version matrix：<https://docs.expo.dev/versions/latest/>
- Expo SDK 57 default template：<https://github.com/expo/expo/blob/sdk-57/templates/expo-template-default/package.json>
- Expo SDK 57 bundled native versions：<https://github.com/expo/expo/blob/sdk-57/packages/expo/bundledNativeModules.json>
- Expo SDK 57 Gemfile / CocoaPods 约束：<https://github.com/expo/expo/blob/sdk-57/Gemfile>
- Expo New Architecture：<https://docs.expo.dev/guides/new-architecture/>
- React Native 0.82 New Architecture-only：<https://reactnative.dev/blog/2025/10/08/react-native-0.82>
- Expo create-expo-app 与 package manager/linker：<https://docs.expo.dev/more/create-expo/>
- pnpm 11.18.0 registry metadata：<https://registry.npmjs.org/pnpm/11.18.0>
- npm 11.19.0 registry metadata：<https://registry.npmjs.org/npm/11.19.0>
- Yarn 4.18.0 release：<https://github.com/yarnpkg/berry/releases/tag/%40yarnpkg/cli/4.18.0>
- Expo Development Builds：<https://docs.expo.dev/develop/development-builds/introduction/>
- Expo Prebuild/CNG：<https://docs.expo.dev/workflow/continuous-native-generation/>
- Apple Xcode system requirements：<https://developer.apple.com/xcode/system-requirements/>
- Node release index：<https://nodejs.org/dist/index.json>

### 导航、数据与安全存储

- Expo Router typed routes：<https://docs.expo.dev/router/reference/typed-routes/>
- Expo Router introduction：<https://docs.expo.dev/router/introduction/>
- React Navigation：<https://reactnavigation.org/docs/getting-started/>
- Expo SQLite / SQLCipher / transactions / Drizzle：<https://docs.expo.dev/versions/latest/sdk/sqlite/>
- Drizzle Expo SQLite guide：<https://orm.drizzle.team/docs/get-started/expo-new>
- Drizzle npm metadata：<https://registry.npmjs.org/drizzle-orm/latest>
- Drizzle Kit npm metadata：<https://registry.npmjs.org/drizzle-kit/latest>
- Expo SecureStore：<https://docs.expo.dev/versions/latest/sdk/securestore/>
- SQLCipher API：<https://www.zetetic.net/sqlcipher/sqlcipher-api/>

### 状态、表单、样式与测试

- Zustand：<https://zustand.docs.pmnd.rs/>
- Zustand npm metadata：<https://registry.npmjs.org/zustand/latest>
- React Hook Form React Native：<https://react-hook-form.com/get-started#ReactNative>
- React Hook Form / resolvers npm metadata：<https://registry.npmjs.org/react-hook-form/latest>、<https://registry.npmjs.org/%40hookform%2Fresolvers/latest>
- Zod：<https://zod.dev/>
- NativeWind：<https://www.nativewind.dev/>
- React Native Unistyles：<https://www.unistyl.es/>
- NativeWind / Unistyles npm metadata：<https://registry.npmjs.org/nativewind/latest>、<https://registry.npmjs.org/react-native-unistyles/latest>
- Expo unit testing / `jest-expo` / RNTL：<https://docs.expo.dev/develop/unit-testing/>
- React Native Testing Library：<https://oss.callstack.com/react-native-testing-library/>
- Jest / `jest-expo` / RNTL / Vitest npm metadata：<https://registry.npmjs.org/jest/latest>、<https://registry.npmjs.org/jest-expo/latest>、<https://registry.npmjs.org/%40testing-library%2Freact-native/latest>、<https://registry.npmjs.org/vitest/latest>
- Maestro iOS support：<https://docs.maestro.dev/get-started/supported-platform/ios>
- Maestro CLI 2.7.0 release：<https://github.com/mobile-dev-inc/Maestro/releases/tag/cli-2.7.0>
- Detox getting started / gray-box model：<https://wix.github.io/Detox/docs/introduction/getting-started/>
- XCTest：<https://developer.apple.com/documentation/xctest>

Registry/release 版本只是 2026-07-31 快照证据。最终选择必须由 Owner 接受，并由 lockfile、Podfile.lock、Mac/真机 Spike 和 Archive 结果替代“当前 latest”叙述。

## 17. 独立审查协作记录

本审查在形成最终结论前，向 Owner 启动门禁独立审查员提供了各 D 项在 scaffold、首次 Prebuild、功能实现、原生 Spike 和 TestFlight 阶段的硬门槛摘要。

采纳的反馈：

- D-032 必须表达两阶段审批语义，但审查员不擅自创建 D-032a/b 或新增治理状态；本报告据此使用原 D-032 内的 candidate/final 字段。
- D-048、D-037-C、D-023-B、D-025-B/C 需要补成精确可执行 profile。
- D-047 不阻断 scaffold/无签名 Simulator Spike，只阻断稳定真机签名与 TestFlight。
- D-024 的工具最终选择可后置，但测试可观测性和可访问标识必须前置。
- D-015 的 SQLCipher 配置与 D-020 ORM/访问层选择分开；本报告不再把 ORM 决策写成启用 SQLCipher 的前提。

没有不采纳的事实性反馈。唯一措辞调整是：本报告把“两阶段”作为原 D-032 的审批语义建议，而不是建立新的正式编号或状态。
