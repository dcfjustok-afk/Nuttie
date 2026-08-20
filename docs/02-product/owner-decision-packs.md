# Nuttie Owner 分批决策包

> 状态：`BATCH_1_CONFIRMED / D039_CONFIRMED / REFERENCE`
>
> 快照日期：2026-07-31
>
> 规则：本文件保留提交给 Owner 的原始选项。第 1 批已于 2026-08-14 完成整批回读：D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-037/D-038/D-047/D-048 已接受，D-032 为 `CANDIDATE + SPIKE_AUTHORIZED`。本文中的历史候选文案不能覆盖权威决定台账；后续批次仍是候选。

## 1. 使用方式

- D-001 至 D-025 中已进入权威台账的决定不在本文件重复询问。
- 第 1 批原生 `request_user_input` 与整批回读已经完成；D-039 后续由 Owner 明确选择 A 并完成 PX-4，不得重复询问。计划中的下一题为 D-040，但只能在其 PX-0/PX-1/PX-2 前置评审完成后提交。
- 后续批次只用于展示完整决策队列，不因出现在本文而自动进入实现。
- `Owner 输入` 是账号、设备或标识的事实，不是架构决定；缺失时保持阻断，不伪造占位值。
- `Spike 后再定` 表示可以先做受控实验，但在 Owner 接受结果前不能写入 Release 基线。
- 任何 Apple 注册、付费、外部 CI、TestFlight 上传或线上页面发布仍需要对应动作的明确授权；本文只确认方案。

## 2. 全局编号去重

工程候选保留 `D-018` 至 `D-036`。体验团队的临时 `UXD-*` 按下表并入全局编号：

| 原候选 | 全局候选 | 处理 |
| --- | --- | --- |
| UXD-01 | D-038 | 产品导航外壳；与 D-018 的导航库分开决定 |
| UXD-02 | D-039 | 添加餐食首层方式 |
| UXD-03 | D-040 | 首启资料与目标设置 |
| UXD-04 | D-041 | AI 指导的逻辑位置 |
| UXD-05 | D-042 | 健康评分实现顺序 |
| UXD-06、UXD-11 | D-031 | 照片、发送副本、AI 原始响应与生成内容保留 |
| UXD-07 | D-030 | 备份恢复语义与恢复点 |
| UXD-08 | D-043 | 删除全部本地数据的危险确认 |
| UXD-09 | D-044 | 默认餐次结构 |
| UXD-10 | D-045 | 最近使用与收藏 |
| UXD-12 | D-046 | 趋势首版时间范围 |
| UXD-13 | D-033 | 非营养标签类 AI 载荷的逐次确认范围 |
| REL-DEC-A/H | D-032、D-029 | 版本矩阵和签名构建位置，不另建重复决定 |
| REL-DEC-E | D-033 | 第三方 AI 同意范围，不扩大 D-014 |
| 数据许可 `DLR-C01` | D-052 | USDA 面向美国境外朋友的再分发口径 |

新增全局候选：`D-037` 包管理器、`D-047` Apple 分发身份、`D-048` 设备与方向、`D-049` TestFlight 测试层级、`D-050` 隐私/支持页面发布形态、`D-051` 长期分发渠道与地区、`D-052` USDA 境外再分发、`D-053` 第三方 AI Provider 数据用途准入。D-040 的 PX-0 问题分解另预留 `D-054` 至 `D-072`；这些只是候选 ID，不是决定台账条目或 Owner intake。

## 3. 第 1 批：方向确认与受控 Spike 门禁

本批不是“一次回复后全部开工”的授权书。各题分成三类：

- **可直接接受的方向决定**：Owner 选择后可进入权威台账；若后续证据失败，团队停止并提交 superseding decision，不自动换方案。
- **仅授权 Spike 的候选基线**：当前只有 D-032 明确采用两次 Owner 动作；第一次选择只允许在隔离目录验证候选，状态仍为 `CANDIDATE`，第二次才冻结最终精确矩阵。
- **事实输入**：OI-01~OI-03 可以回复具体值、`N/A`、`无`、`申请中` 或 `UNKNOWN`；团队不得生成占位账号、设备或标识。

门禁按发生时间分层：D-037 与 D-032 candidate baseline 阻断隔离 Spike；D-048 与 Bundle ID 阻断首次正式 Prebuild；D-038/D-018/D-020 等分别阻断对应产品或实现工作；D-047/OI-01 与 SKU 只在稳定签名、App Store Connect 或 TestFlight 前成为硬门槛。

### D-047 Apple 分发身份

**题目**：Nuttie 开发期 TestFlight 使用哪类 Apple Developer Program 身份？

- **A. 个人会员**：Seller 显示个人法定姓名；开通最快，适合个人项目。
- **B. 组织会员**：Seller 显示组织法定名称；需要真实法律实体、D-U-N-S 和组织授权。
- **C. 暂不加入**：只做本地原型；TestFlight、App Store Connect 和正式签名保持阻断。

**建议**：如果能接受个人法定姓名作为 Seller，选 A；如果必须展示品牌/公司名，选 B。团队不能替 Owner 判断该法律身份。

**同时提供的 Owner 输入**：当前会员状态、Account Holder、Team ID（若已有）。选 C 或尚未入会时允许写 `Account Holder=N/A`、`Team ID=N/A`。该决定不阻断文档、原型、`package.json` 或无签名 Simulator Spike，只阻断稳定真机签名、App Store Connect 与 TestFlight。

### D-048 设备与方向

**题目**：首次正式 Prebuild 使用哪个完整设备 profile？

- **A. iPhone 竖屏**：`supportsTablet=false`；iPhone 只声明 `Portrait`；Apple silicon Mac 与 Apple Vision Pro compatibility availability 均先关闭。
- **B. iPhone 全方向（不含倒置）**：`supportsTablet=false`；iPhone 声明 `Portrait + LandscapeLeft + LandscapeRight`；Mac/Vision availability 均先关闭。
- **C. Universal**：`supportsTablet=true`；iPhone 只声明 `Portrait`；iPad 声明 `Portrait + PortraitUpsideDown + LandscapeLeft + LandscapeRight`；Mac/Vision availability 均先关闭。

**建议**：A。三个 profile 已同时冻结设备族、方向和初始商店兼容可用性；若需要其他组合，应明确逐轴写出，不能让 Expo 或 App Store Connect 默认值代替决定。

### D-037 包管理器

**题目**：Node 依赖使用哪个精确包管理器 profile 和唯一 lockfile？以下版本是 2026-07-31 的 Spike 候选，最终仍须与 D-032 一起验证。

- **A. pnpm profile**：`pnpm 11.18.0`；精确 `packageManager` 字段；`.npmrc` 使用 `node-linker=hoisted`；唯一 `pnpm-lock.yaml`；门禁使用 frozen install。
- **B. npm profile**：`npm 11.19.0`；唯一 `package-lock.json`；门禁使用 `npm ci`；不自动跟随 registry 的 npm 12。
- **C. Yarn profile**：`Yarn 4.18.0`；精确 `packageManager` 字段；`.yarnrc.yml` 使用 `nodeLinker: node-modules`；唯一 `yarn.lock`；不使用 Classic 或 PnP。

**建议**：A。若 Windows/Mac/Prebuild/Pods Spike 不通过，停止并回报证据，由 Owner 选择是否 supersede 为 B/C；团队不得静默生成第二个 lockfile。

### D-032 Expo/RN/Node/Xcode 版本矩阵（第一次动作：Spike candidate baseline）

- **A. 授权隔离 SDK 57 Spike**：`expo ~57.0.9`、RN `0.86.2`、React `19.2.3`、Node `22.13.x`、Xcode `26.4+`；New Architecture 强制启用。只使用 Expo 兼容集合，不逐包抓 npm latest。
- **B. 授权隔离 SDK 56 Spike**：Expo SDK 56、RN `0.85.3`、React `19.2.3`、Node `20.19.x`、Xcode `26.4+`；New Architecture 同样强制启用，用作更成熟依赖窗口的候选。
- **C. 暂不授权任何工程或 Spike**：等待 OI-03 的 Mac/设备事实后再选择；继续只做文档与原型。

**建议**：A。选择 A/B 只授权在约定的隔离 `spikes/` 工作区创建候选 `package.json`、唯一 lockfile 和测试用 Prebuild；不得据此创建正式 Nuttie App 根工程，也不得把 D-032 标为 `ACCEPTED`。

Spike 必须覆盖 SQLCipher、Keychain、通知、相机、Prebuild diff、Debug/Release/Archive 和高风险依赖。完成后团队回传 lockfile/Podfile.lock 实际解析版本、Mac/macOS/Xcode/CocoaPods、New Architecture、真机与 Archive 证据，由 Owner 执行 D-032 的第二次动作：接受最终矩阵、改变候选或停止。

### D-038 产品导航外壳

- **A. 四个稳定目的地 + 情境新增**：日记、趋势、食品资料、设置；扫描和 AI 不独占主导航。
- **B. 三个稳定目的地 + 集中新增**：日记、趋势、设置；食品资料可发现性较低。
- **C. 单一日记中心 + 更多菜单**：最聚焦，但趋势、备份和食品管理较难发现。

**建议**：A。它只决定产品信息架构，不决定 D-018 的代码库。

**原型**：三种方案必须先通过 `prototypes/d038-navigation-shell/index.html` 的同等完整交互原型展示给 Owner；原型默认状态不代表选择。

### D-018 导航实现

- **A. Expo Router 作为初始实现**：使用与 D-032 匹配的 Expo Router；首版不依赖仍为 beta 的 typed routes，所有 deep link 参数继续做运行时校验。
- **B. React Navigation 直接配置作为初始实现**：使用与 D-032 兼容的稳定 major；路由图、linking 和类型集中维护。

**建议**：A。采用前验证今日记录、扫码、AI 预览、设置、备份恢复、未来 Widget deep link、返回/Modal 和 VoiceOver 焦点。任一硬场景失败时停止并向 Owner 回报，不自动切换 B。

### D-020 SQLite 访问层

- **A. Drizzle stable 作为初始访问层**：当前候选 `drizzle-orm 0.45.2` / `drizzle-kit 0.31.10`；管理应用写库 schema/query 类型，migration/FTS/数据包/完整性允许受控直接 SQL。
- **B. `expo-sqlite` + repository-owned SQL**：全部查询、migration 和类型映射由 Nuttie 维护；控制面最透明，样板最多。
- **C. Kysely + 明确的 Expo adapter/migration**：接近 SQL；需额外设计和验证 adapter，不使用未指定实现。

**建议**：A。无论选哪项，Nuttie 自有 `DatabaseSession` 必须在任何 ORM/schema 查询前完成 Keychain 状态机、开库后立即设 key、cipher 验证、独占 migration、故障关闭与恢复；访问层不得接管或绕过 SQLCipher 生命周期。A 不通过时停止并回报，B 只是首选回退建议，不自动生效。

### D-019 UI 状态管理

- **A. Zustand 只管理 UI/session/草稿状态**。
- **B. Redux Toolkit**：约束更强，但当前规模可能过重。
- **C. React state/context**：依赖最少，复杂跨页草稿更易耦合。

**建议**：A。SQLite 始终是领域真源，禁止把 repository 数据镜像成第二真源。

### D-021 表单与运行时校验

- **A. React Hook Form + Zod**。
- **B. Formik + Yup**。
- **C. 自研 reducer + 手写校验**。

**建议**：A。Zod 校验来自文件、AI、表单的 `unknown`；领域核心仍保留不依赖 Zod 的不变量。

### D-025 样式与设计 Token

- **A. React Native StyleSheet + TypeScript semantic tokens + 小型可访问组件层**：不增加 Babel/Metro/原生样式运行时。
- **B. NativeWind profile**：当前候选 `NativeWind 4.2.6 + Tailwind CSS 3.4.19`；必须把 Babel/Metro、class 合并、主题和生产构建纳入 Spike。
- **C. Unistyles profile**：当前候选 `react-native-unistyles 3.3.0`；必须同时验证 Reanimated、Nitro Modules、edge-to-edge 等原生 peer 与 D-032 的兼容性。

**建议**：A。选择 B/C 表示接受对应精确实现方向，但在原生/build Spike 通过前不得建立正式组件库；失败后回报 Owner，不自动退回 A。

### D-023 单元与组件测试

- **A. 单 runner**：与 Expo SDK 匹配的 `jest-expo + Jest + React Native Testing Library`；纯 Domain、hooks、组件和原生 mock 分层，不使用已弃用的 `react-test-renderer` 路径。
- **B. 双 runner**：`Vitest 4.1.10` 只运行纯 TypeScript Domain；RN hooks/组件仍使用 `jest-expo + Jest + RNTL`；分别维护 coverage 与门禁，接受双配置成本。

**建议**：A。它是 Expo/RN 路径的完整可执行 profile；B 只在纯 Domain 规模和速度收益足以承担两个 runner 时选择。

### D-024 端到端与原生测试

- **A. 本地 Maestro + XCTest/XCUITest**：当前 Maestro CLI 候选 `2.7.0`，只跑本地 iOS Simulator 核心旅程；真实 iPhone 的 Keychain、SQLCipher、通知、锁屏/重启和 TestFlight 升级由 XCTest/XCUITest 与真机检查覆盖；不启用 Maestro Cloud。
- **B. Detox + XCTest/XCUITest**：当前 Detox 候选 `20.51.4`；gray-box 同步更强，构建配置和维护更重；不默认并存 Maestro。
- **C. 仅 XCTest/XCUITest**：所有 iOS UI 与原生边界由 Swift 测试维护；平台一致，RN 页面维护成本最高。

**建议**：A。核心旅程本地连续运行 20 次无无法解释失败，且失败诊断完整后才保留；否则向 Owner 提交 B 与迁移成本，不自动切换。完整 E2E 管线可在 G5 前关闭，但组件开发开始时就必须提供稳定可访问名称和必要 `testID`。

## 4. 第 2 批：核心体验、隐私与安全

本批在第 1 批确认并形成低保真流程后提交，不在当前回复中默认处理。

| ID | 题目 | 选项摘要 | 当前建议 | 决定前置 |
| --- | --- | --- | --- | --- |
| D-039 | 添加餐食首层方式 | A 本地搜索/最近优先，扫描和 AI 并列；B 记住上次；C 全方式平铺 | `A / ACCEPTED / PX-4_BASELINE_FROZEN` | PX-5 B01/B02 已关闭；B03~B05 六卡统一复核包及输入冻结清单已准备，复核未开始；B03~B07 共 5 项待关闭 |
| D-040 | 首启资料与目标 | A 最小资料 + 可解释公式候选 + 用户确认；B 只手工；C 强制完整问卷 | 未到选择阶段 | 20 个独立决定轴已分配 ID；十三卡、健康与四张宏量轴卡复核包就绪，宏量包 10 份输入已冻结并记录 blob OID/SHA-256；前置接受、健康数值边界与文案、具名复核和采用证据仍未关闭 |
| D-042 | 健康评分顺序 | A 先营养解释、评分后续；B 本地公开确定性评分；C AI 每次评分 | A；C 不推荐 | 营养安全评审 |
| D-031 | 照片与 AI 内容保留 | A 只保存用户明确附加的压缩本地照片，临时副本/原始响应即删，AI 结果默认不保存；B 不保留任何照片或 AI 历史；C 逐项选择原图与经校验结果历史 | A；内部卡已完成自审，仍待独立复核，不可展示 | 媒体模型、备份体积与删除测试 |
| D-033 | 非标签 AI 载荷确认 | A 全部逐次预览；B 图片逐次预览，文字/汇总以明确发送动作并持续显示 host/model；C 只执行 D-014 最小范围 | A；内部卡已完成自审，仍待独立复核，不可展示 | Apple 5.1.2(i) 与 App Privacy |
| D-030 | 备份恢复语义 | A 全量替换 + 有空间时短期恢复点；B 仅替换无恢复点；C 合并 + 替换 | A | D-027 与空间/kill-point Spike |
| D-035 | 明文 JSON/CSV | A 首版仅加密备份；B 允许字段选择明文导出；C 延后到真实需求 | A/C | 字段合同、CSV 注入与隐私文案 |
| D-052 | USDA 境外再分发 | A 获得 USDA/NAL 书面确认前，境外 TestFlight 只内置台湾合规包；B Owner 接受残余风险并分包发布 | A | 官方书面澄清与 NOTICE 测试 |
| D-036 | AITransport profile | A 严格隔离：拒 query/fragment/userinfo、全部 3xx 终止、显式禁用 cache/cookie/credential storage；B 经确认的非秘密 query + 本地规则内同 origin 307/308；C 通用 RN fetch，须先证明原生边界 | A；内部卡已完成自审，仍待三 Provider 兼容 Spike、原生边界证据与独立复核，不可展示 | OI-07、精确 RN/Expo/iOS、Debug/Release 抓包与 redirect/session 证据 |
| D-053 | 第三方 AI Provider 数据用途准入 | A 十维证据满足固定标准才准入，未知即阻断；B 每个 Provider/产品/地区/载荷单独复核并由 Owner 接受已知有限残余风险，Apple 禁项不可豁免；C 用户同意广泛准入，但当前无法用同意替代 Provider 真相 | A；内部卡已完成自审，仍待 OI-07、逐 Provider 证据、App Privacy 映射与独立复核；C 当前不可进入 Owner 卡 | 法律实体/API 产品、terms/privacy 快照、十维用途证据、实际数据流和 Apple 5.1.2(i)/5.1.3 复核 |
| D-026 | 数据包签名 | A Ed25519 + RFC 8785 JCS；B Ed25519 + 原始 manifest bytes；C P-256 + 冻结编码 | A，须互操作 Spike | Swift/发布工具 golden corpus |
| D-027 | 备份加密 envelope（二维选择） | K1 Argon2id + AES-256-GCM / K2 PBKDF2-HMAC-SHA256 + AES-256-GCM；并另选 S1 两遍认证/解密 / S2 单遍隔离 staging | 先验证 `K1+S1`；Owner 必须各选一个维度 | 最低支持 iPhone 性能、AAD/TOCTOU 与供应链审查 |
| D-034 | AI 资源预算 | A 保守固定上限；B 平衡固定上限；C Provider 可收紧的固定全局天花板 | B；三档卡已完成四域自审，先做最低支持 iPhone benchmark，独立复核后才可展示 | 19 维预算、解压/JSON/清理和最低设备证据 |

D-014 只批准“营养标签照片”的首次说明和每次预览确认。D-033 未接受前，不得把 D-014 扩写为所有餐食照片、文本或趋势摘要已经获得逐次上传授权。

## 5. 第 3 批：完整体验与可用性

| ID | 题目 | 选项摘要 | 当前建议 |
| --- | --- | --- | --- |
| D-041 | AI 指导位置 | A 趋势内 + 情境入口；B 独立 AI 目的地；C 仅情境入口 | A |
| D-043 | 删除全部数据确认 | A 两步 + 输入设备生成短语；B 两步 + 长按；C 普通确认 | A |
| D-044 | 默认餐次 | A 早餐/午餐/晚餐/零食，首版固定；B 首版可自定义；C 仅时间线 | A；C 不满足已证实对标结构 |
| D-045 | 最近使用/收藏 | A 派生最近首版、收藏后续；B 两者分离且同时首版；C 都后续并重开 D-039 | A；内部卡已完成自审，仍待独立复核，不可展示 |
| D-046 | 趋势范围 | A 先 7 天；B 7/30/自定义首版；C 仅自定义 | A |
| D-022 | 图表实现 | A Victory Native；B Gifted Charts；C Swift Charts 包装 | 先做 A/B 的 7/30/365 天、VoiceOver 和最大字体 Spike |

视觉方向、App 图标、主辅色、明暗模式、动效和触觉暂不分配 D 编号。设计团队先交付情绪板/低保真对比，再由 Owner 选择，不能由 StyleSheet 选型反向决定品牌。

## 6. 第 4 批：发布与第二阶段

| ID | 题目 | 选项摘要 | 当前建议/边界 |
| --- | --- | --- | --- |
| D-029 | CI 与签名构建位置 | A 本地 Mac；B 自托管 Mac runner；C GitHub Actions/EAS 等云服务 | G5/G6 先 A；未批准前不上传源码、产物或签名凭据 |
| D-049 | TestFlight 层级 | A Owner 内部烟测后，朋友走 email 外部测试；B 仅 Owner 内测，不向普通朋友分发；C 外部公开链接 | A；不默认公开链接，也不把普通朋友添加成 App Store Connect 内部用户 |
| D-050 | 隐私/支持页面 | A 公共静态 HTTPS + App 内离线同版；B 现有个人站点；C 暂不发布 | A；C 阻断外部 Beta/G7，静态页面不等于业务后端 |
| D-051 | 长期渠道与地区 | A 普通 App Store；B Unlisted App；C 其他长期渠道；并单独选地区 | TestFlight 开发期不受影响；稳定后再选，任何发布仍需单独授权 |
| D-028 | HealthKit 第二阶段桥接 | A 经 Spike 的第三方库；B 窄接口自有 Expo Module | D-007 仍要求首版不接 HealthKit；进入第二阶段才提交 |

## 7. Owner 输入清单（不是默认值）

这些信息缺失时，团队保留 `UNKNOWN/BLOCKED`，不会生成看似有效的占位账号或签名配置。

| 输入 ID | 需要提供 | 用途 |
| --- | --- | --- |
| OI-01 | Apple Developer Program 状态（未加入/申请中/有效）、个人/组织；适用时提供 Account Holder 与 Team ID，不适用写 `N/A`；组织路径另说明真实实体与 D-U-N-S 状态 | D-047 与稳定签名/TestFlight；不得记录密码、2FA 或私钥 |
| OI-02 | Bundle ID 单独填写；SKU 可写 `尚未创建`；若已有 App ID/App Store Connect record 再说明。建议 Bundle ID 使用长期稳定的 Owner 命名空间，例如 `com.<owner-namespace>.nuttie` | Bundle ID 最迟首次正式 Prebuild/签名前稳定；SKU 只在创建 App Store Connect record 前需要 |
| OI-03 | Mac 型号、Apple silicon/Intel、macOS 精确版本、可用磁盘、Xcode 精确版本；iPhone 型号、iOS 精确版本、能否连接该 Mac。没有设备时明确写 `无` | D-032 原生 Spike 与 G6 真机矩阵；不得记录 UDID |
| OI-04 | 朋友人数、是否属于 App Store Connect 团队、是否接受 external Beta Review | D-049 |
| OI-05 | 隐私政策域名/静态托管偏好、Support URL 与反馈邮箱 | D-050 与外部 Beta |
| OI-06 | 首发/长期目标地区，特别是中国大陆、法国、EU | 出口加密、DSA、ICP 和地区合规 |
| OI-07 | 准备测试的 OpenAI-compatible Provider 名称及不含 key 的 terms/privacy URL 或快照；注明保留期限、训练、人工访问、删除和广告/营销用途，未知项明确写 `UNKNOWN` | D-033/D-036/D-053 兼容与隐私准入；证据不足时保持 BLOCKED |

## 8. 当前聊天决策流程

12 项 D 编号问题已通过原生选择卡和整批回读确认，详见 [Owner 第 1 批确认归档](../00-governance/owner-intake-pending.md) 与 `project-ops/owner-intake.json`；不得重复询问。D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-037/D-038/D-047/D-048 已写入决定台账，D-032 保持 `CANDIDATE + SPIKE_AUTHORIZED`。D-047 已由 Owner 回正为 C：当前不付费、只自用、不做 TestFlight、暂不考虑朋友；D-008 是否未来恢复或正式 supersede 仍留到后续决定。

OI-02 已确认 Bundle ID 尚未创建，具体值为空，App ID 与 App Store Connect record 均未创建，SKU=`N/A`；具体 Bundle ID 最迟在首次自用真机签名配置前另行确认。OI-03 已确认当前只有 `iPhone 16 Pro Max / iOS 26.5`、暂无可用 Mac。D-039 已由 Owner 选择 A 并完成 PX-4；B03~B05 六卡统一独立复核包及 10 项输入冻结清单已准备，但复核未开始且 B03~B07 仍开放。D-040 仍只是计划中的宿主原生队列占位，前三批十三张内部卡片已完成四域自审，十三卡独立复核包、中国健康评审九工件/十三项交接包和 WS/T 578.1-2017 宏量现行证据已形成，当前处于 `PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`。D-063 已形成三项互斥来源卡，D-070 已形成三项互斥输入形态卡，D-071 已形成三项互斥显示策略并固定来源单位、显式派生、raw/display、十进制舍入和残差披露边界；D-072 已形成二选一硬停止记录卡，并固定硬停止不可豁免、无目标事实不创建目标、历史不删不回算与数据控制持续可用。四卡复核包已固定 10 份输入、4 个复核域、4 卡逐项处置、14 条跨轴不变量和 P0~P3 标准，且 10 项输入清单已冻结到同一提交并记录 blob OID/SHA-256。D-063/D-070 尚未接受，D-068/D-069、健康数值边界与文案、Content QA 和独立复核未完成。三个包只代表材料可交接；卡片复核人和健康评审人都未具名，身份/资质/独立性/利益冲突未核验，实际复核、批准和 Content QA 未发生，也未发送外部消息。NIDDK 动态模型的论文、方程和七个当前网页代码资产已完成来源可行性核验，但逐文件许可、稳定版本、官方 oracle corpus、回归容差、保护线、具名健康评审和独立复核未完成；D-063、D-070、D-071、D-072 及 D-062/D-059 动态模型项仍未 Owner-ready，不得提前展示。

D-032 的 A 只有“隔离 SDK 57 JS Spike 授权”含义，不能直接记为最终接受；后续验证失败必须提交证据并触发第二次 Owner 动作，不允许团队自动切换选项。D-039 的接受依据是 Owner 查看冻结原型后的明确文字回复 `a` 和权威事件，不是原型默认状态或 PX-2 PASS；PX-4 完成仍不构成实现授权。

## 9. 当前执行边界

- 不创建正式 Nuttie 根工程、正式根 `package.json`、lockfile 或 `ios/`。允许在约定的隔离 `spikes/` 边界创建 SDK 57 JS candidate 工件；无 Mac/Xcode/CocoaPods 时不得执行 Prebuild 或原生部分。
- 不注册 Bundle ID、App ID、App Store Connect record，不付费，不上传 TestFlight。
- 可以继续完善文档、低保真原型、测试设计、许可证据和不依赖具体技术选型的工作台。
- G2、G3、G4 保持 `IN_PROGRESS`；G5 至 G8 维持未达到门禁的 `FAIL`。

## 10. 来源

- [体验候选](../03-design/open-decisions.md)
- [工程候选 D-018+](../04-engineering/decisions/decision-candidates.md)
- [数据许可审查](../05-quality/data-license-review.md)
- [iOS 发布准备审查](../05-quality/ios-release-readiness-review.md)
- Expo create-expo-app：<https://docs.expo.dev/more/create-expo/>
- Expo SQLite/SQLCipher：<https://docs.expo.dev/versions/latest/sdk/sqlite/>
