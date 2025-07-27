import React, { useState, useEffect } from 'react';
import { SentimentData, SentimentAnalyzer } from '../services/sentimentAnalyzer';
import { TrendingUp, TrendingDown, MessageCircle, Hash, Users, Clock } from 'lucide-react';

interface SentimentAnalysisProps {
  symbol: string;
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ symbol }) => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const sentimentAnalyzer = SentimentAnalyzer.getInstance();

  useEffect(() => {
    if (symbol) {
      analyzeSentiment();
    }
  }, [symbol]);

  const analyzeSentiment = async () => {
    setLoading(true);
    try {
      const data = await sentimentAnalyzer.analyzeSentiment(symbol);
      setSentimentData(data);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (score: number) => {
    return score > 0 ? (
      <TrendingUp className="w-5 h-5 text-green-500" />
    ) : (
      <TrendingDown className="w-5 h-5 text-red-500" />
    );
  };

  const getSentimentBar = (score: number) => {
    const percentage = ((score + 1) / 2) * 100;
    const color = score > 0.2 ? 'bg-green-500' : score < -0.2 ? 'bg-red-500' : 'bg-gray-400';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'twitter': return '🐦';
      case 'reddit': return '🤖';
      case 'telegram': return '📱';
      case 'news': return '📰';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!sentimentData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sentiment data available</p>
        </div>
      </div>
    );
  }

  const sentimentLabel = sentimentAnalyzer.getSentimentLabel(sentimentData.overall);
  const sentimentColor = sentimentAnalyzer.getSentimentColor(sentimentData.overall);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
          Sentiment Analysis
        </h3>
        <button
          onClick={analyzeSentiment}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overall Sentiment */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
          <div className="flex items-center space-x-2">
            {getSentimentIcon(sentimentData.overall)}
            <span 
              className="font-bold text-lg"
              style={{ color: sentimentColor }}
            >
              {sentimentLabel}
            </span>
          </div>
        </div>
        {getSentimentBar(sentimentData.overall)}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Very Bearish</span>
          <span>Neutral</span>
          <span>Very Bullish</span>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Source Breakdown</h4>
        <div className="space-y-3">
          {Object.entries(sentimentData.sources).map(([source, score]) => (
            <div key={source} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getSourceIcon(source)}</span>
                <span className="text-sm font-medium text-gray-700 capitalize">{source}</span>
              </div>
              <div className="flex items-center space-x-2 w-32">
                {getSentimentBar(score)}
                <span className="text-xs text-gray-600 w-12">
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Metrics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Volume Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Hash className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">News Articles</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{sentimentData.volume.news}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">Social Mentions</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{sentimentData.volume.social.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Trending Keywords */}
      {sentimentData.keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Trending Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {sentimentData.keywords.slice(0, 8).map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trending Indicator */}
      {sentimentData.trending && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-800">
              {symbol} is currently trending on social media!
            </span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4 flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        Last updated: {sentimentData.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};