const userService = require('../services/userService');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '访问令牌缺失',
        code: 'TOKEN_MISSING'
      });
    }

    // 验证token
    const decoded = userService.verifyJWTToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: '访问令牌无效或已过期',
        code: 'TOKEN_INVALID'
      });
    }

    // 获取用户信息
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      error: '认证失败',
      code: 'AUTH_ERROR'
    });
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = userService.verifyJWTToken(token);
      if (decoded) {
        const user = await userService.getUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            isVerified: user.isVerified,
            createdAt: user.createdAt
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next(); // 可选认证失败时继续处理请求
  }
};

// 验证用户是否已验证邮箱
const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: '需要验证邮箱后才能使用此功能',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// 从请求中获取用户邮箱（用于兼容现有代码）
const getUserEmail = (req) => {
  return req.user ? req.user.email : null;
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVerified,
  getUserEmail
}; 