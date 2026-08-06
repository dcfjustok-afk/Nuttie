# Nuttie D-040 P/C/F 宏量营养证据包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-RESEARCH-002` |
| 状态 | `CANDIDATE / RESEARCH_ONLY / FORMULA_REVIEW_REQUIRED` |
| 快照日期 | 2026-08-06（Asia/Shanghai） |
| 范围 | 健康成人 P/C/F 公开参考范围、减重场景边界、百分比到克数换算和产品保护规则 |
| 证据范围 | NASEM/IOM DRI、NICE、AHA/ACC/TOS、美国联邦食品标签规则 |
| 中国证据状态 | `RESEARCH_GAP`：本轮未获得可稳定复核的国家卫健委页面级 WS/T 578.1-2017 条款；不得用猜测值补齐 |
| 非目标 | 选择 Nuttie 默认比例、批准减重处方、确定最低热量或创建正式 schema/实现 |

## 1. 权威边界与当前结论

本工件只为 D-040 的 PX-0 公式审查准备中立候选，不关闭门禁，不进入 `project-ops/decisions.json`，不写入 `project-ops/owner-intake.json`，也不产生 `DECISION_ACCEPTED`、`GATE_CHANGED` 或正式实现授权。

当前权威状态必须保持：

```text
D-040: CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED
Owner intake next: OI-03
Owner choice recorded: false
Automatic macro rule authorized: false
Formal implementation authorized: false
```

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
| M1 范围提示 | 只显示健康成人 AMDR 参考带，不生成单点目标、达标状态或安全评分 | 适用人群文案、是否显示来源；硬停止组不显示或不推导 |
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

## 7. 中国证据缺口

本轮尝试通过国家卫生健康委员会官网站内搜索 `WS/T 578.1-2017`。官网表单确认提交目标为 `zs.kaipuyun.cn/s`，但直接结果页返回“请求参数错误，页面无法访问”，未获得可引用的官方 PDF、条款、有效性状态或替代标准页面。因此：

- 本工件不记录中国成人 P/C/F 精确范围；
- 不把《中国居民膳食营养素参考摄入量 2023版》的非稳定公开摘要当作正式标准；
- 后续若取得官方 PDF 或标准公告，必须补充发布日期、有效性、页码/条款、原文摘录和访问 URL，并重新进行独立审查；
- 在该缺口关闭前，Nuttie 不得以“中国标准”名义提供自动宏量比例。

## 8. 后续原生选择卡草案（不分配 D 编号）

这些问题只作为未来聊天内原生选择卡草案，尚未进入 Owner intake，当前下一张真实选择卡仍为 `OI-03 设备条件`：

1. 输出模式（互斥）：无目标 / 只显示健康成人参考带 / 显示 Owner 已选固定比例 / 显示完全手工克数。参考带不生成目标、达标状态或安全评分；M3 专项模式不在本卡内。
2. 手工输入合同：完整克数 / 允许部分克数。比例选择属于 M2，不与 M4 合并；部分设置的合计和残差规则必须另立版本。
3. 显示方式：单点克数 / 百分比与克数并列 / 参考带 + 实际摄入。
4. 舍入策略：总和优先 / 各项独立四舍五入并显示残差 / 保留小数。
5. 硬停止后的纯记录可用性：允许完全手工、无目标记录 / 暂不允许新增记录。硬停止本身不可由 Owner 豁免；未来专项模型不属于本卡，必须另行研究和审查。

## 9. 状态声明

```text
Decision register entry: none
Owner choice recorded: false
OI-03 remains next: true
Automatic macro rule authorized: false
Formal implementation authorized: false
```
