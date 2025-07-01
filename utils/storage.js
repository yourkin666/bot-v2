const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Storage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.usersDir = path.join(this.dataDir, 'users');
    this.chatsFile = path.join(this.dataDir, 'chats.json'); // 保留原文件用于迁移
    this.init();
  }

  // 初始化存储
  async init() {
    try {
      await fs.ensureDir(this.dataDir);
      await fs.ensureDir(this.usersDir);
      
      // 如果聊天文件不存在，创建一个空的
      if (!await fs.pathExists(this.chatsFile)) {
        await fs.writeJson(this.chatsFile, {});
      }
      
      // 检查是否需要迁移数据
      await this.checkAndMigrateData();
    } catch (error) {
      console.error('存储初始化失败:', error);
    }
  }

  // 检查并迁移现有数据
  async checkAndMigrateData() {
    try {
      const oldChatsFile = this.chatsFile;
      if (await fs.pathExists(oldChatsFile)) {
        const oldChats = await fs.readJson(oldChatsFile);
        
        // 如果有数据且还没有迁移过
        if (Object.keys(oldChats).length > 0) {
          const defaultUserEmail = 'legacy@default.com';
          const defaultUserChatsFile = this.getUserChatsFile(defaultUserEmail);
          
          // 如果默认用户的聊天文件不存在，说明还没有迁移
          if (!await fs.pathExists(defaultUserChatsFile)) {
            console.log('🔄 检测到旧的聊天数据，正在迁移到用户隔离存储...');
            
            // 确保用户目录存在
            await fs.ensureDir(path.dirname(defaultUserChatsFile));
            
            // 将旧数据迁移到默认用户
            await fs.writeJson(defaultUserChatsFile, oldChats, { spaces: 2 });
            
            // 备份原文件
            const backupFile = path.join(this.dataDir, 'chats_backup.json');
            await fs.copy(oldChatsFile, backupFile);
            
            // 清空原文件（但不删除，保持兼容性）
            await fs.writeJson(oldChatsFile, {});
            
            console.log('✅ 数据迁移完成！原数据已备份到 chats_backup.json');
            console.log(`📧 旧数据已分配给默认用户: ${defaultUserEmail}`);
          }
        }
      }
    } catch (error) {
      console.error('数据迁移失败:', error);
    }
  }

  // 获取用户聊天文件路径
  getUserChatsFile(userEmail) {
    if (!userEmail) {
      throw new Error('用户邮箱不能为空');
    }
    
    // 将邮箱转换为安全的文件名
    const safeEmail = userEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '_');
    const emailHash = require('crypto').createHash('md5').update(safeEmail).digest('hex');
    
    return path.join(this.usersDir, `${safeEmail}_${emailHash}`, 'chats.json');
  }

  // 获取指定用户的所有聊天
  async getAllChats(userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const userChatsFile = this.getUserChatsFile(userEmail);
      
      // 确保用户目录和文件存在
      await fs.ensureDir(path.dirname(userChatsFile));
      if (!await fs.pathExists(userChatsFile)) {
        await fs.writeJson(userChatsFile, {});
      }
      
      const chats = await fs.readJson(userChatsFile);
      return chats;
    } catch (error) {
      console.error('读取用户聊天数据失败:', error);
      return {};
    }
  }

  // 获取特定聊天
  async getChat(chatId, userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      return chats[chatId] || null;
    } catch (error) {
      console.error('获取聊天失败:', error);
      return null;
    }
  }

  // 创建新聊天
  async createChat(title = '新对话', userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chatId = uuidv4();
      const newChat = {
        id: chatId,
        title: title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userEmail: userEmail // 记录归属用户
      };

      const chats = await this.getAllChats(userEmail);
      chats[chatId] = newChat;
      
      const userChatsFile = this.getUserChatsFile(userEmail);
      await fs.writeJson(userChatsFile, chats, { spaces: 2 });
      
      console.log(`📝 用户 ${userEmail} 创建新聊天: ${chatId}`);
      return newChat;
    } catch (error) {
      console.error('创建聊天失败:', error);
      return null;
    }
  }

  // 添加消息到聊天
  async addMessage(chatId, message, userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      
      if (!chats[chatId]) {
        // 如果聊天不存在，先创建
        await this.createChat('新对话...', userEmail);
        const newChats = await this.getAllChats(userEmail);
        const newChatIds = Object.keys(newChats);
        chatId = newChatIds[newChatIds.length - 1];
      }

      const messageWithId = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...message
      };

      chats[chatId].messages.push(messageWithId);
      chats[chatId].updatedAt = new Date().toISOString();
      
      // 暂时设置简单标题，后续会由AI生成更好的标题
      if (message.role === 'user' && chats[chatId].messages.length === 1) {
        chats[chatId].title = '新对话...';
      }

      const userChatsFile = this.getUserChatsFile(userEmail);
      await fs.writeJson(userChatsFile, chats, { spaces: 2 });
      return messageWithId;
    } catch (error) {
      console.error('添加消息失败:', error);
      return null;
    }
  }

  // 更新聊天标题
  async updateChatTitle(chatId, title, userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      
      if (!chats[chatId]) {
        throw new Error('聊天不存在');
      }

      chats[chatId].title = title;
      chats[chatId].updatedAt = new Date().toISOString();

      const userChatsFile = this.getUserChatsFile(userEmail);
      await fs.writeJson(userChatsFile, chats, { spaces: 2 });
      console.log(`📝 用户 ${userEmail} 更新聊天标题: ${chatId} -> ${title}`);
      
      return true;
    } catch (error) {
      console.error('更新聊天标题失败:', error);
      throw error;
    }
  }

  // 获取聊天历史（按时间分组）
  async getChatHistory(userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      const chatArray = Object.values(chats).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      // 按时间分组
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const groups = {
        '当天': [],
        '七天以内': [],
        '一个月以内': [],
        '更早': {}
      };

      chatArray.forEach(chat => {
        const updatedAt = new Date(chat.updatedAt);
        
        if (updatedAt >= todayStart) {
          groups['当天'].push(chat);
        } else if (updatedAt > sevenDaysAgo) {
          groups['七天以内'].push(chat);
        } else if (updatedAt > oneMonthAgo) {
          groups['一个月以内'].push(chat);
        } else {
          const monthKey = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}`;
          if (!groups['更早'][monthKey]) {
            groups['更早'][monthKey] = [];
          }
          groups['更早'][monthKey].push(chat);
        }
      });

      return groups;
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      return { '当天': [], '七天以内': [], '一个月以内': [], '更早': {} };
    }
  }

  // 删除聊天
  async deleteChat(chatId, userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      
      if (!chats[chatId]) {
        throw new Error('聊天不存在');
      }

      // 删除指定的聊天
      delete chats[chatId];

      const userChatsFile = this.getUserChatsFile(userEmail);
      await fs.writeJson(userChatsFile, chats, { spaces: 2 });
      console.log(`🗑️ 用户 ${userEmail} 删除聊天: ${chatId}`);
      return true;
    } catch (error) {
      console.error('删除聊天失败:', error);
      throw error;
    }
  }

  // 批量删除聊天
  async deleteMultipleChats(chatIds, userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      let deletedCount = 0;

      chatIds.forEach(chatId => {
        if (chats[chatId]) {
          delete chats[chatId];
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        const userChatsFile = this.getUserChatsFile(userEmail);
        await fs.writeJson(userChatsFile, chats, { spaces: 2 });
        console.log(`🗑️ 用户 ${userEmail} 批量删除 ${deletedCount} 个聊天`);
      }

      return { deletedCount, skippedCount: chatIds.length - deletedCount };
    } catch (error) {
      console.error('批量删除聊天失败:', error);
      throw error;
    }
  }

  // 获取用户聊天统计信息
  async getUserChatStats(userEmail) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      const chatArray = Object.values(chats);
      
      const totalChats = chatArray.length;
      const totalMessages = chatArray.reduce((sum, chat) => sum + chat.messages.length, 0);
      const userMessages = chatArray.reduce((sum, chat) => 
        sum + chat.messages.filter(msg => msg.role === 'user').length, 0);
      const aiMessages = chatArray.reduce((sum, chat) => 
        sum + chat.messages.filter(msg => msg.role === 'assistant').length, 0);
      
      return {
        totalChats,
        totalMessages,
        userMessages,
        aiMessages,
        oldestChat: chatArray.length > 0 ? 
          chatArray.reduce((oldest, chat) => 
            new Date(chat.createdAt) < new Date(oldest.createdAt) ? chat : oldest).createdAt : null,
        newestChat: chatArray.length > 0 ? 
          chatArray.reduce((newest, chat) => 
            new Date(chat.updatedAt) > new Date(newest.updatedAt) ? chat : newest).updatedAt : null
      };
    } catch (error) {
      console.error('获取用户聊天统计失败:', error);
      return {
        totalChats: 0,
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        oldestChat: null,
        newestChat: null
      };
    }
  }

  // 搜索用户的聊天记录
  async searchUserChats(userEmail, query, limit = 10) {
    try {
      if (!userEmail) {
        throw new Error('用户邮箱不能为空');
      }
      
      const chats = await this.getAllChats(userEmail);
      const results = [];
      
      for (const chat of Object.values(chats)) {
        // 搜索标题
        if (chat.title.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: 'title',
            chatId: chat.id,
            chatTitle: chat.title,
            match: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
          });
        }
        
        // 搜索消息内容
        for (const message of chat.messages) {
          if (message.content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              type: 'message',
              chatId: chat.id,
              chatTitle: chat.title,
              messageId: message.id,
              match: message.content,
              role: message.role,
              timestamp: message.timestamp
            });
          }
        }
      }
      
      // 按时间排序并限制结果数量
      return results
        .sort((a, b) => new Date(b.timestamp || b.updatedAt) - new Date(a.timestamp || a.updatedAt))
        .slice(0, limit);
    } catch (error) {
      console.error('搜索用户聊天失败:', error);
      return [];
    }
  }
}

module.exports = new Storage(); 