import { WebScraperService } from './webScraper';

export interface SentimentData {
  symbol: string;
  overall: number;
  sources: {
    news: number;
    twitter: number;
    reddit: number;
    telegram: number;
  };
  volume: {
    news: number;
    social: number;
  };
  trending: boolean;
  keywords: string[];
  timestamp: Date;
}

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
      const [newsData, socialData] = await Promise.all([
        this.webScraper.scrapeNewsData(symbol),
        this.webScraper.scrapeSocialMedia(symbol)
      ]);

      const newsSentiment = this.calculateNewsSentiment(newsData);
      const socialSentiment = socialData ? {
        twitter: socialData.twitter.sentiment,
        reddit: socialData.reddit.sentiment,
        telegram: socialData.telegram.sentiment
      } : { twitter: 0, reddit: 0, telegram: 0 };

      const overall = this.calculateOverallSentiment(newsSentiment, socialSentiment);
      const keywords = this.extractKeywords(newsData);

      return {
        symbol,
        overall,
        sources: {
          news: newsSentiment,
          twitter: socialSentiment.twitter,
          reddit: socialSentiment.reddit,
          telegram: socialSentiment.telegram
        },
        volume: {
          news: newsData.length,
          social: socialData ? 
            socialData.twitter.mentions + socialData.reddit.posts + socialData.telegram.messages : 0
        },
        trending: socialData ? socialData.twitter.trending : false,
        keywords,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.getDefaultSentiment(symbol);
    }
  }

  private calculateNewsSentiment(newsData: any[]): number {
    if (!newsData.length) return 0;
    
    const totalSentiment = newsData.reduce((sum, article) => sum + article.sentiment, 0);
    return totalSentiment / newsData.length;
  }

  private calculateOverallSentiment(newsSentiment: number, socialSentiment: any): number {
    const weights = {
      news: 0.4,
      twitter: 0.3,
      reddit: 0.2,
      telegram: 0.1
    };

    return (
      newsSentiment * weights.news +
      socialSentiment.twitter * weights.twitter +
      socialSentiment.reddit * weights.reddit +
      socialSentiment.telegram * weights.telegram
    );
  }

  private extractKeywords(newsData: any[]): string[] {
    const allText = newsData.map(article => 
      `${article.title} ${article.description}`
    ).join(' ').toLowerCase();

    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = allText.split(/\s+/).filter(word => 
      word.length > 3 && !commonWords.includes(word)
    );

    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private getDefaultSentiment(symbol: string): SentimentData {
    return {
      symbol,
      overall: 0,
      sources: { news: 0, twitter: 0, reddit: 0, telegram: 0 },
      volume: { news: 0, social: 0 },
      trending: false,
      keywords: [],
      timestamp: new Date()
    };
  }

  getSentimentLabel(score: number): string {
    if (score > 0.6) return 'Very Bullish';
    if (score > 0.2) return 'Bullish';
    if (score > -0.2) return 'Neutral';
    if (score > -0.6) return 'Bearish';
    return 'Very Bearish';
  }

  getSentimentColor(score: number): string {
    if (score > 0.6) return '#10b981';
    if (score > 0.2) return '#84cc16';
    if (score > -0.2) return '#6b7280';
    if (score > -0.6) return '#f59e0b';
    return '#ef4444';
  }
}