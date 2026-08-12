# F20/F23/F24 禁止能力审计合同

状态：`SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION / CURRENTLY_BLOCKED`

日期：2026-08-12

对应：`F20 / REQ-F20 / AT-F20`、`F23 / REQ-F23 / AT-F23`、`F24 / REQ-F24 / AT-F24`

## 目的

“仓库里暂时没有 StoreKit、广告 SDK 或定位代码”不能作为 Release 负向验收证据，尤其当前应用工程尚未初始化。`tools/prohibited-capability-audit-harness.mjs` 建立一个 fail-closed 的证据聚合合同：审计目标必须是具有稳定 build identity 和 SHA-256 工件摘要的正式签名 Release Archive；每个规定表面都必须有与同一目标绑定、实际执行的报告；任一缺面、未执行或非零发现都会阻断。

合同评估调用方提供的报告，不读取文件、运行扫描器、调用原生 API、访问网络或验证报告内容的真实性。即使聚合结果满足 `PASS` 条件，也不自动关闭 G4/G6/G7 或发布门禁。

## 必查面

| 能力 | 9 个必查面 |
| --- | --- |
| F20 移除会员 IAP | source imports、dependency graph、native configuration、Info.plist、entitlements、产品 UI、binary symbols、Store 商品目录、Release 全进程网络捕获 |
| F23 移除广告/遥测 | source imports、dependency graph、native configuration、Info.plist、entitlements、PrivacyInfo、embedded frameworks、binary symbols、Release 全进程网络捕获 |
| F24 无定位 | source imports、dependency graph、native configuration、Info.plist、entitlements、PrivacyInfo、binary symbols、运行时权限捕获、Release 全进程网络捕获 |

共 27 个 capability/surface 组合。产品 UI、外部 Store 商品目录、网络捕获和权限捕获不能用普通源码字符串扫描报告冒充。

## 判定

`PASS` 条件必须同时成立：

1. `formalTargetPresent=true`，目标种类为 `SIGNED_RELEASE_ARCHIVE`；
2. build identity 和 artifact digest 存在，每份报告精确绑定同一目标；
3. 27 个必查面没有缺失或重复；
4. 每项检查均为 `EXECUTED`，具有报告摘要；
5. 每项 `findingCount=0`。

以下任一条件返回 `BLOCKED`：

- 正式目标不存在；
- 只有 working tree、Debug build 或未签名 Release build；
- 任一面缺失或 `NOT_EXECUTED`；
- 任一面存在禁止能力发现。

当前仓库没有正式签名 Release Archive，也没有 27 份生产工件报告，因此权威当前结果是：

```text
overallDisposition: BLOCKED
blockers: FORMAL_TARGET_ABSENT, REQUIRED_SURFACE_MISSING
productionArtifactScansExecuted: 0
releaseNetworkCapturesExecuted: 0
runtimePermissionCapturesExecuted: 0
```

## 数据边界

- target、evidence 和 report 使用严格版本化 schema；未知字段、未知表面和不一致 presence 被拒绝。
- 同一能力/表面只能出现一次；evidence ID 也必须唯一。
- `EXECUTED` 必须提供 SHA-256 报告摘要和非负安全整数 finding count；`NOT_EXECUTED` 不得携带报告或发现数。
- 输入顺序会被规范化，evidence manifest 和 report 指纹稳定；报告篡改可由 `validateProhibitedCapabilityAuditReport` 检出。
- 指纹只证明聚合输入一致，不证明扫描器可信、报告真实或扫描范围正确；正式审查仍须独立保存扫描命令、工具版本、原始报告和 Release 捕获证据。

## 运行

```powershell
node --test tools/prohibited-capability-audit-harness.test.mjs
```

当前专项：`18/18 PASS`。
