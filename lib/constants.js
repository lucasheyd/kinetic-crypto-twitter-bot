// lib/constants.js - Bot Configuration Constants

export const BOT_CONFIG = {
  // Rate Limits
  MAX_TWEETS_PER_HOUR: 50,
  MAX_REPLIES_PER_HOUR: 100,
  MAX_CAPS_PER_CYCLE: 20,
  EMERGENCY_MODE_THRESHOLD: 10,
  REPLY_COOLDOWN_MINUTES: 5,
  
  // Content Limits
  TWEET_MAX_LENGTH: 280,
  ANALYSIS_MAX_LENGTH: 200,
  QUICK_RESPONSE_MAX_LENGTH: 150,
  
  // Timing
  MARKET_UPDATE_INTERVAL: 5, // hours
  DEGEN_ALERT_INTERVAL: 3,   // hours
  CACHE_DURATION: 30,        // minutes
  
  // Hashtags
  HASHTAGS: {
    CRYPTO: '#crypto',
    DEFI: '#DeFi', 
    BITCOIN: '#Bitcoin',
    ETHEREUM: '#Ethereum',
    MEMECOINS: '#memecoins',
    DEGEN: '#degen',
    TRADING: '#trading',
    YIELD: '#yield'
  }
};

export const CRESTAL_CONFIG = {
  MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 100,
  TEMPERATURE: 0.7,
  TIMEOUT: 8000,
  
  // Prompts
  SYSTEM_PROMPTS: {
    MARKET_ANALYSIS: 'You are Kinetic Crypto AI. Provide concise crypto market analysis in 180 chars max. Include key price levels and trends. Always end with DYOR.',
    
    DEGEN_ALERT: 'You are Kinetic Crypto AI focused on meme coins and degen plays. Alert about pumping tokens in 150 chars max. Be excited but include DYOR.',
    
    DEFI_UPDATE: 'You are Kinetic Crypto AI specializing in DeFi. Summarize TVL changes and yield opportunities in 180 chars max. Include DYOR.',
    
    USER_REPLY: 'You are Kinetic Crypto AI. Answer the users crypto question helpfully in 200 chars max. Be direct and include DYOR for trading advice.',
    
    TRADING_TIPS: 'You are Kinetic Crypto AI. Give practical trading advice in 180 chars max. Focus on risk management and include DYOR.'
  }
};

export const TWITTER_CONFIG = {
  // Tweet Templates
  TEMPLATES: {
    MARKET_UPDATE: '📊 MARKET UPDATE\n\n{analysis}\n\n{hashtags}',
    DEGEN_ALERT: '🚨 DEGEN ALERT 🚨\n\n{alert}\n\n{hashtags}',
    DEFI_UPDATE: '🏛️ DeFi UPDATE\n\n{update}\n\n{hashtags}',
    TRADING_TIP: '💡 TRADING TIP\n\n{tip}\n\n{hashtags}',
    ERROR_RESPONSE: '🤖 Temporary issue. Try again! DYOR always.'
  },
  
  // Common hashtag combinations
  HASHTAG_SETS: {
    MARKET: '#crypto #Bitcoin #Ethereum #trading',
    DEGEN: '#memecoins #degen #crypto #altcoins', 
    DEFI: '#DeFi #yield #crypto #staking',
    GENERAL: '#crypto #blockchain #DYOR'
  }
};

export const API_ENDPOINTS = {
  CRESTAL: {
    BASE_URL: 'https://open.service.crestal.network',
    CHAT: '/v1/chat/completions'
  },
  
  TWITTER: {
    BASE_URL: 'https://api.twitter.com/2',
    TWEET: '/tweets',
    MENTIONS: '/tweets/search/recent',
    USER_LOOKUP: '/users/by/username'
  }
};

export const ERROR_MESSAGES = {
  CRESTAL_DOWN: 'AI temporarily unavailable. Market looking good! DYOR always.',
  RATE_LIMITED: 'High demand! Try again in a few minutes. DYOR.',
  INVALID_REQUEST: 'Invalid request format. Try: @KineticCryptoAI analyze $BTC',
  EMERGENCY_MODE: 'Running on cached data. Fresh analysis coming soon! DYOR.',
  TIMEOUT: 'Analysis taking longer than expected. Try a simpler question!'
};

export const SUPPORTED_COMMANDS = {
  'analyze': 'Analyze a specific token or market',
  'price': 'Get current price information',
  'yield': 'Find yield opportunities', 
  'news': 'Latest crypto news and updates',
  'tip': 'Get a trading tip',
  'defi': 'DeFi protocol information',
  'degen': 'Meme coin and degen alerts'
};

export const CACHE_KEYS = {
  MARKET_DATA: 'market_analysis',
  DEGEN_ALERTS: 'degen_alerts',
  DEFI_DATA: 'defi_updates',
  USER_INTERACTIONS: 'user_interactions',
  CAP_USAGE: 'cap_usage_tracking'
};