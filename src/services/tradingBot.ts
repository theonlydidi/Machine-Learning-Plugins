import { PredictionEngine, PredictionResult } from './predictionEngine';
import { TradingSignal, TradeExecution, Portfolio } from '../types/trading';

export interface TradingStrategy {
  name: string;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  maxPositionSize: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  minConfidence: number;
}

export interface AutoTradingConfig {
  enabled: boolean;
  strategy: TradingStrategy;
  maxDailyTrades: number;
  maxPortfolioRisk: number;
  symbols: string[];
}

export class TradingBot {
  private static instance: TradingBot;
  private predictionEngine: PredictionEngine;
  private portfolio: Portfolio;
  private activePositions: Map<string, TradeExecution> = new Map();
  private tradeHistory: TradeExecution[] = [];
  private config: AutoTradingConfig;

  constructor() {
    this.predictionEngine = PredictionEngine.getInstance();
    this.portfolio = this.initializePortfolio();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): TradingBot {
    if (!TradingBot.instance) {
      TradingBot.instance = new TradingBot();
    }
    return TradingBot.instance;
  }

  async generateTradingSignals(symbols: string[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const symbol of symbols) {
      try {
        // Mock price data - in production, fetch from real API
        const currentPrice = Math.random() * 50000 + 10000;
        const priceHistory = this.generateMockPriceHistory(currentPrice);
        
        const marketConditions = {
          trend: Math.random() > 0.5 ? 'BULLISH' as const : 'BEARISH' as const,
          volatility: Math.random() * 0.8 + 0.1,
          volume: Math.random() * 2000000 + 500000,
          marketCap: Math.random() * 1000000000 + 100000000
        };

        const prediction = await this.predictionEngine.generatePrediction(
          symbol,
          currentPrice,
          priceHistory,
          marketConditions
        );

        if (prediction.confidence >= this.config.strategy.minConfidence) {
          const signal: TradingSignal = {
            symbol,
            action: prediction.prediction === 'HOLD' ? 'HOLD' : prediction.prediction,
            confidence: prediction.confidence,
            price: currentPrice,
            timestamp: new Date(),
            reasoning: prediction.reasoning,
            technicalIndicators: this.getMockTechnicalIndicators(),
            sentimentScore: Math.random() * 2 - 1,
            newsScore: Math.random() * 2 - 1,
            socialScore: Math.random() * 2 - 1
          };

          signals.push(signal);
        }
      } catch (error) {
        console.error(`Error generating signal for ${symbol}:`, error);
      }
    }

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  async executeAutoTrading(): Promise<TradeExecution[]> {
    if (!this.config.enabled) {
      return [];
    }

    const signals = await this.generateTradingSignals(this.config.symbols);
    const executions: TradeExecution[] = [];

    for (const signal of signals) {
      if (this.shouldExecuteTrade(signal)) {
        const execution = await this.executeTrade(signal);
        if (execution) {
          executions.push(execution);
        }
      }
    }

    return executions;
  }

  private shouldExecuteTrade(signal: TradingSignal): boolean {
    // Check daily trade limit
    const todayTrades = this.tradeHistory.filter(trade => 
      trade.timestamp.toDateString() === new Date().toDateString()
    ).length;

    if (todayTrades >= this.config.maxDailyTrades) {
      return false;
    }

    // Check if we already have a position
    if (this.activePositions.has(signal.symbol)) {
      return false;
    }

    // Check confidence threshold
    if (signal.confidence < this.config.strategy.minConfidence) {
      return false;
    }

    // Check portfolio risk
    const currentRisk = this.calculatePortfolioRisk();
    if (currentRisk >= this.config.maxPortfolioRisk) {
      return false;
    }

    return true;
  }

  private async executeTrade(signal: TradingSignal): Promise<TradeExecution | null> {
    try {
      const positionSize = this.calculatePositionSize(signal);
      
      if (positionSize <= 0) {
        return null;
      }

      const execution: TradeExecution = {
        id: this.generateTradeId(),
        symbol: signal.symbol,
        action: signal.action as 'BUY' | 'SELL',
        amount: positionSize,
        price: signal.price,
        timestamp: new Date(),
        status: 'EXECUTED', // In production, this would be 'PENDING' initially
        profit: 0
      };

      // Update portfolio
      this.updatePortfolio(execution);
      
      // Add to active positions
      this.activePositions.set(signal.symbol, execution);
      
      // Add to trade history
      this.tradeHistory.push(execution);

      console.log(`Executed ${execution.action} order for ${execution.symbol}:`, execution);
      
      return execution;
    } catch (error) {
      console.error('Error executing trade:', error);
      return null;
    }
  }

  private calculatePositionSize(signal: TradingSignal): number {
    const maxPositionValue = this.portfolio.totalValue * this.config.strategy.maxPositionSize;
    const positionSize = maxPositionValue / signal.price;
    
    // Adjust based on confidence and risk
    const confidenceMultiplier = signal.confidence;
    const riskMultiplier = this.getRiskMultiplier(signal);
    
    return positionSize * confidenceMultiplier * riskMultiplier;
  }

  private getRiskMultiplier(signal: TradingSignal): number {
    switch (this.config.strategy.riskTolerance) {
      case 'LOW': return 0.5;
      case 'MEDIUM': return 0.75;
      case 'HIGH': return 1.0;
      default: return 0.75;
    }
  }

  private updatePortfolio(execution: TradeExecution): void {
    const cost = execution.amount * execution.price;
    
    if (execution.action === 'BUY') {
      this.portfolio.cash -= cost;
      
      if (this.portfolio.positions[execution.symbol]) {
        const existing = this.portfolio.positions[execution.symbol];
        const totalAmount = existing.amount + execution.amount;
        const totalCost = (existing.amount * existing.averagePrice) + cost;
        
        this.portfolio.positions[execution.symbol] = {
          amount: totalAmount,
          averagePrice: totalCost / totalAmount,
          currentValue: totalAmount * execution.price,
          profit: 0
        };
      } else {
        this.portfolio.positions[execution.symbol] = {
          amount: execution.amount,
          averagePrice: execution.price,
          currentValue: cost,
          profit: 0
        };
      }
    } else if (execution.action === 'SELL') {
      this.portfolio.cash += cost;
      
      if (this.portfolio.positions[execution.symbol]) {
        const existing = this.portfolio.positions[execution.symbol];
        existing.amount -= execution.amount;
        
        if (existing.amount <= 0) {
          delete this.portfolio.positions[execution.symbol];
        }
      }
    }
    
    this.updatePortfolioValue();
  }

  private updatePortfolioValue(): void {
    let totalPositionValue = 0;
    
    Object.values(this.portfolio.positions).forEach(position => {
      totalPositionValue += position.currentValue;
    });
    
    this.portfolio.totalValue = this.portfolio.cash + totalPositionValue;
  }

  private calculatePortfolioRisk(): number {
    let totalRisk = 0;
    
    Object.values(this.portfolio.positions).forEach(position => {
      const positionRisk = (position.currentValue / this.portfolio.totalValue) * 0.1; // 10% risk per position
      totalRisk += positionRisk;
    });
    
    return totalRisk;
  }

  private generateMockPriceHistory(currentPrice: number): number[] {
    const history: number[] = [];
    let price = currentPrice;
    
    for (let i = 0; i < 100; i++) {
      price += (Math.random() - 0.5) * price * 0.02; // 2% max change
      history.unshift(price);
    }
    
    return history;
  }

  private getMockTechnicalIndicators() {
    return {
      rsi: Math.random() * 100,
      macd: Math.random() * 200 - 100,
      bollingerBands: {
        upper: Math.random() * 60000 + 40000,
        middle: Math.random() * 50000 + 35000,
        lower: Math.random() * 40000 + 30000
      },
      movingAverages: {
        sma20: Math.random() * 50000 + 30000,
        sma50: Math.random() * 50000 + 30000,
        ema12: Math.random() * 50000 + 30000,
        ema26: Math.random() * 50000 + 30000
      }
    };
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePortfolio(): Portfolio {
    return {
      totalValue: 100000, // $100k starting portfolio
      cash: 100000,
      positions: {},
      performance: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      }
    };
  }

  private getDefaultConfig(): AutoTradingConfig {
    return {
      enabled: false,
      strategy: {
        name: 'Balanced Growth',
        riskTolerance: 'MEDIUM',
        maxPositionSize: 0.1, // 10% max per position
        stopLossPercentage: 5,
        takeProfitPercentage: 15,
        minConfidence: 0.7
      },
      maxDailyTrades: 5,
      maxPortfolioRisk: 0.3, // 30% max portfolio risk
      symbols: ['BTC', 'ETH', 'ADA', 'DOT', 'LINK']
    };
  }

  // Public methods for UI interaction
  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  getActivePositions(): TradeExecution[] {
    return Array.from(this.activePositions.values());
  }

  getTradeHistory(): TradeExecution[] {
    return [...this.tradeHistory];
  }

  updateConfig(config: Partial<AutoTradingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AutoTradingConfig {
    return { ...this.config };
  }
}