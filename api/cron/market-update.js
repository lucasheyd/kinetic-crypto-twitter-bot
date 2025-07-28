// api/cron/market-update.js - Automated Market Analysis Posts
import CrestaAI from '../services/crestal.js';
import TwitterService from '../services/twitter.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 Market update cron job started');
  
  try {
    const cresta = new CrestaAI();
    const twitter = new TwitterService();

    // Validate Twitter connection
    const twitterConnected = await twitter.validateConnection();
    if (!twitterConnected) {
      throw new Error('Twitter connection failed');
    }

    // Check if we're in emergency mode
    const crestaStats = cresta.getUsageStats();
    if (crestaStats.emergencyMode) {
      console.log('🚨 Emergency mode active - using cached analysis');
      
      const cachedAnalysis = getCachedData('last_market_analysis');
      if (cachedAnalysis) {
        const success = await twitter.postMarketUpdate(cachedAnalysis + ' (cached)');
        return res.json({ 
          success, 
          mode: 'emergency',
          analysis: cachedAnalysis 
        });
      }
    }

    // Generate fresh market analysis
    console.log('📊 Generating market analysis...');
    const analysis = await cresta.generateMarketAnalysis();
    
    if (!analysis) {
      throw new Error('Failed to generate market analysis');
    }

    // Cache the analysis for emergency mode
    setCachedData('last_market_analysis', analysis, 60); // Cache for 1 hour

    // Post to Twitter
    console.log('🐦 Posting to Twitter...');
    const tweetData = await twitter.postMarketUpdate(analysis);
    
    if (!tweetData) {
      throw new Error('Failed to post to Twitter');
    }

    // Track successful execution
    const executionStats = getCachedData('market_update_stats') || { 
      total: 0, 
      successful: 0, 
      lastSuccess: null 
    };
    
    executionStats.total++;
    executionStats.successful++;
    executionStats.lastSuccess = new Date().toISOString();
    
    setCachedData('market_update_stats', executionStats, 60 * 24); // Cache for 24 hours

    console.log('✅ Market update posted successfully');
    
    return res.json({
      success: true,
      tweetId: tweetData.id,
      analysis: analysis.substring(0, 100) + '...',
      stats: {
        capsUsed: crestaStats.daily,
        tweetsThisHour: twitter.getStats().tweetsThisHour,
        emergencyMode: crestaStats.emergencyMode
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Market update cron failed:', error);

    // Track failed execution
    const executionStats = getCachedData('market_update_stats') || { 
      total: 0, 
      successful: 0, 
      failed: 0,
      lastError: null 
    };
    
    executionStats.total++;
    executionStats.failed = (executionStats.failed || 0) + 1;
    executionStats.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    setCachedData('market_update_stats', executionStats, 60 * 24);

    // Try to post a fallback tweet
    try {
      const twitter = new TwitterService();
      const fallbackMessage = "🤖 Market analysis temporarily unavailable. Stay tuned for updates! Always DYOR 📊";
      await twitter.postMarketUpdate(fallbackMessage);
      console.log('📝 Posted fallback tweet');
    } catch (fallbackError) {
      console.error('❌ Fallback tweet also failed:', fallbackError);
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}