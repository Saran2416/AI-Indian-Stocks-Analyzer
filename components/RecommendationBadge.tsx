'use client';

import { motion } from 'framer-motion';

interface RecommendationBadgeProps {
  recommendation: 'BUY' | 'HOLD' | 'AVOID';
  score: number;
}

export default function RecommendationBadge({ recommendation, score }: RecommendationBadgeProps) {
  const config = {
    BUY: {
      icon: '✔',
      label: 'BUY',
      color: 'from-green-500/20 to-emerald-500/10',
      border: 'border-green-500/30',
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    HOLD: {
      icon: '⚖',
      label: 'HOLD',
      color: 'from-yellow-500/20 to-amber-500/10',
      border: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    AVOID: {
      icon: '✗',
      label: 'AVOID',
      color: 'from-red-500/20 to-rose-500/10',
      border: 'border-red-500/30',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  };

  const cfg = config[recommendation];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-r ${cfg.color} backdrop-blur-md rounded-2xl border ${cfg.border} p-6 text-center`}
    >
      <motion.div
        className={`text-5xl mb-3 ${cfg.textColor}`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {cfg.icon}
      </motion.div>
      <h4 className={`text-2xl font-bold ${cfg.textColor} mb-1`}>
        {cfg.label}
      </h4>
      <p className="text-white/60 text-sm">
        {recommendation === 'BUY' && 'Strong buy signal with positive market indicators'}
        {recommendation === 'HOLD' && 'Monitor closely; wait for clearer direction'}
        {recommendation === 'AVOID' && 'Consider better opportunities elsewhere'}
      </p>
      <motion.div
        className={`mt-4 inline-block px-4 py-2 ${cfg.bgColor} rounded-lg ${cfg.textColor} font-semibold`}
        whileHover={{ scale: 1.05 }}
      >
        Score: {Math.round(score)}/100
      </motion.div>
    </motion.div>
  );
}
