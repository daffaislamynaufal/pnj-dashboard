'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  HelpCircle,
  Megaphone,
  Bell,
  Settings as SettingsIcon,
  GraduationCap,
} from 'lucide-react';
import { NeoCard } from '../ui/NeoCard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Kalender', href: '/calendar', icon: CalendarIcon },
  { label: 'Tugas', href: '/assignments', icon: CheckSquare },
  { label: 'Mata Kuliah', href: '/courses', icon: BookOpen },
  { label: 'Quiz', href: '/quizzes', icon: HelpCircle },
  { label: 'Pengumuman', href: '/announcements', icon: Megaphone },
  { label: 'Notifikasi', href: '/notifications', icon: Bell },
  { label: 'Pengaturan', href: '/settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useLiveQuery(() => db.users.toCollection().first());
  const pendingCount = useLiveQuery(() => db.assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').count()) || 0;

  return (
    <aside style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Student Profile Mini-card */}
      <NeoCard style={{ padding: '1rem', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-yellow)',
              border: 'var(--border-thick)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.1rem',
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontWeight: 900, fontSize: '0.92rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.fullname || 'Mahasiswa PNJ'}
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              NIM: {user?.nim || 'Terhubung'}
            </span>
          </div>
        </div>
      </NeoCard>

      {/* Navigation List */}
      <NeoCard style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.92rem',
                color: isActive ? '#FFFFFF' : 'var(--text-main)',
                backgroundColor: isActive ? 'var(--color-orange)' : 'transparent',
                border: isActive ? 'var(--border-thick)' : '2px solid transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.1s ease-in-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={18} color={isActive ? '#FFFFFF' : 'var(--text-main)'} />
                <span>{item.label}</span>
              </div>
              {item.label === 'Tugas' && pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: isActive ? '#0A0A0A' : 'var(--color-red)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    border: '1.5px solid #000',
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </NeoCard>
    </aside>
  );
}
