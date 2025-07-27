export interface TradingSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'SWAP';
  confidence: number;
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string[];
  timestamp: Date;
  technicalIndicators: TechnicalIndicators;
  sentimentScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  volume: number;
  volatility: number;
}

export interface SentimentData {
  overall: number;
  sources: {
    twitter: number;
    reddit: number;
    news: number;
    telegram: number;
  };
  keywords: string[];
  mentions: number;
  timestamp: Date;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  priceChange24h: number;
  priceHistory: PricePoint[];
  orderBook: OrderBook;
}

export interface PricePoint {
  timestamp: Date;
  price: number;
  volume: number;
}

export interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
}

export interface PredictionModel {
  symbol: string;
  predictions: {
    '1h': number;
    '4h': number;
    '24h': number;
    '7d': number;
  };
  confidence: number;
  factors: string[];
  lastUpdated: Date;
}

export interface TradeExecution {
  id: string;
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'FAILED';
  timestamp: Date;
  fees: number;
}

export interface Portfolio {
  totalValue: number;
  assets: {
    [symbol: string]: {
      amount: number;
      avgPrice: number;
      currentPrice: number;
      pnl: number;
      pnlPercentage: number;
    };
  };
  trades: TradeExecution[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
}