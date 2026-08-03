# Owner 决策台账

## 台账规则

- 权威状态：`ACCEPTED`、`SUPERSEDED`、`CANDIDATE`、`REJECTED`。
- 只有 Owner 的明确回复可以把 `CANDIDATE` 改为 `ACCEPTED`。
- 已接受决定不可被实现便利、库默认值或 Agent 建议隐式覆盖；变更必须创建新决定并引用被替代项。
- 日期均使用 Asia/Shanghai 时区。本页当前基线日期为 2026-07-31。
- 机器可读副本位于 [`project-ops/decisions.json`](../../project-ops/decisions.json)。

## 已接受决定

| ID | 主题 | Owner 决定 | 状态 |
| --- | --- | --- | --- |
| D-001 | “竞品全部功能”的验收口径 | 仅以公开可验证资料为准 | ACCEPTED |
| D-002 | 离线食物与条码数据策略 | 台湾食药署 + USDA Foundation/SR + 用户自建 | ACCEPTED |
| D-003 | AI API 契约与凭据归属 | 每人配置 OpenAI-compatible Base URL、model 和 key | ACCEPTED |
| D-004 | Base URL 安全范围 | 仅允许 HTTPS | ACCEPTED |
| D-005 | React Native 工程形态 | Expo development build + prebuild，并检入 `ios/` | ACCEPTED |
| D-006 | 本地数据与备份边界 | SQLite + 手动加密导出/导入，默认排除 iCloud | ACCEPTED |
| D-007 | HealthKit 与系统健康数据 | 首版本地记录，第二阶段再决定 HealthKit | ACCEPTED |
| D-008 | 给朋友的 iOS 分发方式 | 开发期 TestFlight，稳定后再选长期渠道 | ACCEPTED |
| D-009 | 项目工作台运行形态 | 本地事件流实时工作台 + 静态快照 | ACCEPTED |
| D-010 | 项目推进节奏 | 先完成完整功能地图，再小批确认与实现 | ACCEPTED |
| D-011 | Nuttie 的 iOS 最低版本 | iOS 17+ | ACCEPTED |
| D-012 | 离线食品数据包更新方式 | 随 App 发版 + Files 签名包导入 | ACCEPTED |
| D-013 | 首版营养字段范围 | 能量、蛋白质、碳水、脂肪、纤维、糖、钠 | ACCEPTED |
| D-014 | 营养标签照片发送给 AI | 首次说明 + 每次预览并确认发送 | ACCEPTED |
| D-015 | 本地数据库加密等级 | SQLCipher + Keychain 数据库密钥 | ACCEPTED |
| D-016 | 首发语言范围 | 仅简体中文 | ACCEPTED |
| D-017 | 功能对标交付方式 | 完整对标范围不删减，分阶段交付 | ACCEPTED |

## 决定详情

### D-001：竞品完整性验收口径

- 决定：只把公开可验证资料作为“自律茄子全部功能”的事实验收边界。
- 依据：App Store、Apple Lookup、Google Play、应用宝、官方隐私政策和用户协议能够被复核；当前没有竞品会员账号与完整真机路径。
- 后果：公开矩阵达到定义后 G1 可通过；9 项无法公开验证的细节保留为 `EVIDENCE_GAP`/机会清单，不能写成竞品确定需求。
- 禁止推论：不得声称已覆盖未公开会员功能，也不得用常识补齐竞品事实。

### D-002：离线食物与条码数据

- 决定：基础数据由台湾食药署、USDA Foundation/SR 与用户自建食品组成。
- 后果：必须保留来源、版本、许可证和营养值缺失状态；台湾数据按许可署名。
- 限制：中国条码覆盖率没有可信公开保证；发布前以 200-500 个真实条码测量商品命中率与营养完整率。
- 排除：中国疾控营养所数据在没有明确再分发许可前不得抓取、转换或打包。

### D-003：AI API 契约与凭据

- 决定：每位使用者自行提供 OpenAI-compatible `baseURL`、`model` 和 `key`。
- 后果：客户端只实现兼容契约与本地配置；key 存入不可同步、本设备 Keychain；共享秘密不得打包进 IPA。
- 限制：提供方的模型能力、计费和可用性由使用者选择并承担，Nuttie 必须给出清晰错误与本地降级。BYOK 不等于可以把健康/营养载荷发送给用途未知或不相容的 Provider；数据保留、训练、人工访问、删除和广告/营销用途另由 D-053 设发布准入门禁。

### D-004：Base URL 安全范围

- 决定：Release 仅接受 HTTPS URL。
- 后果：拒绝 HTTP、混合内容和宽泛 ATS 例外；URL 解析、重定向、证书错误与目标展示必须测试。
- 限制：局域网 HTTP 或自签名证书不属于当前范围，若需要必须创建新决定。

### D-005：React Native 工程形态

- 决定：Expo Development Build + Prebuild，并把 `ios/` 作为正式源码检入。
- 后果：不以 Expo Go 作为正式运行环境；原生 Target、Entitlement、Swift 模块和 Xcode 配置必须纳入代码审查与升级回归。
- 限制：该决定没有批准导航、状态管理、ORM、图表或测试库。

### D-006：本地数据与备份边界

- 决定：SQLite 为本地业务真源；备份通过用户主动执行的加密文件导出/导入；默认排除 iCloud。
- 后果：卸载或设备损坏前未导出的数据可能无法恢复，产品必须明确提示并验证恢复流程。
- 限制：不得加入业务云同步、CloudKit 或隐式远程备份。

### D-007：HealthKit

- 决定：首版使用 Nuttie 本地记录；第二阶段才决定是否接入 HealthKit。
- 后果：首版不得因便利提前请求 HealthKit 权限，也不得把系统健康同步描述为已批准能力。
- 下一门槛：第二阶段需提交读取/写入类型、权限时机、来源合并、撤权行为与 iCloud 边界。

### D-008：朋友分发

- 决定：开发期使用 TestFlight，稳定后再选择长期分发方式。
- 后果：接受 TestFlight 对 Apple 服务的依赖与 90 天构建有效期；当前不预设 Ad Hoc、Unlisted 或普通 App Store。
- 限制：上传 TestFlight 属于外部发布动作，仍需 Owner 在具体构建时明确授权。

### D-009：项目工作台

- 决定：采用本地 append-only 事件流驱动的实时工作台，并保留静态快照。
- 后果：事件与消息必须来自实际工具和 Agent 协作；工作台不得伪造在线状态、交接或审批。
- 数据边界：项目运行元数据保存在本机，不建设在线 PM 后端。

### D-010：推进节奏

- 决定：先建立完整功能地图，再通过小批 Owner 决策和小增量实现推进。
- 后果：不能为了尽快写代码跳过全局范围，也不能等待全部细节一次性定完才获得反馈。

### D-011：iOS 最低版本

- 决定：iOS 17+。
- 后果：设计、依赖、原生能力与测试矩阵以 iOS 17 为下限；竞品的 iOS 13+ 元数据不自动成为 Nuttie 约束。

### D-012：离线数据包更新

- 决定：食品数据随 App 发版更新，同时允许从 Files 导入签名包。
- 后果：数据包必须携带 `schemaVersion`、`sourceVersion`、来源与许可证清单、内容摘要和签名；校验失败时原数据库保持不变。
- 限制：App 不直接联网下载食品数据。

### D-013：首版营养字段

- 决定：能量、蛋白质、碳水、脂肪、纤维、糖、钠。
- 后果：数据模型仍需保留来源、单位、每 100g/每份语义、缺失值和原始值，以支持未来扩展。
- 禁止推论：缺失值不得按零值处理。

### D-014：AI 标签照片发送

- 决定：首次使用营养标签照片功能时先说明；每次发送该类照片前展示图片预览、目标 Base URL 与发送动作并要求确认。
- 后果：发送前移除 EXIF；取消后不得发起网络请求；确认只针对当次请求，不是永久授权。

### D-015：数据库加密

- 决定：业务 SQLite 使用 SQLCipher，数据库密钥由 Keychain 保护。
- 后果：必须设计首次创建、锁屏/重启、密钥缺失、迁移、备份恢复和“删除全部数据”流程。
- 限制：Keychain 条目可能在同 bundle ID 重装后残留，删除流程必须显式清理。

### D-016：首发语言

- 决定：仅简体中文。
- 后果：首版内容、无障碍标签、错误信息和测试均以简体中文为基线；英文标语属于品牌资产，不代表首发 UI 双语。

### D-017：完整对标与分阶段交付

- 决定：公开对标总范围不删减，但允许分阶段交付。
- 后果：每项已证实功能和本地替代项都必须分配版本/阶段、状态与验收标准；延期不能等同删除。
- 限制：公开缺口只有在被验证或作为 Nuttie 自有需求获批后，才能进入确定实现范围。

## 已登记但未接受的候选

| ID | 主题 | Owner 待选 | 状态 | 历史编号 |
| --- | --- | --- | --- | --- |
| D-018 | 导航实现 | A Expo Router 初始实现；B React Navigation 直接配置初始实现 | CANDIDATE | - |
| D-019 | UI 状态管理 | A Zustand 仅管 UI/session/草稿；B Redux Toolkit；C React state/context | CANDIDATE | - |
| D-020 | SQLite 访问层 | A Drizzle stable + Nuttie DatabaseSession；B `expo-sqlite` + repository-owned SQL；C Kysely + 明确 Expo adapter | CANDIDATE | - |
| D-021 | 表单与运行时校验 | A React Hook Form + Zod；B Formik + Yup；C 自研 reducer + 手写校验 | CANDIDATE | - |
| D-023 | 单元与组件测试 | A `jest-expo` + Jest + RNTL 单 runner；B Vitest Domain + Jest/RNTL RN 双 runner | CANDIDATE | - |
| D-024 | E2E 与原生测试 | A 本地 Maestro + XCTest/XCUITest；B Detox + XCTest/XCUITest；C 仅 XCTest/XCUITest | CANDIDATE | - |
| D-025 | 样式与设计 Token | A StyleSheet + typed tokens；B NativeWind profile；C Unistyles profile | CANDIDATE | - |
| D-032 | Expo/RN/Node/Xcode 版本矩阵 | A 授权隔离 SDK 57 Spike；B 授权隔离 SDK 56 Spike；C 暂不授权工程/Spike | CANDIDATE | - |
| D-037 | 包管理器 | A pnpm 11.18.0 hoisted；B npm 11.19.0；C Yarn 4.18.0 node-modules；每项唯一 lockfile | CANDIDATE | - |
| D-038 | 产品导航外壳 | A 四个稳定目的地 + 情境新增；B 三个稳定目的地 + 集中新增；C 单一日记中心 + 更多菜单 | CANDIDATE | `UXD-01` |
| D-047 | Apple 分发身份 | A 个人会员；B 合格组织会员；C 暂不加入 | CANDIDATE | `REL-DEC-B` |
| D-048 | 设备与方向 profile | A iPhone 竖屏；B iPhone 全方向（不含倒置）；C Universal 完整方向；三项均先关闭 Mac/Vision availability | CANDIDATE | `REL-DEC-C` |
| D-052 | USDA 数据面向美国境外朋友的再分发口径 | A 获得 USDA/NAL 书面确认前境外构建仅含台湾合规包；B 明确接受残余风险并保持来源分包 | CANDIDATE | `DLR-C01` |
| D-053 | 第三方 AI Provider 数据用途准入 | A 证据证明用途相容才允许，未知即阻断；B 每个 Provider 单独复核并由 Owner 接受可接受残余风险；C 仅凭用户同意放行（不推荐，且不能覆盖 Apple 禁项） | CANDIDATE | - |

D-018、D-019、D-020、D-021、D-023、D-024、D-025、D-032、D-037、D-038、D-047 与 D-048 构成当前可回复的第 1 批。精确选项、版本快照、失败处理和 OI-01~OI-03 事实字段见 [Owner 分批决策包](../02-product/owner-decision-packs.md)。登记为 `CANDIDATE` 只消除草案与机器台账的双重真源，不表示 Owner 已选择。

D-032 采用两次 Owner 动作：第一次选择 A/B 只可形成 `CANDIDATE + SPIKE_AUTHORIZED` 的执行记录，不得改成 `ACCEPTED`；隔离 Spike 证据返回并经 Owner 第二次确认后，才能冻结最终精确矩阵。选择 C 则继续禁止工程与 Spike。

D-052 的 A 为团队推荐和当前 fail-closed 执行边界，不是 Owner 已接受的决定。Owner 未明确回复前，USDA 原始或转换数据只可用于本地研发，不得进入面向美国境外朋友的 TestFlight/IPA。详细证据和选项见 [食品数据许可与来源合规审查](../05-quality/data-license-review.md) 与 [Owner 分批决策包](../02-product/owner-decision-packs.md)。

D-053 未接受前，所有 Provider/载荷组合都保持 `UNKNOWN/BLOCKED`，AI 功能不得取得发布门禁通过。Owner 即使选择 B，也只能接受 Apple 规则允许范围内的残余风险，不能豁免明确禁止的数据用途。Provider 名称、terms/privacy URL 或快照、保留、训练、人工访问、删除和广告/营销用途证据属于 OI-07，不能用 API key 或 HTTPS 可用性替代。

## 其余尚未决定的类别

以下内容明确不在 D-001 至 D-017 的批准范围内；已形成的 D-018 及后续候选仍须 Owner 明确回复后，才会作为 `ACCEPTED` 进入本台账和机器副本：

- 应用信息架构与主要导航模式。
- 导航库、状态管理库、数据访问层/ORM、表单校验库。
- 图表实现、AI 响应契约细节和食品数据包签名算法/密钥轮换。
- 单元、组件、端到端和原生测试框架组合。
- 视觉方向、品牌图形、具体组件规范与 App 图标。
- 第一批可运行增量的精确范围与顺序。
- 锁屏/Widget/Live Activity 是否属于 Nuttie 自有范围。
- 长期分发渠道与稳定版发布条件。

这些项目在形成候选前可以进行调研、原型和风险分析，但不得以“团队推荐”为由写成已接受实现基线。
