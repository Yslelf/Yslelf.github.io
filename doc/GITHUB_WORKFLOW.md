# GitHub 与自动预览流程

## 仓库范围

Git 仓库根目录是 `XY_NanChang`，统一保存：

- `xy-frontend`：Vue 3 + TypeScript + UniApp 前端；
- `doc`：API、数据库、架构和部署文档；
- 后续 ASP.NET Core 服务端与测试项目。

## 自动发布

`.github/workflows/deploy-pages.yml` 会在 `main` 分支每次推送后：

1. 安装锁定版本的依赖；
2. 执行 TypeScript 检查；
3. 构建 UniApp H5；
4. 将 `xy-frontend/dist/build/h5` 发布到 GitHub Pages。

GitHub 仓库名为 `Yslelf.github.io`，因此 H5 使用根路径 `/` 构建，发布地址为 `https://yslelf.github.io/`。

仓库首次创建后，需要在 GitHub 的 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。

高德地图线上预览需要在仓库 **Settings → Secrets and variables → Actions** 增加：

- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_CODE`

## 日常口令

以后提出“上传 GitHub”时，默认流程是：

1. 查看改动，避免提交本地密钥和构建产物；
2. 执行类型检查和 H5 构建；
3. 创建说明清晰的 Git 提交；
4. 推送 `main`；
5. 检查 GitHub Actions 和 Pages 部署结果。

需要回滚时优先使用 `git revert <commit>`，保留完整历史，不使用破坏性重置。
