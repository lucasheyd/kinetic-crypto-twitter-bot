// api/services/crestal.js - Crestal Network Integration
import { CRESTAL_CONFIG, ERROR_MESSAGES } from '../../lib/constants.js';
import { getCachedData, setCachedData } from '../utils/cache.js';

let capUsage = {
  daily: 0,
  hourly: 0,
  lastReset: new Date()
};

export class CrestaAI {
  constructor() {
    this.apiKey = process.env.CRESTAL_API_KEY;
    this.baseUrl = process.env.CRESTAL_API_URL || 'https://open.service.crestal.network';
    this.emergencyMode = false;
  }

  async generateMarketAnalysis() {
    console.log('🔍 Generating market analysis...');
    
    // Check cache first
    const cached = getCachedData('market_analysis');
    if (cached && !this.shouldRefreshMarketData()) {
      console.log('📦 Using cached market analysis');
      return cached;
    }

    const prompt = `Analyze the current crypto market. Focus on BTC, ETH, and top altcoins. Include key price levels, market sentiment, and any significant movements. What should traders watch today?`;
    
    const analysis = await this.callCresta(prompt, CRESTAL_CONFIG.SYSTEM_PROMPTS.MARKET_ANALYSIS);
    
    if (analysis) {
      setCachedData('market_analysis', analysis, 30); // Cache for 30 minutes
    }
    
    return analysis;
  }

  async generateDegenAlert() {
    console.log('🚨 Generating degen alert...');
    
    const prompt = `Check for trending meme coins and tokens with unusual activity. Look for new listings, volume spikes, or social media buzz. What degen plays are happening right now?`;
    
    return await this.callCresta(prompt, CRESTAL_CONFIG.SYSTEM_PROMPTS.DEGEN_ALERT);
  }

  async generateDeFiUpdate() {
    console.log('🏛️ Generating DeFi update...');
    
    const cached = getCachedData('defi_update');
    if (cached) {
      console.log('📦 Using cached DeFi data');
      return cached;
    }

    const prompt = `Analyze current DeFi landscape. Check TVL changes, new yield opportunities, protocol updates, and any significant developments. What should DeFi users know today?`;
    
    const update = await this.callCresta(prompt, CRESTAL_CONFIG.SYSTEM_PROMPTS.DEFI_UPDATE);
    
    if (update) {
      setCachedData('defi_update', update, 45); // Cache for 45 minutes
    }
    
    return update;
  }

  async generateTradingTip() {
    console.log('💡 Generating trading tip...');
    
    const prompt = `Provide a practical cryptocurrency trading tip. Focus on risk management, entry/exit strategies, or market psychology. Make it actionable for traders.`;
    
    return await this.callCresta(prompt, CRESTAL_CONFIG.SYSTEM_PROMPTS.TRADING_TIPS);
  }

  async analyzeUserQuery(query, userHandle = null) {
    console.log('🎯 Analyzing user query:', query);
    
    // Rate limiting per user
    if (userHandle && this.isUserRateLimited(userHandle)) {
      return ERROR_MESSAGES.RATE_LIMITED;
    }

    const prompt = `User asked: "${query}". Provide helpful crypto analysis or information. If it's about a specific token, include price action and key levels if possible.`;
    
    const response = await this.callCresta(prompt, CRESTAL_CONFIG.SYSTEM_PROMPTS.USER_REPLY);
    
    if (userHandle) {
      this.trackUserInteraction(userHandle);
    }
    
    return response;
  }

  async callCresta(prompt, systemPrompt) {
    if (!this.apiKey || this.apiKey === 'your_crestal_api_key_here') {
      console.log('❌ No valid Crestal API key');
      return ERROR_MESSAGES.CRESTAL_DOWN;
    }

    // Check if we're in emergency mode
    if (this.emergencyMode) {
      console.log('🚨 Emergency mode - using fallback');
      return ERROR_MESSAGES.EMERGENCY_MODE;
    }

    // Check CAP limits
    if (!this.canMakeAPICall()) {
      console.log('⚠️ CAP limit reached, entering emergency mode');
      this.emergencyMode = true;
      return ERROR_MESSAGES.EMERGENCY_MODE;
    }

    try {
      console.log('📡 Calling Crestal API...');
      this.trackCAPUsage();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CRESTAL_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CRESTAL_CONFIG.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: CRESTAL_CONFIG.MAX_TOKENS,
          temperature: CRESTAL_CONFIG.TEMPERATURE
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('❌ Crestal API error:', response.status, response.statusText);
        
        if (response.status === 429) {
          this.emergencyMode = true;
          return ERROR_MESSAGES.RATE_LIMITED;
        }
        
        return ERROR_MESSAGES.CRESTAL_DOWN;
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      
      console.log('✅ Crestal responded successfully');
      return result;

    } catch (error) {
      console.error('❌ Crestal API call failed:', error.message);
      
      if (error.name === 'AbortError') {
        return ERROR_MESSAGES.TIMEOUT;
      }
      
      return ERROR_MESSAGES.CRESTAL_DOWN;
    }
  }

  canMakeAPICall() {
    this.resetCountersIfNeeded();
    return capUsage.daily < CRESTAL_CONFIG.MAX_CAPS_PER_CYCLE * 4; // 4 cycles per day
  }

  trackCAPUsage() {
    this.resetCountersIfNeeded();
    capUsage.daily++;
    capUsage.hourly++;
  }

  resetCountersIfNeeded() {
    const now = new Date();
    const hoursSinceReset = (now - capUsage.lastReset) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 24) {
      capUsage.daily = 0;
      capUsage.lastReset = now;
      this.emergencyMode = false; // Reset emergency mode daily
    }
    
    if (hoursSinceReset >= 1) {
      capUsage.hourly = 0;
    }
  }

  shouldRefreshMarketData() {
    // Refresh market data more frequently during active trading hours (UTC)
    const hour = new Date().getUTCHours();
    const isActiveHours = (hour >= 13 && hour <= 21); // US market hours roughly
    
    return isActiveHours;
  }

  isUserRateLimited(userHandle) {
    const userInteractions = getCachedData(`user_${userHandle}`) || [];
    const recentInteractions = userInteractions.filter(
      time => Date.now() - time < CRESTAL_CONFIG.REPLY_COOLDOWN_MINUTES * 60 * 1000
    );
    
    return recentInteractions.length >= 3; // Max 3 interactions per cooldown period
  }

  trackUserInteraction(userHandle) {
    const userInteractions = getCachedData(`user_${userHandle}`) || [];
    userInteractions.push(Date.now());
    
    // Keep only last 10 interactions
    if (userInteractions.length > 10) {
      userInteractions.shift();
    }
    
    setCachedData(`user_${userHandle}`, userInteractions, 60); // Cache for 1 hour
  }

  getUsageStats() {
    this.resetCountersIfNeeded();
    return {
      daily: capUsage.daily,
      hourly: capUsage.hourly,
      emergencyMode: this.emergencyMode,
      lastReset: capUsage.lastReset
    };
  }
}

export default CrestaAI;