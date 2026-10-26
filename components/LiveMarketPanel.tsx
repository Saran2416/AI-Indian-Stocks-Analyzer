'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { LiveMarketData } from '@/lib/stocks';
import LivePrice from '@/components/LivePrice';

interface LiveMarketPanelProps {
  onSelect: (symbol: string) => void;
  isLoading?: boolean;
}

const LIVE_REFRESH_INTERVAL_MS = 1000;
const CLOSED_REFRESH_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 15_000;

function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatISTTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function LiveMarketPanel({
  onSelect,
  isLoading = false,
}: LiveMarketPanelProps) {
  const [market, setMarket] = useState<LiveMarketData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);

  const loadMarket = useCallback(
    async (mode: 'initial' | 'manual' | 'auto'): Promise<boolean> => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;

      if (mode === 'initial') {
        setIsFetching(true);
      } else if (mode === 'manual') {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch('/api/market', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || 'Live market data is currently unavailable'
          );
        }

        setMarket(data as LiveMarketData);
        setError(null);
        hasLoadedRef.current = true;
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Live market data is currently unavailable'
        );
        if (mode === 'initial' && !hasLoadedRef.current) setMarket(null);
        return false;
      } finally {
        inFlightRef.current = false;
        setIsFetching(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const isMarketOpen = market?.marketState.includes('REGULAR') ?? true;
  const refreshIntervalMs = isMarketOpen
    ? LIVE_REFRESH_INTERVAL_MS
    : CLOSED_REFRESH_INTERVAL_MS;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const tick = async (mode: 'initial' | 'auto') => {
      if (cancelled) return;

      if (document.visibilityState === 'hidden') {
        timer = setTimeout(() => tick('auto'), refreshIntervalMs);
        return;
      }

      const success = await loadMarket(mode);

      if (success) {
        failures = 0;
      } else {
        failures += 1;
      }

      if (!cancelled) {
        const delay =
          failures > 0
            ? Math.min(refreshIntervalMs * 2 ** failures, MAX_BACKOFF_MS)
            : refreshIntervalMs;
        timer = setTimeout(() => tick('auto'), delay);
      }
    };

    void tick(hasLoadedRef.current ? 'auto' : 'initial');

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        if (timer) clearTimeout(timer);
        void tick('auto');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadMarket, refreshIntervalMs]);

  if (isFetching) {
    return (
      <section className="mb-8" aria-busy="true" aria-label="Loading live market data">
        <div className="mb-5 space-y-2">
          <div className="h-7 w-48 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-white/5 animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!market) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-full bg-accent-500/10 border border-accent-500/30 mx-auto mb-4 flex items-center justify-center text-accent-400">
          <Search size={32} />
        </div>
        <p className="text-white/60 text-lg">
          Search for an Indian stock to get AI-powered analysis
        </p>
        <p className="text-amber-300/80 text-xs mt-2">
          {error || 'Live market data is currently unavailable'}
        </p>
        <button
          type="button"
          onClick={() => loadMarket('initial')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:text-white hover:border-accent-500/40 transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </motion.div>
    );
  }

  const quotes = market.quotes.slice(0, 12);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Market</h2>
          <p className="text-sm text-white/50 mt-1">
            Top Indian stocks by market cap · checked {formatISTTime(market.generatedAt)} IST
          </p>
          <p className="text-xs text-white/35 mt-0.5">
            Quote time {market.asOfIST} IST · Yahoo Finance can lag by a few seconds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isMarketOpen
                ? 'bg-green-500/10 border-green-500/25 text-green-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isMarketOpen ? 'Live · Market open' : 'Market closed'}
          </span>
          <span className="text-white/40">Source: {market.source}</span>
          <button
            type="button"
            onClick={() => loadMarket('manual')}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-accent-500/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs">
          <AlertCircle size={14} />
          Live refresh failed — showing the last live update from {market.asOfIST} IST.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quotes.map((quote, index) => {
          const isPositive = quote.change >= 0;

          return (
            <motion.button
              key={quote.symbol}
              type="button"
              onClick={() => onSelect(quote.symbol)}
              disabled={isLoading}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              whileHover={{ y: -2 }}
              className="group text-left bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-4 hover:border-accent-500/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {quote.name}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {quote.symbol.replace('.NS', '')} · NSE
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${
                    isPositive
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {isPositive ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <LivePrice value={quote.price} className="text-2xl font-bold" />
                <p
                  className={`text-xs font-medium tabular-nums mb-1 ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}₹{formatPrice(quote.change)}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
                <span>P/E {quote.pe > 0 ? quote.pe.toFixed(1) : 'N/A'}</span>
                <span className="inline-flex items-center gap-1 text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Analyze <ArrowRight size={12} />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-xs text-white/40 mt-4">
        Showing top {quotes.length} of {market.count} stocks ·{' '}
        {isMarketOpen
          ? 'updates every second while the market is open'
          : 'updates every 30 seconds while the market is closed'}{' '}
        · select one to run AI analysis
      </p>
    </motion.section>
  );
}
