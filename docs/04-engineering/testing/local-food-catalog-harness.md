# Local Food Catalog Contract Harness

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

路径：`tools/local-food-catalog-harness.mjs` 与 `tools/local-food-catalog-harness.test.mjs`

## 目的

这个 harness 把 D-002、D-012、D-013 与 F03/J-03 中可在 React Native 和 SQLite 初始化前验证的本地食品目录不变量变成可执行合同。它消费已经通过导入边界验证并激活的数据包分区、用户自建食品和本地展示覆盖，提供确定性的食品搜索与 GTIN 精确查询。

它不读取真实数据包、不验签、不访问网络、不创建 SQLite/SQLCipher schema，也不实现相机扫码、份量换算、餐食保存或正式 UI。

## 数据与来源边界

目录只接受四类明确来源：

- `USER`：用户自建食品，独立存放在 `SQLCIPHER_USER_FOOD` 分区；
- `TW_FDA`：台湾食药署数据包；
- `USDA_FOUNDATION`：USDA Foundation 数据包；
- `USDA_SR_LEGACY`：USDA SR Legacy 数据包。

上游分区不能靠普通对象中的状态字符串声明自己已验证。catalog 只接受 `createVerifiedPackCatalogSnapshot` 签发并由进程内 WeakMap 绑定内容的 opaque snapshot；复制、序列化或手写一个外形相同的对象都会被拒绝。这个签发函数是测试中的 verified importer/repository port 替身，不执行密码学验证；正式 adapter 只能在许可、签名、完整性、active ref 和内容 hash 全部通过后签发等价 snapshot。

同一 `sourceKind/sourceId` 一次只允许一个 active ref，storage partition 使用同一规范键绑定来源和 active ref，避免“唯一性检查”和“实际分区”使用不同身份。用户记录永远不自动进入上游包。

每条记录使用 `sourceKind/sourceId/recordId` 组成的 qualified ID，并保留 `sourceVersion`、`packId`、`packVersion`、`activeRef`、内容 hash、license ID、NOTICE hash、transform version、source record ID 与 storage partition。同一 GTIN 可以存在于不同来源，但同一来源内不得映射到多条记录；跨来源冲突返回按来源排序的候选，不静默合并营养值。

## 营养事实合同

七项首版营养字段固定为能量、蛋白质、碳水、脂肪、纤维、糖和钠。每一项都是显式 fact：

| 字段 | 含义 |
| --- | --- |
| `value` / `standardUnit` | 供本地计算使用的标准值与标准单位 |
| `status` | `SOURCE_REPORTED`、`MEASURED`、`ESTIMATED`、`TRACE` 或 `MISSING` |
| `originalValue` / `originalUnit` | 来源中的原始数值与单位；单位维度和换算结果必须与标准值一致 |
| `originalText` | 来源只有 trace 等文本表达时保留的原文 |

`MISSING`、`TRACE`、数值 `0` 与 `ESTIMATED` 是四种不同语义。`MISSING` 和 `TRACE` 的标准值都为 `null`，但分别进入 `missingFields` 和 `traceFields`；trace 还必须保留未经 NFKC、trim 或空白折叠改写的原文，并满足窄 trace 表达合同。估算值进入 `estimatedFields`，不能伪装为来源直接报告值。

上游包和用户食品使用不同的状态白名单。用户只能声明 `USER_ENTERED`、`USER_CONFIRMED`、`USER_ENTERED_TRACE` 或 `MISSING`，不能把输入提升为 `MEASURED` 或 `SOURCE_REPORTED`。标准单位只接受已知维度的 `kcal/kJ/g/mg` 换算，值与原值不一致时失败关闭。

每条食品显式携带 `basis` 与 `originalBasis`。当前合同只接受两者完全相同，支持每 100g、每 ml、每份或每包装的原始基准；没有已批准份量质量和转换规则时，不会把每份食品静默改写成“每 100g 可食部”。

展示覆盖只能修改上游记录的显示名与别名，并保留独立的本地 provenance；它不能注入营养事实、改写来源原文或作用于用户食品。

## 查询合同

`lookupLocalFoodByGtin` 只接受受支持长度的纯数字 GTIN 字符串并保留前导零。命中时返回所有本地候选；未命中时唯一内建后续动作是 `CREATE_USER_FOOD`，不会请求在线商品库、猜测商品或承诺覆盖率。

`searchLocalFoods` 对显示名、来源原名和别名执行本地确定性匹配，顺序为 exact、prefix、token prefix、substring，再按来源、显示名和 qualified ID 稳定排序。空查询不会替换成最近使用；拼音、模糊搜索、收藏、评分和在线 fallback 不在此合同内。

所有公开结果都复制并深度冻结，调用方之后修改 pack、用户食品或查询结果不能重写目录事实。

## 当前证据

24 项 catalog 测试覆盖：来源分区与离线策略、opaque snapshot、前导零 GTIN、跨来源候选、空目录与未命中、非法 GTIN、搜索排序与来源过滤、原文/别名、输入顺序稳定性、缺失/trace/估算/零值、V2 餐食快照的 commit/settle/replay 往返、单位/基准/status 失败关闭、完整 provenance、展示覆盖、同来源歧义、营养字段拒绝、调用方污染和能力面负向检查。共享 V2 快照另有 8 项直接合同测试。

## 明确不授权

本 harness 不批准真实食品数据、USDA 境外再分发、D-026 签名方案、D-052、SQLite/SQLCipher adapter、数据包切换事务、中文分词/拼音/模糊搜索、最近/收藏、条码命中率、相机权限、份量单位、营养编辑、餐食保存或正式页面方案。D-039 和其余 Owner 决策保持原状态。

## 验证

```powershell
node --test tools/local-food-catalog-harness.test.mjs
node --test tools/nutrition-fact-snapshot-harness.test.mjs
node --test tools/data-pack-contract-harness.test.mjs
node --test tools/*.test.mjs
node --test project-ops/*.test.mjs
node project-ops/validate.mjs
node project-ops/reconcile.mjs
git diff --check
```

这些命令只证明框架无关的目录合同。正式实现仍需在数据许可与工程门禁满足后，用真实导入 adapter、SQLite/SQLCipher 查询、进程恢复、性能预算和 iPhone 扫码流程重新提供证据。
