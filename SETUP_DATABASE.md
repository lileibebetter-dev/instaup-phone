# 本地数据库设置指南

本项目使用 PostgreSQL 数据库。以下是几种在本地启动数据库的方法：

## 方法 1: 使用 Docker（推荐）

如果你已经安装了 Docker Desktop：

```bash
cd yunmiaoda-app-center
docker-compose up -d postgres
```

这将启动 PostgreSQL 数据库在 `localhost:5432`。

## 方法 2: 使用 Homebrew 安装 PostgreSQL（macOS）

### 步骤 1: 安装 Homebrew（如果还没有）

访问 https://brew.sh/ 或运行：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 步骤 2: 安装 PostgreSQL

```bash
brew install postgresql@16
```

### 步骤 3: 启动 PostgreSQL 服务

```bash
brew services start postgresql@16
```

### 步骤 4: 创建数据库

```bash
createdb yunmiaoda
```

或者使用 psql：
```bash
psql postgres
CREATE DATABASE yunmiaoda;
\q
```

## 方法 3: 手动下载安装 PostgreSQL

1. 访问 https://www.postgresql.org/download/macosx/
2. 下载并安装 PostgreSQL
3. 创建数据库 `yunmiaoda`

## 初始化数据库表结构

安装并启动 PostgreSQL 后，运行：

```bash
cd yunmiaoda-app-center/app
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
npx prisma db push
```

或者使用启动脚本：
```bash
cd yunmiaoda-app-center/app
bash start-dev.sh
```

数据库连接信息（在 `.env` 文件中）：
- 主机: localhost
- 端口: 5432
- 数据库: yunmiaoda
- 用户名: postgres
- 密码: postgres

