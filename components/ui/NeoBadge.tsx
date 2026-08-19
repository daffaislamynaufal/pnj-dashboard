'use client';

import React from 'react';
import { PriorityLevel } from '@/types/app';

interface NeoBadgeProps {
  variant?: PriorityLevel | 'default';
  children: React.ReactNode;
  className?: string;
}

export function NeoBadge({ variant = 'default', children, className = '' }: NeoBadgeProps) {
  const getBadgeClass = () => {
    switch (variant) {
      case 'critical':
      case 'overdue':
        return 'neo-badge-critical';
      case 'urgent':
        return 'neo-badge-urgent';
      case 'upcoming':
        return 'neo-badge-upcoming';
      case 'safe':
        return 'neo-badge-safe';
      default:
        return '';
    }
  };

  return (
    <span className={`neo-badge ${getBadgeClass()} ${className}`}>
      {children}
    </span>
  );
}
