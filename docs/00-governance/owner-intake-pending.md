# Nuttie Owner 第 1 批待回读输入

> 状态：`AWAITING_BATCH_READBACK / NOT_ACCEPTED`
>
> 更新时间：2026-08-14T16:55:34+08:00
>
> 交互通道：Codex 宿主原生 `request_user_input`

本文件只保存 Owner 已点击但尚未完成整批规范化回读的输入。它不是决定台账，不产生 `DECISION_ACCEPTED`，也不授权正式 Nuttie 根工程、Apple 注册、付费、TestFlight 或发布。机器可读副本见 `project-ops/owner-intake.json`。

## 1. 已收到的待回读选择

| ID | 点击结果 | 当前语义 |
| --- | --- | --- |
| D-038 | A，日记/趋势/食品资料/设置四入口 + 情境新增 | `PENDING_BATCH_READBACK` |
| D-032 | A，SDK 57 / RN 0.86.2 隔离 Spike 候选 | 最终确认后也只能先成为 `CANDIDATE + SPIKE_AUTHORIZED` |
| D-037 | A，pnpm 11.18.0 hoisted profile | `PENDING_BATCH_READBACK` |
| D-048 | A，iPhone 竖屏 | `PENDING_BATCH_READBACK` |
| D-018 | A，Expo Router | `PENDING_BATCH_READBACK` |
| D-020 | A，Drizzle + 受控 SQL | `PENDING_BATCH_READBACK` |
| D-019 | A，Zustand 只管 UI/session/草稿 | `PENDING_BATCH_READBACK` |
| D-021 | A，React Hook Form + Zod | `PENDING_BATCH_READBACK` |
| D-025 | A，StyleSheet + TypeScript semantic tokens | `PENDING_BATCH_READBACK` |
| D-023 | A，Jest 单 runner | `PENDING_BATCH_READBACK` |
| D-024 | A，本地 Maestro + XCTest/XCUITest | `PENDING_BATCH_READBACK` |
| D-047 | 首次点击 A，随后明确回正为 C：当前暂不加入、只自用 | 最新输入为 C；仍待整批回读确认 |

## 2. 已收到的事实与冲突

- OI-01：当前尚未加入 Apple Developer Program，因此 Account Holder、Team ID 和 D-U-N-S 暂记 `N/A`。
- OI-02：Owner 通过宿主原生 `request_user_input` 选择“尚未创建”；规范化为 Bundle ID `NOT_CREATED`、具体值为空、App ID 与 App Store Connect record 均未创建、SKU=`N/A`。具体 Bundle ID 最迟在首次自用真机签名配置前另行确认。
- 分发意图澄清：Owner 明确当前只开发和安装给自己使用，不付 Apple Developer Program 年费、不做 TestFlight、暂不考虑朋友分发。
- D-047 回正：最新待回读输入为 C“当前暂不加入”；首次 A 仅作为审计历史保留。
- D-008 边界：当前不执行既有 TestFlight 方向；“暂不考虑朋友”不等于永久取消，未来恢复或正式 supersede 仍需 Owner 决定。
- OI-03：Owner 通过原生选择卡确认当前只有 `iPhone 16 Pro Max / iOS 26.5`，暂无可用 Mac；该事实不授权 iOS 原生 Spike、Prebuild、签名、Archive 或真机安装。

## 3. 下一张卡

OI-01 至 OI-03 和 12 项候选输入已经齐备。PM 下一步使用宿主原生 `request_user_input` 弹出 `phase0_owner_batch_readback_confirmation`，把全部输入按 `ACCEPTED`、`CANDIDATE + SPIKE_AUTHORIZED` 或 `DEFERRED` 规范化回读，并请求一次整批最终确认。Owner 确认前不得追加 `DECISION_ACCEPTED`；OI-02 仍不构成 Bundle ID 注册、Prebuild、签名或原生工作授权。
