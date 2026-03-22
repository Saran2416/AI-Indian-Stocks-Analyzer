'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StockSearch from '@/components/StockSearch';
import StockCard from '@/components/StockCard';
import StockChart from '@/components/StockChart';
import AIScoreGauge from '@/components/AIScoreGauge';
import RecommendationBadge from '@/components/RecommendationBadge';
import {
  FundamentalsPanel,
  TechnicalPanel,
  SentimentPanel,
  RiskPanel,
} from '@/components/AnalysisPanels';
import { StockPriceData, ChartData } from '@/lib/stocks';
import { AIAnalysisResult } from '@/lib/ai';
import { AlertCircle, Search } from 'lucide-react';

interface AnalysisData {
  stock: StockPriceData;
  chartData: ChartData[];
  analysis: AIAnalysisResult & {
    overall: number;
    color: 'green' | 'yellow' | 'red';
  };
}

const HEADER_TEXT = '📊 AI Indian Stock Analyzer';
const TAGLINE = 'AI-powered analysis for Indian stocks with real-time data and intelligent recommendations';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStockSelect = useCallback(async (symbol: string) => {
    setSelectedStock(symbol);
    setError(null);
    setIsLoading(true);
    setAnalysisData(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze stock');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="border-b border-white/5 py-8 md:py-12 px-4 sm:px-6 lg:px-8 backdrop-blur-md bg-gradient-to-b from-slate-900/50 to-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 gradient-text"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {HEADER_TEXT}
            </motion.h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              {TAGLINE}
            </p>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Search Section */}
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StockSearch
                onSelect={handleStockSelect}
                isLoading={isLoading}
              />
            </motion.section>

            {selectedStock && (
              <div className="mb-4 text-sm text-white/60 text-center">
                Showing analysis for: <span className="text-accent-400 font-semibold">{selectedStock}</span>
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 flex items-center gap-3"
                >
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis Section */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <motion.div
                    className="w-12 h-12 border-3 border-accent-500/30 border-t-accent-500 rounded-full mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-white/60">Analyzing stock data with AI...</p>
                </motion.div>
              ) : analysisData ? (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-8"
                >
                  {/* Stock Info and Chart */}
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <StockChart
                        data={analysisData.chartData}
                        symbol={analysisData.stock.symbol}
                      />
                    </div>
                    <div>
                      <StockCard stock={analysisData.stock} />
                    </div>
                  </div>

                  {/* Score and Recommendation */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <AIScoreGauge
                      score={analysisData.analysis.overall}
                      recommendation={analysisData.analysis.recommendation}
                    />
                    <RecommendationBadge
                      recommendation={analysisData.analysis.recommendation}
                      score={analysisData.analysis.overall}
                    />
                  </div>

                  {/* Analysis Panels */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <FundamentalsPanel
                      score={analysisData.analysis.fundamentalsScore}
                      reasoning={analysisData.analysis.reasoning.fundamentals}
                    />
                    <TechnicalPanel
                      score={analysisData.analysis.technicalScore}
                      reasoning={analysisData.analysis.reasoning.technicals}
                    />
                    <SentimentPanel
                      score={analysisData.analysis.sentimentScore}
                      reasoning={analysisData.analysis.reasoning.sentiment}
                    />
                    <RiskPanel
                      score={analysisData.analysis.riskScore}
                      reasoning={analysisData.analysis.reasoning.risk}
                    />
                  </div>

                  {/* Key Points and Risks */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-green-400">→</span> Key Highlights
                      </h3>
                      <ul className="space-y-3">
                        {analysisData.analysis.keyPoints?.map((point: string, idx: number) => (
                          <motion.li
                            key={idx}
                            className="text-white/70 text-sm flex gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <span className="text-accent-400 flex-shrink-0">✓</span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-red-900/20 to-slate-900/50 backdrop-blur-md rounded-2xl border border-red-500/20 p-6"
                    >
                      <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                        <span>⚠</span> Risk Factors
                      </h3>
                      <ul className="space-y-3">
                        {analysisData.analysis.risks?.map((risk: string, idx: number) => (
                          <motion.li
                            key={idx}
                            className="text-white/70 text-sm flex gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <span className="text-red-400 flex-shrink-0">!</span>
                            <span>{risk}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-accent-500/10 border border-accent-500/30 mx-auto mb-4 flex items-center justify-center text-accent-400"
                  >
                    <Search size={32} />
                  </motion.div>
                  <p className="text-white/60 text-lg">
                    Search for an Indian stock to get AI-powered analysis
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Footer with Disclaimer */}
        <motion.footer
          className="border-t border-white/5 mt-16 py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-slate-900/50 to-transparent"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-100 text-center">
              ⚠️ <strong>Disclaimer:</strong> This AI-based analysis is for informational purposes only and is not
              financial advice. The analysis is generated using artificial intelligence and may contain
              inaccuracies. Please do your own research and consult with a financial advisor before
              making investment decisions. Stock market investments carry risk, including potential loss
              of principal.
            </div>
            <p className="text-center text-white/40 text-xs mt-6">
              © 2024 AI Stock Analyzer. Data sourced from Yahoo Finance. Not affiliated with NSE/BSE.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
