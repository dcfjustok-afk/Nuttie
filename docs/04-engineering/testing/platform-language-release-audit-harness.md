# F22 平台与语言 Release 审计合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION / CURRENTLY_BLOCKED`

日期：2026-08-12

对应：`F22 / REQ-F22 / AT-F22`、`D-011`、`D-016`

## 目的

`D-011` 已接受 iOS 17+，`D-016` 已接受首发仅简体中文；这两项决定是发布审计的固定输入，但不是实现或 Release 证据，也没有决定 iPhone/iPad、支持方向、Mac availability 或 Apple Vision Pro availability。

`tools/platform-language-release-audit-harness.mjs` 聚合正式 F22 证据并 fail closed。审计目标必须是正式签名 Release Archive，四个平台形态维度必须分别具有权威 `ACCEPTED` 决定，25 个配置、Archive、商店、模拟器、真机、布局和无障碍证据面必须全部执行且符合基线。

合同只评估调用方提供的决定记录和报告，不验证它们的真实性，不运行 Xcode、模拟器、真机或 App Store 检查，也不关闭 G4/G6/G7。

## 已接受的固定基线

```text
platform: IOS
minimumOsVersion: 17.0
primaryReleaseLanguage: zh-Hans
appAuthoredUiLanguageScope: ZH_HANS_ONLY
D-011: ACCEPTED
D-016: ACCEPTED
```

- 英文产品名和英文标语属于品牌资产，不授权首发 UI 双语。
- 台湾食药署、USDA 等来源原文可以按来源保留；这不扩大 App 自有 UI 的首发语言范围。
- iOS 17 是最低版本，不代表只测试 iOS 17；还需最新受支持 iOS。

## 四个不得推导的平台形态决定

| 维度 | 允许的明确选项 | 当前状态 |
| --- | --- | --- |
| Device families | iPhone、iPad，可按决定组合 | `NOT_DECIDED` |
| Orientations | portrait、upside-down、landscape left/right，可按决定组合 | `NOT_DECIDED` |
| Mac app availability | available / not available 二选一 | `NOT_DECIDED` |
| Vision Pro app availability | available / not available 二选一 | `NOT_DECIDED` |

不得从以下事实推导这四项：

- D-011 的 iOS 17+；
- D-016 的首发简体中文；
- D-038 的产品导航外壳候选；
- Owner 当前只有一台 iPhone；
- Expo、Xcode 或 App Store Connect 的默认值。

## 25 个必查面

| 证据组 | 数量 | 必查面 |
| --- | ---: | --- |
| iOS 17 基线 | 10 | 主 App target、extension target、Pods、embedded frameworks、Archive `MinimumOSVersion`、Store 最低系统；iOS 17/最新 iOS 模拟器；iOS 17/最新 iOS 真机 |
| 简中发布 | 11 | App 自有 UI、权限、错误、无障碍、TestFlight、App Store 简中；320/375/430pt 最长文案；最大无障碍 Dynamic Type；VoiceOver 顺序/名称/值 |
| 平台形态 | 4 | Xcode device family、Xcode orientation、App Store Mac availability、App Store Vision availability |

Archive、Store、模拟器、真机、布局和无障碍表面必须使用对应报告类型，不能用源码字符串扫描冒充。

## 判定

`PASS` 必须同时满足：

1. 目标为具有 build identity 与 SHA-256 工件摘要的 `SIGNED_RELEASE_ARCHIVE`；
2. 四个平台形态决定都由独立 `D-###` 记录声明为 `ACCEPTED`；
3. 25 个报告与同一目标和同一 policy fingerprint 绑定；
4. 每项检查均为 `EXECUTED + CONFORMANT + findingCount=0`。

当前权威状态：

```text
overallDisposition: BLOCKED
blockers:
  - FORMAL_TARGET_ABSENT
  - PLATFORM_SHAPE_DECISION_REQUIRED
  - REQUIRED_SURFACE_MISSING
formalSignedReleaseTargetPresent: false
acceptedPlatformShapeDecisions: 0/4
releaseEvidenceExecuted: 0/25
```

## 数据与声明边界

- target、decision、evidence 和 report 使用严格版本化 schema；未知字段和能力被拒绝。
- 所有四个决定维度必须显式出现；未决定时 `decisionId` 和 `selectedValues` 必须为 null。
- `ACCEPTED` 样例要求 D-number 和允许值，但框架不查 Owner 台账，因此不证明决定真实。
- evidence 同时绑定工件摘要与包含四项决定的 policy fingerprint；决定变化后旧报告不能复用。
- 缺面、未执行、nonconformant 或非零发现均 `BLOCKED`；Debug/未签名 Release 不能替代签名 Archive。
- 指纹和报告验证只证明输入/派生结果未漂移，不证明 Xcode、Store、模拟器或真机报告真实。

## 运行

```powershell
node --test tools/platform-language-release-audit-harness.test.mjs
```

当前专项：`20/20 PASS`。
