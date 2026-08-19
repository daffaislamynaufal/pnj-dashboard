'use client';

import React from 'react';
import { NeoCard } from '../ui/NeoCard';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { formatIndonesianDate } from '@/lib/utils/priority';
import { EmptyState } from '../ui/EmptyState';

export function TodayAgenda() {
  const events = useLiveQuery(() => db.calendar_events.toArray()) || [];
  const personalEvents = useLiveQuery(() => db.personal_events.toArray()) || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const todayEvents = [
    ...events.filter(e => e.startTime.startsWith(todayStr)),
    ...personalEvents.filter(p => p.date === todayStr).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      startTime: `${p.date}T${p.startTime}:00`,
      type: 'personal' as const,
      source: 'personal' as const,
    })),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <NeoCard style={{ height: '100%', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={20} color="var(--color-orange)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Agenda Hari Ini</h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
        </span>
      </div>

      {todayEvents.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="Belum ada agenda hari ini."
          description="Jadwal kelas, quiz, atau kegiatan personal hari ini kosong."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {todayEvents.map((e) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.85rem',
                border: 'var(--border-thin)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-main)',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--color-yellow)',
                  border: '1.5px solid #000',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                }}
              >
                {e.startTime.split('T')[1]?.slice(0, 5) || 'WIB'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h5 style={{ fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.title}
                </h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {e.source === 'personal' ? 'Kegiatan Pribadi' : 'Moodle E-Learning'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </NeoCard>
  );
}
