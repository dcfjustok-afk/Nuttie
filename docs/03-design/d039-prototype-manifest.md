# Nuttie D-039 原型 Manifest

| 字段 | 内容 |
| --- | --- |
| Artifact ID | `PROTO-D039-001` |
| 题目 | D-039（原 UXD-02）“添加餐食”的首层方式 A/B/C 低保真对比 |
| 状态 | `CANDIDATE / PX-2_INDEPENDENT_REVIEW` |
| 快照日期 | 2026-07-31（Asia/Shanghai） |
| 负责人 | Product Designer / DesignOps（组织角色 `product_designer_g3`） |
| 保真度 | 可交互低保真；不锁定正式视觉、组件库、导航外壳或工程实现 |
| 权威同源 | `D:\github\Nuttie\prototypes\d039-add-meal-entry\index.html` |
| 本机预览 | `D:\study\Nuttie-D039-Prototype-Lab\index.html` |
| HTML | `72453` bytes；SHA-256 `ACCB40EC430E8C16D167699FF69AC16DC92229D6C2B26071585BADBD2AB7F59B` |
| 本地预览脚本 | 两目录的 `server.mjs`；`2539` bytes；SHA-256 `A4AF74981DC9820E56CFCE802BAB0ACCCFED0E0511B3BED695B189B41F37F8A9` |
| 自动 QA | 两目录的 `qa-smoke.mjs`；`25742` bytes；SHA-256 `DFDF975EE6F43733BE81532D69093F16832EA6512834C63532262B702070F6D5` |
| 预览 URL | `http://127.0.0.1:4176/`（仅本机 loopback；端口可改） |
| 外部依赖 | 无；不加载 CDN、远程字体、图片、分析或第三方脚本 |
| 网络能力 | 无；CSP `connect-src 'none'`，自动 QA 捕获外部请求 `0` |
| 持久化 | 无；不使用 LocalStorage、SessionStorage、IndexedDB、Cookie 或远端存储 |

## 1. 决策边界

本原型只比较 D-039 的“添加餐食首层入口如何组织”，不替 Owner 选择：

| 方案 | 唯一变化轴 | 固定能力 | 当前状态 |
| --- | --- | --- | --- |
| A | 本地搜索和最近使用先出现；扫描与 AI 并列 | 搜索、最近、条码、自建、AI 状态、统一编辑与本地保存全部可达 | `CANDIDATE` |
| B | 记住上次方式；可模拟首次、上次本地搜索、上次 AI 图片三种状态 | 同 A；记住 AI 入口不记住发送同意，图片仍逐次预览 | `CANDIDATE` |
| C | 搜索、扫描、拍照、相册、文字、自建食品六种方式在首层平铺 | 同 A；最近使用仍可到达 | `CANDIDATE` |

页面初始显示 A 仅因为字母顺序，不表示推荐、投票、Owner 选择或批准。切换 A/B/C 和评审状态只修改当前页面内存；刷新后复位，不写入决定台账。

D-039 不决定：

- D-038 导航外壳、D-018 导航库或任何页面路由目录；
- React Native、Expo、Node、Xcode、包管理器或依赖版本；
- 品牌色、字体、App 图标、正式图标集、组件库、动效或触觉反馈；
- D-014 之外的 AI 逐次确认适用范围；文字路径使用预览只为覆盖候选任务，不构成相关 Owner 决策；
- D-053 第三方 Provider 准入；当前始终显示 `UNKNOWN / BLOCKED`，原型没有真实“确认发送”能力；
- AI 照片本地保留策略、真实相机/相册、SQLCipher、Keychain、AITransport 或日记数据库实现。

## 2. 固定任务、种子与状态

三种方案共用同一份 JavaScript 状态机、食品种子、表单、编辑页和保存结果。只有首层入口组织不同，避免用功能缺失或内容质量暗示某一方案更优。

固定评审任务：

1. 搜索“无糖酸奶”，检查来源，修改候选并保存到本机。
2. 从最近使用选择燕麦片或熟鸡胸肉，修改并保存。
3. 扫描条码，分别模拟本地命中与未命中。
4. 未命中后携带标准化 GTIN 创建用户食品，并完成统一检查与保存。
5. AI 未配置时降级到本地搜索或自建食品。
6. 对营养标签照片执行 D-014 的当次预览；检查 host、model、载荷范围和不发送内容。
7. 分别模拟发送前取消、确认后失败和本地注入测试候选。
8. 取消或失败时验证候选与日记零写入；本地测试候选可逐项编辑或明确删除/放弃。
9. 模拟相机或相册权限拒绝，使用条码输入、本地搜索、自建食品或系统设置替代路径。
10. 保存成功时确认纯本地、网络请求 0 次；刷新页面后种子状态恢复。

固定食品种子：

| 种子 | 来源表达 | 用途 |
| --- | --- | --- |
| 原味无糖酸奶 | 本地数据包测试条目 | 默认手工搜索 |
| 即食燕麦片 | 本地数据包测试条目；最近使用 | 最近路径与本地保存 |
| 熟鸡胸肉 | 用户自建测试条目；最近使用 | 来源区分 |
| 香蕉 | USDA 测试条目 | 多来源搜索结果 |
| 测试商品：无糖豆浆 | 本地条码测试条目 | 条码命中 |
| 糙米鸡肉蔬菜碗 | 本地注入的 AI 测试候选 | 编辑、放弃和保存状态；不是 AI 响应 |

## 3. AI 与数据安全状态

| 状态 | 原型行为 | 数据结果 |
| --- | --- | --- |
| AI 未配置 | 停在本机，显示本地搜索、自建和设置位置模拟 | 不读取凭据、不组装请求、候选 0、日记写入 0 |
| 图片准备 | 只显示模拟缩略图、设备内裁剪/压缩/EXIF 移除候选文案 | 不读取真实媒体，不发送 |
| 营养标签预览 | 显示输入、示例 host/model、不会发送的字段和 D-053 状态 | D-014 每次预览成立；D-053 仍为 `UNKNOWN / BLOCKED` |
| 发送前取消 | 保留任务草稿并显示零写入 | 网络 0、候选 0、日记 0 |
| 模拟失败 | 显示未收到响应和手工恢复入口 | 候选 0、日记 0 |
| 本地测试候选 | 从内嵌固定数据载入，不模拟真实 Provider 成功 | 可编辑、可明确删除、确认后才可纯本地保存 |
| 候选放弃 | 清空 `state.draft`，进入明确结果页 | 网络 0、候选 0、本候选日记 0 |
| 保存 | 只增加页面内存中的演示计数 | 网络 0；关闭或刷新后消失 |

原型没有 `fetch`、XHR、WebSocket 或真实表单外发。`api.example.test` 与 `sample-model` 只是不可调用的界面测试文字，不能作为 Provider 准入证据。

## 4. 交互与无障碍基线

- A/B/C 使用原生 `role=tablist/tab`；支持 Click、Tab、Left、Right、Home 和 End。
- 所有任务动作使用原生 button/input/select/textarea；可交互目标的低保真基线为至少 44 CSS px。
- 前进到新页时焦点进入页标题；Back 或 Escape 的历史项保存触发控件描述符，返回后恢复原触发控件；找不到时才回退到标题。
- 创建、编辑和 AI 文字空白错误通过 `aria-invalid`、`aria-describedby` 与 `role=alert` 关联并聚焦首个错误。
- 创建和编辑表单保留原生 `required/min/step` 门禁；无效数值不写入、不静默改成 1 或 0。
- 验证失败时保留食品名、份量、单位、全部营养字段、GTIN 和餐次草稿。
- `prefers-reduced-motion: reduce` 下不依赖动效，transition/animation duration 被压缩。
- 320、375、430 和 desktop 宽度均没有根级或 App 内容横向溢出；手机画布内部允许纵向滚动。

## 5. 输入基线

| 输入 | 作用 |
| --- | --- |
| `docs/03-design/prototype-and-owner-review-workflow.md` | PX-0 至 PX-5、同等完整候选、Owner 评审和实现禁令 |
| `docs/03-design/open-decisions.md` | UXD-02 原始 A/B/C 题目和影响 |
| `docs/03-design/information-architecture.md` | 餐食录入任务层、统一检查与保存、来源区分 |
| `docs/03-design/key-user-journeys.md` | J-02 手工、J-03 条码、J-04 AI 的正常/失败/权限路径 |
| `docs/03-design/states-content-accessibility.md` | 本地/AI 状态、简中词汇、44pt、焦点和 Reduce Motion |
| `docs/03-design/experience-principles-and-jobs.md` | 本地优先、AI 可选、权限按需、非评判文案 |
| D-014 | 营养标签照片首次说明和每次预览确认 |
| D-053（候选） | Provider/载荷组合未知即阻断；本原型不得暗示准入 |

## 6. 技术、重建与启动

原型运行时仅使用 HTML5、CSS 和原生 ECMAScript。没有 npm package、构建步骤、框架、CDN、远程资源或真实系统 API。

从仓库重建 Windows 本机预览：

1. 取得 `prototypes/d039-add-meal-entry/index.html`、`server.mjs` 和 `qa-smoke.mjs`。
2. 创建 `D:\study\Nuttie-D039-Prototype-Lab`，按字节复制三份文件；不得改写编码或换行。
3. 比较仓库与预览的每个文件长度和 SHA-256；任一不一致时预览视为过期。
4. 可直接打开 `index.html`；若浏览器限制 `file://`，运行：

```powershell
node D:\study\Nuttie-D039-Prototype-Lab\server.mjs 4176
```

5. 打开 `http://127.0.0.1:4176/`。服务器仅绑定 `127.0.0.1`，只允许 GET/HEAD；它不是产品服务器。
6. 自动复验：

```powershell
node D:\github\Nuttie\prototypes\d039-add-meal-entry\qa-smoke.mjs http://127.0.0.1:4176/ D:\study\Nuttie-D039-Prototype-Lab\qa-screenshots
```

其他平台可选择任意本地目录，并使用同等 loopback 静态服务器。QA 脚本当前固定查找 Windows Edge；跨平台时需要显式替换 `edgePath`，这不影响原型运行本身。

## 7. DesignOps 自测证据

自测环境：Windows；Microsoft Edge `150.0.4078.105` headless/CDP；Node.js `v24.18.0`。Node 只用于本地静态服务器与 QA 驱动，不是原型运行依赖。

| 检查 | 结果 | 证据摘要 |
| --- | --- | --- |
| HTML inline JavaScript 语法 | `PASS` | 单一 inline script 经 Node `Function` 解析 |
| `server.mjs` / `qa-smoke.mjs` 语法 | `PASS` | `node --check` |
| 视口 | `PASS` | 320x700、375x812、430x932、1280x900 |
| 横向布局 | `PASS` | 四个首屏及 320 宽动态任务页均无根/App 横向溢出或控件越出手机画布 |
| 44pt | `PASS` | 可见 button/select 运行时高度均不低于 43.5 CSS px；输入本身为 44px |
| 本地搜索/最近 | `PASS` | 搜索来源可辨；两条路径均可编辑并纯本地保存 |
| 条码 | `PASS` | 命中、未命中、相机拒绝、输入 GTIN、携带 GTIN 自建并保存 |
| AI | `PASS` | 未配置、D-014 标签预览、取消、失败、本地候选编辑/放弃/保存 |
| 表单完整性 | `PASS` | 空白名称保留全部字段；餐次不回退；负数被原生 min 门禁拦截；零写入 |
| B 三状态 / C 六入口 | `PASS` | 首次/上次本地/上次 AI；C 正好六个首层方法 |
| 键盘与焦点 | `PASS` | tab Arrow/Home/End；A/B/C Escape 与 AI Back 均恢复触发控件 |
| Reduce Motion | `PASS` | CDP 模拟媒体查询返回 true；无动效依赖 |
| 网络 | `PASS` | Network domain 捕获外部请求 0；CSP `connect-src 'none'` |
| 运行时 | `PASS` | Runtime exception、console error/warning、Log error/warning 均为 0 |
| HTTP | `PASS` | GET/HEAD 200；POST 405；HTTP body 长度和 SHA 与权威 HTML 一致 |
| 同源一致性 | `PASS` | 仓库与 `D:\study` 的 HTML/server/QA 三对文件长度与 SHA-256 分别一致 |

自动 QA 当前覆盖 18 组流程：本地搜索、最近、条码命中、条码未命中自建、AI 未配置、标签预览取消、AI 失败、AI 候选编辑保存、相机拒绝、两表单校验保留、AI 候选放弃、Back/Escape 焦点恢复、来源显示、AI 空文字、GTIN 传递、B 三状态、C 六入口和键盘/Reduce Motion。

截图位于本机预览的 `qa-screenshots/`，包括四个基准视口，以及 AI 预览、AI 编辑、候选放弃、B 上次 AI 和 C 六入口的 320 宽快照。截图是 QA 证据，不是权威同源或正式视觉资产。

## 8. 独立评审记录

`owner_gate_reviewer` 的首轮静态审查提出 D039-QA-001 至 D039-QA-008；修复中间态追加 D039-QA-009。当前作者回执均为 `CLOSED_CANDIDATE / INDEPENDENT_RETEST_PENDING`：

| Finding | 严重度 | 修复 |
| --- | --- | --- |
| D039-QA-001 | HIGH | 创建/编辑草稿保留；餐次按草稿恢复；错误与字段关联 |
| D039-QA-002 | HIGH | AI 候选可明确删除/放弃，清 draft 并显示零写入 |
| D039-QA-003 | MEDIUM | 历史记录保存焦点描述符，Back/Escape 恢复触发控件 |
| D039-QA-004 | MEDIUM | 扫码相机拒绝态补齐输入条码、搜索、自建、系统设置 |
| D039-QA-005 | MEDIUM | 本地搜索结果逐条显示来源 |
| D039-QA-006 | MEDIUM | 评审 select 提升到 44px 并保持可见焦点 |
| D039-QA-007 | MEDIUM | AI 文字空/空白本地拦截、保留、关联错误、零写入 |
| D039-QA-008 | MEDIUM | 未命中 GTIN 传入自建、统一编辑和保存结果 |
| D039-QA-009 | HIGH | 恢复 create/editor 原生 required/min/step；移除数值静默默认 |

只有独立复测返回明确 PASS 后，才能把本节和顶层状态改成 `PX-2_PASS`。作者自测不替代独立评审或主 Agent 内置浏览器验收。

## 9. 已知限制

- 这是任务组织原型，不执行真实相机、相册、条码扫描、Files、SQLCipher、Keychain、AITransport、Provider policy 或数据库事务。
- `AI 本地测试候选` 是内嵌固定夹具；它不证明模型输出质量、网络成功、响应解析或任何 Provider 合规性。
- 图片缩略图是 CSS 低保真占位，不读取照片，不验证裁剪、压缩或 EXIF 实现。
- 保存只更新页面内存计数；刷新后恢复种子状态。它不能证明 SQLCipher 写入、原子事务、营养快照或历史迁移。
- 当前只验证简体中文和 iPhone 竖向 320/375/430 加桌面原型框架；不决定 iPad、横屏、Dynamic Type 极限、VoiceOver 实机读序或正式 safe-area 行为。
- 自动 QA 使用 Edge/CDP 检查 DOM、焦点、布局、请求和 console；仍需要主 Agent 用内置浏览器做最终视觉与实际键盘 Tab 顺序验收。
- 原型不保存 Owner 点击、偏好、评价或可用性结果；正式决定只能由 Owner 明确文字回复并写入权威台账。

## 10. 下一门禁

1. `owner_gate_reviewer` 对冻结 SHA 完成独立复测，关闭或重开 D039-QA-001 至 D039-QA-009。
2. 主 Agent 对字节一致预览执行 320/375/430/desktop 视觉、键盘、焦点、Escape、console 与网络验收。
3. Product、Architecture/Security 和 QA 确认三方案任务等价，且没有扩大 D-014/D-053。
4. PM 只把同一原型和不带默认答案的 D-039 问题提交 Owner；切换控件点击不得写入决定。
5. Owner 明确接受、拒绝或暂缓。在此之前 D-039 保持 `CANDIDATE`，不得据此创建 React Native 正式页面或路由。
