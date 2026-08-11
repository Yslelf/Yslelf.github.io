# XY 南昌前端

Vue 3 + TypeScript + UniApp 项目，首版实现“探索”模块和四栏底部导航。

## 本地开发

```bash
npm install
npm run dev:h5
```

微信小程序开发使用 `npm run dev:mp-weixin`，然后通过微信开发者工具打开 `dist/dev/mp-weixin`。

## 数据与 API 对接

- 默认读取 `src/mock/mock.json`。
- 将 `.env.example` 复制为 `.env`，设置 `VITE_USE_MOCK=false` 后，请求 `GET /api/explore/home`。
- `VITE_API_BASE_URL` 指向 ASP.NET Core API 地址。
- Axios 使用 UniApp 请求适配器，因此 H5、App 和小程序共用相同 service 接口。

`mock.json` 的顶层结构为 `city`、`weather`、`categories`、`places`、`posts`，后端 DTO 可按 `src/types/explore.ts` 建模。

## 地图

当前使用 UniApp `map` 组件展示假数据坐标。H5/小程序正式接入高德时，在对应平台申请 Key，并通过环境变量和平台配置注入，不要将 Key 提交到仓库。
