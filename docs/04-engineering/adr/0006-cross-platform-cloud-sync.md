# ADR 0006：跨平台客户端与云端同步

状态：`ACCEPTED / 2026-08-29`

## 背景

原工程只规划 iOS 和本地数据库。用户现在要求 Android 与移动 H5，并明确选择“云端账号同步”。继续沿用无服务器假设会让三端无法共享身份、历史和冲突状态；直接复制一个重型实时后端又会引入不必要的 Redis、WebSocket 和运营面。

## 决策

采用三层单仓库：

```text
Expo / React Native (iOS + Android + Web)
        |
        | shared TypeScript contracts + domain rules
        v
TypeScript API service (REST, auth, sync)
        |
        v
PostgreSQL (users, sessions, records, mutations)
```

- 客户端采用 Expo Router，页面和领域逻辑共享，平台差异只存在于适配层；
- API 采用版本化 REST，首期不做 WebSocket；
- PostgreSQL 作为跨设备同步的权威存储；
- 客户端本地缓存保存最近快照和待发送 mutation，支持离线新增；
- 每条 mutation 有 `clientMutationId`，服务端以唯一约束实现幂等；
- 每条实体有单调 `revision`。客户端提交时带 `baseRevision`，版本不匹配返回可呈现的冲突，而不是静默覆盖；
- 对餐食、饮水、体重等 append-only 记录默认采用“新记录合并”；对档案和目标采用显式冲突提示；
- Web 使用 `httpOnly`、`Secure`、`SameSite=Lax` refresh cookie；iOS/Android 使用系统安全存储保存 refresh token；access token 短时有效且只留在内存；
- API 不接收或保存 AI provider key，不做服务端 AI 代理；这保持原有 BYOK 和隐私边界。

## 首期部署拓扑

```text
Browser or native client (HTTPS) ---> web/Nginx (public)
                         | /api/* private upstream
                         v
                      api (private)
                         |
                         v
                    PostgreSQL (private)
```

Both browser and native clients use the same public web origin. Web requests
use same-origin `/api` calls and an HttpOnly refresh cookie; native builds set
`EXPO_PUBLIC_API_URL` to that origin (the client appends `/api`) and send
`x-client-platform: native`, so the API returns the refresh token in the
response body for native secure-store persistence. The API and PostgreSQL
services remain private and are never
published as separate public origins.

Android/iOS 从构建时公开配置读取 API origin；公开配置不包含密钥。Zeabur 以 `Dockerfile.web`、`Dockerfile.api` 和官方 PostgreSQL 服务部署，watch paths 只监听相关源码和共享契约。Redis、对象存储、后台队列、远程推送和管理后台留到出现真实需求再单独决策。

## 结果与代价

优点：一套信息架构覆盖三端；离线记录仍有韧性；同步冲突可以解释；部署面小，能复用 Royal-Flush 的 Nginx、health/readiness 和 Zeabur 变量模式。

代价：需要账号生命周期、刷新令牌撤销、数据库迁移、跨端安全存储和隐私政策；“本地永不离开设备”的旧承诺不再成立，产品必须在登录和同步入口明确告知用户。

## 不在本 ADR 内

端到端加密、社交/共享家庭空间、HealthKit/Health Connect、AI 服务端代理、实时协作、付费与运营后台都需要新的产品决策和威胁模型，不能由本 ADR 自动授权。
