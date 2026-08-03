# 手动加密备份与恢复

> 状态：G4 初版
>
> 关联决策：D-006、D-015；密码学、恢复语义和明文导出分别待 D-027、D-030、D-035

## 1. 产品语义

Nuttie 不提供账号同步或自动云备份。用户从 App 主动创建加密备份，并通过系统 Files 选择保存位置；恢复也必须由用户主动选择文件和输入口令。

App 默认不配置 iCloud/CloudKit 容器，并将内部数据库、媒体和临时文件排除于默认云备份。Files picker 仍可能展示 iCloud Drive 或第三方文件提供者；一旦用户主动选择这些位置，实际上传行为属于用户与系统边界，界面必须明确说明。

## 2. 已批准范围与待决导出

D-006 当前只批准手动、加密的完整备份与恢复，内容包括逻辑数据、必要媒体、schema/版本和校验信息。是否额外提供明文 JSON/CSV 可读导出尚未批准，必须由 D-035 决定；在获批前不得实现、展示入口或把它写入产品承诺。

若 D-035 未来允许明文导出，它也不是备份，不具备恢复语义。导出前必须让用户选择字段，并在打开 Files 位置选择器前逐次警告“该文件包含未加密的健康/饮食数据；iCloud Drive 或第三方 provider 可能上传它”。

## 3. 备份 envelope

建议逻辑结构：

```text
public header:
  magic
  envelopeVersion
  kdf algorithm + parameters
  salt
  encryption algorithm
  nonce
  exact encoded header bytes are AEAD AAD
ciphertext:
  manifest
  logical database export
  selected media
  per-file hashes
authentication tag
```

具体 KDF、认证加密算法、参数边界、实现库与流式认证策略待 D-027。D-027 还必须冻结公共 header 的长度前缀、字段顺序、精确编码和规范化规则；完整 header 精确字节必须作为 AEAD AAD，或者其规范编码/哈希必须位于已认证 ciphertext 内。任何未认证 header 字段都不得控制算法、KDF、版本、长度或资源分配。读取方必须拒绝重复字段、未知关键字段、非有限数字、algorithm confusion 和不符合冻结编码的表示。

格式必须版本化并禁止静默降级；读取方不得接受、解析、映射或提交未经认证的明文。由于部分流式 AEAD API 会在最终 tag 验证前产出未认证 plaintext，不能笼统宣称“解密过程从不产生明文”，具体隔离方式见恢复流程和 D-027。

## 4. 导出流程

1. 检查可用空间，并提示预计备份大小和是否包含图片。
2. 开始只读一致性边界；使用 SQLite backup API 或等价一致性快照，禁止直接复制活跃 WAL 状态下的单个 DB 文件。
3. 将当前 schema 逻辑导出为稳定、可迁移格式；每项带稳定 ID、原始来源和时间语义。
4. 生成 manifest：App 版本、schemaVersion、backupVersion、记录计数、媒体计数、创建时间和文件哈希。
5. 用户输入并重复确认口令；口令仅保留在当前操作内存中。
6. 用随机 salt/nonce 派生密钥并流式认证加密，避免全量明文常驻内存。
7. 在仍持有本次口令材料时，对完成的 envelope 做独立认证/可恢复性校验，再交给 Files picker。
8. 清理明文快照、派生密钥和失败产物；记录不含隐私的本地操作结果。

用户取消、Files 写入失败或空间不足时，主数据库不受影响。

## 5. 恢复与 generation 切换协议

恢复永远复用目标设备现有的 SQLCipher 数据库密钥；全新安装且没有任何本地 DB 时，只创建一次目标设备密钥，再用它构建恢复 generation。若已有 DB 但 Keychain key 缺失，必须进入恢复态，不能生成新 key 覆盖或绕过旧库。恢复不得写入或替换 AI key，也不把备份侧数据库密钥带入目标设备。

逻辑布局为 `generations/<generationId>/main.db + media/`，查询只通过受保护的 `active-generation-v1` 指针打开一个完整 generation。恢复流程如下：

1. 从 Files 复制备份到受保护、排除备份的 staging；不直接操作外部 provider 文件。
2. 解析固定上限的公共 header；在任何大内存分配或 KDF 执行前，拒绝不支持/降级的 envelopeVersion、越界 KDF 参数、重复/未知关键字段、非法编码和超配额文件。仅允许为执行这些 fail-fast 检查解析受固定预算约束的 header；所有影响解密语义的 header 精确字节仍必须通过最终 AEAD tag 认证。
3. 用户输入口令；认证失败统一显示“口令错误或文件已损坏”。D-027 必须选择并由 Spike 证明两遍读取，或选择隔离未认证 plaintext staging；无论哪种路径，未通过最终 tag 的内容都不可解析、不可映射到业务对象、不可写入 SQLCipher generation。若采用两遍方案，从 Files 复制完成后必须固定同一个不可变 staging object、文件 identity、size 和 ciphertext digest；第二遍读取同一对象并再次完成认证，不能只复用第一遍“认证成功”的布尔结果。任何 identity/size/digest 变化都按认证失败处理并清理。
4. 认证通过后验证 manifest、文件哈希、记录计数、完整 entry 集和媒体路径；清理认证阶段产物。
5. 使用目标设备既有 SQLCipher key，在独立 staging 中构建完整 new generation，并依次执行从备份 schema 到当前 schema 的全部迁移。
6. 对 new generation 运行 SQLite 完整性、外键、营养单位、来源、业务不变量和媒体哈希检查；设置文件保护/不备份属性并写入完成标记。
7. 展示当前数据与备份数据摘要、冲突数量和即将执行的恢复模式，要求最终确认。替换/合并及恢复点保留仍由 D-030 决定。
8. 将已验证 new generation 在同一卷原子 rename 到不可变 final generation 目录，并同步文件与父目录元数据。
9. 原子创建并持久化不含隐私的 `restore-intent-v1`，记录 operation ID、old/new generation refs、expected hash、协议版本和 `selectedModeId`；只有 D-030 获 Owner 接受后，才允许写入其定义的 mode ID 并进入本步骤。
10. 阻止新写入、等待在途用例退出，并关闭主数据库、媒体与 App Group 写连接。
11. 同卷原子替换 `active-generation-v1` 指针并同步其父目录；指针只引用已经完整验证的 final generation。
12. 用同一目标设备 SQLCipher key 重开 active generation，校验 pointer、完成标记、数据库与媒体一致性；成功后清除 restore intent。
13. 提交成功后重新生成 App Group 快照；快照不参与 generation 切换。随后按 D-030 保留策略清理 staging、旧 generation、口令和派生密钥材料。

Keychain、generation 目录与 active pointer 不能组成一个全局事务；本协议只承诺启动对账后的 crash consistency。步骤 8 的 rename、步骤 9 的 intent 和步骤 11 的 pointer replace 也不是一个单一原子提交。

### 5.1 启动对账

App 必须在开放数据库写入、生成 App Group 快照或渲染业务页面前，对账 restore intent、active pointer、新旧 generation 与完成标记：

- new final 已存在但 intent/pointer 仍指向 old：验证 old 后继续使用 old，并删除或隔离未引用的 orphan new generation；这也覆盖 rename 后、intent 前的中断。
- pointer 已指向完整且哈希匹配的 new generation：完成提交，清除 intent，再生成 App Group 快照。
- pointer 指向缺失、未完成或损坏的 new generation：若 old generation 仍完整，则原子回写 old pointer；否则停止打开数据库并进入明确恢复态。
- intent/pointer/generation 组合未知或 Keychain key 无法打开目标：保持写入关闭，不创建空库、不猜测最新目录，并提供不含隐私的本地诊断。

对账和清理必须幂等。恢复流程每个可持久化步骤以及 AEAD 每个 chunk 边界都要强制 kill/restart，验证最终只有完整 old 或完整 new generation，未认证 plaintext、staging、orphan generation 和过期 App Group 快照均按规则清理。

## 6. 失败与恢复语义

| 失败 | 用户可见结果 | 数据语义 |
| --- | --- | --- |
| 错误口令/认证失败 | 可重试或取消 | 当前数据不变 |
| 备份版本过新 | 告知所需 App 版本 | 当前数据不变 |
| 迁移失败 | 提供本地脱敏诊断 | 当前 active generation 不变 |
| 媒体缺失 | 若媒体为必需则拒绝；若可选则展示明确缺失数后确认 | 不静默丢失 |
| 空间不足 | 显示所需/可用空间 | 清理 staging，当前数据不变 |
| App 中断/崩溃 | 下次启动先对账 intent/pointer/generation | 完整旧 generation 或完整新 generation，不暴露半状态 |

## 7. 删除与保留

“删除全部数据”包含移除待处理和已投递的本地通知、关闭数据库/文件连接，以及删除全部 generations 中的 DB/WAL/SHM、媒体、缩略图/AI 输入普通缓存、数据包/备份/AI staging、内部恢复点、URL cache/cookie、App Group 快照、业务 UserDefaults、本地日志、AI key 和数据库密钥。验证必须递归枚举全部受控容器，只允许 wipe intent 和安全评审 allowlist 残留。用户已经导出到 Files 的备份不在 App 控制范围内，删除确认页必须明确说明。

## 8. 验收

- 每个历史 schema fixture 都能导出并恢复到当前 schema。
- 备份在一位随机记录、媒体字节或认证标签被篡改后必须整体失败。
- 公共 header 的 envelopeVersion、KDF、参数、salt、algorithm、nonce 和长度字段在各自合法范围内做单字节篡改时必须认证失败；重复字段、未知关键字段、编码差异与 algorithm confusion 同样拒绝。跨版本 fixture 必须证明旧版本不会静默接受新字段或参数降级。
- 错误口令、取消、磁盘不足、Files 失败和提交前中断保持当前 active generation 不变；提交期间每个持久化点中断可在启动时确定性完成或回滚。
- 篡改 envelope 最后一个认证 tag 字节并在每个解密 chunk 边界强制 kill，不得留下可解析、可映射或可提交的未认证明文，重启会清理隔离 staging。
- 两遍方案必须在第一遍成功后/第二遍开始前以及第二遍每个 chunk 注入替换、截断和强制 kill，证明第二遍绑定同一 staging identity/size/digest 并重新认证；替换失败时 active generation 不变。
- 完成往返后，记录数、稳定 ID、来源、时间、七项营养值和媒体哈希一致；恢复模式与恢复点策略按 D-030 的最终决定生成用例。
- 网络封锁/飞行模式不影响创建和恢复本地备份。
- D-027 未冻结 KDF/AEAD、全部参数边界、版本降级规则和流式认证隔离策略并通过安全 Spike 前，加密备份不得发布；D-030 未批准前不得实现最终恢复模式。
