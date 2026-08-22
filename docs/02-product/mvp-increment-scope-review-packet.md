# 首个 MVP 增量范围跨角色复核包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `MVP-INCREMENT-SCOPE-REVIEW-PACKET-001` |
| 状态 | `PACKET_READY / REVIEWERS_UNASSIGNED / REVIEW_NOT_STARTED / NOT_PASSED` |
| 对应范围卡 | `MVP-INCREMENT-SCOPE-CARD-001` |
| 对应门禁 | `G2 产品基线` |
| 复核对象 | A/B/C 三项首增量边界、7 条共享不变量、总范围与后续范围保留 |
| 当前下一步 | `CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED` |
| 非目标 | 替 Owner 选择、冻结范围、关闭 G2/G3/G4、授权正式工程或实现 |

## 1. 用途与真实状态

G2 要求产品、设计、架构、安全和 QA 完成跨角色审查。范围卡已经给出三项互斥选择，但“作者完成卡片”不能替代跨角色复核。本包固定复核输入、责任域、逐选项处置、跨选项不变量和通过标准，供未参与最终结论编写的真实复核人使用。

当前只完成材料准备：

- 五个复核域均未指派具名复核人，身份、胜任范围和利益冲突均未核验；
- PM、范围卡作者、Codex/AI、Agent ID 或只有角色名称不能单独构成 G2 跨角色签署；
- 没有实际 finding、逐选项结论或跨选项检查结果；
- 推荐 A 仍只是推荐，Owner 选择、决定登记、范围冻结与全部实现授权仍为 `false`；
- 本包不发送外部消息，不改变 `owner-intake.json`，也不抢占仍在前置评审中的 D-040 队列占位。

## 2. 必读输入

正式复核必须基于同一 packet revision 的完整输入。任一输入发生语义变化后，受影响结论必须失效并重新复核。

| 顺序 | 工件 | 复核用途 |
| ---: | --- | --- |
| 1 | [项目章程](../00-governance/project-charter.md) | 成功定义、完整地图分段交付、Owner 与门禁权限 |
| 2 | [产品范围基线](scope-baseline.md) | F01–F24 去向、本地替代和明确排除边界 |
| 3 | [需求分层与分期](requirements-and-phasing.md) | REQ-F01–REQ-F24、W1–W4 依赖顺序与完成门禁 |
| 4 | [验收与双向追踪基线](acceptance-traceability.md) | AT-F01–AT-F24、NFR 和 G2/G3/G4 证据归属 |
| 5 | [首个 MVP 增量范围卡](mvp-increment-scope-card.md) | A/B/C、7 条共享不变量、推荐理由与选择后动作 |
| 6 | [关键用户旅程](../03-design/key-user-journeys.md) | 所选范围的入口、主流程、失败与恢复旅程覆盖 |
| 7 | [状态、内容与无障碍基线](../03-design/states-content-accessibility.md) | 空态、错误态、权限态、文案与可访问性约束 |
| 8 | [工程能力边界图](../04-engineering/architecture/feature-boundary-map.md) | Domain/Application/Repository/原生与网络边界 |
| 9 | [F01–F24 合同覆盖审计](../04-engineering/testing/feature-contract-coverage.md) | 已有框架无关证据与仍需正式适配/真机的缺口 |
| 10 | [D-039 PX-5 DoR 评估](../05-quality/d039-px5-dor-assessment.md) | A/C 依赖的 B03–B07 状态与实现就绪边界 |
| 11 | [安全终审](../05-quality/security-review.md) | 数据、密码学、AI、网络与 Release 阻断条件 |

本包就绪不代表这些输入中的候选规则已获接受，也不把计划测试、框架无关 harness、Windows JS export 或历史原型当成正式实现证据。

## 3. 复核域与责任

| reviewDomain | 必查内容 | 不得声称 |
| --- | --- | --- |
| `PRODUCT_SCOPE` | 三项是否完整、互斥、可比较；总范围与后续范围是否保留；收益、代价、依赖和推荐是否中立 | 推荐就是 Owner 答案；缩小首刀等于删除 F01–F24 |
| `DESIGN_EXPERIENCE` | 每项的真实入口/不可用态、主旅程、失败恢复、返回焦点、简中、小屏、Dynamic Type 与 VoiceOver 影响 | 原型或规格等于正式组件、真机或 G3 PASS |
| `ARCHITECTURE_DATA` | 本地优先、无业务服务器、Domain/Application/Repository 边界、SQLCipher/Keychain、来源/缺失、事务与迁移依赖 | 框架无关合同或 JS export 等于正式 adapter、数据库或原生运行 |
| `SECURITY_PRIVACY` | D-052/D-053 失败关闭、AI 零外发、数据最小化、删除/备份、相机/媒体、禁止能力与 Release 证据 | Owner 选择可豁免 Apple 禁项、数据许可、密码学或 Provider 真相 |
| `QA_TRACEABILITY` | F/REQ/AT/NFR 双向覆盖、逐选项 DoR 输入、负向场景、稳定 ID、证据强度和 Gate 归属 | 测试计划等于已执行；局部绿色结果等于 G4/G5/G6 通过 |

复核记录必须包含真实复核人、复核域、胜任依据、是否参与起草、利益冲突、受审 revision、结论、finding 和签署时间。同一人可以覆盖多个域，但必须逐域证明胜任范围；作者或 PM 不能单独批准自己起草的范围包。

## 4. 三项逐项处置

每项必须给出 `APPROVE_SCOPE_OPTION / APPROVE_WITH_REQUIRED_CHANGE / REJECT_SCOPE_OPTION / OUT_OF_SCOPE`。不能只签总评，也不能用“推荐”代替复核。

| optionKey | incrementId | 必查范围 | 复核结论 | findingIds |
| --- | --- | --- | --- | --- |
| `A` | `MVP-I1-LOCAL-MEAL` | D-038 外壳、D039-I1、本地餐食查看/更正/删除、七项营养事实、F20/F23/F24；B03/B06 与正式 adapter 明示 |  |  |
| `B` | `MVP-I1-FULL-MANUAL` | W1/W2 全部手工闭环、公式/目标/提醒/备份等 Owner 规则、数据包和原生依赖完整列出 |  |  |
| `C` | `MVP-I1-LOCAL-MEAL-BARCODE` | A + D039-I2/GTIN/未命中建档；B03/B04/B06/B07、数据包许可/签名、相机和真机证据完整列出 |  |  |

`APPROVE_WITH_REQUIRED_CHANGE` 在改动落盘并完成 delta 复核前仍为阻断；`OUT_OF_SCOPE` 必须指出应由哪个复核域处置，不能被 PM 自行改写为通过。

## 5. 跨选项不变量

正式复核必须逐项记录 `PASS / FAIL / NOT_REVIEWED` 与证据引用：

1. `MVP-SCOPE-XI-001`：F01–F24、REQ-F01–REQ-F24 与 AT-F01–AT-F24 总集合没有因首刀缩小而删除或改号。
2. `MVP-SCOPE-XI-002`：D-001–D-017 及当前已接受决定保持原义，候选决定没有被推荐文字静默升级。
3. `MVP-SCOPE-XI-003`：三项边界互斥且各有稳定 increment ID、包含项、后置项、依赖和验收落点；`Other` 也必须满足同一合同。
4. `MVP-SCOPE-XI-004`：A 的本地餐食闭环不依赖第三方 AI、账号、遥测、CloudKit、远程配置或业务网络。
5. `MVP-SCOPE-XI-005`：A 不隐藏 D039-PX5-B03/B06、正式数据 adapter 和实现自动化缺口，也不把 B01/B02 规格关闭冒充实现完成。
6. `MVP-SCOPE-XI-006`：B 如被选择，W1/W2 的公式、目标、提醒、备份、数据包和原生门禁必须全部进入独立 DoR，不能因名称“手工”而省略。
7. `MVP-SCOPE-XI-007`：C 如被选择，D039-PX5-B04/B07、相机权限/撤权、数据包许可/schema/签名、真机与未命中手工降级均为显式前置。
8. `MVP-SCOPE-XI-008`：D-052 不阻断 Owner 本机、无 USDA 境外再分发的本地路径，但任何境外分发继续失败关闭。
9. `MVP-SCOPE-XI-009`：D-053 未关闭时不读取 key、不组装敏感正文、不创建 transport、不发送；本地手工路径保持可用。
10. `MVP-SCOPE-XI-010`：来源/缺失值、确认前零业务写入、成功恰好一次写入、删除/迁移安全、SQLCipher/Keychain 等不变量不会因分期而降级。
11. `MVP-SCOPE-XI-011`：Owner 选择只允许冻结范围；独立 DoR、G4、正式根工程、原生、实现、签名与发布授权保持单独门禁。
12. `MVP-SCOPE-XI-012`：选择后必须建立所选 increment 到 F/REQ/AT/NFR、D-039 用例、代码/测试证据的双向链接，未选择分支保留在后续范围。

## 6. Finding 与通过标准

| 等级 | 定义 | 门禁影响 |
| --- | --- | --- |
| `P0` | 会造成越权发送、不可逆数据损失、秘密泄露、伪造 Owner 决定或静默删除总范围 | 立即阻断，修复后完整复核 |
| `P1` | 会让 Owner 选择错误范围、绕过许可/隐私/安全/原生门禁或错误关闭 G2/G4 | 阻断，修复后 delta 复核 |
| `P2` | 选项不互斥、依赖/验收/后置范围不完整或角色责任不清，足以造成实现歧义 | 阻断，修复后 delta 复核 |
| `P3` | 不改变范围和安全语义的可读性或维护性问题 | 可保留，但必须有责任人、期限和非阻断理由 |

只有以下条件全部满足时，才能记录 `MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_PASS`：

- 三项逐项结论均为 `APPROVE_SCOPE_OPTION`；
- 五个复核域均有满足胜任和独立性要求的具名签署；
- 12 条跨选项不变量全部为 `PASS` 且有证据引用；
- 未处置 P0/P1/P2 均为 0，保留 P3 均有责任人、期限和理由；
- 评审使用同一 packet revision，任何语义变更均完成受影响 delta 复核；
- Owner 选择、决定登记、范围冻结、G2 PASS、正式工程、原生与实现授权仍保持独立动作，不由复核结论自动产生。

通过本复核只表示范围卡可以排入 Owner 评审，不表示 Owner 已选择任何选项。

## 7. 正式复核记录最小字段

```text
reviewId
packetId = MVP-INCREMENT-SCOPE-REVIEW-PACKET-001
packetVersion
reviewers[] { reviewerName, reviewDomains[], competenceEvidenceRefs[], participatedInDrafting, conflictOfInterest, conflictDisposition, signedAt, signatureMethod }
reviewedArtifactRefs[11]
optionDispositions[3]
crossOptionInvariantResults[12]
findings[] { findingId, severity, reviewDomain, optionKeys[], summary, evidenceRefs[], requiredChange, state }
nonBlockingP3Dispositions[]
overallDisposition
reviewedAt
supersedesReviewId
```

角色名、Agent ID、自述身份或合成 fixture 不能代替真实复核人、胜任与签署核验。

## 8. 当前机器可读边界

```text
reviewPacketReady: true
reviewPacketVersion: PACKET-001-R1
requiredArtifactCount: 11
requiredOptionCount: 3
requiredReviewerDomainCount: 5
requiredCrossOptionInvariantCount: 12
allowedOptionDispositionCount: 4
reviewersAssigned: false
reviewerIdentityVerified: false
reviewerCompetenceVerified: false
reviewerIndependenceVerified: false
conflictOfInterestResolved: false
crossRoleReviewStarted: false
crossRoleReviewPassed: false
currentFindingCountsMeasured: false
externalMessageSent: false
ownerIntakeChanged: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
selectedIncrementId: null
decisionIdAllocated: false
decisionRegistered: false
mvpIncrementScopeFrozen: false
g2Passed: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
next: CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED
```
