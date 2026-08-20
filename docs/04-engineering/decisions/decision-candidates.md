# D-018+ 技术决策原始候选档案

> 状态：`HISTORICAL_PROPOSAL_ARCHIVE`；本文件保留 2026-07-31 提交评审时的原始选项与建议，不是当前状态源
>
> 日期：2026-07-31
>
> 当前处置：2026-08-14 后 D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-037/D-038/D-047/D-048 已接受；D-032、D-052、D-053 是仅余权威候选。精确状态与生效语义只以 [决定台账](../../00-governance/decision-register.md) 和 `project-ops/decisions.json` 为准。
>
> 规则：未被权威台账标为 `ACCEPTED` 的 Recommended 仍不能替代 Owner 决定，也不得据此扩大正式实现范围。
>
> 编号治理：D-034、D-035、D-036 是移动架构提交给 PM 的 provisional IDs；PM 与产品/设计候选全局去重后可重新编号，交叉引用应随治理台账一并更新。

## D-018 导航

**Question**：RN 页面、Tab、Modal、深链和未来 Widget 入口采用何种导航抽象？

**Options**

- Expo Router：文件路由、typed routes、与 Expo 开发体验一致，底层使用 React Navigation；目录结构会成为路由契约。
- React Navigation 直接配置：路由图集中且显式，对复杂条件导航更可控；需要自行维护 linking 和类型。

**Trade-offs**：Expo Router 更符合已批准 Expo 工作流，但不是 D-005 的必然结论；直接 React Navigation 更透明，但样板更多。

**Recommended**：先以 5 个真实流程做 Expo Router Spike：今日记录、扫码、AI 预览、设置、备份恢复，并验证 Widget deep link。通过后推荐 Expo Router。

**Decision needed before**：创建正式页面目录和路由契约。

## D-019 UI 状态管理

**Question**：仅页面会话、筛选、草稿和非持久 UI 状态使用什么工具？

**Options**

- Zustand：轻量、样板少，适合单机 App；团队需自行约束 store 边界。
- Redux Toolkit：事件和 DevTools 规范更强；对当前规模可能过重。
- React state/context：依赖最少；跨页面和复杂草稿容易产生隐式耦合。

**Trade-offs**：无论选择什么，SQLite 都是业务真源，禁止把领域记录只持久化到状态库。

**Recommended**：Zustand 只管理 UI/session 状态；用 lint/目录约束禁止 repository 数据镜像为第二真源。

**Decision needed before**：实现跨页面草稿和全局筛选。

## D-020 SQLite 访问层

**Question**：SQLCipher SQLite 的类型、查询和 migration 使用什么抽象？

**Options**

- Drizzle：类型化 schema/query，支持生成 SQL migration；需验证 SQLCipher、Expo 版本和复杂分析查询。
- 直接 `expo-sqlite` + 手写 SQL：能力最透明、依赖少；类型与重复样板更多。
- Kysely：类型化 query builder、接近 SQL；Expo adapter 和 migration 需额外验证。

**Trade-offs**：ORM 不能隐藏 migration SQL、SQLite pragma、FTS、备份和完整性检查。数据包只读库可能需要直接 SQL。

**Recommended**：Drizzle 管理应用写库和 schema 类型，所有 migration 提交为可审查 SQL；数据包/FTS/完整性路径允许受控直接 SQL。先做加密库迁移 Spike。

**Decision needed before**：定义 schema v1 和首个 migration。

## D-021 表单与运行时校验

**Question**：复杂食物表单、导入边界和 AI 响应使用什么校验组合？

**Options**

- React Hook Form + Zod：表单重渲染较少，表单与外部 `unknown` 可共享 schema；增加 schema 适配层。
- Formik + Yup：成熟、资料多；大型动态表单和 TypeScript 推导较弱。
- 自研 reducer + 手写校验：控制最大；维护和一致性成本高。

**Recommended**：React Hook Form + Zod。Domain 仍保留不依赖 Zod 的纯业务不变量，避免 schema 库渗入领域核心。

**Decision needed before**：食物编辑与 AI 候选确认表单实现。

## D-022 图表

**Question**：体重趋势、七日摄入和营养进度图使用什么渲染方案？

**Options**

- Victory Native：交互和组合能力强；依赖 Skia/Reanimated，包体和原生兼容需验证。
- Gifted Charts：上手快、常用图完整；复杂可访问性和大数据性能需验证。
- Swift Charts 原生包装：iOS 视觉与可访问性潜力高；需要自建 RN bridge，复用成本高。

**Trade-offs**：任何图表都必须提供 VoiceOver 可读摘要和列表/文本等价视图，不能只测截图。

**Recommended**：用真实 7/30/365 天数据、最大 Dynamic Type 和 VoiceOver 比较 Victory Native 与 Gifted Charts，再决定；当前不推荐自建 Swift bridge。

**Decision needed before**：统计页面视觉实现。

## D-023 单元与组件测试框架

**Question**：纯 TS、RN 组件和 hooks 使用何种测试框架？

**Options**

- Jest + React Native Testing Library：RN 生态兼容和文档最成熟；配置与执行速度需管理。
- Vitest + 组件测试组合：纯 TS 快；RN 原生 mock 和社区惯例需要额外验证。

**Recommended**：Jest + React Native Testing Library；纯领域测试与 RN mock 隔离，保证将来可独立迁移 runner。

**Decision needed before**：建立首个测试配置。

## D-024 端到端测试

**Question**：关键 iOS 流程使用 Maestro 还是 Detox？

**Options**

- Maestro：场景可读、启动快、适合小团队；复杂同步和原生边界控制可能不足。
- Detox：与 RN 同步更深入、断言精细；配置、构建和维护成本较高。
- 仅 XCUITest：iOS 原生、系统集成强；RN 元素和团队维护成本高。

**Recommended**：首阶段用 Maestro 覆盖核心旅程，同时用 XCTest/XCUITest 覆盖 Keychain、通知和 Extension；若稳定性指标不达标再转 Detox。

**Decision needed before**：建立 G5 自动化流水线。

## D-025 样式与设计 Token

**Question**：设计系统如何表达 token、深浅色、Dynamic Type 和组件变体？

**Options**

- React Native StyleSheet + TypeScript tokens：依赖最少、行为直接；变体样板更多。
- NativeWind：迭代快；类名、编译工具和设计约束需要团队统一。
- Unistyles 等运行时方案：主题和响应式能力强；增加原生/运行时依赖。

**Recommended**：首版使用 StyleSheet + 独立 typed tokens 和小型组件层，设计规模证明需要后再引入工具。

**Decision needed before**：实现基础组件库。

## D-026 数据包签名与密钥轮换

**Question**：Files 数据包的 detached signature 使用何种算法、精确签名字节、包 entry 规则与 key lifecycle？

**Options**

- Ed25519 + RFC 8785 JCS manifest：签名小、验证快，跨工具对同一 JSON value 生成规范字节；发布端和 iOS 端都必须通过 JCS/NFC/数字边界 fixture。
- Ed25519 + 原始 manifest bytes：避免运行时重新规范化；发布流程必须保证字节完全可重复，并把编码、换行和 BOM 规则写死。
- P-256 ECDSA + 已冻结编码：Apple 平台支持成熟；必须额外冻结 DER 或 IEEE P1363 表达及 low-S 规则，跨工具不一致风险更高。

**Must freeze in this decision**：

- 算法、签名编码，以及签名覆盖的 exact bytes；不能只写“规范化 JSON”。
- 包 entry 集合语义：是否固定为 `manifest.json`、`manifest.signature` 与 manifest 列出的全部 payload；未列出/缺失文件必须拒绝。
- provenance 与 transform 的唯一可验证表示：独立 `metadata/provenance.ndjson` / `metadata/transforms.json`、catalog 内受约束表或其他单一方案；必须冻结精确 schema、编码、空值/扩展语义，并由 manifest 对实际字节、size 和 SHA-256 逐项约束。
- 验签前 manifest 解析预算：压缩/解压最大字节、JSON 深度、字段/数组数量、字符串/path/keyId 长度和数字边界；严格拒绝重复 key、未知关键字段、非有限数字和不符合所选 canonical profile 的表示。
- UTF-8/BOM、ASCII 或 Unicode 路径、NFC、大小写碰撞、路径分隔符、`.`/`..`、绝对路径、symlink 与 special entry 规则。
- App trust root、`keyId` 唯一性、not-before/not-after、撤销元数据、旧 key 接受窗口、最低可接受包版本和 App 升级后的回滚策略。
- 新旧 key 轮换与紧急撤销流程；签名私钥的离线/受控保管、最少双人发布审批、审计记录与公开产物复现步骤。

**Recommended**：优先 Ed25519 + RFC 8785 JCS；App 内置按 `keyId` 版本化公钥与撤销表，包 entry 采用严格 allowlist，路径优先限制为 ASCII。私钥只进入隔离发布流程。该组合必须先用同一 golden corpus 在发布工具和 Swift 验证器间做逐字节互操作 Spike。

**Decision needed before**：独立安全审查关闭 G4 签名阻断项，或发布第一个可导入数据包。

## D-027 备份加密 envelope

**Question**：用户口令如何派生密钥、认证加密完整备份，并在流式恢复中隔离最终 tag 前的未认证 plaintext？

**Dimension K：KDF + AEAD（必选一项）**

- K1 Argon2id + AES-256-GCM：抗 GPU 口令猜测更强；需要审计过的额外原生实现。
- K2 PBKDF2-HMAC-SHA256 + AES-256-GCM：Apple/CommonCrypto 实现路径更直接；需按设备校准高迭代参数，抗硬件攻击较弱。

**Dimension S：流式认证与未认证明文隔离（必选一项）**

- S1 认证后第二遍解密：第一遍流式处理并丢弃所有可能输出，只验证最终 tag；成功后第二遍才产生可解析明文。I/O 与密码学成本约为两倍，但不持久化未认证 plaintext。
- S2 单遍解密到隔离 staging：最终 tag 前的 plaintext 只能写入 file-protected、排除备份、业务代码不可寻址的隔离文件；认证失败、取消、kill 和启动对账都删除。更快，但临时明文生命周期更复杂。

Owner 必须用一个完整组合回复，例如 `K1+S1` 或 `K2+S2`；只回复 KDF 或只回复 staging 策略都不能形成 accepted profile。实现库、精确参数与 header/AAD 编码仍须在最低支持 iPhone Spike 后一并冻结。

**Must freeze in this decision**：

- KDF、AEAD、实现库和流式认证策略；不得自研密码学。
- salt、nonce、tag、派生 key 长度和 header 最大字节数。
- 公共 header 的长度前缀、字段顺序、精确编码和规范化规则；完整 header 精确字节必须作为 AEAD AAD，或其规范编码/哈希必须位于已认证 ciphertext。拒绝重复字段、未知关键字段、非有限数字和 algorithm confusion。
- KDF 时间/内存/并行度的写入参数、读取方接受下限与上限；读取方必须在分配大内存或执行 KDF 前拒绝恶意 header。
- envelope 版本升级、允许读取的旧版本、最低安全 profile 和禁止静默降级规则。
- 口令最低长度/弱口令拒绝策略、允许密码管理器粘贴、导出时二次确认和“遗失后不可找回”说明；具体阈值由 Owner 在 UX 与安全间选择。
- 解密后 entry 的路径、文件数、单文件/总大小、NFC/大小写碰撞、symlink/special entry 与完整 allowlist 规则。
- 两遍方案的输入绑定：复制完成后固定不可变 staging identity、size 和 ciphertext digest；第二遍读取同一对象并再次完成认证，任何两遍之间或第二遍 chunk 中的替换都必须失败。隔离 staging 方案则必须冻结不可寻址边界、文件保护、启动清理和每个 kill point。

**Trade-offs**：KDF 再强也无法抵消极弱口令，离线字典攻击仍是剩余风险。算法和参数必须版本化；最低支持 iPhone 上的时间、峰值内存、后台中断与磁盘占用需要实测。两遍方案降低持久明文风险但增加耗时，隔离 staging 方案性能较好但扩大清理与 kill-point 验证面。

**Recommended**：先以 `K1+S1` 安全评审受维护的 Argon2id + AES-256-GCM 原生实现和“认证后第二遍解密”。若库/供应链/性能不通过，再分别比较 K2 与 S2，不能把一个维度的失败静默替换成另一个维度的选择。精确参数通过最低支持 iPhone 基准后提交 Owner；envelope 记录参数，但读取方仍执行已冻结的 min/max 与防降级规则。

**Decision needed before**：独立安全审查关闭 G4 备份阻断项，或实现完整备份导出/恢复。

## D-028 HealthKit 桥接（第二阶段）

**Question**：D-007 进入第二阶段后，HealthKit 使用第三方库还是自有 Swift Expo Module？

**Options**

- 维护活跃、支持当前 RN New Architecture 的第三方库：交付快；依赖维护者和 API 覆盖。
- 小型自有 Expo Module：只暴露批准数据类型，边界清晰；需要 Swift、查询去重和原生测试投入。

**Recommended**：第二阶段先以候选第三方库做真实设备 Spike，检查当前 RN/Expo、权限、anchored query、来源去重和写入 metadata；任何关键项不通过则实现窄接口自有模块。

**Decision needed before**：任何 HealthKit capability、权限文案或 UI 进入产品。

## D-029 CI 执行位置

**Question**：跨平台测试和 iOS archive 在本地 Mac、自托管 runner 还是第三方云执行？

**Options**

- 本地 Mac 脚本：代码和凭据边界最小；自动化与并行能力有限。
- 自托管 Mac runner：可持续集成；仍依赖所连接的平台并承担维护成本。
- GitHub Actions/EAS 等云服务：易用、弹性高；源代码、构建产物和签名凭据进入第三方边界。

**Recommended**：G5 先提供可重复本地 Mac 命令；是否接云 CI 由 Owner 在评估代码/凭据边界和成本后决定。

**Decision needed before**：配置任何外部 CI 或上传签名凭据。

## D-030 备份恢复语义与恢复点

**Question**：完整备份恢复采用替换、按稳定 ID 合并，还是两者都提供；恢复前是否自动建立本地恢复点？

**Design cross-reference**：`docs/03-design/open-decisions.md` 的 UXD-07。

**Options**

- 仅替换：语义清晰、容易证明完全一致；会覆盖当前设备新增数据，必须二次确认。
- 按稳定 ID 合并：保留两侧数据；需要定义每类记录的冲突、删除标记、媒体重复和来源覆盖规则。
- 两种模式：用户选择更灵活；UX、测试和误操作风险最高。
- 自动恢复点：失败和误操作可回滚；需要额外空间、生命周期和二次加密策略。

**Recommended**：首版优先“全量替换 + 有空间时创建短期本地恢复点”；在真实跨设备合并需求出现前不实现通用合并。该推荐尚未批准。

**Decision needed before**：实现恢复最终提交和确认界面。

## D-031 照片与 AI 生成内容保留策略

**Question**：原始餐食/标签照片、压缩发送副本和 AI 原始响应是否持久保存，保存多久？

**Options**

- 只保存用户明确附加到记录的本地照片，发送副本和 AI 原始响应操作后立即删除。
- 保存缩略图或结构化 AI 候选，不保存原始响应。
- 允许用户逐项选择保留原图/结果；隐私说明和存储管理更复杂。

**Recommended**：默认只持久化用户明确选择附加的本地照片；发送临时副本与 AI 原始响应在操作完成、失败或取消后清理，只保存用户确认后的结构化字段。需与 UXD-06/UXD-11 一起由 Owner 确认。

**Decision needed before**：实现拍照识别的媒体落盘和清理策略。

## D-032 Expo/RN/Node/Xcode 版本冻结

**Question**：项目初始化时冻结哪一组 Expo SDK、React Native、React、Node、Xcode、CocoaPods 和 New Architecture 兼容版本？

**Evidence as of 2026-07-31**：Expo official latest 显示 SDK 57.0.0 -> React Native 0.86 / React 19.2.3 / Node 22.13.x，最低 iOS 16.4 / Xcode 26.4；RN New Architecture 自 0.76 默认启用。该证据不等于选择。

**Options**

- 直接使用核验日 latest：较早获得当前修复和新架构支持；高风险原生依赖可能尚未适配。
- 使用 Expo 当前仍受支持的前一稳定 SDK：生态兼容可能更成熟；支持窗口更短，并可能推迟安全/平台修复。
- 等待所有高风险 Spike 再冻结：证据最强；会推迟正式工程初始化。

**Trade-offs**：版本必须作为一个兼容矩阵冻结，不能独立升级 RN 或 React 破坏 Expo 对应关系。Xcode 版本还受开发 Mac 操作系统和 Apple 提交要求约束。

**Recommended**：以 SDK 57/RN 0.86 作为第一个 Spike 候选；只有 SQLCipher、SecureStore、通知、相机、Prebuild hybrid ownership 和 Release archive 全部通过后才锁定。任何失败都回到受支持版本比较，不静默关闭 New Architecture。

**Decision needed before**：初始化 React Native/Expo 工程或生成 lockfile。

## D-033 非标签类 AI 载荷的逐次上传预览

**Question**：除 D-014 已批准的营养标签照片外，餐食照片、纯文本描述和未来趋势摘要是否也必须在每次发送前独立展示输入、数据类型、实际 host 和 model 并确认？

**Design cross-reference**：`docs/03-design/open-decisions.md` 的 UXD-13。

**Options**

- 全部 AI 载荷逐次预览：隐私边界一致、可发现误配 host；增加每次操作步骤。
- 仅图片逐次预览，纯文本用明确发送按钮：降低文本录入摩擦；不同载荷规则不一致。
- 仅执行 D-014，其他类型首次说明后直接发送：步骤最少；误发和 host 误配风险最高。

**Trade-offs**：已批准不变量仍是用户主动发起、BYOK/HTTPS、唯一 AITransport，以及 AI 结果确认前不进入业务库。D-033 只决定“上传前是否每次再展示独立预览”，不能回改 D-014。

**Recommended**：所有非标签载荷逐次预览；纯文本和趋势摘要也在发送前展示实际内容/范围、host、model 与本次发送动作。该建议已在 D-033 内部选择卡中补齐单次绑定、失效和失败关闭语义，仍不是 Owner 已接受答案。

**Decision needed before**：实现餐食照片和纯文本 AI 请求界面。

## D-034 AI 输入、响应与临时资源预算

**Question**：照片预处理、AI 请求/响应、流式传输、JSON 解析、并发和临时磁盘采用哪些精确上限？

**Product/design cross-reference**：F01、F02、F16；`docs/03-design/key-user-journeys.md` 的 J-04/J-07 与 `states-content-accessibility.md` 的 ST-AI-05/ST-AI-10。设计文档只定义用户状态，不代表这些数值已批准。

**Budget dimensions**：

- 用户选择原始文件字节数、读取元数据前上限、解码像素数。
- 发送副本最长边、编码格式/质量、编码后字节数和请求总字节数。
- 响应 header/body 字节数、总时长、idle timeout、chunk 数。
- JSON depth、对象 key 数、数组元素数、单字符串长度、数值是否有限及领域范围。
- 同时进行的 AI 请求数、整个操作的临时磁盘预算和内存峰值。

**Options**：

- 保守 profile：更低图片/响应/时长上限，旧设备压力小；高分辨率标签和慢 Provider 更易失败。
- 平衡 profile：先安全下采样再发送，允许中等响应和时长；需要真机内存、磁盘和取消测试。
- Provider 可配置 profile：兼容性最高；恶意/误配 Provider 可放大 DoS，不能允许用户取消安全硬上限。

**Provisional benchmark candidate, not approved**：原文件 25 MiB、只读像素元数据 60 MP、发送最长边 2048 px/4 MiB、请求总量 6 MiB、响应 header 32 KiB/body 2 MiB、总时长 90 s/idle 15 s、2048 chunks、JSON depth 32/10,000 keys/10,000 array elements/256 KiB 单字符串、1 个前台请求、64 MiB 临时磁盘。所有值都必须在最低支持 iPhone 上用正常、边界和恶意 fixture 校准后再由 Owner 接受。

**Required failure semantics**：任一上限触发即 abort、关闭流、丢弃未验证缓冲区、清理请求/响应临时文件并保持数据库零写入；不能自动提高硬上限重试。

**Recommended**：以 provisional 平衡 profile 做真机 Spike，根据峰值内存、CPU、耗时、照片可读性和 Provider 兼容性形成两档对比，再由 Owner 选择固定 release profile。

**Decision needed before**：独立安全审查关闭 G4 AI DoS 阻断项，或发布任何 AI 功能。

## D-035 是否允许明文 JSON/CSV 导出

**Question**：在 D-006 已批准的加密完整备份之外，是否额外提供不可恢复的明文 JSON/CSV 导出？

**Product/design cross-reference**：F18、F19 与证据缺口 EG-06/EG-07；`docs/03-design/key-user-journeys.md` 的 J-11 当前只承诺加密备份，不能据此推导明文导出。

**Options**：

- 仅加密完整备份：隐私边界最小、入口更少；用户不能直接用表格/脚本分析。
- 允许按字段选择的明文 JSON/CSV：数据可携带性更强；Files 目标可能是 iCloud/第三方，泄露和误分享风险显著增加。
- 延后到真实需求出现：首版保持已批准范围；后续仍需字段字典、转义公式注入测试与隐私文案。

**Required controls if allowed**：逐次选择字段；导出前及打开 Files picker 前明确提示“未加密健康/饮食数据”；CSV 防公式注入；不包含 key、内部路径、日志、未选择图片或未确认 AI 内容；成功/失败/取消后清理 App 内明文暂存。不得把可读导出描述为可恢复备份。

**Recommended**：首版仅提供加密完整备份，明文导出延后到真实分析需求和字段合同明确后再决定。

**Decision needed before**：创建任何 JSON/CSV 导出入口、格式或产品承诺。

## D-036 AITransport URL、重定向与会话隔离 profile

**Question**：在 D-004 只批准 HTTPS 的前提下，如何平衡 Provider 兼容性与 Authorization/载荷、cookie、cache、credential 的隔离？

**Product/design cross-reference**：F01、F02、F16；`docs/03-design/key-user-journeys.md` 的 J-04/J-09、`states-content-accessibility.md` 的 ST-AI-02/ST-AI-05。UXD-13/D-033 决定非标签载荷的逐次预览范围，不决定底层 redirect/session 行为。

**Accepted baseline, not decided here**：每次 AI 请求由用户主动发起，使用用户自己的 baseURL/model/key，只能走 HTTPS；任何实现都不得把 Authorization 或载荷发送给用户未确认的 origin。

**Options**：

- 严格隔离 profile：baseURL 拒绝 query/fragment/userinfo，所有 3xx 终止；独立 ephemeral session，禁用 cookies、持久 credential store 和共享 URL cache。边界最容易证明，部分 Provider 可能不兼容。
- 受控兼容 profile：允许经过展示确认的非秘密 query，并只对预先解析、同 origin 的特定 redirect/path 规则放行；仍禁止跨 origin 自动跳转且使用隔离 session。兼容性更高，规则和测试面显著扩大。
- 通用 RN `fetch`：实现最少；只有在原生 Spike 能证明 redirect、cookie、cache、credential、取消和临时文件性质时才可选择，否则不满足可审计边界。

**Shared requirements**：不得通过 WebView 或 remote Image 组件加载 Provider 内容；请求/响应临时文件在成功、失败、取消、超限、wipe 和下次启动均清理；Debug 与 Release 分别做全进程网络捕获。若 JS/RN 层无法证明所选 profile，需实现窄接口 Swift/Expo Module transport，使用独立 `URLSession` 或等价机制。

**Recommended**：严格隔离 profile；先用至少三个目标 OpenAI-compatible Provider 做兼容 Spike，再让 Owner 根据失败证据决定是否采纳受控兼容例外。完整 URL 规范化、同源 307/308、显式 cache/cookie/credential storage 禁用、RN `fetch` 证明义务与失败恢复语义见 [D-036 内部选择卡规格](../../03-design/d036-ai-transport-profile-card-spec.md)；该卡只完成四域自审，仍不是 Owner 已接受答案。

**Decision needed before**：把具体 3xx/query/fragment/session 行为写入 accepted ADR，或发布任何 AI 功能。
