// test/test-bot.js - Bot Testing and Validation
import { config } from 'dotenv';
import CrestaAI from '../api/services/crestal.js';
import TwitterService from '../api/services/twitter.js';
import { validateEnvironment, getSystemHealth } from '../lib/helpers.js';
import { getCacheStats } from '../api/utils/cache.js';

// Load environment variables
config();

class BotTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFunction) {
    console.log(`🧪 Testing: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name,
        status: 'PASS',
        duration: `${duration}ms`,
        result
      });
      
      this.results.passed++;
      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      
    } catch (error) {
      this.results.tests.push({
        name,
        status: 'FAIL',
        error: error.message,
        stack: error.stack
      });
      
      this.results.failed++;
      console.log(`❌ ${name} - FAILED: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Bot Test Suite\n');
    
    // Environment Tests
    await this.runTest('Environment Validation', this.testEnvironment);
    
    // Service Tests
    await this.runTest('Crestal AI Connection', this.testCrestaConnection);
    await this.runTest('Twitter API Connection', this.testTwitterConnection);
    
    // Functionality Tests
    await this.runTest('Market Analysis Generation', this.testMarketAnalysis);
    await this.runTest('Degen Alert Generation', this.testDegenAlert);
    await this.runTest('User Query Processing', this.testUserQuery);
    
    // Cache Tests
    await this.runTest('Cache System', this.testCacheSystem);
    
    // Integration Tests
    await this.runTest('Tweet Formatting', this.testTweetFormatting);
    await this.runTest('Rate Limiting', this.testRateLimiting);
    
    // Health Tests
    await this.runTest('System Health Check', this.testSystemHealth);
    
    this.printResults();
  }

  async testEnvironment() {
    return validateEnvironment();
  }

  async testCrestaConnection() {
    const cresta = new CrestaAI();
    const usage = cresta.getUsageStats();
    
    if (typeof usage.daily !== 'number') {
      throw new Error('Invalid usage stats structure');
    }
    
    return { 
      dailyUsage: usage.daily,
      emergencyMode: usage.emergencyMode 
    };
  }

  async testTwitterConnection() {
    const twitter = new TwitterService();
    const isValid = await twitter.validateConnection();
    
    if (!isValid) {
      throw new Error('Twitter connection validation failed');
    }
    
    const stats = twitter.getStats();
    return stats;
  }

  async testMarketAnalysis() {
    const cresta = new CrestaAI();
    const analysis = await cresta.generateMarketAnalysis();
    
    if (!analysis || analysis.length < 10) {
      throw new Error('Market analysis too short or empty');
    }
    
    if (analysis.length > 300) {
      throw new Error('Market analysis too long');
    }
    
    return { 
      length: analysis.length,
      preview: analysis.substring(0, 50) + '...',
      containsDYOR: analysis.toLowerCase().includes('dyor')
    };
  }

  async testDegenAlert() {
    const cresta = new CrestaAI();
    const alert = await cresta.generateDegenAlert();
    
    if (!alert || alert.length < 10) {
      throw new Error('Degen alert too short or empty');
    }
    
    return { 
      length: alert.length,
      preview: alert.substring(0, 50) + '...'
    };
  }

  async testUserQuery() {
    const cresta = new CrestaAI();
    const testQuery = "What is the current price of Bitcoin?";
    const response = await cresta.analyzeUserQuery(testQuery, 'test_user');
    
    if (!response || response.length < 5) {
      throw new Error('User query response too short');
    }
    
    return { 
      query: testQuery,
      responseLength: response.length,
      preview: response.substring(0, 50) + '...'
    };
  }

  async testCacheSystem() {
    const { getCachedData, setCachedData, clearCache } = await import('../api/utils/cache.js');
    
    // Test basic cache operations
    const testKey = 'test_cache_key';
    const testData = { message: 'test data', timestamp: Date.now() };
    
    // Set cache
    setCachedData(testKey, testData, 1); // 1 minute
    
    // Get cache
    const retrieved = getCachedData(testKey);
    if (!retrieved || retrieved.message !== testData.message) {
      throw new Error('Cache set/get failed');
    }
    
    // Clean up
    clearCache(testKey);
    
    const stats = getCacheStats();
    return { 
      operationsSuccessful: true,
      cacheStats: stats
    };
  }

  async testTweetFormatting() {
    const { formatTweet } = await import('../api/utils/formatter.js');
    
    const testData = {
      analysis: 'BTC looking strong at $43,000. Breaking key resistance levels.',
      hashtags: '#crypto #Bitcoin #trading'
    };
    
    const formatted = formatTweet('MARKET_UPDATE', testData);
    
    if (!formatted || formatted.length > 280) {
      throw new Error('Tweet formatting failed or too long');
    }
    
    if (!formatted.includes(testData.analysis)) {
      throw new Error('Tweet missing expected content');
    }
    
    return { 
      length: formatted.length,
      content: formatted
    };
  }

  async testRateLimiting() {
    const { rateLimitCheck } = await import('../lib/helpers.js');
    
    // Test rate limiting
    const testKey = 'test_rate_limit';
    
    // Should allow first request
    const first = rateLimitCheck(testKey, 2, 1); // 2 requests per minute
    if (!first) {
      throw new Error('First request should be allowed');
    }
    
    // Should allow second request
    const second = rateLimitCheck(testKey, 2, 1);
    if (!second) {
      throw new Error('Second request should be allowed');
    }
    
    // Should block third request
    const third = rateLimitCheck(testKey, 2, 1);
    if (third) {
      throw new Error('Third request should be blocked');
    }
    
    return { 
      rateLimitingWorking: true 
    };
  }

  async testSystemHealth() {
    const health = getSystemHealth();
    
    if (!health.status || !health.timestamp) {
      throw new Error('Invalid health check structure');
    }
    
    return health;
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 BOT TEST RESULTS');
    console.log('='.repeat(50));
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.tests.length}`);
    
    const successRate = ((this.results.passed / this.results.tests.length) * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    this.results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      const duration = test.duration ? ` (${test.duration})` : '';
      console.log(`  ${icon} ${test.name}${duration}`);
    });
    
    if (successRate >= 90) {
      console.log('\n🎉 Bot is ready for deployment!');
    } else if (successRate >= 70) {
      console.log('\n⚠️ Bot has some issues but may work with limitations');
    } else {
      console.log('\n🚨 Bot has critical issues and needs fixes before deployment');
    }
    
    console.log('='.repeat(50));
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BotTester();
  tester.runAllTests().catch(console.error);
}

export default BotTester;