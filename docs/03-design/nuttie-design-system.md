# Nuttie 设计系统 v0.3

状态：`CONCEPT / IMPLEMENTATION_READY_AFTER_OWNER_GATE`

这份设计系统是 Nuttie 原型和未来 React Native 实现之间的共同契约。它描述已经实现并可审计的视觉规则，不代表 Owner 已经批准 D-038 导航入口、正式业务页面或 G3 已通过。文档版本为 `v0.3`；当前 `design-tokens.json` 的令牌版本仍为 `0.2.0`。

## 候选原型边界

| 页面 | 作用 | 状态 |
| --- | --- | --- |
| `index.html` | 三张核心画面与品牌总览 | `CANDIDATE / CONCEPT` |
| `components.html` | 组件、输入、选择和反馈目录 | `CANDIDATE / CONCEPT` |
| `feature-flows.html` | 五个本地优先功能画面 | `CANDIDATE / NON_PRODUCTION` |
| `patterns.html` | 九种候选系统状态模式 | `CANDIDATE / NON_PRODUCTION` |

这些页面都是本地静态候选，不写数据库、不调用系统权限、不创建 AI 请求、不读取真实凭据，也不请求远程资源。示例标签和数值不冻结默认餐次、营养目标、计算公式、健康评分、健康建议、撤销窗口、统计范围或里程碑规则。备份口令最低长度仍待安全配置批准；页面中的本地数据、备份数量、食品版本、AI host 和 model 均为布局示例，不是生产数据或已准入 Provider。

## 品牌语言

Nuttie 的视觉关键词是：可靠、温暖、轻量、可持续。卡通栗子负责表达状态和陪伴，不替代数值、错误提示或健康结论。每个关键状态都必须同时提供文字和结构化数据。

品牌文案：

- 中文：积“栗”前行，“立”见更好的自己。
- 英文：Small steps, solid growth.

## 令牌

| 类别 | 令牌 | 值 | 使用边界 |
| --- | --- | --- | --- |
| 品牌主色 | `color.chestnut` | `#A85D3F` | 品牌标记、主要强调，不用于大面积警告 |
| 成长成功 | `color.sprout` | `#3F7C59` | 完成态、正向反馈、主要确认按钮 |
| 提醒重点 | `color.amber` | `#E2A34A` | 待确认、提醒、里程碑 |
| 洞察辅助 | `color.sky` | `#4E88A5` | AI 预览、趋势说明、辅助焦点环 |
| 页面底色 | `color.paper` | `#F4F0E8` | 页面背景 |
| 内容表面 | `color.surface` | `#FFFDF8` | 面板、输入区、按钮 |
| 正文 | `color.ink` | `#252A26` | 正文和图形描边 |

圆角采用 `10 / 16 / 24px` 三级尺度；触控目标最小为 `44px`。层级使用小阴影和大阴影两级，不使用渐变光球、模糊背景或装饰性浮层。

## 组件状态

- 按钮必须具备默认、悬停、按压、键盘焦点和禁用状态。
- 快速操作完成后保留原图标和文字，增加绿色选中态、勾选标记、`aria-pressed=true` 和“已记录”辅助反馈。
- 进度条必须暴露最小值、最大值和当前值；图表必须提供可读文本摘要。
- 栗子角色只做状态反馈：`home` 总览、`meal` 餐食、`growth` 趋势、`streak` 连续行动。
- 文本、数字、URL、搜索和密码输入使用对应的原生 `input`；输入错误同时使用 `aria-invalid` 和 `aria-describedby` 关联可读提示。
- 分段控件和 chips 使用原生 `button type="button"` 与 `aria-pressed`，只在候选页面内更新演示状态。
- 按钮、分段控件、chips 和导航入口保持至少 `44px` 触控目标，并提供可见的 `focus-visible` 状态。
- 颜色不单独传递信息；选中、错误、警告和成功状态必须同时提供文字或语义属性。
- 组件目录中的进度示例只代表“食品数据包导入”，不代表未批准的营养目标进度。

## 资产使用

- `mascot-sheet.svg` 是四个角色变体的单一来源。
- `spot-illustrations.svg` 是九个辅助插画的单一来源。
- 插画可以增强识别和情绪，但不能隐藏操作名称、营养数字、错误信息或权限状态。
- HTML 原型和未来 RN 包都必须保持本地资源引用；业务页面不得默认请求远程图片。

## 功能画面

`feature-flows.html` 固定五个候选画面范围：本地食品搜索、食品详情与七项营养、本地数据设置、手动加密备份、个人 AI BYOK 配置。

- 缺失营养显示“未提供”，不得伪装为 `0`；食品同时展示来源与版本，营养详情使用 `dl`、`dt`、`dd` 语义。
- 搜索、URL 和密码使用原生输入；结果、筛选和设置动作使用原生按钮。
- Base URL 只接受 HTTPS。API key 只存 Keychain；加密备份不包含 API key 或数据库密钥。
- 窄屏内 `.screen` 必须纵向滚动；食品来源 chips 可以横向滚动，内容不得被手机外壳裁切。
- 以上只验证布局、内容和静态交互合同，不代表 SQLite、SQLCipher、Keychain、Files 或真实 AI transport 已实现。

## 系统状态模式

`patterns.html` 固定九种候选系统状态身份：`empty`、`loading`、`offline`、`recovery`、`consent`、`destructive`、`feedback`、`permission`、`celebration`。每个模式必须给出当前状态、影响范围和可执行的下一步。

- `offline` 只表示 AI 识别任务离线；本机记录始终可用，恢复联网后也不会自动发送。
- AI 发送检查使用 `role="dialog"`，删除检查使用 `role="alertdialog"`；标题和描述通过同一模式内的 `aria-labelledby`、`aria-describedby` 关联，且 ID 唯一。
- D-053 Provider policy 未准入时显示 `UNKNOWN / BLOCKED`，发送和测试连接保持禁用，不读取 key，也不创建请求。
- 删除检查的安全默认焦点指向“取消”，不得指向危险按钮。
- 静态目录中的 sheet 不声明 `aria-modal="true"`。它只验证结构，尚未实现焦点圈闭、Escape 关闭和关闭后的焦点恢复。
- `.screen`、`.scrim` 和 `.sheet` 保持内部纵向滚动，sheet 同时限制最大高度。
- 操作反馈不得擅自提供未批准的“撤销”；权限拒绝优先提供手工替代路径。

## 验证

视觉合同由 `tools/visual-kit-check.mjs` 执行，覆盖三张核心画面、一个组件目录、五个功能画面、九种系统状态模式、四个栗子角色、九个辅助插画、设计令牌、本地资源、loopback 服务和路径穿越防护。检查还覆盖原生控件、ARIA 关联、候选内容边界、AI fail-closed、内部滚动和选定触控目标。

当前 Node 基线为 `15` 项测试；浏览器基线覆盖 `1440x900`、`430x844`、`390x844`、`320x844` 四个视口。源码检查和浏览器候选验证都不能替代未来 React Native 的动态字体、VoiceOver、真实 modal 焦点管理或真机像素验收。

