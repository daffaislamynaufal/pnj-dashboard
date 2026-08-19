'use client';

import React from 'react';
import { NeoCard } from './NeoCard';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = '🎉', title, description, action }: EmptyStateProps) {
  return (
    <NeoCard className="text-center py-10 flex flex-col items-center justify-center border-dashed">
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{emoji}</div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', marginBottom: '1rem' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </NeoCard>
  );
}
