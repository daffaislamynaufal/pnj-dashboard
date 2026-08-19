'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { SyncEngine } from '@/lib/storage/sync-engine';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const syncMeta = useLiveQuery(() => db.sync_metadata.get('latest'));

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    await SyncEngine.syncAll();
    setIsRetrying(false);
  };

  const isMoodleOffline = syncMeta?.status === 'error';

  if (isOnline && !isMoodleOffline) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-yellow)',
        borderBottom: 'var(--border-thick)',
        color: '#0A0A0A',
        padding: '0.6rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 800,
        fontSize: '0.88rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <WifiOff size={18} />
        <span>
          {!isOnline
            ? 'Koneksi internet terputus — Menampilkan data terakhir dari IndexedDB lokal.'
            : 'PNJ E-Learning sedang offline/tidak dapat dijangkau — Menampilkan data tersimpan.'}
        </span>
      </div>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        style={{
          background: '#0A0A0A',
          color: '#FFFFFF',
          border: '2px solid #000',
          borderRadius: '6px',
          padding: '0.3rem 0.75rem',
          fontSize: '0.8rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
        Coba Lagi
      </button>
    </div>
  );
}
