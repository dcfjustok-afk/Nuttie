# 24 类公开能力地图

状态：`BASELINED_FOR_G2_REVIEW`  
本地图只聚合 [66 项细粒度证据矩阵](./competitor-evidence-matrix.md)，不新增竞品事实。工程分类由 G2 与 G4 交叉评审后冻结。

| ID | 能力 | 证据主键 | 最高置信度 | 竞品公开边界 | Nuttie 工程分类 | Nuttie 去向 |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | AI 拍照识餐 | LOG-01、LOG-02、LOG-05、LOG-06 | confirmed | 有拍照识别、多食材拆分和营养结果；准确率/纠错/额度未知 | AI_ONLY_NETWORK | BYOK AITransport；候选确认后入库 |
| F02 | AI 文字识餐 | LOG-03 | confirmed | 有文字描述识餐；详细交互与额度未知 | AI_ONLY_NETWORK | BYOK AITransport；手工路径常驻 |
| F03 | 条码扫描 | LOG-04、LOG-07 | confirmed | 正文确认扫码、营养数据库、卡路里和营养详情；当前四图未展示条码结果页，字段/覆盖/联网未知 | LOCAL_REPLACEMENT + EVIDENCE_GAP | 本地 GTIN -> 离线包 -> 用户建档；不承诺命中率 |
| F04 | 日热量账本 | DAY-02 | confirmed | Eaten/Burned/Left 可见；公式未知 | PURE_LOCAL | 本地确定性计算 |
| F05 | 宏量目标 | DAY-03、DAY-10 | confirmed | P/C/F 实际/目标可见；算法未知 | PURE_LOCAL + EVIDENCE_GAP | 本地目标版本；公式另批 |
| F06 | 餐次 | DAY-04、DAY-05、DAY-06、DAY-07 | confirmed | 早餐/午餐/晚餐/零食、餐次目标和记录入口可见 | PURE_LOCAL + EVIDENCE_GAP | 本地餐次；默认/自定义规则另批 |
| F07 | 食物日志详情与添加 | DAY-08、DAY-09、LOG-08、LOG-09 | confirmed | 名称、份数、热量及添加入口可见；纠错、搜索、自建、收藏和完整 CRUD 未证 | PURE_LOCAL + NUTTIE_REQUIRED | 基础对标；本地闭环候选需单独验收 |
| F08 | 日期导航 | DAY-01 | confirmed | 周历、Today、切日可见；补记边界未知 | PURE_LOCAL + EVIDENCE_GAP | 本地日期导航；规则另批 |
| F09 | 营养、评分与食物洞察 | FOOD-01 至 FOOD-09、AI-05 | confirmed | kcal、P/C/F、份量、健康评分、微量标签、风险、益处、营养成分和个性化洞察公开可见/可读；算法、阈值和生成方式未知 | PURE_LOCAL + AI_ONLY_NETWORK + EVIDENCE_GAP | 七项营养纯本地；评分/风险/益处能力保留分期，透明本地规则或 AI 方案须 Owner 决定 |
| F10 | 体重 | BODY-01、BODY-02 | confirmed | 当前体重、记录入口和趋势可见 | PURE_LOCAL | 首版手工本地记录 |
| F11 | 摄入与消耗洞察 | BODY-03、BODY-04、BODY-05 | confirmed | Insights、近 7 日摄入和消耗图可见；更多范围未知 | PURE_LOCAL | 首版至少覆盖已证范围 |
| F12 | 画像/目标 | ACC-08、DAY-10 | confirmed | 声称按饮食需求定制；问卷/算法未知 | PURE_LOCAL + EVIDENCE_GAP | 本地档案；算法另批 |
| F13 | 消耗/运动/步数 | DAY-02、BODY-05、BODY-07、BODY-08 | confirmed | Burned 和近 7 日消耗可见；运动/步数来自政策 | LOCAL_REPLACEMENT + IOS_OR_DISTRIBUTION_LIMIT | 首版手工；HealthKit 二阶段决定 |
| F14 | 饮水 | BODY-06 | cross-source | 政策明确记录类型；iOS UI 未取证 | PURE_LOCAL + EVIDENCE_GAP | 本地记录；目标/UI 另批 |
| F15 | 提醒 | SYS-01、SYS-02 | cross-source | 政策明确记录提醒；规则未知 | LOCAL_REPLACEMENT + IOS_OR_DISTRIBUTION_LIMIT | 本地通知；不承诺可靠闹钟 |
| F16 | AI 健康/食谱/饮食计划 | AI-01 至 AI-06 | cross-source | 协议明确前五项；知识内容模块 pending | AI_ONLY_NETWORK | 可选参考草稿；非医疗；Apple 第三方 AI 同意边界待决 |
| F17 | 可选账号 | ACC-01 至 ACC-03 | cross-source | 游客与注册并存；具体边界冲突/未知 | LOCAL_REPLACEMENT | 本地档案替代账号，不复制服务端 UI |
| F18 | 账号设置与数据权利 | ACC-06、SYS-03 至 SYS-05、DATA-04 | cross-source | 注销/访问/更正/删除和公开法律说明存在 | LOCAL_REPLACEMENT | 本机数据权利和删除验收 |
| F19 | 本地缓存/同步边界 | DATA-01 至 DATA-04、DATA-08 | cross-source | 有缓存/离线数据与同步迹象；备份未知 | LOCAL_REPLACEMENT | SQLCipher 与手动加密 Files 备份 |
| F20 | 会员 IAP | ACC-04、ACC-05 | cross-source | 免费下载且 IAP/订阅存在；门槛/价格未知 | LOCAL_REPLACEMENT + IOS_OR_DISTRIBUTION_LIMIT | 首版移除会员与 IAP |
| F21 | 媒体权限 | ACC-07 | cross-source | 相机/相册用途明确；具体页面和视频入口未知 | IOS_OR_DISTRIBUTION_LIMIT | 任务触发时最小授权；手工降级 |
| F22 | 平台/国际化 | SYS-06、SYS-07 | confirmed | 竞品 iOS13+、iPhone/iPad、多语言；当前网页与 Lookup 的年龄/日期展示口径有差异 | IOS_OR_DISTRIBUTION_LIMIT | D-011/D-016：iOS17+、首发简中 |
| F23 | 广告/分析 | DATA-05 至 DATA-07 | cross-source | DATA-05/06 的 SDK 披露为 `cross-source`；DATA-07 仅能证明广告相关处理披露和通用条款，实际广告展示、广告位与频率保持 `pending` | EVIDENCE_GAP | 明确移除，不进入目标实现 |
| F24 | 无定位边界 | DATA-09 | cross-source | 政策称当前版本无定位 | IOS_OR_DISTRIBUTION_LIMIT | 不申请定位；作为隐私边界而非卖点 |

## 完整范围规则

- 表中的“最高置信度”只表示该能力所含证据的最高等级，不表示全部证据同级。F13 的聚合最高等级为 `confirmed`，但其构成必须拆读为 DAY-02/BODY-05 的消耗事实 `confirmed`，以及 BODY-07/BODY-08 的运动/步数 `cross-source`；产品分层不得用后者降级前者。
- D-017 要求 F01-F24 均有明确去向，不代表每一类都必须复制竞品的服务端、会员或未知算法。
- “移除”和“本地重构”也是完整范围处置：F20、F23 明确移除；F17-F19 用本地能力满足用户目标。
- F09 的健康评分、微量标签、风险和益处是 S06 直接证实的公开能力，不能因算法未知而删除；未知的是实现规则和生成来源。
- F03 的扫码和结果类别由 App Store 正文直接证实，但当前四图没有条码结果页，不能把商品名、包装份量或页面布局升级为截图事实。
- `EVIDENCE_GAP` 不会因进入某个阶段自动升级为竞品事实；Nuttie-required 也必须明确标注为自身闭环设计。
- F01、F02、F16，以及 F09 中经 Owner 决定采用 AI 的解释能力，是唯一允许业务联网的范围；其他能力在飞行模式下保持核心可用。
