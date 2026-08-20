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

`validate.mjs` 不安装或加载第三方依赖，当前固定 `PHASE0_2026_08_20_D040_DATA_LIFECYCLE_BATCH_SPEC` 基线并检查：

- 5 份 Draft 2020-12 Schema 定义与受控映射；使用仓库内 `DRAFT_2020_12_PROJECT_SUBSET_V1` profile 校验 `decisions.json`、`owner-intake.json`、`snapshots/current.json`、全部 Event 和 Message，当前共 294 个实例。Schema 负责结构与类型，精确计数、Gate、Agent 和跨源事实仍由版本化运营不变量负责。
- JSON/JSONL 解析、决定/事件/消息/证据 ID 唯一性。
- 每日事件文件、日期前缀、连续序号、记录日期和版本化的 `59/13/5/29/5/15/10/22/8/3/6` 日分布。历史事件存在已知的时间回填逆序，因此不以物理行时间单调作为失败条件。
- Agent 消息 `responseTo`、证据状态与五条 pending 集合。
- 决定、事件、消息、角色、证据和 gap theme 的源计数、快照计数与版本化基线。
- Agent ID 唯一性与唯一 active 角色 `root`；Owner intake 精确保留首批 12 项输入、后续 D-039=A、D-032 Spike 授权、D-047 A→C 审计链、唯一 OI-02/OI-03 事实和计划中的宿主原生 `request_user_input` D-040 入口。
- D-039 保留历史 `PX-2_PASS` 与 Owner `A / ACCEPTED / PX-3_PASS`，并精确冻结 PX-4 首层层级和四域复核；首次 PX-5 DoR 的 `NOT_READY / 7 BLOCKERS` 保留为历史评估，随后 B01/B02 关闭。B03 的 D-045 最近/收藏卡、B04 的 D-031 媒体/AI 保留卡与 B05 的 D-033 非标签 AI 上传确认卡、D-034 AI 资源预算卡、D-036 AITransport 隔离卡、D-053 Provider 用途准入卡均已通过四域自审，但独立复核、Owner 评审、决定接受和对应阻断关闭均未发生；D-034 另需最低支持 iPhone benchmark，D-036 另需 OI-07、三 Provider 兼容 Spike 与原生边界证据，D-053 另需 OI-07、逐 Provider 十维证据与 App Privacy 映射；B03 至 B07 共 5 项继续开放。正式实现、正式根工程、原生 iOS、D-032 第二次动作和 D-053 授权均保持关闭。
- D-040 保持 `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`；首轮 reviewer 的临时 PX-1 表述未被 PM 接受，字段/公式/特殊人群与宏量研究复审已归零。17 个原草案问题和宏量补充轴已分解为 20 个决定轴，D-040 保留最终结构、D-054~D-072 仅预留候选 ID；前三批十三卡已锁定稳定 ID、互斥选项、失败关闭依赖并通过四域自审，动态模型方案仍需专项证据。资料生命周期批次另锁定四层分离、保存/删除组合、raw/display 和历史不回算。中国支持/健康治理输入已锁定 12356/120 用途分离、四类称谓、六个候选文案场景、90 天/发版前复核及即时失效条件；具名健康评审人、资质、批准和 Content QA 仍缺失。中国宏量标准输入已锁定 WS/T 578.1-2017 现行状态、成人 P/C/F 范围、4/4/9、修订监视和禁止默认/处方/评分/历史回算边界；D-063 仍未 Owner-ready。它们不得进入决定台账或 Owner intake，PX-1、PX-2、Owner 评审、决定接受、公式、持久化、健康文案和正式实现继续关闭。
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
- F03 本地条码查找编排合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记完整 GTIN 本地精确查询、可信目录证据绑定、候选显式选择和调用方复核/建档交接；不得授权模糊识别、覆盖率承诺、相机权限、食品/日记写入、AI/网络回退、持久化 Repository、原生或正式实现。
- F19 导入预检合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记严格 JSON/资源/路径碰撞边界、manifest/entry 精确集合、导入对象/调用方验证声明/活动状态指纹绑定和失败保持旧状态；验证声明不等于真实验签，激活固定等待 D-026/D-027/D-030，不得授权文件系统、网络、原生或正式实现。
- F09 营养事实与洞察可用性合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记可信本地七项营养事实可用和评分/微量标签/风险/益处能力保留但内容零暴露；不得授权算法、字段全集、医学/个体化结论、AI、自动资料使用、网络、原生或正式实现，也不得借未知规则删除 D-017 范围。
- F03 数据包预授权合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记批准预算只能收紧、真实 object key/string/depth 预解析预算、严格被动 JSON/普通文件、manifest/entry/来源/转换一致性、不可变 subject 指纹和调用方验证声明绑定；调用方声明不等于真实验签，不得授权 D-026 签名/trust root、D-052 许可分发、激活、文件系统、网络、原生或正式实现。
- F19 恢复启动对账合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记结构化 generation 观察、generation/intent/restore observation 指纹、intent 存在时写入关闭、绑定当前观察的未提交行动计划和外部执行后重新观察；调用方观察不等于 harness 做过密码学/文件/Keychain 验证，不得授权 D-027/D-030/D-035、清理、持久化 effect、网络、原生或正式实现。
- F18 全量删除回执合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记严格被动 JSON/资源预算、evidence/verifier/profile 身份、effect/observation/outcome 指纹、状态/错误语义和跨 effect 重放拒绝；回执真值固定为调用方声明，不得冒充真实容器为空、密钥失效、通知移除、外部 Files 删除、文件系统/Keychain/原生或正式实现证据。
- F01/F02 AI Provider policy 与 D-053 发送前合同保持 `SPIKE / LOCAL_ONLY / NON_PRODUCTION`，只登记完整本地 profile、terms/privacy 证据、风险/有效期/地区、精确 request subject、Apple 禁项、三类指纹和 D-053 `CANDIDATE / NOT_AUTHORIZED` 门禁；即使 profile=`ALLOW` 且匹配也必须阻断，不得读取 key、序列化敏感 body、联网、写业务状态、授权原生或正式实现。
- F01/F02 不可信 AI 响应合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记重复键/尾随数据/空候选/危险标签和数值/资源超限失败关闭、规范化候选语义指纹、被动状态快照及错误不回显；候选仍未经确认，schema 不是正式 Provider API，不得授权 policy、凭据、敏感正文、联网、持久化、原生或正式实现。
- F01/F02 候选确认 V2 完整响应证据合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记 responseFingerprint 贯穿状态/review/确认记录/命令/回执、未选候选变化检测和旧 V1 失败关闭；只持久化指纹与用户确认值，不得保留原始响应/候选正文或授权自动业务写入、真实 Repository、网络、原生和正式实现。
- F01/F02/F16 AI 请求证据共享上下文保持 `SPIKE / LOCAL_ONLY / NON_PRODUCTION`：唯一 `AI_REQUEST_EVIDENCE_CONTEXT_V2` 绑定精确 subject、完整 profile、D-053 authorization evidence 和 policy-check，只接受 scope/有效期/风险/ALLOW 均满足且唯一剩余阻断为 `D053_NOT_AUTHORIZED`；候选确认升 V3、F16 升 V2，旧松散上下文和旧消费者证据失败关闭；上下文固定不证明 transport、不授予发送，不得授权读取 key、序列化敏感 body、联网、自动业务写入、原生或正式实现。
- F01/F02 AI 配置—策略预检保持 `SPIKE / LOCAL_ONLY / NON_PRODUCTION`：只从稳定 `CONFIGURED` 生命周期导出带指纹的非敏感配置证据，并与共享请求上下文比较 baseURL/origin/model；即使精确一致也因配置未绑定 providerId 及 D-033/D-034/D-036/D-053 固定 `BLOCKED`，不得读取 key、构造 header/body、创建 transport、联网、写业务状态或授权正式实现。
- D-032 隔离 SDK 57 Windows JS Spike 已用 Node 22.13.0 / pnpm 11.18.0 完成冻结安装、静态边界、TypeScript、Expo public config、Doctor 20/20、Android 1,652 模块与 iOS 条件 1,565 模块 Metro/Hermes export；Android/iOS export 已共用平台限定 metadata、唯一 bundle、精确文件集、资产扩展名、路径越界和原生目录自动校验，lock 指纹精确，bundle 尺寸/SHA 只记录单次运行且不作可复现构建门禁。仍未生成原生目录、未运行 Prebuild/Xcode/CocoaPods、没有 iOS/Android 原生、SQLCipher/Keychain、Archive/签名产物或真机证据，D-032 保持 `CANDIDATE` 并继续等待第二次 Owner 动作。
- D-032 高风险 JS 依赖表面进一步绑定 SQLite、SecureStore、Camera、Notifications、Reanimated、Worklets 的六个具体符号与四个 config plugin，TypeScript/Metro 解析后 Android bundle 为 1,652 模块；原生 API、权限、数据库、Keychain、通知、worklet 和网络调用仍为 0，不得冒充原生运行证据或 D-032 接受。
- F21 媒体权限编排合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`，只登记当前任务说明后的窄相机权限 effect、系统用户媒体选择零照片全库权限，以及拒绝/受限/撤权/取消和迟到回执的手工降级；不得授权权限文案、D-031 媒体保留、视频、定位、持久化、真实原生 API、网络或正式实现。
- F20/F23/F24 禁止能力审计合同保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION / BLOCKED`：正式签名 Release Archive 和 27 面报告均不存在，生产工件扫描、Release 网络捕获与定位权限捕获均未执行；不得把当前工作区零发现冒充 PASS、宣称证据真实或关闭发布门禁。
- F22 平台/语言 Release 审计保持 `SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION / BLOCKED`：只固定 D-011 iOS 17.0 与 D-016 首发简中；设备族、方向、Mac、Vision availability 四项决定未形成，无签名 Archive 和 25 面生产证据；不得从 D-038、当前设备或工具默认值推导，不得宣称决定/报告真实或关闭发布门禁。

退出码约定为：`0` 校验通过，`1` 解析成功但一致性断言失败，`2` 用法、文件读取或 JSON/JSONL 解析失败。完成 D-039 PX-5、记录 MVP 范围、关闭后续门禁，或权威计数合法变化时，必须在对应原子提交中显式升级版本化基线和测试，不能静默放宽断言。

内置 profile 只支持当前 5 份 Schema 实际使用的 `$defs`、本地 `$ref`、type/const/enum、required/properties/items/additionalProperties、字符串/数组约束、pattern、RFC 3339 date/date-time 等关键字。新增未支持关键字、外部或循环 `$ref` 会失败关闭，不能把本工具解释为通用 JSON Schema 引擎。完整 Draft 2020-12 元 Schema 合规仍须由 AJV 8 + `ajv-formats` 或后续经批准的等价 validator 交叉检查；当前 PASS 精确表示“Schema 定义符合仓库 profile 且 294 个受控实例通过校验”。

`reconcile.mjs` 是只读诊断器：它重新从事件、消息、决定台账、Owner intake、证据矩阵和人工快照读取数据，报告源计数、快照指标、最新源时间、已确认的 OI-02 标识状态与 OI-03 设备事实、D-032 隔离 JS Spike 授权、D-039=A 接受/PX-4/PX-5 NOT_READY/B01/B02 关闭、D-045/D-031/D-033/D-034/D-036/D-053 三包内部卡自审/独立复核与额外证据待办、D-040 的 20 轴分解、候选 ID 预留、前三批十三卡自审、动态模型/生命周期边界、中国支持输入、WS/T 578.1-2017 宏量标准证据和具名健康评审缺口与计划中的 D-040 Owner 卡，以及当前授权位。它不会覆盖 `snapshots/current.json`；当前人工快照已同步至 2026-08-20 D-040 中国宏量标准输入事件并与最新来源时间一致。
