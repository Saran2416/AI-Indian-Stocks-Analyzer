'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { ChartData } from '@/lib/stocks';

interface StockChartProps {
  data: ChartData[];
  symbol: string;
  isLoading?: boolean;
}

type Period = '1d' | '1w' | '1m' | '1y' | '5y';

export default function StockChart({ data: initialData, symbol, isLoading = false }: StockChartProps) {
  const [period, setPeriod] = useState<Period>('1y');
  const [chartData, setChartData] = useState<ChartData[]>(initialData);
  const [isFetching, setIsFetching] = useState(false);

  const periods: { label: string; value: Period }[] = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' },
  ];

  // Re-fetch chart data whenever the period changes
  useEffect(() => {
    if (!symbol) return;
    setIsFetching(true);
    fetch('/api/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, period }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.length > 0) setChartData(json.data);
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [symbol, period]);

  // Reset to initial data when symbol changes
  useEffect(() => {
    setChartData(initialData);
    setPeriod('1y');
  }, [symbol, initialData]);

  const isUp = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
  const lineColor = isUp ? '#22c55e' : '#ef4444';

  if (isLoading) {
    return (
      <motion.div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Price Chart — {symbol}</h3>
        <div className="flex gap-2">
          {periods.map((p) => (
            <motion.button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              disabled={isFetching}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              } ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="h-80 relative">
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-xl z-10">
            <motion.div
              className="w-8 h-8 border-2 border-accent-500/40 border-t-accent-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
              width={72}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
              }}
              formatter={(value) => {
                const n = typeof value === 'number' ? value : Number(value ?? 0);
                return [`₹${isNaN(n) ? '0.00' : n.toFixed(2)}`, 'Price'];
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
