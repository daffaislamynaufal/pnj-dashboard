'use client';

import React, { useState } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { User, Server, Bot, Download, Upload, Trash2, LogOut, ShieldCheck, CheckCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { useRouter } from 'next/navigation';
import { MOODLE_BASE_URL, AI_ROUTER_CONFIG } from '@/lib/moodle/config';

export default function SettingsPage() {
  const user = useLiveQuery(() => db.users.toCollection().first());
  const syncMeta = useLiveQuery(() => db.sync_metadata.get('latest'));
  const router = useRouter();
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch('/api/moodle/auth/logout', { method: 'POST' });
    await db.delete();
    window.location.href = '/login';
  };

  const handleExportJSON = async () => {
    const backup = {
      users: await db.users.toArray(),
      courses: await db.courses.toArray(),
      assignments: await db.assignments.toArray(),
      quizzes: await db.quizzes.toArray(),
      calendar_events: await db.calendar_events.toArray(),
      personal_events: await db.personal_events.toArray(),
      announcements: await db.announcements.toArray(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnj-academic-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMessage('Data berhasil diekspor sebagai file JSON.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.personal_events?.length > 0) {
          await db.personal_events.bulkPut(json.personal_events);
        }
        if (json.assignments?.length > 0) {
          await db.assignments.bulkPut(json.assignments);
        }
        setExportMessage('Data berhasil diimpor kembali ke IndexedDB.');
      } catch {
        setExportMessage('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh cache lokal IndexedDB?')) {
      await db.courses.clear();
      await db.assignments.clear();
      await db.quizzes.clear();
      await db.calendar_events.clear();
      await db.announcements.clear();
      await db.notifications.clear();
      alert('Cache lokal berhasil dibersihkan.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Pengaturan & Data</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Kelola profil, integrasi Moodle, AI Router, dan backup data lokal
        </p>
      </div>

      {exportMessage && (
        <div style={{ backgroundColor: 'var(--color-green-light)', border: '2px solid var(--color-green)', padding: '0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
          ✅ {exportMessage}
        </div>
      )}

      {/* Account Info */}
      <NeoCard style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <User size={20} color="var(--color-orange)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>Akun Mahasiswa</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, display: 'block', fontSize: '0.78rem' }}>Nama Lengkap</span>
            <span style={{ fontWeight: 900 }}>{user?.fullname || 'Mahasiswa PNJ'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, display: 'block', fontSize: '0.78rem' }}>NIM</span>
            <span style={{ fontWeight: 900 }}>{user?.nim || '-'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, display: 'block', fontSize: '0.78rem' }}>Jurusan / Institusi</span>
            <span style={{ fontWeight: 900 }}>Politeknik Negeri Jakarta</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, display: 'block', fontSize: '0.78rem' }}>Tier Sinkronisasi Aktif</span>
            <span style={{ fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-green)' }}>
              {syncMeta?.tierUsed || 'Level 2 (AJAX/REST)'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: 'var(--border-thin)' }}>
          <NeoButton variant="danger" onClick={handleLogout} style={{ fontSize: '0.85rem' }}>
            <LogOut size={16} /> Keluar dari Akun (Logout)
          </NeoButton>
        </div>
      </NeoCard>

      {/* Moodle & 9Router Integration Status */}
      <NeoCard style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Server size={20} color="var(--color-blue)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>Koneksi & Integrasi Sistem</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: 'var(--border-thin)' }}>
            <div>
              <div style={{ fontWeight: 900 }}>PNJ Moodle Source URL</div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{MOODLE_BASE_URL}</span>
            </div>
            <span style={{ color: 'var(--color-green)', fontWeight: 900, fontSize: '0.8rem' }}>ONLINE</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: 'var(--border-thin)' }}>
            <div>
              <div style={{ fontWeight: 900 }}>AI Gateway (DeepSeek Free API)</div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>https://api.azbry.com/api/ai/deepseek (Gratis / Free)</span>
            </div>
            <span style={{ color: 'var(--color-green)', fontWeight: 900, fontSize: '0.8rem' }}>AKTIF & GRATIS</span>
          </div>
        </div>
      </NeoCard>

      {/* Local Data & Backup */}
      <NeoCard style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Download size={20} color="var(--color-green)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>Backup & Manajemen Data Lokal</h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
          Data disimpan secara lokal di browser Anda (IndexedDB Dexie). Anda dapat mencadangkan jadwal agenda pribadi dan data tugas dalam format JSON.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <NeoButton variant="secondary" onClick={handleExportJSON} style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Ekspor Data (JSON)
          </NeoButton>

          <label className="neo-btn" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
            <Upload size={16} /> Impor Data (JSON)
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>

          <NeoButton variant="danger" onClick={handleClearCache} style={{ fontSize: '0.85rem' }}>
            <Trash2 size={16} /> Bersihkan Cache Lokal
          </NeoButton>
        </div>
      </NeoCard>
    </div>
  );
}
