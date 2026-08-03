# Nuttie Phase 0 独立安全终审

| 项目 | 结论 |
| --- | --- |
| 审查日期 | 2026-07-31（Asia/Shanghai） |
| 审查角色 | Phase 0 独立安全终审员 |
| 审查基线 | 当前工作区中的产品、设计、工程、数据许可、iOS Release 与 Owner 决策材料 |
| 总体 disposition | **BLOCKED** |
| 阶段影响 | **G4 不可 PASS；G6、G7 继续 BLOCKED/FAIL** |

## 1. 审查边界与独立性

本审查评价当前文档基线是否形成可实现、可测试、fail-closed 的安全合同，不替代代码审计、依赖审计、构建审计、真机测试、渗透测试、隐私/法律意见或 Apple 审核。除新增本报告外，审查员没有修改产品、设计、工程、许可、Release 或 Owner 源文档；没有初始化工程、执行构建、创建 Apple 资源、上传 TestFlight、发布、Git commit 或 push。

覆盖范围：

- 产品与追踪：`docs/02-product/scope-baseline.md`、`requirements-and-phasing.md`、`acceptance-traceability.md`、`owner-decision-packs.md`。
- 设计：`docs/03-design/` 中 AI、删除、备份、错误与取消状态。
- 工程：accepted ADR、local-first 架构、SQLCipher/Keychain 生命周期、AITransport、加密备份、离线数据包和测试策略。
- 合规与发布：`docs/05-quality/data-license-review.md`、`ios-release-readiness-review.md`。
- 治理：决策台账、风险台账和 G0-G8 门禁。

当前没有 React Native/iOS 实现、锁文件、Pods、IPA、真机结果、密码学互操作 fixture、实际签名数据包或可执行测试报告。因此，本报告中的“文档已关闭”只表示设计合同已补齐，不能被解释为实现已通过安全验证。

## 2. 总体结论

当前基线的 local-first 安全方向成立：SQLCipher 密钥与 AI key 分离并放入 ThisDeviceOnly Keychain；AI 是唯一可选业务网络边界；备份采用口令派生的认证加密；数据包要求 detached signature、完整 entry 校验和 crash-consistent 激活；wipe、restore 与 pack activation 都使用 durable intent 和启动对账。

独立复核先后发现 wipe 顺序、备份 header 认证、孤立 Keychain key、D-052 双 ID、数据包 artifact 表示、预认证 manifest 预算、两遍读取 TOCTOU、D-053 用途准入追踪、D-027 选项维度和 D-030 candidate 用语问题。当前源文档已经逐项补齐；本报告在第 4 节保留原始严重度、修订证据和仍缺的实现证据。

**当前没有未解决的安全协议文档发现。** 这不构成 G4 PASS：D-026、D-027、D-034、D-036、D-052、D-053 等仍是 Owner candidate，且不存在实现、构建、跨实现 corpus、真机 kill/restart、Release 抓包或发布证据。按照 `docs/00-governance/stage-gates.md:87`，G4 需要安全与 QA 无阻断项；这些决策和执行证据尚未关闭。G6/G7 同时缺发布与隐私证据，保持现有 FAIL/BLOCKED，不因完成本报告而改变。

## 3. 开放发现（按严重度）

无。第 4 节的 `DOCUMENT_CLOSED` 只关闭文档协议与追踪缺口；每项列出的 Owner 决策、实现、真机和发布证据仍是阶段门禁，不是可省略工作。

## 4. 审查中已关闭的文档发现

以下项目保留原始严重度。`DOCUMENT_CLOSED` 表示当前文档已形成一致合同，不表示实现、真机或发布门禁已通过。

### HIGH-R01：wipe 顺序与 accepted ADR 冲突

**状态：`DOCUMENT_CLOSED`**

首轮状态机曾定义 `WRITES_BLOCKED -> SECRETS_INVALIDATED -> CONNECTIONS_CLOSED`。当前 `docs/04-engineering/security/security-and-threat-model.md:75-88` 已改为 `WRITES_BLOCKED_AND_QUIESCED -> CONNECTIONS_CLOSED -> SECRETS_INVALIDATED`，并要求 writer/task acknowledgement、无可写 handle 后才删除 Keychain；accepted `docs/04-engineering/adr/0004-sqlcipher-and-keychain.md:20` 与 `docs/04-engineering/testing/test-strategy.md:81` 同步了顺序和 kill-point。

仍缺：实际 writer registry、超时/重启语义、开放 handle 证明、gate 后并发写和每一步 kill/restart 的真机结果。

### HIGH-R02：备份 public header 未明确受 AEAD 认证

**状态：`DOCUMENT_CLOSED`**

当前 `docs/04-engineering/data/encrypted-backup-and-restore.md:31`、`:40` 明确完整 header 精确字节作为 AEAD AAD 或将其规范编码/哈希置于认证密文；`docs/04-engineering/decisions/decision-candidates.md:173`、`docs/04-engineering/security/security-and-threat-model.md:201`、`:208` 与 `docs/04-engineering/testing/test-strategy.md:98` 同步冻结编码、重复/未知字段、algorithm confusion 和合法范围内逐字段篡改测试。

仍缺：D-027 accepted profile、可执行格式、跨实现 AAD vectors、错误 tag/参数降级/Unicode 口令 fixtures 和最低支持 iPhone 基准。

### HIGH-R03：D-053 未贯穿 AI 发送前用途准入门禁

**状态：`DOCUMENT_CLOSED`**

权威 `docs/00-governance/decision-register.md:140`、`:144` 已登记 D-053 candidate，并规定未接受时全部 Provider/载荷为 `UNKNOWN/BLOCKED`。`docs/02-product/requirements-and-phasing.md:22`、`:23`、`:37`、`:81` 与 `docs/02-product/acceptance-traceability.md:18`、`:19`、`:33`、`:54` 已贯穿 REQ/AT/NFR。`docs/04-engineering/architecture/local-first-architecture.md:46-47`、`:123-157` 定义本地 `ProviderPolicyStore` 和 key/body 前准入；`docs/04-engineering/security/security-and-threat-model.md:128-139`、`:182-193` 与 `docs/04-engineering/testing/test-strategy.md:35-36` 要求 `ALLOW/DENY/UNKNOWN/EXPIRED` fail closed 和零字节外发。

仍缺：Owner 接受 D-053；逐 Provider 的 terms/privacy 快照、保留/训练/人工访问/删除/广告用途证据；Provider 数据流和 App Privacy 一致性签署；实现、E2E 与 Release 全进程抓包。

### MEDIUM-R01：孤立 Keychain key 缺少确定启动协议

**状态：`DOCUMENT_CLOSED`**

当前 `docs/04-engineering/security/security-and-threat-model.md:97-106` 已给出 generation/key/intent/安装代状态矩阵；accepted `docs/04-engineering/adr/0004-sqlcipher-and-keychain.md:21` 定义孤立 DB/AI key 的 fail-closed 行为；`docs/04-engineering/testing/test-strategy.md:80` 覆盖卸载重装、首次建库持久化点、旧 service/account 和安装代错配。

仍缺：安装代与 Keychain service/account 的具体绑定 ADR、真机状态矩阵、卸载重装和首次建库逐点 kill/restart 报告。

### MEDIUM-R02：`DLR-C01 -> D-052` 形成双 ID 门禁

**状态：`DOCUMENT_CLOSED`**

权威 `docs/00-governance/decision-register.md:139`、`:142` 已登记 `D-052 / CANDIDATE / DLR-C01 alias`，并保持 Owner 未处理时 USDA 境外分发 fail closed。产品、工程和许可主引用已统一，例如 `docs/02-product/acceptance-traceability.md:53`、`:77`，`docs/04-engineering/security/security-and-threat-model.md:5`、`:37`，`docs/04-engineering/data/offline-data-packs.md:5`、`:17`、`:165`，`docs/05-quality/data-license-review.md:179-181`。

仍缺：Owner 对 D-052 的明确回复；选择 A 时的 USDA/NAL 书面澄清。未关闭前，USDA 原始或转换数据不得进入面向美国境外朋友的 TestFlight/IPA。

### MEDIUM-R03：provenance/transforms 的签名字节表示未冻结

**状态：`DOCUMENT_CLOSED`**

当前 `docs/04-engineering/data/offline-data-packs.md:32-34`、`:65-75` 定义必需 `metadata/provenance.ndjson` 与 `metadata/transforms.json`、manifest size/hash 和唯一表示约束；`docs/04-engineering/decisions/decision-candidates.md:143` 将其列为 D-026 必冻项；`docs/04-engineering/testing/test-strategy.md:89-90` 要求逐工件篡改和跨实现 corpus。

仍缺：D-026 accepted profile、最终 schema、实际构包产物、发布工具/Swift verifier 互操作和逐字节篡改结果。

### MEDIUM-R04：验签前 manifest 解析缺少资源预算和重复键规则

**状态：`DOCUMENT_CLOSED`**

当前 `docs/04-engineering/data/offline-data-packs.md:106`、`:156` 已要求严格、受预算约束的 pre-auth 解析器并拒绝重复 key、未知关键字段、非有限数字与 canonical 差异；`docs/04-engineering/decisions/decision-candidates.md:144` 和 `docs/04-engineering/testing/test-strategy.md:87` 同步列出预算与恶意 fixtures。

### MEDIUM-R05：D-027 Owner 选项混合两个正交维度

**状态：`DOCUMENT_CLOSED`**

`docs/04-engineering/decisions/decision-candidates.md:157-167` 已把密码学组合拆为 K1/K2，把流式认证与未认证明文隔离拆为 S1/S2，并要求 Owner 回复完整组合；`:169-182` 冻结 AAD、参数、对象绑定和组合评审。`docs/02-product/owner-decision-packs.md:164` 同步为二维选择，不再允许只选一个维度形成 accepted profile。

仍缺：Owner 的完整 K+S 回复；受维护实现库与供应链审查；精确参数；最低支持 iPhone 的性能、内存、I/O、后台中断和 kill-point Spike。

仍缺：D-026 的具体数值、实际 Swift parser 行为、深层 JSON/JCS 数字边界 corpus 和最低设备 CPU/内存结果。

### LOW-R01：两遍认证/解密未绑定同一份不可变 ciphertext

**状态：`DOCUMENT_CLOSED`**

当前 `docs/04-engineering/data/encrypted-backup-and-restore.md:65`、`:112` 要求固定 staging identity/size/ciphertext digest、第二遍读同一对象并再次认证；`docs/04-engineering/decisions/decision-candidates.md:178`、`docs/04-engineering/security/security-and-threat-model.md:208` 与 `docs/04-engineering/testing/test-strategy.md:101` 同步了替换、截断和每 chunk kill fixtures。

仍缺：所选库的可执行 Spike、文件 identity 的平台定义、替换/截断/append/kill 实测结果。

### LOW-R02：restore intent 的 D-030 用语可能暗示 candidate 已批准

**状态：`DOCUMENT_CLOSED`**

追踪 QA 指出原文“D-030 已批准模式”可能被脱离上下文误读为当前已 accepted。`docs/04-engineering/data/encrypted-backup-and-restore.md:71` 现改为记录 `selectedModeId`，并明确只有 D-030 获 Owner 接受后才允许写入 mode ID 和进入该步骤；`:5`、`:69`、`:113`、`:115` 均保持 D-030 未决边界。

仍缺：Owner 对 D-030 的明确回复；选定替换/合并和恢复点策略后的空间预算、冲突语义、kill-point 与恢复回归结果。

## 5. 分域 disposition

| 安全域 | Disposition | 已成立方向 | 当前阻断或条件 |
| --- | --- | --- | --- |
| AI / 隐私 / 网络 | `BLOCKED` | BYOK、HTTPS、唯一 AITransport、本地 ProviderPolicyStore、key/body 前 fail-closed 准入、未确认 origin 不外发、失败零写入 | D-033/D-034/D-036/D-053 未 accepted；无 Provider policy/data-flow、实现、抓包和真机证据 |
| SQLCipher / Keychain / wipe | `CONDITIONAL` | 随机独立 DB key、ThisDeviceOnly、状态矩阵、quiesce/close/delete 顺序已形成一致文档合同 | 无实现、开放 handle、状态矩阵和真机 kill/restart 证据，不能记为实现 PASS |
| 加密备份 / 恢复 | `BLOCKED` | header AAD、二维 K/S 选择、未认证 plaintext 隔离、两遍对象绑定、generation/pointer crash consistency 已进入合同 | D-027/D-030 未 accepted；无格式、AAD corpus、库、空间和设备基准 |
| 离线数据包 / 供应链 | `CONDITIONAL` | detached signature、完整 entry/path、工件 schema、pre-auth parser、trust root 和 intent/ref 对账合同已补齐 | D-026 未 accepted；无最终数值、实际包、跨实现 verifier 和 fixtures |
| 数据许可 | `CONDITIONAL`（台湾）/`BLOCKED`（USDA 境外分发） | 台湾 OGL 显名、来源隔离与 D-052 alias 已明确；用户自建数据保持本地 | D-052 未获 Owner 处理或官方澄清 |
| 决策治理 | `CONDITIONAL` | D-052/D-053 已正确登记为 candidate；D-027 是完整二维选择；未发现安全关键 candidate 冒充 accepted | 多项 Owner 回复仍缺；不得把推荐 profile 写入实现/发布基线 |
| G4 / G6 / G7 | `BLOCKED` | 当前没有开放的安全协议文档发现，门禁与 fail-closed 原则清楚 | Owner candidate、实现、构建、真机、安全测试、隐私和发布证据仍未关闭 |

## 6. Accepted / candidate 审计

1. `docs/00-governance/decision-register.md:15-31` 把 D-001 至 D-017 列为 `ACCEPTED`。本审查没有要求回退这些决定，但 D-003 的 BYOK 不能解释为 D-053 已批准，D-006 也不能解释为 D-027 的算法/profile 已批准。
2. `docs/02-product/owner-decision-packs.md:3`、`:7` 明确所有选项仍是 candidate。D-026、D-027、D-034、D-036、D-052、D-053 均不得被写成发布基线；D-030、D-031、D-033、D-035、D-043 等相关候选同理。
3. accepted `docs/04-engineering/adr/0005-offline-data-pack-and-manual-backup.md:26` 明确把签名算法和 KDF/envelope 留给 D-026/D-027，没有冒充批准具体密码学方案。
4. accepted `docs/04-engineering/adr/0003-ai-transport-only-network-boundary.md:22` 只冻结 BYOK、HTTPS、主动触发、唯一网络边界和确认前不入库；`:34` 把具体 session/redirect profile保持为 D-036 候选，状态处理正确。
5. D-052 与 D-053 已在 `docs/00-governance/decision-register.md:139-144` 以 `CANDIDATE` 正式登记；D-052 保留旧 ID alias，D-053 未接受时保持 `UNKNOWN/BLOCKED`，均没有冒充 accepted。
6. `docs/04-engineering/decisions/decision-candidates.md:157-182` 与 `docs/02-product/owner-decision-packs.md:164` 只定义 D-027 的 K1/K2 × S1/S2 candidate 矩阵；推荐 `K1+S1` 不是 accepted profile。

## 7. 跨角色交叉审计记录

### 7.1 密码学与状态机 QA

安全终审员委派独立只读复核，QA 返回 2 个高、4 个中、1 个低发现：wipe 顺序冲突、public header 未认证、孤立 key 状态、D-052 双 ID、签名 artifact 表示、预认证 manifest 预算和两遍读取 TOCTOU。安全终审逐项复核后记录在第 4 节；并行文档修订已关闭设计合同，所有实现/真机证据仍保持开放。

### 7.2 产品/追踪 QA 双向交换

安全终审员向 `/root/competitor_pm_v2` 当前 QA/追踪角色发送三项发现供交叉验证：D-053 未贯穿 AI 发送门禁；`DLR-C01 -> D-052` 双 ID；D-027 Owner 选项混合正交维度。对方完成双向回复并确认：

- D-053 追踪缺口已由第二轮修订关闭，证据为 `docs/00-governance/decision-register.md:140`、`:144`，`docs/04-engineering/architecture/local-first-architecture.md:123-157` 和 `docs/04-engineering/testing/test-strategy.md:35-36`；关闭追踪不等于 Provider 获准或 Release 风险关闭。
- D-027 已形成 K1/K2 × S1/S2 完整矩阵，证据为 `docs/04-engineering/decisions/decision-candidates.md:157-182` 与 `docs/02-product/owner-decision-packs.md:164`；密码学、供应链和真机 Spike 仍是实现/发布阻断。
- D-052 已由权威 candidate 登记和 alias 关闭双 ID；`DLR-C01` 只保留为历史 alias，不再生成第二决定。
- 对方另指出 D-030 用语可能暗示 candidate 已批准；安全终审复核并记录为 LOW-R02，当前文档已修订关闭。对方提及的工作台统计、F13 分层与 AT 反向索引属于项目运营/产品追踪范围，由对应 QA 报告处理，不改变本报告的安全 disposition。

本次交换完成了“安全发现 -> 追踪 QA 复核 -> 源文档修订 -> 安全终审复验”的双向闭环；双方均未把文档关闭解释为 Owner 接受或实现通过。

## 8. G4/G6/G7 剩余风险与退出证据

### G4

G4 只能在以下全部完成后重新审查：

- D-026、D-027、D-034、D-036、D-052、D-053 以及实现所需的 D-030/D-031/D-033/D-035 等候选获得 Owner 明确回复并同步权威台账/机器副本。
- AI、wipe、backup、pack 四个协议从文档合同落成可执行实现、状态机、错误语义、资源预算、kill-point 和 golden corpus。
- 安全与 QA 复核实际测试报告；任何失败、未执行或只有计划没有结果的项继续阻断。
- G4 审查材料不再把“推荐”“proposed”“candidate”写成已批准实现合同。

### G6

在 G4 条件之外，还需要受支持 Mac/Xcode 和真实 iPhone；干净 clone 的 Development/Release/Archive；SQLCipher/Keychain/备份/数据包/AI 原生边界真机证据；Release 全进程网络捕获；签名、entitlements、PrivacyInfo、依赖/许可证、TestFlight 元数据和 Beta App Review 前提。当前均不能由文档推断为已完成。

### G7

在 G6 条件之外，还需要最终渠道/地区、隐私政策公开 URL、App Privacy answers、Provider 数据流和用途证明、数据许可最终复核、回退/恢复方案、候选构建回归和明确发布授权。任何 policy、Provider、地区、数据包或密码学 profile 变化都必须重新打开相应安全门禁。

## 9. 最终 disposition

**BLOCKED**。

当前材料可以继续用于 Phase 0 决策和受控 Spike；安全协议与追踪的文档缺口已经关闭，但不能据此宣称 G4 Build Ready、安全实现签署完成、AI/加密备份/Files 签名包可发布，或 G6/G7 已具备条件。下一顺序是 Owner 处理安全关键 candidate，然后用实际实现、跨工具 corpus、真机状态矩阵、kill/restart、Provider 数据流和 Release 抓包把第 4 节的文档合同转化为可执行证据。
