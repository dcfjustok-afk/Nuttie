# Nuttie Phase 0 追踪整改最终复验记录

| 字段 | 值 |
| --- | --- |
| 复验日期 | 2026-07-31（Asia/Shanghai） |
| 范围 | 证据统计、candidate 状态、F13 分层、AT 反向索引、candidate gate 声明 |
| 结论 | **PASS_WITH_OWNER_GATE_BLOCKERS** |
| 门禁影响 | 追踪整改不再阻断；G2/G3/G4 仍因 Owner 候选与实现证据保持 `IN_PROGRESS` |
| 工程动作 | 未初始化 React Native；未修改被审产品、设计、工程或决策文档 |

## 1. 审查来源与可复核性

原独立追踪角色 `competitor_pm_v2` 对五项整改完成只读复验并回传 `PASS`，但其报告写入连续失去响应，因此没有把缺失文件登记为该 Agent 的 `ARTIFACT_CREATED` 或 `HANDOFF_READY`。项目经理随后使用仓库源文件和机器查询逐项复现检查，形成本记录。

本文件只记录可从现有仓库再次验证的结论，不声称原 Agent 已成功交付报告，也不替代 [Phase 0 机器一致性验证](./phase0-validation-report.md) 或 [安全终审](./security-review.md)。

## 2. 五项整改结果

### TR-01：证据统计与缺口主题分离

**结果：PASS。**

- `competitor-evidence-matrix.md` 的行级总数为 66：37 `confirmed`、24 `cross-source`、5 `pending`。
- 5 条 pending 是 `LOG-08`、`LOG-09`、`AI-06`、`DATA-07`、`DATA-08`。
- `EG-01` 至 `EG-09` 是 9 个跨行聚合主题，不是额外证据或额外 pending。
- `source-and-evidence.md`、`public-evidence-gaps.md`、`stage-gates.md` 与工作台口径一致：`37 + 24 + 5 = 66`，9 不与 66 相加。

### TR-02：D-030 与其他候选未冒充 accepted

**结果：PASS。**

- 权威 accepted 范围仍仅为 D-001 至 D-017。
- D-030 的恢复语义与恢复点保持 candidate；`encrypted-backup-and-restore.md` 只有在 Owner 接受后才允许写入 `selectedModeId` 和进入对应步骤。
- `decision-candidates.md`、`owner-decision-packs.md`、`test-strategy.md` 与 `security-review.md` 均把 D-030 及其他 D-018+ 未决项保持为 proposed/candidate。
- 推荐方案、Spike 路线和安全 profile 未被写成已批准实现合同。

### TR-03：F13 证据分层一致

**结果：PASS。**

- `DAY-02` 与 `BODY-05` 由官方截图确认 Burned 和近七日消耗，状态为 `confirmed/L1`。
- `BODY-07` 与 `BODY-08` 的运动记录、步数能力来自跨来源政策证据，状态为 `cross-source/L2`。
- F13、REQ-F13 和 AT-F13 都保留这一差异：Nuttie 首版本地手工运动/消耗，来源可见；不显示 HealthKit 或自动步数占位。
- D-007 的第二阶段 HealthKit 边界没有被扩大。

### TR-04：AT-F01 至 AT-F24 的 G3/G4 反向索引完整

**结果：PASS。**

- F01-F24、REQ-F01-REQ-F24 与 AT-F01-AT-F24 三个集合均为 24 个唯一、连续主键，并一一对应。
- G3 反向索引由 `key-user-journeys.md` 第 16 节和 `states-content-accessibility.md` 第 10 节提供。
- G4 反向索引由 `test-strategy.md` 第 2.1 节提供，映射计划测试层、原生/真机边界和 fixture。
- 索引只证明合同覆盖，不被描述为已有实现或已执行测试。

### TR-05：验收文档声明 candidate gate

**结果：PASS。**

`acceptance-traceability.md` 头部明确声明：D-001 至 D-017 是 accepted 约束；正文引用的 D-018 至 D-053 均为 candidate gate，除非权威台账另行标为 `ACCEPTED`。文档同时在尾部保留 G2/G3/G4 的 Owner 与实现阻断，未借追踪完整性提前关闭 Gate。

## 3. 集合与状态复核

| 项目 | 结果 |
| --- | ---: |
| 行级 Evidence ID | 66 |
| confirmed / cross-source / pending | 37 / 24 / 5 |
| Gap theme | 9 |
| Feature ID | 24 |
| Requirement ID | 24 |
| Acceptance ID | 24 |
| 已接受决定 | 17（D-001 至 D-017） |
| 当前已登记机器候选 | 14（D-018、D-019、D-020、D-021、D-023、D-024、D-025、D-032、D-037、D-038、D-047、D-048、D-052、D-053） |

启动门禁独立审查曾发现“待答草案与权威候选台账双重真源”，见 `docs/00-governance/owner-startup-gate-independent-review.md`。该问题现已通过把第 1 批 12 项按原 ID 登记为 `CANDIDATE` 关闭；登记不表示 Owner 已选择，也没有改变 D-001 至 D-017 之外任何决定的状态。D-032 的 A/B 首次回复仍只可能形成 `CANDIDATE + SPIKE_AUTHORIZED`，必须在 Spike 证据返回后由 Owner 第二次确认，才可冻结最终矩阵。

## 4. 门禁结论

- **G1 保持 PASS**：公开证据口径和 66/37/24/5/9 统计可复核。
- **追踪整改本身 PASS**：本轮五项问题均已关闭。
- **G2 保持 IN_PROGRESS**：完整能力、需求与验收主键已经对齐，但范围/体验候选仍需 Owner 处理。
- **G3 保持 IN_PROGRESS**：旅程、状态与反向索引已形成；导航与其他实质体验方向尚未批准。
- **G4 保持 IN_PROGRESS**：技术、安全与测试合同已形成；版本、库、密码学/AI policy、Mac/真机和实现证据仍未关闭。

追踪 PASS 不等于产品、体验或 Build Ready PASS，也不授权创建工程、lockfile、`ios/`、Apple 资源或 TestFlight build。

## 5. 复验入口

- `docs/01-research/competitor-evidence-matrix.md`
- `docs/01-research/source-and-evidence.md`
- `docs/01-research/public-evidence-gaps.md`
- `docs/01-research/capability-map.md`
- `docs/02-product/scope-baseline.md`
- `docs/02-product/requirements-and-phasing.md`
- `docs/02-product/acceptance-traceability.md`
- `docs/03-design/key-user-journeys.md`
- `docs/03-design/states-content-accessibility.md`
- `docs/04-engineering/testing/test-strategy.md`
- `docs/04-engineering/data/encrypted-backup-and-restore.md`
- `docs/00-governance/stage-gates.md`

## 6. 剩余风险

1. 公开证据仍不能证明会员态或隐藏路径；D-001 只把“公开可验证资料”设为当前验收口径，没有把未知事实改成已知。
2. 原独立 Agent 的报告写入失败已如实记录；本记录由项目经理复现，不把角色独立性交付伪造为完成。
3. Owner 候选、原生 Spike、实现、Mac/Xcode、真实 iPhone 和 Release 证据仍是后续硬门禁。
