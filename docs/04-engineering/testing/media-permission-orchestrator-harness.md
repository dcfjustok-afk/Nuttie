# 媒体权限编排合同 Harness

> 状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION`
>
> 对应：F21 / REQ-F21 / AT-F21；同时服务 J-03/J-04 的相机拒绝降级边界
>
> 实现：[media-permission-orchestrator-harness.mjs](../../../tools/media-permission-orchestrator-harness.mjs)；测试：[media-permission-orchestrator-harness.test.mjs](../../../tools/media-permission-orchestrator-harness.test.mjs)

## 目的与边界

F21 要求媒体权限只在用户当前任务触发时申请，拒绝或受限后不能阻塞手工路径；同时禁止借任务申请无关照片全库、视频或定位权限。D-031 仍未决定原图、压缩副本、缩略图和 AI 内容是否/多久持久保存，因此权限合同不能顺带选择媒体保留策略。

本 harness 只负责框架无关的应用状态机和原生 effect 合同：

- 相机拍摄、用户从系统选择已有媒体和手工输入是三个不同 input mode；
- 只有 `CAMERA_CAPTURE + NOT_DETERMINED` 会先进入任务说明，再由明确 command 生成一次窄相机权限 effect；
- `USER_SELECTED_MEDIA` 直接进入系统用户选择语义，不申请照片全库权限，也不读取相机权限；
- `MANUAL_ENTRY` 不读取任何媒体权限；
- 拒绝、受限、运行期撤权、用户取消或迟到结果都保留调用方定义的手工路径；
- 没有真实相机/照片 API、文件系统、网络、系统时钟或媒体写入；
- 文案、route、保留策略和系统设置 UI 都由未来经批准的调用方提供，不在 harness 中写死。

## 调用方任务定义

调用方显式提供版本化 `MEDIA_TASK_DEFINITION_V1`：

```text
{
  taskId,
  definitionVersion,
  allowedInputModes,
  taskExplanationDefinition,
  manualFallbackDefinition
}
```

两份 definition 都是受资源预算约束的 opaque JSON。测试中的 key 不构成产品文案、route 或字段批准。允许 input mode：

- `CAMERA_CAPTURE`：拍摄当前任务需要的静态媒体；
- `USER_SELECTED_MEDIA`：由用户通过系统 picker 明确选择已有媒体；
- `MANUAL_ENTRY`：调用方定义的无媒体降级路径。

任何允许相机的任务都必须同时声明 `MANUAL_ENTRY`，否则定义被拒绝。合同没有 video mode。

## 状态机

相机权限状态只允许 `NOT_DETERMINED / AUTHORIZED / DENIED / RESTRICTED`，每次 evidence 带显式 revision。

```text
CAMERA_CAPTURE + NOT_DETERMINED
  -> AWAITING_TASK_EXPLANATION
  -> AWAITING_CAMERA_PERMISSION_OUTCOME
  -> READY_FOR_CAMERA_TASK | MANUAL_FALLBACK_READY

CAMERA_CAPTURE + AUTHORIZED
  -> READY_FOR_CAMERA_TASK

CAMERA_CAPTURE + DENIED/RESTRICTED
  -> MANUAL_FALLBACK_READY

USER_SELECTED_MEDIA
  -> READY_FOR_USER_SELECTED_MEDIA

MANUAL_ENTRY
  -> MANUAL_FALLBACK_READY
```

运行期权限 refresh 可以把 camera-ready 状态降为手工路径，也可以在用户从系统设置重新授权后回到当前相机任务；revision 必须前进。权限请求结果未知时，用户仍可选择手工路径。此时 pending effect 被清除，之后到达的旧系统回执因 phase/effect fingerprint 不匹配被拒绝。

## Effect 绑定

任务说明被明确确认后，状态机只生成：

```text
MEDIA_PERMISSION_EFFECT_V1 {
  effectId,
  operationId,
  stateRevision,
  kind: "REQUEST_CAMERA_FOR_CURRENT_TASK",
  permission: "CAMERA",
  taskDefinitionFingerprint,
  effectFingerprint
}
```

它不是原生调用结果，只是未来 adapter 的窄命令。outcome 必须绑定 pending effect fingerprint、同一 operation 和精确 state revision；permission evidence revision 必须增加。跨任务、迟到、重复、伪造或 stale outcome 全部 fail closed。

## 固定控制边界

| 边界 | 合同值 |
| --- | --- |
| 相机权限范围 | `CURRENT_USER_TRIGGERED_TASK_ONLY` |
| 照片全库权限 | `NOT_REQUESTED_USE_SYSTEM_USER_SELECTION` |
| 视频拍摄 | `NOT_AUTHORIZED` |
| 定位权限 | `NOT_AUTHORIZED` |
| 媒体保留 | `D031_NOT_AUTHORIZED` |
| 媒体持久化 | `NOT_AUTHORIZED` |
| 真实原生 API 调用 | `0` |
| 网络请求 | `0` |

## 当前测试证据

19 项 Node 测试覆盖：

- caller-owned 版本化任务说明/手工路径定义及防资源滥用；
- 相机任务强制手工降级、未知 mode 与 video 拒绝；
- 未决定权限先说明且零 effect；说明确认后窄 effect 绑定；
- 授权回到当前任务，拒绝/受限回到手工路径；
- 已授权/已拒绝启动不重复请求；
- 用户选择媒体不读取相机 evidence、不请求照片全库权限；
- 手工输入零权限依赖；
- 运行期撤权/再授权；请求中选择手工路径和迟到 outcome 拒绝；
- stale revision、错误 operation、伪造 effect、stale evidence 与无关 permission 拒绝；
- phase/next action/boundary/definition/effect/fingerprint 防篡改；
- 输入深拷贝冻结；
- 视频、定位、保留、持久化、真实原生调用和网络固定未授权；
- 源码不存在真实媒体库、文件系统、网络、系统时钟、权限文案或保留期实现。

运行：

```powershell
node --test tools/media-permission-orchestrator-harness.test.mjs
```

## 后续生产门禁

本 harness 不证明 iOS permission API、Info.plist usage string、system picker、相机硬件、后台/前台切换或真机撤权有效。正式实现仍需：

1. Owner 批准精确权限文案，并由可访问组件在任务触发点展示；
2. 选定 RN/原生 adapter 后，把 effect 精确映射到一次相机权限请求，禁止批量预请求；
3. 用系统 user-selection 路径验证无需无关照片全库权限，并审计生成的 Info.plist；
4. 真机覆盖首次允许/拒绝、restricted、运行期撤权、设置后返回、App 前后台与无相机设备；
5. 单独关闭 D-031，之后才能设计媒体落盘、临时副本、清理和 wipe/备份范围；
6. AI 图片还必须继续通过 D-014/D-033/D-034/D-053 与 AITransport 门禁，本合同不授权任何上传。

因此它只把 F21 的应用编排从缺口推进为框架无关覆盖，不关闭原生或 Release 验收。
