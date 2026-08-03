# 测试策略与发布门禁

> 状态：G4 初版
>
> 说明：测试类别和门禁已定义；Jest/Vitest、Maestro/Detox 等具体框架仍待 D-023、D-024 决策。

## 1. 原则

1. 测试覆盖风险和契约，不以快照数量代替行为验证。
2. 纯领域规则不依赖 React Native、SQLite、网络或当前系统时钟。
3. 每个 migration、数据包版本和备份版本都有永久 fixture。
4. 所有外部输入按恶意输入测试；失败必须证明“零写入/旧状态不变”。
5. iOS 原生能力必须在 Mac 和真实设备验证，Windows 结果不能替代。

## 2. 测试层级

| 层级 | 覆盖内容 | 必须场景 |
| --- | --- | --- |
| Domain unit | 营养换算、份量、目标、日期、统计 | kg/lb、kcal/kJ、每份/每100g、舍入、DST、跨日、缺失/trace |
| Application | 用例、事务、权限结果、AI 候选确认 | 重复提交、取消、超时、零写入、幂等 |
| Repository | SQL、约束、FTS、来源、迁移 | 全历史 migration、WAL、崩溃恢复、外键、并发写 |
| Data pack | manifest、签名、哈希、许可、intent/ref 启动对账 | 篡改、旧版本、撤销 key、ZIP bomb、路径穿越、空间不足、逐持久化点 kill |
| Backup | 一致性快照、加密 envelope、generation/pointer 对账 | 错误口令、末尾 tag 损坏、逐 chunk/持久化点 kill、媒体缺失、完整往返 |
| AI contract | URL/TLS、Provider policy、Provider adapter、session、schema、资源预算 | `ALLOW/DENY/UNKNOWN/EXPIRED`、policy/scope 变化、未配置、非 HTTPS、401/403、429、3xx profile、超时、取消、恶意/超大响应、临时文件清理 |
| Component | 表单、错误态、Dynamic Type、VoiceOver | 权限拒绝、离线、长简中文本、小屏、Reduce Motion |
| End-to-end | 真实用户关键路径 | 首启离线、手动记录、扫码未命中、AI 确认、备份恢复、删除全部 |
| Native/XCTest | Keychain、SQLCipher、通知、文件属性、网络 session、Extension | 锁屏/重启/卸载、pending/delivered 通知、backup exclusion、App Group、Widget/Activity、HealthKit 第二阶段 |

### 2.1 AT 到计划测试证据的反向索引

下表定义 G4 的测试合同和未来证据落点，不表示测试已经实现或执行。实际结果必须在 G5/G6 以命令、fixture、构建和真机报告替换“计划”状态。

| Acceptance ID | 主要测试层 | 计划合同/fixture |
| --- | --- | --- |
| AT-F01 | AI contract、Application、Component、E2E、Native capture | 图片 policy 准入、逐次确认、取消、候选校验、零外发/零写入 |
| AT-F02 | AI contract、Application、Component、E2E | 文字 policy 准入、草稿保留、恶意响应、手工降级 |
| AT-F03 | Data pack、Component、E2E、Native | 飞行模式 GTIN、未命中、损坏包、相机拒绝 |
| AT-F04 | Domain、Application、Repository | Eaten/Burned/Left、跨日、目标缺失、修改后重算 |
| AT-F05 | Domain、Application、Component | P/C/F 目标版本、零/缺失、舍入和历史生效 |
| AT-F06 | Application、Repository、Component、E2E | 四餐次、空态、移动/复制候选边界 |
| AT-F07 | Application、Repository、Component、E2E | 营养快照、编辑/删除原子性、Nuttie-required 操作标识 |
| AT-F08 | Domain、Component、E2E | Today/历史、DST、时区、未来日/补记候选边界 |
| AT-F09 | Domain、Data pack、AI contract、Component | 七项营养 provenance/缺失；评分/风险未决时不显示虚构结果 |
| AT-F10 | Domain、Repository、Component、E2E | kg/lb、精度、同日多笔、修改/删除重算 |
| AT-F11 | Domain、Repository、Component、Accessibility | 近 7 日摄入/消耗、空日、来源反查、图表文字摘要 |
| AT-F12 | Domain、Application、Component | 无账号本地档案、字段更正/删除、未决公式不冒充 |
| AT-F13 | Domain、Application、Component、Native（二阶段） | confirmed 消耗与 cross-source 运动/步数分离；首版无 HealthKit |
| AT-F14 | Domain、Repository、Component | 饮水单位、汇总、撤销和空态 |
| AT-F15 | Application、Component、E2E、Native | 本地通知 CRUD、拒绝/撤权、DST、pending/delivered |
| AT-F16 | AI contract、Component、E2E、Native capture | Provider policy、显式许可、非医疗、草稿不自动改事实 |
| AT-F17 | Application、Component、Release capture | 无注册/会话/服务端依赖，飞行模式完整本地路径 |
| AT-F18 | Repository、Backup、E2E、Native | 访问/更正/删除、wipe kill-point、Keychain/App Group/通知清理 |
| AT-F19 | Repository、Backup、Data pack、Native | SQLCipher、加密备份、generation/pointer、失败保持旧库 |
| AT-F20 | Static artifact、Component、Release capture | 无 StoreKit 产品、付费墙、权益、恢复购买和 IAP 网络 |
| AT-F21 | Component、E2E、Native permission | 任务触发相机/照片权限、拒绝后手工路径、无越权权限 |
| AT-F22 | Component、Accessibility、Native/Release | iOS17+、简中、320/375/430pt、Dynamic Type、设备族/方向待决 |
| AT-F23 | Dependency/artifact audit、Release capture | 无广告、遥测、崩溃上传、归因、远程配置和 OTA |
| AT-F24 | Static plist/entitlement audit、Native、Release capture | 无定位 usage string/capability/API 和运行时定位请求 |

G3 的旅程与状态反向索引分别位于 [关键用户旅程](../../03-design/key-user-journeys.md) 和 [状态、内容与无障碍基线](../../03-design/states-content-accessibility.md)。

## 3. 关键契约测试

### 3.1 唯一网络边界

- 静态规则：除 AI infrastructure 外，生产源码不得导入网络 API；同时审计 npm、Pods、Swift Packages、Expo plugins、entitlements、PrivacyInfo 和 embedded frameworks。
- 运行测试：Debug 与 Release 分开做全进程代理/URLProtocol/设备网络捕获；Release 完整本地流程未触发 AI 时请求数为零。
- 所有 AI 请求在读取 Keychain key、生成 Authorization 或组装敏感 body 前，先断言 D-053 已接受且本地版本化 `ProviderPolicyProfile` 对 origin/model/payloadClass/profileVersion 为 `ALLOW`；随后才断言前台用户动作、HTTPS host、model 和 Keychain key。营养标签照还必须有本次预览确认 token，其他载荷按 D-033 最终决定生成用例。
- 对 `DENY`、`UNKNOWN`、`EXPIRED`、证据过期、origin/model/payload/profile/地区变化和 policy 文件篡改分别做单元、集成、E2E 与全进程抓包；每种阻断状态都必须保持 Authorization/body 零外发、临时目录为空、数据库零写入。生产 App 不联网抓取 policy。
- 所有 profile 都验证 Authorization/载荷不发送到用户未确认 origin；query/fragment、userinfo、所有 3xx 和同 origin 例外按 D-036 最终选择生成兼容/拒绝用例。
- 若选择 D-036 严格 profile，证明专属 ephemeral session 不持久 cookie、URL cache 或 credential；WebView/remote Image 不产生 Provider 请求。RN `fetch` 无法证明时，原生 transport Spike 是阻断项。
- AI 请求/响应临时文件在成功、失败、取消、超限、wipe 和重启后均为空；D-034 每个输入/像素/request/response/stream/JSON/concurrency/disk 上限均有边界值和超限 fixture。
- 请求失败、取消或响应不合约时数据库变更集为空。

### 3.2 SQLite/SQLCipher

- 新建、升级、降级拒绝、错误 key、空 key、损坏页、WAL 恢复。
- 每个历史 schema fixture 逐版本迁移到当前版本，结果与 golden invariant 比较。
- 启动时找不到 Keychain key 但存在 DB 时，必须进入恢复态，不能创建空库覆盖。
- 覆盖 DB/generation、安装代、wipe/restore intent、DB key 与 AI key 的完整启动真值表：卸载重装、首次建库每个持久化点、旧 service/account、孤立 DB/AI key 和安装代不匹配均得到确定性结果；任何已有 generation 都不被空库覆盖。
- 删除状态机每一步后强制 kill/restart；在 gate 后发起并发写，等待每个 writer/task acknowledgement，再验证连接关闭前后、关连接后/删 key 前和删 key 后的状态。验证 `removeAllPendingNotificationRequests` 与 `removeAllDeliveredNotifications` 均生效，并递归枚举 sandbox/App Group 全部受控容器，只允许安全 allowlist 残留。DB/WAL/SHM、媒体、缩略图/AI 普通缓存、URL cache/cookie、日志、明文 staging、App Group 和 Keychain 必须为空。

### 3.3 数据包

- 每种来源保留许可和 attribution golden fixture。
- manifest 单字节篡改、payload 单字节篡改、错误 size/hash/keyId/signature 全部拒绝。
- manifest 预认证解析覆盖最大字节、JSON depth、字段/数组数量、字符串/path/keyId 长度和数字边界；深层 JSON、重复 key、未知关键字段、非有限数字、超长值和 canonical 数字边界全部拒绝。
- 超配额、嵌套压缩、未列出/缺失 entry、路径穿越、控制字符、NFC/大小写碰撞、符号链接和 special entry 全部拒绝。
- manifest `files` 必须逐项约束 catalog、NOTICE、实际存在的 LICENSE、provenance、transforms 和 aliases；分别单字节篡改每类工件时，发布工具与 Swift verifier golden corpus 都失败。
- 对 D-026 最终算法、exact signed bytes、trust root、not-before/not-after、撤销 key、旧 key 窗口和回滚策略使用跨发布工具/Swift verifier golden corpus。
- 导入步骤 2 至 13 的每个可持久化点强制 kill/restart；对账 intent、active/previous refs、final dirs 后只有完整旧版或完整新版，且 orphan 最终清理。

### 3.4 备份

- 全部 schema fixture 做导出 -> 删除本地 -> 恢复 -> 等价性检查。
- 等价性覆盖稳定 ID、时间、来源、七项营养、媒体哈希和用户覆盖。
- 错误口令、header/KDF 越界、末尾认证 tag 篡改和文件篡改不能产生可解析/映射/提交的未认证明文，不改变 active generation。
- 对公共 header 的 envelopeVersion、KDF、参数、salt、algorithm、nonce 和长度字段在合法范围内分别单字节篡改；重复/未知字段、编码差异、algorithm confusion 和跨版本参数降级全部必须认证失败并零业务写入。
- 对 envelope 解密后的 entry 重跑文件数、单项/总大小、路径、NFC/大小写碰撞、symlink/special-entry 和完整 allowlist 测试。
- AEAD 每个 chunk 边界与 restore 每个持久化步骤强制 kill/restart；对账 intent/pointer/new/old generation 后只能完整完成或回滚，隔离 plaintext/staging/orphan generation 全部清理。
- D-027 两遍读取或隔离 staging 的选定实现分别验证峰值内存/I/O、错误 tag、取消、kill、启动清理和防版本/KDF 参数降级。两遍方案还必须固定同一 staging identity/size/ciphertext digest，在第一遍成功后/第二遍开始前及第二遍每个 chunk 注入替换、截断和 kill，并要求第二遍再次认证。
- 备份不包含 AI key、数据库 Keychain key、调试日志或未选择的图片缓存。

### 3.5 iCloud 排除与产物

- 主 DB/WAL/SHM、媒体、数据包/备份/AI staging、内部恢复点和 App Group 快照在创建、复制、rename 和恢复后逐文件读取 `isExcludedFromBackupKey`，不能只检查父目录。
- 审计 Release `.entitlements`、provisioning profile、Info.plist 和 Expo config，不含 iCloud、CloudKit、ubiquity container 或 remote-push capability。
- 模拟业务文件从设备备份恢复但 ThisDeviceOnly key 缺失，App 必须进入恢复态，不能创建空库覆盖。

## 4. iOS 真机矩阵

最低矩阵：

- 一台当前 iOS 17.x 真实 iPhone。
- 一台最新受支持 iOS 版本真实 iPhone或升级后的同一设备。
- iOS 17 模拟器和最新 iOS 模拟器。
- 锁屏/解锁、设备重启、低存储、相机/通知拒绝和运行期撤销。
- TestFlight 从旧 build 升级到新 build，验证数据库和签名包不丢失。

HealthKit、WidgetKit 和 ActivityKit 在进入对应阶段后添加至少一台真实设备矩阵；模拟器通过不能代替真机通过。

## 5. 可访问性与本地化

首发只验收简体中文，但 UI 仍必须：

- 支持 Dynamic Type 最大常用档位，不截断关键数值和按钮。
- VoiceOver 有顺序、名称、值和错误提示；图表有等价文本摘要。
- 色彩不是状态的唯一表达。
- 日期、数字和单位由显式 locale/timezone 格式化，不拼接不可翻译字符串。
- 长食物名、长错误信息和小屏设备无重叠。

## 6. CI 与本地门禁

具体 CI 服务尚未批准。无论运行在哪里，必须提供等价命令：

1. 格式、lint、TypeScript 和依赖边界检查。
2. Domain/Application/Component 测试。
3. Migration、数据包、备份和 AI contract 测试。
4. Mac 上的 iOS Debug/Release 编译和 XCTest。
5. 签名归档前的 entitlement、隐私清单和产物静态检查。
6. Release 全进程网络捕获、内部文件 backup-exclusion 真机检查和 D-026/D-027/D-034/D-036/D-053 安全 fixture。

Windows 可运行前 1–3 项中的跨平台部分；第 4–5 项必须在 Mac。若未来使用 GitHub Actions/EAS 等第三方云服务，需要新的数据与凭据风险确认。

## 7. 发布阻断条件

出现以下任一情况不得发布：

- 飞行模式下核心本地流程失败。
- 发现非 AI 生产网络请求或未确认 AI 上传。
- migration、备份 generation/pointer、wipe 或签名包 intent/ref 的逐 kill-point crash-consistency 未通过。
- Release 可找到内置 API key、明文数据库密钥或 Authorization 日志。
- Release 内置第三方 crash/analytics SDK 或 DSN，或原生依赖产生未批准网络请求。
- 真实设备权限拒绝导致无关核心功能不可用。
- iOS Release archive、TestFlight 升级或 SQLCipher 旧库升级未通过。
- 数据许可/署名缺失，或条码命中率被写成没有样本证据的承诺。
- D-026、D-027、D-034、D-036 或 D-053 尚未由 Owner 接受并通过对应安全测试；D-030/D-031/D-033/D-035 未决能力不得越界进入实现。
