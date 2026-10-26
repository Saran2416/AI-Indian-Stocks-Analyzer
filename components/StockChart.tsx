'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AreaChart as AreaChartIcon,
  BarChart3,
  CandlestickChart,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { ChartData, StockPriceData } from '@/lib/stocks';

type Period = '1d' | '1w' | '1m' | '1y' | '5y';
type ChartMode = 'area' | 'candles' | 'volume' | 'return';

interface ChartPoint extends ChartData {
  sma20?: number;
  sma50?: number;
  change: number;
  changePercent: number;
  returnPercent: number;
  range: [number, number];
}

interface StockChartProps {
  data: ChartData[];
  symbol: string;
  liveQuote?: StockPriceData | null;
  isLive?: boolean;
  isLoading?: boolean;
}

const PERIODS: Array<{ label: string; value: Period; detail: string }> = [
  { label: '1D', value: '1d', detail: '1-minute bars' },
  { label: '1W', value: '1w', detail: '5-minute bars' },
  { label: '1M', value: '1m', detail: 'hourly bars' },
  { label: '1Y', value: '1y', detail: 'daily bars' },
  { label: '5Y', value: '5y', detail: 'weekly bars' },
];

const CHART_MODES: Array<{ label: string; value: ChartMode; icon: LucideIcon }> = [
  { label: 'Area', value: 'area', icon: AreaChartIcon },
  { label: 'Candles', value: 'candles', icon: CandlestickChart },
  { label: 'Volume', value: 'volume', icon: BarChart3 },
  { label: 'Returns', value: 'return', icon: Activity },
];

const UP_COLOR = '#22c55e';
const DOWN_COLOR = '#ef4444';

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedPrice(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return Math.round(value).toLocaleString('en-IN');
}

function formatAxisDate(value: string, period: Period): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  switch (period) {
    case '1d':
      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      });
    case '1w':
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        hour: '2-digit',
      });
    case '1m':
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      });
    case '1y':
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        year: '2-digit',
      });
    case '5y':
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        year: 'numeric',
      });
  }
}

function formatTooltipDate(timestamp: number, period: Period): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
  };

  if (period !== '1y' && period !== '5y') {
    options.timeStyle = 'short';
  }

  return date.toLocaleString('en-IN', options);
}

function sameIstDay(first: number, second: number): boolean {
  const format = (value: number) =>
    new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return format(first) === format(second);
}

/**
 * Merge the second-by-second quote into the final candle. We never fabricate a
 * new bar: the final point is only updated when the live quote belongs to the
 * same trading day as the last bar from Yahoo.
 */
function mergeLiveQuote(
  data: ChartData[],
  liveQuote?: StockPriceData | null
): ChartData[] {
  if (!liveQuote || data.length === 0) return data;

  const liveTimestamp = new Date(liveQuote.dataAsOf).getTime();
  if (!Number.isFinite(liveTimestamp) || !Number.isFinite(liveQuote.price) || liveQuote.price <= 0) {
    return data;
  }

  const last = data[data.length - 1];
  if (!sameIstDay(last.timestamp, liveTimestamp)) return data;

  // Avoid rebuilding the chart series when the price has not moved. The
  // header still receives the latest source timestamp from the live quote.
  if (last.price === liveQuote.price) return data;

  const timestamp = Math.max(last.timestamp, liveTimestamp);

  return [
    ...data.slice(0, -1),
    {
      ...last,
      date: new Date(timestamp).toISOString(),
      timestamp,
      price: liveQuote.price,
      close: liveQuote.price,
      high: Math.max(last.high, liveQuote.price),
      low: Math.min(last.low, liveQuote.price),
    },
  ];
}

interface CandleShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartPoint;
}

function CandleShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}: CandleShapeProps) {
  if (!payload || width <= 0) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? UP_COLOR : DOWN_COLOR;
  const centerX = x + width / 2;
  const bodyWidth = Math.max(1, Math.min(width * 0.65, 12));
  const priceRange = high - low;
  const priceToY =
    priceRange > 0
      ? (price: number) => y + ((high - price) / priceRange) * height
      : () => y + height / 2;

  const openY = priceToY(open);
  const closeY = priceToY(close);
  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.max(1, Math.abs(closeY - openY));

  return (
    <g>
      <line
        x1={centerX}
        x2={centerX}
        y1={y}
        y2={y + height}
        stroke={color}
        strokeWidth={Math.max(1, Math.min(width * 0.12, 1.5))}
      />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyY}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
        fillOpacity={isUp ? 0.85 : 0.9}
        stroke={color}
        strokeWidth={1}
        rx={0.5}
      />
    </g>
  );
}

function TooltipMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'up' | 'down';
}) {
  return (
    <div>
      <p className="text-white/35">{label}</p>
      <p
        className={`font-medium ${
          tone === 'up'
            ? 'text-green-400'
            : tone === 'down'
              ? 'text-red-400'
              : 'text-white/85'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface ChartTooltipProps extends TooltipProps<number, string> {
  period: Period;
  mode: ChartMode;
}

function ChartTooltip({ active, payload, period, mode }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  const isUp = point.close >= point.open;
  const tone = point.changePercent >= 0 ? 'up' : 'down';

  return (
    <div className="min-w-[200px] rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <p className="text-[11px] text-white/50">
          {formatTooltipDate(point.timestamp, period)}
        </p>
        <span
          className={`h-2 w-2 rounded-full ${
            isUp ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        <TooltipMetric label="Open" value={formatPrice(point.open)} />
        <TooltipMetric label="High" value={formatPrice(point.high)} />
        <TooltipMetric label="Low" value={formatPrice(point.low)} />
        <TooltipMetric label="Close" value={formatPrice(point.close)} />
        <TooltipMetric label="Volume" value={formatCompact(point.volume)} />
        <TooltipMetric
          label="Change"
          value={`${point.changePercent >= 0 ? '+' : ''}${point.changePercent.toFixed(2)}%`}
          tone={tone}
        />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
        <span className="text-white/35">Period return</span>
        <span
          className={
            point.returnPercent >= 0 ? 'text-green-400' : 'text-red-400'
          }
        >
          {point.returnPercent >= 0 ? '+' : ''}
          {point.returnPercent.toFixed(2)}%
        </span>
      </div>

      {(point.sma20 !== undefined || point.sma50 !== undefined) && (
        <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-[11px] text-white/45">
          {point.sma20 !== undefined && (
            <p>
              SMA 20 <span className="float-right text-sky-300">{formatPrice(point.sma20)}</span>
            </p>
          )}
          {point.sma50 !== undefined && (
            <p>
              SMA 50 <span className="float-right text-amber-300">{formatPrice(point.sma50)}</span>
            </p>
          )}
        </div>
      )}

      {mode === 'candles' && (
        <p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-white/30">
          Green candle: close ≥ open · Red: close &lt; open
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'up' | 'down';
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          tone === 'up'
            ? 'text-green-400'
            : tone === 'down'
              ? 'text-red-400'
              : 'text-white/85'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-white/35">{hint}</p>}
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-0.5 w-4 rounded-full ${dashed ? 'border-t border-dashed bg-transparent' : ''}`}
        style={dashed ? { borderColor: color } : { backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export default function StockChart({
  data: initialData,
  symbol,
  liveQuote = null,
  isLive = false,
  isLoading = false,
}: StockChartProps) {
  const [period, setPeriod] = useState<Period>('1y');
  const [mode, setMode] = useState<ChartMode>('area');
  const [chartData, setChartData] = useState<ChartData[]>(initialData);
  const [showSMA, setShowSMA] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const liveMergeRef = useRef<{
    base: ChartData[];
    result: ChartData[];
    price: number;
  } | null>(null);

  const loadChart = useCallback(
    async (targetPeriod: Period, overlay: boolean) => {
      if (!symbol) return;

      const requestId = ++requestIdRef.current;
      setIsFetching(true);
      if (overlay) setShowOverlay(true);

      try {
        const response = await fetch('/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, period: targetPeriod }),
          cache: 'no-store',
        });
        const json = await response.json();

        if (requestId !== requestIdRef.current) return;

        if (!response.ok || json?.error) {
          throw new Error(json?.error || 'Live chart data is currently unavailable');
        }

        if (!Array.isArray(json?.data) || json.data.length === 0) {
          throw new Error('Live chart data is currently unavailable');
        }

        setChartData(json.data as ChartData[]);
        setError(null);
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : 'Live chart data is currently unavailable'
          );
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsFetching(false);
          setShowOverlay(false);
        }
      }
    },
    [symbol]
  );

  // Reset the view when a different stock is selected.
  useEffect(() => {
    setChartData(initialData);
    setPeriod('1y');
    setMode('area');
    setError(null);
  }, [symbol, initialData]);

  // Load the selected timeframe. The overlay is only shown for explicit
  // timeframe changes; the 60-second background refresh never hides the chart.
  useEffect(() => {
    if (!symbol) return;
    void loadChart(period, true);
  }, [symbol, period, loadChart]);

  // Refresh the underlying bars periodically so new intraday candles and
  // volume appear. The live quote still moves the last point every second.
  useEffect(() => {
    if (!symbol) return;

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void loadChart(period, false);
      }
    };

    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [symbol, period, loadChart]);

  const displayData = useMemo(() => {
    if (!liveQuote) {
      liveMergeRef.current = {
        base: chartData,
        result: chartData,
        price: Number.NaN,
      };
      return chartData;
    }

    const previous = liveMergeRef.current;
    if (
      previous &&
      previous.base === chartData &&
      previous.price === liveQuote.price
    ) {
      return previous.result;
    }

    // Reuse the previous merged result when the underlying bars have not
    // changed. This keeps intra-bar live highs/lows instead of dropping them
    // when the price moves back inside the original bar range.
    const source =
      previous && previous.base === chartData ? previous.result : chartData;
    const result = mergeLiveQuote(source, liveQuote);

    liveMergeRef.current = {
      base: chartData,
      result,
      price: liveQuote.price,
    };

    return result;
  }, [chartData, liveQuote]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (displayData.length === 0) return [];

    const closes = displayData.map((point) =>
      point.close > 0 ? point.close : point.price
    );
    const firstClose = closes[0];

    return displayData.map((point, index) => {
      const window20 = closes.slice(Math.max(0, index - 19), index + 1);
      const window50 = closes.slice(Math.max(0, index - 49), index + 1);
      const previousClose = index > 0 ? closes[index - 1] : point.open;
      const change = point.close - previousClose;
      const range: [number, number] = [point.low, point.high];

      return {
        ...point,
        sma20: window20.length === 20 ? average(window20) : undefined,
        sma50: window50.length === 50 ? average(window50) : undefined,
        change,
        changePercent:
          previousClose > 0 ? (change / previousClose) * 100 : 0,
        returnPercent:
          firstClose > 0 ? ((point.close - firstClose) / firstClose) * 100 : 0,
        range,
      };
    });
  }, [displayData]);

  const stats = useMemo(() => {
    if (chartPoints.length === 0) return null;

    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const open = first.open > 0 ? first.open : first.price;
    const change = last.price - open;
    let high = -Infinity;
    let low = Infinity;
    let volumeTotal = 0;

    for (const point of chartPoints) {
      high = Math.max(high, point.high);
      low = Math.min(low, point.low);
      volumeTotal += point.volume;
    }

    if (period === '1d' && liveQuote) {
      const lastTimestamp = chartPoints[chartPoints.length - 1].timestamp;
      const liveTimestamp = new Date(liveQuote.dataAsOf).getTime();

      if (
        Number.isFinite(liveTimestamp) &&
        sameIstDay(lastTimestamp, liveTimestamp)
      ) {
        if (Number.isFinite(liveQuote.dayHigh) && liveQuote.dayHigh > 0) {
          high = Math.max(high, liveQuote.dayHigh);
        }
        if (Number.isFinite(liveQuote.dayLow) && liveQuote.dayLow > 0) {
          low = Math.min(low, liveQuote.dayLow);
        }
      }
    }

    return {
      open,
      high,
      low,
      close: last.price,
      change,
      changePercent: open > 0 ? (change / open) * 100 : 0,
      avgVolume: volumeTotal / chartPoints.length,
      rangePercent: low > 0 ? ((high - low) / low) * 100 : 0,
    };
  }, [chartPoints, period, liveQuote]);

  const priceDomain = useMemo<[number, number]>(() => {
    if (chartPoints.length === 0) return [0, 1];

    let min = Infinity;
    let max = -Infinity;

    for (const point of chartPoints) {
      min = Math.min(min, point.low, point.sma20 ?? point.low, point.sma50 ?? point.low);
      max = Math.max(max, point.high, point.sma20 ?? point.high, point.sma50 ?? point.high);
    }

    if (period === '1d' && liveQuote) {
      const lastTimestamp = chartPoints[chartPoints.length - 1].timestamp;
      const liveTimestamp = new Date(liveQuote.dataAsOf).getTime();

      if (
        Number.isFinite(liveTimestamp) &&
        sameIstDay(lastTimestamp, liveTimestamp)
      ) {
        const previousClose = Number.isFinite(liveQuote.change)
          ? liveQuote.price - liveQuote.change
          : liveQuote.price;
        const dayLow =
          Number.isFinite(liveQuote.dayLow) && liveQuote.dayLow > 0
            ? liveQuote.dayLow
            : liveQuote.price;
        const dayHigh =
          Number.isFinite(liveQuote.dayHigh) && liveQuote.dayHigh > 0
            ? liveQuote.dayHigh
            : liveQuote.price;

        min = Math.min(min, dayLow, previousClose);
        max = Math.max(max, dayHigh, previousClose);
      }
    }

    const padding = Math.max((max - min) * 0.08, max * 0.002, 1);
    return [Math.max(0, min - padding), max + padding];
  }, [chartPoints, period, liveQuote]);

  const returnDomain = useMemo<[number, number]>(() => {
    if (chartPoints.length === 0) return [-1, 1];

    const values = chartPoints.map((point) => point.returnPercent);
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const padding = Math.max((max - min) * 0.1, 0.5);

    return [min - padding, max + padding];
  }, [chartPoints]);

  const maxVolume = useMemo(
    () => Math.max(1, ...chartPoints.map((point) => point.volume)),
    [chartPoints]
  );

  const lineColor = stats && stats.changePercent < 0 ? DOWN_COLOR : UP_COLOR;
  const activePeriod =
    PERIODS.find((item) => item.value === period) ?? PERIODS[3];
  const previousClose =
    liveQuote && Number.isFinite(liveQuote.change)
      ? liveQuote.price - liveQuote.change
      : null;
  const lastTick = liveQuote?.dataAsOf
    ? new Date(liveQuote.dataAsOf).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  if (isLoading) {
    return (
      <motion.div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-md">
        <div className="h-[420px] animate-pulse rounded-xl bg-white/5" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5 backdrop-blur-md sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                Price Chart — {symbol}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                  isLive
                    ? 'border-green-500/25 bg-green-500/10 text-green-400'
                    : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLive ? 'animate-pulse bg-green-400' : 'bg-amber-400'
                  }`}
                />
                {isLive ? 'Live' : 'Last live'}
                {lastTick && (
                  <span className="font-normal text-white/40">· {lastTick} IST</span>
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/40">
              {activePeriod.detail} · {chartPoints.length} bars · live price
              updates · bars refresh every 60s
              {isFetching ? ' · updating…' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadChart(period, false);
            }}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CHART_MODES.map((item) => {
              const Icon = item.icon;
              const active = mode === item.value;

              return (
                <motion.button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                    active
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                      : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <Icon size={13} />
                  {item.label}
                </motion.button>
              );
            })}
            {mode !== 'return' && (
              <motion.button
                type="button"
                onClick={() => setShowSMA((value) => !value)}
                whileTap={{ scale: 0.97 }}
                aria-pressed={showSMA}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                  showSMA
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                    : 'border-white/10 bg-white/5 text-white/45 hover:bg-white/10'
                }`}
              >
                SMA 20/50
              </motion.button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((item) => (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                disabled={isFetching}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                  period === item.value
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                    : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80'
                } ${isFetching ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <Stat label="Period open" value={formatPrice(stats.open)} />
            <Stat label="Period high" value={formatPrice(stats.high)} />
            <Stat label="Period low" value={formatPrice(stats.low)} />
            <Stat
              label="Last price"
              value={formatPrice(stats.close)}
              hint={`vs open ${formatSignedPrice(stats.change)} (${stats.changePercent >= 0 ? '+' : ''}${stats.changePercent.toFixed(2)}%)`}
              tone={stats.change >= 0 ? 'up' : 'down'}
            />
            <Stat label="Avg volume / bar" value={formatCompact(stats.avgVolume)} />
            <Stat label="Range" value={`${stats.rangePercent.toFixed(2)}%`} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/90">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{error} Showing the last loaded chart.</span>
          </div>
        )}
      </div>

      <div className="relative mt-4 h-[360px] sm:h-[420px]">
        {showOverlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/40 backdrop-blur-[1px]">
            <motion.div
              className="h-8 w-8 rounded-full border-2 border-accent-500/40 border-t-accent-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {chartPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white/40">
            Live chart data is currently unavailable.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartPoints} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chartReturnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={44}
                tickMargin={8}
                tickFormatter={(value) => formatAxisDate(String(value), period)}
              />

              <YAxis
                yAxisId="price"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={mode === 'return' ? 58 : 76}
                domain={mode === 'return' ? returnDomain : priceDomain}
                tickFormatter={(value) =>
                  mode === 'return'
                    ? `${Number(value).toFixed(1)}%`
                    : `₹${Math.round(Number(value)).toLocaleString('en-IN')}`
                }
              />

              {mode === 'volume' && (
                <YAxis yAxisId="volume" hide domain={[0, maxVolume * 4]} />
              )}

              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '3 3' }}
                wrapperStyle={{ outline: 'none' }}
                content={(props: TooltipProps<number, string>) => (
                  <ChartTooltip {...props} period={period} mode={mode} />
                )}
              />

              {liveQuote && chartPoints.length > 0 && (
                <>
                  <ReferenceDot
                    yAxisId="price"
                    x={chartPoints[chartPoints.length - 1].date}
                    y={
                      mode === 'return'
                        ? chartPoints[chartPoints.length - 1].returnPercent
                        : chartPoints[chartPoints.length - 1].price
                    }
                    r={7}
                    fill={lineColor}
                    fillOpacity={0.18}
                    stroke="none"
                    ifOverflow="extendDomain"
                  />
                  <ReferenceDot
                    yAxisId="price"
                    x={chartPoints[chartPoints.length - 1].date}
                    y={
                      mode === 'return'
                        ? chartPoints[chartPoints.length - 1].returnPercent
                        : chartPoints[chartPoints.length - 1].price
                    }
                    r={3.5}
                    fill={lineColor}
                    stroke="#0f172a"
                    strokeWidth={2}
                    ifOverflow="extendDomain"
                  />
                </>
              )}

              {mode !== 'return' &&
                previousClose !== null &&
                period === '1d' && (
                  <ReferenceLine
                    yAxisId="price"
                    y={previousClose}
                    stroke="rgba(255,255,255,0.22)"
                    strokeDasharray="4 4"
                  />
                )}

              {mode === 'return' && (
                <ReferenceLine
                  yAxisId="price"
                  y={0}
                  stroke="rgba(255,255,255,0.25)"
                  strokeDasharray="4 4"
                />
              )}

              {(mode === 'area' || mode === 'volume') && (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="url(#chartPriceGradient)"
                  fillOpacity={mode === 'volume' ? 0.55 : 1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
                  isAnimationActive={false}
                  connectNulls
                />
              )}

              {mode === 'volume' && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  isAnimationActive={false}
                  maxBarSize={12}
                  radius={[2, 2, 0, 0]}
                  opacity={0.55}
                >
                  {chartPoints.map((point) => (
                    <Cell
                      key={`volume-${point.timestamp}`}
                      fill={point.close >= point.open ? UP_COLOR : DOWN_COLOR}
                    />
                  ))}
                </Bar>
              )}

              {mode === 'candles' && (
                <Bar
                  yAxisId="price"
                  dataKey="range"
                  fill="transparent"
                  isAnimationActive={false}
                  maxBarSize={18}
                  shape={(props: unknown) => (
                    <CandleShape {...(props as CandleShapeProps)} />
                  )}
                />
              )}

              {mode === 'return' && (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="returnPercent"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="url(#chartReturnGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
                  isAnimationActive={false}
                />
              )}

              {showSMA && mode !== 'return' && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma50"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/45">
        <LegendDot
          color={lineColor}
          label={
            mode === 'return'
              ? 'Period return'
              : mode === 'candles'
                ? 'Period trend'
                : 'Price'
          }
        />
        {mode === 'candles' && (
          <>
            <LegendDot color={UP_COLOR} label="Up candle" />
            <LegendDot color={DOWN_COLOR} label="Down candle" />
          </>
        )}
        {showSMA && mode !== 'return' && (
          <>
            <LegendDot color="#38bdf8" label="SMA 20" />
            <LegendDot color="#f59e0b" label="SMA 50" dashed />
          </>
        )}
        {mode === 'volume' && (
          <>
            <LegendDot color={UP_COLOR} label="Up volume" />
            <LegendDot color={DOWN_COLOR} label="Down volume" />
          </>
        )}
        {mode === 'return' && (
          <LegendDot color="rgba(255,255,255,0.3)" label="0% line" dashed />
        )}
        {period === '1d' && previousClose !== null && mode !== 'return' && (
          <LegendDot color="rgba(255,255,255,0.3)" label="Prev close" dashed />
        )}
      </div>
    </motion.div>
  );
}
