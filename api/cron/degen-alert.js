// api/cron/degen-alert.js - Automated Degen/Meme Coin Alerts (Complete)
import CrestaAI from '../services/crestal.js';
import TwitterService from '../services/twitter.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🚨 Degen alert cron job started');
  
  try {
    const cresta = new CrestaAI();
    const twitter = new TwitterService();

    // Validate Twitter connection
    const twitterConnected = await twitter.validateConnection();
    if (!twitterConnected) {
      throw new Error('Twitter connection failed');
    }

    // Check if we should skip this cycle (don't spam degen alerts)
    const lastAlert = getCachedData('last_degen_alert_time');
    const minInterval = 4 * 60 * 60 * 1000; // 4 hours minimum between alerts (was 2 hours)
    
    if (lastAlert && (Date.now() - lastAlert) < minInterval) {
      const nextAlertTime = new Date(lastAlert + minInterval);
      console.log(`⏭️ Skipping degen alert - next alert at ${nextAlertTime.toISOString()}`);
      return res.json({ 
        success: true, 
        skipped: true, 
        reason: 'rate_limited',
        nextAlert: nextAlertTime.toISOString()
      });
    }

    // Check emergency mode (CAP conservation)
    const crestaStats = cresta.getUsageStats();
    if (crestaStats.emergencyMode) {
      console.log('🚨 Emergency mode - skipping degen alert to conserve CAPs');
      return res.json({ 
        success: true, 
        skipped: true, 
        reason: 'emergency_mode',
        capsUsed: crestaStats.daily
      });
    }

    // Additional CAP check - don't use too many CAPs on degen alerts
    const maxCapsForDegenAlert = 15; // Conservative limit for degen searches
    if (crestaStats.daily > (100 - maxCapsForDegenAlert)) {
      console.log(`⚠️ Skipping degen alert - too many CAPs used today (${crestaStats.daily})`);
      return res.json({
        success: true,
        skipped: true,
        reason: 'cap_conservation',
        capsUsed: crestaStats.daily
      });
    }

    // Generate degen alert
    console.log('🔍 Generating degen alert...');
    const alert = await cresta.generateDegenAlert();
    
    if (!alert) {
      throw new Error('Failed to generate degen alert');
    }

    // Check if this alert is significantly different from the last one
    const lastAlertContent = getCachedData('last_degen_alert_content');
    if (lastAlertContent && isSimilarContent(alert, lastAlertContent)) {
      console.log('⏭️ Skipping degen alert - too similar to last one');
      
      // Still update the time to prevent spam, but don't post
      setCachedData('last_degen_alert_time', Date.now(), 60 * 6);
      
      return res.json({ 
        success: true, 
        skipped: true, 
        reason: 'similar_content',
        similarity: 'Content too similar to previous alert'
      });
    }

    // Check for minimum quality/length
    if (alert.length < 20) {
      console.log('⏭️ Skipping degen alert - content too short');
      return res.json({
        success: true,
        skipped: true,
        reason: 'content_too_short',
        alertLength: alert.length
      });
    }

    // Post to Twitter
    console.log('🐦 Posting degen alert to Twitter...');
    const tweetData = await twitter.postDegenAlert(alert);
    
    if (!tweetData) {
      throw new Error('Failed to post degen alert to Twitter');
    }

    // Cache this alert with longer duration
    setCachedData('last_degen_alert_time', Date.now(), 60 * 8); // Cache for 8 hours
    setCachedData('last_degen_alert_content', alert, 60 * 8); // Cache content for 8 hours

    // Track successful execution
    const executionStats = getCachedData('degen_alert_stats') || { 
      total: 0, 
      successful: 0, 
      skipped: 0,
      failed: 0,
      lastSuccess: null,
      totalCapsUsed: 0
    };
    
    executionStats.total++;
    executionStats.successful++;
    executionStats.lastSuccess = new Date().toISOString();
    executionStats.totalCapsUsed += (crestaStats.daily - (getCachedData('caps_before_degen') || 0));
    
    setCachedData('degen_alert_stats', executionStats, 60 * 24 * 7); // Cache for 1 week

    console.log('✅ Degen alert posted successfully');
    
    return res.json({
      success: true,
      tweetId: tweetData.id,
      alert: alert.substring(0, 100) + '...',
      stats: {
        capsUsed: crestaStats.daily,
        capsUsedForThisAlert: crestaStats.daily - (getCachedData('caps_before_degen') || 0),
        tweetsThisHour: twitter.getStats().tweetsThisHour,
        emergencyMode: crestaStats.emergencyMode,
        nextAlertEarliest: new Date(Date.now() + minInterval).toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Degen alert cron failed:', error);

    // Track failed execution
    const executionStats = getCachedData('degen_alert_stats') || { 
      total: 0, 
      successful: 0, 
      failed: 0,
      skipped: 0,
      lastError: null,
      errorHistory: []
    };
    
    executionStats.total++;
    executionStats.failed = (executionStats.failed || 0) + 1;
    executionStats.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    // Keep error history
    executionStats.errorHistory = executionStats.errorHistory || [];
    executionStats.errorHistory.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 errors
    if (executionStats.errorHistory.length > 10) {
      executionStats.errorHistory = executionStats.errorHistory.slice(-10);
    }
    
    setCachedData('degen_alert_stats', executionStats, 60 * 24 * 7);

    // Try posting a fallback message if it's not a rate limit issue
    if (!error.message.includes('rate') && !error.message.includes('limit')) {
      try {
        const twitter = new TwitterService();
        const fallbackMessage = "🚨 Degen radars temporarily offline! Stay alert for those moon missions! 🚀 Always DYOR #degen #crypto";
        await twitter.postDegenAlert(fallbackMessage);
        console.log('📝 Posted degen alert fallback message');
      } catch (fallbackError) {
        console.error('❌ Degen alert fallback also failed:', fallbackError);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: getErrorType(error),
      retryable: isRetryableError(error),
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to check if content is too similar (more sophisticated)
function isSimilarContent(newContent, oldContent) {
  if (!newContent || !oldContent) return false;
  
  // Normalize content for comparison
  const normalize = (text) => text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const newNormalized = normalize(newContent);
  const oldNormalized = normalize(oldContent);
  
  // Split into words and filter out common words
  const commonWords = ['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'crypto', 'coin', 'token', 'dyor'];
  const getSignificantWords = (text) => text.split(' ')
    .filter(word => word.length > 3 && !commonWords.includes(word));
  
  const newWords = new Set(getSignificantWords(newNormalized));
  const oldWords = new Set(getSignificantWords(oldNormalized));
  
  // Calculate similarity based on significant word overlap
  const intersection = new Set([...newWords].filter(x => oldWords.has(x)));
  const union = new Set([...newWords, ...oldWords]);
  
  const similarityRatio = intersection.size / union.size;
  
  console.log(`📊 Content similarity: ${(similarityRatio * 100).toFixed(1)}%`);
  
  return similarityRatio > 0.5; // 50% similarity threshold (reduced from 60%)
}

// Helper function to categorize error types
function getErrorType(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('rate') || message.includes('limit')) {
    return 'rate_limit';
  } else if (message.includes('timeout') || message.includes('abort')) {
    return 'timeout';
  } else if (message.includes('network') || message.includes('connection')) {
    return 'network';
  } else if (message.includes('auth') || message.includes('401')) {
    return 'auth';
  } else if (message.includes('twitter')) {
    return 'twitter_api';
  } else if (message.includes('crestal')) {
    return 'crestal_api';
  } else {
    return 'unknown';
  }
}

// Helper function to determine if error is retryable
function isRetryableError(error) {
  const retryableTypes = ['timeout', 'network', 'twitter_api', 'crestal_api'];
  const errorType = getErrorType(error);
  return retryableTypes.includes(errorType);
}

// Manual trigger endpoint for testing
export async function triggerDegenAlert(req, res) {
  console.log('🔧 Manual degen alert triggered');
  
  // Temporarily override the rate limiting for manual triggers
  const originalTime = getCachedData('last_degen_alert_time');
  setCachedData('last_degen_alert_time', Date.now() - (5 * 60 * 60 * 1000), 1); // Set to 5 hours ago
  
  const result = await handler(req, res);
  
  // Restore original time if the manual trigger failed
  if (!result.success && originalTime) {
    setCachedData('last_degen_alert_time', originalTime, 60 * 8);
  }
  
  return result;
}