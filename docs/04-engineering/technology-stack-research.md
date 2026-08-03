# Nuttie React Native 技术栈调研总览

> 状态：`RESEARCH_BASELINE / OWNER_DECISIONS_PENDING`
>
> 快照日期：2026-07-31
>
> 适用边界：iOS 17+、React Native、本地优先、仅用户主动 AI 请求联网

## 1. 先区分“已批准”与“候选”

已批准的技术边界只有：

- D-003：每人配置 OpenAI-compatible Base URL、model 和 key。
- D-004：AI Base URL 只允许 HTTPS。
- D-005：Expo Development Build + Prebuild，并检入 `ios/`。
- D-006：SQLite + 手动加密备份，默认排除 iCloud。
- D-011：iOS 17+。
- D-012：离线数据随 App 发版或从 Files 导入签名包。
- D-015：SQLCipher + Keychain 数据库密钥。

下面出现的 Expo SDK 版本、包管理器、导航、状态、数据库访问层、表单、样式和测试工具全部仍是候选。任何 `Recommended` 都不能代替 Owner 的明确决定。

## 2. 推荐分层

```text
React Native UI / TypeScript strict
  |
  +-- App shell and navigation ........ D-038 / D-018 candidate
  +-- UI session state ................ D-019 candidate
  +-- Forms and unknown validation .... D-021 candidate
  +-- Typed design tokens ............. D-025 candidate
  |
Use cases and domain
  |
  +-- Pure TypeScript invariants
  +-- Deterministic calorie/nutrient aggregation
  +-- No React, SQLite or Provider types in domain core
  |
Ports and repositories
  |
  +-- SQLCipher application database .. D-020 candidate access layer
  +-- Read-only signed food packs ...... D-026 candidate signature profile
  +-- Keychain SecretVault
  +-- Local notifications / media / Files
  +-- AITransport (only network port) .. D-033/D-034/D-036/D-053
  |
iOS native boundary
  +-- Expo modules / config plugins / checked-in ios/
  +-- URLSession isolation when JS fetch cannot prove the contract
  +-- XCTest/XCUITest for Keychain, notifications and extensions
```

## 3. 当前候选矩阵

| 层 | 候选 A / 当前建议 | 备选 | 为什么不是既定事实 | 接受前证据 |
| --- | --- | --- | --- | --- |
| 包管理器 D-037 | pnpm + 唯一 `pnpm-lock.yaml` | npm / Yarn | Expo 支持入口不等于 Nuttie 已选 | Windows/Mac、Expo scripts、CocoaPods 验证 |
| 版本 D-032 | Expo SDK 57 / RN 0.86 作为首个 Spike | 受支持前一稳定 SDK | current latest 会变化，高风险依赖可能未适配 | SQLCipher、SecureStore、相机、通知、Prebuild、Archive |
| 产品外壳 D-038 | 日记、趋势、食品资料、设置 | 三目的地 / 单一日记中心 | 属于产品 IA，不由库默认值决定 | 低保真流程、320/375pt、VoiceOver 顺序 |
| 导航 D-018 | Expo Router | React Navigation 直接配置 | 文件路由与集中路由各有维护成本 | 六条真实旅程、返回、Modal、deep link |
| UI 状态 D-019 | Zustand，仅 UI/session/草稿 | Redux Toolkit / React context | SQLite 必须保持领域真源 | lint/目录边界、杀进程后无业务数据丢失 |
| SQLite 访问 D-020 | Drizzle + 显式 SQL migrations + 受控直接 SQL | 全手写 SQL / Kysely | ORM 不能隐藏 SQLCipher pragma、FTS、备份和完整性 | 加密库 migration、回滚、损坏和分析查询 Spike |
| 表单 D-021 | React Hook Form + Zod | Formik + Yup / 自研 | Domain 不能依赖表单 schema | 动态食材、单位、AI `unknown`、无障碍错误摘要 |
| 图表 D-022 | Victory Native 与 Gifted Charts 对比后再选 | Swift Charts 包装 | 可访问性、原生依赖和大数据性能未知 | 7/30/365 天、最大字体、VoiceOver、旧设备性能 |
| 单元/组件 D-023 | Jest + React Native Testing Library | Vitest 组合 | RN mock 与 runner 兼容需冻结 | 纯 Domain、hooks、组件和原生边界隔离 |
| E2E D-024 | Maestro + XCTest/XCUITest | Detox + XCTest / 仅 XCUITest | 系统权限与 Keychain 不能只靠 RN E2E | 稳定性、失败诊断、CI/Mac 可重复性 |
| 样式 D-025 | StyleSheet + typed tokens | NativeWind / Unistyles | 品牌与视觉方向仍需 Owner 选择 | Dynamic Type、深浅色、对比度、变体样板 |

## 4. Expo 与 SQLCipher 官方事实

核验日的 Expo `create-expo-app` 页面：

- 官方页面提供 npm、Yarn、pnpm 和 Bun 四个 package-manager 入口。
- 页面处于 SDK 57 过渡说明期，Development Build 场景可使用 SDK 57 模板；这只是当前工具事实，不是 D-032 的长期选择。

核验日的 `expo-sqlite` 页面：

- `expo-sqlite` 支持 Android、iOS 和 macOS 上的 SQLCipher。
- 需要在 App config 中设置 `useSQLCipher` 并运行 `npx expo prebuild`。
- SQLCipher 不支持 Expo Go，因此 D-005 的 Development Build/Prebuild 是必要边界。
- 官方页面同时提供 Drizzle ORM 集成入口，但这只证明存在官方集成说明，不证明 D-020 已批准。

## 5. 本地数据栈

建议维持两个物理数据库边界：

1. **业务写库**：SQLCipher，保存用户档案、目标、餐食、营养快照、体重、饮水、运动、提醒和用户自建食品。
2. **只读食品包**：台湾食药署、USDA Foundation、USDA SR Legacy 分来源独立包；每条记录保留 source/version/license/provenance。

数据库访问层必须暴露而不是隐藏：

- migration SQL、`user_version` 和启动完整性检查；
- SQLCipher key 初始化、错误 key 和重装后的文件/Keychain 错配；
- 历史餐食营养快照不可被新数据包改写；
- FTS/条码查询、来源过滤和缺失值语义；
- 导入、恢复、删除的 durable intent 与启动对账。

## 6. 唯一联网栈

业务代码只依赖 `AITransport` port。其他 repository、图片组件、WebView、SDK 或原生模块不得直接联网。

AI 相关决定分四层，不能合并成一个“已同意”：

- D-014 已接受：仅营养标签照片首次说明并逐次预览确认。
- D-033 候选：餐食照片、文本和趋势摘要如何展示与确认。
- D-036 候选：URL、origin、3xx、session、cookie、cache 与 credential 隔离。
- D-053 候选：Provider 的保留、训练、人工访问、删除、广告/营销和健康数据用途是否允许发送。

若 React Native `fetch` 无法在原生 Spike 中证明 D-036 的最终 contract，应实现窄接口 Expo/Swift module，以独立 ephemeral `URLSession` 承担网络传输。不能用“库通常如此”代替抓包和取消/重启证据。

## 7. iOS 原生边界

| 能力 | 首版状态 | 实现方向 | 必须真机验证 |
| --- | --- | --- | --- |
| 相机/条码 | 范围内 | Expo Camera 或经版本矩阵验证的原生能力 | 权限拒绝/撤回、低光、旋转、隐私文案 |
| 照片选择 | 范围内 | 系统 Photos picker 优先，不请求全库 | 有限选择、取消、EXIF 去除、临时文件清理 |
| Keychain | 范围内 | SecureStore 或窄接口原生封装，按密钥类型区分 | 锁屏、重启、重装、ThisDeviceOnly、孤立 key |
| SQLCipher | 范围内 | `expo-sqlite` config plugin + checked-in `ios/` | migration、错误 key、WAL/SHM、性能、Archive |
| 本地通知 | 范围内 | 仅本地 schedule，不启用 remote Push | 权限、Focus、DST、撤销、删除全部数据 |
| Files 导入/导出 | 范围内 | 系统 document picker | iCloud/第三方 provider 提示、取消、低存储、损坏包 |
| HealthKit | 第二阶段 | D-028 后决定第三方库或自有模块 | 首版不得添加 capability 或权限占位 |
| Widget/Live Activity | 后续候选 | 需要 App Group、Swift target 与隐私快照 | 未获产品决定前不创建 Target |

## 8. 构建与发布环境

- Windows 可以完成文档、纯 TypeScript、网页工作台和部分静态检查。
- Windows 不能产生 Xcode Archive、签名、TestFlight、真实 Keychain/通知/相机或 iOS 迁移证据。
- G6 前必须具备受支持的 Mac/Xcode、至少一台真实 iPhone、有效 Apple Developer Program 与明确的 Team/Bundle ID。
- D-029 未决定前，先提供可重复的本地 Mac 命令，不接第三方云 CI，也不上传签名凭据。

## 9. 明确排除的技术

首版不引入：

- 业务后端、业务账号、云数据库、对象存储；
- CloudKit、iCloud 产品同步、remote Push；
- EAS OTA 或任何远程更新 channel；
- analytics、ads、crash upload、remote config；
- 运行时在线下载食品数据包；
- 内置共享 AI key；
- 远程图片组件或 WebView 绕过 `AITransport`。

## 10. 进入工程初始化的条件

1. Owner 回复 [第 1 批决策](../02-product/owner-decision-packs.md)。
2. D-047、OI-01/OI-02/OI-03 与 D-048 明确，避免首次 Prebuild 生成错误身份或设备配置。
3. D-032 的 Spike 机器与版本可用。
4. D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-037 已接受。
5. 初始化动作仍由 Owner 单独授权；当前不创建工程、lockfile 或 `ios/`。

## 11. 官方参考

- Expo create-expo-app：<https://docs.expo.dev/more/create-expo/>
- Expo Development Builds：<https://docs.expo.dev/develop/development-builds/introduction/>
- Expo Prebuild / CNG：<https://docs.expo.dev/workflow/continuous-native-generation/>
- Expo SQLite / SQLCipher / Drizzle：<https://docs.expo.dev/versions/latest/sdk/sqlite/>
- Expo SecureStore：<https://docs.expo.dev/versions/latest/sdk/securestore/>
- React Native New Architecture：<https://reactnative.dev/architecture/landing-page>
- 详细发布证据：[iOS Release 准备审查](../05-quality/ios-release-readiness-review.md)

