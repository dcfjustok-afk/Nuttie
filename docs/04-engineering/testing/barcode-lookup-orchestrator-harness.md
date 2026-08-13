# F03 本地条码查找编排合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`

本合同把 F03 从“本地目录能够按 GTIN 查询”推进到应用编排边界：调用方提交完整条码字符串，编排器只查询当前本地目录；命中后必须显式选择候选并交给调用方统一复核，未命中则携带原 GTIN 交给调用方自建食品。整个过程不写食品、不写日记、不调用相机、不联网，也不自动进入 AI。

## 状态与交接

```text
AWAITING_GTIN
  -> SUBMIT_GTIN + LOCAL MATCH
  -> CANDIDATE_SELECTION_REQUIRED
  -> SELECT_CANDIDATE
  -> FOOD_REVIEW_READY

AWAITING_GTIN
  -> SUBMIT_GTIN + LOCAL MISS
  -> MANUAL_CREATION_READY

任一后续状态
  -> RETRY_INPUT
  -> AWAITING_GTIN
```

- 只接受 8、12、13 或 14 位完整数字 GTIN，并保留前导零。
- `CAMERA_RESULT` 只是 F21 或未来相机 adapter 已输出的完整字符串；本合同不请求权限、不识别图片、不纠错或模糊猜测条码。
- 即使本地精确查询只返回一个候选，也不自动选择。多来源候选保持目录的来源顺序和独立事实，不合并、不提升来源。
- `FOOD_REVIEW_READY` 只暴露所选本地候选 ID 和调用方版本化复核定义；份量、字段、保存动作仍由调用方决定。
- `MANUAL_CREATION_READY` 只保留精确 GTIN、是否为空目录和调用方版本化建档定义；编排器没有创建食品命令。
- `RETRY_INPUT` 清除当前查询/选择证据，但保留日期、餐次、返回位置等 opaque 调用方任务上下文。

## 证据与失败关闭

状态、任务定义、任务上下文和查询结果均有稳定指纹。进入查询后的每次状态校验都必须重新使用同一个可信本地目录端口执行精确 GTIN 查询；目录被替换、候选内容被篡改、查询指纹不匹配、选择不存在候选、陈旧 revision、跨 operation 命令或派生状态被修改时全部失败关闭。候选证据在目录比对前先执行深度、条目、字符串和循环预算检查。

固定边界：

| 能力 | 合同值 |
| --- | --- |
| 查询 | `LOCAL_EXACT_GTIN_ONLY` |
| 网络回退 | `FORBIDDEN`；真实请求 `0` |
| 自动选择 / 来源合并 | `FORBIDDEN` |
| 食品目录 / 日记写入 | `NOT_AUTHORIZED` |
| 份量与统一复核 | `CALLER_OWNED_REVIEW` |
| 相机权限 | `EXTERNAL_F21_ORCHESTRATOR`；原生调用 `0` |
| AI 未命中路径 | 独立用户主动流程，本合同未授权 |

## 当前自动化证据

20 项 Node 测试覆盖等待态、opaque 定义资源预算、手输/相机结果、前导零、单/多候选显式选择、来源不合并、普通/空目录未命中、重试、非法 GTIN、可信目录端口、目录替换、证据篡改、陈旧命令、状态派生字段、深拷贝冻结和零网络/原生/持久化/时钟/自动保存路径。

```powershell
node --test tools/barcode-lookup-orchestrator-harness.test.mjs
```

## 后续生产门禁

本合同不证明 D-026 数据包签名算法或 key lifecycle、D-052 数据许可、条码覆盖率、相机组件/权限文案、真实离线包安装、SQLite/SQLCipher adapter、统一复核页面、用户食品 Repository、真机飞行模式或 Release 证据。正式 F03 仍须在批准的工程中实现这些 adapter，并按 AT-F03 覆盖相机拒绝、手动输码、包缺失/损坏、未命中建档、候选复核、200–500 个真实条码的“命中率/七项营养完整率”分离统计及零业务网络抓包。
