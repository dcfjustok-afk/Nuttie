# D-039 PX-5 实现就绪评估

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D039-PX5-DOR-ASSESSMENT-001` |
| 决定 | `D-039 / ACCEPTED / A` |
| 评估日期 | 2026-08-15（Asia/Shanghai） |
| 当前设计状态 | `PX-4_BASELINE_FROZEN` |
| PX-5 结论 | `NOT_READY / BLOCKER_CLOSURE_REQUIRED` |
| 实现授权 | `false`；正式根工程、原生 iOS 和 D-039 正式增量均未授权 |

## 1. 结论

D-039 方案 A 的产品层级已经冻结，但尚未达到实现 Definition of Ready。七项 PX-5 要求中，1 项通过、3 项部分满足、3 项失败；当前共有 7 个未关闭阻断项。

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
| `D039-PX5-B01` | 本地可先关闭 | 建立覆盖所有入口、空态、拒绝、失败、返回与零写入的正式验收矩阵 | PM / Product / QA 可在不写正式代码时完成 |
| `D039-PX5-B02` | 本地可先关闭 | 固定 route/参数 schema、测试可观测性 ID、返回焦点和非法 deep-link 行为 | PM / Architecture / QA 可先形成规格；实现验证后续补证 |
| `D039-PX5-B03` | 需 Owner 决定 | D-045 明确最近使用是否首版、与收藏的关系、保留与清除语义 | 先形成中立选择卡，再经 Owner 明确选择 |
| `D039-PX5-B04` | 需 Owner 决定 | D-031 明确照片/媒体及 AI 内容是否、何时、以何种形式保留 | 不得从相机权限反推保留许可 |
| `D039-PX5-B05` | 需 Owner 决定与证据 | D-033/D-034/D-036/D-053 分别关闭发送确认、资源预算、transport profile 和 Provider 数据用途准入 | 任一未知时 AI 入口只能失败关闭，不得发送 |
| `D039-PX5-B06` | 需 Owner 第二次动作 | D-032 原生证据返回后冻结最终矩阵，并单独授权正式根工程与 D-039 增量 | Windows JS export 不能替代原生证据或第二次动作 |
| `D039-PX5-B07` | 需环境 | 获得可用 Mac/Xcode 与目标 iPhone 链路，完成相机、系统媒体、VoiceOver、Dynamic Type、SQLCipher/Keychain 和持久化集成验证 | 当前 OI-03 明确只有 iPhone 16 Pro Max / iOS 26.5、无可用 Mac |

OI-02 的 Bundle ID 仍未创建。它不阻断本地规格工作，但首次正式 Prebuild、签名或真机配置前必须明确，不能生成占位标识冒充 Owner 输入。

## 4. 可分段实现，但当前没有任何分段获准

| 未来增量 | 范围 | 至少依赖 |
| --- | --- | --- |
| `D039-I1-LOCAL` | 添加餐食壳、本地搜索、最近、创建食品、统一检查保存 | B01、B02、B03、B06；正式数据 adapter 仍须自身验收 |
| `D039-I2-SCAN` | 条码扫描、权限拒绝/受限、手工条码与系统媒体降级 | B01、B02、B04、B06、B07 |
| `D039-I3-AI` | AI 图片/相册/文字分支与逐次发送 | B01、B02、B04、B05、B06、B07 |

分段用于缩小未来增量，不改变首层层级，也不允许在 B06 未关闭时创建正式页面。AI 分段未就绪不代表可以隐藏本地失败关闭规则；正式产品若显示入口，必须准确表达当前不可用原因并保留本地出口。

## 5. 推荐关闭顺序

1. 先关闭 B01：把 PX-4 设计规则转换为逐状态、可自动化的验收矩阵。
2. 再关闭 B02：形成正式 route/参数/testID/返回契约，但仍不创建 RN 页面。
3. 为 D-045、D-031 和 AI 决定链分别准备小批中立选择卡；未通过独立复核前不展示给 Owner。
4. 在具备 Mac/Xcode 后补 D-032 原生 Spike，回传证据并请求 Owner 第二次冻结。
5. 只有 B01 至 B07 全部关闭且出现新的权威 PX-5 通过事件，才可请求对应正式实现授权。

## 6. 权威边界

```text
D-039 decisionState: ACCEPTED
selectedOption: A
designBaselineState: PX-4_BASELINE_FROZEN
px5Disposition: NOT_READY
openBlockerCount: 7
next: PX-5_BLOCKER_CLOSURE_REQUIRED
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
