# 验收与双向追踪基线

状态：`G2_DRAFT_FOR_REVIEW`  
日期：2026-07-31  
适用范围：F01-F24、REQ-F01~REQ-F24、AT-F01~AT-F24；D-001~D-017 是 accepted 约束，正文明确引用的 D-018~D-053 均为 candidate gate，除非权威台账另行标为 `ACCEPTED`

## 1. 规则

- 追踪方向必须同时支持：`Source -> Evidence ID -> Feature ID -> Requirement ID -> Acceptance ID -> Test/Evidence`，以及从测试反查到公开来源或 Nuttie-required 理由。
- `confirmed` 与 `cross-source` 只决定竞品证据强度；实现仍须经过 Owner 对具体交互、默认值、算法和技术候选的批准。
- `pending`、EG-01~EG-09 和 Nuttie-required 不能冒充竞品事实。
- 表中“阻断/待决”不是默认选项；未被 Owner 处理前，对应能力只能留在范围与设计，不进入未授权实现。

## 2. F01-F24 追踪矩阵

| Feature | 证据 ID | Requirement | Acceptance ID | 最小可验收行为 | 必测反例/门禁 |
| --- | --- | --- | --- | --- | --- |
| F01 AI 拍照识餐 | LOG-01、02、05、06 | REQ-F01 | AT-F01 | 用户主动选择照片；本地 policy 对 Provider/载荷为 `ALLOW` 后，才经唯一 AITransport 获得可编辑候选；明确保存前业务库零写入 | `DENY/UNKNOWN/EXPIRED`、host/model/profile 变化、未配置/离线/401/429/超时/取消/恶意响应；阻断时 Authorization/请求体零外发；D-031/D-033/D-053 |
| F02 AI 文字识餐 | LOG-03 | REQ-F02 | AT-F02 | 文本形成结构化候选，host/model/用途与 policy 证据版本可见，手工录入始终可达 | `DENY/UNKNOWN/EXPIRED`、policy/host/model 变化和 Provider 失败不丢本地输入；D-033/D-053 |
| F03 条码扫描 | LOG-04、07 | REQ-F03 | AT-F03 | 飞行模式下扫描/输入 GTIN，只查询已安装签名包；未命中可手工建档 | 不承诺商品名、包装份量或命中率；许可、签名、损坏包、相机拒绝 |
| F04 日热量账本 | DAY-02 | REQ-F04 | AT-F04 | 从本地条目、消耗和有效目标确定性计算 Eaten/Burned/Left | 跨日、目标缺失、负值、删除/修改后重算；AI 不参与公式 |
| F05 宏量目标 | DAY-03、10 | REQ-F05 | AT-F05 | 显示 P/C/F 实际/目标，目标版本和生效日期可追踪 | 目标算法、舍入、0/缺失和历史目标待 Owner |
| F06 餐次 | DAY-04~07 | REQ-F06 | AT-F06 | 早餐、午餐、晚餐、零食能力完整可达；条目按餐次汇总 | 默认/自定义、移动/复制规则待 Owner；空餐次稳定布局 |
| F07 日志详情与添加 | DAY-08、09；LOG-08、09 | REQ-F07 | AT-F07 | 可查看名称、份量、营养快照并进入添加；本地记录具备最小编辑/删除闭环 | 搜索、自建、最近、收藏和高级 CRUD 必须标 Nuttie-required 并单独批准 |
| F08 日期导航 | DAY-01 | REQ-F08 | AT-F08 | Today、历史日期和左右切日可达，时区/DST 下日期归属稳定 | 未来日、补记和跨时区规则待 Owner |
| F09 营养、评分与食物洞察 | FOOD-01~09；AI-05 | REQ-F09 | AT-F09 | 七项营养的原值、单位、来源、缺失/估算状态可见；评分、微量、风险、益处能力保留分期 | 评分公式、阈值、字段全集、本地/AI 生成方式未批前不显示虚构结果；非医疗提示 |
| F10 体重 | BODY-01、02 | REQ-F10 | AT-F10 | 本地记录当前体重并显示趋势；修改/删除后可重算 | kg/lb、精度、同日多笔和异常值策略待 Owner |
| F11 摄入与消耗洞察 | BODY-03~05 | REQ-F11 | AT-F11 | 至少显示近七日摄入和消耗，并能追溯到本地记录 | 空日、缺失消耗、时区、更多周期和导出不能先行承诺 |
| F12 画像/目标 | ACC-08、DAY-10 | REQ-F12 | AT-F12 | 无账号建立本地档案和目标；字段可更正/删除 | EG-01：资料最小集、公式、历史生效和多档案待 Owner |
| F13 消耗/运动/步数 | DAY-02、BODY-05、07、08 | REQ-F13 | AT-F13 | 首版手工运动/消耗在飞行模式可用；来源明确 | 首版无 HealthKit/自动步数占位；D-007 第二阶段另决 |
| F14 饮水 | BODY-06 | REQ-F14 | AT-F14 | 本地记录饮水并可查看当日汇总 | 快捷量、目标、单位、撤销和趋势规则待 Owner |
| F15 提醒 | SYS-01、02 | REQ-F15 | AT-F15 | 用 iOS 本地通知创建/修改/删除提醒；拒绝权限不阻塞记录 | Focus、撤权、时区/DST、系统不保证准时；不得称可靠闹钟 |
| F16 AI 健康/食谱/计划 | AI-01~06 | REQ-F16 | AT-F16 | 可选参考草稿，不自动改目标/日记；实际 Provider、发送数据、用途与 policy 证据版本可见并取得显式许可；只有 `ALLOW` profile 可发送 | Apple 5.1.2(i)/5.1.3、D-033/D-053、未知/过期/用途不相容、保存策略、非医疗和高风险人群；AI-06 不进确定 UI |
| F17 本地档案替代账号 | ACC-01~03 | REQ-F17 | AT-F17 | 不注册、不联网即可完成所有本地能力 | 不出现手机号/邮箱/验证码/会话/服务端依赖 |
| F18 数据权利 | ACC-06、SYS-03~05、DATA-04 | REQ-F18 | AT-F18 | 本机访问、更正、删除；全量删除可中断恢复并可验证清理范围 | DB/WAL/SHM、媒体、staging、日志、通知、App Group、Keychain；外部 Files 备份另行说明 |
| F19 本地缓存/同步替代 | DATA-01~04、08 | REQ-F19 | AT-F19 | SQLCipher + Keychain；手动加密备份导出/恢复，失败保持旧库 | KDF/envelope、替换/合并、恢复点、iCloud Files 风险待 Owner |
| F20 移除会员 IAP | ACC-04、05 | REQ-F20 | AT-F20 | 无会员、付费墙、StoreKit 产品、权益或恢复购买 UI | 依赖、entitlement、网络和字符串静态审计为零 |
| F21 媒体权限 | ACC-07 | REQ-F21 | AT-F21 | 只在任务触发时申请相机/照片最小权限；拒绝后保留手工路径 | 不申请无关照片全库/视频/定位；媒体保留策略待 Owner |
| F22 平台/语言 | SYS-06、07 | REQ-F22 | AT-F22 | Nuttie 以 iOS17+、简体中文验收；竞品 13+/12+ 和日期冲突只作证据说明 | iPad/横屏/多语言不自动进入首发承诺；最长文案不溢出 |
| F23 移除广告/分析 | DATA-05~07 | REQ-F23 | AT-F23 | 无广告、遥测、崩溃上传、归因 SDK、远程配置或 OTA | Release 依赖/二进制/全进程网络捕获；DATA-07 仍为 pending |
| F24 无定位 | DATA-09 | REQ-F24 | AT-F24 | 权限清单、entitlement 和二进制不包含定位访问 | 系统提示、Info.plist 和抓包无定位使用 |

## 3. 非功能需求与验收

| NFR ID | 约束 | 验收证据 | 门禁 |
| --- | --- | --- | --- |
| NFR-LOCAL-01 | 除用户主动 AI 外无业务联网 | Debug/Release 全进程网络捕获；飞行模式跑通 W1/W2 | G4/G6/G7 |
| NFR-NET-01 | AITransport 是唯一业务网络边界 | 依赖图、原生 SDK 审计、3xx/origin/session 测试 | D-036 后 G4/G7 |
| NFR-PRIV-01 | key、健康记录、图片和 AI 内容不进入日志/工作台/备份（除明确业务内容） | 日志扫描、备份解包、取消/崩溃/重启临时目录检查 | G4/G6 |
| NFR-ENC-01 | SQLCipher 密钥由 Keychain 保护 | 真机重装/锁屏/迁移/错误 key 测试；密钥不打包 IPA | G4/G6 |
| NFR-BACKUP-01 | 手动加密备份原子恢复 | 错误口令、截断、篡改、空间不足、kill-point、恢复点测试 | D-027/D-030 后 G4/G6 |
| NFR-DATA-01 | 营养原值、单位、来源、版本和缺失语义可追踪 | 台湾/USDA/用户记录抽样；历史营养快照不被包更新改写 | G4/G5 |
| NFR-LICENSE-01 | 每个数据源独立 provenance/NOTICE；台湾显名成立 | manifest/App 来源页/NOTICE golden test；修改 NOTICE 导致验签失败 | D-052/D-026 后 G4/G7 |
| NFR-AI-01 | AI 输出视为不可信候选；Provider/载荷用途先经本地版本化 profile 准入；确认前业务库零写入 | policy `ALLOW/DENY/UNKNOWN/EXPIRED`、host/model/profile 变化、schema/数值/大小/并发/恶意内容/取消与零外发测试 | D-053/D-034 后 G4/G5 |
| NFR-A11Y-01 | iOS17 Dynamic Type、VoiceOver、对比度、44pt 点击目标、减少动态效果 | 组件/关键旅程无障碍检查和真机证据 | G3/G5/G6 |
| NFR-I18N-01 | 首发简中，日期/数字/单位一致且长文案不溢出 | 320/375/430pt、最大字体、kg/lb、kcal/kJ 边界测试 | G3/G5 |
| NFR-RESILIENCE-01 | 导入、恢复、删除可在中断后幂等对账 | 每个 durable intent 的 kill-point 与重启恢复矩阵 | G4/G6 |
| NFR-RELEASE-01 | Windows 产物不等于 iOS 可发布证据 | 受支持 Mac/Xcode、真实 iPhone、archive/TestFlight、隐私/出口合规检查 | G6/G7 |

精确性能、存储、图片、响应、并发和 KDF 数值在 D-027/D-034 与最低支持 iPhone Spike 前保持 candidate，不能伪造验收阈值。

## 4. 阶段证据归属

| Gate | 需要引用本表的审查者 | 必需输出 |
| --- | --- | --- |
| G2 | 产品、设计、架构、安全、QA | F01-F24 无遗漏；事实/自有方案/候选分离；Owner 阻断清单 |
| G3 | 产品、设计、安全、QA | AT-F01~F24 对应旅程、状态、内容和无障碍覆盖 |
| G4 | 架构、安全、数据许可、QA | NFR-LOCAL/NET/PRIV/ENC/BACKUP/DATA/LICENSE/AI/RESILIENCE 可测试设计 |
| G5 | 实现作者以外的 reviewer、QA | 需求-代码-测试双向链接、自动化结果、探索测试和已知问题 |
| G6 | QA、Release、架构、安全 | Mac/真实 iPhone/飞行模式/权限/迁移/性能/TestFlight 证据 |
| G7 | Owner、Release、QA、安全 | 候选构建、隐私标签、许可证、出口合规、回退和明确发布授权 |

G3 的反向索引位于 [关键用户旅程](../03-design/key-user-journeys.md) 第 16 节和 [状态、内容与无障碍基线](../03-design/states-content-accessibility.md) 第 10 节；G4 的 AT 到计划测试层/fixture 索引位于 [测试策略](../04-engineering/testing/test-strategy.md) 第 2.1 节。这些索引只证明合同覆盖，不代表测试已实现或执行。

## 5. 当前未关闭项

- G2：F01–F24 总范围与 W1–W4 依赖顺序已保留，但[首个 MVP 增量与后续范围边界](mvp-increment-scope-card.md)仍待 Owner 选择并正式冻结；推荐 A 不等于已选择，也不授权正式工程或实现。G3：D-039 餐食首层已由 Owner 选择 A 并冻结 PX-4，不再列为未处理候选；其 PX-5 B03–B07、F09 实现方式、首启资料、餐次默认、提醒/趋势规则等仍未关闭。
- G4：D-026/D-027/D-034/D-036/D-053，以及恢复、媒体、AI 预览、明文导出等候选未处理。
- 数据分发：D-052（原 `DLR-C01`）已正式登记为 `CANDIDATE`，尚未由 Owner 处理；USDA 境外再分发保持阻断。
- Release：Bundle Identifier、Apple Team/Program、包管理器和精确 SDK/RN/Xcode 矩阵未获 Owner 确认。
- 独立追踪 QA 与安全终审均已完成审查；安全协议文档发现已关闭，但两份审查 disposition 仍为 `BLOCKED FOR PASS/BLOCKED`。Owner 候选与实现/真机证据未关闭，因此 G2/G3/G4 都不能标 PASS。
