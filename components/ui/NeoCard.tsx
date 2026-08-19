'use client';

import React from 'react';

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
}

export function NeoCard({ children, interactive = false, className = '', ...props }: NeoCardProps) {
  return (
    <div
      className={`neo-card ${interactive ? 'neo-card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
