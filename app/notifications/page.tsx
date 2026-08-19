'use client';

import React from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, CheckCheck, Trash2, CheckSquare, Megaphone, Award, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { formatIndonesianDate } from '@/lib/utils/priority';

export default function NotificationsPage() {
  const notifications = useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray()) || [];

  const handleMarkAllRead = async () => {
    await db.notifications.toCollection().modify({ isRead: true });
  };

  const handleClearAll = async () => {
    await db.notifications.clear();
  };

  const handleToggleRead = async (id: string, current: boolean) => {
    await db.notifications.update(id, { isRead: !current });
  };

  const handleDelete = async (id: string) => {
    await db.notifications.delete(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <CheckSquare size={18} color="var(--color-orange)" />;
      case 'announcement': return <Megaphone size={18} color="var(--color-blue)" />;
      case 'grade': return <Award size={18} color="var(--color-green)" />;
      default: return <Bell size={18} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Pusat Notifikasi</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Pemberitahuan tugas baru, perubahan nilai, dan pengumuman e-learning
          </p>
        </div>

        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <NeoButton variant="secondary" onClick={handleMarkAllRead} style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
              <CheckCheck size={16} /> Tandai Semua Dibaca
            </NeoButton>
            <NeoButton variant="danger" onClick={handleClearAll} style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
              <Trash2 size={16} /> Hapus Semua
            </NeoButton>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="Semua aman."
          description="Belum ada notifikasi baru. Semua update perkuliahan akan otomatis diinfokan di sini."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <NeoCard
              key={n.id}
              interactive
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: n.isRead ? 'var(--bg-card)' : 'var(--color-orange-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1.5px solid #000',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    display: 'flex',
                  }}
                >
                  {getIcon(n.type)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 900 }}>{n.title}</h4>
                    {!n.isRead && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-red)',
                          color: '#FFF',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '999px',
                        }}
                      >
                        BARU
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
                    {formatIndonesianDate(n.createdAt)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={() => handleToggleRead(n.id, n.isRead)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '6px',
                    border: 'var(--border-thin)',
                    backgroundColor: 'var(--bg-card)',
                    cursor: 'pointer',
                  }}
                  title={n.isRead ? 'Tandai Belum Dibaca' : 'Tandai Dibaca'}
                >
                  <CheckCheck size={16} />
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '6px',
                    border: 'var(--border-thin)',
                    backgroundColor: 'var(--bg-card)',
                    cursor: 'pointer',
                    color: 'var(--color-red)',
                  }}
                  title="Hapus Notifikasi"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </NeoCard>
          ))}
        </div>
      )}
    </div>
  );
}
