# ADR-0002：最低支持 iOS 17

- 状态：accepted
- 日期：2026-07-31
- 关联决策：D-011
- 决策者：Owner

## 上下文

竞品可能支持更早 iOS，但 Nuttie 是面向本人和朋友的新应用，不承担既有用户升级兼容。降低最低版本会扩大设备覆盖，同时增加 API 分支、测试矩阵、原生扩展兼容和依赖约束。

## 决策

首版最低支持 iOS 17。工程、Pods、Deployment Target、测试矩阵和商店元数据必须保持一致，不为“对标竞品”单独承诺 iOS 13–16。

## 后果

- 可以围绕 iOS 17 的系统行为设计权限、SwiftUI 和未来 Widget 能力。
- iOS 16 及更早设备不能安装；产品必须在分发前核对所有目标朋友的设备版本。
- iOS 17 只是最低版本，不代表只测试 iOS 17；还需覆盖最新受支持 iOS。
- 使用新 API 时仍要处理 availability，因为最新 SDK 可能包含高于部署目标的 API。

## 验证

- Xcode project、Podfile/生成配置和 App Store deployment target 均为 17.0 或兼容表达。
- CI/本地构建至少覆盖 iOS 17 模拟器与最新模拟器。
- 至少一台 iOS 17.x 真实设备完成相机、通知、Keychain、SQLCipher、Files 和 TestFlight 验收。

## 复审条件

若目标用户设备盘点发现必须支持 iOS 16 或更早，由 Owner 新开决策；必须先给出依赖兼容、功能降级和新增测试成本，不能直接修改 deployment target。

## 证据快照

2026-07-31 Expo latest 官方页面显示当前最低 iOS 16.4、Xcode 26.4。已批准的 iOS 17+ 比框架最低要求更严格；开发 Mac 仍必须满足对应 Xcode 的主机系统和硬件要求。
