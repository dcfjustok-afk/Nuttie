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
| [D-045 最近使用与收藏选择卡](d045-recent-favorites-card-spec.md) | B03 的三套完整政策包、清除/删除语义和内部四域自审；尚未独立复核或展示给 Owner |
| [D-031 媒体与 AI 内容保留选择卡](d031-media-ai-retention-card-spec.md) | B04 的三套完整政策包、临时内容清理、备份/删除语义和内部四域自审；尚未独立复核或展示给 Owner |
| [D-033 非标签 AI 上传确认选择卡](d033-nonlabel-ai-confirmation-card-spec.md) | B05 的三套完整政策包、D-014 保留范围、单次绑定/失效和内部四域自审；尚未独立复核或展示给 Owner |
| [D-034 AI 资源预算选择卡](d034-ai-resource-budget-card-spec.md) | B05 的三套固定预算政策包、19 维硬上限、超限清理和内部四域自审；尚需最低支持 iPhone benchmark，尚未独立复核或展示给 Owner |
| [d040-prototype-manifest.md](d040-prototype-manifest.md) | D-040 首启资料与目标 A/B/C 原型，以及字段/公式输入缺口 |
| [d040-px0-input-research.md](d040-px0-input-research.md) | D-040 的字段、能量公式、持久化、删除和特殊人群 PX-0 候选研究；不代表 Owner 已选择 |
| [d040-macronutrient-evidence.md](d040-macronutrient-evidence.md) | D-040 的 P/C/F 宏量营养公开证据、换算合同和未批准候选规则；不代表 Owner 已选择 |
| [d040-question-allocation.md](d040-question-allocation.md) | D-040 的 20 个独立决定轴、D-054~D-072 候选 ID 预留、依赖顺序和固定安全不变量 |
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
