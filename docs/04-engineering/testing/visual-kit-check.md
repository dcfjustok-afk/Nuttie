# Visual Kit Contract Check

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/visual-kit-check.mjs` 与 `tools/visual-kit-check.test.mjs`

## 目的

这个检查把当前原创栗子视觉资产和候选页面的可验证边界固定下来，不把 HTML 预览当成正式 RN 页面或 Figma 文件。它读取核心画面、组件目录、功能画面、状态模式、角色 SVG、辅助插画 SVG、令牌 JSON 和本地服务器。

## 覆盖矩阵

| 类别 | 当前合同 |
| --- | --- |
| 核心画面 | 3 张画面、本地资产引用、品牌与关键交互状态 |
| 视觉资产 | 4 个栗子角色、9 个辅助插画、设计令牌和可访问名称 |
| 组件目录 | 原生输入、错误关联、选择状态、进度边界和选定触控尺寸 |
| 功能画面 | 5 个画面；缺失营养、来源版本、搜索/URL/密码输入和动作语义 |
| 状态模式 | 9 个稳定身份；标题/描述关联、对话框角色、安全焦点、非模态静态 sheet 和内部滚动 |
| AI 边界 | Provider 未准入时发送与测试连接 fail-closed，不读取 key、不创建请求 |
| 本地运行 | HTML 无远程资源，服务器只绑定 `127.0.0.1` 并拒绝路径穿越 |

状态模式的九个负向变异分别覆盖：重复身份、破坏 `.screen` 滚动、丢失 dialog 描述引用、静态 sheet 错误声明 modal、危险按钮成为默认焦点、按钮缺少 `type="button"`、注入未批准撤销、提前启用 AI 发送、注入越界的连续记录或统计内容。

## 验证

```powershell
node tools/visual-kit-check.mjs
node --test tools/visual-kit-check.test.mjs
node project-ops/validate.mjs
git diff --check
```

当前 Node 基线为 `15` 项测试：1 项完整正向检查和 14 项负向变异。负向测试覆盖远程资源、假输入、过小控件、未批准进度文案，以及上文列出的九种状态模式破坏。

浏览器响应式基线日期为 `2026-08-08`，覆盖 `1440x900`、`430x844`、`390x844` 和 `320x844`。已检查页面无横向溢出、手机内容区内部滚动、AI 发送禁用、对话框 ID 引用、无重复 ID、无虚假 `aria-modal`、可见控件至少 `44px` 以及控制台无 warning/error。

## 不验证

- 该工具是源码和结构合同检查，不证明浏览器计算布局中的每一个控件都达到 `44px`；计算尺寸属于单独的浏览器证据。
- 不验证真实焦点圈闭、Escape 关闭、关闭后焦点恢复、动态字体、iOS VoiceOver 或真机像素结果。
- 不验证 Figma MCP 连接、React Native 组件、SQLite/SQLCipher、Keychain、Files、系统权限或真实 AI transport。
- 浏览器响应式、视觉和语义树 QA 不能由 Node 检查器替代；正式 RN 和真机门禁满足后必须重新验收。
