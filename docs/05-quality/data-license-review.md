# Nuttie 食品数据许可与来源合规审查

> 审查日期：2026-07-31（Asia/Shanghai）  
> 审查角色：Data License Reviewer  
> 关联决定：D-002、D-012、D-017  
> 审查结论：`CONDITIONAL`  
> 分发门禁：`BLOCKED_FOR_NON_US_USDA_REDISTRIBUTION`  
> 性质：工程合规审查，不构成任何司法辖区的法律意见

## 1. 结论摘要

1. 台湾食药署 `食品營養成分資料集` 可以进入 Nuttie 可分发离线包，但必须完整履行台湾 `政府資料開放授權條款-第1版` 的显名义务。显名不是可选致谢；官方条款明确把未履行显名视为自始未取得授权。
2. USDA FoodData Central 官方页面确认 Foundation Foods 与 SR Legacy 可用于开发私营部门的商业营养软件和应用；当前下载版本分别为 Foundation Foods `2026-04` 与 SR Legacy `2018-04` 最终版。
3. USDA 两个官方 CSV ZIP 的中央目录均没有 `LICENSE`、`NOTICE`、`COPYING` 或 `TERMS` 文件。美国法 17 U.S.C. §105 只明确美国政府作品在美国不受版权保护，官方立法说明同时明确该规则不决定境外保护。因此不得把 USDA 数据写成 `CC0`，也不得把台湾与 USDA 的 Nuttie 组合包整体声明为“全球 public domain”。
4. D-002 的数据源方向可以继续；向中国或其他美国境外朋友/TestFlight 测试者再分发 USDA 原始或转换数据，必须先完成 Owner 候选 D-052（原临时编号 `DLR-C01`）。候选未接受前，随 App 可分发的内置数据只能启用已满足显名门禁的台湾包。
5. 用户自建营养事实可保存在本机 SQLCipher 数据库并进入用户主动创建的加密备份。第三方包装图、品牌图、标签照片、商标素材和大段受保护文本不得默认进入 Nuttie 官方签名包，也不得因“用户录入”自动获得再分发权。
6. 台湾、USDA 与用户自建数据必须保持独立 provenance。许可义务不同的数据应分包；至少也必须物理分区、逐记录标源并拥有独立 NOTICE，不能用一个总许可证覆盖全部内容。

## 2. 审查范围与方法

审查对象：

- [Owner 决策台账](../00-governance/decision-register.md) 中的 D-002、D-012、D-017。
- [产品范围基线](../02-product/scope-baseline.md) 的来源、许可和本地优先承诺。
- [离线数据包设计](../04-engineering/data/offline-data-packs.md) 的 manifest、NOTICE、签名与激活流程。
- 台湾政府资料开放平台、台湾食药署、USDA FoodData Central 与美国政府出版局的官方材料。
- USDA Foundation Foods 与 SR Legacy 官方 CSV ZIP 的 HTTP 元数据和 ZIP 中央目录。

仅使用官方可复核材料作许可结论。搜索摘要、第三方转载、社区回答和“公开下载等于可再分发”的推论均不作为授权依据。

本次没有下载并保存完整 USDA 归档，因此没有生成归档 SHA-256；正式构包流水线必须保存原始下载字节或不可变工件并计算 SHA-256。为核验随包文件，本次使用 HTTP Range 读取两个 ZIP 尾部并解析完整中央目录。

## 3. 官方证据登记

| ID | 官方来源 | 2026-07-31 核验事实 | 适用限制 |
| --- | --- | --- | --- |
| LIC-TW-01 | [data.gov.tw 数据集 8543](https://data.gov.tw/dataset/8543) | 名称 `食品營養成分資料集`；提供机关 `衛生福利部食品藥物管理署`；许可 `政府資料開放授權條款-第1版`；CSV/JSON/XML；数据最近变更 `2026-06-12 10:57:53 Asia/Taipei` | 数据集页是来源与许可权威入口；必须保留版本和抓取时间 |
| LIC-TW-02 | [台湾 OGL v1](https://data.gov.tw/license) | 允许不限目的、时间、地域的重制、散布、公开传输、编辑、改作、产品/服务开发及再授权 | 必须按附件显名；专利、商标与第三人权利不在授权内；有停止提供与免责声明条款 |
| LIC-TW-03 | [食药署详细页](https://data.fda.gov.tw/frontsite/data/DataAction.do?method=doDetail&infoId=20) | 官方数据详情与导出入口，InfoId `20` | 最终状态复查时该 host 的详情及全部导出入口出现 DNS/连接超时；构包不得在来源不可访问时静默换用镜像 |
| LIC-US-01 | [FoodData Central 下载页](https://fdc.nal.usda.gov/download-datasets/) | 最新 Foundation Foods 为 `2026-04`；SR Legacy 为 `2018-04` 最终版；官方提供 CSV/JSON 下载 | 下载可用性不是单独的许可授予 |
| LIC-US-02 | [FoodData Central 数据文档](https://fdc.nal.usda.gov/data-documentation/) | Foundation 是 USDA 分析值及元数据；SR Legacy 是历史食品成分数据，来源包括分析、计算和已发表文献 | 上游来源异质性要求保留字段级/记录级 provenance，不能假设每个附带元素都是纯联邦原创作品 |
| LIC-US-03 | [FoodData Central FAQ](https://fdc.nal.usda.gov/faq/) | 官方列明用途包括“Developing commercial nutrient analysis software and applications for private sector purposes” | 这是明确的用途说明，但页面没有给出 `CC0` 或全球无条件许可文本 |
| LIC-US-04 | [17 U.S.C. §105 官方文本](https://www.govinfo.gov/content/pkg/USCODE-2023-title17/html/USCODE-2023-title17-chap1-sec105.htm) | 美国政府作品在美国不受 Title 17 版权保护 | 定义限于政府雇员履行公务形成的作品；不当然覆盖承包商/第三方作品；官方立法说明明确不处理境外保护 |
| LIC-US-05 | [Foundation CSV 2026-04 ZIP](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip) | `Content-Length: 3,825,517`，`ETag: 69f28d62-3a5f6d`；中央目录含数据 CSV 与字段说明 XLSX，无许可/NOTICE 文件 | ETag 不是内容哈希；正式入库必须计算 SHA-256 |
| LIC-US-06 | [SR Legacy CSV 2018-04 ZIP](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip) | `Content-Length: 6,074,592`，`ETag: 65398c05-5cb0e0`；中央目录含数据 CSV 与字段说明 XLSX，无许可/NOTICE 文件 | 同上；不能从文件缺失反推出禁止使用，也不能反推出 CC0 |

台湾食药署另有官方 [CSV](https://data.fda.gov.tw/opendata/exportDataList.do?method=ExportData&InfoId=20&logType=2)、[JSON](https://data.fda.gov.tw/opendata/exportDataList.do?method=ExportData&InfoId=20&logType=5)、[XML](https://data.fda.gov.tw/opendata/exportDataList.do?method=ExportData&InfoId=20&logType=1) 和 [OAS](https://data.fda.gov.tw/opendata/exportDataList.do?method=openDataApi&InfoId=20) 入口。构包流水线应固定一种原始格式，并记录最终 URL、响应时间、上游版本、字节长度与 SHA-256。

## 4. 台湾食药署数据审查

### 4.1 可执行权利

台湾 OGL v1 的官方文本允许在遵守条款前提下：

- 重制、散布、公开传输；
- 编辑、改作与开发产品或服务；
- 再授权；
- 不限目的、时间与地域，且原则上免费、非专属、不可撤回。

这足以支持 Nuttie 做字段筛选、单位标准化、繁体原名保留、简体搜索别名、SQLite 转换、签名包分发和 App 内离线查询。

### 4.2 必须履行的义务

每个台湾数据包的 `manifest`、`license/NOTICE.txt` 和 App“数据来源”页必须包含等价于官方附件的完整显名声明：

```text
提供機關／單位 [年份] [開放資料釋出名稱與版本號]
此開放資料依政府資料開放授權條款 (Open Government Data License) 進行公眾釋出，
使用者於遵守本條款各項規定之前提下，得利用之。
政府資料開放授權條款：https://data.gov.tw/license
```

实际构包不得保留方括号占位符。年份、名称和版本必须由已固定的源工件生成，并另外记录：

- 提供机关：`衛生福利部食品藥物管理署`；
- 数据集：`食品營養成分資料集`；
- 数据集 ID：`8543`；
- 源 URL、抓取时间、上游数据变更时间、原始格式与 SHA-256；
- Nuttie 的加工说明，例如“新增简体搜索别名、筛选七项首版营养字段、做单位规范化”；
- 不构成食药署对 Nuttie 的推荐、核准或背书。

不得把台湾 OGL 的许可标识替换成 `CC0`、`public-domain` 或 Nuttie 自有许可证，也不得用 Nuttie 的转换说明遮蔽原提供机关。

### 4.3 上游停止与纠错

台湾 OGL 允许机关因公共利益、第三方知识产权、隐私等风险停止提供资料，且原则上无赔偿义务。构包流程必须保留上游撤回/纠错处置：

1. 冻结受影响源版本，不再生成新包。
2. 记录受影响记录和已分发包版本。
3. 通过下一个 App 版本或经 D-026 批准的签名撤销机制停用有问题的包。
4. 保留审计记录，不静默改写已发布版本。

## 5. USDA FoodData Central 审查

### 5.1 已确认的可用范围

FoodData Central 官方 FAQ 明确把商业营养分析软件和私营部门应用列为用途。因此 Foundation Foods 与 SR Legacy 可以作为 Nuttie 数据模型、搜索和营养计算的数据来源，D-002 不需要因“商业 App”而撤销。

准确数据名和版本必须使用：

- `USDA FoodData Central Foundation Foods, April 2026`；
- `USDA FoodData Central SR Legacy, April 2018 (final release)`。

不得把 SR Legacy 写成仍持续更新，也不得把 Foundation Foods 的版本写成“latest”后丢失发布日期。

### 5.2 不得作出的许可宣称

- 不得写 `CC0`：官方页面和官方 ZIP 均未提供 CC0 dedication。
- 不得把整个 Nuttie 数据库写成 `public domain`：台湾数据受 OGL 显名条件约束，用户自建和 Nuttie 转换层也有不同权利边界。
- 在没有额外官方确认时，只能把符合 17 U.S.C. §105 定义的部分描述为 `U.S. Government work; not subject to U.S. copyright under 17 U.S.C. §105`，不能扩张成“全球无版权”。
- 不得复制 USDA、ARS 或 FoodData Central 的徽标作为许可标志，也不得暗示 USDA 审核、推荐或保证 Nuttie 的营养结果。

### 5.3 境外再分发缺口

Nuttie 的预期测试者位于美国境外的可能性很高，而 §105 的官方立法说明明确表示该条不影响外国保护。官方 FAQ 的商业应用用途说明降低了使用风险，但目前没有在官方数据页或 ZIP 中找到包含全球再分发、改作、转授权和免责边界的明确许可证文本。

因此，在 Owner 明确接受 D-052 前：

- 可继续做 schema、转换器、测试夹具和本地研发；
- 不得把 USDA 原始或转换数据放入面向境外朋友的 TestFlight/IPA；
- 不得把“官方可下载”“可用于商业应用”自动改写成“全球 public domain/CC0”；
- 应向 USDA Agricultural Research Service / National Agricultural Library 请求书面澄清，问题至少覆盖境外再分发、转换数据库、随 App 打包、署名建议、免责声明和第三方来源字段。

## 6. 用户自建数据

### 6.1 允许的本地行为

- 用户手工输入名称、份量和营养事实；
- 用户为自己的记录绑定 GTIN；
- 在 SQLCipher 中保存，并按 D-006 进入用户主动创建的加密备份；
- 保留 `sourceKind=user`、创建/修改时间和用户覆盖关系。

### 6.2 不进入官方签名包的内容

- 他人的营养标签或包装照片；
- 品牌 logo、包装插画、商品宣传图；
- 从网站、书籍或数据库复制的大段说明文本；
- 未取得许可的第三方数据库批量导入；
- 仅因条码相同而复制的第三方商品图片或完整商品描述。

营养数值通常属于事实，但具体标签版式、图片、文字表达、商标和数据库选择/编排仍可能受其他权利保护。App 应提示用户只录入其有权保存的内容；该提示不能替代 Nuttie 发布官方包时的来源审查。

用户自建数据必须留在业务数据库和用户加密备份中。若未来增加“分享自建食品包”，必须新建立项并审查权利声明、去图像策略、接收者信任、签名者身份和撤回机制；当前 D-012 不自动批准此能力。

## 7. 组合包与 provenance 硬门禁

推荐物理分包：

| 包 | 建议包 ID | 许可标识 | 分发状态 |
| --- | --- | --- | --- |
| 台湾食药署 | `tw-fda-food-nutrition` | `TW-OGDL-1.0`，带完整显名 | 显名测试通过后可分发 |
| USDA Foundation | `usda-fdc-foundation` | `US-GOV-PD-US`，不得标 CC0 | D-052 前不得境外分发 |
| USDA SR Legacy | `usda-fdc-sr-legacy` | `US-GOV-PD-US`，不得标 CC0 | D-052 前不得境外分发 |
| 用户自建 | 不作为官方数据包 | `USER_LOCAL` | 仅业务库/加密备份 |

`US-GOV-PD-US` 是 Nuttie 内部合规分类，不是 USDA 发布的许可证名称，UI 应显示解释性文字而不是把它伪装成官方 SPDX ID。

每个包的 manifest 至少需要：

```json
{
  "sourceDatasetId": "8543 or FDC data type",
  "sourceName": "exact official dataset name",
  "sourceVersion": "immutable release identifier",
  "sourceUrl": "https://official.example/...",
  "retrievedAt": "RFC3339 timestamp",
  "rawArtifactSha256": "64 lowercase hex",
  "licenseId": "TW-OGDL-1.0 or internal reviewed classification",
  "noticeSha256": "64 lowercase hex",
  "transformVersion": "immutable transformer version",
  "recordProvenanceVersion": 1
}
```

每条食品记录至少保留 `sourcePackId`、`sourceRecordId`、`sourceVersion`、`licenseId`、原始名称、原始单位/值、转换版本和本地别名来源。Nuttie 的筛选、翻译、舍入和单位换算必须可以与上游原值区分。

D-026 的签名字节定义必须覆盖 manifest、NOTICE、provenance 索引、数据库内容哈希和所有转换元数据；否则攻击者可保留数据签名却替换许可声明。

## 8. Owner 候选 D-052（原 `DLR-C01`）

状态：`CANDIDATE`。PM 已将审查临时编号 `DLR-C01` 正式映射为全局 D-052；旧编号只作为历史 alias。本报告没有批准任何选项。

**题目：USDA 数据面向美国境外朋友的再分发口径**

**A. 先确认、期间仅台湾内置（推荐）**

- 在获得 USDA ARS/NAL 对境外再分发和转换包的书面澄清前，Release/TestFlight 内置只包含台湾 OGL 合规包。
- USDA 转换器和本地研发可继续，但产物不进入境外分发构建。
- 获得确认后，仍按 Foundation/SR 独立包、文本署名、无 logo、无背书、非 CC0 的方式发布。

**B. 接受境外权利残余风险并分包发布**

- 依据官方商业应用用途说明和美国政府作品规则，在境外 TestFlight 中分发来源隔离的 USDA 包。
- 明确只声明美国境内 public-domain 依据，不声明 CC0 或全球无权利。
- Owner 显式接受缺少全球许可证文本的剩余风险。

未收到 Owner 明确回复时，状态保持 `CANDIDATE`，执行 A 的阻断边界，但不能把 A 写成已接受产品决定。

## 9. 发布前验收

以下证据全部存在后，台湾包可解除许可门禁：

- 原始官方工件、最终 URL、抓取时间、上游版本、字节长度和 SHA-256；
- App 来源页、manifest 和 NOTICE 三处显名的 golden test；
- 简中别名、字段筛选、单位转换与原始值的可追溯抽样；
- 无食药署、USDA、ARS logo 或背书文案；
- 包内不存在用户照片、包装图或未审第三方文本；
- 修改 NOTICE 任意字节会导致 D-026 签名校验失败；
- 上游撤回/纠错演练能定位受影响版本和记录；
- 每次发版重新检查官方许可页和数据集元数据，没有静默沿用旧结论。

USDA 包还必须满足：

- Owner 已处理 D-052；
- 若选择 A，保存 USDA/NAL 书面澄清与适用范围；
- Foundation/SR 使用准确版本，不使用 `latest` 作为持久标识；
- NOTICE 说明数据来源、Nuttie 转换、美国法口径、无背书和数据免责声明；
- 包和 App 不出现 `CC0` 或“全球 public domain”误述。

## 10. 门禁结论

| 范围 | 结论 | 原因 |
| --- | --- | --- |
| 台湾食药署包 | `PASS_WITH_MANDATORY_CONTROLS` | OGL v1 权利明确；显名、来源和撤回控制必须落实 |
| USDA 本地研发 | `PASS_WITH_CONTROLS` | 官方明确支持商业应用用途；需精确版本和 provenance |
| USDA 美国境外再分发 | `BLOCKED_PENDING_OWNER_DECISION` | ZIP 无许可文件，§105 不决定境外保护，缺少全球再分发文本 |
| 用户自建本地记录/加密备份 | `PASS_WITH_CONTENT_BOUNDARY` | 仅本地、独立 provenance；禁止自动进入官方包 |
| 台湾 + USDA + 用户数据统一许可包 | `REJECTED` | 权利来源和义务不同，统一 CC0/public-domain 声明不成立 |

本结论不否定 D-002；它把 D-002 落成可执行的构包、署名和分发边界。G4 只有在许可登记、包结构和 D-052 的相应阶段门禁被处理后，才能声称食品数据分发无阻断项。
