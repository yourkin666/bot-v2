const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Storage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.chatsFile = path.join(this.dataDir, 'chats.json');
    this.init();
  }

  // 初始化存储
  async init() {
    try {
      await fs.ensureDir(this.dataDir);
      
      // 如果聊天文件不存在，创建一个空的
      if (!await fs.pathExists(this.chatsFile)) {
        await fs.writeJson(this.chatsFile, {});
      }
    } catch (error) {
      console.error('存储初始化失败:', error);
    }
  }

  // 获取所有聊天
  async getAllChats() {
    try {
      const chats = await fs.readJson(this.chatsFile);
      return chats;
    } catch (error) {
      console.error('读取聊天数据失败:', error);
      return {};
    }
  }

  // 获取特定聊天
  async getChat(chatId) {
    try {
      const chats = await this.getAllChats();
      return chats[chatId] || null;
    } catch (error) {
      console.error('获取聊天失败:', error);
      return null;
    }
  }

  // 创建新聊天
  async createChat(title = '新对话') {
    try {
      const chatId = uuidv4();
      const newChat = {
        id: chatId,
        title: title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const chats = await this.getAllChats();
      chats[chatId] = newChat;
      
      await fs.writeJson(this.chatsFile, chats, { spaces: 2 });
      return newChat;
    } catch (error) {
      console.error('创建聊天失败:', error);
      return null;
    }
  }

  // 添加消息到聊天
  async addMessage(chatId, message) {
    try {
      const chats = await this.getAllChats();
      
      if (!chats[chatId]) {
        // 如果聊天不存在，先创建
        await this.createChat();
        const newChats = await this.getAllChats();
        chatId = Object.keys(newChats)[Object.keys(newChats).length - 1];
      }

      const messageWithId = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...message
      };

      chats[chatId].messages.push(messageWithId);
      chats[chatId].updatedAt = new Date().toISOString();
      
      // 更新聊天标题（使用第一条用户消息）
      if (message.role === 'user' && chats[chatId].messages.length === 1) {
        chats[chatId].title = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '');
      }

      await fs.writeJson(this.chatsFile, chats, { spaces: 2 });
      return messageWithId;
    } catch (error) {
      console.error('添加消息失败:', error);
      return null;
    }
  }

  // 获取聊天历史（按时间分组）
  async getChatHistory() {
    try {
      const chats = await this.getAllChats();
      const chatArray = Object.values(chats).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      // 按时间分组
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const groups = {
        '7天内': [],
        '30天内': [],
        '更早': {}
      };

      chatArray.forEach(chat => {
        const updatedAt = new Date(chat.updatedAt);
        
        if (updatedAt > sevenDaysAgo) {
          groups['7天内'].push(chat);
        } else if (updatedAt > thirtyDaysAgo) {
          groups['30天内'].push(chat);
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
      return { '7天内': [], '30天内': [], '更早': {} };
    }
  }
}

module.exports = new Storage(); 