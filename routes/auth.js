const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const emailService = require('../services/emailService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// 发送验证码
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '邮箱地址不能为空'
      });
    }

    // 验证邮箱格式
    if (!userService.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    // 生成验证码
    const verificationCode = userService.generateVerificationCode();
    
    // 保存验证码
    const saveResult = await userService.saveVerificationCode(email, verificationCode);
    if (!saveResult) {
      return res.status(500).json({
        success: false,
        error: '验证码保存失败，请重试'
      });
    }

    // 发送验证码邮件
    const emailResult = await emailService.sendVerificationCode(email, verificationCode);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.message
      });
    }

    console.log(`📧 验证码发送成功: ${email}`);
    
    res.json({
      success: true,
      message: '验证码已发送到您的邮箱，请查收',
      data: {
        email: email,
        expiresIn: '10分钟'
      }
    });

  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({
      success: false,
      error: '发送验证码失败，请稍后重试'
    });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, verificationCode } = req.body;

    // 验证必填字段
    if (!email || !password || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: '邮箱、密码和验证码都不能为空'
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少为6位'
      });
    }

    // 调用用户服务进行注册
    const result = await userService.registerUser(email, password, verificationCode);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // 发送欢迎邮件（异步，不阻塞响应）
    emailService.sendWelcomeEmail(email).catch(error => {
      console.error('发送欢迎邮件失败:', error);
    });

    console.log(`✅ 用户注册成功: ${email}`);
    
    res.status(201).json({
      success: true,
      message: '注册成功，欢迎使用AI小子！',
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空'
      });
    }

    // 调用用户服务进行登录
    const result = await userService.loginUser(email, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    console.log(`🔐 用户登录成功: ${email}`);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试'
    });
  }
});

// 验证验证码（独立接口，用于注册前验证）
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: '邮箱和验证码不能为空'
      });
    }

    const result = await userService.verifyCode(email, code);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: '验证码验证成功'
    });

  } catch (error) {
    console.error('验证码验证失败:', error);
    res.status(500).json({
      success: false,
      error: '验证失败，请重试'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

// 用户登出（客户端处理，服务端只需返回成功）
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    console.log(`👋 用户登出: ${req.user.email}`);
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('用户登出失败:', error);
    res.status(500).json({
      success: false,
      error: '登出失败'
    });
  }
});

// 检查邮箱是否已注册
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '邮箱地址不能为空'
      });
    }

    if (!userService.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    const existingUser = await userService.getUserByEmail(email);
    
    res.json({
      success: true,
      data: {
        exists: !!existingUser,
        email: email
      }
    });

  } catch (error) {
    console.error('检查邮箱失败:', error);
    res.status(500).json({
      success: false,
      error: '检查邮箱失败，请重试'
    });
  }
});

// 获取系统统计信息（可选认证）
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    
    res.json({
      success: true,
      data: {
        userStats: stats,
        emailService: emailService.getServiceStatus(),
        currentTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
});

// 清理过期验证码（内部接口）
router.post('/cleanup-codes', async (req, res) => {
  try {
    await userService.cleanupExpiredCodes();
    
    res.json({
      success: true,
      message: '过期验证码清理完成'
    });
  } catch (error) {
    console.error('清理过期验证码失败:', error);
    res.status(500).json({
      success: false,
      error: '清理失败'
    });
  }
});

module.exports = router; 