# XY 南昌项目结构

## 当前结构

```text
XY_NanChang/
├── doc/                         # 架构与接口文档
└── xy-frontend/                 # Vue3 + TS + UniApp 客户端
    ├── src/
    │   ├── pages/               # 探索页和导航占位页
    │   ├── services/            # Axios + UniApp adapter
    │   ├── stores/              # Pinia 状态
    │   ├── types/               # API DTO 类型
    │   ├── mock/mock.json       # 开发假数据
    │   ├── App.vue
    │   ├── manifest.json
    │   └── pages.json
    ├── .env.example
    └── package.json
```

## 推荐完整单仓结构

```text
XY_NanChang/
├── apps/
│   ├── xy-client/               # 现有 xy-frontend 后续可迁入
│   └── xy-admin/                # Vue3 + Element Plus/Arco 后台
├── backend/
│   ├── XY.Api/                  # 路由、中间件、OpenAPI、DI
│   ├── XY.Application/          # 用例、DTO、验证、接口
│   ├── XY.Domain/               # 聚合、实体、值对象、领域规则
│   ├── XY.Infrastructure/       # EF Core、Redis、存储、第三方服务
│   ├── XY.Worker/               # 审核、通知和统计后台任务
│   └── XY.Contracts/            # 对外 API 契约（可选）
├── tests/
│   ├── XY.Domain.Tests/
│   ├── XY.Application.Tests/
│   └── XY.Api.IntegrationTests/
├── doc/
├── deploy/                      # Docker、反向代理、观测配置
└── XY.sln
```

当前不提前搬到 `apps`，避免在只有一个客户端时增加目录噪声；创建管理端或后端时再完成迁移。

## ASP.NET Core 按能力组织示例

```text
XY.Application/
└── Explore/
    ├── GetExploreHome/
    │   ├── Query.cs
    │   ├── Handler.cs
    │   ├── Validator.cs
    │   └── Response.cs
    └── GetNearbyPlaces/
```

这样一个功能的查询、验证和返回模型集中存放，比横向堆叠数百个 Services/DTOs 更容易维护。

## 命名规则

- C# 类型 PascalCase，JSON 和 TypeScript 属性 camelCase。
- 数据表 snake_case，主外键统一 `{entity}_id`。
- API 使用复数资源名，如 `/places/{id}/posts`。
- 环境变量大写下划线；禁止提交真实密钥和生产地址。
