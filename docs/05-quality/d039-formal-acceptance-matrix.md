# D-039 正式验收矩阵

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D039-FORMAL-ACCEPTANCE-MATRIX-001` |
| 决定 | `D-039 / ACCEPTED / A` |
| 设计基线 | `PX-4_BASELINE_FROZEN` |
| 规格状态 | `SPEC_COMPLETE / IMPLEMENTATION_NOT_AUTHORIZED` |
| 关闭阻断 | `D039-PX5-B01` |
| 后续进展 | B02 路由与可观测性契约已关闭；`D039-PX5-B03` 至 `D039-PX5-B07` 仍开放 |

## 1. 验收口径

本矩阵把 D-039=A 的冻结设计转换为 24 条正式、实现无关的验收用例。矩阵创建时只使用 PX-4 的稳定设计 ID；随后 B02 已在[路由、可观测性与返回契约](../03-design/d039-route-observability-contract.md)中冻结具体 route、`testID` 和失败关闭规则。

状态含义：

- `READY_AFTER_IMPLEMENTATION`：规格完整，正式实现获准后可自动化。
- `DEPENDENCY_BLOCKED`：规格完整，但对应产品/安全决定未关闭，当前产品必须失败关闭。
- `NATIVE_EVIDENCE_REQUIRED`：除组件/E2E 自动化外，还必须在受支持 Mac 与真实 iPhone/模拟器补证。

“规格完整”不等于用例已运行。任何 `DEPENDENCY_BLOCKED` 用例都不能通过测试夹具假装依赖已经获批。

## 2. 正式用例

| AC ID | 前置与动作 | 必须观察到 | 写入/联网断言 | 状态与计划层 |
| --- | --- | --- | --- | --- |
| `D039-AC-001` | 从日记某日期/餐次触发添加 | 进入 `D039-ENTRY`；顺序为标题/上下文、本地搜索、最近、同级扫描与 AI、创建食品 | 业务写入 0；网络 0 | `READY_AFTER_IMPLEMENTATION`；组件 + E2E |
| `D039-AC-002` | 在本地搜索输入可命中已安装包的关键词 | 结果显示名称、来源和可进入检查的动作；排序确定 | 搜索期间写入 0；网络 0 | `READY_AFTER_IMPLEMENTATION`；组件 + E2E |
| `D039-AC-003` | 本地搜索命中用户自建食品 | 来源明确为用户自建，不与数据包来源混同 | 写入 0；网络 0 | `READY_AFTER_IMPLEMENTATION`；组件 + E2E |
| `D039-AC-004` | 本地搜索无结果 | 显示 `ST-EMPTY-05`；保留查询；搜索和创建用户食品可达 | 写入 0；网络 0 | `READY_AFTER_IMPLEMENTATION`；组件 + E2E |
| `D039-AC-005` | 最近列表有条目并选择一项 | 条目来源/历史事实可见，进入统一检查，不直接保存 | 确认前写入 0；网络 0 | `DEPENDENCY_BLOCKED`；D-045 后组件 + E2E |
| `D039-AC-006` | 最近列表为空 | 显示明确空态；不伪造条目、不替换成收藏或联网推荐 | 写入 0；网络 0 | `DEPENDENCY_BLOCKED`；D-045 后组件 + E2E |
| `D039-AC-007` | 从本地搜索或最近进入统一检查，修改有效值并保存 | 显示来源与可编辑值；确认后只创建一次餐食记录并返回原日记上下文 | 确认前 0；成功后恰好 1；网络 0 | `READY_AFTER_IMPLEMENTATION`；应用合同 + E2E |
| `D039-AC-008` | 主动进入创建用户食品，填写有效字段并继续 | 新食品候选进入统一检查；不绕过最终确认 | 最终确认前餐食写入 0；网络 0 | `READY_AFTER_IMPLEMENTATION`；组件 + 应用合同 + E2E |
| `D039-AC-009` | 扫描命中本地 GTIN | 显示可信本地候选及来源，用户选择后进入统一检查 | 确认前写入 0；网络 0 | `NATIVE_EVIDENCE_REQUIRED`；组件 + E2E + 相机真机 |
| `D039-AC-010` | 扫描未命中 `4719999999999` | 显示 `ST-EMPTY-06`；手工输入、搜索和创建食品可达；创建路径携带原 GTIN | 写入 0；网络 0 | `NATIVE_EVIDENCE_REQUIRED`；组件 + E2E + 相机真机 |
| `D039-AC-011` | 首次触发相机且权限未决定 | 先显示当前任务说明；确认说明后才请求窄相机权限 | 请求前写入 0；网络 0；不请求照片全库/视频/定位 | `NATIVE_EVIDENCE_REQUIRED`；权限合同 + 真机 |
| `D039-AC-012` | 相机拒绝、受限或运行时撤权 | 显示手工条码、本地搜索、创建食品、可用的系统媒体选择和系统设置；焦点进入解释/替代动作 | 写入 0；网络 0；不循环请求 | `NATIVE_EVIDENCE_REQUIRED`；组件 + 真机 |
| `D039-AC-013` | 系统媒体选择取消、失败或不可用 | 回到原任务并保留本地搜索、创建食品、相机/文字等仍获准替代动作 | 写入 0；网络 0 | `DEPENDENCY_BLOCKED`；D-031 + 真机 |
| `D039-AC-014` | 进入 AI，Provider 未配置 | 显示 `ST-EMPTY-07` 和配置/本地替代路径，不创建请求 | 候选 0、日记写入 0、网络 0、key 读取 0 | `DEPENDENCY_BLOCKED`；组件 + E2E |
| `D039-AC-015` | Provider profile 为 `DENY/UNKNOWN/EXPIRED` 或 D-053 未授权 | 明示当前不能发送，保留本地输入并提供搜索/创建食品 | Authorization 读取 0、正文组装 0、网络 0、写入 0 | `DEPENDENCY_BLOCKED`；D-053 后安全测试 |
| `D039-AC-016` | 营养标签图片预览后取消发送 | 返回本地可编辑路径，删除临时候选；不把取消当同意 | AI 候选 0、日记写入 0、网络 0 | `DEPENDENCY_BLOCKED`；D-031/033/034/036/053 |
| `D039-AC-017` | 已获准 AI 请求发生超时、401/403、429、取消、超限或解析失败 | 保留本地输入，显示可恢复失败和本地出口；不自动切换 host | 日记写入 0；只允许已确认 origin 的一次受控请求尝试 | `DEPENDENCY_BLOCKED`；D-033/034/036/053 |
| `D039-AC-018` | 合法 AI 响应形成候选，用户编辑并确认 | 候选明确标为 AI 估算/可修改；来源证据可见；只保存用户确认值 | 确认前 0；成功后恰好 1；无自动目标写入 | `DEPENDENCY_BLOCKED`；AI 决定链后应用合同 + E2E |
| `D039-AC-019` | 用户明确放弃 AI 候选 | 清除候选与临时输入并公布结果，返回可操作本地路径 | AI 候选 0、日记写入 0；不发第二次请求 | `DEPENDENCY_BLOCKED`；D-031/033 后组件 + E2E |
| `D039-AC-020` | AI 文字输入为空或仅空白并提交 | 原文保留；字段关联错误；焦点到首个错误；不进入发送态 | 请求 0、候选 0、写入 0 | `DEPENDENCY_BLOCKED`；组件 + E2E |
| `D039-AC-021` | 创建/统一检查字段无效或保存返回 `NOT_COMMITTED` | 草稿、日期、餐次和已输入值保留；聚焦首个错误或提供同命令重试 | 业务库保持原值；不乐观增加汇总 | `READY_AFTER_IMPLEMENTATION`；组件 + 应用合同 + E2E |
| `D039-AC-022` | 保存结果为 `UNKNOWN` | 禁止换命令/重新编辑；只允许原命令对账或重试；成功回读后恰好一次 | 不产生第二条记录；网络 0 | `READY_AFTER_IMPLEMENTATION`；应用合同 + E2E |
| `D039-AC-023` | 从搜索、最近、扫描、AI、创建食品返回或按 Escape | 按 `D039ReturnDescriptorV1` 恢复原触发 `testID`；触发控件消失时回 route 标题；根返回到原日记上下文 | 返回不保存、不发送、不记偏好 | `READY_AFTER_IMPLEMENTATION`；组件 + E2E；B02 标识已冻结 |
| `D039-AC-024` | 320/375/430 pt、最大 Dynamic Type、VoiceOver、Reduce Motion 下遍历全页 | 无根级横向溢出；入口不裁切；逻辑顺序符合 PX-4；目标 ≥44pt；错误/状态非仅颜色；初始焦点为标题 | 非主动 AI 场景全进程业务网络 0 | `NATIVE_EVIDENCE_REQUIRED`；组件 + 截图 + 真机 |

## 3. 覆盖反查

| 冻结范围 | AC |
| --- | --- |
| 首层层级与本地优先 | 001–006 |
| 统一检查、创建与事务结果 | 007–008、021–022 |
| 条码、相机与媒体降级 | 009–013 |
| AI 未配置、准入、失败、确认与放弃 | 014–020 |
| 返回、焦点、布局与无障碍 | 023–024 |

冻结原型的 19 个浏览器流程全部被上述 24 条规格覆盖；方案 B 的“记住上次方式”和方案 C 的“六入口平铺”仅是历史对比，不进入正式验收。

## 4. 写入与网络不变量

1. 搜索、浏览最近、扫描、AI 候选、创建食品候选和编辑检查都不是保存同意；最终确认前餐食写入为 0。
2. `NOT_COMMITTED` 保持原库；`UNKNOWN` 禁止制造第二命令；成功只允许恰好一次写入。
3. 除用户主动、逐次确认且通过完整 policy 的 AI 请求外，所有用例业务网络为 0。
4. D-053 未授权时，Authorization 读取、敏感正文组装和 transport 创建都必须为 0，不能只断在 socket 层。
5. 缺失营养和数值 `0` 始终不同；来源、单位与估算状态随保存快照保留。

## 5. 当前边界

```text
D039-PX5-B01: CLOSED
formalAcceptanceMatrixComplete: true
acceptanceCaseCount: 24
D039-PX5-B02: CLOSED
stableRouteAndTestIdsMapped: true
returnDeepLinkContractComplete: true
remainingOpenBlockerCount: 5
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
px5ImplementationDorSatisfied: false
```
