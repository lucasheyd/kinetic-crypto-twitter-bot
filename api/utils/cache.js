// api/utils/cache.js - Simple In-Memory Cache System

// In-memory cache store
const cache = new Map();

export function getCachedData(key) {
  const item = cache.get(key);
  
  if (!item) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  console.log(`📦 Cache hit for: ${key}`);
  return item.data;
}

export function setCachedData(key, data, durationMinutes = 30) {
  const expiry = Date.now() + (durationMinutes * 60 * 1000);
  
  cache.set(key, {
    data,
    expiry,
    created: Date.now()
  });
  
  console.log(`💾 Cached data for: ${key} (${durationMinutes}min)`);
}

export function clearCache(key = null) {
  if (key) {
    cache.delete(key);
    console.log(`🗑️ Cleared cache for: ${key}`);
  } else {
    cache.clear();
    console.log('🗑️ Cleared entire cache');
  }
}

export function getCacheStats() {
  const stats = {
    totalItems: cache.size,
    items: []
  };
  
  for (const [key, item] of cache.entries()) {
    const ageMinutes = Math.floor((Date.now() - item.created) / (1000 * 60));
    const ttlMinutes = Math.floor((item.expiry - Date.now()) / (1000 * 60));
    
    stats.items.push({
      key,
      ageMinutes,
      ttlMinutes: Math.max(0, ttlMinutes),
      expired: Date.now() > item.expiry
    });
  }
  
  return stats;
}

export function cleanupExpiredCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired cache items`);
  }
  
  return cleaned;
}

// Auto cleanup every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);