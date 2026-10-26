'use client';

import { useEffect, useState } from 'react';

interface LiveClockProps {
  className?: string;
  showDate?: boolean;
}

function formatIST(date: Date, showDate: boolean): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...(showDate ? { dateStyle: 'medium' as const } : {}),
    timeStyle: 'medium',
  });
}

/**
 * A small IST clock that ticks every second. It starts as a placeholder so
 * server and client renders match during hydration.
 */
export default function LiveClock({
  className = '',
  showDate = false,
}: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={className}>
      {now ? formatIST(now, showDate) : '--:--:--'}
    </span>
  );
}
