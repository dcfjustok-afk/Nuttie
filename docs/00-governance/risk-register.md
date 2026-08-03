# 初始风险台账

| ID | 风险 | 可能性 | 影响 | Owner/负责人 | 当前应对 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | 公开资料无法验证会员/隐藏路径 | 高 | 中 | 产品 | D-001 将公开资料设为验收口径；9 项只作机会清单 | ACCEPTED |
| R-002 | 共享 AI key 在客户端泄露 | 高 | 高 | 架构/安全 | D-003 每人 BYOK；禁止 IPA 内置共享 key | MITIGATED_BY_DESIGN |
| R-003 | AI 请求泄露图片或健康信息 | 中 | 高 | 安全 | HTTPS、最小数据、去 EXIF、不记敏感日志；标签照片按 D-014 逐次预览，其他载荷待 D-033；Provider/载荷用途按 D-053 本地版本化 profile 准入 | OPEN_REVIEW |
| R-004 | 中国包装食品条码命中率不足 | 高 | 高 | 产品/数据/QA | 本地精确查询后允许用户自建/AI；Beta 前测试 200-500 个真实条码 | OPEN |
| R-005 | 食品数据再分发或 ODbL 违规 | 中 | 高 | 架构/Release | 仅用许可明确数据；来源/版本/许可登记；OFF 若启用必须独立包 | OPEN_REVIEW |
| R-006 | 本地数据因卸载或设备损坏永久丢失 | 中 | 高 | 产品/架构/QA | 主动加密备份、恢复验证、风险提示 | OPEN |
| R-007 | SQLCipher 密钥丢失导致数据库不可恢复 | 低/中 | 高 | 架构/安全 | Keychain 生命周期、备份密钥派生和故障流程需专项设计 | OPEN_REVIEW |
| R-008 | Keychain 重装残留破坏“删除全部数据”承诺 | 中 | 中 | 架构/QA | 删除流程显式清理 DB、媒体、缓存、备份临时文件与 Keychain | OPEN |
| R-009 | Windows 无法完成 iOS 原生构建与真机验证 | 高 | 高 | PM/Release | 文档与 JS 可在 Windows；G6 前必须提供 Mac、Xcode 和真实 iPhone | OPEN |
| R-010 | TestFlight 构建 90 天失效 | 高 | 中 | Release | 仅用作开发期；稳定后提交长期渠道决策 | ACCEPTED |
| R-011 | 未批准库级选型被写成既定事实 | 中 | 中 | PM/架构 | accepted/candidate 严格分离；G4 检查 Owner 决策链 | OPEN |
| R-012 | 健康/营养建议被误认为医疗建议 | 中 | 高 | 产品/设计/安全 | 明确非医疗边界、特殊人群提示、可编辑 AI 输出与来源 | OPEN_REVIEW |
| R-013 | AI 兼容端响应不稳定或恶意 | 中 | 高 | 架构/QA | 结构校验、数值/单位范围、超时、取消、大小限制、人工确认 | OPEN_REVIEW |
| R-014 | 签名食品包损坏或回滚污染主库 | 中 | 高 | 架构/QA | 临时库导入、签名/摘要/schema 校验、事务切换与回滚 | OPEN_REVIEW |
| R-015 | 用途未知、不相容或政策已变化的 AI Provider 接收健康/营养载荷 | 中 | 高 | 安全/产品/Release | D-053；本地 `ProviderPolicyProfile` 默认为 `UNKNOWN/BLOCKED`；host/model/payload/profile 变化失效；Apple 明确禁项不可豁免 | OPEN_REVIEW |

风险状态不等于风险已消失。`ACCEPTED` 表示 Owner 接受该约束或剩余暴露；`MITIGATED_BY_DESIGN` 仍需测试证明；`OPEN_REVIEW` 必须在 G4 前由独立安全或 QA 角色审查。
