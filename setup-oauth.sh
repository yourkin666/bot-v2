#!/bin/bash

# 🔐 AI小子 Google OAuth 自动配置脚本
# 使用方法: ./setup-oauth.sh

echo "🤖 欢迎使用 AI小子 Google OAuth 配置向导！"
echo "=================================================="

# 检查是否存在.env文件
if [ -f ".env" ]; then
    echo "⚠️  发现现有的 .env 文件"
    read -p "是否要备份现有配置？(y/n): " backup_choice
    if [ "$backup_choice" = "y" ] || [ "$backup_choice" = "Y" ]; then
        cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ 已备份现有配置到 .env.backup.$(date +%Y%m%d_%H%M%S)"
    fi
fi

echo ""
echo "📝 请按照提示输入配置信息："
echo "（直接回车将使用默认值）"
echo ""

# 服务器配置
read -p "🌐 服务器端口 [默认: 3002]: " PORT
PORT=${PORT:-3002}

# JWT配置
echo ""
echo "🔐 安全配置："
read -p "JWT密钥 [默认: 随机生成]: " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="ai-xiao-zi-jwt-$(openssl rand -hex 16)-$(date +%Y%m%d)"
fi

read -p "会话密钥 [默认: 随机生成]: " SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET="ai-xiao-zi-session-$(openssl rand -hex 16)-$(date +%Y%m%d)"
fi

# 邮件配置
echo ""
echo "📧 邮件服务配置："
read -p "SMTP主机 [默认: smtp.qq.com]: " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.qq.com}

read -p "SMTP端口 [默认: 587]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "邮箱地址: " SMTP_USER
while [ -z "$SMTP_USER" ]; do
    echo "❌ 邮箱地址不能为空！"
    read -p "邮箱地址: " SMTP_USER
done

read -p "邮箱授权码: " SMTP_PASS
while [ -z "$SMTP_PASS" ]; do
    echo "❌ 邮箱授权码不能为空！"
    read -p "邮箱授权码: " SMTP_PASS
done

# Google OAuth配置
echo ""
echo "🔑 Google OAuth 配置："
echo "（如果暂时不配置，可以直接回车跳过）"
read -p "Google 客户端ID: " GOOGLE_CLIENT_ID
read -p "Google 客户端密钥: " GOOGLE_CLIENT_SECRET

# GitHub OAuth配置（可选）
echo ""
echo "🐙 GitHub OAuth 配置（可选）："
read -p "GitHub 客户端ID: " GITHUB_CLIENT_ID
read -p "GitHub 客户端密钥: " GITHUB_CLIENT_SECRET

# 生成.env文件
echo ""
echo "🔧 正在生成配置文件..."

cat > .env << EOF
# 🤖 AI小子 环境配置文件
# 生成时间: $(date)

# 服务器配置
PORT=$PORT

# JWT 配置
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# 邮件服务配置
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
EMAIL_FROM=$SMTP_USER

EOF

# 添加Google OAuth配置（如果提供了）
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    cat >> .env << EOF
# Google OAuth 配置
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

EOF
    echo "✅ Google OAuth 配置已添加"
else
    cat >> .env << EOF
# Google OAuth 配置（未配置）
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

EOF
    echo "⚠️  Google OAuth 未配置，需要时请手动添加"
fi

# 添加GitHub OAuth配置（如果提供了）
if [ -n "$GITHUB_CLIENT_ID" ] && [ -n "$GITHUB_CLIENT_SECRET" ]; then
    cat >> .env << EOF
# GitHub OAuth 配置
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET

EOF
    echo "✅ GitHub OAuth 配置已添加"
else
    cat >> .env << EOF
# GitHub OAuth 配置（未配置）
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret

EOF
    echo "⚠️  GitHub OAuth 未配置，需要时请手动添加"
fi

# 添加其他可选配置
cat >> .env << EOF
# 其他配置
# FRONTEND_URL=http://localhost:$PORT
# WEATHER_API_KEY=your-weather-api-key

EOF

echo ""
echo "🎉 配置文件生成完成！"
echo "📁 配置文件位置: $(pwd)/.env"
echo ""

# 显示配置摘要
echo "📋 配置摘要："
echo "├── 服务器端口: $PORT"
echo "├── 邮箱配置: $SMTP_USER"
if [ -n "$GOOGLE_CLIENT_ID" ]; then
    echo "├── Google OAuth: ✅ 已配置"
else
    echo "├── Google OAuth: ❌ 未配置"
fi
if [ -n "$GITHUB_CLIENT_ID" ]; then
    echo "└── GitHub OAuth: ✅ 已配置"
else
    echo "└── GitHub OAuth: ❌ 未配置"
fi

echo ""
echo "🚀 接下来的步骤："
echo "1. 如果需要配置Google OAuth，请参考 GOOGLE_OAUTH_SETUP.md"
echo "2. 运行 'npm start' 启动服务器"
echo "3. 访问 http://localhost:$PORT/login.html 测试登录功能"

echo ""
echo "📚 相关文档："
echo "- 详细配置指南: GOOGLE_OAUTH_SETUP.md"
echo "- 项目文档: README.md"

echo ""
echo "✅ 配置完成！祝您使用愉快！" 