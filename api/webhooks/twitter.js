// api/webhooks/twitter.js - Handle Twitter Mentions and Replies
import CrestaAI from '../services/crestal.js';
import TwitterService from '../services/twitter.js';
import { extractCommand, extractTokens, formatAnalysisResponse } from '../utils/formatter.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

export default async function handler(req, res) {
  console.log('🔔 Twitter webhook triggered');
  
  try {
    const twitter = new TwitterService();
    const cresta = new CrestaAI();

    // Get last processed mention ID to avoid duplicates
    const lastMentionId = await twitter.getLastMentionId();
    
    // Fetch new mentions
    const mentions = await twitter.getMentions(lastMentionId);
    
    if (mentions.length === 0) {
      console.log('📭 No new mentions to process');
      return res.json({ success: true, processed: 0 });
    }

    console.log(`📬 Processing ${mentions.length} new mentions`);
    
    let processed = 0;
    let successful = 0;
    let errors = [];

    // Process each mention
    for (const mention of mentions) {
      try {
        console.log(`💬 Processing mention from @${mention.authorUsername}: ${mention.text}`);
        
        // Skip if it's our own tweet or a retweet
        if (mention.authorUsername.toLowerCase() === process.env.BOT_TWITTER_HANDLE?.toLowerCase()) {
          console.log('⏭️ Skipping own tweet');
          continue;
        }

        // Extract user query (remove bot mention)
        const userQuery = mention.text
          .replace(new RegExp(`@${process.env.BOT_TWITTER_HANDLE}`, 'gi'), '')
          .trim();

        if (!userQuery || userQuery.length < 3) {
          console.log('⏭️ Skipping empty or too short query');
          continue;
        }

        // Check if user is rate limited
        if (isUserRateLimited(mention.authorUsername)) {
          console.log(`⏳ User @${mention.authorUsername} is rate limited`);
          continue;
        }

        // Generate AI response
        console.log('🤖 Generating AI response...');
        const analysis = await cresta.analyzeUserQuery(userQuery, mention.authorUsername);
        
        if (!analysis) {
          console.log('❌ No analysis generated');
          continue;
        }

        // Extract tokens and format response
        const tokens = extractTokens(userQuery);
        const formattedResponse = formatAnalysisResponse(analysis, tokens);

        // Reply to the mention
        const replySuccess = await twitter.replyToMention(
          mention.id,
          formattedResponse,
          mention.authorUsername
        );

        if (replySuccess) {
          successful++;
          console.log(`✅ Replied to @${mention.authorUsername}`);
          
          // Track user interaction
          trackUserInteraction(mention.authorUsername, userQuery, formattedResponse);
        } else {
          errors.push(`Failed to reply to @${mention.authorUsername}`);
        }

        processed++;

        // Add small delay between replies to be respectful
        await sleep(1000);

      } catch (error) {
        console.error(`❌ Error processing mention from @${mention.authorUsername}:`, error);
        errors.push(`Error with @${mention.authorUsername}: ${error.message}`);
      }
    }

    // Update last processed mention ID
    if (mentions.length > 0) {
      const latestMentionId = mentions[mentions.length - 1].id;
      await twitter.setLastMentionId(latestMentionId);
    }

    // Update processing stats
    const processingStats = getCachedData('mention_processing_stats') || {
      total: 0,
      successful: 0,
      failed: 0,
      lastProcessed: null
    };

    processingStats.total += processed;
    processingStats.successful += successful;
    processingStats.failed += (processed - successful);
    processingStats.lastProcessed = new Date().toISOString();

    setCachedData('mention_processing_stats', processingStats, 60 * 24);

    console.log(`✅ Processed ${processed} mentions, ${successful} successful replies`);

    return res.json({
      success: true,
      processed,
      successful,
      failed: processed - successful,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        capsUsed: cresta.getUsageStats().daily,
        emergencyMode: cresta.getUsageStats().emergencyMode,
        twitterRateLimit: twitter.getStats()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Twitter webhook failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Manual trigger endpoint for testing
export async function triggerMentionCheck(req, res) {
  console.log('🔧 Manual mention check triggered');
  return handler(req, res);
}

// Helper functions
function isUserRateLimited(username) {
  const userInteractions = getCachedData(`user_interactions_${username}`) || [];
  const recentInteractions = userInteractions.filter(
    interaction => Date.now() - interaction.timestamp < 5 * 60 * 1000 // 5 minutes
  );
  
  return recentInteractions.length >= 3; // Max 3 interactions per 5 minutes
}

function trackUserInteraction(username, query, response) {
  const userInteractions = getCachedData(`user_interactions_${username}`) || [];
  
  userInteractions.push({
    timestamp: Date.now(),
    query: query.substring(0, 100), // Store first 100 chars
    response: response.substring(0, 100),
    date: new Date().toISOString()
  });

  // Keep only last 20 interactions per user
  if (userInteractions.length > 20) {
    userInteractions.splice(0, userInteractions.length - 20);
  }

  setCachedData(`user_interactions_${username}`, userInteractions, 60 * 24 * 7); // Cache for 1 week

  // Also track global interaction stats
  const globalStats = getCachedData('global_interaction_stats') || {
    totalInteractions: 0,
    uniqueUsers: new Set(),
    topTokensAsked: {},
    lastUpdated: null
  };

  globalStats.totalInteractions++;
  globalStats.uniqueUsers.add(username);
  
  // Track most asked about tokens
  const tokens = extractTokens(query);
  tokens.forEach(token => {
    globalStats.topTokensAsked[token] = (globalStats.topTokensAsked[token] || 0) + 1;
  });

  globalStats.lastUpdated = new Date().toISOString();

  // Convert Set to Array for storage
  const statsToStore = {
    ...globalStats,
    uniqueUsers: Array.from(globalStats.uniqueUsers)
  };

  setCachedData('global_interaction_stats', statsToStore, 60 * 24);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}