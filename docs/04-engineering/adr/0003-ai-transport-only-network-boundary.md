# ADR-0003：AITransport 是唯一业务网络边界

- 状态：accepted
- 日期：2026-07-31
- 关联决策：D-003、D-004、D-014
- 决策者：Owner

## 上下文

Nuttie 不建设业务服务器。用户愿意为 AI 功能提供 OpenAI-compatible baseURL、model 和 key，但要求其他功能本地运行。把共享 key 编译进客户端无法保密；任意模块都能联网也会让“本地优先”无法验证。

## 决策

1. 每位用户独立配置 OpenAI-compatible `baseURL`、`model` 和 `key`。
2. Release 仅允许 HTTPS。
3. 生产业务代码只有 `AITransport` 可以发起网络请求；其余模块不得直接使用网络 API。
4. 所有 AI 请求必须由用户主动发起。营养标签照片按 D-014 首次使用前解释数据去向，每次请求前展示预览、实际 host、model 和发送范围，并由用户明确确认。餐食照片、纯文本和趋势摘要是否采用同等逐次预览仍待 D-033。
5. AITransport 返回不可信候选，不直接写数据库；本地 schema/范围/单位校验和用户最终确认后才提交。
6. 未配置、非 HTTPS、TLS、401/403、429、超时、取消和非合约响应全部失败为零写入，并保留手动录入路径。
7. 不启用远程 Push、账号 API、在线食物查询、遥测、远程配置或 OTA 更新。

本 ADR 接受的是 BYOK、HTTPS、用户主动触发、唯一业务网络边界和确认前不入库，不自动冻结 URL query/fragment、全部 3xx、cookie/cache/credential 或底层 session 实现。这些具体兼容策略由 provisional D-036 交 Owner 决定。

## 后果

- 核心功能可在飞行模式运行，AI 功能清晰显示不可用或失败。
- 一个长期共享主 key 不能作为无服务器方案；需要共享计费和撤销能力时只能重新讨论代理服务。
- 自定义 Provider 会接收用户主动发送的数据，Nuttie 不能替 Provider 保证隐私。对 D-014 之外载荷的逐次上传预览是安全推荐，不是本 ADR 已接受范围。
- 需要静态依赖规则和运行时网络测试证明边界，而不是只靠团队约定。
- 无论 D-036 选择何种 profile，都不能把 Authorization 或载荷发送给用户未确认的 origin。

## 待决安全 profile

D-036 推荐比较严格隔离与受控兼容两个 profile。严格候选使用 AITransport 专属 ephemeral/no-cache/no-cookie/no-persistent-credential session、拒绝全部 3xx，并禁止 WebView/remote Image 加载 Provider 内容；RN `fetch` 只有在原生 Spike 证明 redirect/cache/cookie/credential/取消/临时文件性质后才能采用，否则需窄接口 Swift/Expo Module transport。请求/响应临时文件在成功、失败、取消、超限、wipe 和启动恢复时清理。精确资源预算另由 D-034 决定。

本节仍是 proposed，不改变 ADR 的 accepted 范围，也不能在 Owner 决策前冒充 D-004 的结论。

## 验证

- 源码规则阻止 AI infrastructure 外的 `fetch`/网络客户端导入。
- URLProtocol/代理测试覆盖完整核心流程，请求数为零。
- AI 请求测试覆盖 HTTPS、未确认 origin 泄露防护、取消、超时、错误状态和恶意响应；query/fragment、3xx 与 session 行为按 D-036 最终 profile 生成用例。
- 数据库变更集证明所有失败和候选结果确认前零写入；营养标签照额外证明没有本次预览 token 就不发送。
- Release 产物静态扫描不存在默认 API key、Authorization 和未批准 host。
- Debug/Release 分别做全进程捕获；若 D-036 选择严格 profile，还要证明 cookie/cache/persistent credential 不落盘，AI 临时目录在所有终止路径为空。

## 复审条件

若未来要求在线同步、共享 key 代理、远程数据更新或 Push，必须新建业务/隐私/成本决策，并明确这将改变本 ADR 的核心承诺。
