# Phase 0 最终机器一致性验证报告

状态：`PASS_WITH_GATE_BLOCKERS`  
日期：2026-07-31  
角色：独立机器一致性审计  
范围：只读验证治理、研究、产品、设计、工程、质量、`project-ops` 与本地工作台；本报告是唯一新增产物

## 1. 结论

本轮要求的机器一致性检查全部通过，未发现仍开放的 schema、ID、回复链、链接、追踪集合、决策状态、关键安全断言或工作台 smoke 问题。

该结论只证明 Phase 0 文档和运行数据在当前快照下相互一致，不代表 G2、G3 或 G4 已通过。G2/G3 仍有 Owner 产品与体验候选未处理；G4 仍受安全关键候选、工程实现、依赖锁定、Mac/Xcode、真实 iPhone、跨工具 corpus 和 Release 网络证据阻断。G5-G8 也不因本报告改变状态。

## 2. 验证结果

| 检查项 | 结果 | 可复核结果 |
| --- | --- | --- |
| Draft 2020-12 schema | PASS | AJV 8.17.1 + ajv-formats 3.0.1；1 个 decision register、39 条 event、62 条 message 全部有效，含日期/时间格式校验 |
| ID 与回复链 | PASS | 事件 ID 唯一且 `EVT-20260731-001` 至 `039` 连续；62 个 messageId 唯一；所有非空 `responseTo` 均可解析 |
| Markdown 本地链接 | PASS | 43 个既有 Markdown 文件中检查 64 个本地链接，0 个断链 |
| 显式 path:line 引用 | PASS | 47 个显式引用均在文件有效行范围内；8 个容易因新增反向索引漂移的安全审查引用另做语义复核并通过 |
| 竞品证据统计 | PASS | 66 个唯一行级证据：37 `confirmed` + 24 `cross-source` + 5 `pending`；EG-01 至 EG-09 为 9 组跨行 gap themes |
| F/REQ/AT 双向集合 | PASS | F01-F24、REQ-F01-F24、AT-F01-F24 各 24 个且一一映射；G3 journeys/states 与 G4 test strategy 均可反查全部 AT |
| 决策 Markdown/JSON | PASS | D-001 至 D-017 均为 `ACCEPTED`；D-052、D-053 均为 `CANDIDATE`；19 个机器决策 ID 唯一 |
| 关键治理断言 | PASS | D-014 只覆盖营养标签照片；D-027 为 KDF/AEAD 与流式隔离两个必选维度；D-052、D-053 在未批准或证据不足时 fail closed |
| 快照一致性 | PASS | 39 条事件、62 条消息、17 条 accepted、2 条 candidate、66/37/24/5/9 指标与源数据一致；动态 Agent roster 为 10 个角色 |
| 工作台 smoke | PASS | `http://127.0.0.1:4173/` 的 health、project-state、HTML、SSE、路径穿越拒绝、66 条证据、Owner 第 1 批 12 项决定和动态 Agent roster 全部通过 |

## 3. 独立复验重点

首次扫描发现 [阶段门禁](../00-governance/stage-gates.md) 仍使用旧的 `26/31/9` 统计，并发现 [安全终审](./security-review.md) 中 7 组测试策略引用在新增 AT 反向索引后语义漂移。主线修订后，本审计重新执行全套检查：门禁现已统一为 `66 = 37 + 24 + 5` 并单列 9 组 themes；漂移引用现指向 wipe、孤立 key、数据包工件、预认证预算、备份 header 和两遍读取的实际测试合同。

F13 也完成语义复验：[能力地图](../01-research/capability-map.md) 的状态列明确定义为聚合“最高置信度”，并把 DAY-02/BODY-05 的 `confirmed` 消耗事实与 BODY-07/BODY-08 的 `cross-source` 运动/步数构成分开；产品分层保持 `confirmed + cross-source`，没有用较弱证据降级直接证据。

## 4. 方法与边界

- Schema 使用声明 Draft 2020-12 的三个项目 schema 编译校验；严格模式和标准 format 校验均启用。
- JSONL 逐行解析后校验，并独立检查全局 ID 集合、事件序号和跨文件回复链。
- Markdown 检查覆盖 `docs/**/*.md`、根 README 与 `project-ops/README.md`；本地链接按来源文件相对解析。
- Smoke 使用工作台现有 [测试脚本](../../../../study/Nuttie-Discovery-Workbench/qa/smoke-test.mjs) 对已运行服务执行；本审计未启动或停止服务，也未做浏览器视觉验收。
- Windows 环境没有产生 iOS Archive、签名、Keychain、相机、通知、迁移、性能或真机证据；这些仍必须在受支持的 Mac/Xcode 与真实 iPhone 上完成。

## 5. 当前门禁解释

最终 disposition 为 `PASS_WITH_GATE_BLOCKERS`：机器一致性工作包可交接，但产品、体验、Build Ready、Beta 和 Release 门禁没有因此获得 PASS。Owner 仍需先处理已提交的第 1 批决定与 OI-01 至 OI-03；安全、数据许可和 AI Provider 候选继续按现有 fail-closed 边界执行。
