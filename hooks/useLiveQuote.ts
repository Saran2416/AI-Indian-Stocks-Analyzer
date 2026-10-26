'use client';

import { useEffect, useState } from 'react';
import type { LiveQuoteUpdate, StockPriceData } from '@/lib/stocks';

const REFRESH_INTERVAL_MS = 1000;
const MARKET_CLOSED_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 15_000;

interface UseLiveQuoteOptions {
  symbol: string | null;
  initialQuote: StockPriceData | null;
  enabled?: boolean;
}

interface UseLiveQuoteResult {
  quote: StockPriceData | null;
  error: string | null;
  isLive: boolean;
}

/**
 * Polls the selected stock's live price once per second while the market is
 * open (every 30 seconds when closed). The poll pauses while the tab is hidden
 * and backs off automatically when Yahoo is unavailable.
 */
export function useLiveQuote({
  symbol,
  initialQuote,
  enabled = true,
}: UseLiveQuoteOptions): UseLiveQuoteResult {
  const [quote, setQuote] = useState<StockPriceData | null>(initialQuote);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setQuote(initialQuote);
    setError(null);
    setIsLive(false);
  }, [initialQuote]);

  useEffect(() => {
    if (!enabled || !symbol) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let inFlight = false;
    let failures = 0;
    let pollIntervalMs = REFRESH_INTERVAL_MS;

    const poll = async () => {
      if (cancelled || inFlight) return;

      if (document.visibilityState === 'hidden') {
        timer = setTimeout(poll, pollIntervalMs);
        return;
      }

      inFlight = true;
      controller = new AbortController();

      try {
        const response = await fetch(
          `/api/quote?symbol=${encodeURIComponent(symbol)}`,
          { cache: 'no-store', signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || 'Live stock data is currently unavailable'
          );
        }

        if (!data?.quote) {
          throw new Error('Live stock data is currently unavailable');
        }

        const update = data.quote as LiveQuoteUpdate;
        pollIntervalMs =
          update.marketState === 'CLOSED'
            ? MARKET_CLOSED_INTERVAL_MS
            : REFRESH_INTERVAL_MS;

        if (cancelled) return;

        setQuote((current) =>
          current ? { ...current, ...update } : null
        );
        setError(null);
        setIsLive(update.marketState === 'REGULAR');
        failures = 0;
      } catch (err) {
        if (
          cancelled ||
          (err instanceof Error && err.name === 'AbortError')
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Live stock data is currently unavailable'
        );
        setIsLive(false);
        failures += 1;
      } finally {
        inFlight = false;

        if (!cancelled) {
          const delay =
            failures > 0
              ? Math.min(
                  pollIntervalMs * 2 ** failures,
                  Math.max(MAX_BACKOFF_MS, pollIntervalMs)
                )
              : pollIntervalMs;
          timer = setTimeout(poll, delay);
        }
      }
    };

    void poll();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        if (timer) clearTimeout(timer);
        void poll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, symbol]);

  return { quote, error, isLive };
}
