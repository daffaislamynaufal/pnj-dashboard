'use client';

import React, { useState, useEffect } from 'react';
import '@/styles/globals.css';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { usePathname } from 'next/navigation';
import { SyncEngine } from '@/lib/storage/sync-engine';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    // Initial background sync check if logged in
    if (!isLoginPage) {
      SyncEngine.syncAll().catch(() => {});
    }
  }, [isLoginPage]);

  return (
    <html lang="id">
      <head>
        <title>PNJ Academic Dashboard | E-Learning Integration</title>
        <meta name="description" content="Personal Academic Operating System for Politeknik Negeri Jakarta Students" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body>
        <OfflineBanner />

        {!isLoginPage && <Header onOpenSearch={() => setIsSearchOpen(true)} />}

        <main className={!isLoginPage ? 'container-app' : ''}>
          {!isLoginPage ? (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              {/* Desktop Sidebar (hidden on mobile via CSS) */}
              <div id="desktop-sidebar-container">
                <Sidebar />
              </div>

              {/* Main Content Area */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {children}
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {!isLoginPage && <BottomNav />}
        <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </body>
    </html>
  );
}
