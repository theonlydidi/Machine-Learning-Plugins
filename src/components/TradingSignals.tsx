import React, { useState, useEffect } from 'react';
import { TradingSignal } from '../types/trading';
import { TradingBot } from '../services/tradingBot';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown, AlertTriangle, Target, Shield } from 'lucide-react';

interface TradingSignalsProps {
  selectedCrypto?: string;
}

export const TradingSignals: React.FC<TradingSignalsProps> = ({ selectedCrypto }) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const tradingBot = TradingBot.getInstance();

  useEffect(() => {
    loadSignals();
  }, [selectedCrypto]);

  const loadSignals = () => {
    const recentSignals = tradingBot.getRecentSignals(10);
    const filteredSignals = selectedCrypto 
      ? recentSignals.filter(s => s.symbol.toLowerCase().includes(selectedCrypto.toLowerCase()))
      : recentSignals;
    setSignals(filteredSignals);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SELL': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'SWAP': return <ArrowUpDown className="w-4 h-4 text-blue-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL': return 'bg-red-100 text-red-800 border-red-200';
      case 'SWAP': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatPrice = (price: number) => {
    return price > 1 ? `$${price.toFixed(2)}` : `$${price.toFixed(6)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Target className="w-6 h-6 mr-2 text-blue-600" />
          Trading Signals
        </h3>
        <button
          onClick={loadSignals}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No trading signals available</p>
          <p className="text-sm">Generate signals by analyzing cryptocurrencies</p>
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal) => (
            <div key={signal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getActionIcon(signal.action)}
                  <div>
                    <h4 className="font-semibold text-gray-900">{signal.symbol}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(signal.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(signal.action)}`}>
                    {signal.action}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Confidence: {(signal.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Current Price</p>
                  <p className="font-semibold">{formatPrice(signal.price)}</p>
                </div>
                {signal.targetPrice && (
                  <div>
                    <p className="text-xs text-gray-500">Target Price</p>
                    <p className="font-semibold text-green-600">{formatPrice(signal.targetPrice)}</p>
                  </div>
                )}
                {signal.stopLoss && (
                  <div>
                    <p className="text-xs text-gray-500">Stop Loss</p>
                    <p className="font-semibold text-red-600">{formatPrice(signal.stopLoss)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <p className={`font-semibold ${getRiskColor(signal.riskLevel)}`}>
                    {signal.riskLevel}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Technical Indicators</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>RSI: {signal.technicalIndicators.rsi.toFixed(1)}</div>
                  <div>MACD: {signal.technicalIndicators.macd.toFixed(4)}</div>
                  <div>Vol: {(signal.technicalIndicators.volatility * 100).toFixed(1)}%</div>
                  <div>Sentiment: {(signal.sentimentScore * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Analysis</p>
                <div className="space-y-1">
                  {signal.reasoning.slice(0, 3).map((reason, index) => (
                    <p key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {reason}
                    </p>
                  ))}
                </div>
              </div>

              {signal.riskLevel === 'HIGH' && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-700">High risk signal - trade with caution</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};