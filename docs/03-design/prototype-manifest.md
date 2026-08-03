# Nuttie D-038 原型 Manifest

| 字段 | 内容 |
| --- | --- |
| Artifact ID | `PROTO-D038-001` |
| 题目 | D-038 产品导航外壳 A/B/C 低保真对比 |
| 状态 | `CANDIDATE / OWNER_DECISION_PENDING` |
| 生成日期 | 2026-07-31（Asia/Shanghai） |
| 负责人 | Product Designer / DesignOps Lead |
| 保真度 | 可交互低保真；不锁定品牌视觉或组件库 |
| 权威同源 | `D:\github\Nuttie\prototypes\d038-navigation-shell\index.html` |
| 本机预览 | `D:\study\Nuttie-Prototype-Lab\index.html` |
| 文件大小 | `60018` bytes（两份相同） |
| SHA-256 | `12A46808982332BD5C1DC827B578950F2FCDA1561CD41BB9326CE819580FDB45` |
| 可选本地预览脚本 | 两目录的 `server.mjs`；SHA-256 `282E22EC0F9AE406C9FCDD30E64F290F6F80B709EB76C5474F874F9CB94D1F2C` |
| 外部依赖 | 无 |
| 网络能力 | 无；CSP `connect-src 'none'` |
| 构建步骤 | 无；直接打开 `index.html`，或用随附 Node 脚本仅在 localhost 预览 |

## 1. 决策边界

本原型只比较 D-038 的三种产品导航外壳，不替 Owner 选择：

| 方案 | 稳定目的地 | 新增入口 | 食品资料入口 | 状态 |
| --- | --- | --- | --- | --- |
| A | 日记、趋势、食品资料、设置 | 随日记、趋势、食品、设置情境出现 | 稳定底部目的地 | `CANDIDATE` |
| B | 日记、趋势、设置 | 单一集中新增入口 | 集中新增与设置 | `CANDIDATE` |
| C | 单一日记中心 | 日记底部动作及更多菜单中的任务 | 更多菜单 | `CANDIDATE` |

页面初始显示 A 仅因为字母顺序；外部状态持续显示 `CANDIDATE` 和“当前仅预览，未作决定”。页面不记录选择，也不更新决策台账。

D-038 不决定：

- Expo Router 或 React Navigation；
- React Native、Expo、Node、Xcode 或任何依赖版本；
- 品牌配色、字体、App 图标、正式图标集或高保真组件；
- UXD-02/D-039 的最终添加餐食首层方式；
- HealthKit、Widget、Live Activity、iPad 或横屏范围；
- AI Provider、真实联网、Apple 签名或分发。

## 2. 固定内容与交互

三种方案共用同一内容模型和种子数据：

- 日记：日期、能量、三大营养、餐食、饮水、运动和体重；
- 趋势：摄入、体重、饮水三个 7 天指标，可键盘切换并逐日选择；
- 食品资料：本地搜索、来源筛选、数据包食品和用户食品；
- 设置：本地档案与目标、提醒、AI 配置、数据管理、隐私边界；
- 新增：餐食、饮水、运动、体重、用户食品和提醒的本地候选表单；
- AI：只展示“尚未配置”和手工降级，不发起请求；
- 系统能力：相机、Files、通知、Keychain 和数据库只做低保真状态模拟。

可执行交互清单：

1. A/B/C segmented control 可点击，也支持 Left/Right/Home/End。
2. A 的四个底部目的地可相互切换；各目的地显示对应情境新增。
3. B 的三个稳定目的地和集中新增入口可操作；食品资料可从集中新增或设置进入并返回。
4. C 的更多菜单可进入趋势、食品资料和设置，非日记页可返回日记。
5. 新增弹层可进入餐食方式、饮水、运动、体重、用户食品和提醒表单；提交只更新页面内存。
6. 趋势指标、柱状数据点、食品来源和食品搜索可操作。
7. 弹层支持 Escape、背景关闭、焦点进入、Tab/Shift+Tab 循环和焦点回退。
8. 页面刷新后恢复种子状态，不写 LocalStorage、IndexedDB、Cookie 或远端服务。

## 3. 输入基线

| 输入 | 使用范围 |
| --- | --- |
| `docs/03-design/experience-principles-and-jobs.md` | 本地优先、AI 可选、非评判语气、核心 Jobs |
| `docs/03-design/information-architecture.md` | 日记、趋势、食品资料、设置及新增任务逻辑域 |
| `docs/03-design/key-user-journeys.md` | J-02、J-03、J-04、J-06、J-07、J-08、J-09、J-10、J-11 的入口与降级 |
| `docs/03-design/states-content-accessibility.md` | 本地/AI 状态、简中文案、44pt 目标、焦点、Reduce Motion、稳定布局 |
| `docs/03-design/open-decisions.md` | UXD-01 A/B/C 原始体验候选及“不得自行锁定”规则 |
| `docs/02-product/owner-decision-packs.md` | D-038 全局编号、三方案与候选状态 |

## 4. 技术与版本

原型运行时只使用浏览器原生能力：

- HTML5；
- CSS Grid/Flexbox、媒体查询、`prefers-reduced-motion` 和系统字体栈；
- 原生 ECMAScript，未使用 npm package、框架、CDN、图片或远程字体；
- CSP 禁止默认资源、连接、对象和表单外发，只允许当前文件中的 inline style/script。

DesignOps 自测环境：

- Windows；
- Microsoft Edge `150.0.4078.105` headless/CDP；
- Node.js `v24.18.0` 仅用于无落盘 QA harness，不是原型运行依赖。

## 5. 重建与跨设备恢复

这是单文件原型，没有编译或打包步骤。

1. 从仓库取得 `prototypes/d038-navigation-shell/index.html`。
2. 同时取得 `prototypes/d038-navigation-shell/server.mjs`；它只用于浏览器拒绝 `file://` 时的 localhost 预览，不是产品服务器。
3. 在目标设备上创建本机预览目录 `D:\study\Nuttie-Prototype-Lab`（Windows 约定）；其他平台可选择任意本地目录。
4. 将仓库同源文件按字节复制为预览 `index.html` 和 `server.mjs`，不得改写换行或编码。
5. 对两份 HTML 计算 SHA-256；当前期望值均为 `12A46808982332BD5C1DC827B578950F2FCDA1561CD41BB9326CE819580FDB45`，大小均为 `60018` bytes。两个 server 脚本期望哈希均为 `282E22EC0F9AE406C9FCDD30E64F290F6F80B709EB76C5474F874F9CB94D1F2C`。
6. 可以直接用现代浏览器打开 `index.html`。若浏览器禁止本地文件，运行 `node server.mjs 4175` 并打开 `http://127.0.0.1:4175/`；脚本只绑定 loopback。
7. 修改后先更新仓库同源，再刷新预览副本、重跑尺寸/交互/网络 QA，并更新本 manifest 的大小和哈希。

哈希不一致时，预览副本视为过期，不得用它提交 Owner 评审。

## 6. DesignOps 自测记录

| 检查 | 结果 | 证据摘要 |
| --- | --- | --- |
| JavaScript 语法 | `PASS` | 单一 inline script 经 Node `Function` 解析，无语法错误 |
| 视口 | `PASS` | 320x700、375x812、430x932、1280x900 |
| 水平布局 | `PASS` | 四个视口均无根级横向溢出、越界可见元素或按钮文字裁切 |
| A 完整性 | `PASS` | 四个稳定目的地；日记/趋势/食品/设置均有情境新增 |
| B 完整性 | `PASS` | 三个稳定目的地；快捷摘要不直接新增；集中入口含 6 个任务/入口 |
| C 完整性 | `PASS` | 无底部稳定导航；更多菜单含趋势、食品、设置及 3 个记录任务 |
| 键盘 | `PASS` | A/B/C Arrow、Home、End；趋势指标 Arrow；弹层 Escape 与焦点循环 |
| 焦点 | `PASS` | 3px 可见焦点环；弹层同步落焦，关闭后回到触发控件 |
| 减少动态效果 | `PASS` | Reduce Motion 下 transition duration 为 `0.00001s`，无动画依赖 |
| 网络 | `PASS` | CDP 捕获 0 个非 `file:`/`data:` 请求；CSP `connect-src 'none'` |
| 运行错误 | `PASS` | Edge Runtime/Log 捕获 0 个 error/warning |
| 同源一致性 | `PASS` | 两份文件大小与 SHA-256 一致 |

本表是 DesignOps 自测，不替代主 Agent 的内置浏览器最终验收，也不是 Owner 评审结论。

## 7. 已知限制

- 这是导航与任务入口原型，不执行 SQLCipher、Keychain、相机、通知、Files、AITransport 或真实数据迁移。
- 表单提交只更新当前页面内存；刷新后恢复种子数据。
- 趋势图是可访问结构候选，不是最终图表组件或算法。
- 标签、图标字符和视觉层级是低保真占位，仍需在 D-038 接受后进行内容与无障碍复核。
- 没有保存 Owner 点击、偏好或评审反馈；决定必须通过明确文字回复和治理台账记录。
- 初始 A 预览不表示推荐已接受；A/B/C 三套方案当前均为 `CANDIDATE`。

## 8. 下一门禁

1. 主 Agent 使用内置浏览器对仓库同源或字节一致预览副本做桌面、320、375、430 视觉与 console 验收。
2. Product、Architecture、Security 和 QA 核对三方案的任务可达性与固定边界。
3. PM 向 Owner 提交同一原型和不带默认答案的 D-038 选择题。
4. Owner 明确接受、拒绝或暂缓；在此之前 D-038 保持 `CANDIDATE`。
5. 只有接受方案形成正式设计基线并满足实现 DoR 后，才能另行授权 React Native 实现。
