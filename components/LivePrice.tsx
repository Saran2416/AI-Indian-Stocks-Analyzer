'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface LivePriceProps {
  value: number;
  prefix?: string;
  fractionDigits?: number;
  className?: string;
}

type PriceDirection = 'up' | 'down' | 'flat';

/**
 * Renders a price with a short green/red flash when the value ticks up or down.
 * The number itself always comes from live data; no interpolated values are shown.
 */
export default function LivePrice({
  value,
  prefix = '₹',
  fractionDigits = 2,
  className = '',
}: LivePriceProps) {
  const previousValue = useRef(value);
  const [direction, setDirection] = useState<PriceDirection>('flat');
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (value === previousValue.current) return;

    const nextDirection: PriceDirection =
      value > previousValue.current ? 'up' : 'down';
    previousValue.current = value;
    setDirection(nextDirection);
    setPulseKey((key) => key + 1);

    const timer = setTimeout(() => setDirection('flat'), 700);
    return () => clearTimeout(timer);
  }, [value]);

  const colorClass =
    direction === 'up'
      ? 'text-green-400'
      : direction === 'down'
        ? 'text-red-400'
        : 'text-white';

  return (
    <motion.span
      key={pulseKey}
      initial={{ scale: 1.06 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-block tabular-nums transition-colors duration-500 ${colorClass} ${className}`}
    >
      {prefix}
      {value.toLocaleString('en-IN', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })}
    </motion.span>
  );
}
