'use client';

import { motion } from 'framer-motion';

interface AIScoreGaugeProps {
  score: number; // 0-100
  recommendation: 'BUY' | 'HOLD' | 'AVOID';
  isLoading?: boolean;
}

export default function AIScoreGauge({ score, recommendation, isLoading = false }: AIScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 71) return '#10b981'; // Green
    if (s >= 41) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRecommendationColor = (rec: string) => {
    const colors = {
      BUY: '#10b981',
      HOLD: '#f59e0b',
      AVOID: '#ef4444',
    };
    return colors[rec as keyof typeof colors] || '#9ca3af';
  };

  const color = getColor(score);

  if (isLoading) {
    return (
      <motion.div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-48 h-48 rounded-full bg-white/10" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center"
    >
      <h3 className="text-lg font-semibold text-white mb-6">AI Analysis Score</h3>

      <motion.div
        className="w-48 h-48 mb-6"
        animate={{ rotateZ: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          {/* Gauge background */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

          {/* Colored segments */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Red zone (0-40) */}
          <path
            d="M 100,20 A 80,80 0 0,1 154.4,20"
            fill="none"
            stroke="rgba(239,68,68,0.2)"
            strokeWidth="8"
          />

          {/* Yellow zone (40-70) */}
          <path
            d="M 154.4,20 A 80,80 0 0,1 180,100"
            fill="none"
            stroke="rgba(245,158,11,0.2)"
            strokeWidth="8"
          />

          {/* Green zone (70-100) */}
          <path
            d="M 180,100 A 80,80 0 0,1 100,180"
            fill="none"
            stroke="rgba(16,185,129,0.3)"
            strokeWidth="8"
          />

          {/* Score arc */}
          <path
            d={getArcPath(score)}
            fill="none"
            stroke={`url(#gaugeGradient)`}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Center circle */}
          <circle cx="100" cy="100" r="60" fill="rgba(51,65,85,0.5)" stroke={`${color}40`} strokeWidth="1" />

          {/* Score text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="text-4xl font-bold"
            fill={color}
            fontSize="48"
            fontWeight="bold"
          >
            {Math.round(score)}
          </text>
          <text
            x="100"
            y="115"
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="14"
          >
            / 100
          </text>
        </svg>
      </motion.div>

      {/* Recommendation Badge */}
      <motion.div
        className="mt-4 px-6 py-3 rounded-full font-semibold text-white text-center"
        style={{ backgroundColor: `${getRecommendationColor(recommendation)}20`, borderColor: getRecommendationColor(recommendation), borderWidth: '2px' }}
        whileHover={{ scale: 1.05 }}
      >
        <div style={{ color: getRecommendationColor(recommendation) }} className="font-bold">
          {recommendation === 'BUY' && '✓ BUY'}
          {recommendation === 'HOLD' && '⚖ HOLD'}
          {recommendation === 'AVOID' && '✗ AVOID'}
        </div>
      </motion.div>

      <p className="text-sm text-white/50 mt-4 text-center">
        Product Recommendation
      </p>
    </motion.div>
  );
}

function getArcPath(score: number): string {
  const percentage = score / 100;
  const radius = 80;
  const startAngle = -Math.PI / 2; // Start at top
  const endAngle = startAngle + percentage * Math.PI; // Go to right (180 degrees max)

  const startX = 100 + radius * Math.cos(startAngle);
  const startY = 100 + radius * Math.sin(startAngle);
  const endX = 100 + radius * Math.cos(endAngle);
  const endY = 100 + radius * Math.sin(endAngle);

  const largeArc = percentage > 0.5 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
}
