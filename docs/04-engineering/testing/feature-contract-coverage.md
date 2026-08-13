# F01–F24 合同覆盖审计

状态：`WORKING COVERAGE MAP / NON_PRODUCTION`

日期：2026-08-13

本表把 [验收追踪基线](../../02-product/acceptance-traceability.md)、[工程边界](../architecture/feature-boundary-map.md) 与当前框架无关 harness 对齐。`已覆盖` 只表示列出的合同边界已有自动化证据，不等于组件、SQLite/SQLCipher、React Native、原生、真机或 Release 验收完成。

| Feature | 当前自动化合同 | 已证明的边界 | 未完成/权威门禁 | 审计结论 |
| --- | --- | --- | --- | --- |
| F01 AI 拍照识餐 | `ai-policy`、`ai-response-contract`、`ai-credential-lifecycle`、`ai-candidate-confirmation` | policy fail-closed、恶意响应预算、BYOK 生命周期、易失候选、显式 review、用户确认值幂等保存与零真实网络 | D-031/D-033/D-034/D-036/D-053、真实图片输入/transport/组件/抓包 | Application 确认事务已覆盖，产品/原生阻断 |
| F02 AI 文字识餐 | 同 F01 | Provider 失败保留本地输入、严格候选、request/policy/candidate 绑定与明确保存前零写入 | 正式文字字段/映射、显式 Provider UI、真实 transport；D-033/D-053 | Application 确认事务已覆盖，产品/网络阻断 |
| F03 条码 | `data-pack-contract`、`import-safety`、`local-food-catalog` | 离线来源隔离、GTIN 精确查询、未命中手工路径、无网络回退 | 数据包签名算法 D-026、许可 D-052、相机/组件/真机 | 数据合同已覆盖，原生阻断 |
| F04 日热量账本 | `daily-energy-ledger`、`seven-day-energy-trend` | 指定日摄入/消耗精确事实、目标生效历史、缺失/零、来源反查 | Left 公式、缺失消耗、负值、舍入与 UI 待 D-040/Owner | 事实层已覆盖，公式阻断 |
| F05 宏量目标 | `macro-target-history`、`domain-contract` | P/C/F 实际缺失语义、目标原值/单位定义/来源/用户编辑/历史 | 目标算法、grams/percent、比较、舍入、编辑与 UI 待 D-040/Owner | 事实层已覆盖，算法阻断 |
| F06 餐次 | `meal-slot-grouping`、`meal-correction` | 显式版本化定义、顺序、空餐次、未分配/旧定义、移动事务底座 | 默认餐次数量/名称、自定义规则、组件/E2E | 读模型已覆盖，产品规则阻断 |
| F07 日志详情 | `manual-meal-entry`、`meal-correction`、`nutrition-fact-snapshot` | 营养快照保存、编辑/移动/删除 CAS、幂等与来源保真 | 高级操作范围、组件/E2E、正式 Repository | 核心事务合同已覆盖 |
| F08 日期导航 | `date-navigation`、`domain-contract` | 显式观察、IANA/DST/午夜、generation、外部策略绑定 | 未来日、补记、跨时区重基、默认今天和 UI | 事实/策略边界已覆盖 |
| F09 营养/评分/洞察 | `nutrition-fact-snapshot`、`local-food-catalog`、`domain-contract` | 七项营养原值/单位/basis/provenance/缺失/估算 | 评分、微量字段全集、风险/益处来源与组件 | 基础事实已覆盖，评分阻断 |
| F10 体重 | `body-weight-record` | kg/lb 原值、精确换算、同日多笔、CRUD CAS、趋势重算 | 显示精度、异常、BMI/目标、同日展示、组件/E2E | 核心事务合同已覆盖 |
| F11 摄入/消耗洞察 | `seven-day-energy-trend` | 七日本地日历窗口、事实分流、缺失/零、精确聚合、文字摘要 | 更长周期、平均/净值/目标、组件/图表无障碍 | 已证范围读模型覆盖 |
| F12 画像/目标 | `local-profile-record`、`macro-target-history`、`daily-energy-ledger` | 版本化 opaque 档案 CRUD、非级联删除、既有目标事实历史 | 最小字段、公式、资料与目标关系、多档案产品策略 | 核心档案事务覆盖，字段/公式阻断 |
| F13 消耗/运动/步数 | `manual-burn-record`、`seven-day-energy-trend` | 手工能量 CRUD、来源标记、F11 投影 | 运动字段/公式、步数、HealthKit、组件；D-007 | 手工消耗覆盖，系统能力阻断 |
| F14 饮水 | `water-record` | 原始容量、显式单位定义、精确汇总、CRUD CAS | 快捷量、目标、展示单位、撤销、趋势、组件 | 核心事实/事务覆盖 |
| F15 提醒 | `local-reminder-reconcile` | opaque 本地规则 CRUD、权限独立、generation、pending/delivered 对账 | 类型/重复/内容/DST 默认、真实 UserNotifications/真机 | 应用合同覆盖，原生阻断 |
| F16 AI 健康/食谱/计划 | F01/F02 公共 AI harness | policy/响应/凭据 fail-closed | 载荷/IA/保存/非医疗/高风险、Provider 许可和真实 transport；D-033/D-053 | 公共底座部分覆盖，阻断 |
| F17 本地档案替代账号 | `local-profile-record` | 无账号/服务器能力面、版本化 opaque 文档、CRUD CAS、幂等/并发与非级联删除 | 当前/多档案 UX、正式 Repository/组件/E2E | 核心本地事务覆盖 |
| F18 数据权利 | `local-data-access-manifest`、`local-data-access-registry`、`local-wipe-coordinator`、`meal-correction`、`body-weight-record` 等 | 唯一版本化领域注册表、一致性只读事务端口、跨领域分页清单/完整性证明、全量 wipe kill-point/对账、领域更正/删除底座 | 首发真实领域 adapter、SQLCipher snapshot transaction、UI、真实容器/Keychain/UserNotifications、备份范围/真机 | 注册/一致性端口与应用内访问覆盖，正式适配/原生阻断 |
| F19 缓存/同步替代 | `backup-reconcile`、`import-safety`、`local-wipe-coordinator` | generation/pointer、导入安全、失败关闭 | D-027 加密 envelope/KDF、恢复模式 D-030、SQLite/Keychain/Files 真机 | 对账模型覆盖，加密/原生阻断 |
| F20 移除会员 IAP | `prohibited-capability-audit`（当前 `BLOCKED`） | 工作区零发现不得判通过；锁定源码/依赖/原生配置/plist/entitlement/UI/二进制/Store 目录/Release 网络 9 面 | 正式签名 Release Archive 上执行全部报告 | fail-closed 聚合合同覆盖；生产证据仍缺 |
| F21 媒体权限 | `media-permission-orchestrator`、D-039 原型 smoke | 任务触发相机 effect、系统选择媒体零全库权限、拒绝/受限/撤权手工降级、迟到回执拒绝 | 权限文案、媒体保留 D-031、正式 adapter、Info.plist/真实相机/照片真机 | 应用编排覆盖，产品文案/保留/原生阻断 |
| F22 平台/语言 | `platform-language-release-audit`（当前 `BLOCKED`）、视觉/原型 smoke | 锁定 D-011 iOS 17.0、D-016 简中和 25 个 Release 证据面；不从 D-038/当前设备推导平台形态 | 正式签名 Archive；设备族/方向/Mac/Vision 四项决定；模拟器/真机/商店/布局/无障碍报告 | fail-closed 聚合合同覆盖；决定与生产证据仍缺 |
| F23 移除广告/分析 | `prohibited-capability-audit`（当前 `BLOCKED`） | 锁定源码/依赖/原生配置/plist/entitlement/PrivacyInfo/framework/二进制/Release 网络 9 面 | 正式签名 Release Archive 上执行全部报告；DATA-07 仍 pending | fail-closed 聚合合同覆盖；生产证据仍缺 |
| F24 无定位 | `prohibited-capability-audit`（当前 `BLOCKED`） | 锁定源码/依赖/原生配置/plist/entitlement/PrivacyInfo/二进制/权限捕获/Release 网络 9 面 | 正式签名 Release Archive、运行时权限和网络证据 | fail-closed 聚合合同覆盖；生产证据仍缺 |

## 本轮选择与完成

本轮选择并完成了 F12/F17 的本地档案事实合同，原因是它同时满足：

1. 属于 W2 本地闭环的真实缺口；
2. 不需要 Mac、原生 API 或真实网络；
3. 可以在不选择资料字段、不选择单/多档案、不运行公式的前提下建立完整的校验、CAS、幂等、纠错和删除边界；
4. 能明确阻止“删除资料”静默级联删除 GoalVersion、BodyRecord、日记或备份。

合同没有把 opaque 测试 payload 变成产品字段批准，也没有把 profile ID 集合解释为已批准多档案 UX。F12 的字段/公式/关联语义仍须由 D-040 和 Owner 决定。

F18 已从“缺清单合同”继续推进到注册与一致性端口门禁：`local-data-access-manifest` 覆盖跨领域、只读、可分页/可追溯且不等同明文导出的访问清单；`local-data-access-registry` 要求唯一版本化领域注册表、每个领域恰好一次读取、generation/registry 绑定和完成/中止关闭回执，并证明内存事务期间的源写入不会造成跨领域混代。两者都明确区分 App 控制内业务数据、不得返回的 Keychain secret、需要原生枚举的受控容器与用户选择的外部 Files 备份。后续仍必须在批准的访问层上实现首发真实领域 adapter 与 SQLCipher snapshot transaction，并完成用户可访问 UI 和原生 inventory/真机证据；D-020/D-035/D-027/D-030 仍未授权。

随后补上 F01/F02 的 AI 候选确认 Application 缺口：`ai-candidate-confirmation` 复用严格 response contract，保留 transport/响应失败前的易失本地输入，要求 candidate 选择、caller-owned confirmed value 和显式 review 后才生成保存 effect；effect 不携带原始输入或 AI candidate，提交后未知结果只用原命令重放，成功后清除易失输入。它不决定正式业务字段或映射，不授权 D-031/D-033/D-034/D-036/D-053、真实 transport、SQLite/SQLCipher、自动修改日记/目标、组件或原生实现。

随后完成 F21 的应用编排缺口：`media-permission-orchestrator` 将相机、系统用户选择媒体和手工输入分离，只在当前用户任务且权限未决定时经过任务说明产生窄相机 effect；拒绝、受限、撤权、取消和迟到回执都保持手工路径。照片全库、视频、定位、媒体保留/持久化、真实原生调用和 AI 上传继续未授权；下一步仍需权限文案、D-031、正式 adapter、Info.plist 和真机证据。

F20/F23/F24 随后补上禁止能力审计聚合合同。它不把当前未初始化工程的“零发现”包装成验收通过，而是要求正式签名 Release Archive 以及 27 个与工件绑定的完整证据面；缺正式目标、缺面、未执行或任一发现均为 `BLOCKED`。当前实际状态仍是 `FORMAL_TARGET_ABSENT + REQUIRED_SURFACE_MISSING`，没有执行生产工件扫描、Release 网络捕获或运行时定位权限捕获，也没有关闭任何门禁。

F22 也补上平台与语言 Release 聚合合同：D-011 的 iOS 17.0 与 D-016 的首发简中被固定为已接受输入，但设备族、方向、Mac availability 和 Vision Pro availability 分别保持未决定，不能从 D-038、当前 iPhone 或工具默认值推导。正式通过还要求签名 Archive 上 25 个配置、商店、模拟器、真机、布局与无障碍报告；当前结论为 `FORMAL_TARGET_ABSENT + PLATFORM_SHAPE_DECISION_REQUIRED + REQUIRED_SURFACE_MISSING`。
