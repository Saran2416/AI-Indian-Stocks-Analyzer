'use client';

import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface PanelProps {
  title: string;
  icon: React.ReactNode;
  score: number;
  reasoning: string;
  details?: string[];
}

function AnalysisPanel({ title, icon, score, reasoning, details }: PanelProps) {
  const scoreColor = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = score >= 70 ? 'bg-green-500/10' : score >= 40 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-accent-400 text-2xl">{icon}</div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <motion.div
          className={`${scoreBg} ${scoreColor} rounded-full w-16 h-16 flex items-center justify-center font-bold text-lg`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Math.round(score)}
        </motion.div>
      </div>

      <p className="text-white/70 text-sm leading-relaxed mb-4">{reasoning}</p>

      {details && details.length > 0 && (
        <div className="space-y-2">
          {details.map((detail, idx) => (
            <motion.div
              key={idx}
              className="flex gap-2 text-sm text-white/60"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <span className="text-accent-400 flex-shrink-0">•</span>
              <span>{detail}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface AnalysisPanelLoaderProps {
  score?: number;
  reasoning?: string;
  isLoading?: boolean;
}

export function FundamentalsPanel({ score = 65, reasoning = '', isLoading = false }: AnalysisPanelLoaderProps) {
  if (isLoading) {
    return <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 h-64 animate-pulse" />;
  }
  return <AnalysisPanel title="Fundamentals" icon={<Briefcase size={24} />} score={score} reasoning={reasoning} />;
}

export function TechnicalPanel({ score = 60, reasoning = '', isLoading = false }: AnalysisPanelLoaderProps) {
  if (isLoading) {
    return <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 h-64 animate-pulse" />;
  }
  return <AnalysisPanel title="Technical Analysis" icon={<TrendingUp size={24} />} score={score} reasoning={reasoning} />;
}

export function SentimentPanel({ score = 55, reasoning = '', isLoading = false }: AnalysisPanelLoaderProps) {
  if (isLoading) {
    return <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 h-64 animate-pulse" />;
  }
  return <AnalysisPanel title="Market Sentiment" icon={<DollarSign size={24} />} score={score} reasoning={reasoning} />;
}

export function RiskPanel({ score = 40, reasoning = '', isLoading = false }: AnalysisPanelLoaderProps) {
  if (isLoading) {
    return <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 h-64 animate-pulse" />;
  }
  return <AnalysisPanel title="Risk Assessment" icon={<AlertCircle size={24} />} score={score} reasoning={reasoning} />;
}
