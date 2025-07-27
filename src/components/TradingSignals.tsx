import React, { useState, useEffect } from 'react';
import { TradingBot } from '../services/tradingBot';
import { TradingSignal } from '../types/trading';
import { TrendingUp, TrendingDown, Minus, Activity, Brain, Target } from 'lucide-react';

export const TradingSignals: React.FC = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);
  const tradingBot = TradingBot.getInstance();

  useEffect(() => {
    generateSignals();
    const interval = setInterval(generateSignals, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const generateSignals = async () => {
    setLoading(true);
    try {
      const symbols = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'MATIC', 'AVAX', 'SOL'];
      const newSignals = await tradingBot.generateTradingSignals(symbols);
      setSignals(newSignals);
    } catch (error) {
      console.error('Error generating signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoTrading = () => {
    const config = tradingBot.getConfig();
    tradingBot.updateConfig({ enabled: !config.enabled });
    setAutoTrading(!config.enabled);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = confidence * 100;
    const color = confidence > 0.8 ? 'bg-green-500' : 
                  confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-600" />
          AI Trading Signals
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAutoTrading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              autoTrading 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {autoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
          </button>
          <button
            onClick={generateSignals}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Refresh Signals'}
          </button>
        </div>
      </div>

      {loading && signals.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full border font-medium ${getActionColor(signal.action)}`}>
                    <div className="flex items-center space-x-1">
                      {getActionIcon(signal.action)}
                      <span>{signal.action}</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{signal.symbol}</h4>
                  <span className="text-gray-600">${signal.price.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Confidence</div>
                  <div className="w-24">
                    {getConfidenceBar(signal.confidence)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {(signal.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    RSI: {signal.technicalIndicators.rsi.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    Sentiment: {(signal.sentimentScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">
                    Social: {(signal.socialScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">AI Reasoning:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {signal.reasoning.slice(0, 3).map((reason, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && signals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No trading signals generated yet</p>
          <button
            onClick={generateSignals}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Signals
          </button>
        </div>
      )}
    </div>
  );
};