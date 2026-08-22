# Nuttie G3 体验架构草案

| 字段 | 内容 |
| --- | --- |
| 状态 | `DRAFT_FOR_REVIEW` |
| 基线日期 | 2026-07-31 |
| 适用范围 | D-001 至 D-017 已批准边界下的完整体验架构 |
| 负责人 | 产品设计 / UX |
| 审查方 | 产品、移动架构、隐私安全、QA、Owner |
| 门禁 | G3；本文档集不代表 G3 已通过 |

## 1. 文档集

| 文件 | 目的 |
| --- | --- |
| [experience-principles-and-jobs.md](experience-principles-and-jobs.md) | 目标用户、Jobs、非目标、体验原则与证据语言 |
| [information-architecture.md](information-architecture.md) | 与界面框架无关的完整逻辑信息架构和 24 类能力覆盖 |
| [key-user-journeys.md](key-user-journeys.md) | 首启、记录、AI、洞察、提醒、导入导出和清除等关键旅程 |
| [states-content-accessibility.md](states-content-accessibility.md) | 离线、AI、权限、空态、错误态、简中文案和无障碍基线 |
| [open-decisions.md](open-decisions.md) | 体验选项总表；D-038/D-039 已接受，其余仍须 Owner 明确确认 |
| [prototype-and-owner-review-workflow.md](prototype-and-owner-review-workflow.md) | “先原型、跨角色评审、Owner 明确选择、再实现”的 PX-0~PX-5 门禁 |
| [prototype-manifest.md](prototype-manifest.md) | D-038 A/B/C 交互原型的同源路径、范围、哈希、自测证据和已知限制 |
| [d039-prototype-manifest.md](d039-prototype-manifest.md) | D-039 添加餐食首层 A/B/C 冻结原型、PX-2 证据和历史选择边界 |
| [d039-px4-design-baseline.md](d039-px4-design-baseline.md) | D-039=A 的首层层级、返回、状态、无障碍和 PX-5 阻断基线 |
| [D-039 PX-5 实现就绪评估](../05-quality/d039-px5-dor-assessment.md) | 首次 DoR 的 1/3/3 结论、B01/B02 关闭与剩余 5 个阻断项 |
| [D-039 正式验收矩阵](../05-quality/d039-formal-acceptance-matrix.md) | 24 条实现无关验收用例及写入、联网、依赖和原生证据边界 |
| [D-039 路由与可观测性契约](d039-route-observability-contract.md) | 5 个逻辑 route、严格参数、43 个静态 testID、返回焦点和非法 deep-link 失败关闭规则 |
| [D-039 B03~B05 六卡独立复核包](d039-b03-b05-independent-review-packet.md) | 10 份输入、6 卡逐项处置、3 个阻断项、4 个复核域、16 条跨卡不变量与 P0~P3 标准；10 项输入已冻结并记录 blob OID/SHA-256；[回执机器合同](../04-engineering/testing/d039-independent-review-record-contract.md)与[20 项本地 validator](../04-engineering/testing/d039-independent-review-record-harness.md)已准备，但正式回执、复核人和 PASS 仍为 0/false |
| [D-045 最近使用与收藏选择卡](d045-recent-favorites-card-spec.md) | B03 的三套完整政策包、清除/删除语义和内部四域自审；尚未独立复核或展示给 Owner |
| [D-031 媒体与 AI 内容保留选择卡](d031-media-ai-retention-card-spec.md) | B04 的三套完整政策包、临时内容清理、备份/删除语义和内部四域自审；尚未独立复核或展示给 Owner |
| [D-033 非标签 AI 上传确认选择卡](d033-nonlabel-ai-confirmation-card-spec.md) | B05 的三套完整政策包、D-014 保留范围、单次绑定/失效和内部四域自审；尚未独立复核或展示给 Owner |
| [D-034 AI 资源预算选择卡](d034-ai-resource-budget-card-spec.md) | B05 的三套固定预算政策包、19 项直接硬上限、超限清理和内部四域自审；[最低支持 iPhone benchmark 协议](../04-engineering/testing/d034-minimum-iphone-benchmark-protocol.md)、[corpus manifest 合同](../04-engineering/testing/d034-benchmark-corpus-manifest-contract.md)、[本地校验](../04-engineering/testing/d034-benchmark-corpus-manifest-harness.md)、[raw run/report 合同](../04-engineering/testing/d034-benchmark-run-report-contract.md)与[17 项本地 report validator](../04-engineering/testing/d034-benchmark-run-report-harness.md)已准备并覆盖 21 行矩阵、85 个必需槽位与 38 个边界/+1；39 条缩小合成记录只验证算法且不落盘，真实 raw run/report 为 0；本地校验不物化 corpus，真实 corpus、设备/工具链/隔离原生 harness/执行/结果仍缺失，尚未独立复核或展示给 Owner |
| [D-036 AITransport 隔离选择卡](d036-ai-transport-profile-card-spec.md) | B05 的三套 URL/redirect/session 政策包、显式 cache/cookie/credential 隔离和内部四域自审；[Provider/原生兼容协议](../04-engineering/testing/d036-provider-native-compatibility-spike-protocol.md)已固定无 key OI-07 输入、36 个兼容单元、13 个原生边界面和重复标准，但 OI-07/Provider/工具链/harness/corpus/凭证/联网/执行结果仍缺失，尚未独立复核或展示给 Owner |
| [D-053 AI Provider 用途准入选择卡](d053-ai-provider-use-admission-card-spec.md) | B05 的三套用途准入政策包、十维 Provider 真相、App Privacy 映射和旧 harness 边界；[Provider 证据/App Privacy 协议](../04-engineering/testing/d053-provider-evidence-app-privacy-protocol.md)已固定 3 个 Provider、5 类 payload、15 个最小 profile、150 项十维评估与至少 5 行映射，但 OI-07/Provider/采集/快照/映射/签署仍缺失，尚未独立复核或展示给 Owner |
| [d040-prototype-manifest.md](d040-prototype-manifest.md) | D-040 首启资料与目标 A/B/C 原型，以及字段/公式输入缺口 |
| [d040-px0-input-research.md](d040-px0-input-research.md) | D-040 的字段、能量公式、持久化、删除和特殊人群 PX-0 候选研究；不代表 Owner 已选择 |
| [d040-macronutrient-evidence.md](d040-macronutrient-evidence.md) | D-040 的 P/C/F 宏量营养公开证据、换算合同和未批准候选规则；不代表 Owner 已选择 |
| [d040-question-allocation.md](d040-question-allocation.md) | D-040 的 20 个独立决定轴、D-054~D-072 候选 ID 预留、依赖顺序和固定安全不变量 |
| [d040-first-batch-card-spec.md](d040-first-batch-card-spec.md) | D-054/D-055/D-056/D-058 第一批年龄、保留、表示和分支选择卡；等待独立复核 |
| [d040-energy-model-batch-card-spec.md](d040-energy-model-batch-card-spec.md) | D-057/D-059/D-060/D-061/D-062 第二批能量、活动、REE 与增减重路径卡；动态模型采用证据和独立复核仍缺 |
| [d040-data-lifecycle-batch-card-spec.md](d040-data-lifecycle-batch-card-spec.md) | D-064/D-065/D-066/D-067 第三批保存、删除、舍入与重算卡；等待独立复核 |
| [d040-china-support-health-review-input.md](d040-china-support-health-review-input.md) | D-040 中国大陆支持称谓、12356/120 用途、候选简中文案与健康评审责任/复核周期；具名健康评审人仍缺失 |
| [d040-china-macronutrient-standard-input.md](d040-china-macronutrient-standard-input.md) | D-040 中国现行 WS/T 578.1-2017 成人 P/C/F 参考带、4/4/9、修订监视与禁止默认/处方边界；D-063 尚未 Owner-ready |
| [d040-macro-target-source-card-spec.md](d040-macro-target-source-card-spec.md) | D-063 无目标、中国健康成人参考带信息、用户自定义三项互斥来源卡；健康/Content QA/独立复核未通过，尚未 Owner-ready |
| [d040-custom-macro-input-shape-card-spec.md](d040-custom-macro-input-shape-card-spec.md) | D-070 完整克数、完整 100% 比例、显式部分克数三项互斥输入卡；D-063/健康/独立复核未通过，尚未 Owner-ready |
| [d040-macro-display-rounding-card-spec.md](d040-macro-display-rounding-card-spec.md) | D-071 三项互斥显示策略、来源/派生单位、raw/display、十进制舍入与残差披露卡；D-063/D-070/健康/独立复核未通过 |
| [d040-hard-stop-record-availability-card-spec.md](d040-hard-stop-record-availability-card-spec.md) | D-072 硬停止后允许无目标事实或暂停新增的二选一卡；硬停止不可豁免，健康/Content QA/独立复核未通过 |
| [d040-macro-axis-independent-review-packet.md](d040-macro-axis-independent-review-packet.md) | D-063/D-070/D-071/D-072 四卡、四复核域、十四条跨轴不变量与 P0~P3 标准；十份输入已冻结并记录 blob OID/SHA-256，复核人未指派且复核未开始 |
| [D-040 四张宏量轴卡独立复核回执合同](../04-engineering/testing/d040-macro-axis-independent-review-record-contract.md) / [20 项本地 validator](../04-engineering/testing/d040-macro-axis-independent-review-record-harness.md) | 固定同一 frozen packet、十输入、四域 attestation、D-063/D-070/D-071/D-072 四卡、十四条跨轴不变量、P0~P3、disposition 与双 SHA-256；合成 fixture 非正式证据，真实回执、复核人核验与权威 PASS 均为 0/false |
| [d040-niddk-dynamic-model-feasibility-input.md](d040-niddk-dynamic-model-feasibility-input.md) | NIDDK 动态模型的论文/方程/当前网页代码表面、hash 与采用缺口；许可、稳定版本、oracle corpus、保护线和健康评审未通过 |
| [d040-china-health-reviewer-intake-packet.md](d040-china-health-reviewer-intake-packet.md) | D-040 中国健康评审九工件/十三项签署交接包、具名资质/利益冲突与独立 Content QA 门禁；评审尚未开始或批准 |
| [D-040 健康评审回执合同](../04-engineering/testing/d040-china-health-review-record-contract.md) / [20 项本地 validator](../04-engineering/testing/d040-china-health-review-record-harness.md) | 固定同一 frozen packet、九输入、十三项、资质/范围/地域/冲突/签署声明、90 天、P0~P3、disposition 与双 SHA-256；合成 fixture 非正式证据，真实回执、评审人核验、健康批准和 Content QA 均为 0/false |
| [d040-first-three-batches-independent-review-packet.md](d040-first-three-batches-independent-review-packet.md) | D-040 前三批十三卡的四域独立复核、十二条跨批不变量与 P0~P3 关闭标准；复核人未指派且复核未开始 |
| [D-040 十三卡独立复核回执合同](../04-engineering/testing/d040-first-three-batches-independent-review-record-contract.md) / [20 项本地 validator](../04-engineering/testing/d040-first-three-batches-independent-review-record-harness.md) | 固定同一 frozen packet、七输入、四域 attestation、十三卡、十二条跨批不变量、P0~P3、disposition 与双 SHA-256；合成 fixture 非正式证据，真实回执、复核人核验与权威 PASS 均为 0/false |
| [nuttie-visual-direction.md](nuttie-visual-direction.md) | Nuttie 原创卡通栗子视觉方向、状态映射与 Figma 导入合同 |
| [nuttie-design-system.md](nuttie-design-system.md) | Nuttie 视觉令牌、组件、五个本地优先功能画面、九种状态模式、候选边界与自动验证合同 |
| [../04-engineering/testing/visual-kit-check.md](../04-engineering/testing/visual-kit-check.md) | 本地视觉原型的源码合同、负向变异测试与浏览器验收边界 |

## 2. 本轮结论

本轮建立的是“用户要找什么、做什么、在什么状态下得到什么反馈”的逻辑基线。它有意不决定：

- 使用底部标签栏、侧栏、栈或其他导航外壳；
- 使用 Expo Router、React Navigation 或任何具体导航库；
- 品牌视觉、配色、字体、插画、动效与组件样式；
- 公开资料未验证的竞品交互细节；
- 尚未由 Owner 接受的版本切片和默认入口排序。

以上“不决定”只限定本篇 2026-07-31 的 G3 逻辑基线；后续候选视觉、组件和状态合同记录在 [nuttie-design-system.md](nuttie-design-system.md)，仍不代表 Owner 已批准正式 React Native 页面。

所有业务能力默认在设备本地完成。联网只发生在用户主动发起并确认、且 D-053 本地 Provider policy 对该载荷为 `ALLOW` 的 AI 请求中；AI 不可用或 policy 未准入时，手工记录、日记、目标、统计、提醒、食品查询、备份和数据管理仍须可用。

## 3. G3 通过条件

G3 只有在以下证据齐备后才能申请 `PASS`：

1. 产品确认 24 类能力均有明确去向，且公开证据状态没有被体验文案夸大。
2. 架构确认全部旅程遵守唯一 `AITransport`、SQLCipher、Keychain、Files 导入导出和 iOS 权限边界。
3. 隐私安全确认 D-014 营养标签照片逐次预览、其他 AI 载荷按 Owner 选定的 D-033 执行，D-053 Provider policy 用途准入成立，并确认数据最小化、删除、备份和敏感错误态。
4. QA 为关键旅程、状态矩阵、飞行模式、权限拒绝和恢复路径建立验收追踪。
5. Owner 对 [open-decisions.md](open-decisions.md) 中会改变产品行为的选项给出明确决定。
6. 后续低保真原型覆盖小屏、动态字体、VoiceOver、图表文字替代与键盘/焦点路径。

## 4. 追踪规则

- 竞品能力沿用 `F01` 至 `F24`；细粒度证据沿用 `ACC-*`、`DAY-*`、`LOG-*`、`FOOD-*`、`BODY-*`、`AI-*`、`SYS-*`、`DATA-*`。
- 用户旅程使用 `J-*`；体验状态使用 `ST-*`；待决策项使用 `UXD-*`，批准后由 PM 分配正式 `D-*` 编号。
- `confirmed` 只表示 iOS 官方商店截图或文案直接证实；`cross-source` 表示官方政策、协议或同产品跨平台来源；`research-gap` 表示公开资料无法验证。
- Nuttie 为离线闭环新增的能力必须标记为 `Nuttie-required`，不得写成“竞品已确认”。

## 5. 连续性与 Owner Gate

- [当前交接](../00-governance/current-handoff.md)：恢复当前 29/3 决策状态、D-032 两阶段、D-039 PX-4/PX-5 边界、阻断项和本地命令。
- [Codex 连续性运行手册](../00-governance/codex-continuity-runbook.md)：新实例读取顺序、事实优先级、跨角色协作与每轮持久化规则。
- [Owner 启动门禁独立审查](../00-governance/owner-startup-gate-independent-review.md)：首批工程候选的独立治理审查、门槛分层和 D-032 循环分析；其中历史计数应以当前交接和权威决定副本为准。
- [原型与 Owner 评审流程](prototype-and-owner-review-workflow.md)：候选同等完整、跨角色任务评审和 Owner 决定记录规则。
- [D-038 原型 Manifest](prototype-manifest.md)：仓库同源、本地预览、验证证据、限制和恢复方式。
