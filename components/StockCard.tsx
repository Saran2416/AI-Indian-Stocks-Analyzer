'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import LivePrice from '@/components/LivePrice';
import { StockPriceData } from '@/lib/stocks';

interface StockCardProps {
  stock: StockPriceData;
  isLoading?: boolean;
  isLive?: boolean;
}

function formatMarketCap(val: number): string {
  if (val <= 0) return 'N/A';
  // Indian stocks: marketCap is in INR
  if (val >= 1e12) return `₹${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `₹${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatQuoteTime(value?: string): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

export default function StockCard({
  stock,
  isLoading = false,
  isLive = false,
}: StockCardProps) {
  const isPositive = stock.change >= 0;
  const quoteTime = formatQuoteTime(stock.dataAsOf);

  if (isLoading) {
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="h-8 bg-white/10 rounded w-32 mb-4" />
        <div className="h-6 bg-white/10 rounded w-24" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 hover:border-accent-500/30 transition-all duration-300"
    >
      {/* Company name */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white leading-tight">{stock.name}</h2>
        <p className="text-sm text-white/50 mt-0.5">{stock.symbol}</p>
        {quoteTime && (
          <p
            className={`inline-flex items-center gap-1.5 text-xs mt-1 ${
              isLive ? 'text-green-400/80' : 'text-amber-300/80'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isLive ? 'Live' : 'Last live quote'} · updated {quoteTime} IST
          </p>
        )}
      </div>

      {/* Price + change prominently displayed */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Price</p>
        <div className="mb-2">
          <LivePrice value={stock.price} className="text-4xl font-bold" />
        </div>
        <motion.div
          className={`flex items-center gap-2 text-base font-semibold px-3 py-1.5 rounded-lg w-fit ${
            isPositive
              ? 'bg-green-500/15 text-green-400 border border-green-500/25'
              : 'bg-red-500/15 text-red-400 border border-red-500/25'
          }`}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>
            {isPositive ? '+' : ''}
            {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
            {stock.changePercent.toFixed(2)}%)
          </span>
        </motion.div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-white/40 mb-1">Market Cap</p>
          <p className="text-sm font-semibold text-white">{formatMarketCap(stock.marketCap)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-white/40 mb-1">Volume</p>
          <p className="text-sm font-semibold text-white">
            {stock.volume >= 1e6
              ? `${(stock.volume / 1e6).toFixed(2)}M`
              : stock.volume >= 1e3
              ? `${(stock.volume / 1e3).toFixed(1)}K`
              : stock.volume.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-white/40 mb-1">P/E Ratio</p>
          <p className="text-sm font-semibold text-white">{stock.pe > 0 ? stock.pe.toFixed(2) : 'N/A'}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-white/40 mb-1">Day High / Low</p>
          <p className="text-sm font-semibold text-white">
            ₹{stock.dayHigh.toFixed(0)} / ₹{stock.dayLow.toFixed(0)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2">
          <p className="text-xs text-white/40 mb-1">52-Week High / Low</p>
          <p className="text-sm font-semibold text-white">
            ₹{stock.fiftyTwoWeekHigh.toFixed(0)} / ₹{stock.fiftyTwoWeekLow.toFixed(0)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
