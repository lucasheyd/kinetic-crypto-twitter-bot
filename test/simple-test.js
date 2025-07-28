// test/simple-test.js - Simple Bot Test
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Simple Bot Test Started\n');

// Test 1: Environment Variables
console.log('📋 Testing Environment Variables...');
const requiredEnvs = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET', 
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
  'TWITTER_BEARER_TOKEN',
  'CRESTAL_API_KEY'
];

let envPassed = 0;
requiredEnvs.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key}: Configured`);
    envPassed++;
  } else {
    console.log(`❌ ${key}: Missing`);
  }
});

console.log(`\n📊 Environment: ${envPassed}/${requiredEnvs.length} configured\n`);

// Test 2: Module Imports
console.log('📦 Testing Module Imports...');

try {
  const { formatTweet } = await import('../api/utils/formatter.js');
  console.log('✅ Formatter module imported');
  
  // Test formatting
  const testTweet = formatTweet('MARKET_UPDATE', {
    analysis: 'BTC looking strong at $43,000',
    hashtags: '#crypto #Bitcoin'
  });
  
  if (testTweet && testTweet.length > 0) {
    console.log('✅ Tweet formatting works');
    console.log(`   Sample: ${testTweet.substring(0, 50)}...`);
  } else {
    console.log('❌ Tweet formatting failed');
  }
} catch (error) {
  console.log('❌ Formatter import failed:', error.message);
}

try {
  const { getCachedData, setCachedData } = await import('../api/utils/cache.js');
  console.log('✅ Cache module imported');
  
  // Test cache
  setCachedData('test', 'value', 1);
  const retrieved = getCachedData('test');
  
  if (retrieved === 'value') {
    console.log('✅ Cache functionality works');
  } else {
    console.log('❌ Cache functionality failed');
  }
} catch (error) {
  console.log('❌ Cache import failed:', error.message);
}

try {
  const { validateEnvironment } = await import('../lib/helpers.js');
  console.log('✅ Helpers module imported');
  
  if (envPassed === requiredEnvs.length) {
    const validation = validateEnvironment();
    console.log('✅ Environment validation passed');
  } else {
    console.log('⚠️ Skipping validation - missing env vars');
  }
} catch (error) {
  console.log('❌ Helpers import failed:', error.message);
}

// Test 3: API Connections (if env vars are present)
if (envPassed === requiredEnvs.length) {
  console.log('\n🔌 Testing API Connections...');
  
  try {
    const TwitterService = (await import('../api/services/twitter.js')).default;
    const twitter = new TwitterService();
    
    const isValid = await twitter.validateConnection();
    if (isValid) {
      console.log('✅ Twitter API connection successful');
    } else {
      console.log('❌ Twitter API connection failed');
    }
  } catch (error) {
    console.log('❌ Twitter API test failed:', error.message);
  }

  try {
    const CrestaAI = (await import('../api/services/crestal.js')).default;
    const cresta = new CrestaAI();
    
    const stats = cresta.getUsageStats();
    console.log('✅ Crestal AI service loaded');
    console.log(`   Daily usage: ${stats.daily} CAPs`);
    console.log(`   Emergency mode: ${stats.emergencyMode}`);
  } catch (error) {
    console.log('❌ Crestal AI test failed:', error.message);
  }
} else {
  console.log('\n⚠️ Skipping API tests - environment not fully configured');
}

console.log('\n🎯 Quick Test Summary:');
console.log(`📋 Environment: ${envPassed}/${requiredEnvs.length} vars configured`);
console.log('📦 Module imports: Check logs above');
console.log('🔌 API connections: Check logs above');

if (envPassed === requiredEnvs.length) {
  console.log('\n🚀 Bot appears ready for deployment!');
  console.log('Next steps:');
  console.log('1. Deploy to Vercel: vercel --prod');
  console.log('2. Test cron jobs manually');
  console.log('3. Monitor for mentions');
} else {
  console.log('\n⚠️ Complete your .env configuration first');
  console.log('Missing environment variables need to be added');
}

console.log('\n✨ Test completed!');
