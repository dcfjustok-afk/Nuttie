# Nuttie iOS Release / TestFlight / Mac 前置条件独立审查

| 字段 | 结论 |
| --- | --- |
| 审查角色 | iOS Release Reviewer（独立审查，不是架构作者自签） |
| 快照日期 | 2026-07-31（Asia/Shanghai） |
| 审查范围 | `docs/00-governance/**`、`docs/02-product/**`、`docs/04-engineering/ios/**`、`docs/04-engineering/testing/**`、D-005/D-008/D-011/D-016 与当前候选 |
| 官方证据范围 | Apple Developer / App Store Connect / App Review Guidelines 与 Expo 官方公开资料 |
| 总结论 | **BLOCKED**：方向基本正确，但当前既不能宣称 iOS 原生开发就绪，也不能进入 G6 TestFlight 或 G7 长期发布 |

本报告只核对发布前提、Apple 平台约束和证据缺口，不创建 Apple 账号、App ID、App Store Connect 记录、证书、profile 或 TestFlight 构建，不执行上传、发布、Git commit 或 push，也不修改任何已接受决定。

## 1. 分阶段结论

| 阶段 | 状态 | 结论 | 最迟关闭时点 |
| --- | --- | --- | --- |
| 开发准备 | **BLOCKED** | D-032 尚未批准；没有已核验的 Mac、macOS、Xcode、CocoaPods 与真实 iPhone；Bundle ID、Team、iPhone/iPad 交付边界尚未决定 | 初始化 Expo/RN、生成 lockfile 或首次 Prebuild 前处理版本决定；首次原生构建前落实设备与身份 |
| G6-A：Owner 内部 TestFlight | **BLOCKED** | 无付费 Apple Developer Program、App Store Connect app record、分发签名、Archive、隐私清单、出口合规与真机证据 | 首次上传 build 前全部完成 |
| G6-B：朋友外部 TestFlight | **BLOCKED** | 除 G6-A 外，还缺外部测试分组、Test Information、Beta App Review、AI 审查访问和第三方 AI 明示同意口径 | 邀请第一位外部测试者前完成 |
| G7：长期分发 | **BLOCKED** | D-008 明确把长期渠道留待后续；隐私政策公开 URL、App Privacy、渠道、地区与商店合规未冻结 | 提交正式 App Review 前完成 |

`BLOCKED` 表示退出证据不存在，不表示 D-005、D-008、D-011 或 D-016 有误；它是本独立审查的 disposition，不替代 `stage-gates.md` 中 G6/G7 的正式 `FAIL` 状态。Windows 环境仍可继续产品、设计、纯 TypeScript、规则测试和文档工作。

## 2. 按严重度排序的发现

### REL-P0-01：D-032 与可运行 Mac 尚未落实

- **状态**：`BLOCKED / 开发阻断`。
- Expo 2026-07-31 的 latest 矩阵为 SDK 57.0.0、React Native 0.86、React 19.2.3、Node 22.13.x、最低 iOS 16.4、Xcode 26.4+。这只是候选证据，D-032 明确要求在工程初始化或 lockfile 之前由 Owner 冻结兼容矩阵。
- Apple 自 2026-04-28 起要求上传到 App Store Connect 的 app 使用 Xcode 26 或更高版本及 iOS 26 SDK；因此 Expo 的 Xcode 26.4+ 候选比 Apple 上传下限更严格，不冲突。
- Apple 当前系统要求页列出的稳定 Xcode 26.4.1、26.5、26.6 均需要 macOS Tahoe 26.2 或更高版本；核验日的最新稳定版是 Xcode 26.6。不能只确认“有一台 Mac”，必须记录具体机型、可安装的 macOS、Xcode、磁盘空间、Apple silicon/Intel 状态和能否连接目标 iPhone。
- **关闭证据**：Owner 接受 D-032；一台满足所选 Xcode 的 Mac；干净 clone 上的 Node/包管理器/Pods 安装记录；Development 与 Release Archive；选定版本的兼容 Spike。
- **截止**：D-032 在任何 Expo/RN 初始化前；Mac 证据在首次宣称原生能力完成前，最迟 G4 退出前。

### REL-P0-02：Apple 分发身份、协议与角色缺失

- **状态**：`BLOCKED / G6`。
- 免费 Apple Account/Personal Team 可用于个人真机开发，但 App ID、测试设备与 provisioning profile 均存在 7 天限制，且不能提供 TestFlight 或稳定朋友分发。Apple Developer Program 当前为每会员年度 99 USD 或当地货币；入会还要求满足 Apple 的身份、年龄与双重认证条件。
- TestFlight、App Store Connect 分发与正式签名需要有效的 Apple Developer Program 会员资格。个人入会时 App Store seller 显示个人法定姓名；组织入会显示组织法定实体名称，并需要 D-U-N-S 和具备法律约束权的人作为 Account Holder。
- Account Holder 负责最新协议与续费；没有签署最新协议时不能创建 App Store Connect app record。单人项目可以由 Owner 担任 Account Holder，但不能把 Apple Account 密码、双因素验证码、私钥或恢复信息写入仓库、JSONL 或共享文档。
- **Owner 待决**：个人还是组织入会、对外 seller 名称、费用与续费责任人。推荐仅在接受公开显示个人法定姓名时采用个人会员；否则先确认是否已有合规组织实体，不得为了隐藏姓名虚构组织。
- **截止**：本地真机 Spike 可先用 Personal Team；创建正式 App ID/App Store Connect 记录或任何 TestFlight build 前必须关闭。

### REL-P0-03：Bundle ID、App ID、Team 与签名链尚未冻结

- **状态**：`BLOCKED / 首次签名构建与 G6`。
- Apple 要求 explicit App ID 中的 Bundle ID 与 Xcode target 完全一致；App Store Connect 中的 Bundle ID 在上传 build 后不能修改，SKU 在创建 app record 后不能修改。
- 当前仓库没有 Owner 批准的 Bundle Identifier、Team ID、SKU、签名管理方式或 App Store Connect app record。建议使用 Owner 控制的稳定反向域名命名空间，例如 `com.<owner-controlled-namespace>.nuttie`，但该值不能由团队代替 Owner 决定。
- 推荐首版由 Xcode 自动管理 development/distribution signing；若采用手动签名，需要明确 development certificate、Apple Distribution certificate、App Store Connect provisioning profile、撤销与轮换负责人。无论哪种方式，私钥只进入受控 Mac Keychain，不进入 Git、普通备份、事件流或聊天。
- Release profile、签名产物和嵌入 entitlements 必须验证只含批准能力；当前首版不得出现 iCloud、CloudKit、ubiquity container、APS/remote push 或 HealthKit capability。
- **关闭证据**：Owner 选定 Bundle ID/SKU/Team；explicit App ID；签名策略；Development/Distribution profile；Archive 的 `application-identifier`、Team ID、Bundle ID、entitlements 与 App Store Connect 记录一致。
- **截止**：Bundle ID 最迟首次 Prebuild/真机签名之前稳定；app record 与 distribution signing 在首次 TestFlight 上传之前。

### REL-P0-04：隐私清单、Required Reason APIs 与第三方 SDK 供应链尚无产物证据

- **状态**：`BLOCKED / G6 上传`。
- Apple 自 2024-05-01 起不接受未在 privacy manifest 中说明 Required Reason API 用途的新增或更新 app。每个包含 executable/dynamic library 且使用相关 API 的 bundle 都要有自己的准确声明，不能只用主 app 的 `PrivacyInfo.xcprivacy` 替第三方依赖兜底。
- Apple 要求其清单中的常用第三方 SDK 随新 app 或新增 SDK 的更新携带 privacy manifest；以 binary dependency 形式使用时还要求 SDK signature。Apple 当前清单明确包含 `hermes`，因此若 D-032 的 RN/Expo 产物包含 Hermes，必须核对其实际版本、manifest 和适用签名，而不能依据包名推定通过。
- App 自身、Pods、Swift Packages、Expo plugins、Hermes、SQLCipher、SecureStore、相机/图片/通知依赖都应进入 SBOM 和 privacy manifest 审计。Xcode 聚合 Privacy Report 只能帮助审查，不能免除团队核实每项声明真实性的责任。
- **关闭证据**：Archive 中每个 target/framework 的 manifest 清单；Required Reason API 扫描；Xcode 聚合 Privacy Report；Apple listed-SDK manifest/signature 核验；App Store Connect 上传无相关 error/warning。
- **截止**：依赖首次锁定时建立基线；每次依赖升级重跑；首次 TestFlight 上传前为硬阻断。

### REL-P0-05：第三方 AI 明示同意与 App Privacy 口径未闭合

- **状态**：`BLOCKED / 外部 Beta 与 G7`。
- Apple App Review Guidelines 5.1.2(i) 当前明确要求：个人数据与第三方共享前，要清楚说明数据会在哪里、如何使用；与第三方 AI 分享时也要取得 explicit permission。Apple 没有规定所有 AI 载荷都必须“每次弹窗”，但“用户点了发送”不能自动代替有证据的知情同意。
- D-014 已完整覆盖营养标签照片的首次说明与逐次预览确认，但餐食照片、纯文本描述和趋势摘要仍由 D-033/UXD-13 决定。D-033 至少必须定义：展示的实际 host/model、载荷类型、同意记录的作用域、Provider/host/model 变更后的重新同意、撤回/取消语义，以及请求开始后无法保证远端撤回。
- App Privacy 的“收集”定义取决于数据是否被 app 或第三方伙伴在实时处理所需时间之外访问/保留。Nuttie 允许任意 OpenAI-compatible BYOK Provider，无法替 Provider 保证不保留载荷，因此 G7 不能未经 Provider/数据流分析直接选择 `Data Not Collected`。
- 需逐项评估 `Health & Fitness`、`Photos or Videos`、`Other User Content` 以及 Provider 可能获得的其他数据，区分本地存储、实时传输、Provider 保留、是否 linked 和用途；不得把 Apple/TestFlight 平台诊断与 Nuttie 自建遥测混为一谈。
- 对健康/健身语境中的营养、体重和趋势数据，明示同意也不能自动正当化第三方广告、营销、通用训练或与健康管理无关的数据挖掘。任意 BYOK Provider 的保留、训练和人工访问条款不可验证时，会形成独立 App Review 风险；产品/安全必须决定如何证明所选 Provider 的用途相容，不能只把责任推给用户。
- **关闭证据**：D-033/UXD-13 Owner 决定；AI consent 状态机与测试；Provider 数据流矩阵；App Privacy 回答草案经产品/安全/Release 共同签署；真机证明取消前未发请求、in-flight 取消不作远端撤回承诺。
- **截止**：相应 AI 界面进入实现前决定；第一份含该能力的外部 TestFlight build 和 G7 提交前完成。

### REL-P0-06：SQLCipher 与备份加密触发出口合规判定

- **状态**：`BLOCKED / G6 build compliance`。
- Apple 要求任何使用、访问、包含、实现或集成加密的 app 在上传、测试和分发前完成 export compliance determination。Nuttie 不只使用 Apple OS 的 TLS/Keychain，还计划使用 SQLCipher 和 D-027 的非系统备份加密实现，不能默认按“仅 Apple 操作系统内置加密”回答。
- Apple 当前参考表说明：使用非 Apple OS 提供的行业标准算法时，如在法国 App Store 分发，需要上传法国加密声明；专有/非标准算法还需要美国 CCATS 与法国声明。Nuttie 的设计禁止自研算法，但最终算法、实现库和可用地区仍未冻结。
- 不得在未完成判定前盲目写入 `ITSAppUsesNonExemptEncryption=false`。如果 App Store Connect 判定需要材料，应先获批、把 Apple 返回的 key 正确配置到 Xcode，并在 TestFlight build 上消除 `Missing Compliance`。
- **关闭证据**：D-027 最终实现清单；出口合规问卷记录；目标地区；需要时的法国声明/Apple approval；Archive Info.plist 与 App Store Connect build 状态一致。法律判断由 Owner/合格顾问负责，本报告不代替法律意见。
- **截止**：第一次把 build 加入任何 TestFlight group 前；算法、依赖或地区变化时重新评估；G7 再确认。

### REL-P0-07：iOS 17 与最新 iOS 真机矩阵没有设备证据

- **状态**：`BLOCKED / G6`。
- D-011 决定 deployment target 为 iOS 17+，不等于只测 iOS 17。核验日当前公开稳定版本为 iOS 26.6。持续可重复的最小矩阵应保留一台 iOS 17.x 真实 iPhone 和一台运行 iOS 26.6（或执行日更新的公开稳定版）的真实 iPhone；同一设备升级后通常无法回退，因此长期回归不应把两者当成可随意互换的一台设备。
- 最低还应有 iOS 17 simulator 与所选 Xcode 的最新稳定 simulator。iOS 27 beta 只能作为前瞻补充，不能代替当前公开稳定版本的发布证据。
- 真机必测：Development Build 与 TestFlight 安装/升级、相机/扫码、系统照片 picker、通知授权/撤销/Focus、Keychain 锁屏/重启/卸载重装、SQLCipher 迁移、Files 导入导出、低存储、飞行模式、备份排除、删除状态机、旧 build 到新 build 的数据保留。
- 主 app、extension、Podfile/生成配置及最终 Archive 的有效 deployment target 必须与 17.0 基线一致；所有 Pods 和 embedded frameworks 必须兼容 iOS 17，且不得把最终 app 的有效最低版本抬高到 17.0 以上。模拟器不能替代相机、通知、Keychain 卸载、真实文件提供方和 TestFlight 验收。
- **关闭证据**：设备清单（型号、OS、用途、Owner）；每条真机用例结果；TestFlight 升级证据；Xcode build metadata 的 `MinimumOSVersion=17.0` 或等价值。
- **截止**：G4 可先记录采购/借用计划；G6 必须有实际通过证据。

### REL-P1-08：D-008 没有决定内部/外部 TestFlight 运行方式

- **状态**：`CONDITIONAL / G6`。
- TestFlight build 最长测试 90 天，过期后不可用。内部测试最多 100 名具有 app 内容访问权的 App Store Connect 用户；把普通朋友加成内部用户会扩大后台访问面，不应作为默认朋友分发方式。
- 外部测试最多 10,000 人。首个提交到外部测试的 build 需要完整 TestFlight App Review；同一版本后续 build 可能不再需要完整审核，但 Apple 保留审核权。外部测试需要 Beta App Description、Feedback Email、联系人、What to Test、review notes 等 Test Information。
- `TestFlight Internal Only` 上传的 build 只能进入内部组，不能再用于外部测试或顾客分发。Archive 前必须知道该 build 是 Owner 内部烟测还是朋友外部测试。
- **推荐但未批准**：Owner 自己先用普通内部 build 烟测，通过后用非 Internal Only build 申请外部 Beta Review，再按 email 邀请朋友；不使用公开链接，除非 Owner 接受链接转发和匿名 tester 的风险。
- **关闭证据**：Owner 选择测试层级；内部/外部 group 规则；review metadata；测试者数据访问说明；build 90 天轮换与反馈处理方案。
- **截止**：首次 TestFlight Archive 之前选择 build 类型；邀请朋友之前完成外部审核。

### REL-P1-09：相机、照片与通知文案尚未形成可签名配置

- **状态**：`CONDITIONAL / 首个真机 build，G6 前必须关闭`。
- 使用相机 API 必须提供 `NSCameraUsageDescription`；缺失会导致系统拒绝/终止访问。简体中文文案应同时准确覆盖“拍摄餐食/营养标签”和“扫描条码”，不能笼统写“改善体验”。具体文字属于 Owner/设计确认项。
- 仅选择用户指定图片时优先使用 out-of-process Photos picker；Apple 明确说明该模式无需申请整个照片库权限。只有依赖实际读写照片库时才加入准确的 `NSPhotoLibraryUsageDescription`，仅写入时使用 add-only 对应权限；不得为了库的默认行为扩大权限。
- 本地通知需要在上下文中调用系统 authorization；Apple 建议在用户创建首个提醒时请求，而不是首启批量请求。通知没有通用的 Info.plist usage-description key；Nuttie 应保留当前“功能内解释 + 系统授权”设计，并继续禁止 APS/remote push entitlement。
- **关闭证据**：Owner 批准的简中文案；生成后 Info.plist 与 Expo config diff；系统 picker 路径；权限拒绝、restricted、撤销、设置恢复与通知对账真机测试。
- **截止**：相应 capability 第一次进入 Development Build 前；G6 前全部通过。

### REL-P1-10：公开隐私政策 URL 与 App 内入口缺失

- **状态**：`BLOCKED / G7；外部 Beta 前强烈建议关闭`。
- Apple 要求所有 app 在 App Store Connect 提供公开可访问的 Privacy Policy URL；App Review Guidelines 还要求 app 内存在易访问的隐私政策入口。App Store 正式版本还要求可让用户联系开发者的 Support URL。只把 Markdown 放在仓库、使用 `file://` 或 `localhost` 不满足这些公开 URL。
- 这不要求租用业务服务器。可选低成本方案是同一静态 HTTPS 站点提供隐私政策与支持页，同时在 App 内内置可离线阅读的同版隐私正文并显示公开 URL。任何部署/发布静态页面仍是外部变更，需 Owner 单独授权。
- 政策必须准确覆盖：本地健康/饮食数据、SQLCipher/Keychain、手动 Files 导出位置、第三方 AI/BYOK、Provider 保留不受 Nuttie 控制、Apple/TestFlight 平台诊断、删除/撤回、联系方式和变更日期。不得写“任何数据都不会离开设备”。
- **关闭证据**：Owner 批准文本与托管位置；Privacy Policy/Support 两个公网 HTTPS 入口可访问；App 内离线隐私入口；App Store Connect URL；政策版本与 App Privacy 回答一致。
- **截止**：正式 App Review 前硬阻断；外部 Beta Review 前完成可以显著降低 5.1 合规风险。

### REL-P1-11：App Review 对 BYOK AI 的可审查性尚无方案

- **状态**：`CONDITIONAL / 外部 Beta 与 G7`。
- App Review Guidelines 2.1 要求提交物完整、URL 可用，并向审核提供完整功能访问与非显而易见功能说明。Nuttie 无业务账号是优点，但 AI 功能要求审核员自带兼容 Base URL/model/key，可能无法在审核环境中验证。
- 不得为解决审核而把共享 key 打进 IPA、仓库或公开 review notes。也不能静默加入远程 demo backend，因其改变 D-003 和本地优先边界。
- **需要产品/安全/Release 共同形成方案**：在 review notes 清楚说明 AI 为可选 BYOK、核心功能完全离线；提供可复现步骤和可公开的协议说明；若 Apple 要求实际 AI 访问，再由 Owner 决定受控、可撤销的 reviewer credential 交付或另行批准的本地 demo mode，并重新过安全/范围审查。
- **关闭证据**：Beta/App Review notes、测试步骤、审核联系人、无敏感信息的示例、被批准的 reviewer access 方案。
- **截止**：第一次外部 TestFlight Beta Review 前；正式 App Review 前复核。

### REL-P1-12：iPhone/iPad、方向与商店设备支持未决定

- **状态**：`DECISION_REQUIRED / 工程配置`。
- D-011 只决定 iOS 17+；D-016 只决定首发简体中文。两者都没有批准 iPad、横屏、Mac with Apple silicon 或 Apple Vision Pro 上运行 iPhone/iPad app。
- `supportsTablet`、`UIDeviceFamily`、支持方向以及 App Store Connect 中 Mac/Apple Vision Pro availability 会直接扩大截图、布局、权限和真机矩阵，不能采用 Expo 默认值后再把它视为决定。
- **推荐但未批准**：首个 iOS 增量只声明 iPhone、竖屏主路径；iPad/横屏/Mac/Apple Vision Pro 作为独立 Owner 决定。即使如此，小屏、Dynamic Type 与 VoiceOver 仍是首版硬门禁。
- **截止**：首次 Prebuild 生成 target 配置前。

### REL-P1-13：长期朋友分发渠道与地区组合仍未决定

- **状态**：`BLOCKED / G7`，符合 D-008 的预期留白。

| 渠道 | 官方约束 | 对“本人和朋友”的适配 |
| --- | --- | --- |
| 普通 App Store | 公开可搜索；完整 App Review、商店元数据、隐私/地区合规；持续依赖有效的年度会员 | 稳定、更新运维最低，但接受公开展示 |
| Unlisted App | 完整 App Review 后另行申请；仅通过直接链接发现；不能是 beta；任何拿到链接的人都可安装；同样持续依赖有效会员 | 最接近“朋友长期使用”，但链接不是访问控制 |
| Ad Hoc | 需要朋友设备 UDID、distribution certificate/profile；每产品家族每会员年度最多注册 100 台，禁用设备不会返还当年名额 | 少量设备可用，更新和到期维护重，不是首选长期渠道 |
| Custom App | 通过 Apple Business/School Manager 指定组织，依赖组织 ID、MDM 或兑换码 | 普通个人朋友通常不适用 |
| Enterprise | 只适用于至少 100 名员工且通过 Apple 持续核验的合格组织，把专有 app 分发给自己的员工；当前为 299 USD/年，不能给普通朋友 | 明确不适用 |
| Personal Team | App ID、设备与 profile 7 天限制，无 TestFlight/App Store 分发 | 仅个人短期开发，不是长期渠道 |
| TestFlight | build 90 天、Apple 服务依赖、外部测试可能审核 | 只用于 D-008 已批准的开发期 |

- **推荐但未批准**：长期方案优先比较 Unlisted 与普通 App Store；Ad Hoc 只作极少设备、接受运维成本时的备选。若选择 Unlisted，需要明确“链接泄露即可安装”是否可接受；Nuttie 当前没有账号或服务器，不能声称只允许指定朋友。
- App Store/Unlisted 依赖会员续费。Apple 当前说明会员过期会停止新下载，已安装用户通常仍可运行；这仍不等于可放弃续费，因为更新、重新下载、证书和 App Store 管理都会受影响。
- 地区必须与渠道一起决定：法国可能触发非系统行业标准加密声明；EU 分发需处理 DSA trader/non-trader 信息。中国大陆合规项必须在选定 storefront、分类与功能后，按提交时 Apple 和主管机关的一手要求逐项核验；本快照没有取得足以证明 Nuttie 当前必须提供 ICP filing 的一手证据，因此不把 ICP 写成已触发义务。若 App 在 EU/EEA、UK 或 US 提供，并且主/次分类选择 `Health & Fitness`/`Medical`，或 Age Rating 的 `Medical or Treatment Information` 标为 `frequent`，则必须完成 Regulated Medical Device Status 声明；届时应按实际资质如实回答，不能跳过，也不能在没有监管资质证据时声称是受监管医疗器械。
- **截止**：G7 决策包必须同时包含渠道、可用地区、seller 身份、费用/续费、链接访问风险和地区合规；不得只选渠道名。

## 3. 已通过或方向正确的项目

| ID | 状态 | 审查意见 |
| --- | --- | --- |
| REL-PASS-01 | `PASS` | D-005 的 Expo Development Build + Prebuild + 检入 `ios/` 与 SQLCipher、自定义原生配置和 Release 审计需求一致；Expo Go 不可作为验收环境 |
| REL-PASS-02 | `PASS` | D-011 的 iOS 17+ 高于 Expo SDK 57 当前最低 iOS 16.4；只要 D-032 选定的 Xcode/SDK 支持 iOS 17 deployment target 即无冲突 |
| REL-PASS-03 | `PASS` | D-008 已明确 TestFlight 只有开发期用途并记录 90 天失效，没有误写成永久分发 |
| REL-PASS-04 | `PASS` | D-016 的简体中文首发可行；它要求权限文案、错误、VoiceOver、TestFlight test information 和商店首发元数据都有简中基线，不代表 UI 双语 |
| REL-PASS-05 | `PASS` | 当前架构禁止 remote push、iCloud/CloudKit、EAS OTA、遥测和 crash SDK，并要求 Archive entitlements/网络捕获审计，方向符合本地优先承诺 |
| REL-PASS-06 | `PASS` | 当前文档已正确区分 Nuttie 自身无遥测与 Apple/TestFlight 可能收集 crash、session、tester feedback 的平台边界 |

这些 PASS 只表示文档方向正确，不是构建、签名、真机或 App Review 已通过。

## 4. Owner 需要确认的最小发布决策包

本节把“需要 Owner 做行为选择”和“Account Holder 只需提供或核验的事实信息”分开。临时 ID 只用于本审查，不是新的权威 D 编号；PM 应与现有 UXD/D-018+ 去重后小批提交，不能把每个 Apple 字段都升级为一条决定。

### 4.1 可合并为候选 D-### 的 Owner 选择

| 临时 ID | PM 治理去向 | Owner 真正需要选择的行为 | 推荐 | 最迟时点 |
| --- | --- | --- | --- | --- |
| REL-DEC-A | 并入现有 D-032 | 冻结哪组 Expo/RN/React/Node/Xcode/CocoaPods/New Architecture 兼容矩阵 | SDK 57/RN 0.86 只作首个 Spike 候选；高风险原生路径和稳定 Archive 全过后再接受 | 初始化工程或生成 lockfile 前 |
| REL-DEC-B | PM 草案 D-047 | Apple Developer Program 使用个人还是合格组织身份，以及谁承担 Account Holder、费用和续费责任 | 只有在接受商店公开个人法定姓名时选个人；否则先证明真实组织与 D-U-N-S | 创建正式 App ID/App Store Connect record 前 |
| REL-DEC-C | PM 草案 D-048；不要与标识字段混为一条 | 首个增量与首发是否只支持 iPhone/竖屏，是否开放 iPad、横屏、Mac 或 Apple Vision Pro availability | 首个增量采用 iPhone/竖屏主路径；其他设备面分别评估后再开放 | 首次 Prebuild 生成 target 配置前 |
| REL-DEC-D | PM 草案 D-049，作为 D-008 的运行补充 | Owner 和朋友分别走内部还是外部 TestFlight，以及朋友使用 email 还是 public link | Owner 先内部烟测；朋友用 email 外部测试；同一候选 build 不使用 `Internal Only` | 首次 TestFlight Archive 前 |
| REL-DEC-E1 | 并入现有 D-033/UXD-13 | 非营养标签类 AI 载荷如何展示、确认及在 host/model 变化后重新取得同意 | 所有图片逐次预览；文字持续显示 host/model；Provider 配置变化后重新同意 | 实现相应 AI 界面前 |
| REL-DEC-E2 | PM 草案 D-053；不得并入 D-033 或伪装成 App Privacy 填表偏好 | 分发 build 遇到无法证明保留、训练、人工访问和健康数据用途相容的 BYOK Provider 时，是限制敏感载荷/Provider profile，还是关闭相应 AI 能力 | 只允许具有可审计相容证据的 Provider/载荷组合；无法证明时阻止发送，不能用用户同意替代 Apple 健康数据限制 | 第一份含相应 AI 能力的外部 Beta 前 |
| REL-DEC-F | PM 草案 D-050 | 在“不建设业务服务器”边界下，由谁控制哪个静态 HTTPS 位置长期发布 Privacy Policy 与 Support 页面 | Owner 控制的静态 HTTPS 地址 + App 内离线隐私正文；不引入业务后端 | 外部 Beta 前形成草案，G7 前公开可用 |
| REL-DEC-G | PM 草案 D-051，作为 D-008 的长期分发后续 | 稳定版采用 Unlisted 还是普通 App Store，并在哪些国家或地区提供 | 优先比较 Unlisted 与普通 App Store；把中国大陆、法国、EU 等地区和渠道一起决定 | G7 决策包 |
| REL-DEC-H | 并入现有 D-029 | iOS Archive 在受控本地 Mac、自托管 Mac runner 还是第三方云构建，以及签名凭据是否进入第三方边界 | G5/G6 先使用受控本地 Mac，不上传 signing credentials 到第三方 | 配置外部 CI 或上传任何签名凭据前 |

D-014 不属于上述待决范围。它已经且仅已经批准“营养标签照片”首次说明、逐次预览和当次确认；餐食照片、纯文本与趋势摘要仍归 D-033/UXD-13。App Privacy answers 以及 Provider 实际保留/训练事实是合规声明，不是 Owner 可以按偏好选择的答案。

### 4.2 必须提供或核验的信息，不新建决定

| 信息组 | 必须提供或形成的内容 | 治理边界 |
| --- | --- | --- |
| Apple 账号与角色 | 已生效会员类型、Account Holder、Team ID、协议状态、App Store Connect 角色 | REL-DEC-B 决定身份模式后记录事实；密码、2FA、恢复信息、私钥不得进入仓库、文档或 JSONL |
| App 标识 | Owner 明确确认的 Bundle ID、SKU、App Store Connect app record 与 target 一致性 | 值必须在不可变时点前书面确认，但除非改变命名空间策略，不为每个字符串建立 D 编号 |
| 测试与审核联系人 | Feedback Email、Support URL、Beta/App Review 联系人和可用的审核说明 | 属于发布元数据和运维责任，不是产品行为决定；个人敏感信息只进入 Apple 后台或受控记录 |
| 公共文档地址 | Privacy Policy URL、Support URL、App 内隐私入口版本 | REL-DEC-F 决定托管边界后提供实际 URL，并验证无需登录即可访问 |
| 设备与工具实况 | Mac 型号/macOS/磁盘/架构、Xcode 实装版本、iPhone 型号/iOS/用途、真机结果 | 是 D-032 和门禁的执行证据，不因“拥有哪台设备”另建决定；UDID 不进入普通文档或事件流 |
| 隐私与 AI 事实 | Provider 数据流、保留/训练/人工访问条款、App Privacy answers、consent 测试证据 | 必须按可证事实填写；不能由 Owner 选择更好看的标签，也不能用 D-003/BYOK 把责任全部转给用户 |
| 加密与地区合规 | 最终算法/依赖、出口合规判定、Apple approval 或地区材料、目标 storefronts | 技术选型可由既有 D-027 等候选治理；法定问卷和材料是证据，不是偏好 |

### 4.3 D-032 的合并边界

D-032 应冻结一个整体兼容矩阵：Expo SDK、React Native、React、Node、Xcode、CocoaPods、New Architecture 状态、高风险原生依赖版本，以及继承 D-011 的 `17.0` deployment target；同时记录匹配的 macOS 要求和 SQLCipher、SecureStore、通知、相机、Prebuild hybrid ownership、Release Archive Spike 结果。包管理器和唯一 lockfile 已由 PM 草案单列为 D-037，不并入 D-032。

以下项目不得塞进 D-032：包管理器、个人/组织会员身份、Bundle ID/SKU/Team ID、iPhone/iPad 产品支持范围、TestFlight 内外部层级、AI Provider 合规政策、长期渠道与地区。实际 Mac/iPhone 清单也是退出证据而非版本选择。这样 D-032 可以在依赖升级时作为一个兼容矩阵重审，而不会意外重开商店身份或产品范围决定。

## 5. G6 可执行检查单

只有以下证据全部存在，PM 才能组织 G6 评审：

1. D-032、设备支持边界、TestFlight 层级和适用的 AI/托管候选已由 Owner 接受；Bundle ID、SKU、Team、账号角色和审核联系信息已提供并核验，而不是被误记为同一类决定。
2. 受支持 Mac/Xcode 可从干净 clone 完成 Development、Release 与 Archive；Apple 上传工具链满足核验日要求。
3. 有效 Apple Developer Program、最新协议、explicit App ID、App Store Connect record 和签名链。
4. Archive 的 Bundle ID、17.0 deployment target、entitlements、embedded frameworks、Info.plist、`PrivacyInfo.xcprivacy`、SDK signatures 与 SBOM 审计通过。
5. Export Compliance 已回答；build 不再显示 `Missing Compliance`；法国等地区材料按选择完成。
6. iOS 17.x 与最新公开稳定 iOS 真机矩阵通过；旧 TestFlight build 到新 build 升级不丢 SQLCipher 数据、Keychain、数据包或提醒规则。
7. 相机、照片 picker、通知权限、拒绝/撤销、飞行模式、本地通知、Files、低存储和删除状态机通过。
8. Release 未触发 AI 时全进程零业务网络；触发时仅经最终 D-036 profile；无 crash/analytics/remote push/CloudKit/OTA。
9. 外部测试时，Beta App Description、Feedback Email、What to Test、联系信息、review notes 和 BYOK AI 审查路径完整，首 build Beta App Review 已批准。
10. TestFlight 90 天轮换、测试者移除、反馈/Apple 平台诊断边界和回退方案已写入发布运行手册。

## 6. G7 额外检查单

1. Owner 明确授权具体 build、渠道、地区和上线动作；D-008 的长期渠道候选已转为 accepted 决定。
2. 公共 Privacy Policy URL、App 内隐私政策、App Privacy answers、第三方 AI consent 和 Provider 数据流相互一致。
3. App name、subtitle、description、keywords、support URL、截图、category、age rating、copyright、review notes 与简中元数据完成。
4. Regulated Medical Device Status、DSA、China mainland 当前合规项、France encryption 等仅在所选地区和触发条件适用的项目已按提交时一手要求逐项回答；不存在“默认全地区”或沿用过期地区清单的假设。
5. 最终 Archive 的隐私清单、Required Reason API、SDK signature、entitlements、出口合规、许可证、网络捕获与真机回归重新通过。
6. 发布说明、已知限制、加密备份提醒、无账号恢复边界、回退/恢复方案和 App Review 访问方案完成。

## 7. 官方证据索引（2026-07-31）

### Apple 账号、标识与签名

- Apple Developer Program membership 与 99 USD/年：<https://developer.apple.com/programs/whats-included/>
- Personal Team 7 天限制与会员对比：<https://developer.apple.com/support/compare-memberships/>
- 入会个人/组织与 Account Holder 条件：<https://developer.apple.com/programs/enroll/>
- 会员续费与过期影响：<https://developer.apple.com/help/account/membership/renewal/>
- 注册 explicit App ID：<https://developer.apple.com/help/account/identifiers/register-an-app-id>
- 创建 App Store Connect app record：<https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app>
- App 信息中 Bundle ID/SKU 不可变边界：<https://developer.apple.com/help/app-store-connect/reference/app-information/app-information>
- App Store Connect provisioning profile：<https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile>
- Ad Hoc profile：<https://developer.apple.com/help/account/provisioning-profiles/create-an-ad-hoc-provisioning-profile>
- 注册设备每产品家族每年 100 台：<https://developer.apple.com/help/account/devices/devices-overview>

### Xcode、Expo 与上传

- Apple 上传最低工具链（自 2026-04-28 起 Xcode 26 / iOS 26 SDK）：<https://developer.apple.com/news/upcoming-requirements/>
- Xcode 与 macOS/SDK/device support 矩阵：<https://developer.apple.com/xcode/system-requirements>
- Apple 当前系统与工具发布记录：<https://developer.apple.com/news/releases/>
- Expo SDK 57/RN/Node/iOS/Xcode 矩阵：<https://docs.expo.dev/versions/latest/>
- Expo Development Build 与本地 iPhone Developer Mode/unique Bundle ID：<https://docs.expo.dev/develop/development-builds/introduction/>
- Expo Prebuild/CNG 与 `ios/` 存在时的行为：<https://docs.expo.dev/workflow/continuous-native-generation/>
- App Store Connect 上传 build：<https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds>

### TestFlight

- 90 天、100 internal、10,000 external 与首外部 build review 概览：<https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview>
- Internal tester 与 Internal Only build：<https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers>
- External tester、Beta App Review 与 public link：<https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers>
- 外部测试信息：<https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information>
- Beta build 出口合规：<https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-export-compliance-information-for-beta-builds>

### 隐私、AI 与出口合规

- App Review Guidelines 2.1、5.1.1、5.1.2（含 third-party AI）：<https://developer.apple.com/app-store/review/guidelines/>
- App Store Connect App Privacy：<https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy>
- App Privacy 的 collected/linked/tracking 定义：<https://developer.apple.com/app-store/app-privacy-details/>
- Privacy manifest：<https://developer.apple.com/documentation/bundleresources/privacy-manifest-files>
- Required Reason API：<https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api>
- 第三方 SDK manifest/signature 清单：<https://developer.apple.com/support/third-party-SDK-requirements/>
- 出口合规概览：<https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance>
- 加密材料参考表：<https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption>

### 权限与长期渠道

- 相机用途说明：<https://developer.apple.com/documentation/bundleresources/information-property-list/nscamerausagedescription>
- Photos picker 无需全库授权：<https://developer.apple.com/documentation/photokit/selecting-photos-and-videos-in-ios>
- 通知按上下文请求：<https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications>
- iPhone/iPad App 在 Apple silicon Mac 上的 availability：<https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-macs-with-apple-silicon>
- iPhone/iPad App 在 Apple Vision Pro 上的 availability：<https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-apple-vision-pro>
- EU Digital Services Act trader 要求：<https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements>
- Regulated Medical Device Status：<https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status>
- Unlisted App：<https://developer.apple.com/support/unlisted-app-distribution/>
- Custom App / Apple Business / School Manager：<https://developer.apple.com/support/volume-purchase-and-custom-apps/>
- Apple Developer Enterprise Program：<https://developer.apple.com/programs/enterprise/>

## 8. 证据时效与复核规则

- Apple 的 Xcode、SDK、App Review、隐私、地区和 TestFlight 规则会变化。本报告只代表 2026-07-31 快照。
- D-032 接受前、首次 App Store Connect 上传前、每个外部 Beta 首 build、每次正式发布以及渠道/地区变化时，都必须重新打开官方页面复核。
- 页面政策变化若影响已接受决定、数据边界、分发范围或成本，必须发出 `FACT_CORRECTION`/`DECISION_REQUIRED`，不能由 Release 角色静默覆盖 Owner 决定。
