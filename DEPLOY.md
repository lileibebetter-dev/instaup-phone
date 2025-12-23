## 云秒嗒AI手机下载中心：部署说明（Docker Compose）

目录结构：
- `./app`：Next.js（前台+后台+API）+ worker 代码
- `./docker-compose.yml`：一键启动（web + worker + postgres + redis）
- `./docker.env.example`：环境变量示例

### 1) 准备环境变量

1. 复制一份环境变量文件：

```bash
cp docker.env.example .env
```

2. 编辑 `.env`，至少修改：
- `AUTH_SECRET`
- `ADMIN_PASSWORD`
- `OSS_*`（用于上传 APK）

### 2) 启动服务

在 `yunmiaoda-app-center` 目录执行：

```bash
docker compose up -d --build
```

首次启动会执行：
- `npx prisma db push` 自动建表（PostgreSQL）
- web 服务启动在 `3000` 端口
- worker 监听 Redis 队列执行同步任务

### 3) 访问

- 前台：`http://<服务器IP>:3000`
- 后台：`http://<服务器IP>:3000/admin/login`

### 4) 一键同步

后台进入 “同步” 页面点击 **立即同步**：
- 若配置了 `REDIS_URL`（compose 已配置），任务会入队并由 worker 执行
- 同步日志会写入数据库，可在同步页面查看

### 5) 常见问题

- **同步没有拉到 APK**：上游页面结构可能调整。同步逻辑在 `app/src/worker/syncUpstream.ts`，可根据上游实际 HTML 结构微调选择器。
- **OSS 下载链接不可访问**：请配置 `OSS_PUBLIC_BASE_URL` 为你实际可公网访问的 OSS 域名或 CDN 域名，并确保 bucket 权限/回源配置正确。



