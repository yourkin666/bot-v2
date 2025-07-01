module.exports = {
    apps: [{
        name: 'ai-xiaozi-bot',
        script: 'server.js',
        cwd: '/root/bot-v2',
        instances: 1,
        env: {
            NODE_ENV: 'production',
            PORT: 8080
        },
        // 自动重启配置
        watch: false,
        max_memory_restart: '1G',
        restart_delay: 5000,

        // 日志配置
        log_file: '/var/log/ai-xiaozi-bot.log',
        error_file: '/var/log/ai-xiaozi-bot-error.log',
        out_file: '/var/log/ai-xiaozi-bot-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',

        // 进程健康检查
        min_uptime: '10s',
        max_restarts: 10,

        // 其他配置
        node_args: '--max-old-space-size=1024'
    }]
}; 