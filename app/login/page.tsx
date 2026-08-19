'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { GraduationCap, ShieldCheck, Lock, User, CheckCircle2, Server, ArrowRight } from 'lucide-react';
import { SyncEngine } from '@/lib/storage/sync-engine';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moodleStatus, setMoodleStatus] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Run diagnostics
    fetch('/api/moodle/debug/discover')
      .then(res => res.json())
      .then(data => setMoodleStatus(data))
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/moodle/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login gagal. Periksa kembali NIM dan Password Anda.');
      }

      // Initial Sync
      await SyncEngine.syncAll();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              backgroundColor: 'var(--color-orange)',
              border: 'var(--border-thick)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-main)',
              marginBottom: '0.75rem',
            }}
          >
            <GraduationCap size={36} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
            PNJ ACADEMIC OS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.2rem' }}>
            E-Learning Moodle 5.x Integration
          </p>
        </div>

        {/* Login Box */}
        <NeoCard style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Masuk dengan Akun E-Learning</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Gunakan NIM dan Password resmi https://elearning.pnj.ac.id
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'var(--color-red-light)',
                border: '2px solid var(--color-red)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'var(--color-red)',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: '0.35rem' }}>
                NIM / Username E-Learning *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2107411001"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: '0.35rem' }}>
                Password E-Learning *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <NeoButton
              type="submit"
              variant="primary"
              disabled={loading || !username || !password}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? 'Menghubungkan ke E-Learning...' : 'Masuk ke Dashboard'}
              <ArrowRight size={18} />
            </NeoButton>
          </form>

          {/* Security Guarantee Note */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '8px',
              border: 'var(--border-thin)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldCheck size={20} color="var(--color-green)" />
            <span>
              <strong>Local-First & Aman</strong>: Password tidak pernah disimpan di database atau dibagikan ke pihak ketiga.
            </span>
          </div>
        </NeoCard>

        {/* Live Moodle Server Status */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              backgroundColor: 'var(--bg-card)',
              padding: '0.4rem 0.75rem',
              borderRadius: '999px',
              border: 'var(--border-thin)',
            }}
          >
            <Server size={14} color="var(--color-green)" />
            <span>
              E-Learning Source:{' '}
              <a
                href="https://elearning.pnj.ac.id/"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--color-orange)', textDecoration: 'none' }}
              >
                elearning.pnj.ac.id
              </a>{' '}
              (Moodle 5.x Online)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
