# AI小子Bot服务启动脚本


# 需要启动：运行 ./start-bot.sh start
# 需要重启：运行 ./start-bot.sh restart
# 检查状态：运行 ./start-bot.sh status

ACTION=${1:-status}

echo "🤖 AI小子Bot服务管理脚本"
echo "================================"

case $ACTION in
    "start")
        echo "📍 正在启动服务..."
        
        # 1. 启动nginx
        echo "🔄 启动nginx服务..."
        systemctl start nginx
        
        # 2. 切换到项目目录
        cd /root/bot-v2
        
        # 3. 启动Node.js服务（使用PM2）
        echo "🚀 启动AI小子Bot服务..."
        pm2 start ecosystem.config.js
        
        # 4. 验证服务状态
        sleep 3
        echo "✅ 服务启动完成！"
        ;;
        
    "stop")
        echo "🛑 正在停止服务..."
        
        # 停止PM2进程
        pm2 stop ai-xiaozi-bot
        
        # 停止nginx（可选，通常不需要）
        # systemctl stop nginx
        
        echo "✅ 服务已停止！"
        ;;
        
    "restart")
        echo "🔄 正在重启服务..."
        
        # 重启nginx
        systemctl reload nginx
        
        # 重启PM2进程
        pm2 restart ai-xiaozi-bot
        
        echo "✅ 服务重启完成！"
        ;;
        
    "status")
        echo "📊 检查服务状态..."
        echo ""
        
        # 检查nginx状态
        echo "🔄 nginx服务状态："
        systemctl is-active nginx && echo "✅ nginx: 运行中" || echo "❌ nginx: 未运行"
        
        echo ""
        
        # 检查PM2状态
        echo "🚀 AI小子Bot状态："
        pm2 status
        
        echo ""
        
        # 检查端口监听
        echo "🌐 端口监听状态："
        netstat -tlnp | grep -E ":(80|8080)" | while read line; do
            if echo "$line" | grep -q ":80 "; then
                echo "✅ 端口80 (nginx): 正在监听"
            elif echo "$line" | grep -q ":8080 "; then
                echo "✅ 端口8080 (Bot): 正在监听"
            fi
        done
        
        echo ""
        
        # 测试服务访问
        echo "🧪 测试服务访问："
        if curl -s http://localhost/ | grep -q "html"; then
            echo "✅ 本地访问: 正常"
        else
            echo "❌ 本地访问: 异常"
        fi
        
        if curl -s http://47.84.70.153/ | grep -q "html"; then
            echo "✅ 公网访问: 正常"
        else
            echo "❌ 公网访问: 异常"
        fi
        
        echo ""
        echo "🌐 访问地址: http://47.84.70.153/"
        ;;
        
    *)
        echo "❌ 无效参数！"
        echo ""
        echo "使用方法:"
        echo "  bash start-bot.sh start   # 启动服务"
        echo "  bash start-bot.sh stop    # 停止服务"
        echo "  bash start-bot.sh restart # 重启服务"
        echo "  bash start-bot.sh status  # 查看状态"
        exit 1
        ;;
esac

echo "================================" 