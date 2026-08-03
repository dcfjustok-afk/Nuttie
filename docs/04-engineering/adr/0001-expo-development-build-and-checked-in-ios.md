# ADR-0001：Expo Development Build、Prebuild 与检入 ios

- 状态：accepted
- 日期：2026-07-31
- 关联决策：D-005
- 决策者：Owner

## 上下文

Nuttie 使用 React Native 构建 iOS App，同时需要 SQLCipher、Keychain、相机、本地通知，以及未来可能出现的 HealthKit、WidgetKit 和 ActivityKit。Expo Go 不能代表任意自定义原生模块和多个 Xcode Target 的真实运行环境。

纯 CNG 可以每次从配置生成原生项目，但手工修改生成目录会在 clean prebuild 时丢失；Widget/Live Activity 等 Extension target 全量插件化需要额外工程投入。Bare React Native 提供最大控制，但会失去 Expo 标准原生模块和开发工具带来的集成效率。

## 决策

1. 使用 Expo Development Build 作为开发运行环境。
2. 通过 Prebuild 生成初始 iOS 工程。
3. 将 `ios/` 检入 Git，Xcode 工程、Swift 源码、entitlements 和 Extension targets 作为正式源码维护。
4. 原生改动可以逐步迁移为幂等、可测试的 config plugin，但插件化不是修改原生能力的前置条件。
5. 存在手工原生改动后，不得未经 diff 评审执行 `prebuild --clean`。
6. EAS Build、EAS Update 和 Expo 云服务不因采用 Expo Framework 而自动获得批准。

## 曾考虑的选项

### 纯 Expo CNG，不检入 ios

- 优点：模板升级和配置生成一致，原生目录可丢弃。
- 缺点：所有 Xcode Target、App Group 和原生配置必须完全插件化；生成失败可能阻断整个项目。

### Bare React Native CLI

- 优点：原生工程边界最直接，没有 Prebuild 覆盖风险。
- 缺点：常用原生能力、权限和构建配置需要更多人工集成和升级维护。

### 采用的混合方案

- 优点：保留 Expo Framework 的生产级模块和 Development Build，同时让复杂 iOS 原生目标保持透明、可审查。
- 缺点：需要管理 app config 与 Xcode 工程的配置漂移，升级时必须人工合并模板差异。

## 后果

- `ios/` 的每次变更都必须参加 Code Review，并说明是手工源还是插件生成结果。
- Expo/RN 升级必须在临时分支生成新模板，与当前 `ios/` 比较后逐项合并。
- Windows 不能完成 iOS 原生验收；必须落实 Mac、Xcode 和真实 iPhone。
- 具体路由、状态、ORM 和测试库不由本 ADR 决定，仍在 D-018+ 候选中。

## 验证

- 在 Mac 上从干净 clone 安装依赖、Pods，并构建 Development/Release。
- 添加最小 Swift 原生模块后，验证归档、安装和 JS 调用。
- 在存在受控原生差异时执行 Prebuild dry-run/临时目录对比，证明不会静默覆盖。
- Expo/RN 升级演练必须输出 native diff、测试结果和回滚方式。

## 复审条件

只有当全部原生定制已经由稳定 config plugin 表达，且连续两个升级周期证明 CNG 可重复，才考虑改为不检入 `ios/` 的纯 CNG。

## 证据快照

2026-07-31 官方文档核验显示 Expo SDK 57.0.0 对应 RN 0.86；Development Build 支持任意原生库/配置，Windows 不能本地完成 iOS 构建；存在 `ios/` 时构建不会自动 Prebuild，`prebuild --clean` 会覆盖 generated dirs 的手工改动。这些证据支持本 ADR，但不替代 D-032 的精确版本冻结。
