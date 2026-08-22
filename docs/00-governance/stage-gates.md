# 阶段门禁 G0-G8

## 判定规则

- `PASS`：所有必需退出条件已有可复核证据。
- `CONDITIONAL_PASS`：允许下一阶段开展有限工作，但条件、责任人和期限明确；不得用于绕过安全、数据完整性或 Owner 决策。
- `FAIL`：存在阻断条件，不能进入下一阶段。
- `IN_PROGRESS`：正在形成证据，不是门禁结论。
- 门禁由 PM 组织，相关专业角色签署审查意见，Owner 对范围、重大风险与发布拥有最终决定权。

## 当前快照

| Gate | 名称 | 状态 | 2026-08-21 证据/缺口 |
| --- | --- | --- | --- |
| G0 | 项目立项 | PASS | 章程、本地硬边界、角色模型、28 项 Owner 决定已接受 |
| G1 | 调研可信 | PASS | 24 类、66 条行级证据：37 confirmed、24 cross-source、5 pending；另有 9 组跨行 gap themes；D-001 确认公开口径 |
| G2 | 产品基线 | IN_PROGRESS | F01-F24、REQ-F01-F24、AT-F01-F24 集合完整；五项追踪整改最终复验通过；首批 Owner 输入已确认，仍需冻结首个 MVP 增量与后期范围边界 |
| G3 | 体验基线 | IN_PROGRESS | IA、13 条关键旅程、状态/内容/无障碍和 AT 反向索引已形成；D-038 四入口导航已接受，D-039 方案 A 已冻结 PX-4，首次 PX-5 DoR 为 NOT_READY，B01/B02 已关闭、B03~B07 开放；B03 的 D-045、B04 的 D-031、B05 的 D-033/D-034/D-036/D-053 六张内部卡与 D-040 前三批十三卡均通过自审。D-039 六卡统一独立复核包已形成并固定 10 份输入、3 个阻断项、4 个复核域和 16 条跨卡不变量；10 项输入清单已冻结并记录 blob OID/SHA-256，但具名复核人未指派且复核未开始。D-040 十三卡独立复核包、中国健康评审交接包和四张宏量轴卡独立复核包也已形成；宏量包 10 份输入已绑定同一提交的原始 Git blob 与规范 SHA-256，且两类具名复核人、D-063/D-070 接受、健康数值边界与文案、身份/资质/独立性核验、实际复核、批准和独立 Content QA 缺失；未进入 Owner 评审 |
| G4 | Build Ready | IN_PROGRESS | 工程基础选择已接受；D-032 隔离 SDK 57 Windows JS Spike 的冻结安装、类型检查、Expo 配置、Doctor 20/20 与 Android 1,652/iOS 条件 1,565 模块 Metro export 已通过，Android/iOS export 共用核心已自动失败关闭额外平台、非批准资产类型、路径越界、未声明文件和原生目录，SQLite/SecureStore/Camera/Notifications/Reanimated/Worklets 六个符号已进入 JS/类型路径且原生调用为零，但 D-032 仍为候选。合并后全库 1066/1066，ProjectOps 为 5 份 Schema/318 个实例。D-039=A 的 PX-5 仍有 B03~B07 共 5 个 Owner/环境阻断项；六卡复核包只达到 `PACKET_READY`，10 项输入已冻结并记录 blob OID/SHA-256，不等于独立复核、外部证据、Owner 评审或实现授权；20 项本地回执 validator 只校验 frozen packet/四域/六卡/16 不变量/P0~P3/disposition/双 SHA-256，合成 fixture 不构成正式回执或 PASS。D-040 NIDDK 动态模型来源可行性与 NIH 官方 `TAB-2436 / E-160-2012-0`、`Prototype / Licensing` 路径已核验，但当前七项资产覆盖、逐文件许可、稳定版本、官方 oracle corpus、回归容差、保护线和健康评审仍未通过；十三卡复核包、四卡复核包与健康评审交接包就绪都不等于复核已开始或通过；20 项十三卡本地回执 validator 只校验七份 frozen 输入、四域 attestation、十三卡、十二条跨批不变量、P0~P3、disposition 与双 SHA-256，合成 fixture 不构成正式回执、具名复核或 PASS；20 项健康评审回执 validator 只校验 frozen packet/九输入/十三项/具名资质与签署声明/90 天/P0~P3/disposition/双 SHA-256，合成 fixture 不构成正式回执、健康批准或 Content QA PASS；四卡包 10 份输入已冻结并记录 blob OID/SHA-256；20 项四卡本地回执 validator 只校验同一 packet/十输入/四域/四卡/14 不变量/P0~P3/disposition/双 SHA-256，合成 fixture 不构成正式回执、具名复核或 PASS，生命周期卡不授权持久化。D-063 已固定来源，D-070 已固定输入形态，D-071 已固定显示舍入边界，D-072 已固定硬停止不可豁免、无目标事实不创建目标、历史不删不回算和数据控制持续可用；但 WS/T 578.1-2017 参考带仍只作信息，不授权默认目标、GoalVersion、评分或纠正，D-063/D-070 接受、D-068/D-069、健康数值边界与文案、Content QA 和独立复核均未关闭。F01/F02/F16 共享 request subject/profile/D-053/check 证据、AI 配置—策略预检、不可信响应、完整候选指纹、F18 删除、F19 恢复/导入、F03 数据包/条码、F09 及其他框架无关合同继续 fail closed，但不证明真实 Provider/schema/营养真值、transport 或发送许可；Windows 平台 JS export 也不证明原生运行或可复现构建。D-033/D-034/D-036/D-053 仅完成内部卡；D-034 benchmark 协议、13 项本地 manifest 校验、raw run/report 合同与 17 项本地失败关闭 validator 虽已准备，但 39 条缩小合成记录只验证算法且不落盘，真实 raw run/report 为 0，真实 corpus、最低设备/Mac/Xcode/隔离原生 harness/实测仍未完成，D-036/D-053 共用 OI-07 模板与 11 项本地失败关闭校验合同已固定同一 revision、3 个 slot、每 target 29 字段和 30 个联合字段，但 Owner 输入仍为 0；D-036 Provider/原生兼容协议已固定无 key OI-07 输入、36 个兼容单元、13 个原生边界面及离线 10 次/Provider 路径 3 次重复，但 OI-07/Provider 目标/Mac/Xcode/原生 harness/合成 corpus/凭证注入/真实网络授权/执行与结果/独立复核、D-053 Provider 证据/App Privacy 协议已固定 3 个 Provider、5 类 payload、15 个最小 profile、150 项十维评估和至少 5 行映射，但 OI-07/Provider/证据采集与快照/映射/具名签署/独立复核/Owner/准入、正式根工程、SQLCipher/Keychain、Prebuild、Mac/Xcode/CocoaPods、原生真机和 Release 证据仍未关闭 |
| G5 | 增量验收 | FAIL | 尚无经批准的实现增量与工程 |
| G6 | Beta Ready | FAIL | 尚无 Mac/iPhone 构建、真机、迁移与飞行模式证据 |
| G7 | Release Ready | FAIL | 尚无候选构建、发布授权、回退和分发检查 |
| G8 | 复盘关闭 | FAIL | 项目未结束 |

`FAIL` 在尚未达到对应阶段时表示退出条件不存在，不表示项目异常。

## G0：项目立项

必需证据：

- 项目章程与成功定义。
- Owner、PM、专业角色与决策权。
- 本地优先、AI、数据、平台和分发硬边界。
- 初始风险与决策台账。
- Git、发布与外部变更授权规则。

当前结论：PASS。

## G1：调研可信

必需证据：

- 竞品身份、版本、开发者和平台锁定。
- 可复核来源台账和证据强度定义。
- 细粒度功能矩阵与公开缺口。
- 事实、跨来源确认、推断和未知项分离。
- 本地化分类与不能原样复制的产品边界。

当前结论：PASS。D-001 已将验收口径定义为公开可验证资料；行级证据状态固定为 `37 + 24 + 5 = 66`。EG-01~EG-09 是 9 组跨行聚合的公开缺口主题，不是额外 9 条 pending，也不能与 66 相加。5 条 pending 与 9 组主题保留为验证/机会清单，不作为 G1 阻断条件。

## G2：产品基线

退出条件：

- 完整能力地图与稳定 Feature/Requirement ID。
- 每项能力的 Nuttie 去向：对标实现、本地替代、自有增强、机会项或明确排除。
- 版本分期、依赖、验收标准与非功能需求。
- 账号/会员/云同步等竞品边界已转换为本地产品行为。
- 产品、设计、架构、安全、QA 完成跨角色审查。
- 任何影响范围的候选决定已由 Owner 处理。

当前状态：`IN_PROGRESS`。能力、需求和验收主键已经 24/24 对齐，F13 已明确区分 confirmed 的 Burned/近 7 日消耗与 cross-source 的运动/步数。[五项追踪整改最终复验](../05-quality/traceability-review.md) 已通过；首批 Owner 输入已经整批确认。当前只需冻结首个 MVP 增量与后期范围边界，不再等待 D-052/D-053 关闭本地自用、无第三方 AI 的开发路径。

## G3：体验基线

退出条件：

- 信息架构、核心导航候选与关键用户旅程。
- 正常、空、加载、离线、权限拒绝、AI 取消/失败、数据缺失、备份错误等状态。
- 简体中文内容原则、健康免责声明和 AI 信任提示。
- iOS 17 动态文字、VoiceOver、对比度、点击目标和减少动态效果标准。
- 产品、架构、安全与 QA 审查完成。
- 视觉方向和关键交互若存在多种实质方案，已提交 Owner 决定。

当前状态：`IN_PROGRESS`。关键旅程与状态已建立 AT-F01~AT-F24 反向索引；D-038 四入口导航已经接受。D-039 添加餐食首层原型已关闭 D039-QA-001 至 QA-010，Owner 已选择 A，PX-4 设计基线已冻结；PX-5 和正式实现仍未授权。D-040 的公式与治理证据复审已归零，20 个决定轴及 D-054~D-072 候选 ID 已分配；前三批十三卡完成四域自审，十三卡独立复核包、中国健康评审交接包、四张宏量轴卡独立复核包与 WS/T 578.1-2017 中国宏量现行标准证据完成。四卡复核包 10 份输入已冻结并记录 blob OID/SHA-256；NIDDK 动态模型来源可行性与官方许可路径已核验，但七项资产覆盖未确认且采用证据未通过；整体仍是 `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`。三个包都只是 `PACKET_READY`，具名复核人、身份/资质/独立性核验、逐条复核、D-063/D-070 接受、健康数值边界与文案、健康批准和独立 Content QA 未完成，D-063、D-070、D-071、D-072 及 D-062/D-059 动态模型项均未 Owner-ready，不得提前提交 Owner。

## G4：Build Ready

退出条件：

- 系统上下文、容器、数据流、离线边界和 AITransport 边界。
- SQLCipher/Keychain、备份、数据包导入、迁移、删除和故障恢复设计。
- Expo Development Build + Prebuild、`ios/` 管理与 Mac 构建策略。
- ADR：已接受决定标为 accepted，未决定的库级选择保持 candidate。
- 威胁模型、隐私数据清单、权限矩阵和许可证登记。
- 测试策略覆盖单元、组件、集成、端到端、原生、真机和飞行模式。
- 安全与 QA 无阻断项；Owner 处理 D-018+ 必需候选。

当前状态：`IN_PROGRESS`。独立 [安全终审](../05-quality/security-review.md) 已关闭 3 高、5 中、2 低的协议文档发现，但总体 disposition 仍为 `BLOCKED`；D-026、D-027、D-034、D-036、D-052、D-053 及相关产品候选未接受，也没有实现、跨工具 corpus、Mac/iPhone、kill/restart 或 Release 抓包证据。文档关闭不等于 Build Ready。

## G5：增量验收

每个增量独立检查：

- 已批准的 DoR 与可运行实现。
- 需求、设计、代码和测试双向追踪。
- 自动化测试、独立 Code Review 与 QA 探索测试。
- 数据迁移、异常路径、无障碍和断网证据。
- 已知问题、风险接受与用户可见变化。

## G6：Beta Ready

- Mac/Xcode 原生构建通过。
- 真实 iPhone 完成安装、升级、相机、通知、Keychain、备份、恢复和权限测试。
- 飞行模式核心旅程通过；只有用户主动 AI 请求尝试联网。
- 性能、存储、数据包导入和损坏恢复符合门槛。
- TestFlight 元数据、隐私说明与 Beta 反馈路径准备完成。

## G7：Release Ready

- Owner 明确授权候选构建与具体分发动作。
- 回归、阻断缺陷、依赖许可证、安全和隐私最终检查通过。
- 发布说明、备份提醒、已知限制、回退/恢复方案完成。
- 长期渠道若涉及，已由新的 Owner 决定接受。

## G8：复盘关闭

- 目标与成功指标复核。
- 事故、缺陷逃逸、决策质量和流程数据复盘。
- 后续行动有 Owner、期限和验证方式。
- 文档、事件与静态快照归档。
