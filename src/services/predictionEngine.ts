import { TechnicalAnalysisService, TechnicalIndicators } from './technicalAnalysis';
import { SentimentAnalyzer, SentimentData } from './sentimentAnalyzer';

export interface PredictionResult {
  symbol: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  timeframe: string;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedReturn: number;
  stopLoss: number;
  takeProfit: number;
}

export interface MarketConditions {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  volatility: number;
  volume: number;
  marketCap: number;
}

export class PredictionEngine {
  private static instance: PredictionEngine;
  private technicalAnalysis: TechnicalAnalysisService;
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.technicalAnalysis = TechnicalAnalysisService.getInstance();
    this.sentimentAnalyzer = SentimentAnalyzer.getInstance();
  }

  static getInstance(): PredictionEngine {
    if (!PredictionEngine.instance) {
      PredictionEngine.instance = new PredictionEngine();
    }
    return PredictionEngine.instance;
  }

  async generatePrediction(
    symbol: string,
    currentPrice: number,
    priceHistory: number[],
    marketConditions: MarketConditions
  ): Promise<PredictionResult> {
    try {
      // Get technical indicators
      const indicators = this.calculateTechnicalIndicators(priceHistory);
      
      // Get sentiment data
      const sentimentData = await this.sentimentAnalyzer.analyzeSentiment(symbol);
      
      // Analyze technical signals
      const technicalSignals = this.technicalAnalysis.analyzeIndicators(indicators);
      const technicalOverall = this.technicalAnalysis.getOverallSignal(technicalSignals);
      
      // Calculate prediction scores
      const technicalScore = this.getTechnicalScore(technicalOverall);
      const sentimentScore = this.getSentimentScore(sentimentData);
      const marketScore = this.getMarketScore(marketConditions);
      
      // Weighted prediction
      const weights = { technical: 0.5, sentiment: 0.3, market: 0.2 };
      const overallScore = (
        technicalScore * weights.technical +
        sentimentScore * weights.sentiment +
        marketScore * weights.market
      );
      
      // Generate prediction
      const prediction = this.determinePrediction(overallScore);
      const confidence = this.calculateConfidence(technicalOverall.confidence, sentimentData, marketConditions);
      
      // Calculate price targets
      const { targetPrice, stopLoss, takeProfit } = this.calculatePriceTargets(
        currentPrice,
        prediction,
        indicators,
        marketConditions.volatility
      );
      
      // Generate reasoning
      const reasoning = this.generateReasoning(
        technicalSignals,
        sentimentData,
        marketConditions,
        prediction
      );
      
      return {
        symbol,
        prediction,
        confidence,
        targetPrice,
        timeframe: this.determineTimeframe(marketConditions.volatility),
        reasoning,
        riskLevel: this.assessRiskLevel(confidence, marketConditions.volatility),
        expectedReturn: this.calculateExpectedReturn(currentPrice, targetPrice),
        stopLoss,
        takeProfit
      };
    } catch (error) {
      console.error('Error generating prediction:', error);
      return this.getDefaultPrediction(symbol, currentPrice);
    }
  }

  private calculateTechnicalIndicators(priceHistory: number[]): TechnicalIndicators {
    const rsi = this.technicalAnalysis.calculateRSI(priceHistory);
    const macd = this.technicalAnalysis.calculateMACD(priceHistory);
    const bollingerBands = this.technicalAnalysis.calculateBollingerBands(priceHistory);
    
    return {
      rsi,
      macd,
      bollingerBands,
      movingAverages: {
        sma20: this.technicalAnalysis.calculateSMA(priceHistory, 20),
        sma50: this.technicalAnalysis.calculateSMA(priceHistory, 50),
        sma200: this.technicalAnalysis.calculateSMA(priceHistory, 200),
        ema12: this.technicalAnalysis.calculateEMA(priceHistory, 12),
        ema26: this.technicalAnalysis.calculateEMA(priceHistory, 26)
      },
      stochastic: this.technicalAnalysis.calculateStochastic(priceHistory, priceHistory, priceHistory),
      volume: {
        current: 1000000,
        average: 800000,
        ratio: 1.25
      }
    };
  }

  private getTechnicalScore(technicalOverall: { signal: string; confidence: number }): number {
    const baseScore = technicalOverall.signal === 'BUY' ? 1 : 
                     technicalOverall.signal === 'SELL' ? -1 : 0;
    return baseScore * technicalOverall.confidence;
  }

  private getSentimentScore(sentimentData: SentimentData): number {
    return sentimentData.overall;
  }

  private getMarketScore(marketConditions: MarketConditions): number {
    let score = 0;
    
    if (marketConditions.trend === 'BULLISH') score += 0.5;
    else if (marketConditions.trend === 'BEARISH') score -= 0.5;
    
    // Lower volatility is generally better for predictions
    score += (1 - marketConditions.volatility) * 0.3;
    
    // Higher volume indicates stronger moves
    score += Math.min(marketConditions.volume / 1000000, 1) * 0.2;
    
    return Math.max(-1, Math.min(1, score));
  }

  private determinePrediction(score: number): 'BUY' | 'SELL' | 'HOLD' {
    if (score > 0.3) return 'BUY';
    if (score < -0.3) return 'SELL';
    return 'HOLD';
  }

  private calculateConfidence(
    technicalConfidence: number,
    sentimentData: SentimentData,
    marketConditions: MarketConditions
  ): number {
    const sentimentConfidence = Math.abs(sentimentData.overall);
    const marketConfidence = 1 - marketConditions.volatility;
    
    return (technicalConfidence + sentimentConfidence + marketConfidence) / 3;
  }

  private calculatePriceTargets(
    currentPrice: number,
    prediction: string,
    indicators: TechnicalIndicators,
    volatility: number
  ): { targetPrice: number; stopLoss: number; takeProfit: number } {
    const volatilityMultiplier = 1 + volatility;
    
    let targetPrice = currentPrice;
    let stopLoss = currentPrice;
    let takeProfit = currentPrice;
    
    if (prediction === 'BUY') {
      targetPrice = indicators.bollingerBands.upper * volatilityMultiplier;
      stopLoss = currentPrice * 0.95; // 5% stop loss
      takeProfit = currentPrice * 1.15; // 15% take profit
    } else if (prediction === 'SELL') {
      targetPrice = indicators.bollingerBands.lower / volatilityMultiplier;
      stopLoss = currentPrice * 1.05; // 5% stop loss for short
      takeProfit = currentPrice * 0.85; // 15% take profit for short
    }
    
    return { targetPrice, stopLoss, takeProfit };
  }

  private generateReasoning(
    technicalSignals: any[],
    sentimentData: SentimentData,
    marketConditions: MarketConditions,
    prediction: string
  ): string[] {
    const reasoning: string[] = [];
    
    // Technical reasoning
    technicalSignals.forEach(signal => {
      reasoning.push(`${signal.indicator}: ${signal.description}`);
    });
    
    // Sentiment reasoning
    const sentimentLabel = this.sentimentAnalyzer.getSentimentLabel(sentimentData.overall);
    reasoning.push(`Market sentiment is ${sentimentLabel.toLowerCase()} (${(sentimentData.overall * 100).toFixed(1)}%)`);
    
    // Market conditions reasoning
    reasoning.push(`Market trend is ${marketConditions.trend.toLowerCase()}`);
    reasoning.push(`Volatility is ${marketConditions.volatility > 0.5 ? 'high' : 'moderate'}`);
    
    // Volume reasoning
    if (marketConditions.volume > 1000000) {
      reasoning.push('High trading volume supports the move');
    }
    
    return reasoning;
  }

  private determineTimeframe(volatility: number): string {
    if (volatility > 0.7) return '1-3 days';
    if (volatility > 0.4) return '3-7 days';
    return '1-2 weeks';
  }

  private assessRiskLevel(confidence: number, volatility: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    const riskScore = (1 - confidence) + volatility;
    
    if (riskScore < 0.4) return 'LOW';
    if (riskScore < 0.7) return 'MEDIUM';
    return 'HIGH';
  }

  private calculateExpectedReturn(currentPrice: number, targetPrice: number): number {
    return ((targetPrice - currentPrice) / currentPrice) * 100;
  }

  private getDefaultPrediction(symbol: string, currentPrice: number): PredictionResult {
    return {
      symbol,
      prediction: 'HOLD',
      confidence: 0.5,
      targetPrice: currentPrice,
      timeframe: '1 week',
      reasoning: ['Insufficient data for accurate prediction'],
      riskLevel: 'MEDIUM',
      expectedReturn: 0,
      stopLoss: currentPrice * 0.95,
      takeProfit: currentPrice * 1.05
    };
  }
}