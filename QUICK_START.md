# 🚀 AI小子 Google OAuth 快速配置指南

## 快速开始（5分钟设置）

### 方法一：自动配置（推荐）

```bash
# 1. 运行自动配置脚本
./setup-oauth.sh

# 2. 测试配置
node test-oauth.js

# 3. 启动服务器
npm start
```

### 方法二：手动配置

#### 1. 创建 `.env` 文件
```bash
touch .env
```

#### 2. 编辑 `.env` 文件，添加以下内容：
```bash
# 基本配置
PORT=3002
JWT_SECRET=ai-xiao-zi-super-secret-key-2024
SESSION_SECRET=ai-xiao-zi-session-secret-2024

# 邮件配置（必须）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=你的QQ邮箱@qq.com
SMTP_PASS=你的QQ邮箱授权码
EMAIL_FROM=你的QQ邮箱@qq.com

# Google OAuth（可选，但推荐）
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
```

#### 3. 测试配置
```bash
node test-oauth.js
```

#### 4. 启动服务器
```bash
npm start
```

## Google OAuth 详细配置步骤

### 🔑 获取 Google OAuth 凭据

#### 1. 访问 Google Cloud Console
- 打开: https://console.cloud.google.com/
- 登录您的Google账号

#### 2. 创建项目
1. 点击顶部的项目选择器
2. 点击"新建项目"
3. 项目名称：`AI小子`
4. 点击"创建"

#### 3. 启用 API
1. 左侧菜单 → "API和服务" → "库"
2. 搜索"Google+ API"
3. 点击"启用"

#### 4. 配置 OAuth 同意屏幕
1. 左侧菜单 → "API和服务" → "OAuth同意屏幕"
2. 选择"外部"
3. 填写必需信息：
   - 应用名称：`AI小子`
   - 用户支持电子邮件：您的邮箱
   - 开发者联系信息：您的邮箱
4. 点击"保存并继续"

#### 5. 添加作用域
1. 点击"添加或移除作用域"
2. 勾选：
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. 点击"更新" → "保存并继续"

#### 6. 创建凭据
1. 左侧菜单 → "API和服务" → "凭据"
2. 点击"+ 创建凭据" → "OAuth 客户端ID"
3. 应用类型：选择"Web应用"
4. 名称：`AI小子Web客户端`
5. 已获授权的重定向URI：
   ```
   http://localhost:3002/api/auth/google/callback
   ```
6. 点击"创建"

#### 7. 保存凭据
创建成功后，您会得到：
- **客户端ID**：形如 `123456789-abcdefg.apps.googleusercontent.com`
- **客户端密钥**：形如 `GOCSPX-AbCdEfGhIjKlMnOp`

将这两个值填入 `.env` 文件中。

## 🧪 测试和验证

### 运行测试脚本
```bash
node test-oauth.js
```

测试脚本会检查：
- ✅ 环境变量配置
- ✅ 依赖包安装
- ✅ 服务器启动能力
- ✅ Google OAuth配置格式

### 测试登录功能
1. 启动服务器：`npm start`
2. 打开浏览器：http://localhost:3002/login.html
3. 点击"使用 Google 登录"按钮
4. 完成Google授权流程

## 🔧 常见问题排除

### 问题1：`redirect_uri_mismatch`
**原因**：重定向URI不匹配

**解决**：
1. 检查Google Cloud Console中的重定向URI
2. 确保完全匹配：`http://localhost:3002/api/auth/google/callback`
3. 注意协议（http）和端口（3002）

### 问题2：QQ邮箱授权码获取
1. 登录QQ邮箱
2. 设置 → 账户
3. 开启"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 获取授权码（不是QQ密码）

### 问题3：服务器启动失败
**可能原因**：
- 端口被占用
- 环境变量未正确配置

**解决**：
```bash
# 检查端口占用
netstat -tlnp | grep 3002

# 修改端口
echo "PORT=3003" >> .env

# 重新测试
node test-oauth.js
```

### 问题4：Google登录显示"应用未验证"
**解决**：
1. 开发阶段：点击"高级" → "转到AI小子（不安全）"
2. 生产环境：提交Google应用审核

## 📁 文件结构说明

```
bot-v2/
├── .env                      # 环境变量配置（你需要创建）
├── setup-oauth.sh           # 自动配置脚本
├── test-oauth.js            # 配置测试脚本
├── GOOGLE_OAUTH_SETUP.md    # 详细配置指南
├── QUICK_START.md           # 本文件
└── ...其他项目文件
```

## 🎯 配置检查清单

在启动服务器前，确保以下项目已完成：

- [ ] 创建了 `.env` 文件
- [ ] 配置了邮箱信息（SMTP_USER, SMTP_PASS）
- [ ] 设置了JWT密钥（JWT_SECRET, SESSION_SECRET）
- [ ] 获取了Google OAuth凭据（可选）
- [ ] 运行了 `node test-oauth.js` 测试
- [ ] 所有测试通过

## 💡 进阶配置

### 生产环境配置
```bash
# 生产环境.env示例
PORT=80
JWT_SECRET=超级复杂的密钥字符串
SESSION_SECRET=另一个超级复杂的密钥
SMTP_HOST=smtp.yourdomain.com
GOOGLE_CLIENT_ID=生产环境的客户端ID
# ... 其他配置
```

### 多环境管理
```bash
# 开发环境
cp .env .env.development

# 生产环境
cp .env .env.production

# 使用特定环境
NODE_ENV=production npm start
```

完成配置后，您的AI小子就可以使用Google登录功能了！🎉 