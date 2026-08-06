# Domain Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/domain-contract-harness.mjs` 与 `tools/domain-contract-harness.test.mjs`

## 目的

这个 harness 把当前可以在 Windows 上验证的纯契约转成可执行证据，同时保持正式 React Native 工程、数据库、原生设备和网络边界未启动。它不依赖 React Native、SQLite、第三方包、网络或当前系统时钟。

当前覆盖：

- 质量与单位：显式支持 `mg/g/kg` 和 `kcal/kj`，未知单位、非有限数和非法范围拒绝。
- 日期上下文：必须显式传入 IANA 时区；日期从显式 instant 推导，校验 DST 跨日和日期不一致。
- 营养来源：保存 `sourceId`、`sourceVersion`；七项首版字段的缺失保持 `null` 并列入 `missingFields`，不把缺失变成零。
- 日账本：保存显式 `target/eaten/burned` 状态；`Left` 的派生策略保持 `PENDING`，没有目标时返回 `UNSPECIFIED`，不推导 F04/F05 或 D-040 的健康公式。
- 本地 CRUD 原子性：添加、更新、删除使用纯状态事务；重复 ID、缺失 ID 和非法输入失败时返回旧状态，证明零写入语义。

## 明确不授权

本工件不是正式 Domain 源码、RN scaffold、SQLite schema、营养目标实现或 Owner 决策。它不冻结 D-018/D-019/D-020/D-021/D-023/D-024/D-025/D-032/D-037，不改变 D-039/D-040 状态，也不记录 Owner intake。宏量比例、BMR/TDEE、特殊人群目标和健康评分仍为 `UNSPECIFIED/PENDING`，必须等待对应研究、Owner 选择和门禁。

## 验证

```powershell
node --test tools/domain-contract-harness.test.mjs
```

测试只使用 Node 内置 `node:test` 与 `node:assert/strict`，后续可在 Owner 完成首批回读和正式工程门禁后迁移为批准测试层的实现。
