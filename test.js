// 简单的API测试文件
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/chat';

async function testAPI() {
  console.log('🧪 开始测试 AI 小子 API...\n');

  try {
    // 1. 测试发送消息
    console.log('📤 测试发送消息...');
    const sendResponse = await axios.post(`${BASE_URL}/send`, {
      message: '你好，AI小子！',
      useThinking: true
    });

    if (sendResponse.data.success) {
      console.log('✅ 发送消息成功');
      console.log('💬 AI回复:', sendResponse.data.data.aiReply.content);
      
      if (sendResponse.data.data.aiReply.thinking) {
        console.log('🧠 思考过程:', sendResponse.data.data.aiReply.thinking.content);
      }
      
      const chatId = sendResponse.data.data.chatId;
      console.log('📝 聊天ID:', chatId);

      // 2. 测试获取聊天历史
      console.log('\n📚 测试获取聊天历史...');
      const historyResponse = await axios.get(`${BASE_URL}/history`);
      
      if (historyResponse.data.success) {
        console.log('✅ 获取历史成功');
        console.log('📊 历史数据:', JSON.stringify(historyResponse.data.data, null, 2));
      }

      // 3. 测试获取特定聊天
      console.log('\n🔍 测试获取特定聊天...');
      const chatResponse = await axios.get(`${BASE_URL}/${chatId}`);
      
      if (chatResponse.data.success) {
        console.log('✅ 获取聊天成功');
        console.log('💬 聊天内容:', chatResponse.data.data.title);
        console.log('📝 消息数量:', chatResponse.data.data.messages.length);
      }

      // 4. 测试创建新聊天
      console.log('\n➕ 测试创建新聊天...');
      const newChatResponse = await axios.post(`${BASE_URL}/new`, {
        title: '测试新聊天'
      });
      
      if (newChatResponse.data.success) {
        console.log('✅ 创建新聊天成功');
        console.log('🆔 新聊天ID:', newChatResponse.data.data.id);
      }

    } else {
      console.log('❌ 发送消息失败:', sendResponse.data.error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
    
    console.log('\n💡 请确保：');
    console.log('1. 服务器已启动 (npm start)');
    console.log('2. OpenAI API 密钥已正确配置');
    console.log('3. 网络连接正常');
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI }; 