// lib/helpers.js - Common Utility Functions
import { getCachedData, setCachedData } from '../api/utils/cache.js';

export function validateEnvironment() {
  const required = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET', 
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
    'TWITTER_BEARER_TOKEN',
    'CRESTAL_API_KEY',
    'CRON_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment validation passed');
  return true;
}

export function generateSecureCronSecret() {
  return 'cron_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === 'true' || getCachedData('maintenance_mode') === true;
}

export function setMaintenanceMode(enabled, reason = '') {
  setCachedData('maintenance_mode', enabled, 60 * 24); // 24 hours max
  if (enabled) {
    setCachedData('maintenance_reason', reason, 60 * 24);
    console.log(`🔧 Maintenance mode enabled: ${reason}`);
  } else {
    console.log('✅ Maintenance mode disabled');
  }
}

export function getSystemHealth() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      maintenanceMode: isMaintenanceMode(),
      autoPostsEnabled: process.env.ENABLE_AUTO_POSTS !== 'false',
      mentionRepliesEnabled: process.env.ENABLE_MENTION_REPLIES !== 'false',
      degenAlertsEnabled: process.env.ENABLE_DEGEN_ALERTS !== 'false'
    }
  };

  // Check cache health
  const cacheStats = getCachedData('cache_stats');
  if (cacheStats) {
    health.cache = cacheStats;
  }

  // Check recent errors
  const recentErrors = getCachedData('recent_errors') || [];
  if (recentErrors.length > 0) {
    health.recentErrors = recentErrors.slice(-5); // Last 5 errors
    if (recentErrors.length > 10) {
      health.status = 'degraded';
    }
  }

  return health;
}

export function logError(error, context = {}) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };

  console.error('❌ Error logged:', errorLog);

  // Store recent errors for health checks
  const recentErrors = getCachedData('recent_errors') || [];
  recentErrors.push(errorLog);
  
  // Keep only last 20 errors
  if (recentErrors.length > 20) {
    recentErrors.splice(0, recentErrors.length - 20);
  }
  
  setCachedData('recent_errors', recentErrors, 60 * 24); // Store for 24 hours
}

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function rateLimitCheck(key, maxRequests, windowMinutes) {
  const windowMs = windowMinutes * 60 * 1000;
  const requests = getCachedData(`rate_limit_${key}`) || [];
  
  // Filter out old requests
  const validRequests = requests.filter(timestamp => 
    Date.now() - timestamp < windowMs
  );
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limited
  }
  
  // Add current request
  validRequests.push(Date.now());
  setCachedData(`rate_limit_${key}`, validRequests, windowMinutes);
  
  return true; // Request allowed
}

export function generateAnalyticsReport() {
  const stats = {
    marketUpdates: getCachedData('market_update_stats') || {},
    degenAlerts: getCachedData('degen_alert_stats') || {},
    mentionProcessing: getCachedData('mention_processing_stats') || {},
    globalInteractions: getCachedData('global_interaction_stats') || {},
    systemHealth: getSystemHealth(),
    timestamp: new Date().toISOString()
  };

  return stats;
}

export function scheduleCleanup() {
  // Clean up old cache entries every hour
  setInterval(() => {
    console.log('🧹 Running scheduled cleanup...');
    
    // Clean expired cache automatically handled by cache.js
    // Add any additional cleanup tasks here
    
  }, 60 * 60 * 1000); // 1 hour
}

export function parseTokenFromText(text) {
  // Extract token symbols from various formats
  const patterns = [
    /\$([A-Z]{2,10})/gi,           // $BTC, $ETH
    /\b([A-Z]{2,10})\b/g,          // BTC, ETH (standalone)
    /#([A-Z]{2,10})/gi,            // #BTC, #ETH
  ];

  const tokens = new Set();
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const token = match.replace(/[$#]/, '').toUpperCase();
        if (token.length >= 2 && token.length <= 10) {
          tokens.add(token);
        }
      });
    }
  });

  return Array.from(tokens);
}

export function isValidCronRequest(req) {
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!authHeader || authHeader !== expectedAuth) {
    console.log('❌ Invalid cron request - bad authorization');
    return false;
  }

  // Additional checks can be added here (IP whitelist, etc.)
  return true;
}

export function buildSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function buildErrorResponse(error, code = 500) {
  return {
    success: false,
    error: error.message || error,
    code,
    timestamp: new Date().toISOString()
  };
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncateText(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function sanitizeUsername(username) {
  return username.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 15);
}

export function getTimeBasedGreeting() {
  const hour = new Date().getUTCHours();
  
  if (hour < 6) return '🌙 GM night owls!';
  if (hour < 12) return '☀️ GM crypto fam!';
  if (hour < 18) return '🌅 Good afternoon!';
  return '🌆 Good evening!';
}

export function shouldPostContent(contentType) {
  // Skip posting during maintenance
  if (isMaintenanceMode()) {
    console.log('🔧 Skipping post - maintenance mode');
    return false;
  }

  // Check feature flags
  const featureMap = {
    'market': 'ENABLE_AUTO_POSTS',
    'degen': 'ENABLE_DEGEN_ALERTS',
    'defi': 'ENABLE_AUTO_POSTS',
    'tips': 'ENABLE_AUTO_POSTS'
  };

  const envVar = featureMap[contentType];
  if (envVar && process.env[envVar] === 'false') {
    console.log(`⏸️ Skipping ${contentType} post - feature disabled`);
    return false;
  }

  return true;
}