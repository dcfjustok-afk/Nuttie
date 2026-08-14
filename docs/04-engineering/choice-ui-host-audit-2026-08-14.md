# Choice UI 宿主只读审计（2026-08-14）

状态：`VERIFIED_CANDIDATE / NOT_INSTALLED / OWNER_GATE_UNCHANGED`

## 1. 审计目的与边界

本审计只回答当前 Codex Desktop 宿主能否按 Nuttie 治理要求呈现 OI-02 原生选择控件，以及哪个本地 Choice UI 候选满足该要求。它不安装插件、不修改 Codex 全局配置、不替 Owner 选择、不写入 `project-ops/owner-intake.json`，也不产生 `DECISION_ACCEPTED`、`GATE_CHANGED` 或正式实现授权。

Nuttie 当前权威要求保持不变：下一题是 `oi02_identifier_status`，必须调用 `mcp__choice_ui__ask_choice`；不得用普通文字、编号列表、网页表单或浏览器页面替代聊天内原生选择控件。

## 2. 当前宿主事实

2026-08-14 在 Windows Codex Desktop 本机只读检查得到：

| 检查 | 结果 | 含义 |
| --- | --- | --- |
| 当前任务工具发现 | 无 `choice-ui` / `ask_choice` | 已打开任务不能执行 OI-02 |
| `codex plugin list` | `choice-ui@personal` 为 `not installed` | 个人 marketplace 中只有候选源码，不是已安装插件 |
| `codex mcp get choice-ui` | `No MCP server named 'choice-ui' found` | 当前 host 没有 Choice UI MCP 注册 |
| `codex plugin marketplace list` | 无 `ai-tools` marketplace | 0.3.0 来源目录尚未加入当前 Codex host |
| `codex features list` | `enable_mcp_apps` 为 `under development / false` | MCP App iframe 宿主当前未启用 |
| `codex features list` | `tool_call_mcp_elicitation` 为 `stable / true` | 只证明通用 elicitation 能力存在，不等于 0.3.0 MCP App 已安装 |

OpenAI 官方 MCP 文档说明 Codex Desktop、CLI 和 IDE 在同一 host 上共享 MCP 配置，配置位于 Codex `config.toml`：<https://learn.chatgpt.com/docs/extend/mcp?surface=cli>。本机插件说明与本次当前任务工具发现结果进一步确认：安装插件或修改 feature 后必须新建任务，已经打开的任务不会自动获得新的工具快照。

## 3. 两个本地候选的结论

### 3.1 `0.1.0+codex.20260811075133`：不符合 Nuttie 当前门禁

个人 marketplace 指向 `C:\Users\daichifeng\plugins\choice-ui`。该版本使用阻塞式 MCP form elicitation；当客户端不支持时，skill 明确要求退回普通编号文字列表。虽然其协议测试通过，但文字 fallback 与 Nuttie 的原生控件要求冲突，因此不能用于 OI-02。

其 `scripts/server.mjs` SHA-256 为：

```text
6223D22BD5FC81A411DE2A697ADEE0048AA04436EA3B723CFDE6F7684AA3D8D9
```

### 3.2 `0.3.0+codex.20260811105623`：符合交互语义的待安装候选

缓存工件位于：

```text
C:\Users\daichifeng\.codex\plugins\cache\ai-tools\choice-ui\0.3.0+codex.20260811105623
```

同内容源码位于 `D:\github\Ai-tools\plugins\choice-ui`。两处 `server.mjs` 与 `test-server.mjs` 的 SHA-256 分别一致：

```text
server.mjs      66CDEAC800F4284F02818720F66B10CCADF3EB99257D421AE0547B05EAFD750F
test-server.mjs 7859B573B7BE915B17C254D5405629E9BB9FFE1FF665ABE232F9A47064AD6BB2
```

该版本使用 MCP Apps resource `ui://choice-ui/choice-picker-v1.html` 在当前对话工具消息内渲染控件，不依赖 form elicitation，也没有普通文字选择 fallback。初次 `ask_choice` 结果只表示 `awaiting_selection`；真实点击经 App-only `submit_choice` 校验后，以 `[Choice UI result]` 后续用户消息返回。

`D:\github\Ai-tools` 当前没有 Git commit，工作树内容全部未跟踪且既有 `origin/main` 已不可用。因此上面的文件相等只证明本机源码与缓存工件一致，不构成远端或 Git 提交来源证明。未经明确授权，不得把该目录提交、推送或当作已批准供应链来源。

## 4. `0.3.0` 安全与资源边界

静态审查确认正式 MCP server：

- 只导入 `node:crypto` 和 `node:readline`；不导入文件系统、HTTP、网络、浏览器或子进程模块。
- 只通过 stdin/stdout 提供 MCP；不监听端口，不访问外部网络，不写文件。
- HTML、CSS 和 JavaScript 全部内嵌在 MCP resource 中，没有第三方运行时资源。
- 问题只保存在当前进程内存，TTL 为 30 分钟，最多保留 100 条。
- `ask_choice` 限制 2–5 个选项，并校验 header、question、ID、标签、描述、推荐项和多选上限。
- `submit_choice` 重新校验 question ID、未知/重复选项、单选/多选数量、取消语义和重复提交；相同提交幂等，不同结果冲突失败。
- `submit_choice` 标记为 App-only；模型不得直接调用，也不能把 `awaiting_selection` 推断成 Owner 已选或取消。

测试期 `--host` 模式会临时监听随机 `127.0.0.1` 端口以模拟 Codex MCP App host；这段 HTTP 代码只存在于 `test-server.mjs`，不在正式 `server.mjs` 中。

## 5. 已执行验证

协议测试：

```powershell
node scripts/test-server.mjs
```

结果：`choice-ui MCP protocol tests passed`。覆盖工具发现、MCP App metadata、resource 读取、单选、多选、取消、非法选择、重复提交和冲突拒绝。

宿主模拟通过真实浏览器复验：

1. 只绑定随机 `127.0.0.1` 端口启动 `test-server.mjs --host`。
2. 控件显示“方案 A / 方案 B”，推荐项置顶。
3. 未选择前“确认选择”禁用。
4. 选择 `scheme_a` 后按钮启用。
5. 确认后控件显示“已提交选择 / Codex 将继续处理”。
6. 宿主收到包含 `Selected IDs: ["scheme_a"]` 和唯一 question ID 的 `[Choice UI result]`。
7. 浏览器与两个测试 host 进程均已停止，测试端口已释放。

该验证证明候选插件自身的协议、控件和 follow-up 桥接行为，不证明当前 Codex 任务已加载插件，也不替代真实 OI-02 点击。

## 6. 后续动作与授权边界

只有获得修改全局 Codex 插件和 feature 状态的明确授权后，才可执行以下候选流程：

```powershell
codex features enable enable_mcp_apps
codex plugin marketplace add D:\github\Ai-tools
codex plugin add choice-ui@ai-tools
codex features list
codex plugin list
codex mcp get choice-ui
```

完成安装后必须新建 Codex 任务，让技能和 MCP 工具重新发现；旧任务不得声称热加载成功。新任务必须先确认 `mcp__choice_ui__ask_choice` 确实暴露且控件能在对话内渲染，再弹出 OI-02。

上述命令在本次审计中均未执行。当前 Owner intake、D-039、D-040、G0–G8、正式工程和原生授权状态全部保持不变。
