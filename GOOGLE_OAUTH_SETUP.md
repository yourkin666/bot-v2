# 🔐 Google OAuth 详细配置指南

## 第一步：创建Google Cloud项目

### 1.1 访问Google Cloud Console
- 打开浏览器，访问：https://console.cloud.google.com/
- 使用您的Google账号登录

### 1.2 创建新项目
1. 点击页面顶部的项目选择器（通常显示"选择项目"）
2. 在弹出窗口中，点击右上角的"新建项目"按钮
3. 填写项目信息：
   - **项目名称**：`AI小子登录` （或您喜欢的名称）
   - **项目ID**：系统自动生成（可以修改）
   - **位置**：保持默认即可
4. 点击"创建"按钮
5. 等待项目创建完成（通常需要几秒钟）

## 第二步：启用必要的API

### 2.1 启用Google+ API
1. 在Google Cloud Console中，确保选择了刚创建的项目
2. 在左侧导航菜单中，点击"API和服务" > "库"
3. 在搜索框中输入"Google+ API"
4. 点击搜索结果中的"Google+ API"
5. 点击"启用"按钮
6. 等待API启用完成

### 2.2 启用Google Identity API（推荐）
1. 同样在API库中搜索"Google Identity"
2. 找到并启用"Google Identity and Access Management (IAM) API"

## 第三步：创建OAuth 2.0凭据

### 3.1 配置OAuth同意屏幕
1. 在左侧导航菜单中，点击"API和服务" > "OAuth同意屏幕"
2. 选择用户类型：
   - **内部**：仅限您组织内的用户（需要Google Workspace账号）
   - **外部**：任何Google账号用户都可以使用（推荐选择这个）
3. 点击"创建"

### 3.2 填写OAuth同意屏幕信息
**必填信息：**
- **应用名称**：`AI小子` （用户看到的应用名称）
- **用户支持电子邮件**：您的邮箱地址
- **开发者联系信息**：您的邮箱地址

**可选信息：**
- **应用徽标**：上传您的应用图标（可选）
- **应用首页链接**：`http://localhost:3002`
- **应用隐私权政策链接**：如果有的话
- **应用服务条款链接**：如果有的话

点击"保存并继续"

### 3.3 配置作用域
1. 在"作用域"页面，点击"添加或移除作用域"
2. 找到并勾选以下作用域：
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. 点击"更新"
4. 点击"保存并继续"

### 3.4 添加测试用户（如果选择了外部用户类型）
1. 在"测试用户"页面，点击"添加用户"
2. 输入要测试的Google账号邮箱地址
3. 点击"保存并继续"

### 3.5 创建OAuth客户端ID
1. 在左侧导航菜单中，点击"API和服务" > "凭据"
2. 点击页面顶部的"+ 创建凭据"
3. 选择"OAuth 客户端ID"
4. 选择应用类型：**Web应用**
5. 填写详细信息：
   - **名称**：`AI小子Web客户端`
   - **已获授权的重定向URI**：
     - 开发环境：`http://localhost:3002/api/auth/google/callback`
     - 生产环境：`https://47.84.70.153:80/api/auth/google/callback`
6. 点击"创建"

### 3.6 获取凭据
创建成功后，会弹出包含以下信息的对话框：
- **客户端ID**：类似 `123456789-abcdefg.apps.googleusercontent.com`
- **客户端密钥**：类似 `GOCSPX-abcdefghijklmnop`

**重要**：请妥善保存这两个值，稍后配置时需要用到！

## 第四步：配置项目环境变量

### 4.1 创建环境变量文件
在项目根目录创建 `.env` 文件：

```bash
cd /root/bot-v2
touch .env
```

### 4.2 编辑环境变量文件
将以下内容添加到 `.env` 文件中，替换为您的实际值：

```bash
# 服务器配置
PORT=3002

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
SESSION_SECRET=your-super-secret-session-key-change-in-production-67890

# 邮件服务配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-qq-email-auth-code
EMAIL_FROM=your-email@qq.com

# Google OAuth 配置
GOOGLE_CLIENT_ID=您在第3.6步获得的客户端ID
GOOGLE_CLIENT_SECRET=您在第3.6步获得的客户端密钥

# GitHub OAuth 配置（可选）
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret

# 前端URL配置（可选）
# FRONTEND_URL=http://localhost:3002
```

### 4.3 配置示例
以下是一个完整的配置示例：

```bash
# 服务器配置
PORT=3002

# JWT 配置  
JWT_SECRET=ai-xiao-zi-super-secret-key-2024-production-ready
SESSION_SECRET=ai-xiao-zi-session-secret-key-2024-secure

# 邮件服务配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=2518016656@qq.com
SMTP_PASS=zybjsohgnvardjbh
EMAIL_FROM=2518016656@qq.com

# Google OAuth 配置
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz12

# GitHub OAuth 配置（可选）
# GITHUB_CLIENT_ID=your-github-client-id  
# GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 第五步：重启服务器并测试

### 5.1 重启服务器
```bash
cd /root/bot-v2
npm start
```

### 5.2 测试Google登录
1. 打开浏览器，访问：`http://localhost:3002/login.html`
2. 点击"使用 Google 登录"按钮
3. 应该会跳转到Google登录页面
4. 使用您的Google账号登录
5. 授权后应该会自动跳转回应用并完成登录

## 常见问题解决

### 问题1：重定向URI不匹配
**错误信息**：`redirect_uri_mismatch`

**解决方案**：
1. 检查Google Cloud Console中配置的重定向URI是否完全匹配
2. 确保URI包含协议（http://或https://）
3. 确保端口号正确（如：3002）
4. 本地开发使用：`http://localhost:3002/api/auth/google/callback`

### 问题2：OAuth应用未验证
**错误信息**：显示"此应用未经验证"的警告

**解决方案**：
1. 在开发阶段，点击"高级" > "转到AI小子（不安全）"
2. 生产环境需要提交应用审核或使用内部用户类型

### 问题3：作用域权限不足
**错误信息**：`insufficient_scope`

**解决方案**：
1. 确保在OAuth同意屏幕中添加了必要的作用域
2. 重新生成OAuth客户端ID
3. 清除浏览器缓存后重试

### 问题4：API未启用
**错误信息**：`Google+ API has not been used`

**解决方案**：
1. 在Google Cloud Console中启用Google+ API
2. 等待几分钟让API生效
3. 重启应用服务器

## 安全注意事项

### 保护敏感信息
1. **永远不要**将 `.env` 文件提交到Git仓库
2. 在生产环境中使用强密码作为JWT_SECRET
3. 定期轮换OAuth客户端密钥
4. 限制OAuth重定向URI只包含可信域名

### 生产环境配置
1. 使用HTTPS协议
2. 配置正确的生产域名
3. 启用CORS安全策略
4. 设置适当的会话超时时间

## 调试技巧

### 启用详细日志
在 `routes/auth.js` 中添加调试日志：

```javascript
console.log('Google OAuth callback received:', {
  user: req.user,
  sessionID: req.sessionID
});
```

### 检查环境变量加载
在 `server.js` 中添加：

```javascript
console.log('Environment check:', {
  googleClientId: process.env.GOOGLE_CLIENT_ID ? '已配置' : '未配置',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? '已配置' : '未配置'
});
```

配置完成后，您的AI小子应用就支持Google登录功能了！🎉 