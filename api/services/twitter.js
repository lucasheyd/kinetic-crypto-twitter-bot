// api/services/twitter.js - Twitter API Integration
import { TwitterApi } from 'twitter-api-v2';
import { TWITTER_CONFIG, BOT_CONFIG, ERROR_MESSAGES } from '../../lib/constants.js';
import { formatTweet, extractCommand, extractTokens } from '../utils/formatter.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

export class TwitterService {
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    this.readOnlyClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    this.botHandle = process.env.BOT_TWITTER_HANDLE || 'KineticCryptoAI';
    this.tweetCount = { hourly: 0, lastReset: new Date() };
  }

  async postMarketUpdate(analysis) {
    console.log('📊 Posting market update...');
    
    if (!this.canTweet()) {
      console.log('⚠️ Tweet rate limit reached');
      return false;
    }

    try {
      const tweet = formatTweet('MARKET_UPDATE', {
        analysis,
        hashtags: TWITTER_CONFIG.HASHTAG_SETS.MARKET
      });

      const response = await this.client.v2.tweet(tweet);
      this.trackTweet();
      
      console.log('✅ Market update posted:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to post market update:', error);
      return false;
    }
  }

  async postDegenAlert(alert) {
    console.log('🚨 Posting degen alert...');
    
    if (!this.canTweet()) {
      console.log('⚠️ Tweet rate limit reached');
      return false;
    }

    try {
      const tweet = formatTweet('DEGEN_ALERT', {
        alert,
        hashtags: TWITTER_CONFIG.HASHTAG_SETS.DEGEN
      });

      const response = await this.client.v2.tweet(tweet);
      this.trackTweet();
      
      console.log('✅ Degen alert posted:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to post degen alert:', error);
      return false;
    }
  }

  async postDeFiUpdate(update) {
    console.log('🏛️ Posting DeFi update...');
    
    if (!this.canTweet()) {
      console.log('⚠️ Tweet rate limit reached');
      return false;
    }

    try {
      const tweet = formatTweet('DEFI_UPDATE', {
        update,
        hashtags: TWITTER_CONFIG.HASHTAG_SETS.DEFI
      });

      const response = await this.client.v2.tweet(tweet);
      this.trackTweet();
      
      console.log('✅ DeFi update posted:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to post DeFi update:', error);
      return false;
    }
  }

  async postTradingTip(tip) {
    console.log('💡 Posting trading tip...');
    
    if (!this.canTweet()) {
      console.log('⚠️ Tweet rate limit reached');
      return false;
    }

    try {
      const tweet = formatTweet('TRADING_TIP', {
        tip,
        hashtags: TWITTER_CONFIG.HASHTAG_SETS.GENERAL
      });

      const response = await this.client.v2.tweet(tweet);
      this.trackTweet();
      
      console.log('✅ Trading tip posted:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to post trading tip:', error);
      return false;
    }
  }

  async replyToMention(tweetId, replyText, userHandle) {
    console.log(`💬 Replying to mention from @${userHandle}`);
    
    if (!this.canTweet()) {
      console.log('⚠️ Reply rate limit reached');
      return false;
    }

    // Check if we already replied to this tweet
    if (this.hasRepliedToTweet(tweetId)) {
      console.log('⚠️ Already replied to this tweet');
      return false;
    }

    try {
      // Ensure reply fits Twitter's length limit
      const maxLength = BOT_CONFIG.TWEET_MAX_LENGTH - userHandle.length - 10;
      const truncatedReply = replyText.length > maxLength 
        ? replyText.substring(0, maxLength - 3) + '...'
        : replyText;

      const response = await this.client.v2.reply(
        truncatedReply,
        tweetId
      );

      this.trackTweet();
      this.markTweetAsReplied(tweetId);
      
      console.log('✅ Reply sent:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to reply to mention:', error);
      return false;
    }
  }

  async getMentions(sinceId = null) {
    console.log('🔍 Fetching mentions...');
    
    try {
      const query = `@${this.botHandle} -is:retweet`;
      const params = {
        'tweet.fields': ['author_id', 'created_at', 'conversation_id'],
        'user.fields': ['username'],
        expansions: ['author_id'],
        max_results: 100
      };

      if (sinceId) {
        params.since_id = sinceId;
      }

      const response = await this.readOnlyClient.v2.search(query, params);
      
      if (!response.data || response.data.length === 0) {
        console.log('📭 No new mentions found');
        return [];
      }

      const mentions = response.data.map(tweet => {
        const author = response.includes?.users?.find(user => user.id === tweet.author_id);
        return {
          id: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id,
          authorUsername: author?.username || 'unknown',
          createdAt: tweet.created_at,
          conversationId: tweet.conversation_id
        };
      });

      console.log(`📬 Found ${mentions.length} new mentions`);
      return mentions;
    } catch (error) {
      console.error('❌ Failed to fetch mentions:', error);
      return [];
    }
  }

  async getLastMentionId() {
    const lastId = getCachedData('last_mention_id');
    return lastId;
  }

  async setLastMentionId(mentionId) {
    setCachedData('last_mention_id', mentionId, 60 * 24); // Cache for 24 hours
  }

  canTweet() {
    this.resetTweetCountIfNeeded();
    return this.tweetCount.hourly < BOT_CONFIG.MAX_TWEETS_PER_HOUR;
  }

  trackTweet() {
    this.resetTweetCountIfNeeded();
    this.tweetCount.hourly++;
    console.log(`📊 Tweets this hour: ${this.tweetCount.hourly}/${BOT_CONFIG.MAX_TWEETS_PER_HOUR}`);
  }

  resetTweetCountIfNeeded() {
    const now = new Date();
    const hoursSinceReset = (now - this.tweetCount.lastReset) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 1) {
      this.tweetCount.hourly = 0;
      this.tweetCount.lastReset = now;
      console.log('🔄 Tweet counter reset');
    }
  }

  hasRepliedToTweet(tweetId) {
    const repliedTweets = getCachedData('replied_tweets') || [];
    return repliedTweets.includes(tweetId);
  }

  markTweetAsReplied(tweetId) {
    const repliedTweets = getCachedData('replied_tweets') || [];
    repliedTweets.push(tweetId);
    
    // Keep only last 1000 replied tweets
    if (repliedTweets.length > 1000) {
      repliedTweets.splice(0, repliedTweets.length - 1000);
    }
    
    setCachedData('replied_tweets', repliedTweets, 60 * 24 * 7); // Cache for 1 week
  }

  async validateConnection() {
    try {
      const me = await this.client.v2.me();
      console.log(`✅ Twitter connection validated for @${me.data.username}`);
      return true;
    } catch (error) {
      console.error('❌ Twitter connection failed:', error);
      return false;
    }
  }

  getStats() {
    this.resetTweetCountIfNeeded();
    return {
      tweetsThisHour: this.tweetCount.hourly,
      maxTweetsPerHour: BOT_CONFIG.MAX_TWEETS_PER_HOUR,
      canTweet: this.canTweet(),
      lastReset: this.tweetCount.lastReset
    };
  }
}

export default TwitterService;