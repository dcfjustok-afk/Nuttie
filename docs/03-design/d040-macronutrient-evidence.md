# Nuttie D-040 P/C/F 宏量营养证据包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-RESEARCH-002` |
| 状态 | `CANDIDATE / RESEARCH_COMPLETE / CHINA_CURRENT_STANDARD_EVIDENCE_COMPLETE / DECISION_REVIEW_REQUIRED` |
| 快照日期 | 2026-08-06（Asia/Shanghai） |
| 范围 | 健康成人 P/C/F 公开参考范围、减重场景边界、百分比到克数换算和产品保护规则 |
| 证据范围 | NASEM/IOM DRI、NICE、AHA/ACC/TOS、美国联邦食品标签规则 |
| 中国证据状态 | `CURRENT_STANDARD_EVIDENCE_COMPLETE`：2026-08-20 已核验国家卫健委官方页面/PDF和全国标准平台“推荐性、现行”状态；详见中国宏量标准输入包 |
| 非目标 | 选择 Nuttie 默认比例、批准减重处方、确定最低热量或创建正式 schema/实现 |

## 1. 权威边界与当前结论

本工件只为 D-040 的 PX-0 公式审查准备中立候选，不关闭门禁，不进入 `project-ops/decisions.json`，不写入 `project-ops/owner-intake.json`，也不产生 `DECISION_ACCEPTED`、`GATE_CHANGED` 或正式实现授权。

本工件在 2026-08-06 登记时的权威状态为：

```text
D-040: CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED
Owner intake next at record: OI-03
Owner choice recorded: false
Automatic macro rule authorized: false
Formal implementation authorized: false
px1Authorized: false
px2Authorized: false
ownerReviewAuthorized: false
decisionAcceptedRecorded: false
```

后续门禁事实：OI-03 已于 2026-08-11 完成事实采集，OI-02 已于 2026-08-14 记录为 Bundle ID 尚未创建、SKU=`N/A`；当前下一张宿主原生卡是首批整批回读确认。D-040 仍保持 `PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`，下列宏量候选没有因此获得 Owner 或正式实现授权。

### 1.1 外部公开证据结论

可以由公开资料支持的结论只有：

1. 健康成人存在宽泛的 P/C/F 可接受分布范围，但这些范围不是减重处方，也不产生唯一三元组。
2. 减重指南共同强调总能量缺口、营养平衡和个体化；低脂、低碳或其他路径不能被写成所有成人的普遍最优比例。
3. `4/4/9` 是已选比例和能量之间的单位换算合同，不是比例选择规则。

### 1.2 仓库既有治理约束

以下约束来自 [D-040 PX-0 输入研究包](d040-px0-input-research.md)，不是上述营养来源直接给出的医学结论：

- Nuttie 必须允许“不设置目标”或“手工目标”出口；缺失输入时不得静默补默认值。
- 公式输入、可复用资料、目标版本和独立历史必须分层；取消或失败不得产生隐式写入。
- 特殊人群停止推导和慢性病/用药条件复核均保持 fail closed，直到 Owner 选择和独立审查完成。

## 2. 健康成人参考证据

### 2.1 NASEM/IOM AMDR

NASEM DRI 汇总表给出成人总能量中三类宏量的可接受分布范围：

| 宏量 | 成人 AMDR |
| --- | --- |
| 碳水化合物 | `45–65%` 能量 |
| 脂肪 | `20–35%` 能量 |
| 蛋白质 | `10–35%` 能量 |

来源：[NCBI Bookshelf DRI Summary Table S-5](https://www.ncbi.nlm.nih.gov/books/NBK56068/table/summarytables.t5/?report=objectonly)，访问日期 2026-08-06；背景项目页：[Dietary Reference Intakes](https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids)。

AMDR 只描述健康人群中与慢性病风险和营养充足性相关的宽范围。三个区间不能机械取端点组合：下端合计 `75%`，上端合计 `135%`，而任一实际分配必须合计 `100%`。因此 AMDR 不能自行生成 Nuttie 的默认比例。

### 2.2 RDA/EAR/AI 不是减重目标

同一 NASEM 汇总资料显示：

| 项目 | 成人参考值或状态 | 产品边界 |
| --- | --- | --- |
| 碳水化合物 RDA | `130 g/day` | 以健康成人参考语境解释，不得直接写成减重碳水目标或普遍硬性下限 |
| 蛋白质 EAR | `0.66 g/kg/day` | 健康成人群体需要估计，不是减脂期保留瘦体重的最优剂量 |
| 蛋白质 RDA | `0.80 g/kg/day` | 使用参考体重语境；不得未经 Owner 决定改用当前体重、目标体重或理想体重 |
| 总脂肪 RDA/AI | `ND` | 不得从“无 RDA/AI”推导高摄入安全或产品默认值 |

碳水 RDA、蛋白质 RDA 和总脂肪 `ND` 来源：[NCBI Bookshelf DRI Summary Table S-4](https://www.ncbi.nlm.nih.gov/books/NBK56068/table/summarytables.t4/?report=objectonly)，访问日期 2026-08-06。蛋白质 EAR `0.66 g/kg/day` 来源：[NASEM/IOM DRI Summary, Table S-7, pp. 12–13](https://www.nationalacademies.org/read/10490/chapter/2#12)，访问日期 2026-08-06。RDA 的定义是满足约 `97–98%` 健康个体需要的每日摄入水平，不等于减重策略。NASEM 对部分脂肪酸给出 AI，但也不能据此创建统一的减脂保护线；“没有 UL”同样不等于高摄入安全。

## 3. 减重场景证据与边界

NICE NG246《Physical activity and diet》发布于 2025-01-14、更新于 2026-01-08：

- `1.16.1` 要求膳食干预灵活、个体化并保持营养平衡。
- `1.16.3` 要求成人减重时总能量摄入低于能量消耗，可以降低特定宏量成分，也可以采用其他限制总能量的方法。
- `1.16.6–1.16.7` 要求长期营养均衡，反对营养不均衡的限制性饮食。
- `1.16.8–1.16.12` 的 `800–1200 kcal/day` 和 `<800 kcal/day` 仅适用于有长期支持或专科服务、临床监督、营养完整和最长 12 周等条件；不得冻结为普通自律 App 默认目标。

来源：[NICE NG246](https://www.nice.org.uk/guidance/ng246/chapter/Physical-activity-and-diet)，访问日期 2026-08-06。

AHA/ACC/TOS 2013 体重管理指南的证据条款进一步说明：在形成相近能量缺口时，低脂和高脂路径的 6–12 个月减重可相当；极低碳与限能低脂路径也没有足够证据形成统一优选比例。来源：[PMC5819889](https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/)，见 §3.3.1、§3.3.3、§3.3.4、§3.3.5，访问日期 2026-08-06。

结论：Nuttie 可以记录用户选择的饮食方式或显示能量与宏量信息，但不能把任何单一 P/C/F 比例标成“科学默认”“减脂最优”或医疗保护线。未成年人、孕期、哺乳期以及已确诊、正在治疗或主动自述的进食障碍风险属于普通成人自动减重/宏量推导的硬停止组。慢性病或用药相关情形属于条件复核组：在缺少适用规则和本地专业边界时不自动推导，但不得把所有情况一律诊断为疾病或永久禁止纯记录。App 不做诊断或转诊决定。

## 4. `4/4/9` 换算合同

美国联邦食品标签规则 `21 CFR 101.9(c)(1)(i)(B)` 给出一般能量换算因子：蛋白质 `4 kcal/g`、总碳水 `4 kcal/g`、总脂肪 `9 kcal/g`。来源：[eCFR 21 CFR 101.9](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9)，访问日期 2026-08-06。

在 Owner 已选择能量值 `E` 和比例 `P/C/F` 后，定义 `protein_pct`、`carbohydrate_pct`、`fat_pct` 为界面使用的百分比点数，例如 `20` 表示 `20%`。纯换算可写为：

```text
protein_g = E × (protein_pct / 100) / 4
carbohydrate_g = E × (carbohydrate_pct / 100) / 4
fat_g = E × (fat_pct / 100) / 9
```

若三项均设置，则输入合同为 `protein_pct + carbohydrate_pct + fat_pct = 100`。测试向量：`E=2000 kcal`、`P/C/F=20/50/30` 时，结果为蛋白质 `100 g`、碳水 `250 g`、脂肪约 `66.67 g`，未舍入能量回算为 `2000 kcal`。若未来 Owner 选择允许部分设置，该合计约束及输出语义必须另立版本，不能沿用完整三元组合同。

以下仍待 Owner 选择并由公式审查确认：

- 三项百分比必须合计 `100%`，还是允许部分宏量未设置；
- 小数精度、显示舍入和舍入残差归属；
- 是否显示范围而非单点；
- 用户手工改动后是否保留原始计算值与 provenance；
- 实际食品能量与 `P×4 + C×4 + F×9` 不一致时的展示语义。

实际食品能量可能采用特异 Atwater 因子、纤维或糖醇规则，因此日记中的实际能量不一定严格等于 `P×4 + C×4 + F×9`。该差异不得直接判为数据错误。

## 5. 候选规则族（均未获批准）

| 候选 | 行为 | 需要 Owner 决定的关键点 |
| --- | --- | --- |
| M0 无宏量目标 | 只记录实际摄入，目标区显示“未设置” | 是否仍展示 AMDR 参考带 |
| M1 范围提示 | 只显示健康成人 AMDR 参考带，不生成单点目标、达标状态或安全评分；区间外不自动判错、做医疗风险结论或自动纠正 | 适用人群文案、是否显示来源；硬停止组不显示或不推导 |
| M2 Owner 固定比例 | Owner 在明确范围内选择一个 `100%` 三元组；不与克数手工输入混用 | 入口、校验、版本化、覆盖与撤销 |
| M3 专项饮食模式 | 当前不纳入通用宏量选择卡；只有单独研究、风险审查和明确 Owner 选择后另案提供 | 模式范围、适用边界、退出和健康提示 |
| M4 完全手工 | 用户自行输入宏量克数，或在另行批准的部分设置合同下输入部分值；不把比例选择与 M2 合并 | 是否允许部分设置、残差和历史保留 |

研究资料不把 M0–M4 中任何一项写成默认值，也不把原型夹具中的示例数值升级为正式目标。

## 6. 数据与失败关闭约束

以下是 [D-040 PX-0 输入研究包](d040-px0-input-research.md) 已建立、但尚未获 Owner 批准的仓库治理候选，并非营养来源直接推导。建议把计算结果分为 `CalculationDraft`、`GoalVersion` 和独立日记快照：

- 取消、失败、缺失输入或用户拒绝保存时，`profileWrites=0`、`goalWrites=0`。
- 目标版本必须记录算法/规则版本、来源、生成时间、生效时间和用户编辑状态。
- 新资料或新规则不得回算覆盖历史日记；历史快照保持当时的 provenance。
- 公开资料无法支持的输入不得静默补全；应转为手工记录或无目标状态。
- 硬停止组 fail closed，停止普通成人自动 P/C/F 推导。
- 慢性病或用药条件复核组在缺少适用规则时同样不自动推导，但仍可保留完全手工、无目标记录；是否提供未来专项模型必须另行研究和审查。

界面可用性必须按组 fail closed，且 Owner 不能豁免：

- 未满 18 岁：不显示普通成人减重或宏量目标；只允许无目标记录，年龄未知时同样不推导。
- 孕期/哺乳期：不显示普通成人自动目标；如未来提供目标候选，必须来自另案专业审查，当前只保留无目标记录。
- 已确诊、正在治疗或主动自述进食障碍风险：不显示减重/宏量目标入口；保留支持性、无目标记录，不提供用户自设减重数字的豁免路径。
- 慢性病或用药相关：不自动推导；在条件复核完成前可保留完全手工、无目标记录，不把条件复核误写为诊断或永久禁用。

## 7. 中国现行标准证据

原 2026-08-06 研究轮因官网检索失败保留了中国证据缺口。2026-08-20 已通过国家卫健委标准页面、官方 PDF和全国标准信息公共服务平台补齐，并形成 [D-040 中国宏量营养标准输入包](d040-china-macronutrient-standard-input.md)：

- `WS/T 578.1-2017` 当前为卫生推荐性现行标准，2018-04-01 实施；
- 第 5.1 条给出成年人碳水 `50%–65% E`、脂肪 `20%–30% E`、蛋白质 `10%–15% E`；附录 A 给出 P/C/F `4/4/9 kcal/g`；
- 三个范围不能自动生成唯一 `100%` 三元组，不能作为减重处方、个人上下限、达标评分或自动纠正规则；
- 2025 修订征求意见稿只触发版本监视，不是现行标准；每个 Release 和最长 90 天必须复核状态；
- 证据缺口的关闭只让 D-063 的“中国现行标准参考带”候选具备来源，不让 D-063 Owner-ready，也不授权公式或实现。

## 8. 后续原生选择卡草案（不分配 D 编号）

这些问题只作为未来聊天内原生选择卡草案，尚未进入 Owner intake。本工件登记时下一张真实选择卡是 `OI-03 设备条件`；OI-03 与 OI-02 后续均已完成事实采集，当前下一张真实选择卡为首批整批回读确认，以下问题仍不得抢占：

1. 目标来源（互斥，2–3 项）：无目标 / 仅健康成人参考带 / 用户自定义目标。参考带只作信息参考，区间外不自动判错、告警、纠正或生成医疗结论；M3 专项模式不在本卡内。
2. 输入形态（互斥，2–3 项）：固定 `100%` 三元组 / 完整克数 / 部分克数。固定比例属于用户自定义目标的一种输入，不与完整或部分克数混用。
3. 展示与舍入（分开的后续卡）：百分比与克数并列 / 仅克数 / 保留小数或显示舍入残差。
4. 硬停止后的纯记录可用性（仅记录行为，不是豁免目标）：允许无目标记录 / 暂不允许新增记录。硬停止本身不可由 Owner 豁免；未满 18 岁、孕哺期和进食障碍风险不得显示目标入口，慢病/用药在条件复核前不得自动推导；未来专项模型必须另案研究和审查。

## 9. 状态声明

```text
Decision register entry: none
Owner choice recorded: false
OI-03 remains next: true
Automatic macro rule authorized: false
Formal implementation authorized: false
```
