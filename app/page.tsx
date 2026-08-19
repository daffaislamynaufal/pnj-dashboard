'use client';

import React, { useEffect, useState } from 'react';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { PriorityTaskList } from '@/components/dashboard/PriorityTaskList';
import { TodayAgenda } from '@/components/dashboard/TodayAgenda';
import { RecentAnnouncements } from '@/components/dashboard/RecentAnnouncements';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { Sparkles, ArrowRight, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const user = useLiveQuery(() => db.users.toCollection().first());
  const syncMeta = useLiveQuery(() => db.sync_metadata.get('latest'));

  useEffect(() => {
    // Check if authenticated
    fetch('/api/moodle/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          // If not authenticated and no cached user, redirect to login
          db.users.count().then(count => {
            if (count === 0) {
              router.push('/login');
            }
          });
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Welcome Banner */}
      <NeoCard
        style={{
          backgroundColor: 'var(--color-orange-light)',
          border: 'var(--border-thick)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                backgroundColor: 'var(--color-orange)',
                color: '#FFF',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 900,
                border: '1.5px solid #000',
              }}
            >
              SEMESTER BERJALAN
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              • PNJ E-Learning 5.x
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0A0A0A' }}>
            Halo, {user?.fullname || 'Mahasiswa PNJ'}! 👋
          </h2>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4A4A4A', marginTop: '0.2rem' }}>
            {syncMeta?.lastSyncTime
              ? `Data tersinkronisasi terakhir: ${new Date(syncMeta.lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
              : 'Selamat datang di Personal Academic Operating System PNJ.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <NeoButton
            variant="primary"
            onClick={() => router.push('/assignments')}
            style={{ fontSize: '0.88rem' }}
          >
            Mulai Kerjakan Tugas <ArrowRight size={16} />
          </NeoButton>
        </div>
      </NeoCard>

      {/* Quick Statistics */}
      <StatGrid />

      {/* Priority Tasks List */}
      <PriorityTaskList />

      {/* 2-Column Section: Today's Agenda + Campus Announcements */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <TodayAgenda />
        <RecentAnnouncements />
      </div>
    </div>
  );
}
