# Android 构建就绪记录

更新时间：2026-08-31

## 当前基线

Nuttie 的 Android 原生工程由 Expo SDK 57 Prebuild 生成，源码目录为
`apps/app/android/`。Android、iOS、React Native Web 和移动 H5 继续共享同一
TypeScript 业务层、设计 tokens、UI 组件和数据契约；Android 原生目录只承载
平台入口、系统返回、窗口 inset 和构建配置，不复制页面视觉规则。

当前调试包标识为 `com.anonymous.nuttie`。这是 Expo 生成的本地/CI Debug
占位标识，不是已确认的 Google Play 包名，也不代表已经创建商店 App ID。
正式分发前必须由 Owner 提供长期稳定的 Android applicationId，并同步更新
`apps/app/app.json`、Gradle namespace、Kotlin package、签名配置和发布文档。

## 已验证的本机工具链

- Android SDK：`D:\android-sdk`
- Platform Tools：`37.0.1`
- Android Platform：`35`，Gradle 首次构建自动补充 `36`
- Build Tools：`35.0.0`，Gradle 首次构建自动补充 `36.0.0`
- Android Emulator：`37.1.11`
- NDK：`27.1.12297006`
- Windows Hypervisor Platform：`emulator-check accel` 报告可用
- Gradle Wrapper：`9.3.1`，已缓存腾讯镜像下载的官方发行包

建议在 PowerShell 会话中设置：

```powershell
$env:ANDROID_HOME = 'D:\android-sdk'
$env:ANDROID_SDK_ROOT = 'D:\android-sdk'
$env:Path = "D:\android-sdk\platform-tools;D:\android-sdk\emulator;D:\android-sdk\cmdline-tools\latest\bin;$env:Path"
```

## 构建命令

生成或更新 Android 原生工程：

```powershell
pnpm --filter @nuttie/app exec expo prebuild --platform android --no-install
```

Debug APK：

```powershell
Set-Location apps/app/android
.\gradlew.bat :app:assembleDebug --no-daemon --stacktrace
```

在 Windows 上优先通过短路径映射执行构建，例如把仓库映射为 `N:`，因为
pnpm 的虚拟 store 路径会显著增加 CMake 对象路径长度：

```powershell
subst N: D:\github\Nuttie
Set-Location N:\apps\app\android
.\gradlew.bat :app:assembleDebug --no-daemon
subst N: /D
```

短路径映射只影响本机命令，不应写入仓库配置，也不改变 Android 架构矩阵。

## 当前结果与阻断项

Android 原生源码已生成，Gradle 能解析项目并安装缺失的 Platform、Build Tools
和 NDK。直接在 `D:\github\Nuttie` 构建时，`react-native-screens` 的
`buildCMakeDebug[arm64-v8a]` 在 Ninja 重写 `build.ninja` 阶段失败，错误为
`manifest 'build.ninja' still dirty after 100 tries`；日志同时报告对象路径接近
Windows 的 250 字符限制。该结果是本机路径限制，不是 TypeScript、业务代码或
Gradle 依赖失败。

在短路径映射下重新构建成功前，不得声称 APK、模拟器、真机或 Android 发布链路
已通过。系统镜像下载目前还受到 Android CLI 网络断开影响，因此尚未创建可用
AVD；这也是外部环境缺口，不通过删除原生依赖或减少正式架构来规避。

## 发布前门禁

以下条件全部满足后，才可以把 Android 标记为可发布：

1. Owner 提供正式 applicationId、签名 keystore、版本策略和 Google Play 账号边界。
2. 短路径或 CI 环境生成可安装 Debug/Release APK，并保存构建日志与 SHA-256。
3. 至少一个手机尺寸和一个大屏尺寸完成 Back、edge-to-edge、键盘避让、深色模式、
   系统字号放大、无障碍标签、离线写入和同步冲突流程验收。
4. Release 构建不再使用 `debug.keystore`，且密钥不进入仓库、日志或 Docker 镜像。
5. Android 结果与 `DESIGN.md`、`packages/design-tokens`、`packages/ui` 的跨端
   不变量一起复核；平台差异只能改变输入方式、导航承载和密度。
