# 产品基线索引

状态：`G2_DRAFT_FOR_REVIEW`  
Owner：项目发起人  
产品负责人：Product Manager Agent  
日期：2026-07-31

## 文档

1. [范围基线](./scope-baseline.md)：Nuttie 的目标、边界、F01-F24 处置和 D-001~D-017 约束。
2. [需求分层与分期](./requirements-and-phasing.md)：完整范围的需求层级、交付波次与阶段门禁。
3. [验收与追踪](./acceptance-traceability.md)：能力、证据、需求、验收和安全测试之间的稳定映射。
4. [Owner 分批决策包](./owner-decision-packs.md)：对 UXD、工程、发布与数据候选去重后的全局队列；未获批准前不执行。
5. [首个 MVP 增量与后续范围边界决策卡](./mvp-increment-scope-card.md)：把 G2 尚缺的首个纵向切片与明确后置范围整理为三项互斥选择；当前仍待 Owner 审查，不构成实现授权。
6. [首个 MVP 增量范围跨角色复核包](./mvp-increment-scope-review-packet.md)：固定产品、设计、架构、安全、QA 五域、三项逐项处置、12 条跨选项不变量与 P0–P3 标准；当前只完成材料准备，复核人与实际复核均未发生。
7. [首个 MVP 增量范围跨角色复核人接入与指派检查包](./mvp-increment-scope-reviewer-intake-packet.md)：固定五域具名候选人接入、身份/逐域胜任/独立性/利益冲突核验、敏感信息最小化与正式回执交接；当前没有候选人、联络授权、指派或复核事实。

研究权威来源：

- `docs/01-research/competitor-evidence-matrix.md`
- `docs/01-research/capability-map.md`
- `docs/01-research/public-evidence-gaps.md`

治理权威来源：

- `docs/00-governance/decision-register.md`
- `project-ops/decisions.json`

## 基线原则

- D-001：“竞品全部功能”只指全部公开可验证功能。
- D-017：F01-F24 的公开对标范围不删减，但允许“实现”“本地重构”“延期决定”或“明确移除”四种去向。
- 竞品事实、Nuttie-required 闭环和 Owner 候选必须分栏，不能互相替代。
- 66 项行级证据的权威统计为 37 `confirmed`、24 `cross-source`、5 `pending`；EG-01~EG-09 是九组缺口主题，不是另外九条 evidence。
- S06 直接证实健康评分、微量营养、风险、益处和营养成分；F09 必须保留并分期。当前四张截图没有条码结果页，F03 的具体结果字段不得冒充截图事实。
- 所有具体选择按 D-010 小批提交 Owner；候选不因写入文档而获得批准。
- 本阶段只产出文档，不初始化工程、不提交 Git。
