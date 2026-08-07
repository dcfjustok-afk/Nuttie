# Visual Kit Contract Check

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/visual-kit-check.mjs` 与 `tools/visual-kit-check.test.mjs`

## 目的

这个检查把当前原创栗子视觉资产的可验证边界固定下来，不把 HTML 预览当成正式 RN 页面或 Figma 文件。它检查三张核心画面、四个 SVG 角色变体、角色可访问名称、中文文档声明、无远程 HTML 资源，以及预览服务器只绑定本机回环地址并拒绝路径穿越。

## 验证

```powershell
node --test tools/visual-kit-check.test.mjs
node tools/visual-kit-check.mjs
```

该检查不验证 Figma MCP 连接、字体渲染、iOS VoiceOver、RN 组件实现或真机像素结果；这些需要在 Figma 连接和正式工程门禁满足后分别验证。
