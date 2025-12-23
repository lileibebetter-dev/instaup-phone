#!/bin/bash

# PostgreSQL 安装脚本 (macOS)

echo "正在检查 PostgreSQL..."

# 检查是否已安装
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL 已安装"
    psql --version
    exit 0
fi

# 检查是否有 Homebrew
if command -v brew &> /dev/null; then
    echo "检测到 Homebrew，正在安装 PostgreSQL..."
    brew install postgresql@16
    brew services start postgresql@16
    
    # 创建数据库
    sleep 2
    createdb yunmiaoda 2>/dev/null || echo "数据库可能已存在"
    echo "✅ PostgreSQL 安装完成！"
    echo ""
    echo "数据库信息："
    echo "  主机: localhost"
    echo "  端口: 5432"
    echo "  数据库: yunmiaoda"
    echo "  用户名: postgres"
    echo "  密码: postgres"
    exit 0
fi

echo "❌ 未检测到 Homebrew"
echo ""
echo "请选择安装方式："
echo ""
echo "方式 1: 安装 Homebrew 后使用此脚本"
echo "  访问 https://brew.sh/ 安装 Homebrew"
echo ""
echo "方式 2: 手动下载安装 PostgreSQL"
echo "  访问 https://www.postgresql.org/download/macosx/"
echo "  下载并安装 PostgreSQL"
echo ""
echo "方式 3: 使用 Docker（如果已安装 Docker Desktop）"
echo "  cd yunmiaoda-app-center"
echo "  docker-compose up -d postgres"

