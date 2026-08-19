'use client';

import React from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { HelpCircle, ExternalLink, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { formatIndonesianDate } from '@/lib/utils/priority';

export default function QuizzesPage() {
  const quizzes = useLiveQuery(() => db.quizzes.toArray()) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Quiz & Evaluasi</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Jadwal kuis, ujian daring, dan evaluasi berkala Moodle
          </p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          emoji="🎉"
          title="Tidak ada quiz aktif saat ini."
          description="Belum ada evaluasi kuis terbuka yang dijadwalkan oleh dosen di E-Learning PNJ."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {quizzes.map(q => (
            <NeoCard key={q.id} interactive style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span
                    style={{
                      backgroundColor: 'var(--color-purple)',
                      color: '#FFF',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      border: '1.5px solid #000',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      display: 'inline-block',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {q.courseName || 'Quiz Moodle'}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '0.35rem' }}>
                    {q.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {q.openTime && <span>Buka: {formatIndonesianDate(q.openTime)}</span>}
                    {q.closeTime && <span>Tutup: {formatIndonesianDate(q.closeTime)}</span>}
                  </div>
                </div>

                <a
                  href={q.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn neo-btn-primary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                >
                  Buka Quiz di Moodle <ExternalLink size={15} />
                </a>
              </div>
            </NeoCard>
          ))}
        </div>
      )}
    </div>
  );
}
