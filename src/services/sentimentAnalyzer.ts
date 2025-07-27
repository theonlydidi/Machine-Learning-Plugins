import { SentimentData } from '../types/trading';
import { WebScraperService } from './webScraper';

export class SentimentAnalyzer {
  private static instance: SentimentAnalyzer;
  private webScraper: WebScraperService;

  constructor() {
    this.webScraper = WebScraperService.getInstance();
  }

  static getInstance(): SentimentAnalyzer {
    if (!SentimentAnalyzer.instance) {
      SentimentAnalyzer.instance = new SentimentAnalyzer();
    }
    return SentimentAnalyzer.instance;
  }

  async analyzeSentiment(symbol: string): Promise<SentimentData> {
    try {
      const [twitter, reddit, telegram, news] = await Promise.all([
        this.webScraper.scrapeTwitterSentiment(symbol),
        this.webScraper.scrapeRedditSentiment(symbol),
        this.webScraper.scrapeTelegramChannels(symbol),
        this.webScraper.scrapeCoinMarketCapNews(symbol)
      ]);

      const twitterSentiment = twitter?.sentiment || 0;
      const redditSentiment = reddit?.sentiment || 0;
      const telegramSentiment = telegram?.overallSentiment || 0;
      const newsSentiment = this.calculateNewsSentiment(news);

      const overall = (twitterSentiment * 0.3 + redditSentiment * 0.25 + 
                      telegramSentiment * 0.2 + newsSentiment * 0.25);

      const keywords = this.extractKeywords([
        ...(twitter?.topTweets?.map((t: any) => t.text) || []),
        ...(reddit?.posts?.map((p: any) => p.title) || []),
        ...(news?.map((n: any) => n.title) || [])
      ]);

      const mentions = (twitter?.volume || 0) + (reddit?.mentions || 0);

      return {
        overall: Math.max(-1, Math.min(1, overall)),
        sources: {
          twitter: twitterSentiment,
          reddit: redditSentiment,
          news: newsSentiment,
          telegram: telegramSentiment
        },
        keywords,
        mentions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        overall: 0,
        sources: { twitter: 0, reddit: 0, news: 0, telegram: 0 },
        keywords: [],
        mentions: 0,
        timestamp: new Date()
      };
    }
  }

  private calculateNewsSentiment(news: any[]): number {
    if (!news || news.length === 0) return 0;
    
    const totalScore = news.reduce((sum, article) => sum + (article.score || 0), 0);
    return totalScore / news.length;
  }

  private extractKeywords(texts: string[]): string[] {
    const keywords = new Set<string>();
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    texts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
      
      words.forEach(word => keywords.add(word));
    });

    return Array.from(keywords).slice(0, 10);
  }

  getSentimentLabel(score: number): string {
    if (score > 0.5) return 'Very Bullish';
    if (score > 0.2) return 'Bullish';
    if (score > -0.2) return 'Neutral';
    if (score > -0.5) return 'Bearish';
    return 'Very Bearish';
  }

  getSentimentColor(score: number): string {
    if (score > 0.5) return '#10B981';
    if (score > 0.2) return '#34D399';
    if (score > -0.2) return '#6B7280';
    if (score > -0.5) return '#F87171';
    return '#EF4444';
  }
}