# 本地档案事务与非级联删除合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/local-profile-record-harness.mjs` 与 `tools/local-profile-record-harness.test.mjs`

> 对应能力：F12/F17、REQ-F12/REQ-F17、AT-F12/AT-F17；不关闭 D-040 的字段、公式和多档案产品决策。

## 目的

Nuttie 需要无注册、无账号、无服务器的本地档案，也需要让资料可更正、可删除。当前权威研究尚未批准姓名、生日/年龄、公式分支、身高、体重、活动、目标等具体字段，也未批准单档案/多档案、当前档案选择或删除资料时的级联范围。

这个 harness 建立不依赖这些选择的完整事务底座：调用方显式提供一个版本化 opaque schema 定义和 JSON 文档，Repository 只负责安全边界、revision CAS、幂等、未知结果恢复、并发串行化与完整事务证据。它不认识任何产品字段，也不生成账号、会话或服务器身份。

## 文档与 schema

`LOCAL_PROFILE_DOCUMENT_V1` 包含：

```text
{
  schemaDefinition: {
    schemaVersion: "LOCAL_PROFILE_SCHEMA_DEFINITION_V1",
    definitionId,
    definitionVersion,
    payload
  },
  values
}
```

约束：

- definition ID、version、payload 和 values 都由调用方明确提供；
- 空 payload 与空 values 合法，合同不会补姓名、生日、年龄、性别/公式分支、身高、体重、活动或目标；
- 相同 definition ID+version 不得在记录集合或更新时对应不同 payload；
- JSON 只允许普通对象、数组、字符串、有限数字、布尔和 null；拒绝危险 key、特殊对象、循环、非有限数字与超预算结构；
- 合同保留值，不对字段含义、必填、单位、范围或健康适用性作解释。

这允许未来经 Owner 批准后以新 schema version 接入字段策略，但当前测试 payload 不是字段批准。

## 记录、命令与事务

`LOCAL_PROFILE_RECORD_V1` 有显式 `profileId`、revision、带偏移的 created/updated instant 和完整文档。

`LOCAL_PROFILE_COMMAND_V1` 支持：

- `CREATE`：调用方提供 profile ID、createdAt 和完整文档；
- `UPDATE`：提供 expectedRevision、updatedAt 和完整替换文档；
- `DELETE`：提供 expectedRevision 和 deletedAt。

更新与删除使用 revision CAS。command ID 绑定完整规范 payload；提交前失败不保留幂等结果，提交后响应未知时用同一命令重放并收敛。相同命令并发得到一次 commit 和一次 replay，竞争更新只有一个 revision 获胜。

Repository 可以保存多个显式 profile ID 以证明记录集合边界，但输出没有 `active/current/default/selectedProfileId`；这不等于多档案 UX 已授权，也不决定正式产品只能有一个或可以有多个档案。

## 非级联删除边界

事务 state 同时携带 `RELATED_LOCAL_DATA_EVIDENCE_V1`，只记录调用方给出的相关领域 record ID/revision，例如：

- `goal-versions`；
- `body-records`；
- `diary`；
- `water-records`。

所有 CREATE/UPDATE/DELETE 回执都必须证明：

```text
relatedDataMutation = "NOT_AUTHORIZED"
relatedEvidenceFingerprintBefore == relatedEvidenceFingerprintAfter
relatedEvidenceUnchanged = true
```

因此“删除资料”只删除选中的档案记录，绝不静默级联删除 GoalVersion、BodyRecord、日记、饮水或其他领域数据。若未来 Owner 选择不同删除语义，必须新增范围明确的危险操作合同；不能扩写本命令。

## 当前自动化证据

20 项测试覆盖：

- 调用方版本化 opaque schema/JSON 原样保真与空文档；
- 危险 JSON、循环、特殊对象、非有限数、未知字段和资源滥用拒绝；
- 显式 revision/instant 记录与时间顺序校验；
- CREATE/UPDATE/DELETE 完整 before/after 与 affected-profile 证据；
- schema 新版本显式迁移与同身份定义漂移拒绝；
- 多个显式记录不生成当前/默认档案策略；
- 删除只改档案，目标/体重/日记/饮水相关证据不变；
- stale CAS、重复/缺失记录和倒退 instant 零变更；
- 提交前失败、提交后未知、幂等冲突和并发序列化；
- 输入顺序无关、状态/回执指纹和全证据防篡改；
- 深冻结、不读取系统时钟；无账号、服务器、字段默认、公式、级联删除、网络、原生、存储或密钥能力。

## 明确不授权

本合同不授权或冻结：

- 任何具体资料字段、必填性、单位、范围、文案、合法值或健康适用人群；
- 单档案、多档案、当前档案、切换、合并、分享或家庭成员 UX；
- 目标公式、重算、profile 与 GoalVersion/BodyRecord/日记的自动绑定；
- 删除资料时清除目标输入副本、目标历史、体重、日记、饮水或外部备份；
- 注册、登录、邮箱、手机号、密码、token、session、业务服务器或云同步；
- SQLite/SQLCipher schema、Repository 实现、迁移、React Native/Expo/原生工程；
- Gate、Owner intake 或正式实现状态变化。

## 验证

```powershell
node --test tools/local-profile-record-harness.test.mjs
node --test tools/*.test.mjs project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
git diff --check
```

下一步若要接产品字段或 profile/target 关系，必须先完成 D-040 对字段、保存策略、重算、历史和删除语义的 Owner 选择，再用新 schema version 和独立关系/删除事务合同实现。
