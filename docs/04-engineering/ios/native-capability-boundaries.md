# iOS 17、Expo 与原生能力边界

> 状态：G4 初版
>
> 关联决策：D-005、D-007、D-008、D-011

## 1. 工程基线

- 最低系统版本：iOS 17+。
- React Native 使用实现时与所选 Expo SDK 兼容、经过 Spike 的稳定版本；精确版本待 D-032，不因 latest 页面而自动锁定。
- 使用 Expo Development Build，不以 Expo Go 作为原生能力验收环境。
- 执行 Prebuild 后将 `ios/` 检入 Git；Xcode 工程、entitlements、Swift 源码和 Extension target 都是正式源码。
- EAS Build/EAS Update 不是默认架构。是否使用任何 Expo 云服务需要新的显式决策。
- Release entitlements 不包含 iCloud、CloudKit、ubiquity container 或 remote Push；主 DB/WAL/SHM、媒体、数据包/备份/AI staging、内部恢复点和 App Group 快照逐文件设置并读取验证 `isExcludedFromBackupKey`。

一旦在 `ios/` 中存在手工维护的 Target 或配置，不得随意执行 `prebuild --clean`。必须先证明全部原生差异已由 config plugin 或可重复脚本表达，并对生成 diff 做人工评审。

## 2. Mac 是硬性前提

当前 Windows 环境可以进行文档、纯 TypeScript、部分单元测试和静态检查，但不能完成受支持的 iOS 编译、签名、模拟器或真实设备验收。

| 工作 | Windows | Mac + Xcode |
| --- | --- | --- |
| 文档/纯 TS 规则 | 可以 | 可以 |
| Metro/有限 JS 开发 | 可以 | 可以 |
| iOS Simulator | 不可以 | 必须 |
| iPhone Development Build | 不可以本地签名构建 | 必须 |
| CocoaPods/Xcode Target/entitlements | 不可验收 | 必须 |
| SQLCipher/Keychain 真机测试 | 不可验收 | 必须 |
| WidgetKit/ActivityKit/HealthKit | 不可验收 | 必须 |
| TestFlight archive/upload | 不可以本地完成 | 必须或另行批准云构建 |

在 Mac、Xcode 和真实 iPhone 未落实前，任何“原生能力完成”声明都不成立。

## 3. JS 与 Swift 边界

| 能力 | 首版边界 | 数据方向 | 失败/降级 |
| --- | --- | --- | --- |
| 相机拍照/条码 | Expo 原生模块候选；库级选择待确认 | 原生 -> RN，文件复制到受控目录 | 拒绝后手动录入/条码输入 |
| 相册选图 | 系统 picker，按需授权 | 用户选定文件 -> RN | 取消或拒绝不影响本地记录 |
| AITransport | D-003/D-004 的唯一 HTTPS 业务网络边界；具体 URL/session profile 待 D-036 | RN -> 专属 transport -> 用户 Provider | 若 RN `fetch` 不能证明 redirect/cache/cookie/credential/取消性质，使用窄接口 Swift/Expo Module Spike |
| 本地通知 | 本地 schedule；不取 Push token | RN -> UserNotifications | 拒绝/Focus/系统限制需明确显示 |
| Face ID/App 锁 | 安全增强候选，不与 DB 唯一密钥生命周期耦合 | Keychain/LocalAuthentication -> RN 状态 | 生物识别变化后允许设备口令或备份恢复策略 |
| HealthKit | D-007：首版不接入；第二阶段重新决策 | 未来需定义读/写和去重 | 首版只提供手动记录，不显示虚假同步入口 |
| WidgetKit | 非首版已承诺功能；需要时用 SwiftUI Extension | 主 App -> App Group 最小快照 | 过期/锁定时显示占位或隐私遮罩 |
| Live Activity | 只有产品确认真实持续活动场景后才建立 | 主 App -> ActivityKit state | 不依赖后台 JS 持续运行 |

Widget 和 Live Activity 不得直接执行 React Native JS、读取 API key 或把主 SQLCipher 数据库暴露给 Extension。主 App 只写入经过选择的版本化快照，包含 `schemaVersion`、`generatedAt` 和 `expiresAt`。

## 4. 权限策略

权限不在首启批量申请：

- 相机：首次进入扫码/拍照动作时申请。
- 相册：首次选择已有图片时由系统 picker 处理。
- 通知：用户创建第一个提醒并看过用途说明后申请。
- Face ID：用户主动开启 App 锁时申请。
- HealthKit：首版不申请；第二阶段逐数据类型解释 read/write 用途。

每项权限必须处理 `notDetermined`、`denied`、`restricted`、`authorized/limited` 和运行期撤销。拒绝后提供设置入口，但不能循环弹窗或阻断无关功能。

## 5. 后台与通知限制

- 本地通知可以离线调度，但不是可靠闹钟；用户的 Focus、静音、通知摘要和系统策略会影响呈现。即使权限已授权，界面也要说明这些限制。
- iOS 不保证任意后台 JS 按时运行。提醒必须提前排程，并在启动、前台恢复和规则变化时对账补排。
- 用户撤销通知权限后保留提醒规则，但标记为“未安排”；重新授权后由对账流程补排，不能静默丢掉规则。
- 实现需采用有限滚动窗口，不能假设可无限注册待处理通知；确切平台上限在实现 Spike 中按当前 iOS SDK 验证。
- 不申请远程通知 entitlement，不调用 Push token API，不建立 APNs 服务。
- Live Activity 的持续显示应使用原生时间表达和 ActivityKit 能力，不用 JavaScript 定时器维持。

## 6. Expo/Prebuild 维护规则

1. App config 负责能稳定表达的 bundle ID、权限文案、图标和基础 capability。
2. 简单、可测试且幂等的原生修改可以迁移为本地 config plugin。
3. Widget/Activity 等 Target 在插件化前由检入的 Xcode 工程管理。
4. 每次 Expo/RN 升级先建立临时分支生成新模板，对比 `ios/`，逐项合并并运行原生测试。
5. 原生目录和 config 发生漂移时，以已评审、可构建的 `ios/` 为发布依据，并创建修复任务；不得用 clean prebuild 强行覆盖。
6. Release 构建不启用开发菜单、开发 launcher、网络 inspector 或未批准的 OTA channel。
7. Release 原生依赖、Pods、Swift Packages、Expo plugins、entitlements、PrivacyInfo 和 embedded frameworks 必须静态审计，并做全进程网络捕获；不能只依赖 TypeScript import 规则证明唯一网络边界。
8. App 不内置 Nuttie/第三方遥测或崩溃上传器。产物不得含 crash SDK/DSN；可控日志不得包含 key、Authorization、健康正文或原始 AI 内容。

## 7. TestFlight 与长期分发

D-008 只批准开发阶段使用 TestFlight。它依赖 Apple Developer、App Store Connect、签名和网络，且测试构建不是永久安装渠道。即使 App 不集成崩溃上传 SDK，Apple/TestFlight 仍可能按系统与测试者设置收集崩溃诊断和反馈；这是平台边界，不能承诺测试环境无任何诊断离机。

长期渠道仍待决策，可比较：

- Unlisted App Store：适合通过链接给朋友长期安装，但需要 App Review 和 Apple 托管。
- 普通 App Store：更新最简单，但公开可发现并需完整商店合规。
- Ad Hoc：适合极少设备，需维护 UDID、证书和过期安装。

Enterprise 分发不适用于普通朋友。不得用个人免费签名描述为长期稳定分发方案。

## 8. 原生 Spike 门禁

在锁定具体库前，必须在 Mac + 真实 iPhone 上分别验证：

1. Expo Development Build、Prebuild、检入 `ios/` 后可重复归档。
2. SQLCipher 首次建库、重启、升级、错误密钥和 rekey。
3. Keychain ThisDeviceOnly、锁屏、重启、生物识别变化、卸载重装和显式删除。
4. 相机/相册/通知拒绝、受限、撤销和设置恢复；通知撤权后规则保留且显示未安排。
5. 每类内部敏感文件在创建、复制、同卷 rename 和恢复后都读取验证不备份属性；审计 Release entitlements/provisioning profile 无 iCloud/CloudKit/ubiquity/remote-push capability。
6. 签名数据包和加密备份通过 Files 本地完成，并在每个持久化点 kill/restart 验证 intent/pointer 对账。
7. 分别在 Debug 与 Release 做全进程网络捕获；Release 未触发 AI 时为零请求，触发后只符合 D-036 最终 profile。
8. D-036 比较严格/兼容 profile；若 RN `fetch` 无法证明 ephemeral/no-cache/no-cookie/no-persistent-credential 和临时文件清理，则验证原生 transport。
9. 若进入对应阶段，再验证 HealthKit、WidgetKit、ActivityKit、App Group 和 TestFlight 安装升级。

## 9. 2026-07-31 官方证据与风险

| 已核验证据 | 架构含义 | 仍需验证 |
| --- | --- | --- |
| Expo latest 显示 SDK 57.0.0 -> RN 0.86 / React 19.2.3 / Node 22.13.x | 可作为 Spike 起点，不是冻结版本 | SQLCipher、Keychain、通知和原生 Target 的完整兼容矩阵 |
| Expo 当前最低 iOS 16.4、Xcode 26.4 | D-011 iOS 17+ 更严格；本地 Mac 必须能运行受支持 Xcode | 开发 Mac 的硬件/系统是否满足 Xcode 要求 |
| Development Build 支持任意原生库/配置；Windows 不能本地构建 iOS Simulator/iPhone | Expo Go 不能作为验收；Mac 是硬门槛 | Development/Release archive 和真机安装 |
| 存在 `ios/` 时构建不会自动 Prebuild；`prebuild --clean` 会覆盖 generated dirs 的手改 | 证实 D-005 必须声明 hybrid ownership | config plugin 与检入原生差异的长期漂移成本 |
| `expo-sqlite` 支持 iOS SQLCipher，需要 `useSQLCipher: true` + Prebuild，Expo Go 不支持 | 支持 D-015 的实现路径 | 当前 SDK 的建库、迁移、错误 key、归档和包体 |
| `expo-secure-store` 在 iOS 使用 Keychain，重装同 bundle ID 可能残留，支持 `WHEN_UNLOCKED_THIS_DEVICE_ONLY` | 证实显式删除和 ThisDeviceOnly 要求 | 真机卸载重装、锁屏和生物识别变化 |
| React Native New Architecture 自 0.76 默认启用 | 第三方原生库必须验证 New Architecture | 每个候选库的 Fabric/TurboModule 和 Release 兼容 |

参考：

- <https://docs.expo.dev/versions/latest/>
- <https://docs.expo.dev/develop/development-builds/introduction/>
- <https://docs.expo.dev/workflow/continuous-native-generation/>
- <https://docs.expo.dev/versions/latest/sdk/sqlite/>
- <https://docs.expo.dev/versions/latest/sdk/securestore/>
- <https://reactnative.dev/architecture/landing-page>
