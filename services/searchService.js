const axios = require('axios');
const config = require('../config');

class SearchService {
  constructor() {
    this.apiKey = config.search.apiKey;
    this.baseURL = 'https://api.bochaai.com/v1';
    this.enabled = config.search.enabled;
  }

  // 联网搜索
  async webSearch(query, options = {}) {
    if (!this.enabled) {
      console.log('🔍 联网搜索已禁用');
      return null;
    }

    try {
      const {
        count = 5,
        freshness = 'oneWeek',
        summary = true,
        searchType = 'web'
      } = options;

      console.log('🔍 开始联网搜索:', query);
      console.log('🔍 API地址:', `${this.baseURL}/web-search`);
      console.log('🔍 API密钥长度:', this.apiKey?.length);

      const response = await axios.post(`${this.baseURL}/web-search`, {
        query: query,
        count: count,
        freshness: freshness,
        summary: summary,
        searchType: searchType
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const searchResults = response.data;
      console.log('🔍 原始搜索响应:', JSON.stringify(searchResults, null, 2));
      console.log('🔍 搜索完成，找到', (searchResults.data?.webPages?.value && Array.isArray(searchResults.data.webPages.value)) ? searchResults.data.webPages.value.length : 0, '个结果');
      console.log('🔍 开始格式化搜索结果...');

      return this.formatSearchResults(searchResults);

    } catch (error) {
      console.error('🔍 联网搜索失败:', error.response?.data || error.message);
      return null;
    }
  }

  // 格式化搜索结果
  formatSearchResults(data) {
    console.log('🔍 格式化搜索结果 - 原始数据类型:', typeof data);
    console.log('🔍 格式化搜索结果 - data.data存在:', !!data.data);
    
    // 博查API返回的数据结构是 { code: 200, data: { webPages: ... } }
    const actualData = data.data || data;
    console.log('🔍 actualData.webPages存在:', !!actualData.webPages);
    console.log('🔍 actualData.webPages.value存在:', !!actualData.webPages?.value);
    console.log('🔍 actualData.webPages.value长度:', actualData.webPages?.value?.length);
    
    if (!actualData.webPages?.value || actualData.webPages.value.length === 0) {
      console.log('🔍 没有找到搜索结果，返回失败');
      return {
        success: false,
        message: '没有找到相关结果',
        results: []
      };
    }

    const results = actualData.webPages.value.map(item => ({
      title: item.name,
      url: item.url,
      snippet: item.snippet,
      summary: item.summary,
      siteName: item.siteName,
      datePublished: item.datePublished
    }));

    return {
      success: true,
      query: actualData.queryContext?.originalQuery,
      totalResults: actualData.webPages.totalEstimatedMatches,
      results: results.slice(0, 5), // 只取前5个结果
      summary: this.generateSummary(results)
    };
  }

  // 生成结果摘要
  generateSummary(results) {
    if (!results || results.length === 0) {
      return '没有找到相关信息。';
    }

    const summaries = results
      .filter(r => r.summary)
      .slice(0, 3)
      .map(r => r.summary);

    if (summaries.length === 0) {
      return '找到了一些相关结果，但无法生成摘要。';
    }

    return summaries.join('\n\n');
  }

  // 检查是否需要搜索
  shouldSearch(message) {
    const searchTriggers = [
      '搜索', '查找', '最新', '今天', '现在', '最近',
      '什么是', '如何', '怎么', '为什么', '哪里',
      '新闻', '资讯', '信息', '情况', '状况'
    ];

    const timeKeywords = [
      '今天', '昨天', '最近', '现在', '刚刚', '最新',
      '2024', '2025', '今年', '去年', '这个月'
    ];

    const messageText = message.toLowerCase();
    
    return searchTriggers.some(trigger => messageText.includes(trigger)) ||
           timeKeywords.some(keyword => messageText.includes(keyword)) ||
           messageText.includes('?') ||
           messageText.includes('？');
  }

  // 生成搜索关键词
  extractSearchKeywords(message) {
    // 简单的关键词提取
    const stopWords = ['的', '了', '是', '在', '有', '和', '与', '或', '但', '因为', '所以', '这', '那', '什么', '如何', '怎么', '为什么', '哪里'];
    
    const words = message
      .replace(/[，。！？、；：""''()（）]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word));

    return words.slice(0, 5).join(' ');
  }
}

module.exports = new SearchService(); 