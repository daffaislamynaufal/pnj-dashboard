'use client';

import React, { useState, useEffect } from 'react';
import { formatCountdown } from '@/lib/utils/priority';
import { NeoBadge } from './NeoBadge';

interface LiveCountdownProps {
  dueDate: string | null;
}

export function LiveCountdown({ dueDate }: LiveCountdownProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(dueDate));

  useEffect(() => {
    setCountdown(formatCountdown(dueDate));

    // Update every 10 seconds for real-time responsiveness
    const interval = setInterval(() => {
      setCountdown(formatCountdown(dueDate));
    }, 10000);

    return () => clearInterval(interval);
  }, [dueDate]);

  let icon = '⏳ ';
  if (countdown.isOverdue) icon = '⚠️ ';
  else if (!dueDate) icon = '🕒 ';

  return (
    <NeoBadge variant={countdown.priority}>
      {icon}
      {countdown.text}
    </NeoBadge>
  );
}
