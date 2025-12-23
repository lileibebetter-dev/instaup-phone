#!/bin/bash

# 加载 nvm 环境
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 方法2: 检查 Homebrew 路径
if [ -f "/opt/homebrew/bin/node" ]; then
    export PATH="/opt/homebrew/bin:$PATH"
elif [ -f "/usr/local/bin/node" ]; then
    export PATH="/usr/local/bin:$PATH"
fi

# 方法3: 检查 fnm (Fast Node Manager)
if [ -d "$HOME/.fnm" ]; then
    export PATH="$HOME/.fnm:$PATH"
    eval "$(fnm env --use-on-cd)"
fi

# 进入项目目录
cd "$(dirname "$0")"

# 检查 Node.js 是否可用
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js"
    echo ""
    echo "请先安装 Node.js，可以使用以下方法之一:"
    echo "1. 使用 Homebrew: brew install node"
    echo "2. 使用 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "3. 从官网下载: https://nodejs.org/"
    exit 1
fi

# 显示 Node.js 版本
echo "使用 Node.js 版本: $(node --version)"
echo "使用 npm 版本: $(npm --version)"
echo ""
echo "正在启动开发服务器..."
echo "启动后访问: http://localhost:3000"
echo ""

# 启动开发服务器
npm run dev
