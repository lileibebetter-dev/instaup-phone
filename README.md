# instaup-phone

云秒嗒AI手机应用下载中心（Next.js App Router + Prisma + PostgreSQL）

## 功能

- **前台**：应用列表、应用详情、APK 下载、二维码扫码下载
- **用户指引**：前台 `/guide` 展示已上线的指引文章（支持飞书外链或站内文本）
- **后台**：应用/分类管理、同步上游数据（支持在 OSS 未配置时跳过 APK 上传）

## 目录结构

- `./app`：主应用（Next.js）
- `./docker-compose.yml`：本地/部署用的服务编排（PostgreSQL / Redis / web / worker）

## 本地启动（推荐）

1) 启动数据库/缓存：

```bash
cd yunmiaoda-app-center
docker compose up -d postgres redis
```

2) 配置环境变量：

- 参考 `app/env.example` 在 `app/.env` 填写（不要提交 `.env`）

3) 初始化数据库并启动：

```bash
cd yunmiaoda-app-center/app
npm i
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

打开 `http://localhost:3000`

## 用户指引（飞书/多篇文章）

### 后台管理

- 访问后台：`/admin/guides`
- 支持：新增/编辑/排序/上线/下线/删除
- 字段建议：
  - **标题**：显示在前台列表
  - **外链 URL**：粘贴飞书 wiki 链接（例如 `https://oxi2wwky3kh.feishu.cn/wiki/...`）
  - **内容**：如果不填外链，可直接填站内文本（前台会展示）
  - **排序**：越小越靠前

### 前台展示规则

- 前台列表：`/guide` 只展示 **已上线（PUBLISHED）** 的指引
- 如果指引填写了 **外链 URL**：点击会直接跳转到外链

