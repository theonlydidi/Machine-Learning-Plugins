import { TechnicalIndicators, PricePoint } from '../types/trading';

export class TechnicalAnalysisService {
  private static instance: TechnicalAnalysisService;

  static getInstance(): TechnicalAnalysisService {
    if (!TechnicalAnalysisService.instance) {
      TechnicalAnalysisService.instance = new TechnicalAnalysisService();
    }
    return TechnicalAnalysisService.instance;
  }

  calculateTechnicalIndicators(priceHistory: PricePoint[]): TechnicalIndicators {
    const prices = priceHistory.map(p => p.price);
    const volumes = priceHistory.map(p => p.volume);

    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      movingAverages: {
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        ema12: this.calculateEMA(prices, 12),
        ema26: this.calculateEMA(prices, 26)
      },
      volume: volumes[volumes.length - 1] || 0,
      volatility: this.calculateVolatility(prices)
    };
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  private calculateBollingerBands(prices: number[], period: number = 20) {
    const sma = this.calculateSMA(prices, period);
    const variance = this.calculateVariance(prices.slice(-period), sma);
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (2 * stdDev),
      middle: sma,
      lower: sma - (2 * stdDev)
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateVariance(prices: number[], mean: number): number {
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  generateTradingSignals(indicators: TechnicalIndicators): string[] {
    const signals: string[] = [];

    // RSI signals
    if (indicators.rsi > 70) {
      signals.push('RSI indicates overbought conditions - potential sell signal');
    } else if (indicators.rsi < 30) {
      signals.push('RSI indicates oversold conditions - potential buy signal');
    }

    // MACD signals
    if (indicators.macd > 0) {
      signals.push('MACD is positive - bullish momentum');
    } else {
      signals.push('MACD is negative - bearish momentum');
    }

    // Bollinger Bands signals
    const currentPrice = indicators.bollingerBands.middle; // Approximation
    if (currentPrice > indicators.bollingerBands.upper) {
      signals.push('Price above upper Bollinger Band - potential reversal');
    } else if (currentPrice < indicators.bollingerBands.lower) {
      signals.push('Price below lower Bollinger Band - potential bounce');
    }

    // Moving Average signals
    if (indicators.movingAverages.sma20 > indicators.movingAverages.sma50) {
      signals.push('20-day SMA above 50-day SMA - bullish trend');
    } else {
      signals.push('20-day SMA below 50-day SMA - bearish trend');
    }

    return signals;
  }
}