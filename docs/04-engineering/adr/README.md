# 架构决策记录

ADR 记录已经 Owner 接受的工程决策、理由、后果和复审条件。ADR 不取代治理台账；状态必须与 `docs/00-governance/decision-register.md` 和 `project-ops/decisions.json` 一致。

| ADR | 状态 | 关联决策 | 主题 |
| --- | --- | --- | --- |
| [ADR-0001](0001-expo-development-build-and-checked-in-ios.md) | accepted | D-005 | Expo Development Build、Prebuild 与检入 `ios/` |
| [ADR-0002](0002-ios-17-minimum.md) | accepted | D-011 | iOS 17+ 最低版本 |
| [ADR-0003](0003-ai-transport-only-network-boundary.md) | accepted | D-003、D-004、D-014 | AITransport 唯一业务网络边界 |
| [ADR-0004](0004-sqlcipher-and-keychain.md) | accepted | D-006、D-015 | SQLCipher 与 Keychain 数据库密钥 |
| [ADR-0005](0005-offline-data-pack-and-manual-backup.md) | accepted | D-002、D-006、D-012、D-013 | 离线数据包与手动加密备份 |

尚未接受的 package 级选择统一放在 [D-018+ 技术决策候选](../decisions/decision-candidates.md)，不得建立 `accepted` ADR。

