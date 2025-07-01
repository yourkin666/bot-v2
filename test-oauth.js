#!/usr/bin/env node

// 🧪 AI小子 OAuth 配置测试脚本
// 使用方法: node test-oauth.js

// 尝试加载dotenv，如果不存在也不要报错
try {
    require('dotenv').config();
} catch (err) {
    console.log('⚠️  dotenv 未安装，将使用系统环境变量');
}
const http = require('http');

console.log('🧪 AI小子 OAuth 配置测试');
console.log('=====================================');

// 测试环境变量
function testEnvironmentVariables() {
    console.log('\n📋 环境变量检查:');

    const requiredVars = ['JWT_SECRET', 'SESSION_SECRET', 'SMTP_USER', 'SMTP_PASS'];
    const optionalVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'];

    let hasErrors = false;

    // 检查必需变量
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: 已配置`);
        } else {
            console.log(`❌ ${varName}: 未配置 (必需)`);
            hasErrors = true;
        }
    });

    // 检查可选变量
    optionalVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: 已配置`);
        } else {
            console.log(`⚠️  ${varName}: 未配置 (可选)`);
        }
    });

    return !hasErrors;
}

// 测试服务器是否可以启动
function testServerStartup() {
    return new Promise((resolve) => {
        console.log('\n🌐 服务器启动测试:');

        const port = process.env.PORT || 3002;
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Test server running');
        });

        server.listen(port, (err) => {
            if (err) {
                console.log(`❌ 服务器启动失败: ${err.message}`);
                resolve(false);
            } else {
                console.log(`✅ 服务器可以在端口 ${port} 启动`);
                server.close();
                resolve(true);
            }
        });

        server.on('error', (err) => {
            console.log(`❌ 服务器错误: ${err.message}`);
            resolve(false);
        });
    });
}

// 测试Google OAuth URL格式
function testGoogleOAuthConfig() {
    console.log('\n🔑 Google OAuth 配置测试:');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.log('⚠️  Google OAuth 未配置，跳过测试');
        return true;
    }

    // 检查客户端ID格式
    const clientIdRegex = /^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/;
    if (!clientIdRegex.test(clientId)) {
        console.log('❌ Google 客户端ID格式不正确');
        console.log('   正确格式应该是: 123456789-abcdefg.apps.googleusercontent.com');
        return false;
    }

    // 检查客户端密钥格式
    const clientSecretRegex = /^GOCSPX-[a-zA-Z0-9_-]+$/;
    if (!clientSecretRegex.test(clientSecret)) {
        console.log('❌ Google 客户端密钥格式不正确');
        console.log('   正确格式应该是: GOCSPX-AbCdEfGhIjKlMnOp');
        return false;
    }

    console.log('✅ Google OAuth 配置格式正确');
    return true;
}

// 测试依赖包
function testDependencies() {
    console.log('\n📦 依赖包检查:');

    const requiredPackages = [
        'express',
        'passport',
        'passport-google-oauth20',
        'passport-github2',
        'jsonwebtoken',
        'bcrypt'
    ];

    let hasErrors = false;

    requiredPackages.forEach(pkg => {
        try {
            require(pkg);
            console.log(`✅ ${pkg}: 已安装`);
        } catch (err) {
            console.log(`❌ ${pkg}: 未安装`);
            hasErrors = true;
        }
    });

    return !hasErrors;
}

// 生成测试报告
function generateTestReport(results) {
    console.log('\n📊 测试报告:');
    console.log('=====================================');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
        if (!result.passed && result.suggestions) {
            result.suggestions.forEach(suggestion => {
                console.log(`   💡 ${suggestion}`);
            });
        }
    });

    console.log(`\n📈 总分: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);

    if (passed === total) {
        console.log('\n🎉 所有测试通过！您的配置看起来很好！');
        console.log('🚀 可以运行 npm start 启动服务器了');
    } else {
        console.log('\n⚠️  部分测试失败，请检查上面的建议');
        console.log('📚 详细配置指南: GOOGLE_OAUTH_SETUP.md');
    }
}

// 主测试函数
async function runTests() {
    const results = [];

    // 测试环境变量
    const envTest = testEnvironmentVariables();
    results.push({
        name: '环境变量配置',
        passed: envTest,
        suggestions: envTest ? [] : ['请运行 ./setup-oauth.sh 配置环境变量']
    });

    // 测试依赖包
    const depsTest = testDependencies();
    results.push({
        name: '依赖包安装',
        passed: depsTest,
        suggestions: depsTest ? [] : ['请运行 npm install 安装依赖包']
    });

    // 测试服务器启动
    const serverTest = await testServerStartup();
    results.push({
        name: '服务器启动',
        passed: serverTest,
        suggestions: serverTest ? [] : ['检查端口是否被占用，或修改 PORT 环境变量']
    });

    // 测试Google OAuth配置
    const googleTest = testGoogleOAuthConfig();
    results.push({
        name: 'Google OAuth配置',
        passed: googleTest,
        suggestions: googleTest ? [] : ['请检查Google OAuth凭据格式是否正确']
    });

    // 生成报告
    generateTestReport(results);

    // 额外建议
    console.log('\n💡 下一步建议:');
    if (process.env.GOOGLE_CLIENT_ID) {
        console.log('1. 访问 http://localhost:3002/login.html 测试Google登录');
        console.log('2. 确保Google Cloud Console中的重定向URI正确配置');
        console.log('3. 如果遇到问题，查看 GOOGLE_OAUTH_SETUP.md 详细说明');
    } else {
        console.log('1. 如需Google登录，请先配置Google OAuth凭据');
        console.log('2. 运行 ./setup-oauth.sh 重新配置');
        console.log('3. 参考 GOOGLE_OAUTH_SETUP.md 获取详细说明');
    }
}

// 运行测试
runTests().catch(console.error); 