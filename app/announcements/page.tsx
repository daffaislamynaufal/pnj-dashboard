'use client';

import React from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Megaphone, ExternalLink, User, Calendar } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';

export default function AnnouncementsPage() {
  const announcements = useLiveQuery(() => db.announcements.toArray()) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Pengumuman Kampus & E-Learning</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Informasi resmi seputar perkuliahan, pembaruan sistem Moodle, dan akademik PNJ
        </p>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          emoji="📢"
          title="Belum ada pengumuman baru."
          description="Semua pengumuman resmi E-Learning PNJ akan tampil secara otomatis di sini."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map(ann => (
            <NeoCard key={ann.id} interactive style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '0.4rem' }}>
                    {ann.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={14} /> {ann.author || 'Admin PNJ'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> {ann.publishedAt}
                    </span>
                  </div>
                </div>

                {ann.url && (
                  <a
                    href={ann.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-btn"
                    style={{ padding: '0.4rem 0.75rem' }}
                    title="Buka Forum di Moodle"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                {ann.content}
              </p>
            </NeoCard>
          ))}
        </div>
      )}
    </div>
  );
}
