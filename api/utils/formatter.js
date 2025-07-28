// api/utils/formatter.js - Tweet Formatting and Text Processing
import { TWITTER_CONFIG, BOT_CONFIG, SUPPORTED_COMMANDS } from '../../lib/constants.js';

export function formatTweet(template, data) {
  const templateText = TWITTER_CONFIG.TEMPLATES[template];
  
  if (!templateText) {
    console.error('❌ Unknown tweet template:', template);
    return TWITTER_CONFIG.TEMPLATES.ERROR_RESPONSE;
  }

  let formattedTweet = templateText;
  
  // Replace placeholders with actual data
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    formattedTweet = formattedTweet.replace(placeholder, data[key] || '');
  });

  // Ensure tweet is within character limit
  if (formattedTweet.length > BOT_CONFIG.TWEET_MAX_LENGTH) {
    const excess = formattedTweet.length - BOT_CONFIG.TWEET_MAX_LENGTH + 3; // +3 for '...'
    
    // Try to truncate the main content, preserve hashtags
    const hashtagIndex = formattedTweet.lastIndexOf('#');
    if (hashtagIndex > 0) {
      const contentPart = formattedTweet.substring(0, hashtagIndex).trim();
      const hashtagPart = formattedTweet.substring(hashtagIndex);
      
      const truncatedContent = contentPart.length > excess 
        ? contentPart.substring(0, contentPart.length - excess) + '...'
        : contentPart;
      
      formattedTweet = truncatedContent + '\n\n' + hashtagPart;
    } else {
      formattedTweet = formattedTweet.substring(0, BOT_CONFIG.TWEET_MAX_LENGTH - 3) + '...';
    }
  }

  return formattedTweet;
}

export function extractCommand(text) {
  const cleanText = text.toLowerCase()
    .replace(/@\w+/g, '') // Remove mentions
    .replace(/[^\w\s$]/g, ' ') // Remove special chars except $
    .trim();

  // Check for supported commands
  for (const [command, description] of Object.entries(SUPPORTED_COMMANDS)) {
    if (cleanText.includes(command)) {
      return {
        command,
        description,
        fullText: cleanText
      };
    }
  }

  // Default to analyze if no specific command found
  return {
    command: 'analyze',
    description: SUPPORTED_COMMANDS.analyze,
    fullText: cleanText
  };
}

export function extractTokens(text) {
  // Extract tokens mentioned with $ symbol
  const tokenMatches = text.match(/\$[A-Za-z0-9]+/g);
  const tokens = tokenMatches ? tokenMatches.map(token => token.substring(1).toUpperCase()) : [];
  
  // Also look for common token names without $
  const commonTokens = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE', 'PEPE', 'DOGE', 'SHIB'];
  const textUpper = text.toUpperCase();
  
  commonTokens.forEach(token => {
    if (textUpper.includes(token) && !tokens.includes(token)) {
      tokens.push(token);
    }
  });

  return [...new Set(tokens)]; // Remove duplicates
}

export function extractPriceQuery(text) {
  const tokens = extractTokens(text);
  const priceKeywords = ['price', 'cost', 'value', 'worth', 'quote'];
  const hasPriceKeyword = priceKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );

  return {
    isPriceQuery: hasPriceKeyword || tokens.length > 0,
    tokens,
    timeframe: extractTimeframe(text)
  };
}

export function extractTimeframe(text) {
  const timeframes = {
    '1h': ['1h', '1 hour', 'hourly'],
    '4h': ['4h', '4 hours'],
    '1d': ['1d', '1 day', 'daily', 'today'],
    '1w': ['1w', '1 week', 'weekly', 'week'],
    '1m': ['1m', '1 month', 'monthly', 'month']
  };

  const textLower = text.toLowerCase();
  
  for (const [timeframe, keywords] of Object.entries(timeframes)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return timeframe;
    }
  }

  return '1d'; // Default to 1 day
}

export function formatAnalysisResponse(analysis, tokens = []) {
  let response = analysis;

  // Add token context if specific tokens were mentioned
  if (tokens.length > 0) {
    const tokenList = tokens.join(', ');
    if (!response.toLowerCase().includes(tokens[0].toLowerCase())) {
      response = `${tokenList}: ${response}`;
    }
  }

  // Ensure response ends with DYOR if it's trading advice
  const tradingKeywords = ['buy', 'sell', 'entry', 'exit', 'target', 'support', 'resistance'];
  const hasTradingAdvice = tradingKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );

  if (hasTradingAdvice && !response.toLowerCase().includes('dyor')) {
    response += ' DYOR!';
  }

  return response;
}

export function formatErrorResponse(error, context = '') {
  const errorResponses = {
    'timeout': '⏰ Analysis taking longer than expected. Try a simpler question!',
    'rate_limit': '🚨 High demand! Try again in a few minutes. DYOR.',
    'invalid_token': '❓ Token not found. Check spelling or try a different symbol.',
    'api_error': '🤖 Temporary issue. Try again! DYOR always.',
    'emergency_mode': '⚡ Running on cached data. Fresh analysis coming soon! DYOR.'
  };

  return errorResponses[error] || errorResponses['api_error'];
}

export function generateMarketSummary(data) {
  if (!data || typeof data !== 'object') {
    return 'Market data unavailable. DYOR always!';
  }

  const { btc, eth, totalMarketCap, fear_greed, trending } = data;
  
  let summary = '📊 MARKET SUMMARY\n\n';
  
  if (btc && btc.price) {
    summary += `₿ BTC: $${formatPrice(btc.price)} (${formatChange(btc.change_24h)})\n`;
  }
  
  if (eth && eth.price) {
    summary += `Ξ ETH: $${formatPrice(eth.price)} (${formatChange(eth.change_24h)})\n`;
  }
  
  if (totalMarketCap) {
    summary += `💰 Total MC: $${formatLargeNumber(totalMarketCap)}\n`;
  }
  
  if (fear_greed) {
    summary += `😱 Fear & Greed: ${fear_greed}\n`;
  }
  
  if (trending && trending.length > 0) {
    summary += `🔥 Trending: ${trending.slice(0, 3).join(', ')}\n`;
  }
  
  summary += '\nDYOR!';
  
  return summary;
}

export function formatPrice(price) {
  if (price >= 1000) {
    return Math.round(price).toLocaleString();
  } else if (price >= 1) {
    return price.toFixed(2);
  } else if (price >= 0.01) {
    return price.toFixed(4);
  } else {
    return price.toFixed(8);
  }
}

export function formatChange(change) {
  if (typeof change !== 'number') return '';
  
  const symbol = change >= 0 ? '+' : '';
  const emoji = change >= 0 ? '🟢' : '🔴';
  
  return `${symbol}${change.toFixed(2)}% ${emoji}`;
}

export function formatLargeNumber(num) {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(1) + 'T';
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

export function sanitizeForTwitter(text) {
  return text
    .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function addEmojisToContent(text, contentType) {
  const emojiMaps = {
    'bullish': '🚀📈💚🔥⚡',
    'bearish': '📉🔴😰⬇️💀',
    'neutral': '➡️⚖️🤔💭📊',
    'degen': '🐸🚨💎🦍🌙',
    'defi': '🏛️💰🔒⚡🌊'
  };

  // Simple sentiment detection
  const bullishWords = ['pump', 'moon', 'bullish', 'up', 'green', 'gains'];
  const bearishWords = ['dump', 'crash', 'bearish', 'down', 'red', 'loss'];
  const degenWords = ['meme', 'ape', 'diamond', 'hands', 'hodl'];
  const defiWords = ['yield', 'farming', 'liquidity', 'staking', 'tvl'];

  const textLower = text.toLowerCase();
  
  if (degenWords.some(word => textLower.includes(word))) {
    return text; // Degen content already has plenty of emojis
  } else if (defiWords.some(word => textLower.includes(word))) {
    return text; // DeFi content is more professional
  } else if (bullishWords.some(word => textLower.includes(word))) {
    return text + ' 🚀';
  } else if (bearishWords.some(word => textLower.includes(word))) {
    return text + ' 📉';
  }

  return text;
}