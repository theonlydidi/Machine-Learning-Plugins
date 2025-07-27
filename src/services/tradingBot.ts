import { TradingSignal, TradeExecution, Portfolio, TechnicalIndicators, SentimentData } from '../types/trading';
import { TechnicalAnalysisService } from './technicalAnalysis';
import { SentimentAnalyzer } from './sentimentAnalyzer';
import { PredictionEngine } from './predictionEngine';
import { v4 as uuidv4 } from 'uuid';

export class TradingBot {
  private static instance: TradingBot;
  private technicalAnalysis: TechnicalAnalysisService;
  private sentimentAnalyzer: SentimentAnalyzer;
  private predictionEngine: PredictionEngine;
  private portfolio: Portfolio;
  private isActive: boolean = false;
  private signals: TradingSignal[] = [];

  constructor() {
    this.technicalAnalysis = TechnicalAnalysisService.getInstance();
    this.sentimentAnalyzer = SentimentAnalyzer.getInstance();
    this.predictionEngine = PredictionEngine.getInstance();
    this.portfolio = this.initializePortfolio();
  }

  static getInstance(): TradingBot {
    if (!TradingBot.instance) {
      TradingBot.instance = new TradingBot();
    }
    return TradingBot.instance;
  }

  private initializePortfolio(): Portfolio {
    return {
      totalValue: 10000, // Starting with $10,000 demo money
      assets: {
        'USDT': {
          amount: 10000,
          avgPrice: 1,
          currentPrice: 1,
          pnl: 0,
          pnlPercentage: 0
        }
      },
      trades: [],
      performance: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      }
    };
  }

  async generateTradingSignal(
    symbol: string,
    currentPrice: number,
    priceHistory: any[],
    marketData: any
  ): Promise<TradingSignal> {
    try {
      // Get technical indicators
      const technicalIndicators = this.technicalAnalysis.calculateTechnicalIndicators(priceHistory);
      
      // Get sentiment data
      const sentimentData = await this.sentimentAnalyzer.analyzeSentiment(symbol);
      
      // Generate prediction
      const prediction = await this.predictionEngine.generatePrediction(
        symbol,
        currentPrice,
        technicalIndicators,
        sentimentData,
        priceHistory
      );

      // Determine trading action
      const action = this.determineAction(technicalIndicators, sentimentData, prediction);
      const confidence = this.calculateConfidence(technicalIndicators, sentimentData, prediction);
      const reasoning = this.generateReasoning(technicalIndicators, sentimentData, prediction, action);

      const signal: TradingSignal = {
        id: uuidv4(),
        symbol,
        action,
        confidence,
        price: currentPrice,
        targetPrice: prediction.predictions['24h'],
        stopLoss: this.calculateStopLoss(currentPrice, action),
        reasoning,
        timestamp: new Date(),
        technicalIndicators,
        sentimentScore: sentimentData.overall,
        riskLevel: this.assessRiskLevel(technicalIndicators, sentimentData)
      };

      this.signals.unshift(signal);
      if (this.signals.length > 50) this.signals.pop();

      return signal;
    } catch (error) {
      console.error('Error generating trading signal:', error);
      throw error;
    }
  }

  private determineAction(
    technical: TechnicalIndicators,
    sentiment: SentimentData,
    prediction: any
  ): 'BUY' | 'SELL' | 'HOLD' | 'SWAP' {
    let score = 0;

    // Technical analysis (50% weight)
    if (technical.rsi < 30) score += 2;
    else if (technical.rsi > 70) score -= 2;
    
    if (technical.macd > 0) score += 1;
    else score -= 1;

    if (technical.movingAverages.ema12 > technical.movingAverages.ema26) score += 1;
    else score -= 1;

    // Sentiment analysis (30% weight)
    score += sentiment.overall * 2;

    // Prediction confidence (20% weight)
    const priceChange = (prediction.predictions['24h'] - prediction.predictions['1h']) / prediction.predictions['1h'];
    score += priceChange * prediction.confidence * 2;

    if (score > 2) return 'BUY';
    if (score < -2) return 'SELL';
    if (Math.abs(score) > 1) return 'SWAP';
    return 'HOLD';
  }

  private calculateConfidence(
    technical: TechnicalIndicators,
    sentiment: SentimentData,
    prediction: any
  ): number {
    let confidence = 0.5;

    // Technical indicators alignment
    const technicalSignals = [
      technical.rsi < 30 || technical.rsi > 70,
      Math.abs(technical.macd) > 0.1,
      Math.abs(technical.movingAverages.ema12 - technical.movingAverages.ema26) > 0.05
    ];
    
    const alignedSignals = technicalSignals.filter(Boolean).length;
    confidence += (alignedSignals / technicalSignals.length) * 0.3;

    // Sentiment strength
    confidence += Math.abs(sentiment.overall) * 0.2;

    // Prediction confidence
    confidence += prediction.confidence * 0.3;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private generateReasoning(
    technical: TechnicalIndicators,
    sentiment: SentimentData,
    prediction: any,
    action: string
  ): string[] {
    const reasoning: string[] = [];

    // Technical reasoning
    if (technical.rsi < 30) reasoning.push('RSI indicates oversold conditions');
    if (technical.rsi > 70) reasoning.push('RSI indicates overbought conditions');
    if (technical.macd > 0) reasoning.push('MACD shows bullish momentum');
    if (technical.macd < 0) reasoning.push('MACD shows bearish momentum');

    // Sentiment reasoning
    const sentimentLabel = this.sentimentAnalyzer.getSentimentLabel(sentiment.overall);
    reasoning.push(`Social sentiment is ${sentimentLabel.toLowerCase()}`);

    // Prediction reasoning
    reasoning.push(...prediction.factors);

    // Action-specific reasoning
    switch (action) {
      case 'BUY':
        reasoning.push('Multiple indicators suggest upward price movement');
        break;
      case 'SELL':
        reasoning.push('Multiple indicators suggest downward price movement');
        break;
      case 'SWAP':
        reasoning.push('Mixed signals suggest considering alternative assets');
        break;
      case 'HOLD':
        reasoning.push('Conflicting signals suggest maintaining current position');
        break;
    }

    return reasoning;
  }

  private calculateStopLoss(currentPrice: number, action: string): number {
    const stopLossPercentage = 0.05; // 5% stop loss
    
    if (action === 'BUY') {
      return currentPrice * (1 - stopLossPercentage);
    } else if (action === 'SELL') {
      return currentPrice * (1 + stopLossPercentage);
    }
    
    return currentPrice;
  }

  private assessRiskLevel(technical: TechnicalIndicators, sentiment: SentimentData): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Volatility risk
    if (technical.volatility > 0.5) riskScore += 2;
    else if (technical.volatility > 0.3) riskScore += 1;

    // Sentiment uncertainty
    if (Math.abs(sentiment.overall) < 0.2) riskScore += 1;

    // Technical divergence
    const rsiExtreme = technical.rsi < 20 || technical.rsi > 80;
    if (rsiExtreme) riskScore += 1;

    if (riskScore >= 3) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  async executeTrade(signal: TradingSignal, amount: number): Promise<TradeExecution> {
    // This is a simulation - in real implementation, this would connect to exchange APIs
    const trade: TradeExecution = {
      id: uuidv4(),
      type: 'MARKET',
      symbol: signal.symbol,
      side: signal.action === 'BUY' ? 'BUY' : 'SELL',
      amount,
      price: signal.price,
      status: 'FILLED',
      timestamp: new Date(),
      fees: amount * signal.price * 0.001 // 0.1% fee
    };

    this.portfolio.trades.unshift(trade);
    this.updatePortfolio(trade);

    return trade;
  }

  private updatePortfolio(trade: TradeExecution): void {
    const { symbol, side, amount, price } = trade;
    
    if (!this.portfolio.assets[symbol]) {
      this.portfolio.assets[symbol] = {
        amount: 0,
        avgPrice: 0,
        currentPrice: price || 0,
        pnl: 0,
        pnlPercentage: 0
      };
    }

    const asset = this.portfolio.assets[symbol];
    
    if (side === 'BUY') {
      const totalCost = (asset.amount * asset.avgPrice) + (amount * (price || 0));
      const totalAmount = asset.amount + amount;
      asset.avgPrice = totalAmount > 0 ? totalCost / totalAmount : 0;
      asset.amount = totalAmount;
    } else {
      asset.amount = Math.max(0, asset.amount - amount);
    }

    this.calculatePortfolioValue();
  }

  private calculatePortfolioValue(): void {
    let totalValue = 0;
    
    Object.entries(this.portfolio.assets).forEach(([symbol, asset]) => {
      const value = asset.amount * asset.currentPrice;
      totalValue += value;
      
      asset.pnl = (asset.currentPrice - asset.avgPrice) * asset.amount;
      asset.pnlPercentage = asset.avgPrice > 0 ? (asset.pnl / (asset.avgPrice * asset.amount)) * 100 : 0;
    });

    this.portfolio.totalValue = totalValue;
  }

  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  getRecentSignals(limit: number = 10): TradingSignal[] {
    return this.signals.slice(0, limit);
  }

  setActive(active: boolean): void {
    this.isActive = active;
  }

  isActiveTrading(): boolean {
    return this.isActive;
  }
}