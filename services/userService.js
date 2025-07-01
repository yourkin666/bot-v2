const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class UserService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.verificationCodesFile = path.join(this.dataDir, 'verification_codes.json');
    this.init();
  }

  async init() {
    try {
      await fs.ensureDir(this.dataDir);
      
      // 初始化用户文件
      if (!await fs.pathExists(this.usersFile)) {
        await fs.writeJson(this.usersFile, {});
      }
      
      // 初始化验证码文件
      if (!await fs.pathExists(this.verificationCodesFile)) {
        await fs.writeJson(this.verificationCodesFile, {});
      }
    } catch (error) {
      console.error('用户服务初始化失败:', error);
    }
  }

  // 获取所有用户
  async getAllUsers() {
    try {
      return await fs.readJson(this.usersFile);
    } catch (error) {
      console.error('读取用户数据失败:', error);
      return {};
    }
  }

  // 根据邮箱获取用户
  async getUserByEmail(email) {
    try {
      const users = await this.getAllUsers();
      return users[email] || null;
    } catch (error) {
      console.error('获取用户失败:', error);
      return null;
    }
  }

  // 根据用户ID获取用户
  async getUserById(userId) {
    try {
      const users = await this.getAllUsers();
      return Object.values(users).find(user => user.id === userId) || null;
    } catch (error) {
      console.error('获取用户失败:', error);
      return null;
    }
  }

  // 验证邮箱格式
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 生成验证码
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 保存验证码
  async saveVerificationCode(email, code) {
    try {
      const codes = await this.getVerificationCodes();
      codes[email] = {
        code: code,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + config.auth.verificationCodeExpiry).toISOString(),
        used: false
      };
      
      await fs.writeJson(this.verificationCodesFile, codes, { spaces: 2 });
      console.log(`📧 验证码已保存: ${email} -> ${code}`);
      return true;
    } catch (error) {
      console.error('保存验证码失败:', error);
      return false;
    }
  }

  // 获取验证码数据
  async getVerificationCodes() {
    try {
      return await fs.readJson(this.verificationCodesFile);
    } catch (error) {
      console.error('读取验证码数据失败:', error);
      return {};
    }
  }

  // 验证验证码
  async verifyCode(email, inputCode) {
    try {
      const codes = await this.getVerificationCodes();
      const codeData = codes[email];
      
      if (!codeData) {
        return { success: false, message: '验证码不存在或已过期' };
      }
      
      if (codeData.used) {
        return { success: false, message: '验证码已使用' };
      }
      
      if (new Date() > new Date(codeData.expiresAt)) {
        return { success: false, message: '验证码已过期' };
      }
      
      if (codeData.code !== inputCode) {
        return { success: false, message: '验证码错误' };
      }
      
      // 标记验证码为已使用
      codeData.used = true;
      await fs.writeJson(this.verificationCodesFile, codes, { spaces: 2 });
      
      return { success: true, message: '验证码验证成功' };
    } catch (error) {
      console.error('验证码验证失败:', error);
      return { success: false, message: '验证失败，请重试' };
    }
  }

  // 清理过期验证码
  async cleanupExpiredCodes() {
    try {
      const codes = await this.getVerificationCodes();
      const now = new Date();
      let cleaned = 0;
      
      for (const email in codes) {
        if (new Date(codes[email].expiresAt) < now) {
          delete codes[email];
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        await fs.writeJson(this.verificationCodesFile, codes, { spaces: 2 });
        console.log(`🧹 清理了 ${cleaned} 个过期验证码`);
      }
    } catch (error) {
      console.error('清理过期验证码失败:', error);
    }
  }

  // 注册用户
  async registerUser(email, password, verificationCode) {
    try {
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        return { success: false, message: '邮箱格式不正确' };
      }

      // 验证验证码
      const codeVerification = await this.verifyCode(email, verificationCode);
      if (!codeVerification.success) {
        return codeVerification;
      }

      // 检查用户是否已存在
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: '该邮箱已注册' };
      }

      // 密码加密
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 创建新用户
      const newUser = {
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        isVerified: true, // 因为验证码已验证
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null
      };

      // 保存用户
      const users = await this.getAllUsers();
      users[email.toLowerCase()] = newUser;
      await fs.writeJson(this.usersFile, users, { spaces: 2 });

      console.log(`✅ 新用户注册成功: ${email}`);
      
      // 生成JWT token
      const token = this.generateJWTToken(newUser);
      
      return { 
        success: true, 
        message: '注册成功',
        user: {
          id: newUser.id,
          email: newUser.email,
          isVerified: newUser.isVerified,
          createdAt: newUser.createdAt
        },
        token
      };
    } catch (error) {
      console.error('用户注册失败:', error);
      return { success: false, message: '注册失败，请重试' };
    }
  }

  // 用户登录
  async loginUser(email, password) {
    try {
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        return { success: false, message: '邮箱格式不正确' };
      }

      // 获取用户
      const user = await this.getUserByEmail(email.toLowerCase());
      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: '密码错误' };
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
      const users = await this.getAllUsers();
      users[email.toLowerCase()] = user;
      await fs.writeJson(this.usersFile, users, { spaces: 2 });

      console.log(`🔐 用户登录成功: ${email}`);
      
      // 生成JWT token
      const token = this.generateJWTToken(user);
      
      return { 
        success: true, 
        message: '登录成功',
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        token
      };
    } catch (error) {
      console.error('用户登录失败:', error);
      return { success: false, message: '登录失败，请重试' };
    }
  }

  // 生成JWT Token
  generateJWTToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      isVerified: user.isVerified
    };
    
    return jwt.sign(payload, config.auth.jwtSecret, { 
      expiresIn: config.auth.jwtExpiresIn 
    });
  }

  // 验证JWT Token
  verifyJWTToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      console.error('JWT验证失败:', error);
      return null;
    }
  }

  // 获取用户统计信息
  async getUserStats() {
    try {
      const users = await this.getAllUsers();
      const userCount = Object.keys(users).length;
      const verifiedCount = Object.values(users).filter(user => user.isVerified).length;
      
      return {
        totalUsers: userCount,
        verifiedUsers: verifiedCount,
        unverifiedUsers: userCount - verifiedCount
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return {
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0
      };
    }
  }
}

module.exports = new UserService(); 