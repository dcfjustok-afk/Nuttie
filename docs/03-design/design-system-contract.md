# Nuttie 跨端设计系统合同

状态：`P0 / IMPLEMENTATION_AUTHORITY`

本合同把 Nuttie 既有的品牌角色、Living Growth Mark 设计语言和视觉 tokens 固化为 Android、iOS、React Native Web 及移动 H5 的共同实现边界。它不是某个页面的装饰说明；违反本合同的视觉或交互实现即视为未完成，即使功能测试通过。

## 1. 品牌角色

Nuttie 的核心角色是一个陪伴记录成长的栗子与嫩芽标记。角色只解释记录状态和下一步行动，不替用户作健康判断，不遮挡错误，也不把记录转化为排名、惩罚或医疗结论。

| 角色     | 使用场景           | 允许表达             | 禁止表达               |
| -------- | ------------------ | -------------------- | ---------------------- |
| `home`   | 今日总览、空状态   | 看见事实、开始一小步 | 连续打卡压力、健康评分 |
| `meal`   | 餐食记录、候选确认 | 陪伴核对、保留来源   | 替用户确认 AI 结果     |
| `growth` | 趋势、周期回顾     | 解释变化、承认缺失   | 与他人比较、诊断       |
| `streak` | 完成反馈、连续记录 | 庆祝行为本身         | 断签惩罚、羞辱性文案   |

所有角色在四端共享同一语义名；图片、图标和动效可以根据平台能力调整，但不得创建平台专属的另一套角色状态。

## 2. 设计语言

- **Living Growth Mark**：固定几何和确定性状态，`quiet`、`growing`、`complete`、`syncing` 只改变弧线和文字，不改变身份。
- **事实优先**：记录值、单位、来源、缺失、待同步和冲突都要可读；缺失不补零，估算不伪装成确认事实。
- **暖纸与发丝线**：使用 canvas、surface、surface-muted、surface-raised 的色阶建立层次，默认平面化，阴影只用于焦点 sheet 或瞬态层。
- **稀有 Chestnut**：Chestnut 只承载品牌和下一步主要动作；sprout 表示确认，sky 表示观察/同步，amber 表示待处理，danger 表示需要修正。
- **原生尺度**：使用系统字体和 `typeScale`，字距固定为 0；中文长文案允许换行，不通过压缩字号解决溢出。

## 3. 可执行 tokens

`packages/design-tokens/src/index.ts` 是唯一可执行来源，包含：

- `brand`、`growthStates`、`stateColorRoles`：品牌身份和状态语义。
- `colors`、`getSemanticColors`：light/dark 两套语义色，不允许页面直接复制色值。
- `spacing`、`radii`、`typeScale`、`fontFamilies`：统一几何和文字尺度，`letterSpacing` 固定为 0。
- `breakpoints`、`getSizeClass`：`compact`、`regular`、`expanded`、`wide` 四个尺寸级别，禁止按具体设备型号分支。
- `dimensions`、`componentTokens`、`motion`、`layers`：触控目标、控件/卡片/sheet/导航基线、动效和叠层顺序。

组件若需要新增 token，必须先补充这里和本合同，再修改页面。

## 4. 跨端布局合同

| 尺寸级别   |         宽度 | 结构要求                                         |
| ---------- | -----------: | ------------------------------------------------ |
| `compact`  |    `< 600px` | 单列、底部导航、sheet 底部锚定、保留安全区       |
| `regular`  |  `600-767px` | 相关字段可双列，但每列保留可读最小宽度           |
| `expanded` | `768-1023px` | 232px rail、内容留白、成长标记与文案并置         |
| `wide`     |  `>= 1024px` | 内容最大 1200px 居中，可增加审阅密度但不拉伸正文 |

Web 静态导出和首次 hydrate 必须先使用确定性的 `compact`/light 首帧，挂载后才读取真实宽度和主题。Native 可以直接读取平台尺寸，但仍使用同一组 tokens 和尺寸级别。

## 5. 组件状态与验收

每个共享组件必须提供默认、按下/聚焦、禁用、错误、空数据和加载/同步状态。状态不能只用颜色表达，所有图表必须有文字摘要。验收至少覆盖 320px、390px、430px、600px、768px、1024px、1440px、横屏、深色模式、减弱动效、键盘焦点、屏幕阅读器标签和长中文。

设计系统验证器 `tools/verify-design-system.mjs` 会在构建后检查关键 token、状态映射、触控尺寸、断点顺序和无障碍约束。验证器失败时，`pnpm test` 必须失败。
