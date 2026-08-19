'use client';

import React from 'react';
import { sound } from '@/lib/utils/sound';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  children: React.ReactNode;
  className?: string;
}

export function NeoButton({
  variant = 'secondary',
  children,
  className = '',
  onClick,
  ...props
}: NeoButtonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'neo-btn-primary';
      case 'danger': return 'neo-btn-danger';
      case 'success': return 'neo-btn-success';
      default: return '';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.playClick();
    if (onClick) onClick(e);
  };

  return (
    <button
      className={`neo-btn ${getVariantClass()} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
