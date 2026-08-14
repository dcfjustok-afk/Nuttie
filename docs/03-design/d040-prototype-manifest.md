# Nuttie D-040 原型 Manifest

| 字段 | 内容 |
| --- | --- |
| Artifact ID | `PROTO-D040-001` |
| 题目 | D-040（原 UXD-03）“首启资料与目标设置”的 A/B/C 低保真对比 |
| 状态 | `CANDIDATE / PX-0_INPUT_GAP / FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED` |
| 快照日期 | 2026-08-06（Asia/Shanghai） |
| 负责人 | PM 接管原型编排与交付；Product / 健康文案输入仍待关闭 |
| 保真度 | 可交互低保真；不锁定正式字段、公式、视觉、组件库、导航或工程实现 |
| 权威同源 | `D:\github\Nuttie\prototypes\d040-onboarding-goals\index.html` |
| 本机冻结预览 | `D:\study\Nuttie-D040-Prototype-Lab\index.html`；三份运行文件与仓库逐字节一致 |
| HTML | `46646` bytes；SHA-256 `1FAAAF234658633C7957BA8EBC642E463B710D9D50FED704E186C267F92812AC` |
| 本地预览脚本 | `server.mjs`；`2500` bytes；SHA-256 `85F735340E122FFDE99DD2C132A4B9EC9843B1AAA846CA0D702F2994D6B98484` |
| 自动 QA | `qa-smoke.mjs`；`22514` bytes；SHA-256 `D7CAA3972FA162C65C98CC171F3031A855E672508B274F27A7E4FD4AFACEB53A` |
| 预览 URL | `http://127.0.0.1:4177/`（仅本机 loopback；当前由冻结预览目录提供） |
| 外部依赖 | 无；不加载 CDN、远程字体、图片、分析或第三方脚本 |
| 网络能力 | 无；CSP `connect-src 'none'`，作者 QA 捕获外部请求 `0` |
| 持久化 | 无；不使用 LocalStorage、SessionStorage、IndexedDB、Cookie 或远端存储 |

## 1. 当前门禁结论

原型已经形成可操作的 A/B/C 流程并通过作者自动 QA 和主 Agent 的内置浏览器检查，但尚未满足 PX-0 的“输入完整”条件。当前缺少三类必须由 Owner 与健康文案/领域评审处理的输入：

1. 画像最小字段与每个字段的用途、必填性和删除边界；
2. 本地目标公式、输入因素、适用范围、版本、舍入和缺失处理；
3. 未成年人、孕哺期、慢病或饮食障碍风险等不适用情况的停止推导与转介规则。

因此本轮只证明“候选流程可比较、工程和安全边界可测试”，不能把状态升级为 `PX-1_COMPLETE`、`PX-2_PASS` 或 `READY_FOR_OWNER_REVIEW`。D-040 尚未进入权威决定台账，页面初始 A 只按字母顺序显示，不代表推荐被接受、Owner 选择或实现授权。

## 2. 决策边界

| 方案 | 唯一变化轴 | 当前原型行为 | 当前状态 |
| --- | --- | --- | --- |
| A | 最小资料 + 可解释公式候选 + 用户确认 | 使用未批准的流程演示字段，进入统一目标预览；可修改、确认、转手工或稍后设置 | `CANDIDATE` |
| B | 只允许手工设置目标 | 不显示或要求 A/C 的画像字段；用户手工输入能量和 P/C/F，可确认或暂不设置 | `CANDIDATE` |
| C | 完整问卷后才进入日记 | 新建档案不能直接跳过问卷；备份恢复、异常恢复和重新开始仍可达 | `CANDIDATE` |

三种方案共用欢迎页、加密备份恢复、数据库恢复态、目标检查页、保存失败页和最终日记。A/C 预览使用固定测试夹具 `2000/100/250/67`，明确标记 `D040-FORMULA-PENDING`；它不是根据输入生成的健康目标，也不是正式默认值。B 只显示用户手工输入。

D-040 不决定：

- 年龄、身高、体重、活动、餐次节奏、饮食偏好或作息是否进入正式资料；
- BMR、TDEE、活动系数、宏量比例、减重速度、阈值、舍入或任何医疗/营养规则；
- D-038 导航外壳、D-018 导航库、React Native 页面、路由、数据库 schema 或依赖；
- AI、HealthKit、相机、相册、通知、账号、云同步或真实 Files 恢复实现；
- 目标历史版本、目标删除和多档案的最终产品规则。

## 3. 固定任务、测试种子与状态

固定评审任务：

1. 在 A 中查看最小资料的候选字段，触发并修正校验错误，再进入公式候选预览。
2. 在 A 中不设置目标进入日记，确认没有 `0` 目标、默认推荐或虚构 Left。
3. 在 B 中只输入手工能量与 P/C/F，确认不依赖画像字段或隐藏计算。
4. 在 C 中清空全部问题并尝试继续，确认不能生成目标或进入日记；补齐后进入与 A/B 相同的检查页。
5. 从欢迎页和 C 问卷进入加密备份恢复，分别模拟失败、取消和成功。
6. 模拟已有本地档案，确认跳过 clean first-run；模拟数据库无法解锁，确认不会新建空库覆盖旧数据。
7. 模拟数据库不可写或空间不足，确认资料/目标写入保持 `0` 且草稿仍在流程内。
8. 用键盘切换 A/B/C、进入和退出子页，检查标题焦点、Escape 返回与触发控件焦点恢复。

固定测试值全部是内嵌流程夹具，不代表 Owner 资料或产品默认：年龄 `32`、身高 `168`、体重 `64`、能量 `2000` 千卡、蛋白质 `100` 克、碳水化合物 `250` 克、脂肪 `67` 克。原型只在页面内存维护 `profileWrites` 和 `goalWrites` 计数，刷新后回到 A/欢迎页/零写入。

## 4. 本地、安全与恢复状态

| 状态 | 原型行为 | 数据结果 |
| --- | --- | --- |
| 首次启动 | 展示本地说明、非医疗边界、开始设置和恢复入口 | 不注册、不联网、不请求权限 |
| A/B 暂不设置 | 进入日记并显示“尚未设置每日目标” | 本次档案/目标写入计数均为 0；不计算 Left |
| C 问卷未完成 | 关联字段错误并聚焦首个错误 | 档案 0，目标 0，不能直接进入日记 |
| 目标预览 | 显示来源、版本、生效日期、可修改数值和历史不回算说明 | 确认前档案/目标均 0 |
| 备份失败 | 明示当前本地数据没有变化 | 档案/目标均 0 |
| 数据库恢复态 | 只提供重试与加密备份恢复 | 不创建或覆盖数据库 |
| 保存失败 | 保留流程草稿并提供重试、返回和取消 | 档案/目标均 0 |
| 保存成功 | 仅增加页面内存计数并进入日记 | 无文件、数据库、Keychain 或网络写入 |

页面没有真实 Files picker、SQLCipher、Keychain、权限 API、AITransport 或数据库。`Nuttie-demo.backup` 只是一条内嵌测试文字，不能作为加密备份实现证据。

## 5. 交互与无障碍基线

- A/B/C 使用原生 `role=tablist/tab`，支持 Tab、Left、Right、Home 和 End；`aria-selected` 与焦点同步。
- 所有任务动作用原生 button/input/select；可见 button/select 的原型高度不低于 43.5 CSS px。
- 新页面把焦点放到标题；Back 或 Escape 返回后恢复触发控件，找不到时回退到标题。
- 表单错误通过 `aria-invalid`、`aria-describedby` 和 `role=alert` 关联，保留草稿并聚焦首个错误。
- 320x700、375x812、430x932 和 1280x900 下根页面与 App 画布无横向溢出，可见控件不越出手机画布。
- `prefers-reduced-motion: reduce` 下不依赖动效；状态不只靠颜色表达。
- C 的强制问卷语义使用可读文字明确说明，不通过隐藏动作或负面视觉惩罚暗示。

最大 iOS Dynamic Type、VoiceOver 实机读序、软件键盘、Switch Control 与真实 Files 返回焦点仍须在后续 React Native 规格和真机实现阶段验证；HTML 键盘检查不能替代这些证据。

## 6. 输入基线

| 输入 | 用途 |
| --- | --- |
| [Owner 分批决策包](../02-product/owner-decision-packs.md) | D-040 A/B/C 题目与公式/健康文案前置 |
| [开放体验决定](open-decisions.md) | UXD-03 原始方案、影响与权限禁止项 |
| [关键用户旅程](key-user-journeys.md) | J-01 首启、无目标、恢复和数据库失败 |
| [状态、内容与无障碍基线](states-content-accessibility.md) | 应用状态、空目标、错误、非医疗文案和 44pt |
| [体验原则与 Jobs](experience-principles-and-jobs.md) | 本地优先、AI 可选、非评判与特殊人群边界 |
| [验收与双向追踪基线](../02-product/acceptance-traceability.md) | AT-F12/F17/F18/F19 与 NFR-A11Y/I18N |
| [PX-0 输入研究包](d040-px0-input-research.md) | 字段、能量模型、持久化、删除、特殊人群边界与 Owner 子选择卡草案；当前仍未批准 |

## 7. 技术、重建与启动

原型只使用 HTML5、CSS 和原生 ECMAScript，没有 npm package、构建步骤、框架、CDN 或远程资源。`server.mjs` 只绑定 `127.0.0.1`，只允许 GET/HEAD；它不是产品服务器。

从仓库重建 Windows 冻结预览：

1. 创建 `D:\study\Nuttie-D040-Prototype-Lab`。
2. 按字节复制 `index.html`、`server.mjs` 和 `qa-smoke.mjs`；不得改写编码或换行。
3. 比较每个文件的长度和 SHA-256；任一不一致时冻结预览过期。
4. 启动：

```powershell
node D:\study\Nuttie-D040-Prototype-Lab\server.mjs 4177
```

5. 打开 `http://127.0.0.1:4177/`，再执行：

```powershell
node D:\study\Nuttie-D040-Prototype-Lab\qa-smoke.mjs http://127.0.0.1:4177/ D:\study\Nuttie-D040-Prototype-Lab\qa-screenshots
```

当前 QA 脚本固定查找 Windows Edge；跨平台运行需要替换 `edgePath`，不影响 HTML 原型本身。

## 8. 作者 QA 与主 Agent 验收

| 检查 | 结果 | 证据摘要 |
| --- | --- | --- |
| HTML inline JavaScript | `PASS` | 单一 inline script 经 `Function` 解析 |
| server / QA 语法 | `PASS` | `node --check` |
| HTTP | `PASS` | GET/HEAD 200、POST 405；响应体逐字节等于权威 HTML |
| 视口与 44pt | `PASS` | 320/375/430/desktop 的欢迎页、C 问卷和 B 无目标日记无横向溢出；可见 button/select 达标 |
| A/B/C | `PASS` | A 校验/预览/保存与无目标；B 纯手工；C 强制问卷与完整后预览 |
| 恢复与失败 | `PASS` | 备份失败/成功、数据库恢复、保存失败零写入 |
| 键盘与 Reduce Motion | `PASS` | Tab/方向/Home/End、3px 焦点环、Escape 焦点恢复 |
| 网络/运行时/存储 | `PASS` | `0` 外部请求、`0` warning/error、`0` 持久化记录 |
| 冻结副本 | `PASS` | 三文件长度与 SHA-256 和仓库一致；冻结副本 QA 再次通过 |
| 内置浏览器 | `PASS_WITH_INPUT_GATE` | A 预览、C 问卷、320/375/430/desktop 布局和可见文案核验通过；不升级 PX 状态 |

作者 QA 的 `PASS` 只证明已实现的原型合同没有检测到行为错误，不证明未批准字段或公式正确。

## 9. 独立评审

独立 Agent 先完成需求边界审查，明确具体画像字段和公式不能因为行业惯例被写成正式必填；C 必须真实保留完整问卷门槛，A/B 保留无目标日记路径。

首轮实际工件审查发现 2 项 P1、4 项 P2 和 1 项 P3：恢复/已有数据来源标签错误，跳过或读取现有数据被误计为写入，活动字段错误缺少无障碍关联，以及 QA 对异常路径、动态页面和持久化检查不足。修复后独立 Agent 使用冻结副本在临时 loopback 端口 `4187` 完成 delta 复测：全部原发现关闭，无新 P1/P2/P3；9 组流程、三类页面的四视口、来源标签、零写入、错误关联、实际 `indexedDB.databases()`、零外部请求和零运行时问题均通过。临时服务已停止，仓库与冻结副本的三项 SHA-256 与本页表格一致。

独立复测通过只关闭已实现原型的质量问题，不关闭字段/公式输入缺口，也不评价或授权 PX-1、PX-2、Owner 方案选择或正式实现。

## 10. 限制与下一门禁

- 下一步不是实现 React Native。字段、公式、适用范围、数据生命周期和宏量轴已在 [D-040 问题分解与全局 ID 预留](d040-question-allocation.md) 拆成 20 个独立决定轴；现在必须先为第一小批编写中立选择卡规格并完成跨域复核，不能用网页或未审查的文字问题代替宿主原生选择卡。
- 该原型于 2026-08-06 登记时，OI-03 是 Owner intake 的下一张卡，D-040 不得抢占或改写该历史顺序。OI-03、OI-02、首批整批回读和 D-039 PX-3/PX-4 后续均已完成；计划中的宿主原生队列占位现为 D-040，但第一批卡片仍处于 `PX-0_INPUT_GAP / FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED`，不得提交 Owner。
- ID 分配不关闭 PX-0。选择卡规格和剩余中国支持文案/健康评审治理输入关闭后重新做 PX-0/PX-1 审查；若具体公式改变预览数据或字段，必须更新原型、哈希、QA 与独立复测。
- 只有 D-040 经单独原生选择卡明确处理、PX-2/PX-3/PX-4 完成，并形成正式规格后，才可申请对应实现 DoR。
- 本原型不修改 `project-ops/decisions.json`、Owner intake 或任何 `DECISION_ACCEPTED` 状态，也不授权正式 React Native 工程、Apple 资源、TestFlight 或发布。
