export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  volume: {
    current: number;
    average: number;
    ratio: number;
  };
}

export interface TechnicalSignal {
  indicator: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
  description: string;
}

export class TechnicalAnalysisService {
  private static instance: TechnicalAnalysisService;

  static getInstance(): TechnicalAnalysisService {
    if (!TechnicalAnalysisService.instance) {
      TechnicalAnalysisService.instance = new TechnicalAnalysisService();
    }
    return TechnicalAnalysisService.instance;
  }

  calculateRSI(prices: number[], period: number = 14): number {
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

  calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Simplified signal line calculation
    const signal = macd * 0.9; // Mock signal line
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period).reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance) * stdDev;

    return {
      upper: sma + standardDeviation,
      middle: sma,
      lower: sma - standardDeviation
    };
  }

  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const relevantPrices = prices.slice(-period);
    return relevantPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14): {
    k: number;
    d: number;
  } {
    if (closes.length < period) {
      return { k: 50, d: 50 };
    }

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.9; // Simplified %D calculation

    return { k, d };
  }

  analyzeIndicators(indicators: TechnicalIndicators): TechnicalSignal[] {
    const signals: TechnicalSignal[] = [];

    // RSI Analysis
    if (indicators.rsi < 30) {
      signals.push({
        indicator: 'RSI',
        signal: 'BUY',
        strength: (30 - indicators.rsi) / 30,
        description: 'RSI indicates oversold conditions'
      });
    } else if (indicators.rsi > 70) {
      signals.push({
        indicator: 'RSI',
        signal: 'SELL',
        strength: (indicators.rsi - 70) / 30,
        description: 'RSI indicates overbought conditions'
      });
    }

    // MACD Analysis
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      signals.push({
        indicator: 'MACD',
        signal: 'BUY',
        strength: Math.min(indicators.macd.histogram / 10, 1),
        description: 'MACD shows bullish momentum'
      });
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
      signals.push({
        indicator: 'MACD',
        signal: 'SELL',
        strength: Math.min(Math.abs(indicators.macd.histogram) / 10, 1),
        description: 'MACD shows bearish momentum'
      });
    }

    // Moving Average Analysis
    if (indicators.movingAverages.sma20 > indicators.movingAverages.sma50) {
      signals.push({
        indicator: 'MA Cross',
        signal: 'BUY',
        strength: 0.7,
        description: 'Golden cross detected (SMA20 > SMA50)'
      });
    } else if (indicators.movingAverages.sma20 < indicators.movingAverages.sma50) {
      signals.push({
        indicator: 'MA Cross',
        signal: 'SELL',
        strength: 0.7,
        description: 'Death cross detected (SMA20 < SMA50)'
      });
    }

    return signals;
  }

  getOverallSignal(signals: TechnicalSignal[]): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; confidence: number } {
    if (signals.length === 0) return { signal: 'NEUTRAL', confidence: 0 };

    const buySignals = signals.filter(s => s.signal === 'BUY');
    const sellSignals = signals.filter(s => s.signal === 'SELL');

    const buyStrength = buySignals.reduce((sum, s) => sum + s.strength, 0);
    const sellStrength = sellSignals.reduce((sum, s) => sum + s.strength, 0);

    const netStrength = buyStrength - sellStrength;
    const confidence = Math.abs(netStrength) / signals.length;

    if (netStrength > 0.5) return { signal: 'BUY', confidence };
    if (netStrength < -0.5) return { signal: 'SELL', confidence };
    return { signal: 'NEUTRAL', confidence };
  }
}