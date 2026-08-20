# Nuttie D-040 PX-0 输入研究包

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D040-RESEARCH-001` |
| 状态 | `CANDIDATE_RESEARCH_COMPLETE / PX-0_INPUT_GAP / OWNER_SELECTION_NOT_SCHEDULED` |
| 快照日期 | 2026-08-06（Asia/Shanghai） |
| 范围 | 首启资料、一般成人能量估算、目标版本、资料删除和特殊人群停止推导 |
| 证据范围 | 公开可验证的 NASEM / NIH / NIDDK / NICE / NIMH / PubMed 资料与现有 Nuttie 合同 |
| 非目标 | 医疗诊断、个体营养处方、正式字段/schema、已批准公式、React Native 实现或 Owner 代答 |

## 1. 权威边界与当前结论

本研究包只为 D-040 的 PX-0 输入审查准备中立候选，不关闭门禁，不进入 `project-ops/decisions.json`，不写入 `project-ops/owner-intake.json`，也不产生 `DECISION_ACCEPTED`、`GATE_CHANGED` 或实现授权。

本研究包在 2026-08-06 登记时的权威状态为：

```text
D-040: CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED
Owner intake next at record: OI-03
Owner choice recorded: false
Formal implementation authorized: false
```

后续门禁事实：OI-03 已于 2026-08-11 记录为 `iPhone 16 Pro Max / iOS 26.5 / 无可用 Mac`，OI-02 已于 2026-08-14 记录为 Bundle ID 尚未创建、SKU=`N/A`；当前下一张宿主原生卡是首批整批回读确认。该顺序变化不改变 D-040 的上述状态或任何授权位。

研究结论分为七点：

1. `Mifflin-St Jeor` 估算的是静息能量消耗 `REE`，不是每日维持能量、减重目标或 P/C/F 目标；活动乘数和热量缺口不属于原论文。
2. NASEM 2023 成人 `EER` 是按年龄、公式分支、身高、体重和四类 PAL 选择独立方程，不是 `REE x 通用活动系数`；它用于体重稳定时的维持能量估算，不是增重或减重公式。
3. NIDDK Body Weight Planner 是另一套动态体重模型。它需要目标体重、达成时间和活动变化等额外输入，不能被简化为固定热量差，也不能与 Mifflin 或 NASEM 拼接后仍沿用原模型名称。
4. 公式需要某个输入，不等于 App 必须永久保存该输入。瞬时计算、可复用资料、目标版本和日记/体重历史必须分层决定。
5. 当前候选方程要求“年龄，以年为单位”，但来源没有规定必须取整、允许的小数精度或生日边界。精确出生日期不是得到年龄年值的唯一方式；输入粒度、计算/舍入和生日重算必须另行决定。
6. 当前证据不能证明餐次节奏、饮食偏好或作息是能量公式必填，也不能证明任何 P/C/F 生成规则。
7. 未成年人、孕期、哺乳期及进食障碍高风险状态不应进入普通成人自动减重推导；慢性病或用药支持分层复核，不支持 App 自行诊断，也不支持把所有情况一律判定为疾病。

## 2. 证据等级与使用规则

| 等级 | 定义 | 本研究中的用途 | 不能证明 |
| --- | --- | --- | --- |
| `A1` | 原始同行评审论文、国家科学院报告或报告精确表 | 方程、样本、适用年龄、模型误差和明确限制 | Nuttie 应选择该模型，或模型外的产品默认值 |
| `A2` | 官方政府工具或官方健康指导页面 | 工具公开输入、输出、排除人群和用户可见保护行为 | 未公开的内部算法、通用临床阈值或中国本地临床路径 |
| `A3` | 专业指南或国家健康机构风险说明 | 停止推导、非诊断、专业支持与高风险边界 | App 独立诊断、自动转诊或个体处方 |
| `R` | Nuttie 已有仓库合同 | 本地性、无目标日记、零写入、历史不回算和 Owner 门禁 | 未经 Owner 选择的字段、公式或文案已获批准 |

使用规则：

- 只复述来源明确支持的事实；工具默认值不自动成为 Nuttie 默认值。
- 研究论文中的样本边界、估计误差和模型输出名称必须与方程一起保留。
- 模型外新增的活动映射、目标调整、最低值、舍入、重算和宏量分配必须使用独立规则 ID 与版本。
- 美国、加拿大或英国来源可以支持风险边界讨论，但不能冒充中国大陆的诊断、急救或转介流程。
- 所有候选都必须保留“手工目标”和“无目标日记”出口；缺失输入时不得静默补值。

## 3. 三类能量路径不能混用

### 3.1 Mifflin-St Jeor REE

原始研究为 498 名健康受试者，女性 247 名、男性 251 名，年龄 19-78 岁；正常体重 264 名、肥胖 234 名，以间接量热测得 REE。简化方程为：

```text
male branch:
REE = 10 x weightKg + 6.25 x heightCm - 5 x ageYears + 5

female branch:
REE = 10 x weightKg + 6.25 x heightCm - 5 x ageYears - 161
```

直接输入是年龄（年；粒度待定）、公式分支、身高和体重，输出是 `REE kcal/day`。下列内容均不属于 Mifflin 原论文：

- 活动问卷或活动乘数；
- `TDEE`、维持热量或活动消耗；
- 固定/百分比热量缺口；
- 目标体重与达成日期；
- 最低热量或最大减重速度；
- P/C/F 分配；
- 舍入、版本迁移或历史重算。

如果 Nuttie 选择该路径，必须把 `REE 方程` 与 `REE -> 每日目标策略` 分成两个独立、可版本化且可单独停用的规则，不得把组合结果继续标成“MSJ 原公式”。

### 3.2 NASEM 2023 成人 EER

NASEM 的成人方程适用于 19 岁及以上的体重稳定成人。`EER = TEE` 只在体重稳定语境成立。年龄单位为年，身高为厘米，体重为千克，结果为 kcal/day。

| 公式分支 | PAL 类别 | EER 方程 |
| --- | --- | --- |
| M | Inactive | `753.07 - 10.83A + 6.50H + 14.10W` |
| M | Low active | `581.47 - 10.83A + 8.30H + 14.94W` |
| M | Active | `1004.82 - 10.83A + 6.52H + 15.91W` |
| M | Very active | `-517.88 - 10.83A + 15.61H + 19.11W` |
| F | Inactive | `584.90 - 7.01A + 5.72H + 11.71W` |
| F | Low active | `575.77 - 7.01A + 6.60H + 12.14W` |
| F | Active | `710.25 - 7.01A + 6.54H + 12.34W` |
| F | Very active | `511.83 - 7.01A + 9.07H + 12.56W` |

成人 PAL 范围为：

| 类别 | PAL 范围 |
| --- | --- |
| Inactive | `1.00 <= PAL < 1.53` |
| Low active | `1.53 <= PAL < 1.68` |
| Active | `1.68 <= PAL < 1.85` |
| Very active | `1.85 <= PAL < 2.50` |

模型性能不能从研究、规格和评审材料中省略：成人男性建模集 `RMSE 339 kcal/day`、`MAPE 9.4%`；成人女性 `RMSE 246 kcal/day`、`MAPE 8.7%`。报告还指出，个体 PAL 分类非常困难，步数或常见活动问卷与 DLW 测得 PAL 的关联通常较弱，仍需要更好的个体分类方法。具体界面显示 RMSE/MAPE、预测区间还是用户可理解的估算说明，必须由 Owner、健康领域和 UX 分项决定；RMSE/MAPE 不能被写成个人误差上限。

因此 Nuttie 不能把四个 PAL 类别包装成精确测量，也不能把 NIDDK 的 `PAL 1.6` 默认值静默映射为 NASEM 的某一类。NASEM 建议在估算后持续观察体重并按需调整摄入，但没有替 Nuttie 决定观察周期、调整步长、舍入或自动重算行为。

### 3.3 NIDDK Body Weight Planner

NIDDK 官方工具公开限定为 18 岁及以上成人，并排除未成年人、孕妇和哺乳期用户。起始输入包含体重、公式分支、年龄、身高和数值 PAL；目标阶段还需要目标体重、达成时间/天数以及可选活动变化。

该工具基于动态代谢模型，描述体重变化期间能量消耗的适应，不是 `REE x 活动系数 +/- 固定热量`。公开 UI 的 `PAL 1.6` 默认值和 `1000 kcal/day` 阻断只证明该工具自身行为，不能被提升为 Nuttie 通用默认或临床安全线。

若以后考虑本地移植，必须另立模型 Spike，固定论文/代码版本、许可、输入范围、测试向量、回归容差和与官方工具的差异说明。[NIDDK 动态模型采用可行性输入](d040-niddk-dynamic-model-feasibility-input.md)已完成后续来源核验：论文、方程和七个当前网页代码资产可定位，但逐文件许可、稳定版本、官方 oracle corpus、容差、产品保护线与健康评审均未通过。D-040 当前不因此获得实现授权。

### 3.4 路径比较

| 候选 | 输出 | 直接收益 | 主要风险/新增决定 |
| --- | --- | --- | --- |
| E1 NASEM 2023 维持 EER | 体重稳定成人的维持能量估算 | 直接面向 EER，方程与误差公开 | PAL 分类不确定；19+；不能自动推导增/减重目标 |
| E2 Mifflin REE + 独立策略 | REE，再由另一个规则转成目标 | 原方程简单、可解释 | 必须另选活动与调整规则；组合结果不得冒充原论文 |
| E3 动态体重模型 | 达成/维持目标的动态计划 | 能表达目标体重与时间 | 实现和验证成本最高；仍需人群、许可与保护规则审查 |
| E4 只手工/无目标 | 用户输入目标或不设置 | 不需要健康画像，不制造公式精度 | 不提供自动建议，但完整保留记录能力 |

以上均为候选。研究材料不把 E1-E4 中任何一项写成 Owner 已选默认。

## 4. 最小资料字段研究

### 4.1 字段矩阵

| 字段 | 用途 | 自动公式必需性 | 是否必须持久化 | 拒答/缺失行为 | 风险与约束 |
| --- | --- | --- | --- | --- | --- |
| 计算时年龄（年） | Mifflin、NASEM 方程输入；粒度和小数规则待定 | 是 | 否；可只进入本次草稿或目标输入快照 | 不计算，转手工或无目标 | 会过期；不能静默增长后回算历史；不得把取整冒充原公式要求 |
| 精确出生日期 | 自动计算年龄、生日触发候选重算 | 否 | 否；只有另批自动年龄行为才有用途 | 改问已批准粒度的年龄年值或跳过公式 | 比单独年龄值更可识别，存在时区和删除成本 |
| 公式分支 M/F | 选择二元方程系数 | 依所选模型而定 | 否；可只进计算/快照 | 必须允许不回答；不得推断 | 只能解释为生理方程分支，不能冒充身份标签 |
| 身高 | Mifflin、NASEM 输入 | 是 | 否；可瞬时或显式复用 | 不计算 | 需要单位、测量日期/陈旧状态 |
| 当前体重 | 方程输入或动态模型起点 | 是 | 不必复制到 Profile；可显式引用 BodyRecord | 不计算 | 需显示引用值和日期，不能静默取“最新” |
| 活动等级/PAL | NASEM 方程或独立总能量策略 | 每日目标需要；REE 本身不需要 | 否；若保存必须绑定映射版本 | 最多展示 REE，或转手工/无目标 | 自报误差大；首版不得从 HealthKit/步数推断 |
| 目标方向 | 决定维持/减少/增加 | 只在目标调整时需要 | 应属于目标计划，不属于身份资料 | 不自动调整 | 不得默认用户想减重 |
| 目标速度/时间 | 把方向变为定量计划 | 只在动态/调整模型需要 | 目标版本候选，不是通用 Profile | 不自动调整 | 保护线和特殊人群规则均未批准 |
| 目标体重 | 动态模型输入 | 只在对应模型需要 | 目标计划候选 | 不运行动态模型 | 与方向/速度可能重复，需单一语义 |
| 餐次节奏 | 当前 C 流程展示字段 | 否 | 无公式理由 | 应可拒答 | 需要另有可验证用途才能收集 |
| 饮食偏好 | 个性化体验候选 | 否 | 无公式理由 | 应可拒答 | 不能用于能量公式必填 |
| 作息 | 个性化体验候选 | 否 | 无公式理由 | 应可拒答 | 目的漂移与敏感画像风险 |
| 体脂/去脂体重 | 其他模型可能使用 | 当前候选不需要 | 当前不收集 | 不影响当前路径 | 测量误差和额外健康敏感性 |

### 4.2 数据分层

```text
CalculationDraft
  仅用于本次本地计算；取消、失败、转手工、稍后设置时业务库零写入

CurrentProfile
  只有 Owner 选择跨次复用或年龄维护才保存；每项可更正和删除

GoalVersion
  用户确认后才保存；记录输出、来源、版本、生效时间和必要 provenance

IndependentHistory
  DiaryEntry / NutritionSnapshot / BodyRecord 独立存在；不与 Profile 隐式级联
```

公式需要输入只证明 `CalculationDraft` 需要该值，不自动证明 `CurrentProfile` 应保存它。D-040 A/C 如果从某笔 BodyRecord 取体重，必须显示数值和记录日期并让用户确认；取消时仍保持 `profileWrites=0`、`goalWrites=0`。

### 4.3 目标快照候选

| 候选 | GoalVersion 保存内容 | 收益 | 风险 |
| --- | --- | --- | --- |
| R1 完整可复算 | 所有原始输入、方程/系数/舍入/调整版本和输出 | 可逐值解释和复算 | 历史长期复制年龄、分支、身高、体重、活动等敏感数据 |
| R2 输出 + provenance | 目标值、来源、方程/规则版本、生效日，不保存原始输入 | 数据最小，删除边界清楚 | 不能逐值复算，只能说明来源 |
| R3 当前资料 + 输出 | CurrentProfile 保存输入，GoalVersion 保存输出和 provenance | 减少历史输入副本 | 资料变更/删除后旧目标不可复算，禁止用新资料回算旧目标 |

最低 provenance 候选字段：

```text
algorithmFamily
algorithmVersion
sourceYear
coefficientSetHash
unitSchemaVersion
activityMappingVersion
rawResult
roundingPolicyVersion
adjustmentPolicyVersion
displayedResult
userEditedValue
generatedAt
effectiveFrom
supersedesGoalId
```

`coefficientSetHash` 指向包含全部分支的公开系数集，不能编码或泄露本次选择的公式分支。年龄、公式分支、身高、体重和活动只在 R1 的 `inputSnapshot` 中保存；R2/R3 的 GoalVersion 不保存这些原始输入。是否保存 `inputSnapshot` 取决于 R1/R2/R3 的 Owner 选择。P/C/F 没有独立来源前，不能标记为由 Mifflin 或 NASEM 推导。

### 4.4 删除语义候选

| 候选 | 删除 CurrentProfile 后 | 影响 |
| --- | --- | --- |
| D1 只删当前资料 | 保留 GoalVersion 与独立历史；若 R1 保存输入，必须提示历史仍含副本 | 历史展示完整，但敏感输入可能继续存在 |
| D2 同时清除目标快照中的输入副本 | 保留目标输出/版本/日期，只清除 GoalVersion/inputSnapshot 内的年龄、分支、身高、体重和活动副本 | 历史可显示但不可复算，应标记 `inputsRemoved`；不删除独立 BodyRecord、日记或营养快照 |
| D3 级联删除目标历史 | 删除 CurrentProfile 与 GoalVersion；Diary/BodyRecord 另问 | 历史 Left/达标展示进入“目标已删除”态，不得回算 |

删除 CurrentProfile、目标输入副本、GoalVersion 和独立历史是不同范围；任何实现都不得从“删除资料”静默推导为删除 BodyRecord、日记或营养快照。删除独立历史必须经过范围明确的危险操作。`删除全部本地数据` 是 D-043/AT-F18 的另一个危险操作。用户导出到 Files 的加密备份不受 App 控制，任何资料删除页都必须明确不会自动删除外部备份。

## 5. 特殊人群与停止推导边界

### 5.1 证据支持的分层

| 状态 | 自动推导候选行为 | 仍允许 | 禁止声明 |
| --- | --- | --- | --- |
| 未满 18 岁 | 不运行成人体重/减重模型 | 日记、手工记录、无目标模式、适龄支持信息 | 不能缩放成人公式，也不能只凭 BMI 建议减重 |
| 18 岁 | NASEM/Mifflin 成人方程边界不一致；在 Owner 决定前停止自动公式 | 手工目标或无目标 | 不能把 19+ 方程静默外推 |
| 孕期 | 停止自动减重/热量缺口推导 | 日记、专业人员提供的手工目标候选 | 不能生成普通成人减重目标 |
| 哺乳期 | 不复用普通成人热量缺口 | 日记、经个体复核的手工目标候选 | 不能把普通成人缺口当作哺乳需求 |
| 已确诊/正在治疗或主动自述进食障碍高风险 | 停止减重、热量缺口和强化减重数字 | 非诊断性支持、无目标日记、专业支持信息 | 不能用 BMI 或单一问卷排除/诊断风险 |
| 慢性病或可能影响体重/食欲/血糖/体液的用药 | 进入条件复核，不无条件自动推导 | 日记；可候选允许录入专业人员给出的手工目标 | 不能从病名/药名自行调整能量或诊断 |
| PAL 超出模型范围、输入异常或无法归类 | 停止对应公式 | 手工目标或无目标 | 不能夹取到边界后伪装成有效估算 |

NASEM 2023 把超重、肥胖或部分慢性病人群纳入一般 DRI population，这不等于任意疾病、术后状态或用药都得到个体治疗验证。因此“所有慢性病一律硬阻断”证据不足，“完全不提示继续计算”也过于宽松；候选空间应保留条件复核。

### 5.2 不能直接冻结的数值

下列数字在公开来源中有特定上下文，但没有证据支持直接成为 Nuttie 通用保护线：

- NIDDK 工具的 `1000 kcal/day` UI 阻断；
- NICE 专业服务中的 `800-1200 kcal/day` 低能量饮食与 `<800 kcal/day` 极低能量饮食；
- 进食障碍住院/ECG 评估语境中的快速减重指标；
- 一般减重项目示例中的百分比或时间范围。

如果健康领域评审以后提出具体产品保护线，必须记录它是 `productGuardrail` 而非诊断线，并单独保存来源、适用人群、版本、用户文案和异常处理测试。

### 5.3 本地 App 的“转介”含义

Nuttie 没有业务服务器，也不接诊疗系统。产品只能：

- 提供离线保存的专业支持说明和本地适用资源；
- 建议用户联系了解其病史的合格专业人员；
- 在明确高风险输入时停止自动数字推导；
- 对紧急风险使用经中国本地审查的明确文案。

产品不得声称已完成预约、转诊、诊断、临床评估或紧急救援。中国大陆专业称谓、资源和紧急文案仍需本地领域审查，不能直接复制英美流程。

## 6. 公式合同仍需 Owner 分项确认

### 6.1 缺失与拒答

- 任一必需输入缺失、拒答、超范围或单位无法确定时，公式返回结构化 `NOT_CALCULATED`，不得返回 `0`。
- 不从姓名、昵称、外观、账号、BodyRecord、HealthKit、步数或历史记录静默推断输入。
- 如果显式引用 BodyRecord，先显示值和日期，用户确认后才进入 CalculationDraft。
- REE 路径缺少活动时最多展示明确标记的 REE，不得把它显示为每日目标。
- 所有失败路径保留手工目标和 `ST-EMPTY-02` 无目标日记。

### 6.2 单位、精度与舍入

- Domain 输入先转换为 `kg`、`cm`、按已批准 `ageInputPolicy` 表示的年龄年值和明确枚举，再执行公式。
- 保存原始输入单位和规范化值的策略取决于 R1/R2/R3；不得链式舍入中间项。
- 候选 RND1：保存 raw 小数，显示到整数 kcal；候选 RND2：保存 raw 小数，显示到最接近的 10 kcal；候选 RND3：保存 raw 小数，显示到最接近的 50 kcal。
- 任何粒度都必须由 Owner 选择，并在最终一步应用。来源没有替 Nuttie 决定显示粒度。

### 6.3 版本、重算与历史

- 方程、系数、活动映射、目标调整、宏量规则和舍入必须是不同版本域。
- 资料编辑或公式升级不得静默覆盖有效目标。
- 候选 RC1：资料变化后不自动计算，只有用户主动点击“重新计算”才生成差异预览，确认后创建新 GoalVersion；RC2：只标记当前目标 `stale`，不生成候选；RC3：资料或公式变化时本地自动生成待确认候选，但不自动生效。
- 新目标以 `effectiveFrom` 生效，旧目标与旧日记不回算。
- 用户手工编辑值必须保留来源与优先级，不能在下次打开时被公式覆盖。
- 算法升级必须保留旧版本可解释元数据；无法再复算时明确显示原因。

### 6.4 P/C/F 仍是独立证据缺口

Mifflin、NASEM 成人 EER 和 NIDDK Body Weight Planner 都不能为 Nuttie 的蛋白质、碳水和脂肪目标提供完整来源。D-040 不得继续使用原型夹具 `100/250/67` 作为公式结果。

后续必须单独研究并由 Owner 选择：

- P/C/F 全手工；
- 只显示能量目标，宏量目标稍后设置；
- 使用有明确适用人群、单位、上下限和版本的独立宏量规则；
- 用户给出某一宏量目标后，剩余值如何处理；
- 目标之和与能量换算不一致时的显示、校验和保存行为。

在该子题关闭前，任何自动 P/C/F 都保持 `FORMULA_REVIEW_REQUIRED`。

## 7. Owner 原生选择卡草案

以下只是未来聊天内原生选择卡的内容设计，不是当前 Owner intake，不得用网页表单、文字回复模板或本文件中的“研究建议”代替实际点击。本研究登记时 OI-03 必须先出现且 D-040 不得抢占顺序；OI-03 后续已完成，当前仍须先处理 OI-02，并继续禁止 D-040 抢占 Owner intake。

未成年人、孕期、哺乳期以及已确诊/正在治疗或主动自述进食障碍高风险时，普通成人自动减重与热量缺口推导保持 fail closed；这属于当前证据建立的安全不变量，不作为 Owner 可豁免选项。未来若引入专门的儿童、孕哺期或临床模型，必须另做证据、健康领域和 Owner 决策。

每张卡只解决一个变量，并限制为 2-3 个互斥选项：

| 草案序号 | 单一问题 | 选项骨架 | 研究侧较低风险起点 |
| --- | --- | --- | --- |
| 01 | 自动公式适用年龄 | A 仅 19+；B 18 岁只使用另经验证覆盖 18 岁的模型；C 不做自动公式 | A；18 岁保留手工/无目标 |
| 02 | 年龄来源与是否保存 | A 每次由用户输入年龄年值且不保存；B 保存用户输入的当前年龄年值与录入日期；C 保存出生日期并按版本化日期/时区规则派生 | A 数据最小；C 识别性最高 |
| 03 | 传入方程的年龄表示 | A 按“上次生日后完整年数”使用整数；B 使用到一位小数的年龄年值 | 无证据默认；两项都需数值验证和版本化 |
| 04 | 基础能量路径 | A NASEM 维持 EER；B Mifflin REE；C 只手工/无目标 | A 只生成维持候选；B 不能直接称每日目标 |
| 05 | 二元公式分支与拒答 | A 明示“公式分支”，允许跳过且跳过后不自动计算；B 不收集分支并对所有用户停用自动公式 | A；不得推断身份 |
| 06 | 活动输入表示 | A NASEM 四类并说明不确定性；B 数值 PAL 且只配对应模型；C 不收集活动并停用自动每日能量 | A 或 C；禁止静默默认 |
| 07 | 活动输入缺失 | A 不显示任何自动公式结果、不生成目标并继续无目标日记；B 仅当选择 Mifflin 时显示明确标记的 REE 信息，仍不生成每日目标 | A；两项都禁止默认活动值 |
| 08 | Mifflin REE 的当前用途 | A 显示 REE 信息，用户另行手工设置每日目标；B 完全不计算或显示 Mifflin，改走其他基础路径 | A；当前没有 REE 自动转换为每日目标的可执行选项 |
| 09 | 体重增减目标 | A 自动公式只做维持；B 使用另经验证的动态模型；C 增减目标只手工/无目标 | A，等待专项健康评审 |
| 10 | 当前阶段 P/C/F 行为 | A 三项均由用户手工设置；B 三项逐项可选，缺失显示“未设置”；C 当前阶段不展示宏量目标入口 | B/C；自动宏量另开研究与决定 |
| 11 | 资料与目标存储 | A R1 完整可复算；B R2 输出 + provenance；C R3 当前资料 + 输出 | B，数据最小但不可逐值复算 |
| 12 | 删除资料语义 | A D1 只删当前资料；B D2 清除 GoalVersion 输入副本；C D3 级联目标历史 | 无默认；必须结合序号 11 展示影响 |
| 13 | 自动能量结果显示舍入 | A 整数 kcal；B 最接近 10 kcal；C 最接近 50 kcal | 无证据默认；raw 值始终不链式舍入 |
| 14 | 资料/公式变化后的重算 | A 仅用户主动点击后计算差异候选；B 只标记 stale 且不生成候选；C 变化时系统自动计算待确认候选 | A；三项都不回算历史或自动生效 |
| 15 | 慢性病/用药的非诊断性输入 | A 一个“有/无/不确定”总问题；B 疾病与用药分成两个“有/无/不确定”问题；C 不询问并对所有用户停用自动公式 | A；“有/不确定”进入条件复核，不由 App 诊断 |
| 16 | 估算不确定性的界面表达 | A 用户可理解的估算说明 + PAL 不确定性；B 在 A 基础上补充群体 RMSE/MAPE；C 在 A 基础上展示经模型验证的个体预测区间 | A；B/C 不得把群体指标写成个人上限 |
| 17 | 最终首启结构 | A 最小资料 + 公式候选；B 只手工；C 强制完整问卷 | 待序号 01-16 与宏量研究关闭后再比较 |

当前证据下，Mifflin 路径没有“REE 自动转换为每日目标”的可执行选项。若后续希望增加，团队必须先提交带来源、活动映射、适用范围、误差、版本和测试向量的具体策略，再为该策略分配独立 Owner 决定；不能用“以后另批”作为可选择但未定义的占位项。

表中序号只是研究文档中的阅读顺序，不是 ProjectOps ID。正式排期前，PM 必须为每个需要独立保存的答案分配新的全局 `D-###`，或先扩展并批准父子决定 schema；不能把 17 个答案压成一条 D-040 响应，也不能把草案序号写入现有 Owner intake。

表中“较低风险起点”是团队研究建议，不是 Owner 选择。正式选择卡必须把收益、代价、不可用范围和“不选择/稍后”行为写全，且不会把建议项预记为接受。

## 8. PX-0 验收矩阵草案

| Case ID | 场景 | 预期 |
| --- | --- | --- |
| D040-IN-001 | 任一自动公式字段拒答 | `NOT_CALCULATED`；可转手工/无目标；业务库零写入 |
| D040-IN-002 | 公式分支未选择 | 不从其他资料推断；不生成自动目标 |
| D040-IN-003 | 引用历史体重 | 先显示值和日期；确认前零写入 |
| D040-IN-004 | 活动未知或无法归类 | 不静默使用 1.6 或任一类别 |
| D040-IN-005 | 只计算 Mifflin | 输出明确标为 REE，不出现每日目标或 P/C/F |
| D040-IN-006 | 计算 NASEM | 使用选定 PAL 对应的独立方程；显示估算和不确定性 |
| D040-IN-007 | 18 岁用户进入 19+ 方程 | fail closed，转手工/无目标 |
| D040-IN-008 | 未成年人、孕期、哺乳期 | 普通成人减重推导不可达；日记仍可用 |
| D040-IN-009 | 进食障碍风险主动自述 | 停止减重数字；不诊断；显示经审查的支持信息 |
| D040-IN-010 | 慢性病/用药自述 | 进入条件复核，不按病名/药名自行调目标 |
| D040-IN-011 | 用户取消、稍后或保存失败 | CalculationDraft 不形成正式档案/目标；原数据不变 |
| D040-IN-012 | 用户确认公式候选 | 创建新 GoalVersion；记录来源/版本/生效日；旧历史不回算 |
| D040-IN-013 | 修改资料或升级公式 | 依 RC1/RC2/RC3 生成候选或 stale，不静默覆盖 |
| D040-IN-014 | 删除 CurrentProfile | 依 D1/D2/D3 执行，结果与仍保留数据逐项可见 |
| D040-IN-015 | 删除全部本地数据 | 受控容器清除；明确 Files 外部备份不受 App 控制 |
| D040-IN-016 | 无宏量规则 | 不生成、补零或展示夹具 P/C/F |
| D040-IN-017 | 飞行模式 | 全部资料、计算、保存、版本与删除路径本地可用 |

这些用例只是未来规格的验收输入。只有 Owner 选择、健康/隐私/工程评审和 PX-0/PX-1 重新审查完成后，才能冻结期望值和测试向量。

## 9. 尚未关闭的审查项

1. 一般成人自动路径选 E1/E2/E3/E4 中哪一类，以及是否允许切换。
2. 18 岁与 19+ 方程边界如何处理。
3. 二元公式分支的简中文案、拒答路径与身份非推断说明。
4. PAL 问题如何映射、如何表达不确定性、未知如何处理。
5. 是否只生成维持目标；任何增/减重模型、观察周期和产品保护线均需专项审查。
6. P/C/F 的独立依据、适用人群、单位、上下限和不一致处理。
7. R1/R2/R3 与 D1/D2/D3 的组合；备份中历史输入的说明和删除边界。
8. 舍入粒度、输入有效范围、目标生效日、用户编辑优先级和公式升级策略。
9. 中国大陆适用的专业支持称谓、资源与紧急文案。
10. 健康领域评审由谁签署、证据多久复核一次、何种变更要求重新走 Owner 决策。

在以上项目完成前，D-040 不具备 `PX-1_COMPLETE`、`PX-2_PASS` 或 `READY_FOR_OWNER_REVIEW` 条件。

## 10. 来源

访问日期均为 2026-08-06。

### 10.1 方程与模型

- [Mifflin-St Jeor 原始研究，PMID 2305711](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [NASEM 2023 Dietary Reference Intakes for Energy](https://www.ncbi.nlm.nih.gov/books/NBK588659/)
- [NASEM Table 5-16：成人 EER 方程](https://www.ncbi.nlm.nih.gov/books/NBK591021/table/tab_5_16/)
- [NASEM Table 5-5：TEE 方程与模型性能](https://www.ncbi.nlm.nih.gov/books/NBK591021/table/tab_5_5/)
- [NASEM Table 5-4：PAL 分类范围](https://www.ncbi.nlm.nih.gov/books/NBK591021/table/tab_5_4/)
- [NASEM Chapter 7：EER 的应用与 PAL 不确定性](https://www.ncbi.nlm.nih.gov/books/NBK591020/)
- [NASEM Consensus Study Report Highlights](https://nap.nationalacademies.org/resource/26818/DRIs_for_Energy_Highlights.pdf)
- [NIDDK Body Weight Planner](https://www.niddk.nih.gov/bwp)
- [Body Weight Planner 动态模型论文，PMC3880593](https://pmc.ncbi.nlm.nih.gov/articles/PMC3880593/)
- [NIDDK 动态模型采用可行性输入](d040-niddk-dynamic-model-feasibility-input.md)

NASEM Supplemental Appendix X 经核验是基于 NHANES/CCHS 全国调查数据的膳食能量摄入均值、标准误与百分位统计表，不是调查问卷，也不是 EER 方程表。本研究不使用它为公式、活动分类或个体目标背书。

### 10.2 特殊人群与风险边界

- [NIDDK Health Tips for Pregnant Women](https://www.niddk.nih.gov/health-information/weight-management/health-tips-pregnant-women)
- [NIDDK Helping Your Child Who Is Overweight](https://www.niddk.nih.gov/health-information/weight-management/helping-your-child-who-is-overweight)
- [NIDDK Take Charge of Your Health: A Guide for Teenagers](https://www.niddk.nih.gov/health-information/weight-management/take-charge-health-guide-teenagers)
- [NIDDK Choosing a Safe and Successful Weight-loss Program](https://www.niddk.nih.gov/health-information/weight-management/choosing-a-safe-successful-weight-loss-program)
- [NIDDK Prescription Medications to Treat Overweight and Obesity](https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity)
- [NICE NG246：识别和评估超重、肥胖与中心性肥胖](https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity)
- [NICE NG246：Physical activity and diet](https://www.nice.org.uk/guidance/ng246/chapter/Physical-activity-and-diet)
- [NICE NG246：Discussing results and referral](https://www.nice.org.uk/guidance/ng246/chapter/Discussing-results-and-referral)
- [NICE NG69：Eating disorders, recognition and treatment](https://www.nice.org.uk/guidance/ng69/chapter/recommendations)
- [NIMH Eating Disorders](https://www.nimh.nih.gov/health/topics/eating-disorders)

### 10.3 仓库合同

- [D-040 原型 Manifest](d040-prototype-manifest.md)
- [Owner 分批决策包](../02-product/owner-decision-packs.md)
- [验收与双向追踪](../02-product/acceptance-traceability.md)
- [状态、内容与无障碍基线](states-content-accessibility.md)
- [加密备份与恢复](../04-engineering/data/encrypted-backup-and-restore.md)
- [本地优先架构](../04-engineering/architecture/local-first-architecture.md)
