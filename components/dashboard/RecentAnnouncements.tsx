'use client';

import React from 'react';
import Link from 'next/link';
import { Megaphone, ExternalLink } from 'lucide-react';
import { NeoCard } from '../ui/NeoCard';
import { EmptyState } from '../ui/EmptyState';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';

export function RecentAnnouncements() {
  const announcements = useLiveQuery(() => db.announcements.toArray()) || [];

  return (
    <NeoCard style={{ height: '100%', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Megaphone size={20} color="var(--color-blue)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Pengumuman Kampus</h3>
        </div>
        <Link href="/announcements" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-orange)' }}>
            Lihat Semua ➔
          </span>
        </Link>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          emoji="📢"
          title="Belum ada pengumuman baru."
          description="Pengumuman e-learning dan perkuliahan PNJ akan tampil di sini."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {announcements.slice(0, 3).map((ann) => (
            <div
              key={ann.id}
              style={{
                padding: '0.75rem 0.85rem',
                border: 'var(--border-thin)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-main)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <h5 style={{ fontSize: '0.92rem', fontWeight: 900 }}>{ann.title}</h5>
                {ann.url && (
                  <a href={ann.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.4',
                }}
              >
                {ann.content}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                <span>{ann.author || 'Admin PNJ'}</span>
                <span>{ann.publishedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </NeoCard>
  );
}
