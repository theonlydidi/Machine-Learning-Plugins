import axios from 'axios';

export class WebScraperService {
  private static instance: WebScraperService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): WebScraperService {
    if (!WebScraperService.instance) {
      WebScraperService.instance = new WebScraperService();
    }
    return WebScraperService.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() - cached.timestamp < this.CACHE_DURATION : false;
  }

  async scrapeNewsData(symbol: string): Promise<any[]> {
    const cacheKey = `news_${symbol}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      // Using NewsAPI for crypto news
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: `${symbol} cryptocurrency`,
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: 'demo' // In production, use environment variable
        }
      });

      const newsData = response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description)
      }));

      this.cache.set(cacheKey, { data: newsData, timestamp: Date.now() });
      return newsData;
    } catch (error) {
      console.error('Error scraping news:', error);
      // Return mock data for demo
      return this.getMockNewsData(symbol);
    }
  }

  async scrapeSocialMedia(symbol: string): Promise<any> {
    const cacheKey = `social_${symbol}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      // Mock social media data (in production, integrate with Twitter API, Reddit API)
      const socialData = {
        twitter: {
          mentions: Math.floor(Math.random() * 10000) + 1000,
          sentiment: (Math.random() - 0.5) * 2,
          trending: Math.random() > 0.7,
          influencerMentions: Math.floor(Math.random() * 50)
        },
        reddit: {
          posts: Math.floor(Math.random() * 500) + 100,
          upvotes: Math.floor(Math.random() * 5000) + 500,
          sentiment: (Math.random() - 0.5) * 2,
          hotPosts: Math.floor(Math.random() * 10)
        },
        telegram: {
          channels: Math.floor(Math.random() * 20) + 5,
          messages: Math.floor(Math.random() * 1000) + 200,
          sentiment: (Math.random() - 0.5) * 2
        }
      };

      this.cache.set(cacheKey, { data: socialData, timestamp: Date.now() });
      return socialData;
    } catch (error) {
      console.error('Error scraping social media:', error);
      return null;
    }
  }

  private analyzeSentiment(text: string): number {
    const positiveWords = ['bullish', 'moon', 'pump', 'buy', 'hodl', 'gains', 'profit', 'surge', 'rally'];
    const negativeWords = ['bearish', 'dump', 'crash', 'sell', 'loss', 'drop', 'fall', 'decline'];
    
    const words = text.toLowerCase().split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length * 10));
  }

  private getMockNewsData(symbol: string): any[] {
    return [
      {
        title: `${symbol} Shows Strong Technical Indicators`,
        description: `Technical analysis suggests ${symbol} is showing bullish patterns`,
        url: '#',
        publishedAt: new Date().toISOString(),
        source: 'CryptoNews',
        sentiment: 0.7
      },
      {
        title: `Market Analysis: ${symbol} Price Prediction`,
        description: `Analysts predict potential growth for ${symbol} in the coming weeks`,
        url: '#',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'CoinDesk',
        sentiment: 0.5
      }
    ];
  }
}