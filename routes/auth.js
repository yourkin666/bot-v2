const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const userService = require('../services/userService');
const emailService = require('../services/emailService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Passport配置（仅在提供OAuth配置时启用）
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 检查用户是否已存在
      let user = await userService.findUserByEmail(profile.emails[0].value);

      if (user) {
        // 用户已存在，更新Google ID
        user = await userService.updateGoogleId(user.id, profile.id);
      } else {
        // 创建新用户
        user = await userService.createOAuthUser({
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0].value,
          googleId: profile.id,
          provider: 'google'
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 检查用户是否已存在
      let user = await userService.findUserByEmail(profile.emails[0].value);

      if (user) {
        // 用户已存在，更新GitHub ID
        user = await userService.updateGithubId(user.id, profile.id);
      } else {
        // 创建新用户
        user = await userService.createOAuthUser({
          email: profile.emails[0].value,
          name: profile.displayName || profile.username,
          avatar: profile.photos[0].value,
          githubId: profile.id,
          provider: 'github'
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth路由（仅在配置时启用）
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
      try {
        // 生成JWT token
        const token = userService.generateToken(req.user);

        // 重定向到前端，携带token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/login?error=oauth_failed');
      }
    }
  );
} else {
  // 未配置Google OAuth时的替代路由
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth 未配置'
    });
  });
}

// GitHub OAuth路由（仅在配置时启用）
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get('/github', passport.authenticate('github', {
    scope: ['user:email']
  }));

  router.get('/github/callback',
    passport.authenticate('github', { session: false }),
    async (req, res) => {
      try {
        // 生成JWT token
        const token = userService.generateToken(req.user);

        // 重定向到前端，携带token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
      } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.redirect('/login?error=oauth_failed');
      }
    }
  );
} else {
  // 未配置GitHub OAuth时的替代路由
  router.get('/github', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'GitHub OAuth 未配置'
    });
  });
}

// 检查邮箱是否已注册
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '小朋友，记得要填写邮箱地址哦！'
      });
    }

    // 验证邮箱格式
    if (!userService.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: '小朋友，邮箱地址好像写得不太对呢，记得要有@符号哦！'
      });
    }

    // 检查邮箱是否已注册
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
      error: '小朋友，系统现在有点忙呢，等一下再试试好吗？'
    });
  }
});

// 发送验证码
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '小朋友，记得先填写邮箱地址哦！这样我们才能给你发验证码~'
      });
    }

    // 验证邮箱格式
    if (!userService.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: '小朋友，邮箱地址好像写得不太对呢，记得要有@符号哦！'
      });
    }

    // 生成验证码
    const verificationCode = userService.generateVerificationCode();

    // 保存验证码
    const saveResult = await userService.saveVerificationCode(email, verificationCode);
    if (!saveResult) {
      return res.status(500).json({
        success: false,
        error: '哎呀，验证码保存时遇到了小问题，我们再试一次吧！'
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
      message: '太棒了！验证码已经飞到你的邮箱里啦！快去看看吧~',
      data: {
        email: email,
        expiresIn: '10分钟'
      }
    });

  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({
      success: false,
      error: '小朋友，验证码发送时遇到了小问题，等一下再试试好吗？'
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
        error: '小朋友，邮箱、密码和验证码都要填写哦！缺一不可呢~'
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '小朋友，密码要至少6位数哦！这样更安全呢~'
      });
    }

    // 调用用户服务进行注册
    const result = await userService.registerUser(email, password, verificationCode);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    // 发送欢迎邮件（异步，不阻塞响应）
    emailService.sendWelcomeEmail(email).catch(error => {
      console.error('发送欢迎邮件失败:', error);
    });

    console.log(`✅ 用户注册成功: ${email}`);

    res.status(201).json({
      success: true,
      message: '哇！注册成功啦！欢迎小朋友加入AI小子大家庭！',
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      error: '小朋友，注册时遇到了小问题，等一下再试试好吗？'
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
        error: '小朋友，邮箱和密码都要填写哦！'
      });
    }

    // 调用用户服务进行登录
    const result = await userService.loginUser(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.message
      });
    }

    console.log(`🔐 用户登录成功: ${email}`);

    res.json({
      success: true,
      message: '耶！登录成功啦！',
      data: {
        user: result.user,
        token: result.token
      }
    });

  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      error: '小朋友，登录时遇到了小问题，等一下再试试好吗？'
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
        error: '小朋友，记得要填写邮箱和验证码哦！'
      });
    }

    const result = await userService.verifyCode(email, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      message: '太棒了！验证码验证成功啦！'
    });

  } catch (error) {
    console.error('验证码验证失败:', error);
    res.status(500).json({
      success: false,
      error: '小朋友，验证码验证时遇到了小问题，等一下再试试好吗？'
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
      error: '小朋友，获取信息时遇到了小问题，等一下再试试好吗？'
    });
  }
});

// 用户登出（客户端处理，服务端只需返回成功）
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    console.log(`👋 用户登出: ${req.user.email}`);

    res.json({
      success: true,
      message: '再见啦小朋友！期待下次再见哦~'
    });
  } catch (error) {
    console.error('用户登出失败:', error);
    res.status(500).json({
      success: false,
      error: '小朋友，登出时遇到了小问题，但不影响使用哦！'
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
        error: '小朋友，记得要填写邮箱地址哦！'
      });
    }

    if (!userService.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: '小朋友，邮箱地址好像写得不太对呢，记得要有@符号哦！'
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
      error: '小朋友，系统现在有点忙呢，等一下再试试好吗？'
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
      error: '小朋友，系统信息获取时遇到了小问题，等一下再试试好吗？'
    });
  }
});

// 清理过期验证码（内部接口）
router.post('/cleanup-codes', async (req, res) => {
  try {
    await userService.cleanupExpiredCodes();

    res.json({
      success: true,
      message: '系统清理完成啦！环境更干净了呢~'
    });
  } catch (error) {
    console.error('清理过期验证码失败:', error);
    res.status(500).json({
      success: false,
      error: '小朋友，系统清理时遇到了小问题，但不影响使用哦！'
    });
  }
});

module.exports = router; 