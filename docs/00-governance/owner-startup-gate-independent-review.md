# Nuttie Owner 启动门禁独立审查

| 字段 | 结论 |
| --- | --- |
| 审查角色 | Program Director / Delivery Governance Reviewer |
| 审查日期 | 2026-07-31（Asia/Shanghai） |
| 审查对象 | D-001~D-017、Phase 0 第 1 批 12 项候选、OI-01~OI-03、相关 `project-ops` 记录 |
| 总体 disposition | **CONDITIONAL / OWNER_PACKET_NOT_ONE_SHOT_READY** |
| 工程动作 | **未授权**：本审查不初始化工程、不注册 Apple 资源、不上传、不发布 |

## 1. 执行结论

1. **D-001~D-017 的已接受状态可信且一致。** `docs/00-governance/decision-register.md:15-31` 与 `project-ops/decisions.json` 均包含且仅包含这 17 个连续 ID 的 `ACCEPTED` 记录，题目与选择一致；未发现 Agent 将推荐项伪装成这 17 项中的已接受决定。
2. **第 1 批编号没有冲突或遗漏。** `docs/02-product/owner-decision-packs.md:45-145` 的 12 项为 D-047、D-048、D-037、D-032、D-038、D-018、D-020、D-019、D-021、D-025、D-023、D-024；`EVT-20260731-033` 以相同顺序记录这 12 项和 OI-01~OI-03。D-037、D-047、D-048 是后补的全局编号，不是重复编号。
3. **当前决策包可以提交给 Owner 讨论，但不能把一份原始 `A/B/C` 回复直接当成“全部工程初始化条件已关闭”。** D-032 的 Spike 与最终冻结语义存在循环；D-048 没有覆盖其题目声明的全部轴；若 Owner 选择若干非推荐项，当前选项还不足以生成唯一、可执行配置。
4. **收到回复后仍需 PM 做逐项规范化和回读确认。** 只有无歧义的最终选择才能发出 `DECISION_ACCEPTED` 并写入权威台账；“先 Spike”“比较后再定”“暂缓”只能保持 `CANDIDATE/DECISION_REQUIRED`，不能自动升级为 `ACCEPTED`。
5. **工程启动门槛必须分层。** Apple 会员、Account Holder、Team ID 和 SKU 是正式签名/TestFlight 门槛，并不是空 Expo scaffold 的固有技术门槛；导航、状态、表单和 E2E 工具则是对应功能或测试工作的 Definition of Ready，不能全部混写成同一个“首次创建 `package.json`”门槛。

因此，本审查的放行口径是：**可以向 Owner 发出经澄清的第 1 批问题；不可以在未修复下列高优先级问题时承诺“回复一次即自动开工”，也不可以据当前候选直接初始化工程。**

## 2. 核验基线

| 核验项 | 结果 | 证据 |
| --- | --- | --- |
| 已接受决定 | 17，D-001~D-017 连续、唯一、内容一致 | `decision-register.md:15-31`；`project-ops/decisions.json` |
| 权威机器候选 | 2，仅 D-052、D-053 | `decision-register.md:135-144`；`current.json:11-12` |
| Owner 第 1 批候选 | 12，顺序与事件一致 | `owner-decision-packs.md:41-145`；`EVT-20260731-033` |
| Owner 启动输入 | OI-01、OI-02、OI-03 | `owner-decision-packs.md:196-200, 213-216` |
| 项目事件 | 43 条，`EVT-20260731-001`~`043` 唯一且连续 | `project-ops/events/2026-07-31.jsonl`；`current.json:22` |
| 当前门禁 | G0/G1 PASS；G2/G3/G4 IN_PROGRESS；G5~G8 FAIL | `stage-gates.md:15-23`；`current.json:24-33` |
| 当前实现边界 | 未回复前不创建 package/lockfile/Expo/ios，不做 Apple 或发布动作 | `owner-decision-packs.md:233-238` |

本审查没有把 D-052/D-053 纳入“第 1 批 12 项”，也没有把 OI-01~OI-03误记成架构决定。它们分别是后续候选与事实输入。

## 3. 发现与处置要求

### P0-01：D-032、原生 Spike 与“禁止初始化”形成执行循环

**事实**：

- D-032 的推荐是先用 Expo SDK 57 / RN 0.86 等做 Spike，SQLCipher、Keychain、通知、相机、Prebuild、Release Archive 通过后才冻结（`owner-decision-packs.md:77-83`；`decision-candidates.md:244-260`）。
- 工程 README 又要求在初始化或修改 React Native 工程前，SQLCipher、Keychain、签名包和加密备份已经完成最小 Spike（`docs/04-engineering/README.md:61-70`）。
- 技术栈总览要求 D-032 已接受后才初始化（`technology-stack-research.md:143-149`）。

**影响**：这些原生 Spike 至少需要一个 Expo/Prebuild/Xcode 工程。如果任何 `package.json`、lockfile、Expo 工程和 `ios/` 都不得创建，D-032 就无法取得其自身要求的退出证据；如果先创建正式工程，又违反当前文字门禁。

**必须处置**：在 Owner 问题中明确区分两步：

1. Owner 先选择并授权一个**可丢弃或隔离的 Spike 候选矩阵**；该回复不把 D-032 记为最终 `ACCEPTED`。
2. 团队在明确文件边界内执行 Spike，提交精确 Expo/RN/React/Node/Xcode/CocoaPods/New Architecture 与高风险依赖结果。
3. Owner 再接受最终 D-032 矩阵；正式工程、正式 lockfile 和 Release 基线随后建立。

如果团队希望 Owner 只回复一次，则当前证据不足，不能同时满足“先验证后冻结”和“冻结前不建任何工程”。必须由 PM 让 Owner 明确选择“允许受控 Spike 工程”这一流程边界，不能由 Agent自行解释。

### P1-01：12 项候选没有进入权威候选台账，机器状态存在双重真源

`decision-register.md:135-144` 与 `project-ops/decisions.json` 只登记 D-052、D-053 两个 `CANDIDATE`；快照也显示 `candidateDecisions: 2`（`current.json:11-12`）。但 Owner 决策包声明本文件选项全为 `CANDIDATE`，并提交了另外 12 个稳定 ID（`owner-decision-packs.md:7, 41-145`）。

这不影响本次人工识别 ID，却会导致：

- 工作台与自动校验无法证明 12 项候选的允许选项和当前状态；
- 收到 Owner 回复时，系统没有可机器校验的候选记录可转换；
- “候选总数 2”与“正在等待 12 项候选”同时成立，读者必须知道两个数据源的隐含区别。

**必须处置**：在记录任何接受结果前，要么把 12 项按原 ID 预登记为 `CANDIDATE` 并同步机器副本，要么正式声明“Owner 决策包是 intake staging，只有规范化后的选择才进入权威台账”，并让快照分别显示 `registeredCandidates` 与 `draftOwnerQuestions`。不得把草案总数误报为权威候选总数，也不得因收到回复而跳过候选到接受的审计链。

### P1-02：D-032、D-018、D-020 的 A 选项混合“试验授权”和“最终接受”

- D-032 A 是“首个 Spike 候选”，不是精确冻结矩阵。
- D-018 A 是“经真实流程 Spike 后采用”（`owner-decision-packs.md:93-98`）。
- D-020 A 的前提是 SQLCipher migration Spike 通过（`owner-decision-packs.md:100-106`）。

但决策 schema 只有 `ACCEPTED/SUPERSEDED/CANDIDATE/REJECTED`，没有“条件接受”状态（`project-ops/schemas/decision-register.schema.json:17-26`）。Owner 只写三个 `A` 时，无法判断其含义是“同意试验”“试验通过后无需再问即采用”还是“现在就接受”。

**必须处置**：每项都要在问题中明确二选一语义：

- `A（仅授权 Spike，决定保持 CANDIDATE，结果回来后再确认）`；或
- `A（接受为初始实现，若 Spike 失败必须提交 superseding decision，不得自动切换）`。

当前材料更符合第一种，PM 不得自行把它解释成第二种。尤其不能把“失败才回到 B”执行为 Agent 自动改选。

### P1-03：D-048 不是完整、互斥、可一次回答的设备配置

D-048 的题目包含设备族、方向与商店可用性（`owner-decision-packs.md:57-65`），但：

- C 只写 `Universal iPhone + iPad`，没有说明 iPhone/iPad 分别支持哪些方向；
- 任何选项都没有说明 Designed for iPhone/iPad on Apple silicon Mac 的可用性；
- 任何选项都没有说明 Apple Vision Pro 兼容可用性；
- “商店可用性”不是首次 Prebuild 的同一技术轴，Release 审查也把 Mac/Vision availability 单独列为商店配置。

**必须处置**：D-048 至少拆成四个明确轴并允许 Owner逐轴选择：设备族、iPhone 方向、iPad 方向（若适用）、Mac/Vision compatibility availability。若后两项要延后，则题目应只承诺 Prebuild 设备族和方向，并把商店可用性移到后续发布决定；不能留给工具默认值。

### P1-04：若 Owner 不选推荐项，部分 B/C 选项仍不能生成唯一配置

| 项目 | 不完整处 | 一次回答所需补充 |
| --- | --- | --- |
| D-032 B | 只说比较“前一稳定 SDK”，没有列出具体版本矩阵 | 明确这是调查路线而非最终版本；结果后再决 |
| D-037 C | 只写 Yarn，未冻结 Yarn major 与 `nodeLinker` | 给出具体 profile，或保持候选并先 Spike |
| D-023 B | “Vitest + RN 组件测试组合”没有指出具体组件测试运行方式 | 给出完整 runner/environment/mock 组合 |
| D-025 C | “Unistyles 等”不是唯一库或配置 | 指定唯一候选及主题/Token 边界 |

这不是要求 Owner 亲自决定每个 patch，而是要求团队给出的每个字母选项都代表一个可比较、可追溯的方案。不能只把推荐 A 写具体，把 B/C 写成类别，然后声称 Owner 有等价选择。

### P2-01：OI-01~OI-03 可以收集，但模板需要条件值和字段级门槛

**OI-01**：若 D-047 选 C 或尚未入会，应允许明确回复 `membership=未加入/申请中`、`Account Holder=N/A`、`Team ID=N/A`；不能把空白当作遗漏，也不能伪造值。若选 B，还应说明是否已有真实组织与 D-U-N-S，后者只在组织入会路径需要。

**OI-02**：Bundle ID 与 SKU 的最迟时点不同。Bundle ID 在首次正式 Prebuild/签名之前应稳定；SKU 只在创建 App Store Connect app record 前需要。Owner 应分别填写或写 `SKU=尚未创建`。建议提供格式约束和示例，但最终命名空间必须由 Owner 控制。

**OI-03**：为了减少追问，至少应记录 Mac 型号、Apple silicon/Intel、macOS 精确版本、可用磁盘、Xcode 精确版本，以及 iPhone 型号、iOS 精确版本、是否能连接该 Mac。若当前没有 Mac 或真机，明确写 `无/暂不可用` 即可，D-032 原生 Spike 保持阻断。

不得在普通文档或事件流记录 Apple 密码、2FA、恢复信息、证书私钥或设备 UDID。

### P2-02：“第 1 批工程初始化阻断项”把三个门槛层次混在一起

当前保守边界可以作为 PM 流程政策，但不应被描述成所有项目都是空工程的固有技术前置。准确分层如下。

## 4. 硬门槛与依赖顺序

| 项目 | 最迟关闭时点 | 是否阻断空 scaffold / package | 说明 |
| --- | --- | --- | --- |
| D-032 Spike 路线 | 创建受控 Spike 工程前 | 是，按当前治理 | 先授权试验；最终矩阵需试验后再接受 |
| D-037 包管理器 | 创建正式 lockfile 前 | 是 | 同时冻结具体 major/精确工具版本、唯一 lockfile 与 frozen install 命令；版本需与 Node 矩阵兼容 |
| OI-03 Mac/Xcode/iPhone | 执行 iOS 原生 Spike、声明 G4 原生证据前 | 否 | Windows 可创建纯 JS scaffold，但不能提供 iOS 证据 |
| OI-02 Bundle ID | 首次正式 Prebuild/真机签名前 | 否（对纯 JS）/ 是（对正式 Prebuild） | SKU 不属于同一时点 |
| D-048 设备族与方向 | 首次正式 Prebuild 前 | 否（对纯 JS）/ 是（对正式 Prebuild） | 商店兼容可用性应单独明确 |
| D-038 产品导航外壳 | 建立正式 IA/路由壳前 | 否 | 必须先于 D-018 的正式路由目录实施 |
| D-018 导航实现 | 建立正式页面目录、deep link 契约前 | 否 | 依赖 D-038；条件式 A 需澄清 |
| D-020 SQLite 访问层 | D-020 对比 Spike 或 schema v1、migration、repository 实现前 | 否 | D-015 已决定 SQLCipher；如本次 Prebuild 用于比较 D-020，则需先指定试验 profile |
| D-019 UI 状态 | 跨页草稿/session store 实现前 | 否 | 逻辑上晚于 D-020 真源边界；不得镜像领域库 |
| D-021 表单/运行时校验 | 食品编辑、导入和 AI `unknown` 实现前 | 否 | Domain 不应依赖表单 schema |
| D-025 样式/Token | 基础组件库与正式 UI 实现前 | 否 | 不是版本 scaffold 的前置 |
| D-023 单元/组件测试 | 创建正式测试基线、首个实现增量前 | 否 | 是增量 DoR，不是 Expo init 固有门槛 |
| D-024 E2E/原生测试 | G5 自动化与核心旅程实现前 | 否 | 工具可后置，但组件开发前要约定 `testID`/accessibility identifier 与诊断契约 |
| D-047 + OI-01 | 正式 App ID、分发签名、TestFlight 前 | 否 | 免费 Personal Team 可做有限本地真机开发；不能做 TestFlight |
| OI-02 SKU | App Store Connect app record 创建前 | 否 | 不阻断 Prebuild |

推荐执行依赖图：

```text
Owner 授权受控 Spike 路线
  -> D-032 trial + D-037
  -> OI-03 环境核验
  -> 隔离 Spike（SQLCipher/Keychain/Prebuild/Archive 等）
  -> Owner 接受最终 D-032
  -> OI-02 Bundle ID + D-048
  -> 首次正式 Prebuild

D-038 产品外壳
  -> D-018 导航实现
  -> 正式路由壳

D-020 数据访问真源边界
  -> D-019 UI/session 状态边界

D-023 单元/组件基线
  -> D-024 E2E/原生自动化基线

D-047 + OI-01 + OI-02 SKU
  -> App ID / App Store Connect / 签名链
  -> TestFlight（仍需具体上传授权）
```

## 5. Owner 一次回复的判定规则

在不替 Owner 做选择的前提下，PM 只能在以下全部满足时把一次回复视为“本批输入完整”：

1. 12 个 D 项每项都有单一选项，或明确写“暂缓”；空白不等于推荐项。
2. 条件式选项明确是“仅授权 Spike”还是“接受初始实现并以新决定处理失败”。
3. D-048 的每个适用轴都有值；不适用项写 N/A。
4. OI-01~OI-03 每个字段都有事实值、`N/A`、`无`、`申请中`或`UNKNOWN`，不能用占位账号。
5. PM 将解析结果逐项回读给 Owner；Owner 确认前不发 `DECISION_ACCEPTED`。
6. 最终被接受的选择进入 `decision-register.md` 和 `project-ops/decisions.json`，并产生引用 Owner 回复的 `DECISION_ACCEPTED` 事件。
7. `暂缓`、调查路线或证据不足的项保持 `CANDIDATE/DECISION_REQUIRED`；相关工作继续阻断。
8. “本批选择完成”不等于授权 Git commit、Apple 注册、付费、上传、发布或线上变更；这些动作仍按章程逐次授权。

按当前原文，**Owner 选择所有推荐 A 仍不足以一次性接受 D-032/D-018/D-020 的最终技术结论**；选择 D-048 C、D-037 C、D-023 B 或 D-025 C 时还会产生额外配置追问。因此，当前答案是：**一次回复足以表达 Owner 的方向和事实输入，但不足以无歧义地关闭全部工程启动门槛。**

## 6. 跨角色互审

本审查向 RN 技术栈审查角色 `/root/rn_stack_reviewer` 发出定向互审请求，要求其独立判断 package/lockfile、Prebuild、功能实现、原生 Spike 与 TestFlight 的门槛，并复核 D-032 循环、D-048 完整性和条件式选项。对方已在其完整报告完成前先回传技术摘要；本节只记录实际收到的意见，不把角色沉默或推荐当作批准。

### 6.1 共识

- D-032 必须分成“Owner 授权隔离 Spike 候选”与“Spike/Archive 通过后接受精确冻结矩阵”两个治理步骤；否则形成循环。若选择 SDK 57，最终矩阵应把该 Expo 版本实际要求的 New Architecture 状态固定记录，不能把静默关闭当作失败回退。
- D-048 C 不可执行；设备族、各设备方向、Mac 与 Vision Pro availability 必须分别明确。A/B 也应落成具体 `supportsTablet` 和方向集合，而不只保留自然语言。
- D-018 A、D-020 A 是条件式 Spike 路线，不能由一次 `A` 回复直接宣称实现已验证；失败阈值和回退再确认机制必须先写清。
- D-037 C、D-023 B、D-025 C 当前不够具体；此外 D-037 A 同样应冻结 pnpm 精确版本、唯一 lockfile 和 frozen install 命令。
- D-047/OI-01 不阻断 `package.json`、无签名模拟器或隔离本地 Spike；它们在稳定真机签名和 TestFlight 路径上成为硬门槛。
- D-024 的具体 E2E 工具可以到 G5 管线前关闭，但 `testID`、accessibility identifier 和失败诊断契约应在组件开发前建立，避免后补破坏可测试性。

### 6.2 技术细化与最终分歧

RN Reviewer 建议执行顺序为 `OI-03 -> D-037 精确工具 -> D-032 Spike 基线 -> D-048/OI-02 -> 隔离原生 Spike -> D-032 最终冻结`。本治理审查把 OI-03、D-037 与 D-032 Spike 路线视为同一个 pre-Spike intake 批次：三者都必须在执行前明确，内部先后不构成 Owner 决策冲突。这是流程颗粒度差异，不是实质分歧。

RN Reviewer 建议用 D-032a/D-032b 表达两阶段状态。本审查赞同“两阶段”，但**不直接分配新决定编号或新增 schema 状态**：当前 schema 没有 `PROVISIONAL_FOR_SPIKE`，编号与状态模型必须由 PM 治理后再提交 Owner，不能由审查角色写成既定事实。

RN Reviewer 认为“启用 SQLCipher 的首次 Prebuild”需要 D-020 的 Spike 实现方案。本审查区分两个目的：D-015 已经决定 SQLCipher，因此单纯验证 `useSQLCipher` 原生配置不依赖最终 ORM/访问层；如果该 Prebuild 同时用于比较 Drizzle/手写 SQL/Kysely、migration 或 schema，则必须先指定 D-020 试验 profile。最终 D-020 仍在 schema v1 与 repository 实现前关闭。该差异已在门槛表中显式保留，避免把 D-015 与 D-020 混成同一决定。

RN Reviewer 随后明确确认上述两点治理细化，无事实纠正。除状态建模与 SQLCipher Prebuild 颗粒度的表达差异外，两份独立判断没有实质分歧。

## 7. 最终放行条件

第 1 批可以在以下最小整改完成后作为正式 Owner 问题发出：

1. 解除 D-032/Spike/初始化循环，明确受控 Spike 工程的授权与文件边界。
2. 明确 D-032、D-018、D-020 的“试验授权 vs 最终接受”语义。
3. 补全 D-048 的独立配置轴。
4. 让每个 B/C 选项要么成为唯一可执行方案，要么明确保持候选并在证据形成后再决。
5. 给 OI-01~OI-03 增加 N/A/UNKNOWN 规则，并拆清 Bundle ID 与 SKU 的不同截止点。
6. 在权威台账/机器副本中解决“2 个登记候选 vs 12 个待答草案”的状态表达。

在这些条件关闭前，保持现有边界：不创建正式 `package.json`、lockfile、Expo 工程或 `ios/`，不注册 Apple 资源，不执行 TestFlight 或其他外部状态变更。
