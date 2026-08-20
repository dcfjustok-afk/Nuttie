# Nuttie Owner 第 1 批确认归档

> 状态：`CONFIRMED`
>
> 更新时间：2026-08-15T00:03:31+08:00
>
> 交互通道：Codex 宿主原生 `request_user_input`

本文件归档 Owner 首批输入和整批规范化回读结果。权威决定见 [Owner 决策台账](decision-register.md)，机器可读批次见 `project-ops/owner-intake.json`。本次确认产生 11 项 `DECISION_ACCEPTED`，并将 D-032 记为 `CANDIDATE + SPIKE_AUTHORIZED`；它仍不授权正式 Nuttie 根工程、Apple 注册、付费、TestFlight、发布或原生 iOS 工作。

Owner 后续于 2026-08-15 查看冻结 D-039 原型后明确回复 `a`，单独接受 D-039 方案 A。该响应不属于首批整批确认，但已追加到同一 Owner intake 审计链；其后 PX-4 设计基线已冻结，PX-5 与正式实现仍未授权。

## 1. 已确认选择

| ID | 点击结果 | 确认语义 |
| --- | --- | --- |
| D-038 | A，日记/趋势/食品资料/设置四入口 + 情境新增 | `CONFIRMED_ACCEPTED` |
| D-032 | A，SDK 57 / RN 0.86.2 隔离 Spike 候选 | `CONFIRMED_SPIKE_AUTHORIZED`；仍为 candidate |
| D-037 | A，pnpm 11.18.0 hoisted profile | `CONFIRMED_ACCEPTED` |
| D-048 | A，iPhone 竖屏 | `CONFIRMED_ACCEPTED` |
| D-018 | A，Expo Router | `CONFIRMED_ACCEPTED` |
| D-020 | A，Drizzle + 受控 SQL | `CONFIRMED_ACCEPTED` |
| D-019 | A，Zustand 只管 UI/session/草稿 | `CONFIRMED_ACCEPTED` |
| D-021 | A，React Hook Form + Zod | `CONFIRMED_ACCEPTED` |
| D-025 | A，StyleSheet + TypeScript semantic tokens | `CONFIRMED_ACCEPTED` |
| D-023 | A，Jest 单 runner | `CONFIRMED_ACCEPTED` |
| D-024 | A，本地 Maestro + XCTest/XCUITest | `CONFIRMED_ACCEPTED` |
| D-047 | 首次点击 A，随后明确回正为 C：当前暂不加入、只自用 | A 已被澄清取代；C 为 `CONFIRMED_ACCEPTED` |
| D-039 | A，本地搜索和最近使用优先；扫描与 AI 并列 | 后续单独回复；`CONFIRMED_ACCEPTED / PX-4_BASELINE_FROZEN`；PX-5 B01/B02 已关闭，B03~B07 共 5 项开放 |

## 2. 已确认事实与冲突

- OI-01：当前尚未加入 Apple Developer Program，因此 Account Holder、Team ID 和 D-U-N-S 暂记 `N/A`。
- OI-02：Owner 通过宿主原生 `request_user_input` 选择“尚未创建”；规范化为 Bundle ID `NOT_CREATED`、具体值为空、App ID 与 App Store Connect record 均未创建、SKU=`N/A`。具体 Bundle ID 最迟在首次自用真机签名配置前另行确认。
- 分发意图澄清：Owner 明确当前只开发和安装给自己使用，不付 Apple Developer Program 年费、不做 TestFlight、暂不考虑朋友分发。
- D-047 回正：C“当前暂不加入”为已接受决定；首次 A 仅作为审计历史保留。
- D-008 边界：当前不执行既有 TestFlight 方向；“暂不考虑朋友”不等于永久取消，未来恢复或正式 supersede 仍需 Owner 决定。
- OI-03：Owner 通过原生选择卡确认当前只有 `iPhone 16 Pro Max / iOS 26.5`，暂无可用 Mac；该事实不授权 iOS 原生 Spike、Prebuild、签名、Archive 或真机安装。

## 3. 后续门禁

OI-01 至 OI-03 和首批 12 项输入已完成整批确认，D-039 后续已单独接受 A。计划中的下一张宿主原生 `request_user_input` 仍以 `d040_onboarding_goals` 作为队列占位，但 D-040 的 20 个独立决定轴必须先完成选择卡规格与 PX-0/PX-1/PX-2 前置评审；前三批十三张内部卡片已完成四域自审，十三卡独立复核包、中国健康评审九工件/十三项交接包和 WS/T 578.1-2017 宏量现行证据已形成，当前仍为 `CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`。D-063 来源卡、D-070 输入形态卡和 D-071 显示舍入卡已完成内部自审；D-071 明确来源单位必须保留、派生需显式前置、raw/display 分离且舍入残差不得自动分配，但 D-063/D-070 尚未接受，D-068/D-069、健康数值边界、Content QA 和独立复核尚未关闭。独立复核包仍缺具名复核人、身份/胜任范围/独立性/利益冲突核验和实际复核；健康交接包仍缺具名评审人、资质核验、逐条签署、批准和 Content QA。两份包均未外联；NIDDK 动态模型还缺逐文件许可、稳定版本、官方 oracle corpus、回归容差与保护线。D-063、D-070、D-071 及 D-062/D-059 动态模型项仍未 Owner-ready，尚未排入 Owner 评审。D-032 已允许隔离 JS Spike，但 OI-02 与 D-039 均不构成 Bundle ID 注册、Prebuild、签名或原生 iOS 工作授权。
