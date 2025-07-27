@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { CryptoData } from './types/crypto';
 import { cryptoApi } from './services/cryptoApi';
 import { aiService } from './services/aiService';
+import { TradingSignals } from './components/TradingSignals';
+import { SentimentAnalysis } from './components/SentimentAnalysis';
 import { CryptoCard } from './components/CryptoCard';
 import { PriceChart } from './components/PriceChart';
 import { ChatMessage } from './components/ChatMessage';
 import { ChatInput } from './components/ChatInput';
 import { QuickActions } from './components/QuickActions';
-import { Bot, TrendingUp, BarChart3, MessageSquare } from 'lucide-react';
+import { Bot, TrendingUp, BarChart3, MessageSquare, Brain, Activity } from 'lucide-react';
 
 interface Message {
   id: string;
@@ -20,6 +23,8 @@ function App() {
   const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
   const [chartData, setChartData] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(false);
+  const [activeTab, setActiveTab] = useState<'chat' | 'signals' | 'sentiment'>('chat');
+  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
 
   useEffect(() => {
     loadCryptoData();
@@ .. @@
   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
       <div className="container mx-auto px-4 py-8">
         {/* Header */}
         <div className="text-center mb-8">
           <div className="flex items-center justify-center mb-4">
             <div className="relative">
               <Bot className="w-16 h-16 text-blue-400" />
               <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
               </div>
             </div>
           </div>
-          <h1 className="text-4xl font-bold text-white mb-2">AI Crypto Assistant</h1>
-          <p className="text-gray-300 text-lg">Your intelligent cryptocurrency trading companion</p>
+          <h1 className="text-4xl font-bold text-white mb-2">AI Crypto Trading Bot</h1>
+          <p className="text-gray-300 text-lg">Advanced AI-powered cryptocurrency analysis and trading</p>
         </div>
 
+        {/* Navigation Tabs */}
+        <div className="flex justify-center mb-8">
+          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1">
+            <button
+              onClick={() => setActiveTab('chat')}
+              className={`px-6 py-3 rounded-lg font-medium transition-all ${
+                activeTab === 'chat'
+                  ? 'bg-white text-gray-900 shadow-lg'
+                  : 'text-white hover:bg-white/10'
+              }`}
+            >
+              <MessageSquare className="w-5 h-5 inline mr-2" />
+              Chat Assistant
+            </button>
+            <button
+              onClick={() => setActiveTab('signals')}
+              className={`px-6 py-3 rounded-lg font-medium transition-all ${
+                activeTab === 'signals'
+                  ? 'bg-white text-gray-900 shadow-lg'
+                  : 'text-white hover:bg-white/10'
+              }`}
+            >
+              <Brain className="w-5 h-5 inline mr-2" />
+              Trading Signals
+            </button>
+            <button
+              onClick={() => setActiveTab('sentiment')}
+              className={`px-6 py-3 rounded-lg font-medium transition-all ${
+                activeTab === 'sentiment'
+                  ? 'bg-white text-gray-900 shadow-lg'
+                  : 'text-white hover:bg-white/10'
+              }`}
+            >
+              <Activity className="w-5 h-5 inline mr-2" />
+              Sentiment Analysis
+            </button>
+          </div>
+        </div>
+
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column - Crypto Cards */}
           <div className="space-y-6">
@@ .. @@
           </div>
 
-          {/* Right Column - Chat Interface */}
+          {/* Right Column - Dynamic Content */}
           <div className="lg:col-span-2">
-            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl h-[600px] flex flex-col">
-              <div className="p-6 border-b border-gray-200">
-                <div className="flex items-center justify-between">
-                  <div className="flex items-center space-x-3">
-                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
-                      <Bot className="w-6 h-6 text-white" />
-                    </div>
-                    <div>
-                      <h3 className="text-lg font-semibold text-gray-900">AI Crypto Assistant</h3>
-                      <p className="text-sm text-gray-500">Online • Ready to help</p>
+            {activeTab === 'chat' && (
+              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl h-[600px] flex flex-col">
+                <div className="p-6 border-b border-gray-200">
+                  <div className="flex items-center justify-between">
+                    <div className="flex items-center space-x-3">
+                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
+                        <Bot className="w-6 h-6 text-white" />
+                      </div>
+                      <div>
+                        <h3 className="text-lg font-semibold text-gray-900">AI Crypto Assistant</h3>
+                        <p className="text-sm text-gray-500">Online • Ready to help</p>
+                      </div>
                     </div>
+                    <div className="flex items-center space-x-2">
+                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
+                      <span className="text-sm text-gray-500">Live Analysis</span>
+                    </div>
                   </div>
-                  <div className="flex items-center space-x-2">
-                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
-                    <span className="text-sm text-gray-500">Live Analysis</span>
-                  </div>
                 </div>
-              </div>
 
-              <div className="flex-1 overflow-y-auto p-6 space-y-4">
-                {messages.map((message) => (
-                  <ChatMessage key={message.id} message={message} />
-                ))}
-                {isLoading && (
-                  <div className="flex justify-start">
-                    <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
-                      <div className="flex items-center space-x-2">
-                        <div className="flex space-x-1">
-                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
-                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
-                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
+                <div className="flex-1 overflow-y-auto p-6 space-y-4">
+                  {messages.map((message) => (
+                    <ChatMessage key={message.id} message={message} />
+                  ))}
+                  {isLoading && (
+                    <div className="flex justify-start">
+                      <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
+                        <div className="flex items-center space-x-2">
+                          <div className="flex space-x-1">
+                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
+                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
+                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
+                          </div>
+                          <span className="text-sm text-gray-500">AI is thinking...</span>
                         </div>
-                        <span className="text-sm text-gray-500">AI is thinking...</span>
                       </div>
                     </div>
-                  </div>
-                )}
-              </div>
+                  )}
+                </div>
 
-              <div className="p-6 border-t border-gray-200">
-                <QuickActions onActionClick={handleQuickAction} />
-                <div className="mt-4">
-                  <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
+                <div className="p-6 border-t border-gray-200">
+                  <QuickActions onActionClick={handleQuickAction} />
+                  <div className="mt-4">
+                    <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
+                  </div>
                 </div>
               </div>
-            </div>
+            )}
+
+            {activeTab === 'signals' && (
+              <TradingSignals />
+            )}
+
+            {activeTab === 'sentiment' && (
+              <div className="space-y-6">
+                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
+                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Cryptocurrency</h3>
+                  <div className="grid grid-cols-4 gap-2">
+                    {['BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'MATIC', 'AVAX', 'SOL'].map((symbol) => (
+                      <button
+                        key={symbol}
+                        onClick={() => setSelectedSymbol(symbol)}
+                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
+                          selectedSymbol === symbol
+                            ? 'bg-blue-600 text-white'
+                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
+                        }`}
+                      >
+                        {symbol}
+                      </button>
+                    ))}
+                  </div>
+                </div>
+                <SentimentAnalysis symbol={selectedSymbol} />
+              </div>
+            )}
           </div>
         </div>
       </div>