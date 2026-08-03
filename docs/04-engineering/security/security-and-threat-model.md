# 安全设计与威胁模型

> 状态：G4 初版
>
> 关联决策：D-002、D-003、D-004、D-006、D-012、D-014、D-015；安全细节候选 D-026、D-027、D-034、D-036、D-053；数据许可候选 D-052（原临时编号 `DLR-C01`）

## 1. 保护目标

| 资产 | 敏感度 | 主要存放位置 | 保护要求 |
| --- | --- | --- | --- |
| AI API key | 最高 | Keychain | ThisDeviceOnly、不可导出、不可记录 |
| Provider policy profile | 高 | App 内置或 Owner 审核后的本地版本化配置 | 完整性、证据版本、到期失效、默认拒绝；不含 key |
| SQLCipher 数据库密钥 | 最高 | Keychain | 随机生成、ThisDeviceOnly、不可进入备份 |
| 饮食、体重、目标和备注 | 高 | SQLCipher SQLite | 静态加密、事务完整性、明确删除 |
| 图片和标签照 | 高 | App sandbox 临时/媒体目录 | 最小保存、文件保护、去元数据；营养标签照按 D-014 逐次预览，其他载荷待 D-033 |
| 加密备份 | 高 | 用户选择的 Files 位置 | 认证加密、版本化、错误口令不可泄露内容 |
| 离线营养数据与许可 | 中 | 签名数据包/SQLite | 完整性、来源、署名、可回滚 |
| Widget/App Group 快照 | 中到高 | App Group | 最小化、可过期、锁屏披露可控 |
| 本地诊断日志 | 中 | App sandbox | 脱敏、限额、可删除、默认不导出 |

## 2. 信任边界

不可信输入包括：AI 响应、自定义 baseURL、用户选择的图片和文件、签名数据包外壳、加密备份、条码字符串、系统权限状态、App Group 旧快照以及所有第三方依赖输出。

可信根限定为：当前签名 App 二进制、内置数据包公钥集合、iOS Keychain、安全随机数源、经校验的当前数据库 schema 和用户在当前界面作出的明确确认。

## 3. 威胁与控制

| 威胁 | 影响 | 必须控制 | 剩余风险 |
| --- | --- | --- | --- |
| 把共享 AI key 打包进 IPA | 任意提取、滥用和费用损失 | D-003 BYOK；每人独立 key；Keychain | 设备所有者仍可在越狱/调试环境提取自己的 key |
| 恶意或误配 baseURL 外传数据 | 图片、文本泄露 | D-004 HTTPS；绝不向未确认 origin 发送 Authorization/载荷；营养标签照按 D-014 显示 host/载荷；精确 URL/redirect profile 待 D-036，其他载荷预览待 D-033 | 用户主动信任的 Provider 仍能读取所发送内容；严格 profile 可能不兼容部分 Provider |
| Provider 的保留、训练、人工访问、删除或广告/营销用途未知、不相容或已变化 | 健康/营养数据被用于未披露或 Apple 禁止的目的 | D-053；本地版本化 `ProviderPolicyProfile`；`DENY/UNKNOWN/EXPIRED` 与 scope 变化在读取 key/组装 body 前 fail closed；Apple 明确禁项不可由 Owner 豁免 | 政策文本和实际运营可能不一致，仍需逐 Provider 复核与发布后重新评估 |
| MITM/证书错误 | 密钥和数据泄露 | 系统 TLS 验证；Release 禁止 HTTP/self-signed | 自定义 Provider 的运营安全不由 Nuttie 控制 |
| AI prompt/响应注入 | 错误营养值或任意字段写入 | 响应按 `unknown` 解析；schema/范围/单位校验；用户二次确认 | AI 可能给出合理格式但事实错误的值 |
| 恶意数据包或供应链篡改 | 数据污染、路径穿越、DoS | detached signature、SHA-256、完整 entry/path 规则、解压配额、schema/业务校验、durable intent 启动对账 | 签名 profile、私钥发布、撤销和轮换待 D-026 |
| NOTICE、许可或 provenance 被替换/混淆 | 错误署名、来源不可追溯、越权再分发或将不同司法辖区权利错误合并 | 台湾、USDA Foundation、USDA SR Legacy 物理分包；逐记录保存来源与许可；D-026 的签名范围覆盖 manifest、NOTICE、许可证正文、provenance 索引、数据库内容哈希和全部转换元数据；App 来源页、manifest 与 NOTICE 做一致性 golden test | D-052 未由 Owner 处理前，USDA 只限本地研发，不得进入面向美国境外朋友的 TestFlight/IPA；即使签名正确，错误的上游许可判断仍需人工复核和官方澄清 |
| 旧包回滚 | 已修正数据被覆盖 | `sourceVersion`、`createdAt`、最低允许版本和显式降级确认 | 用户可能主动导入旧包，应显示影响范围 |
| 数据库文件被复制 | 隐私泄露 | SQLCipher + iOS Data Protection；密钥只在 Keychain | 已解锁/越狱设备上的运行时攻击不可完全消除 |
| Keychain 条目重装后残留 | “删除后重装”仍保留数据库或 AI 密钥 | 删除全部数据时显式删除 Keychain；启动时按 DB/generation、安装代标记和 intent 真值表处理孤立密钥，绝不凭残留 key 猜测旧安装状态 | iOS Keychain 生命周期由系统控制，不能依赖卸载清理 |
| 生物识别集合变化导致密钥失效 | 数据不可访问 | 区分 App 解锁凭据与 DB 主密钥；提供加密备份恢复 | 无备份且密钥永久失效时数据不可恢复 |
| 备份泄露或篡改 | 全量隐私泄露、恢复污染 | 认证加密、强 KDF、随机 salt/nonce、完整 entry/path 规则、未认证 plaintext 隔离 | KDF 无法抵消极弱口令；离线字典攻击仍存在，具体策略待 D-027 |
| ZIP bomb / 磁盘耗尽 | App 卡死、数据损坏 | 压缩前后大小、文件数、单文件和总配额；预留空间检查 | iOS 可在运行中回收空间，仍需可恢复失败 |
| 日志泄露 | key、饮食或图片信息泄露 | 集中脱敏；禁止 Authorization、正文和图片；本地轮转 | 第三方原生库日志需在 Spike 中审计 |
| Widget 锁屏泄露 | 未解锁时显示健康数据 | 最小快照、隐私遮罩、过期时间、用户选择显示字段 | iOS 截图和通知历史由系统/用户管理 |
| Files 目标是 iCloud/第三方 | 用户误以为完全本地 | 内部文件设置不备份属性且无 iCloud entitlement；选择页前明确提示位置由用户决定 | 系统文件提供者的实际上传行为不受 App 控制 |
| AI Provider 返回超大图片/JSON/流 | 内存、CPU、磁盘耗尽 | 请求、图片、像素、响应、流时长和 JSON 结构预算；超限立即 abort | 精确预算待 D-034 和真机基准 |
| 原生依赖绕过 JS 网络规则 | 隐私承诺失效 | Release 依赖/entitlement/配置静态审计 + 全进程网络捕获 | 新增 Pod/SDK 时必须重跑 |
| HTTP session 缓存、cookie 或持久凭据残留 AI 内容 | 后续请求串线、磁盘残留或跨模块泄露 | D-036 候选的隔离 session/profile；禁止 WebView/remote Image 隐式取 Provider 内容 | JS/RN `fetch` 未必能证明底层性质，可能需要原生 transport |
| TestFlight/Apple 平台诊断离机 | 崩溃上下文或用户反馈进入 Apple 边界 | App 不内置 Nuttie/第三方遥测或崩溃上传器；产物无 crash SDK/DSN；可控日志不含 key/健康正文 | Apple 仍可能按系统、TestFlight 与测试者设置收集诊断/反馈，Nuttie 不能承诺其为零 |
| 权限过度申请 | 隐私和信任损失 | 仅在功能触发点申请；拒绝后手动回退；首版不请求 HealthKit | 用户可随时在设置中撤销权限 |
| 第三方依赖被污染 | 构建或运行时代码执行 | lockfile、来源审计、最小依赖、版本升级评审、SBOM 候选 | npm/CocoaPods 上游风险不能归零 |

## 4. SQLCipher 与 Keychain 生命周期

已批准的逻辑流程：

1. 首次启动使用系统安全随机数生成数据库主密钥。
2. 以专用 `service`/`account` 标识写入 Keychain，访问级别为 `WHEN_UNLOCKED_THIS_DEVICE_ONLY`。
3. 打开数据库时先取密钥，再初始化 SQLCipher；密钥不得插值进入可记录的普通 SQL 日志。
4. 创建数据库后立即验证 cipher 状态、`user_version` 和核心表完整性；任一步失败不得创建“看似空库”覆盖旧库。
5. App 进入后台后释放不再需要的密钥引用；不得把密钥放到全局状态管理、AsyncStorage 或 App Group。
6. 更换密钥必须使用 SQLCipher 支持的受控 rekey 流程，并在断电/失败测试通过后启用。
7. “删除全部数据”使用下节的可恢复状态机；不能只执行一串内存内删除调用。

是否使用生物识别保护数据库密钥、密钥轮换频率和具体 Keychain 包仍是实现前安全评审项。生物识别变化不应无意中摧毁唯一数据库密钥。

## 5. 可恢复、幂等的全量删除状态机

用户确认删除后，App 必须先以原子写入建立不含隐私的 durable `wipe-intent-v1` 标记，再改变任何数据。该标记存放在不参与业务数据库、默认排除备份的 App 本地位置，并在每次启动打开数据库之前检查。

```text
IDLE
  -> INTENT_DURABLE
  -> WRITES_BLOCKED_AND_QUIESCED
  -> CONNECTIONS_CLOSED
  -> SECRETS_INVALIDATED
  -> LOCAL_ARTIFACTS_REMOVED
  -> VERIFIED_EMPTY
  -> INTENT_CLEARED
```

步骤要求：

1. `INTENT_DURABLE`：原子创建并 fsync wipe intent；失败则不开始删除。
2. `WRITES_BLOCKED_AND_QUIESCED`：设置进程级 wipe gate，取消 AI/导入/备份任务，阻止新事务；等待每个已登记 writer/task 明确 acknowledgement 并退出，不能只设置 gate 后继续。调用 `removeAllPendingNotificationRequests` 和 `removeAllDeliveredNotifications`，同时清除待处理与 Notification Center 中已投递的本地通知。
3. `CONNECTIONS_CLOSED`：在所有 writer/task 已静止后，关闭数据库、文件、媒体和 App Group 写连接；验证没有可写 handle 或可继续提交的事务。
4. `SECRETS_INVALIDATED`：连接关闭后幂等删除数据库密钥和全部 AI key，使残留 SQLCipher 文件失去可用密钥。不得在开放 SQLCipher connection 仍持有进程内 key material 时先删 Keychain 条目。
5. `LOCAL_ARTIFACTS_REMOVED`：幂等删除 DB/WAL/SHM、媒体、缩略图/AI 输入等普通缓存、数据包/备份/AI 明文 staging、内部备份、URL cache/cookie、App Group 快照、UserDefaults 业务项和本地日志。
6. `VERIFIED_EMPTY`：递归枚举 App 可写 sandbox 与 App Group 的全部受控容器，采用“只允许 wipe intent 和经安全评审的系统占位项存在”的负向校验；发现未知目录/文件时继续安全删除或保持 wipe intent 并进入可重试错误，不能因为它不在旧删除清单中而忽略。再次查询待处理与已投递通知均为空。外部 Files 备份不属于可删除范围，界面需说明。
7. `INTENT_CLEARED`：只有验证成功才删除 wipe intent；之后才允许创建新的空数据库。

App 在任一步被杀死或设备重启时，下次启动必须在初始化 SecretVault、打开数据库、安排通知或渲染业务页面之前继续 wipe。所有步骤均按“目标不存在即成功”设计，不依赖上一步的内存状态。实现必须维护集中式 writable-container inventory，并用递归负向枚举捕获未来新增但未登记的缓存目录。

启动时还必须在打开 SQLCipher 前按以下真值表处理 Keychain 与本地 generation。`业务 generation` 包括当前 DB、WAL/SHM、active/restore 指针及任何带完成标记的 generation；不能只检查 `main.db` 文件名。

| 本地状态 | Keychain DB key | intent/安装代标记 | 必须结果 |
| --- | --- | --- | --- |
| 存在任一业务 generation | 存在且代标记匹配 | 无 wipe intent | 用该 key 只读打开并验证后进入正常启动；失败进入恢复态 |
| 存在任一业务 generation | 缺失、失效或代标记不匹配 | 任意 | 进入恢复态；禁止生成新 key、禁止创建空库、禁止删除现有 generation |
| 不存在任何业务 generation | 不存在 | 无 wipe/restore intent，确认是新安装代 | 生成一次新的独立 DB key，并原子建立安装代与空 generation |
| 不存在任何业务 generation | 存在 | 无 wipe/restore intent，安装代缺失或不匹配 | 视为卸载重装/首次建库中断后的孤立条目；幂等删除旧 DB key 与旧安装代关联的 AI key，再生成新的独立 DB key |
| 任意 | 任意 | wipe intent 存在 | 先恢复全量删除状态机；完成前不创建 key 或打开 DB |
| 任意不一致组合 | 任意 | restore intent 或未知 intent 存在 | 保持写入关闭并进入恢复/对账态；不轮换、不删除、不猜测最新 generation |

安装代标记不得包含隐私或密钥；Keychain service/account、安装代和 generation ID 的绑定方式必须在实现 ADR 中冻结。首次建库的每个持久化点、卸载重装、旧 service/account 残留、孤立 DB key 与孤立 AI key 都必须有 kill/restart fixture。

本状态机承诺的是密钥失效、逻辑不可访问和 App 可控文件/通知删除，不宣称能物理擦除闪存块、系统快照、Apple/TestFlight 诊断、用户已经导出到外部 Files 的副本、系统/用户截图、屏幕录制或其他 App 创建的副本。

## 6. 默认排除 iCloud 的实现要求

D-006 的“默认排除 iCloud”必须同时落实到 capability、文件和验收：

- Release entitlements 不包含 iCloud、CloudKit、ubiquity container 或 document-in-cloud；也不包含远程 Push entitlement。
- 对主 DB、WAL、SHM、媒体目录、数据包 staging、备份/恢复 staging、AI 临时文件、内部恢复点和 App Group 快照设置 `URLResourceKey.isExcludedFromBackupKey = true`（底层为 `NSURLIsExcludedFromBackupKey`）。
- 每次创建、复制、原子重命名或恢复这些文件后重新设置并读取校验不备份属性，不能只假设目录继承。
- 用户通过 Files 主动导出的加密备份不设置为 App 内部文件；最终 provider 可能是 iCloud/第三方，文案只能承诺“Nuttie 不主动上传”。
- 防御性测试必须模拟“业务文件被恢复但 ThisDeviceOnly Keychain key 不存在”；App 进入恢复态，不能创建空库覆盖，也不能静默生成新 key 尝试打开旧库。

产物审计需检查 `.entitlements`、provisioning profile、Info.plist、Expo config 和 App Group 文件属性；真机测试读取每类 URL 的 exclusion flag。

## 7. AITransport URL、资源预算与状态机

D-003/D-004 已批准 BYOK 与 HTTPS，且任何实现都不得把 Authorization 或载荷发送给用户未确认的 origin。query/fragment、全部 3xx、cookie/cache/credential 与具体 session 实现会影响 Provider 兼容性，均未由 D-004 冻结；以下 URL 与 session 规则是 D-036 的严格推荐 profile，不是 accepted 决策。D-034 负责另行冻结资源数值。

### 7.1 Provider 数据用途准入

D-053 未由 Owner 接受前，所有 Provider/载荷组合状态默认为 `UNKNOWN/BLOCKED`，真实健康或营养载荷不得发送，AI 能力不得获得发布门禁通过。BYOK、HTTPS、用户确认、D-014 或 D-033 都不能替代用途准入。

本地 `ProviderPolicyProfile` 至少记录：

- `providerId`、规范化 origin、允许的 model 与 payload class 范围。
- terms/privacy URL 或离线快照 SHA-256、核验日期、到期日和 profile version。
- 数据保留、训练、人工访问、删除机制、广告/营销和健康数据用途。
- `ALLOW/DENY/UNKNOWN/EXPIRED` 状态、审查依据与适用地区。

profile 只通过 App 发版内置或 Owner 审核后的本地配置更新；生产 App 不为抓取 policy 增加新的联网出口。origin、model、payload class、证据哈希、地区或 profile version 变化都会使已有准入失效并回到 `UNKNOWN`。在读取 Keychain key、生成 Authorization 或序列化敏感 body 前调用 `PROVIDER_ELIGIBLE(payloadClass, profileVersion)`；任何非 `ALLOW` 结果都只返回本地可恢复错误，网络零字节外发、数据库零写入。

D-053 决定什么证据和允许范围可以产生 `ALLOW`。即使 Owner 选择逐 Provider 接受残余风险，也不能允许 Apple 明确禁止的数据用途；D-033 仅决定预览/确认频率，不能绕过本门禁。

### 7.2 URL 与重定向候选 profile

若 Owner 选择 D-036 的严格 profile，保存 baseURL 前使用结构化 URL API 解析和规范化：

- scheme 必须严格为 `https`，hostname 非空。
- 拒绝 username/password（userinfo）、query、fragment、控制字符和非法端口。
- hostname 使用 URL 标准的规范表示；默认 443 归一化；base path 规范化并禁止业务 endpoint 逃逸其允许路径。
- endpoint 使用结构化 URL 拼接，不用字符串连接用户输入。
- 请求使用 manual/no-redirect 策略，任何 3xx（同 origin 或跨 origin）都作为错误停止；无论最终选择何种 profile，都绝不向未确认 origin 转发 Authorization、图片、文本或 response-derived credential。
- TLS 校验失败不允许自动降级、自签名绕过或换 host。

### 7.3 资源预算

D-034 必须在读取/解码/发送前和流式接收过程中冻结并执行上限：

- 选择文件字节数、解码后总像素、压缩后最长边与输出字节数。
- JSON 请求总字节数和单字段长度。
- 响应 header/body 总字节数、流持续时间、空闲超时和累计 chunk 数。
- JSON 最大深度、对象 key 数、数组元素数、字符串长度和数值范围。
- 本地临时空间和并发请求数。

任一上限触发时立即 abort 网络流、丢弃未验证缓冲区、清理临时文件并返回可恢复失败；数据库零写入。精确预算与设备基准待 D-034，未确认前不能发布 AI 功能。

### 7.4 会话与临时文件候选 profile

D-036 的严格推荐 profile 使用 AITransport 专属 ephemeral/no-persistent-state session：

- 使用独立 `URLSessionConfiguration.ephemeral` 或经证明等价的实现；请求 cache policy 为 reload/ignore local cache，不接入 shared URL cache。
- 禁止 cookie 接受/发送、持久 credential store 与跨请求 response credential；Authorization 只从本次 Keychain 读取组装到已确认 origin 的请求。
- Provider 内容不得交给 WebView 或 remote Image 组件加载；图片响应只作为有界 `unknown` bytes 进入本地隔离解码器。
- 请求副本、响应 body、流片段和解码中间文件只进入 file-protected、排除备份的 AI 私有临时目录，并在成功、失败、取消、超限、wipe 和下次启动全部清理。
- 若 JS/RN `fetch` 无法通过 Spike 证明 redirect、cache、cookie、credential、取消与临时文件性质，不得默认它足够；由 D-036 决定使用窄接口 Swift/Expo Module transport。

受控兼容 profile 的任何例外也必须逐项列入 D-036 并保留“不向未确认 origin 泄露 Authorization/载荷”的底线。

### 7.5 状态机

```text
UNCONFIGURED
  -> CONFIGURED (HTTPS URL + model + Keychain key validated)
  -> PROVIDER_POLICY_CHECK (origin + model + payloadClass + profileVersion)
  -> PROVIDER_ELIGIBLE (D-053 accepted and profile ALLOW)
  -> PREPARING (local content only)
  -> LABEL_PREVIEW_CONFIRMED (D-014; other payloads pending D-033)
  -> USER_INITIATED_SEND
  -> SENDING
  -> VALIDATING
  -> CANDIDATE (still not persisted)
  -> USER_ACCEPTED
  -> COMMITTED
```

所有 AI 请求都必须由用户主动发起；营养标签照片必须经过 `LABEL_PREVIEW_CONFIRMED`，其他载荷是否要求相同逐次预览由 D-033 决定。`PROVIDER_POLICY_CHECK` 的 `DENY/UNKNOWN/EXPIRED`、scope/profile 不匹配或 D-053 未接受都直接回到本地可编辑输入，不读取 Authorization、不组装/发送敏感 body。从 `SENDING` 到 `USER_ACCEPTED` 的任何失败、取消、超时、401/403、429、TLS 错误或解析错误都回到可编辑的本地输入，数据库零写入。不得自动将失败请求切换到另一个 host。

## 8. 备份密码学要求

D-006 已批准“手动加密导入/导出”，但具体 KDF、认证加密算法和实现库尚未批准，见 D-027 候选。无论最终算法如何，必须满足：

- 口令不保存、不上传、不进入 Keychain 自动恢复路径。
- 每个备份使用独立随机 salt 和 nonce。
- 公共 header 的精确字节必须全部受 AEAD 认证：优先作为 AAD；若所选库无法安全支持，则把其规范编码或哈希放入已认证 ciphertext。任何未认证字段都不得控制算法、KDF、版本、长度或资源分配。
- 最终 tag 通过前不接受、不解析、不映射、不提交明文；认证失败不区分“错误口令”和“文件被篡改”的内部细节。允许的两遍/隔离实现由 D-027 决定。
- envelope 记录版本和 KDF 参数，允许未来升级但禁止静默降级。
- 加密覆盖 manifest、数据库逻辑导出和媒体，不留下可识别文件名或营养摘要。
- 明文暂存有系统文件保护，并在成功、失败、取消和下次启动清理。
- 解密后的 entry 使用与数据包等价的完整 allowlist、路径规范化、文件数、单文件/总大小、NFC/大小写碰撞和 symlink/special-entry 拒绝规则。

D-027 还必须冻结可接受 KDF/AEAD、salt/nonce/tag 长度，时间/内存/并行度和 header 大小的最小/最大参数，header 的长度前缀、字段顺序、精确编码与规范化规则，版本防降级、口令长度/弱口令策略，以及两遍认证/解密或隔离未认证 plaintext staging。读取方必须拒绝重复字段、未知关键字段、非有限数字、algorithm confusion 和不符合冻结编码的表示。共同底线是最终 tag 通过前不得解析、映射或提交内容；不能对所有库笼统承诺“从未产生 plaintext”。读取方必须在分配大块内存前拒绝超限参数。若采用两遍方案，复制完成后必须固定同一个不可变 staging object、identity、size 和 ciphertext digest；第二遍读取同一对象并再次完成认证，不能只依赖第一遍的成功结果。D-027 未获批准前，加密备份不能进入发布实现。

## 9. Release 全进程唯一联网证明

TypeScript import 规则和 `URLProtocol` 只能覆盖部分路径。Release 门禁还必须：

1. 审计 JS/npm 依赖、CocoaPods、Swift Package、Expo plugins 和生成的原生配置，确认没有第三方分析/崩溃上传、广告、远程配置、Push、CloudKit 或自更新 SDK。
2. 检查 Release entitlements、Info.plist、PrivacyInfo、embedded frameworks 和字符串，确认无 `expo-updates` URL、遥测 DSN、远程 Push/CloudKit capability 或未批准 host。
3. 在 Release 构建执行全进程网络捕获，覆盖启动、后台/前台、全部本地流程、权限拒绝、备份/导入和删除；未触发 AI 时网络请求为零。
4. 对 `ALLOW/DENY/UNKNOWN/EXPIRED`、policy 到期、origin/model/payload/profile 变化逐项抓包，证明只有 D-053 允许的精确组合能够读取 key 并发起请求；所有阻断组合 Authorization 和 body 均为零字节外发。
5. 单独执行一次经确认且 policy=`ALLOW` 的 AI 请求，证明只访问用户确认的 origin，且不会把 Authorization/载荷发往未确认 origin；按 D-036 最终 profile 验证 3xx/query/session 行为。
6. 飞行模式运行完整核心旅程，证明本地路径不等待网络超时。

Expo Development Build/Metro 的开发网络只能存在于 Debug/Development 配置，不能用其流量为 Release 例外，也不能让 development client、更新 channel 或 inspector 进入发布产物。

## 10. 安全验收门槛

1. 静态搜索证明 key、Authorization 和默认 Provider 密钥不存在于源码、产物和 fixtures。
2. Release 全进程捕获证明未触发 AI 时无请求；依赖、Pod、entitlement 和生成配置审计无绕过网络边界的 SDK/capability。
3. 错误口令、损坏备份、恶意签名包、ZIP bomb、路径穿越和磁盘不足均保持原数据不变。
4. 删除状态机在每个步骤后强制 kill 并重启，均能继续清理；覆盖 gate 后并发写、writer acknowledgement、连接关闭前后、关连接后/删 key 前和删 key 后的中断。完成后 pending/delivered 通知均为空、连接已关闭，且递归受控容器只剩 allowlist，DB、WAL/SHM、媒体、AI 私有缓存、明文暂存、App Group、日志和 Keychain 检查均为空。
5. Release 拒绝 HTTP，Authorization/载荷从不发送到未确认 origin；URL userinfo/query/fragment、全部 3xx 和 session 隔离按 D-036 最终 profile 验收。
6. 产物和真机验证所有内部敏感文件均排除备份，且无 iCloud/CloudKit/ubiquity/remote-push entitlement。
7. AI 图片/请求/响应/流/JSON 超限会 abort、清理且零写入。
8. 真实设备验证锁定、重启、生物识别变化、卸载重装、ThisDeviceOnly key/文件错配和权限撤销场景。
9. 备份对公共 header 的每个合法范围内字段做单字节篡改，并覆盖重复/未知字段、编码差异、algorithm confusion 与两遍之间替换密文；每种情况都必须认证失败、零业务写入且清理 staging。
10. Provider policy 的 `ALLOW/DENY/UNKNOWN/EXPIRED`、到期、证据/profile 变化、origin/model/payload scope 变化均有本地 fixture 和全进程抓包；阻断状态不得读取 key、生成 Authorization 或发送 body。
11. D-026、D-027、D-034、D-036、D-053 未获 Owner 接受并完成对应安全测试前，相关导入、备份、AI 能力不得获得发布门禁通过；候选 ID 以 PM 去重后的全局编号为准。
