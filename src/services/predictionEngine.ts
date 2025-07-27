import { PredictionModel, TechnicalIndicators, SentimentData, PricePoint } from '../types/trading';

export class PredictionEngine {
  private static instance: PredictionEngine;
  private models = new Map<string, PredictionModel>();

  static getInstance(): PredictionEngine {
    if (!PredictionEngine.instance) {
      PredictionEngine.instance = new PredictionEngine();
    }
    return PredictionEngine.instance;
  }

  async generatePrediction(
    symbol: string,
    currentPrice: number,
    technicalIndicators: TechnicalIndicators,
    sentimentData: SentimentData,
    priceHistory: PricePoint[]
  ): Promise<PredictionModel> {
    const factors: string[] = [];
    let confidence = 0.5;

    // Technical analysis weight (40%)
    const technicalScore = this.analyzeTechnicalFactors(technicalIndicators, factors);
    
    // Sentiment analysis weight (30%)
    const sentimentScore = this.analyzeSentimentFactors(sentimentData, factors);
    
    // Price action weight (20%)
    const priceActionScore = this.analyzePriceAction(priceHistory, factors);
    
    // Market structure weight (10%)
    const marketStructureScore = this.analyzeMarketStructure(currentPrice, priceHistory, factors);

    const overallScore = (technicalScore * 0.4) + (sentimentScore * 0.3) + 
                        (priceActionScore * 0.2) + (marketStructureScore * 0.1);

    confidence = Math.min(0.95, Math.max(0.1, Math.abs(overallScore)));

    const predictions = this.calculatePricePredictions(currentPrice, overallScore, confidence);

    const model: PredictionModel = {
      symbol,
      predictions,
      confidence,
      factors,
      lastUpdated: new Date()
    };

    this.models.set(symbol, model);
    return model;
  }

  private analyzeTechnicalFactors(indicators: TechnicalIndicators, factors: string[]): number {
    let score = 0;
    let count = 0;

    // RSI analysis
    if (indicators.rsi < 30) {
      score += 0.7;
      factors.push('RSI oversold - bullish signal');
    } else if (indicators.rsi > 70) {
      score -= 0.7;
      factors.push('RSI overbought - bearish signal');
    } else {
      score += (50 - Math.abs(indicators.rsi - 50)) / 50 * 0.3;
    }
    count++;

    // MACD analysis
    if (indicators.macd > 0) {
      score += 0.5;
      factors.push('MACD positive - bullish momentum');
    } else {
      score -= 0.5;
      factors.push('MACD negative - bearish momentum');
    }
    count++;

    // Moving averages
    if (indicators.movingAverages.ema12 > indicators.movingAverages.ema26) {
      score += 0.4;
      factors.push('EMA12 > EMA26 - short-term bullish');
    } else {
      score -= 0.4;
      factors.push('EMA12 < EMA26 - short-term bearish');
    }
    count++;

    // Volatility analysis
    if (indicators.volatility > 0.5) {
      factors.push('High volatility - increased risk');
      score *= 0.8; // Reduce confidence in high volatility
    } else if (indicators.volatility < 0.2) {
      factors.push('Low volatility - stable conditions');
      score *= 1.1; // Increase confidence in stable conditions
    }

    return count > 0 ? score / count : 0;
  }

  private analyzeSentimentFactors(sentimentData: SentimentData, factors: string[]): number {
    const sentiment = sentimentData.overall;
    
    if (sentiment > 0.5) {
      factors.push('Very positive social sentiment');
      return 0.8;
    } else if (sentiment > 0.2) {
      factors.push('Positive social sentiment');
      return 0.5;
    } else if (sentiment < -0.5) {
      factors.push('Very negative social sentiment');
      return -0.8;
    } else if (sentiment < -0.2) {
      factors.push('Negative social sentiment');
      return -0.5;
    } else {
      factors.push('Neutral social sentiment');
      return 0;
    }
  }

  private analyzePriceAction(priceHistory: PricePoint[], factors: string[]): number {
    if (priceHistory.length < 7) return 0;

    const recent = priceHistory.slice(-7);
    const older = priceHistory.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, p) => sum + p.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.price, 0) / older.length;
    
    const trend = (recentAvg - olderAvg) / olderAvg;
    
    if (trend > 0.05) {
      factors.push('Strong upward price trend');
      return 0.6;
    } else if (trend > 0.02) {
      factors.push('Moderate upward price trend');
      return 0.3;
    } else if (trend < -0.05) {
      factors.push('Strong downward price trend');
      return -0.6;
    } else if (trend < -0.02) {
      factors.push('Moderate downward price trend');
      return -0.3;
    } else {
      factors.push('Sideways price action');
      return 0;
    }
  }

  private analyzeMarketStructure(currentPrice: number, priceHistory: PricePoint[], factors: string[]): number {
    if (priceHistory.length < 20) return 0;

    const prices = priceHistory.map(p => p.price);
    const high20 = Math.max(...prices.slice(-20));
    const low20 = Math.min(...prices.slice(-20));
    
    const position = (currentPrice - low20) / (high20 - low20);
    
    if (position > 0.8) {
      factors.push('Price near 20-day high - resistance level');
      return -0.2;
    } else if (position < 0.2) {
      factors.push('Price near 20-day low - support level');
      return 0.2;
    } else {
      factors.push('Price in middle range');
      return 0;
    }
  }

  private calculatePricePredictions(currentPrice: number, score: number, confidence: number) {
    const baseMultiplier = score * confidence;
    
    return {
      '1h': currentPrice * (1 + baseMultiplier * 0.01),
      '4h': currentPrice * (1 + baseMultiplier * 0.03),
      '24h': currentPrice * (1 + baseMultiplier * 0.08),
      '7d': currentPrice * (1 + baseMultiplier * 0.15)
    };
  }

  getPrediction(symbol: string): PredictionModel | null {
    return this.models.get(symbol) || null;
  }

  getAllPredictions(): PredictionModel[] {
    return Array.from(this.models.values());
  }
}