# D-034 AI 输入、响应与临时资源预算选择卡规格

| 字段 | 内容 |
| --- | --- |
| 工件 ID | `D034-AI-RESOURCE-BUDGET-CARD-001` |
| 决定 | `D-034 / CANDIDATE` |
| 关联阻断 | `D039-PX5-B05 / OPEN` |
| 状态 | `DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / DEVICE_BENCHMARK_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY` |
| 日期 | 2026-08-17（Asia/Shanghai） |
| Owner intake | 未写入；未排期、未展示、未收集响应 |
| 授权 | 真机结论、Owner 评审、Owner 选择、决定接受、B05 关闭和正式实现均为 `false` |

## 1. 这张卡补齐什么

旧 D-034 列出了输入文件、像素、发送副本、请求/响应、流、JSON、并发、临时磁盘和内存维度，也给出一套未批准的平衡档 benchmark candidate，但没有把保守档与 Provider 兼容档写成可比较的完整数值包，也没有固定资源计量时点、压缩响应、配置变化、磁盘预留和超限后的清理证据。因此旧表述不能进入 Owner 选择，更不能关闭 `D039-PX5-B05`。

本卡形成三个精确但仍未批准的预算候选，统一遵守：

- 预算是全局安全上限，不是 Provider 的建议值。Provider profile 只能在已选档位内收紧，不能由用户、远端响应、模型配置或自动重试放宽。
- 所有计量先于昂贵分配或发送：先验证本地普通文件与字节数，再用受控元数据读取验证宽高/像素，随后直接下采样到发送尺寸；禁止先完整解码超大原图再检查。
- D-033、D-036、D-053 未授权或证据不匹配时，请求仍为 `BLOCKED`。预算通过只表示“资源预检未超限”，不生成 Authorization、body、transport 或发送许可。
- 输入、发送副本、响应流和 JSON 在每个阶段分别受限；前一阶段通过不能覆盖后一阶段。声明长度只能提前拒绝，不能替代实际流式计数。
- 任一超限都必须中止当前阶段、取消或关闭流、丢弃未验证缓冲、清理 App 控制内的请求/响应临时文件并保持业务数据库零写入。不得自动提高上限、静默降质重试或切换档位。
- 全部数值只有在最低支持 iPhone 的正常、边界、超限和恶意 fixture 上完成内存、CPU、耗时、可读性、取消与残留测试，并通过独立安全/QA 复核后，才可形成 Owner-ready 卡。

这些数值是 Nuttie 的内部候选，不是 Apple、Expo 或任何 Provider 推荐值。当前 OI-03 只有 iPhone 16 Pro Max / iOS 26.5 且无可用 Mac，无法完成最低支持设备的原生基准。

## 2. 宿主原生卡合同

```text
decisionId: D-034
questionId: d034_ai_resource_budget_profile
header: AI 资源预算
question: 在真机基准通过后，首版应采用哪一档固定 AI 输入、响应与临时资源上限？
```

未来只有真机证据和独立复核均通过后，宿主卡才可使用以下稳定 `optionId`。当前推荐只表示待基准的首选测试对象，不是默认答案。

| 顺序 | optionId | Owner 可见标签 | 收益与代价 |
| --- | --- | --- | --- |
| 1 | `conservative_fixed_limits` | 保守固定上限 | 输入、响应、时长、临时磁盘和受控内存最低，旧设备压力较小；高分辨率标签、长文本与慢 Provider 更容易被本地拒绝。 |
| 2 | `balanced_fixed_limits` | 平衡固定上限（推荐先测） | 沿用现有 provisional 平衡候选，照片先下采样到 2048 px，允许中等响应与 90 秒总时长；质量和兼容性较好，但必须用真机证明峰值与取消清理。 |
| 3 | `provider_profile_with_global_ceiling` | Provider 可收紧的兼容上限 | 提供较高的固定全局天花板，各 Provider 只能声明更低值；兼容面最大，但 DoS、内存、磁盘、慢流和恶意响应测试最重。 |

宿主自动提供的 `Other` 只收集待规范化意见。任何要求超过档位 C 天花板的意见都必须回到 D-034 重新研究与复核，不能直接登记为 accepted 或作为单个 Provider 的例外。

## 3. 三档精确预算矩阵

MiB/KiB 按二进制计算。像素上限按校正方向后的 `width * height` 计算并拒绝整数溢出；JPEG 质量是归一化编码参数候选。请求总量是发送前可计数的未压缩逻辑 header + body 字节，不含 TLS/HTTP framing；响应 body 上限按解压后的实际字节计数。

| 维度 | A `conservative_fixed_limits` | B `balanced_fixed_limits` | C `provider_profile_with_global_ceiling` |
| --- | ---: | ---: | ---: |
| 单个原始本地图片文件 | 16 MiB | 25 MiB | 32 MiB |
| 元数据允许的原始像素 | 40 MP | 60 MP | 80 MP |
| 单次纯文本 UTF-8 | 32 KiB | 64 KiB | 128 KiB |
| 单次趋势输入条目 | 128 | 256 | 512 |
| 发送图片最长边 | 1536 px | 2048 px | 2560 px |
| 去元数据 JPEG 质量 | 0.78 | 0.82 | 0.84 |
| 单个编码后图片 | 2 MiB | 4 MiB | 6 MiB |
| 单个请求逻辑总量 | 3 MiB | 6 MiB | 8 MiB |
| 响应 header 总量 | 16 KiB | 32 KiB | 64 KiB |
| 解压后响应 body | 1 MiB | 2 MiB | 4 MiB |
| 请求总时长 | 60 s | 90 s | 120 s |
| 无有效 body 字节 idle | 10 s | 15 s | 20 s |
| 非空响应 chunk 数 | 1024 | 2048 | 4096 |
| JSON 最大 depth | 24 | 32 | 32 |
| JSON 累计 object keys | 4096 | 10,000 | 20,000 |
| JSON 累计 array elements | 4096 | 10,000 | 20,000 |
| JSON 单字符串 UTF-8 | 64 KiB | 256 KiB | 512 KiB |
| JSON 总节点 | 16,384 | 32,768 | 65,536 |
| 同时前台 AI 请求 | 1 | 1 | 1 |
| 单任务 App 临时磁盘 | 32 MiB | 64 MiB | 96 MiB |
| 单任务受控工作内存 | 96 MiB | 160 MiB | 224 MiB |

档位 C 的“Provider 可收紧”只允许 profile 对上述每个字段给出小于或等于天花板的固定值。缺字段、值为零/负数/非整数、单位不明、超出天花板、运行中远端修改或 profile revision 不匹配都失败关闭。A/B 不读取 Provider 自定义预算。

“受控工作内存”包括 Nuttie 为本任务创建或持有的输入读取缓冲、下采样像素、编码副本、请求 body、响应流缓冲、UTF-8/JSON 解析结构和临时复制的估算上限。它不冒充 iOS 进程总内存硬限制；真机必须另记录 process high-water mark、相对空闲基线增量和 jetsam/crash 结果。任何实测峰值不稳定或无法归因时，该档不得进入 Owner 评审。

## 4. 图片输入与预处理合同

1. 只接受当前用户任务选中的 App 可读普通本地文件；目录、symlink、remote URL、云端占位未完成下载、零字节、未知格式和视频失败关闭。
2. 在读取像素数据前取得文件字节长度并与当前档比较。无法可信取得长度时拒绝，不能边完整读入内存边计数。
3. 使用受控图片元数据接口读取格式、方向、宽高和 frame 数；只允许一个静态 frame。宽高、乘法、frame 或格式异常时不解码。
4. 解码必须直接生成不超过最长边的下采样像素，应用方向并移除 EXIF/定位等非必要元数据；不生成中间全分辨率副本。
5. 编码固定为去元数据 JPEG 候选；编码结果同时受单图字节、请求总量、临时磁盘和工作内存限制。透明度、动画或无法可靠转换的输入失败关闭，不自动改用无限制 PNG。
6. 若下采样后文字不可读或关键标签裁切，用户只能返回重拍/裁剪/改手工录入；不得自动提高尺寸或质量越过档位。

D-031 是否持久保留业务附件不由此决定。AI 发送副本在成功、失败、取消、超限和启动恢复时均按 D-031/D-036 清理。

## 5. 请求、流与时间合同

- 发送前以最终任务、配置、预算和 policy revision 计算请求上界；预算检查使用与实际请求一致的内容指纹。任何 payload 或 profile 改变都使旧预检和 D-033 确认失效。
- `Content-Length` 或等价声明超过上限时立即拒绝；声明缺失或较小不能放宽实际计数。请求 body 的实际生产与响应解压流都必须逐块计数并在超过前停止继续积累。
- 响应 header 计入名称和值的未压缩 UTF-8/ASCII 逻辑字节。重复 header 逐项累计，不能用最后一个值覆盖计数。
- body 上限作用于 content decoding 后交给 parser 的实际字节；gzip/br 等压缩比不能绕过。未知或多层 content encoding 失败关闭。
- 总时长从发送 effect 被 transport 接受时起到完整响应关闭；idle 从上一个非空解压 body 字节重置。收到空 chunk、heartbeat 或 header 不能无限延长 idle。
- chunk 数只累计非空解压 body 片段，但 body 字节、总时长和 idle 始终独立生效。达到任一上限都关闭流，不保留部分候选。
- 所有档位固定一个前台请求。重复点击、页面重入或重试必须复用 UI busy 状态而不是创建并发请求；旧请求终态未确认前不开始下一次。

## 6. JSON 与领域校验合同

- 原始 response 是不可信 UTF-8 字节。无效 UTF-8、BOM 策略不匹配、尾随内容、重复 key、危险 key、非有限数、负零或未知 schema 在领域校验前拒绝。
- depth、累计 key、累计 array element、总节点和单字符串 UTF-8 字节必须由流式/受控 parser 在建树前或建树过程中失败关闭，不能先 `JSON.parse` 整体超限正文后再遍历。
- 资源预算通过不等于 schema、营养范围、单位或业务真值通过；仍必须执行既有 AI 不可信响应与候选确认合同。
- 错误 UI 只显示稳定原因码与非敏感摘要，不回显 Provider 正文、截断 JSON、用户原始文字、图片路径、key 或 Authorization。

## 7. 临时磁盘、内存与恢复

- 创建 staging 前先验证目录归属、文件保护、排除默认云备份、当前任务 generation 和可用空间预检。所需空间按当前档临时上限加固定安全余量评估；空间未知或不足时不建立请求。
- 每个临时对象都绑定 task/attempt/profile revision、预期上限和生命周期。文件写入采用受限句柄并逐字节计数；文件名不含用户内容、Provider host 或 model。
- 超限、取消、成功、失败或 policy 变化后关闭句柄并清理请求副本、响应 staging、解析临时对象和派生缩略图。清理失败进入隔离待办，不能把残留重新解释为历史。
- 启动时旧 D-033 token 一律失效；未知 staging 按同一 attempt 证据清理或对账。没有可信 durable transport 结果时不得自动重发。
- 日志只记录 profile ID/revision、阶段、原因码、计数、峰值和非正文指纹；不记录载荷、响应、路径中的用户内容或 secret。

## 8. 统一失败原因与用户出口

至少固定以下稳定原因族，正式字符串仍待内容评审：

| 原因族 | 触发阶段 | 必须结果 | 本地出口 |
| --- | --- | --- | --- |
| `AI_BUDGET_INPUT_REJECTED` | 文件、像素、格式、文本或条目超限 | 不解码/不构造请求；清理已建临时对象 | 裁剪、缩短、重新选择或手工录入 |
| `AI_BUDGET_REQUEST_REJECTED` | 编码图、逻辑请求、磁盘或工作内存超限 | 不建立 transport；D-033 确认失效 | 返回修改或手工录入 |
| `AI_BUDGET_RESPONSE_ABORTED` | header/body/chunk/time/idle 超限 | 关闭流、丢弃所有未验证响应、零业务写入 | 修改后重新确认，或手工录入 |
| `AI_BUDGET_PARSE_REJECTED` | UTF-8/JSON/节点/字符串/schema 超限或非法 | 不生成候选、不回显正文、清理解析状态 | 手工录入；可显式重试新任务 |
| `AI_BUDGET_CLEANUP_PENDING` | 临时对象无法证明已清理 | 隔离、启动对账、禁止复用或备份 | 显示本地处理失败，不自动发送 |

重试永远是新的用户动作，重新执行 policy、预算、D-033 确认和 D-053 准入；不得因“只差一点”自动改用更高档。

## 9. 真机 benchmark 与独立复核门禁

三个档位均须在最低支持 iPhone 上分别执行；当前 iPhone 16 Pro Max 只能补充高端设备观察，不能替代最低设备。每档至少覆盖：

- 正常餐食图、细字营养标签、最大允许文件/像素/文本/请求/响应/JSON，以及每个边界 `+1` 的拒绝 fixture。
- 损坏/动画/透明图片、像素炸弹、压缩响应膨胀、慢滴流、空 heartbeat、超 chunk、深 JSON、重复/危险 key、长字符串和大数组。
- 预处理、连接前、上传中、响应中、解析中和候选前取消；App kill/restart、低磁盘、内存警告、前后台切换和重复点击。
- 每次记录设备/OS/build/profile revision、输入指纹、耗时、CPU、process high-water mark、基线增量、临时磁盘峰值、清理后残留、网络请求数和数据库写入数。
- 正常与边界允许样本不得 crash/jetsam，所有超限样本必须在对应阶段稳定失败；取消/失败后业务写入为 0、临时对象最终为 0，标签文字可读性由产品/无障碍复核。

只有三档使用同一 corpus 得到可比较报告，安全与 QA 独立复核 findings 归零，且 PM 明确选择哪些档位可进入 Owner 卡后，才可把状态从 `DEVICE_BENCHMARK_REQUIRED / INDEPENDENT_REVIEW_REQUIRED` 推进。任一档失败不自动使另一档 accepted。

## 10. 四域只读自审

| 领域 | 结论 | 已检查内容 | 未关闭事项 |
| --- | --- | --- | --- |
| Product | `PASS_WITH_GATE` | 三档互斥；质量、等待、兼容性和本地出口可比较；B 沿用旧 provisional 数值 | 真实照片可读性、Provider 兼容和 Owner 选择未完成 |
| Privacy / Security | `PASS_WITH_GATE` | 预算只收紧；D-033/D-036/D-053 不可绕过；解压、慢流、JSON、日志和残留边界明确 | 独立安全复核、真实 transport 和恶意 corpus 未完成 |
| Data integrity | `PASS_WITH_GATE` | 超限丢弃未验证响应、零业务写入、单 attempt 对账、候选确认分离 | 正式 parser/transport/repository 与 kill-point 证据未授权 |
| QA / Accessibility | `PASS_WITH_GATE` | 边界 `+1`、取消、低磁盘、内存、重启、重复点击、可读性和稳定原因族已列出 | 最低设备、VoiceOver/Dynamic Type、网络捕获和 benchmark 报告未完成 |

这是 `CROSS_DOMAIN_SELF_REVIEW_PASS`，不是独立复核，也不是数值实证。D-034 仍未进入机器决定台账或 Owner intake，`D039-PX5-B05` 继续 `OPEN`。

## 11. 证据与推荐边界

- [D-034 候选决定](../04-engineering/decisions/decision-candidates.md) 给出预算维度、共同失败语义和 B 档原始 provisional benchmark candidate；本卡不把它升级为 accepted。
- [D-039 PX-5 实现就绪评估](../05-quality/d039-px5-dor-assessment.md) 将 D-033/D-034/D-036/D-053 共同列为 B05，任一未知都阻断发送。
- [AI 状态与内容合同](states-content-accessibility.md) 已定义 sending、invalidResponse、取消和 Provider policy blocked 用户状态，但不批准任何数值。
- [安全终审](../05-quality/security-review.md) 明确 D-034 仍是 Owner candidate，缺实现、真机、恶意 corpus 和 Release 抓包证据时 G4 不能通过。

据此，B 是“推荐先测”的内部候选，不是“推荐直接接受”。只有同 corpus 真机报告能证明 B 在最低设备上的内存、耗时、清理和图片可读性均满足门禁，PM 才能把它连同 A/C 对比提交 Owner。

## 12. 当前门禁

```text
D-034 decisionState: CANDIDATE
cardState: DRAFT_COMPLETE
selfReviewPassed: true
deviceBenchmarkPassed: false
independentReviewPassed: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
D039-PX5-B05: OPEN
remainingOpenBlockerCount: 5
formalImplementationAuthorized: false
```
