# 离线营养数据包与签名导入

> 状态：G4 初版
>
> 关联决策：D-002、D-012、D-013；签名细节待 D-026；USDA 境外再分发待 D-052（原临时编号 `DLR-C01`）由 Owner 处理

## 1. 已批准范围

首发数据来源限定为：

- 台湾食药署 `食品營養成分資料集`：保留原文和台湾 OGL v1 完整显名；简体中文只作为可追踪搜索别名或经过审查的展示字段。
- USDA FoodData Central Foundation Foods 与 SR Legacy：作为两个独立来源包补充基础食材，不假设其覆盖中国包装食品，不标为 CC0 或“全球 public domain”。
- 用户自建食物与条码：独立于上游记录，可覆盖展示但不能改写原始来源。

Open Food Facts 只能作为未来独立、可替换并遵守 ODbL 的候选包；不属于 D-002 已批准的首发基础组合。无公开再分发许可的数据不得抓取、打包或随 App 分发。

数据更新只有两条渠道：随 App 发版，或用户从 Files 手动导入签名包。生产 App 不在线拉取数据包。D-002 批准的是数据源方向，不自动批准任何司法辖区的再分发；D-052 未处理前，面向美国境外朋友/TestFlight 的构建只能内置满足显名门禁的台湾包，USDA 可继续用于本地研发但不得进入该分发构建。

台湾、USDA Foundation、USDA SR Legacy 使用独立包；若构建工具内部共享容器，也必须物理分区、逐记录标源并附独立 NOTICE。用户自建数据只存在于 SQLCipher 业务库和用户加密备份，绝不自动进入官方签名包。

## 2. 逻辑包格式

建议的容器结构如下；签名算法仍待 D-026 决策：

```text
nuttie-data-pack/
  manifest.json
  manifest.signature
  payload/
    catalog.sqlite
    aliases.ndjson          # 可选
  metadata/
    provenance.ndjson       # 必需，逐记录来源索引
    transforms.json         # 必需，转换步骤与版本
  license/
    NOTICE.txt
    LICENSE.txt             # 上游确有许可证正文时才包含
```

`manifest.json` 必须使用可重复的规范化序列化，并至少包含：

```json
{
  "formatVersion": 1,
  "packId": "source.catalog.variant",
  "packVersion": "2026.07.0",
  "createdAt": "2026-07-31T00:00:00Z",
  "minimumAppVersion": "0.1.0",
  "schemaVersion": 1,
  "source": {
    "datasetId": "...",
    "name": "...",
    "version": "...",
    "url": "https://official.example/...",
    "retrievedAt": "2026-07-31T00:00:00Z",
    "rawArtifactSha256": "...",
    "licenseId": "...",
    "attribution": "..."
  },
  "transformVersion": "...",
  "recordProvenanceVersion": 1,
  "nutrients": ["energy", "protein", "carbohydrate", "fat", "fiber", "sugar", "sodium"],
  "files": [
    {"path": "payload/catalog.sqlite", "size": 0, "sha256": "..."},
    {"path": "metadata/provenance.ndjson", "size": 0, "sha256": "..."},
    {"path": "metadata/transforms.json", "size": 0, "sha256": "..."},
    {"path": "license/NOTICE.txt", "size": 0, "sha256": "..."}
  ],
  "signature": {"algorithm": "pending-D-026", "keyId": "..."}
}
```

签名究竟覆盖 RFC 8785 JCS 等规范化字节，还是发布工具生成且导入端逐字节验证的原始 manifest，必须由 D-026 冻结。无论选择哪一种，包内允许的完整 entry 集、每个载荷的字节数与 SHA-256 都必须受签名内容约束；NOTICE、许可证正文、provenance 索引和转换元数据与 catalog 同样属于受签名 entry。当前推荐 profile 把 provenance 与 transforms 落为上面两个独立必需 entry：`provenance.ndjson` 每行使用严格 schema 绑定 source record、catalog record、source/version/license 与原始工件定位；`transforms.json` 使用严格 schema 记录有序步骤、transform version、工具版本、字段筛选、单位换算、舍入与别名规则。没有转换时也必须写入显式 no-op 记录，不能省略后让 verifier 猜测。

D-026 必须冻结这两个工件的唯一表示、精确 schema/编码、空值语义和是否允许扩展字段；若 Owner 选择另一种受约束表示，必须同步替换本文结构和 golden corpus，不能同时接受多种含义相同但字节不同的表示。manifest `files` 必须逐项列出 catalog、NOTICE、实际存在的 LICENSE、provenance、transforms 和任何 aliases；导入端拒绝 manifest 未列出的额外文件、缺失文件、大小写/NFC 碰撞和规范化后重复路径。App 内只嵌入受信任公钥与版本化撤销元数据，不嵌入签名私钥。D-026 未获 Owner 接受前，不得发布 Files 签名包导入。

## 3. 数据模型不变量

至少需要下列逻辑实体；具体 ORM 尚待 D-020：

- `data_pack`：包 ID、版本、来源、许可、签名 key ID、激活状态。
- `source_record`：上游稳定 ID、原始名称、原始语言、版本、source pack、license ID 和原始值定位。
- `food`：标准展示记录和可食部基准。
- `nutrient_definition`：营养素标识、维度、标准单位。
- `food_nutrient`：原值、原单位、标准化值、测量语义。
- `portion`：份量、重量、来源和估算标记。
- `barcode`：GTIN 与食物映射；GTIN 不推断产地或营养值。
- `alias`：简中、繁中、英文和用户别名，保留来源。
- `license_notice`：署名文本、许可证 URI、NOTICE hash 和 App 内展示要求。
- `user_food` / `user_override`：用户记录，绝不修改上游表。

数值规则：

- `0`、缺失和 trace/微量必须是不同状态。
- 同时保留原始 kcal/kJ 和标准化能量，不能用换算结果覆盖标签原值。
- 标准比较基准为每 100g 可食部；每份值保留自己的份量来源。
- 能量、蛋白质、碳水、脂肪、纤维、糖、钠必须有稳定 ID 和单位规则。
- 不允许 AI 自动补齐缺失营养值或覆盖有来源的记录。

## 4. 导入与激活协议

1. 用户在 App 内选择“导入数据包”，系统 Files picker 返回只读引用。
2. 将包复制到 App 受控 staging 目录，不直接在外部 provider 上解析。
3. 在解压前检查容器字节数；解压过程中限制文件数量、单文件大小、总大小和压缩比。
4. 规范化每个路径，拒绝绝对路径、`..`、链接、控制字符、大小写/NFC 碰撞和重复名称。
5. 在验签前只用严格、受预算约束的解析器读取 manifest：D-026 必须冻结压缩/解压 manifest 最大字节、JSON 最大深度、对象字段数、数组元素数、字符串/path/keyId 长度和数字边界；拒绝重复 key、未知关键字段、非有限数字和不符合所选 canonical profile 的表示。随后检查 `formatVersion`、`minimumAppVersion`、`schemaVersion`、nutrient 范围和来源许可。该预解析只用于 fail-fast 和定位 `keyId`，不把 manifest 视为已认证。
6. 使用 `keyId` 找到内置受信任公钥，并按 D-026 批准的精确字节规则验证 detached signature。
7. 枚举容器完整 entry 集，拒绝未列出、缺失或重复 entry；逐文件验证 size 和 SHA-256。
8. 验证 SQLite `integrity_check`、只读 schema 和业务约束；在 staging DB 建索引并运行抽样查询、计数和来源一致性检查。
9. 对完整 staging tree 设置文件保护与不备份属性，重新读取校验，并写入内容哈希/完成标记；此后内容不可变。
10. 展示来源、许可、版本、预计空间和替换影响，由用户确认激活。
11. 将完整 staging tree 在同一卷内原子 rename 到不可变 `packs/<packId>/<version-or-content-id>/` final 目录，并同步 final 文件与父目录元数据。
12. 原子创建并持久化不含隐私的 `pack-activation-intent-v1`，记录 operation ID、new final ref、expected hash、previous active ref 和协议版本。
13. 在 SQLCipher 单事务中登记新包，把 `active ref` 切到 new final ref，并保留 `previous ref`；查询层只解析已提交的 DB ref，绝不扫描目录猜测 active pack。
14. 重开只读连接并校验 DB ref、final 完成标记和内容哈希一致；成功后清除 intent，再按保留策略清理 staging 与不再引用的旧包。

步骤 11 的文件 rename 与步骤 13 的 SQLite commit 分属不同持久化域，不能组成一个全局原子事务。本协议只承诺在启动对账后得到完整旧包或完整新包的 crash-consistent 状态，不宣称跨文件系统与 SQLite 的瞬时单事务原子性。任何失败都不得把半成品数据暴露给查询层。

### 4.1 启动对账

App 必须在开放数据包查询前，对账 `pack-activation-intent-v1`、SQLCipher 中的 active/previous refs、final 目录及完成标记：

- final 已存在但 DB 尚未提交：保持 previous active ref，删除或隔离未引用的 orphan final；这也覆盖 rename 成功但 intent 尚未写入的中断。
- DB 已提交且 new final 完整、哈希匹配：完成激活，清除 intent，并按保留策略处理 previous final。
- DB 指向的 new final 缺失、未完成或损坏：在 SQLCipher 单事务中回滚到仍完整的 previous ref，隔离损坏目录；若 previous 也不可用，则停止查询并进入明确恢复态。
- intent、ref 或 final 组合不属于已定义状态：保持写入关闭，输出不含敏感数据的本地诊断，不创建空包或猜测最新目录。

对账与清理必须幂等。步骤 2 至 13 的每个可持久化边界都要强制 kill/restart，验证启动对账后只有完整旧包或完整新包，且孤立 staging/final 最终被清理。

## 5. 更新、回滚与密钥轮换

- 包版本与 App 版本分离；同一 `packId` 默认只允许升级。
- 降级必须显示警告、受影响版本和数据量，并由用户明确确认。
- 激活记录保留前一版本 ref 和完整性元数据；保留周期与清理只在新包启动校验通过后执行。
- 签名公钥使用 `keyId` 版本化；撤销列表随 App 发版更新。
- 私钥只存在于受控发布流程，不进入仓库、App 或数据 ETL 日志。
- 对台湾、USDA Foundation、USDA SR Legacy 使用独立包；不得用单一 CC0/public-domain 声明覆盖不同权利来源。台湾包保留 OGL v1 显名，USDA 只使用经审查的说明文字，不使用 USDA/ARS/NAL logo 或暗示背书。
- 上游撤回或许可纠错时冻结受影响版本、定位已分发包，并通过 App 发版或 D-026 批准的撤销机制停用；不静默改写历史包。

## 6. 条码边界

扫码只产生条码字符串；查询结果取决于已安装本地包。必须提供：

- 相机拒绝后的手动输入条码。
- 未命中后的用户自建食物。
- 命中但七项营养不全时的缺失提示，不用零值伪装。
- 数据包缺失、签名失败或版本过旧的本地说明。

不得承诺未实测的中国包装食品命中率。发布前用用户和朋友真实购物篮 200–500 个条码，分别统计“条码命中”和“七项营养完整命中”。

## 7. 验收

- 固定测试包在同一输入上产生可重复 manifest 和哈希。
- 任意单字节篡改、错误 key ID、撤销 key、错误 schema 和缺失许可均拒绝导入。
- 修改 manifest、NOTICE、许可证、provenance 或转换元数据任意字节均导致验签/哈希失败；App 来源页、manifest 与台湾 NOTICE 的显名 golden test 必须一致。
- manifest 预认证解析覆盖最大字节、深度、字段/数组/字符串/路径/keyId/数字边界；深层 JSON、重复 key、未知关键字段、非有限数字、超长值和 canonical 数字边界全部在昂贵分配、KDF 或 payload 解析前拒绝。
- manifest `files` 必须完整列出 catalog、NOTICE、实际存在的 LICENSE、provenance、transforms 和 aliases；分别单字节篡改每类工件时，发布工具与 Swift verifier 的 golden corpus 都必须失败。
- ZIP bomb、路径穿越、重复条目和磁盘不足不改变 active pack。
- 步骤 2 至 13 的每个持久化点中断后，启动对账得到完整旧包或完整新包；不存在半激活、悬空 DB ref 或永久 orphan。
- 导入后每条记录可追溯到 source、source version 和 license notice。
- 构包保留最终官方 URL、抓取时间、上游版本、原始字节长度和 SHA-256；简中别名、字段筛选、舍入和单位转换可反查原值与 transform version。
- 官方包不含用户标签照、包装图、品牌素材、受保护文本或用户自建记录；用户数据只进入业务库和加密备份。
- 飞行模式下可完成包选择、验证、导入、查询和回滚。
- D-026 冻结算法、精确签名字节、完整 entry 规则、路径规范化、trust root、轮换/撤销与私钥发布流程，并经安全测试通过后，签名包导入才可发布。
- D-052 未由 Owner 处理前，USDA 原始或转换数据不得进入面向美国境外朋友的 TestFlight/IPA；台湾包也只有在显名与来源门禁通过后才可分发。
