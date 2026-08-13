# Nuttie Project Ops

本目录是 D-009 的本地项目事件源。它记录真实发生的任务、Agent 消息、Owner 决策和门禁变化，供实时工作台与静态快照消费；不包含业务用户数据，也不连接任何云服务。

## 目录

```text
project-ops/
  decisions.json              # Owner 决策的机器可读权威副本
  schemas/                    # JSON Schema
  events/YYYY-MM-DD.jsonl     # append-only 项目事件
  messages/<role>.jsonl       # Agent 原始协作消息摘要
  snapshots/current.json      # PM 按源记录人工归并并校验的当前状态
  validate.mjs                # 无第三方依赖的运营一致性校验器
  validate.test.mjs           # 当前基线与单点突变负向测试
  reconcile.mjs               # 只读跨源对账与快照新鲜度诊断器
  reconcile.test.mjs          # 对账器与门禁漂移负向测试
```

## 写入规则

1. 每行 JSONL 是独立、完整、UTF-8 JSON 对象。
2. 已记录事件不原地改写。事实变化时追加 `FACT_CORRECTION`；决定变化时追加新决定并设置 `supersedes`。
3. 当前仓库尚未实现事件 reducer；`snapshots/current.json` 由 PM 按 `events/*.jsonl`、`messages/*.jsonl`、决定台账和门禁文档人工归并并完成一致性校验。工作台静态快照只打包这份已校验状态，不得宣称自动重建；未来建立 reducer 后再切换为自动生成。
4. Agent 只能写其任务指定的消息文件；PM 负责合并、校验和门禁事件。
5. 时间使用 RFC 3339 和明确时区；当前项目默认 Asia/Shanghai。
6. 项目事件不得包含 API key、Authorization、健康记录、个人照片、完整 prompt、AI 响应或其他业务隐私数据。
7. `source.kind=agent_message` 只表示实际收到/发出的 Agent 消息；计划中的沟通不能预先记录为已发生。

## 工作台语义

- `active`：Agent 当前有已分配且未结束的任务。
- `waiting_review`：产物已交接，正在等待指定审查者答复。
- `completed`：本次任务已提交产物和总结，不代表门禁通过。
- `blocked`：存在明确阻断，且已按工作流升级。
- `idle`：没有当前任务；不应显示成持续工作。

## 校验

在仓库根目录执行：

```powershell
node project-ops/validate.mjs
node --test project-ops/json-schema-subset.test.mjs
node --test project-ops/validate.test.mjs
node project-ops/reconcile.mjs
node --test project-ops/reconcile.test.mjs
```

`validate.mjs` 不安装或加载第三方依赖，当前固定 `PHASE0_2026_08_13_AI_GUIDANCE_REFERENCE_CONTRACT` 基线并检查：

- 5 份 Draft 2020-12 Schema 定义与受控映射；使用仓库内 `DRAFT_2020_12_PROJECT_SUBSET_V1` profile 校验 `decisions.json`、`owner-intake.json`、`snapshots/current.json`、全部 Event 和 Message，当前共 246 个实例。Schema 负责结构与类型，精确计数、Gate、Agent 和跨源事实仍由版本化运营不变量负责。
- JSON/JSONL 解析、决定/事件/消息/证据 ID 唯一性。
- 每日事件文件、日期前缀、连续序号、记录日期和版本化的 `59/13/5/29/5/15` 日分布。历史事件存在已知的时间回填逆序，因此不以物理行时间单调作为失败条件。
- Agent 消息 `responseTo`、证据状态与五条 pending 集合。
- 决定、事件、消息、角色、证据和 gap theme 的源计数、快照计数与版本化基线。
- Agent ID 唯一性与唯一 active 角色 `root`；Owner intake 精确 12 项候选、未完成状态、D-047 A→C 审计链、唯一 OI-03 设备事实和 OI-02 原生 choice-ui 入口。
- D-039 保持 `CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW`，且没有 Owner 选择或正式实现授权。
- D-040 保持 `CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`；首轮 reviewer 的临时 PX-1 表述未被 PM 接受，字段/公式/特殊人群研究与两类独立复审均不得授权 PX-1、PX-2、Owner 评审、决定接受或正式实现。历史 `oi03RemainsNext` 只描述当时时点；17 个研究草案问题尚未分配权威 `D-###`，不得写入 Owner intake。
- F10 体重记录合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记原始单位、精确换算、同日多记录和事务证据；不得借此授权 BMI/目标/异常/显示精度、按日合并、HealthKit、原生或正式实现。
- F11 七日能量读模型保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记本地事实窗口、缺失/零、精确聚合和来源反查；不得借此授权消耗公式、目标/净值、平均/更长周期、AI、HealthKit、原生或正式实现。
- F13 手工消耗合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记直接输入、事务和 `BURNED / MANUAL_BURN / USER_ENTERED` 投影；不得冒充测量值，也不得授权运动字段、公式、步数、HealthKit、AI、原生或正式实现。
- F14 饮水合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记原始容量、显式版本化单位定义、事务和精确当日汇总；不得借此授权目标、快捷量、默认/展示单位、撤销、趋势、提醒、HealthKit、AI、原生或正式实现。
- F15 本地提醒合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记本地规则 CRUD、权限独立保存、generation 防回滚和 pending/delivered 对账；不得授权提醒类型、重复规则、通知内容、Push/APNs、后台定时器、真实通知 API、原生或正式实现，也不得承诺系统一定呈现。
- F08 日期导航合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记显式日期观察、IANA 时区、DST/午夜滚日、generation 防回滚和外部策略绑定；不得授权未来日、补记、跨时区重基、默认今天、UI、持久化、系统时钟、网络、原生或正式实现。
- F06 餐次分组合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记调用方版本化定义、显式顺序、空餐次、未分配/旧定义分离和 revision 反查；不得授权内建默认、默认/自定义规则、移动/复制、目标、UI、持久化、系统时钟、网络、原生或正式实现。
- F05 宏量目标历史合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记既有目标原值、opaque 版本化单位定义、来源/用户编辑状态、生效历史和实际事实的缺失语义；不得推断实际/目标兼容性或授权算法、百分比换算、比较、舍入、写入、持久化、系统时钟、网络、原生或正式实现。
- F04 每日能量账本合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记指定日期摄入/消耗精确聚合、来源 revision 与既有能量目标生效历史；Left 必须保持 `POLICY_NOT_AUTHORIZED`，不得授权公式、目标生成、缺失消耗默认值、负值、舍入、写入、持久化、系统时钟、AI、HealthKit、网络、原生或正式实现。
- F12/F17 本地档案合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记调用方版本化 opaque schema、空文档、CRUD CAS、幂等/并发事务与非级联删除证据；不得授权资料字段、当前/多档案策略、级联目标/体重/日记/饮水删除、公式、账号/服务器、持久化、系统时钟、网络、原生或正式实现。
- F18 本地数据访问清单合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记调用方版本化领域定义、空领域、应用内只读分页、snapshot/cursor/page 绑定和全量完成证明；Keychain secret 值必须排除，真实原生容器仍待 adapter，外部 Files 副本不属 App 控制；不得授权 D-035 明文导出、D-027/D-030 备份恢复、写入、持久化、系统时钟、网络、原生或正式实现。
- F01/F02 AI 候选确认合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记易失本地输入、严格 response candidate、显式 review、request/policy/candidate 指纹和用户确认值幂等保存端口；不得授权 D-031/D-033/D-034/D-036/D-053、真实 transport、正式字段/映射、AI 候选自动写日记/目标、持久化 Repository、原生或正式实现。
- F16 AI 参考草稿合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记严格 opaque response、调用方内容/免责声明定义、`REFERENCE_ONLY / NOT_MEDICAL_ADVICE` 边界、来源/edit 指纹、本地 revision 编辑和放弃清理；不得授权 UXD-04/UXD-11、D-033/D-053、医疗安全、高风险用途、正式 payload、自动改日记/目标、持久化、网络、原生或正式实现。
- F21 媒体权限编排合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记当前任务说明后的窄相机权限 effect、系统用户媒体选择零照片全库权限，以及拒绝/受限/撤权/取消和迟到回执的手工降级；不得授权权限文案、D-031 媒体保留、视频、定位、持久化、真实原生 API、网络或正式实现。
- F20/F23/F24 禁止能力审计合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION / BLOCKED`：正式签名 Release Archive 和 27 面报告均不存在，生产工件扫描、Release 网络捕获与定位权限捕获均未执行；不得把当前工作区零发现冒充 PASS、宣称证据真实或关闭发布门禁。
- F22 平台/语言 Release 审计保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION / BLOCKED`：只固定 D-011 iOS 17.0 与 D-016 首发简中；设备族、方向、Mac、Vision availability 四项决定未形成，无签名 Archive 和 25 面生产证据；不得从 D-038、当前设备或工具默认值推导，不得宣称决定/报告真实或关闭发布门禁。

退出码约定为：`0` 校验通过，`1` 解析成功但一致性断言失败，`2` 用法、文件读取或 JSON/JSONL 解析失败。Owner 关闭 OI-02、完成整批回读、完成 D-039 PX-3、关闭 D-040 PX-0 输入，或权威计数合法变化时，必须在对应原子提交中显式升级版本化基线和测试，不能静默放宽断言。

内置 profile 只支持当前 5 份 Schema 实际使用的 `$defs`、本地 `$ref`、type/const/enum、required/properties/items/additionalProperties、字符串/数组约束、pattern、RFC 3339 date/date-time 等关键字。新增未支持关键字、外部或循环 `$ref` 会失败关闭，不能把本工具解释为通用 JSON Schema 引擎。完整 Draft 2020-12 元 Schema 合规仍须由 AJV 8 + `ajv-formats` 或后续经批准的等价 validator 交叉检查；当前 PASS 精确表示“Schema 定义符合仓库 profile 且 246 个受控实例通过校验”。

`reconcile.mjs` 是只读诊断器：它重新从事件、消息、决定台账、Owner intake、证据矩阵和人工快照读取数据，报告源计数、快照指标、最新源时间、已记录的 OI-03 设备事实、Owner 原生 `OI-02` choice-ui 门禁，以及 D-039/D-040 当前授权位。它不会覆盖 `snapshots/current.json`；当前人工快照已同步至 2026-08-13 的 F16 AI 参考草稿合同登记事件，并与最新来源时间一致。
