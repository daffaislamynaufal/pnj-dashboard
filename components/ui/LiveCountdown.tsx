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
    // Update every 30 seconds
    const interval = setInterval(() => {
      setCountdown(formatCountdown(dueDate));
    }, 30000);

    return () => clearInterval(interval);
  }, [dueDate]);

  return (
    <NeoBadge variant={countdown.priority}>
      {countdown.isOverdue ? '⚠️ ' : '⏳ '}
      {countdown.text}
    </NeoBadge>
  );
}
