'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { NeoCard } from '../ui/NeoCard';
import { NeoBadge } from '../ui/NeoBadge';
import { LiveCountdown } from '../ui/LiveCountdown';
import { EmptyState } from '../ui/EmptyState';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { calculatePriority, formatIndonesianDate } from '@/lib/utils/priority';
import { Assignment } from '@/types/app';

export function PriorityTaskList() {
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];

  const pendingAssignments = assignments
    .filter(a => a.status !== 'submitted' && a.status !== 'graded')
    .map(a => ({ ...a, priority: calculatePriority(a.dueDate) }))
    .sort((a, b) => {
      const order = { critical: 1, urgent: 2, upcoming: 3, safe: 4, overdue: 0 };
      return (order[a.priority] ?? 5) - (order[b.priority] ?? 5);
    });

  const handleMarkSubmitted = async (id: string) => {
    await db.assignments.update(id, { status: 'submitted', submittedAt: new Date().toISOString() });
  };

  return (
    <NeoCard style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Tugas Prioritas Hari Ini</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Diurutkan berdasarkan urgensi deadline Moodle
          </p>
        </div>
        <Link href="/assignments" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-orange)' }}>
            Lihat Semua ({pendingAssignments.length}) ➔
          </span>
        </Link>
      </div>

      {pendingAssignments.length === 0 ? (
        <EmptyState
          emoji="🎉"
          title="Tidak ada tugas yang harus dikerjakan."
          description="Semua tugas Moodle sudah diserahkan atau belum ada tugas aktif baru."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pendingAssignments.slice(0, 5).map((assign) => (
            <div
              key={assign.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-thin)',
                backgroundColor: 'var(--bg-main)',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <LiveCountdown dueDate={assign.dueDate} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {assign.courseName}
                  </span>
                </div>
                <h4
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {assign.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Tenggat: {formatIndonesianDate(assign.dueDate)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleMarkSubmitted(assign.id)}
                  title="Tandai Selesai"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: 'var(--border-thin)',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle size={18} color="var(--color-green)" />
                </button>
                <a
                  href={assign.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: 'var(--color-orange)',
                    color: '#FFF',
                    border: 'var(--border-thin)',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}
                  title="Buka di E-Learning PNJ"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </NeoCard>
  );
}
