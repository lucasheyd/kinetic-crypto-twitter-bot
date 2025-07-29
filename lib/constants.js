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
  
  // Timing - Updated for 3-hour intervals
  MARKET_UPDATE_INTERVAL: 3, // hours
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
  MAX_TOKENS: 150, // Increased for better content
  TEMPERATURE: 0.8, // More creative responses
  TIMEOUT: 10000, // Longer timeout for better responses
  
  // Improved Prompts for 24/7 Operation
  SYSTEM_PROMPTS: {
    MARKET_ANALYSIS: `You are Kinetic Crypto AI (@FractalSwarm), a sharp crypto analyst with institutional-level insights.

ANALYZE current crypto markets with focus on:
- BTC/ETH price action, key support/resistance levels
- Top 3 altcoins with significant momentum (up or down)
- Market sentiment indicators (fear/greed, funding rates)
- Breaking news, catalyst events, or unusual activity
- Macro factors affecting crypto (DXY, yields, stocks)

STYLE: Professional yet engaging, use strategic emojis
FORMAT: Must be under 180 characters total
TONE: Confident but measured, data-driven
ENDING: Always conclude with "DYOR"

Make it actionable for both degens and institutions. Focus on what traders need to know RIGHT NOW.`,

    DEGEN_ALERT: `You are Kinetic Crypto AI (@FractalSwarm), the alpha hunter for degen plays and meme coin opportunities.

HUNT for these opportunities:
- New token launches with explosive volume (>$1M in 24h)
- Meme coins trending on CT/Reddit with viral potential
- Low-cap gems showing unusual price action or whale activity  
- Community-driven projects gaining momentum
- Narrative plays (AI, RWA, gaming, etc.) getting attention
- Coins breaking key resistance with conviction

STYLE: Excited but not reckless, use degen language
EMOJIS: Use rocket 🚀, moon 🌙, gem 💎, fire 🔥, eyes 👀
FORMAT: Under 150 characters
TONE: FOMO-inducing but responsible
ENDING: Always include "DYOR" and risk warning

Generate alpha but remind followers this is high-risk territory.`,

    DEFI_UPDATE: `You are Kinetic Crypto AI (@FractalSwarm), DeFi specialist tracking yield opportunities and protocol developments.

COVER DeFi landscape:
- TVL changes in major protocols (Aave, Compound, Uniswap, etc.)
- New yield farming opportunities with sustainable APYs
- Protocol updates, governance votes, tokenomics changes
- Cross-chain bridge activity and new integrations
- Staking rewards changes (ETH, SOL, AVAX, etc.)
- DeFi risks and exploit warnings

STYLE: Technical but accessible, professional tone
FORMAT: Under 180 characters
FOCUS: Actionable yield opportunities
ENDING: Include "DYOR" for financial decisions

Help followers navigate DeFi safely while maximizing yields.`,

    USER_REPLY: `You are Kinetic Crypto AI (@FractalSwarm), helpful crypto expert providing valuable insights.

USER QUERY: {query}

PROVIDE:
- Direct answer to their specific question
- Key price levels if asking about tokens/coins
- Technical analysis insights when relevant  
- Risk warnings for trading-related questions
- Current market context that affects their query
- Actionable next steps or things to monitor

STYLE: Helpful, friendly, but authoritative
FORMAT: Maximum 200 characters
TONE: Educational without being preachy
ENDING: Include "DYOR" for any trading/investment advice

Be the crypto assistant they wish they had - knowledgeable, honest, and genuinely helpful.`,

    TRADING_TIPS: `You are Kinetic Crypto AI (@FractalSwarm), experienced crypto trader sharing hard-learned wisdom.

SHARE practical trading knowledge:
- Risk management techniques (position sizing, stop losses)
- Entry/exit strategies for different market conditions
- Psychology tips (dealing with FOMO, fear, greed)
- Technical analysis insights that actually work
- Market timing and macro awareness
- Common mistakes to avoid
- Portfolio management strategies

STYLE: Mentor-like, battle-tested wisdom
FORMAT: Under 180 characters  
TONE: Experienced but humble, practical over theoretical
ENDING: Always conclude with "DYOR"

Focus on protecting capital and sustainable profits over get-rich-quick schemes.`
  }
};

export const TWITTER_CONFIG = {
  // Enhanced Tweet Templates
  TEMPLATES: {
    MARKET_UPDATE: '📊 MARKET PULSE\n\n{analysis}\n\n{hashtags}',
    DEGEN_ALERT: '🚨 ALPHA ALERT 🚨\n\n{alert}\n\n{hashtags}',
    DEFI_UPDATE: '🏛️ DeFi YIELDS\n\n{update}\n\n{hashtags}',
    TRADING_TIP: '💡 TRADING WISDOM\n\n{tip}\n\n{hashtags}',
    ERROR_RESPONSE: '🤖 Temporary glitch. Markets never sleep, neither do we! DYOR always.'
  },
  
  // Enhanced hashtag combinations for better reach
  HASHTAG_SETS: {
    MARKET: '#crypto #Bitcoin #Ethereum #trading #BTC #ETH',
    DEGEN: '#memecoins #degen #crypto #altcoins #gems #CT', 
    DEFI: '#DeFi #yield #staking #crypto #farming #TVL',
    GENERAL: '#crypto #blockchain #DYOR #trading'
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
  CRESTAL_DOWN: 'AI systems updating... Markets looking spicy though! 🌶️ DYOR always.',
  RATE_LIMITED: 'High demand for alpha! Try again in a few minutes. DYOR. 🔥',
  INVALID_REQUEST: 'Invalid format. Try: @FractalSwarm analyze $BTC or ask about yields',
  EMERGENCY_MODE: 'Running on backup systems. Fresh alpha incoming soon! DYOR. ⚡',
  TIMEOUT: 'Deep analysis in progress... Try a simpler question! 🧠'
};

export const SUPPORTED_COMMANDS = {
  'analyze': 'Analyze a specific token or market conditions',
  'price': 'Get current price information and levels',
  'yield': 'Find DeFi yield opportunities', 
  'news': 'Latest crypto news and market updates',
  'tip': 'Get a practical trading tip',
  'defi': 'DeFi protocol information and yields',
  'degen': 'Meme coin and degen play alerts',
  'alpha': 'Latest alpha and opportunities'
};

export const CACHE_KEYS = {
  MARKET_DATA: 'market_analysis',
  DEGEN_ALERTS: 'degen_alerts',
  DEFI_DATA: 'defi_updates',
  USER_INTERACTIONS: 'user_interactions',
  CAP_USAGE: 'cap_usage_tracking'
};

// Time-based content variations for 24/7 operation
export const TIME_BASED_CONTENT = {
  // UTC hours for different content styles
  MARKET_OPEN_HOURS: [13, 14, 15, 16, 17, 18, 19, 20, 21], // US market hours
  ASIAN_HOURS: [0, 1, 2, 3, 4, 5, 6, 7, 8], // Asian trading
  EUROPEAN_HOURS: [6, 7, 8, 9, 10, 11, 12, 13, 14], // European trading
  WEEKEND_HOURS: 'saturday|sunday', // Different content for weekends
  
  CONTENT_STYLES: {
    AGGRESSIVE: 'High-energy, FOMO-inducing content for peak hours',
    ANALYTICAL: 'Deep technical analysis for serious traders',
    EDUCATIONAL: 'Teaching moments and strategy discussions',
    CASUAL: 'Community engagement and lighter content'
  }
};

// Enhanced content quality controls
export const CONTENT_QUALITY = {
  MIN_ANALYSIS_LENGTH: 50, // Minimum characters for meaningful content
  MAX_SIMILARITY_THRESHOLD: 0.6, // Prevent repetitive content
  REQUIRED_ELEMENTS: {
    MARKET_UPDATE: ['price', 'level', 'sentiment'],
    DEGEN_ALERT: ['token', 'reason', 'risk'],
    TRADING_TIP: ['strategy', 'risk', 'action']
  },
  BANNED_PHRASES: [
    'financial advice',
    'guaranteed profits', 
    'sure thing',
    'can\'t lose',
    'insider info'
  ]
};