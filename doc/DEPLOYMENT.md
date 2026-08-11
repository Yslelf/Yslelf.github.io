# XY 南昌部署与环境

## 1. 环境划分

| 环境 | 用途 | 数据 |
| --- | --- | --- |
| local | 本地开发 | mock.json 或本地 API |
| dev | 联调环境 | 可重置测试数据 |
| staging | 上线前验收 | 脱敏近生产配置 |
| production | 正式环境 | 受控迁移与备份 |

## 2. 前端变量

```dotenv
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api-dev.example.com/api/v1
VITE_AMAP_KEY=客户端平台对应的受限Key
```

H5、App、微信小程序使用不同环境文件和高德 Key。微信小程序还需在平台后台配置合法请求域名。

## 3. 后端变量建议

```text
ConnectionStrings__MainDatabase
ConnectionStrings__Redis
Jwt__Issuer
Jwt__Audience
Jwt__SigningKey
Amap__WebServiceKey
Storage__Endpoint
Storage__Bucket
Storage__AccessKey
Storage__SecretKey
```

生产密钥由密钥管理系统注入，不写入配置文件、镜像或 CI 日志。

## 4. 构建

- H5：`npm run build:h5`
- 微信小程序：`npm run build:mp-weixin`
- API：`dotnet publish -c Release`

后端容器启动时不自动执行破坏性迁移。EF Core migration 需在发布流水线中单独审核和执行。

## 5. 可观测性

- API 使用结构化日志、TraceId 和 OpenTelemetry。
- 采集请求耗时、5xx、数据库慢查询、Feed 命中率和地图服务错误率。
- 业务指标至少包含探索曝光、地点详情打开、有用互动、发布转化。

## 6. 数据安全

- PostgreSQL 每日备份并定期恢复演练。
- 媒体对象设置生命周期和审核隔离区。
- 用户定位按最小精度与最短期限保存；日志不记录身份证、令牌、完整手机号和精确坐标。
