'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, BookOpen, MoreHorizontal } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';

export function BottomNav() {
  const pathname = usePathname();
  const pendingAssignments = useLiveQuery(() => db.assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').count()) || 0;

  const tabs = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Tugas', href: '/assignments', icon: CheckSquare, badge: pendingAssignments },
    { label: 'Kalender', href: '/calendar', icon: CalendarIcon },
    { label: 'Matkul', href: '/courses', icon: BookOpen },
    { label: 'Lainnya', href: '/settings', icon: MoreHorizontal },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-card)',
        borderTop: 'var(--border-thick)',
        zIndex: 90,
        boxShadow: '0 -4px 0px rgba(0,0,0,0.1)',
        padding: '0.4rem 0.5rem',
        justifyContent: 'space-around',
      }}
      id="mobile-bottom-nav"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              position: 'relative',
              backgroundColor: isActive ? 'var(--color-orange)' : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--text-main)',
              border: isActive ? 'var(--border-thick)' : '2px solid transparent',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '2px' }}>{tab.label}</span>
            {tab.badge && tab.badge > 0 && !isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '12px',
                  backgroundColor: 'var(--color-red)',
                  color: '#FFF',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #000',
                }}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
