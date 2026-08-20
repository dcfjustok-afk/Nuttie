# Nuttie 工程设计基线

> 状态：G4 初版
>
> 负责人：移动端架构
>
> 基线日期：2026-07-31
>
> 适用范围：iOS 17+、React Native、Expo Development Build、本地优先

## 1. 文档目的

本目录把 Phase 0 已批准的产品与技术约束转换为可实现、可测试、可审计的工程边界。它不是依赖清单，也不授权初始化 React Native 工程。

工程实现必须同时满足以下不变量：

1. 除用户明确触发、且经 D-053 Provider/载荷用途准入为 `ALLOW` 的 AI 请求外，生产 App 不主动访问网络。
2. SQLite 是业务数据的本地真源；AI、Widget、HealthKit 和视图状态都不能成为隐式真源。
3. 任何外部输入先验证、后暂存；跨文件/SQLite/Keychain 边界使用 durable intent 与启动对账，保证 crash consistency，不能宣称全局原子事务。
4. API key、数据库密钥、备份口令和 Health 数据不得进入日志或普通数据库；是否允许用户主动创建明文 JSON/CSV 由 D-035 决定。
5. 权限在功能触发点申请；拒绝权限后仍提供手动路径或清晰的不可用状态。
6. 未经用户确认的框架和第三方库只允许出现在候选决策中，不得写成既定选型。

## 2. 权威决策

下表保留 Owner 于 2026-07-31 批准的 D-001 至 D-017 原始工程边界。2026-08-14 首批回读后，D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-037/D-038/D-047/D-048 也已 `ACCEPTED`；D-032 保持 `CANDIDATE + SPIKE_AUTHORIZED`，D-052/D-053 保持 `CANDIDATE`。正式权威来源始终是 `docs/00-governance/decision-register.md` 和 `project-ops/decisions.json`；本目录不得自行改变其状态。

| ID | 状态 | 已批准结论 | 工程影响 |
| --- | --- | --- | --- |
| D-001 | accepted | “全部功能”以公开可验证证据为边界 | 未验证行为保持 `EVIDENCE_GAP`，不伪造需求 |
| D-002 | accepted | 台湾食药署 + USDA Foundation/SR + 用户自建 | 来源隔离、许可随包、禁止打包无再分发许可的数据 |
| D-003 | accepted | 每人配置 OpenAI-compatible baseURL/model/key | BYOK，不存在内置共享主 key |
| D-004 | accepted | 仅 HTTPS | Release 拒绝 HTTP、自签名和不支持的 scheme |
| D-005 | accepted | Expo Development Build + Prebuild，并检入 `ios/` | 原生工程是受版本控制的源码，不可随意 clean-regenerate |
| D-006 | accepted | SQLite + 手动加密导入/导出，默认排除 iCloud | 无自动云同步；恢复和迁移必须可验收 |
| D-007 | accepted | 首版本地记录，HealthKit 第二阶段再决定 | 首版不依赖 HealthKit，也不提前请求权限 |
| D-008 | accepted | 开发阶段 TestFlight，长期渠道后定 | 不把 TestFlight 当作永久分发方案 |
| D-009 | accepted | 本地 JSONL 实时工作台 + 静态快照 | 工程通信记录写入本地 JSONL |
| D-010 | accepted | 完整功能地图先行，小批确认实现 | 架构支持分阶段交付，不擅自裁掉对标范围 |
| D-011 | accepted | iOS 17+ | 原生目标、测试矩阵和 API 可使用 iOS 17 基线 |
| D-012 | accepted | 数据随 App 发版 + Files 签名包导入 | 禁止运行时在线拉取食物数据 |
| D-013 | accepted | 能量、蛋白质、碳水、脂肪、纤维、糖、钠 | 数据模型保留原值、原单位、来源和缺失语义 |
| D-014 | accepted | AI 营养标签照片首次说明 + 每次预览确认 | 只覆盖营养标签照片；未确认前不得上传或落库，其他载荷待 D-033 |
| D-015 | accepted | SQLCipher + Keychain 数据库密钥 | 数据库密钥不随备份迁移，不出现在 JS 日志 |
| D-016 | accepted | 首发仅简体中文 | 首版测试基线为简中；数据来源原文仍需保留 |
| D-017 | accepted | 公开对标范围不删减、分阶段交付 | 技术分期不等于删除已确认能力 |

## 3. 文档地图

- [本地优先架构](architecture/local-first-architecture.md)：上下文、容器、依赖规则和关键数据流。
- [F01–F24 工程边界](architecture/feature-boundary-map.md)：产品功能地图到本地/AI/iOS 边界的交接映射。
- [安全与威胁模型](security/security-and-threat-model.md)：资产、信任边界、威胁、控制和删除语义。
- [离线数据包](data/offline-data-packs.md)：包格式、签名、许可、导入协议和启动对账。
- [加密备份与恢复](data/encrypted-backup-and-restore.md)：手动导出、加密封装、恢复和默认排除 iCloud。
- [iOS 原生能力边界](ios/native-capability-boundaries.md)：iOS 17、Expo/Prebuild、权限、后台、扩展、Mac 和分发限制。
- [测试策略](testing/test-strategy.md)：测试金字塔、真机矩阵、安全测试和发布门禁。
- [D-034 最低支持 iPhone benchmark 协议](testing/d034-minimum-iphone-benchmark-protocol.md)：固定三档同 corpus、21 行矩阵/19 项直接硬上限口径、真机采样、清理与失败关闭标准；当前只准备协议，未授权或执行 benchmark。
- [D-036 三 Provider/原生边界 Spike 协议](testing/d036-provider-native-compatibility-spike-protocol.md)：固定无密钥 OI-07 输入、36 个 Provider/profile/build/runtime 兼容单元与 13 个原生证据面；当前 Provider、Mac/Xcode、harness、联网和执行均未授权或未发生。
- [D-053 Provider 用途证据与 App Privacy 映射协议](testing/d053-provider-evidence-app-privacy-protocol.md)：固定三个 Provider、五类载荷、15 个最小准入 profile、150 项十维评估与至少 5 行 App Privacy 映射；当前 OI-07、Provider、证据采集、映射、签署、复核、Owner 与准入均未发生。
- [OI-07 Provider 目标统一输入模板](testing/oi07-provider-target-intake-template.md)：把 D-036/D-053 合并为同一 revision、三个 target、每 target 29 字段的无密钥回填面；当前模板已准备，Owner 输入未收到，全部 target 保持 `UNKNOWN/BLOCKED`。
- [OI-07 Provider target 本地校验合同](testing/oi07-provider-target-intake-harness.md)：以 11 项测试执行 3 target/29 字段/30 联合字段、UNKNOWN、来源 N/A、HTTPS、敏感材料与零授权边界；只输出计数/指纹，不回显 Provider 输入、不联网或授权。
- [视觉资产契约检查](testing/visual-kit-check.md)：Figma-ready 栗子视觉资产的本地结构与安全边界。
- [领域合同夹具](testing/domain-contract-harness.md)：七项营养、显式日期、每日汇总与基础内存 CRUD 的框架无关证据。
- [手工餐食保存合同](testing/manual-meal-entry-harness.md)：状态转换、Repository port、`commandId` 幂等和未知提交结果重放证据。
- [全量本地删除协调器合同](testing/local-wipe-coordinator-harness.md)：durable intent、严格删除顺序、未知回执对账、负向空状态，以及 evidence/verifier/profile 身份和 effect/observation/outcome 三层指纹；不冒充真实原生清理证据。
- [本地食品目录合同](testing/local-food-catalog-harness.md)：隔离来源的离线搜索、GTIN 精确查询、营养事实语义与未命中建档边界。
- [营养事实快照 V2](testing/nutrition-fact-snapshot-harness.md)：原始值/单位、basis、provenance、状态白名单与餐食保存往返合同。
- [餐食纠错事务合同](testing/meal-correction-harness.md)：EDIT/MOVE/DELETE 状态机、幂等回放、事务双快照证据与 V2 来源保真。
- [食品数据包预授权合同](testing/data-pack-contract-harness.md)：只收紧资源预算、严格被动 JSON/普通文件边界、manifest/entry/来源/转换一致性、不可变 subject 指纹和调用方验证声明绑定；不冒充真实验签或授权激活。
- [恢复启动对账观察合同](testing/backup-reconcile-harness.md)：结构化 generation 观察、intent/快照指纹绑定、写入关闭的未提交行动计划和执行后重新观察；不冒充文件/Keychain effect 或密码学验证。
- [F01/F02 不可信 AI 响应合同](testing/ai-response-contract-harness.md)：重复键/尾随数据/空候选/危险标签/资源预算失败关闭，规范化候选语义指纹、被动状态快照与零副作用边界。
- [AI Provider policy 与 D-053 门禁](testing/ai-policy-harness.md)：完整本地 policy profile、证据/风险/有效期/地区、精确 request subject 和 D-053 candidate/not-authorized 指纹绑定；零 key/body/network/write。
- [AI 请求证据共享上下文](testing/ai-request-evidence-context-harness.md)：以唯一 V2 上下文绑定精确 subject、完整 profile、D-053 evidence 和 policy-check；固定不证明 transport、不授予发送，供 F01/F02 与 F16 共同核验。
- [AI 配置与策略预检合同](testing/ai-configuration-policy-preflight-harness.md)：绑定稳定非敏感配置证据与共享请求上下文，精确比较 baseURL/origin/model；即使一致也因 providerId 未绑定和 D-033/D-034/D-036/D-053 保持阻断。
- [AI 凭据生命周期合同](testing/ai-credential-lifecycle-harness.md)：BYOK 配置/替换/移除、Keychain 类密钥槽、durable intent、未知结果对账与 fail-closed 网络门。
- [体重记录事务合同](testing/body-weight-record-harness.md)：F10 手工 kg/lb 原始输入、精确换算、同日多记录、revision CAS、幂等写入与完整趋势回执。
- [近七日摄入/消耗事实读模型](testing/seven-day-energy-trend-harness.md)：F11 七日本地日历窗口、摄入/消耗分流、缺失语义、精确能量聚合、来源反查与文字摘要。
- [手工消耗事实事务合同](testing/manual-burn-record-harness.md)：F13 直接能量输入、revision CAS、幂等事务与 `MANUAL_BURN / USER_ENTERED` 的 F11 投影。
- [饮水记录事务与当日汇总合同](testing/water-record-harness.md)：F14 原始容量、显式版本化单位定义、revision CAS、幂等事务、跨日修改与精确当日汇总。
- [本地提醒规则与调度对账合同](testing/local-reminder-reconcile-harness.md)：F15 本地规则 CRUD、opaque 规则定义、权限/规则 generation、pending/delivered 对账、未知平台结果恢复与旧状态防回滚。
- [日期事实与外部授权导航合同](testing/date-navigation-harness.md)：F08 显式 instant/IANA 时区/规则版本、DST 与午夜滚日、观察 generation、防陈旧请求，以及与请求指纹绑定的外部策略决定。
- [显式餐次定义与分组读模型合同](testing/meal-slot-grouping-harness.md)：F06 调用方版本化餐次定义、显式顺序、空餐次、未分配/旧定义分离、revision 反查与派生结果防篡改。
- [宏量目标版本事实与历史读取合同](testing/macro-target-history-harness.md)：F05 既有 P/C/F 目标原值、opaque 单位定义、来源/用户编辑状态、生效历史和实际事实联合读取；比较与舍入保持未指定。
- [每日能量事实账本合同](testing/daily-energy-ledger-harness.md)：F04 指定日期摄入/消耗精确聚合、来源 revision、既有能量目标生效历史与防篡改快照；Left 保持未授权。
- [AI 候选确认与幂等保存合同](testing/ai-candidate-confirmation-harness.md)：F01/F02 V3 状态/review/记录/命令/回执，完整 response、共享 request/policy、candidate 指纹链、用户确认值幂等保存、旧 V1/V2 失败关闭与成功后正文清理；不授权真实 transport、业务字段或自动改日记/目标。
- [F16 AI 参考草稿合同](testing/ai-guidance-reference-harness.md)：V2 状态/来源证据复用共享 request/policy 上下文，严格 opaque response、调用方内容/免责声明定义、来源/edit 指纹、本地 revision 编辑和放弃清理；所有 effect 为零，不授权 IA、保存、医疗安全、高风险用途或自动改日记/目标。
- [F03 本地条码查找编排合同](testing/barcode-lookup-orchestrator-harness.md)：完整 GTIN 本地精确查询、候选显式选择、目录证据绑定与未命中调用方建档；不授权相机、写库、AI 或网络回退。
- [F19 导入预检合同](testing/import-safety-harness.md)：严格 JSON/资源/路径碰撞边界、manifest/entry 精确集合、导入对象/调用方验证声明/活动状态指纹绑定与失败保持旧状态；不冒充真实验签或授权激活。
- [F09 营养事实与洞察可用性合同](testing/food-insight-availability-harness.md)：可信本地七项营养事实可用；评分、微量标签、风险和益处能力保留但内容零暴露，不授权算法、字段集、医学/个体化结论或 AI。
- [F01–F24 合同覆盖审计](testing/feature-contract-coverage.md)：逐项区分当前框架无关自动化证据、正式实现/原生缺口与 Owner 门禁，并给出下一工作包依据。
- [本地档案事务与非级联删除合同](testing/local-profile-record-harness.md)：F12/F17 调用方版本化 opaque schema、空文档、CRUD CAS、幂等/并发事务和相关领域证据不变。
- [本地数据访问清单合同](testing/local-data-access-manifest-harness.md)：F18 跨领域只读分页、空领域保留、snapshot/cursor/page 完整性与 App/原生/外部 Files 控制边界；不授权导出、备份或 mutation。
- [本地数据领域注册表与一致性读取合同](testing/local-data-access-registry-harness.md)：F18 唯一版本化领域注册表、generation/registry 绑定、每领域恰好一次读取、事务关闭回执与跨领域一致性端口；不选择 SQLite 访问层或宣称 SQLCipher 已实现。
- [媒体权限编排合同](testing/media-permission-orchestrator-harness.md)：F21 任务触发相机 effect、系统选择媒体零全库权限、拒绝/受限/撤权手工降级；不授权视频、定位、保留、持久化或真实原生调用。
- [禁止能力审计合同](testing/prohibited-capability-audit-harness.md)：F20/F23/F24 要求正式签名 Release Archive 和 27 个完整证据面；当前未初始化工作区、缺面或未执行均 fail closed 为 `BLOCKED`。
- [平台与语言 Release 审计合同](testing/platform-language-release-audit-harness.md)：F22 固定 D-011 iOS 17.0 与 D-016 简中，分离设备族/方向/Mac/Vision 四项未决维度，并要求签名 Archive 上 25 个发布证据面。
- [Choice UI 宿主只读审计](choice-ui-host-audit-2026-08-14.md)：区分 0.1.0 elicitation 文字 fallback 与 0.3.0 MCP Apps 内联控件，记录当前未安装/未启用状态、静态安全边界、协议测试和浏览器宿主模拟；不替 Owner 选择或修改 Gate。
- [ADR](adr/)：已批准架构决策的上下文与后果。
- [技术决策原始候选档案](decisions/decision-candidates.md)：保留 D-018 起在 2026-07-31 提交的 Options / Trade-offs / Recommended；当前状态必须回查决定台账，不能沿用档案顶部的历史 proposed 语义。
- [技术栈调研总览](technology-stack-research.md)：按已批准边界、候选库、原生能力和 Spike 证据解释 React Native 技术栈。

## 4. 进入实现前的门禁

以下条件全部满足后，才允许初始化或修改 React Native 工程：

1. 已接受的 D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-037 按决定台账实施；D-032 仍须原生证据与第二次 Owner 动作冻结最终矩阵，D-022 等尚未登记提案不得进入正式增量。
2. Mac、受支持 Xcode、iOS 17 模拟器和至少一台真实 iPhone 可用。
3. SQLCipher、Keychain、签名包和加密备份完成最小 Spike，失败路径有结果记录。
4. 数据许可清单、署名模板和测试数据集经过产品与数据负责人复核。
5. AI Provider 合约、HTTPS 校验、用户主动触发和零写入失败语义形成验收用例；营养标签照片按 D-014 验收逐次预览，其他载荷的预览范围待 D-033；D-053 未接受或 Provider policy 非 `ALLOW` 时真实载荷保持阻断。
6. CI 是否使用第三方云服务单独确认；未确认前只定义命令，不接入外部服务。

G4 当前保持 `IN_PROGRESS / 初版`。独立 [安全终审](../05-quality/security-review.md) 已完成，当前没有开放的安全协议文档发现，但总体 disposition 仍为 `BLOCKED`：D-026 冻结数据包签名与 key lifecycle，D-027 冻结二维备份密码学/流式认证 profile，D-034 冻结 AI 资源预算，D-036 冻结 URL/redirect/session profile，D-052/D-053 分别阻断 USDA 境外分发和 Provider 数据用途准入。D-030、D-031、D-033、D-035 仍分别阻断恢复语义、媒体/AI 保留、非标签载荷预览和明文导出能力。文档关闭不等于 Owner 已接受，也不等于实现、Mac/真机或 Release 证据通过；本目录不得自行标记 PASS。

## 5. 当前平台证据，不是版本决定

PM 于 2026-07-31 核验 Expo 官方 latest 页面：SDK 57.0.0 对应 React Native 0.86、React 19.2.3、Node 22.13.x；Expo 最低 iOS 16.4、Xcode 26.4。D-011 的 iOS 17+ 比 Expo 当前最低版本更严格，因此无冲突。

隔离 Windows JS Spike 已实际解析 Expo 57.0.12、React Native 0.86.2、React 19.2.3，并用 Node 22.13.0 / pnpm 11.18.0 通过 frozen install、TypeScript、Expo config、Doctor 20/20 与 Android Metro export。这只关闭已授权的 JS 子范围；Xcode/CocoaPods、Prebuild、SQLCipher/Keychain 原生链接、签名 Archive 和 iPhone 运行仍未验证，因此最终矩阵仍须 D-032 第二次 Owner 动作确认。

参考：

- <https://docs.expo.dev/versions/latest/>
- <https://docs.expo.dev/develop/development-builds/introduction/>
- <https://docs.expo.dev/workflow/continuous-native-generation/>
- <https://docs.expo.dev/versions/latest/sdk/sqlite/>
- <https://docs.expo.dev/versions/latest/sdk/securestore/>
- <https://reactnative.dev/architecture/landing-page>
