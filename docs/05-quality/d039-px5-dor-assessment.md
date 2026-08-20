# D-039 PX-5 实现就绪评估

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D039-PX5-DOR-ASSESSMENT-001` |
| 决定 | `D-039 / ACCEPTED / A` |
| 评估日期 | 2026-08-15（Asia/Shanghai） |
| 当前设计状态 | `PX-4_BASELINE_FROZEN` |
| PX-5 结论 | `NOT_READY / B01_B02_CLOSED / 5_BLOCKERS_REMAIN` |
| 实现授权 | `false`；正式根工程、原生 iOS 和 D-039 正式增量均未授权 |

## 1. 结论

D-039 方案 A 的产品层级已经冻结，但尚未达到实现 Definition of Ready。首次评估时七项 PX-5 要求为 1 项通过、3 项部分满足、3 项失败并有 7 个阻断项；随后正式验收矩阵和路由/可观测性契约完成，`D039-PX5-B01`、`D039-PX5-B02` 已关闭，当前还剩 5 个阻断项。原始 1/3/3 评估统计保留为当时事实，不因后续关闭动作被改写。

该结论不回退 Owner 已接受的 D-039=A，也不回退 PX-4。它只说明“接受后的设计”还不能被解释为“可以初始化正式工程或实现页面”。

## 2. PX-5 要求逐项检查

| 要求 | 结论 | 已有证据 | 缺口 |
| --- | --- | --- | --- |
| 接受后的设计规格和稳定页面/状态 ID | `PASS` | `D039-ENTRY`、本地搜索、最近、扫描、AI、创建食品、统一检查保存，以及 ST-EMPTY-05/06/07 已冻结 | 无 |
| 验收标准、异常/空态、Dynamic Type 与 VoiceOver 顺序 | `PARTIAL` | PX-4 规格与冻结 HTML 原型覆盖 19/19 流程、四视口、焦点和拒绝恢复 | 仍缺面向正式实现的逐状态验收矩阵、真实组件语义和真机证据 |
| D-018 等独立技术决定按自身门禁处理 | `PARTIAL` | D-018/019/020/021/023/024/025/037/038 已接受 | D-032 仍是 `CANDIDATE + SPIKE_AUTHORIZED`，最终矩阵与正式根工程未冻结 |
| 测试可观测性与返回/deep-link 合同 | `PARTIAL` | 设计 ID 和抽象返回焦点规则已存在 | 尚无正式 route、参数 schema、稳定 `testID`/accessibility 标识及非法 deep-link 失败关闭矩阵 |
| 无未处置安全、隐私或数据完整性阻断 | `FAIL` | 相机按需、AI fail-closed、零写入和本地降级原则已固定 | D-045 最近使用、D-031 媒体保留、D-033/034/036/053 AI 确认/预算/transport/Provider 准入均未关闭 |
| 正式根工程与对应实现增量获得明确授权 | `FAIL` | 仅隔离 SDK 57 Windows JavaScript Spike 获准 | `formalRootProjectAuthorized=false`、`formalImplementationAuthorized=false`，D-032 仍需第二次 Owner 动作 |
| 原生环境中的相机、系统媒体、VoiceOver、Dynamic Type 和持久化验证 | `FAIL` | Windows Android/iOS 平台 JavaScript export 结构通过 | 当前无可用 Mac；没有 Xcode/CocoaPods、Prebuild、原生编译、模拟器/真机、SQLCipher/Keychain 或相机证据 |

统计口径固定为：`PASS=1 / PARTIAL=3 / FAIL=3`。`PARTIAL` 不计为通过。

## 3. 阻断项

| 阻断 ID | 类别 | 关闭条件 | 当前责任边界 |
| --- | --- | --- | --- |
| `D039-PX5-B01` | `CLOSED` | 已建立覆盖所有入口、空态、拒绝、失败、返回与零写入的 [24 条正式验收矩阵](d039-formal-acceptance-matrix.md) | 规格完成；自动化与真机证据仍按各 AC 的计划层补充 |
| `D039-PX5-B02` | `CLOSED` | 已冻结 [5 个 route、严格参数、43 个静态 testID、2 个动态模式、返回焦点和 6 类非法 deep-link 恢复](../03-design/d039-route-observability-contract.md) | 规格完成；正式 Router、组件、E2E 与真机证据仍待授权后补充 |
| `D039-PX5-B03` | `OPEN / CARD_INDEPENDENT_REVIEW_REQUIRED` | D-045 内部卡已固定[三套完整政策包、最近/收藏关系、保留、清除和删除语义](../03-design/d045-recent-favorites-card-spec.md) | 四域自审已通过并纳入[六卡统一独立复核包](../03-design/d039-b03-b05-independent-review-packet.md)；输入清单未冻结，独立复核、Owner 展示与选择均未发生 |
| `D039-PX5-B04` | `OPEN / CARD_INDEPENDENT_REVIEW_REQUIRED` | [D-031 内部卡](../03-design/d031-media-ai-retention-card-spec.md) 已固定三套媒体/AI 保留包、临时清理、备份和删除语义 | 四域自审已通过并纳入六卡统一复核包；输入清单未冻结，独立复核、Owner 展示与选择均未发生；不得从相机权限反推保留许可 |
| `D039-PX5-B05` | `OPEN / ALL_FOUR_CARDS_INDEPENDENT_REVIEW_REQUIRED / OTHER_INPUTS_REQUIRED` | D-033/D-034/D-036/D-053 分别关闭发送确认、资源预算、transport profile 和 Provider 数据用途准入 | 四张内部卡均已完成四域自审并纳入六卡统一复核包；输入清单未冻结。D-034 仍需最低支持 iPhone benchmark，D-036 仍需三 Provider 兼容 Spike 与原生边界证据，[D-053](../03-design/d053-ai-provider-use-admission-card-spec.md)仍需 OI-07、逐 Provider 十维证据与 App Privacy 映射，四者均需独立复核与 Owner 选择；任一未知时 AI 入口只能失败关闭，不得发送 |
| `D039-PX5-B06` | 需 Owner 第二次动作 | D-032 原生证据返回后冻结最终矩阵，并单独授权正式根工程与 D-039 增量 | Windows JS export 不能替代原生证据或第二次动作 |
| `D039-PX5-B07` | 需环境 | 获得可用 Mac/Xcode 与目标 iPhone 链路，完成相机、系统媒体、VoiceOver、Dynamic Type、SQLCipher/Keychain 和持久化集成验证 | 当前 OI-03 明确只有 iPhone 16 Pro Max / iOS 26.5、无可用 Mac |

OI-02 的 Bundle ID 仍未创建。它不阻断本地规格工作，但首次正式 Prebuild、签名或真机配置前必须明确，不能生成占位标识冒充 Owner 输入。

## 4. 可分段实现，但当前没有任何分段获准

| 未来增量 | 范围 | 至少依赖 |
| --- | --- | --- |
| `D039-I1-LOCAL` | 添加餐食壳、本地搜索、最近、创建食品、统一检查保存 | B03、B06；正式数据 adapter 和 B01/B02 自动化仍须自身验收 |
| `D039-I2-SCAN` | 条码扫描、权限拒绝/受限、手工条码与系统媒体降级 | B04、B06、B07；B01/B02 自动化仍须补证 |
| `D039-I3-AI` | AI 图片/相册/文字分支与逐次发送 | B04、B05、B06、B07；B01/B02 自动化仍须补证 |

分段用于缩小未来增量，不改变首层层级，也不允许在 B06 未关闭时创建正式页面。AI 分段未就绪不代表可以隐藏本地失败关闭规则；正式产品若显示入口，必须准确表达当前不可用原因并保留本地出口。

## 5. 推荐关闭顺序

1. B01 已关闭：PX-4 设计规则已转换为 24 条逐状态、可自动化的验收矩阵。
2. B02 已关闭：正式 route/参数/testID/返回契约已形成，未创建 RN 页面。
3. D-045、D-031 与 B05 的 D-033/D-034/D-036/D-053 内部卡均已完成四域自审，当前必须先通过独立复核才可展示；D-034 另需最低支持 iPhone benchmark，D-036 另需 OI-07、三 Provider 兼容 Spike和原生边界证据，D-053 另需 OI-07、逐 Provider 十维证据与 App Privacy 映射。
4. 在具备 Mac/Xcode 后补 D-032 原生 Spike，回传证据并请求 Owner 第二次冻结。
5. 只有 B01 至 B07 全部关闭且出现新的权威 PX-5 通过事件，才可请求对应正式实现授权。

## 6. 权威边界

```text
D-039 decisionState: ACCEPTED
selectedOption: A
designBaselineState: PX-4_BASELINE_FROZEN
px5Disposition: NOT_READY
closedBlockerIds: [D039-PX5-B01, D039-PX5-B02]
openBlockerCount: 5
next: D039-PX5-OWNER_DEPENDENCIES_REQUIRED
d032SecondOwnerActionSatisfied: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
ownerIntakeChanged: false
decisionStateChanged: false
```

## 7. 依据

- [D-039 PX-4 设计基线](../03-design/d039-px4-design-baseline.md)
- [原型与 Owner 评审流程](../03-design/prototype-and-owner-review-workflow.md)
- [D-039 原型 Manifest](../03-design/d039-prototype-manifest.md)
- [React Native / Expo 独立复核](rn-stack-independent-review.md)
- [技术栈研究](../04-engineering/technology-stack-research.md)
- [媒体权限编排合同](../04-engineering/testing/media-permission-orchestrator-harness.md)
- [本地食品目录合同](../04-engineering/testing/local-food-catalog-harness.md)
- [当前交接](../00-governance/current-handoff.md)
