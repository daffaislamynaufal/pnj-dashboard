'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Bell, Search, Moon, Sun, Bot, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { SyncEngine } from '@/lib/storage/sync-engine';
import { AIAssistantModal } from '../ui/AIAssistantModal';

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const notifications = useLiveQuery(() => db.notifications.filter(n => !n.isRead).toArray()) || [];
  const syncMeta = useLiveQuery(() => db.sync_metadata.get('latest'));
  const user = useLiveQuery(() => db.users.toCollection().first());

  useEffect(() => {
    const theme = localStorage.getItem('pnj_theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pnj_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('pnj_theme', 'light');
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await SyncEngine.syncAll();
    setIsSyncing(false);
  };

  const handleLogout = async () => {
    await fetch('/api/moodle/auth/logout', { method: 'POST' });
    await db.delete();
    window.location.href = '/login';
  };

  return (
    <>
      <header
        style={{
          borderBottom: 'var(--border-thick)',
          backgroundColor: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="container-app"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            paddingBottom: '0.85rem',
          }}
        >
          {/* Logo / Branding */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: 'var(--color-orange)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.25rem',
                border: 'var(--border-thick)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              PNJ
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
                ACADEMIC OS
              </h1>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                E-Learning Integration
              </span>
            </div>
          </Link>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Global Search Shortcut (Desktop) */}
            <button
              onClick={onOpenSearch}
              className="neo-card"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
              }}
              id="desktop-search-btn"
            >
              <Search size={16} />
              <span>Cari (Ctrl + K)</span>
            </button>

            {/* AI Assistant Button */}
            <NeoButton
              variant="primary"
              onClick={() => setShowAIModal(true)}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              title="Tanya AI Study Assistant (9Router)"
            >
              <Bot size={18} />
              <span>AI Assistant</span>
            </NeoButton>

            {/* Sync Button */}
            <NeoButton
              variant="secondary"
              onClick={handleSync}
              disabled={isSyncing}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              title="Sinkronisasi data Moodle terbaru"
            >
              <RefreshCw size={17} className={isSyncing ? 'animate-spin' : ''} />
              <span style={{ display: 'none' }}>Sync</span>
            </NeoButton>

            {/* Notification Bell */}
            <Link href="/notifications" style={{ textDecoration: 'none' }}>
              <button
                className="neo-btn"
                style={{
                  padding: '0.5rem 0.75rem',
                  position: 'relative',
                  backgroundColor: 'var(--bg-card)',
                }}
                title="Notifikasi"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'var(--color-red)',
                      color: '#FFF',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #000',
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="neo-btn"
              style={{ padding: '0.5rem 0.75rem' }}
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* AI Assistant Modal */}
      <AIAssistantModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
    </>
  );
}
