#!/bin/bash

# AI小子 - 环境配置设置脚本
# 用于快速设置开发环境

echo "🚀 AI小子环境配置助手"
echo "========================"

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "📝 .env文件不存在，正在从模板创建..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已创建.env文件"
        echo "⚠️  请编辑.env文件并填入您的实际配置值"
        echo ""
        echo "需要配置的项目："
        echo "  🤖 OPENAI_API_KEY - 主要AI模型密钥"
        echo "  🧠 DEEPSEEK_API_KEY - 深度思考模型密钥"  
        echo "  🔍 SEARCH_API_KEY - 搜索服务密钥"
        echo "  🔐 JWT_SECRET - JWT认证密钥"
        echo "  🔐 SESSION_SECRET - 会话密钥"
        echo "  📧 SMTP_USER - 邮箱地址"
        echo "  📧 SMTP_PASS - 邮箱授权码"
        echo "  📧 EMAIL_FROM - 发件人邮箱"
        echo ""
        echo "📖 详细配置说明请查看: ENVIRONMENT_SETUP.md"
        
        # 提示用户编辑配置
        read -p "现在打开.env文件进行编辑？ (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v code &> /dev/null; then
                code .env
            elif command -v nano &> /dev/null; then
                nano .env
            elif command -v vim &> /dev/null; then
                vim .env
            else
                echo "请手动编辑 .env 文件"
            fi
        fi
    else
        echo "❌ .env.example文件不存在，无法创建配置"
        exit 1
    fi
else
    echo "✅ .env文件已存在"
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

echo ""
echo "🎉 环境配置完成！"
echo ""
echo "启动命令："
echo "  npm start        # 启动服务"
echo "  npm run dev      # 开发模式启动"
echo ""
echo "访问地址："
echo "  http://localhost:3002" 