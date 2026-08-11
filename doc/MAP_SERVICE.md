# 地图服务接入

## 当前方案

- H5：高德地图 JavaScript API 2.0，通过 `@amap/amap-jsapi-loader` 在线加载。
- App：UniApp `map` 组件，`provider="amap"`。
- 微信小程序：使用 UniApp `map` 组件；地点坐标和业务接口保持统一。
- 业务组件：`xy-frontend/src/components/map/AmapExplorer.vue`。

## 本地配置

1. 在高德开放平台创建 **Web 端（JS API）Key**，取得 Key 和安全密钥。
2. 复制 `xy-frontend/.env.example` 为 `xy-frontend/.env.local`。
3. 填写 `VITE_AMAP_KEY` 与 `VITE_AMAP_SECURITY_CODE`。

没有配置时页面显示配置提示，不会出现空白地图。

## ASP.NET Core 正式环境

生产环境不应把高德 Web 服务密钥写进前端。逆地理编码、周边搜索、路线规划等 Web Service 请求由 ASP.NET Core 封装并保存密钥；前端只传经纬度、半径和业务筛选条件。JS API 的安全代理也应由后端提供，并限制域名、配额和调用来源。

建议接口：

- `GET /api/v1/map/places/nearby?longitude=&latitude=&radius=&category=`
- `GET /api/v1/map/geocode/reverse?longitude=&latitude=`
- `GET /api/v1/map/routes/walking?origin=&destination=`

