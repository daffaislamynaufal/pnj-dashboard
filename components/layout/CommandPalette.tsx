'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Calendar, CheckSquare, BookOpen, RefreshCw, Moon, Sun, LogOut, X, ArrowRight } from 'lucide-react';
import { NeoCard } from '../ui/NeoCard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { SyncEngine } from '@/lib/storage/sync-engine';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];
  const announcements = useLiveQuery(() => db.announcements.toArray()) || [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.courseCode.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    (a.courseName && a.courseName.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 4);

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleSync = async () => {
    onClose();
    await SyncEngine.syncAll();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
      onClick={onClose}
    >
      <div style={{ width: '100%', maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <NeoCard style={{ padding: 0, overflow: 'hidden' }}>
          {/* Search Input Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              borderBottom: 'var(--border-thick)',
              backgroundColor: 'var(--bg-card)',
              gap: '0.75rem',
            }}
          >
            <Search size={22} color="var(--color-orange)" />
            <input
              type="text"
              placeholder="Ketik untuk mencari tugas, mata kuliah, atau perintah..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Results List */}
          <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0.75rem' }}>
            {/* Quick Actions */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>
                Navigasi Cepat
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                <button
                  onClick={() => handleNavigate('/')}
                  className="neo-btn"
                  style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LayoutDashboard size={16} />
                    <span>Dashboard Utama</span>
                  </div>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => handleNavigate('/assignments')}
                  className="neo-btn"
                  style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={16} />
                    <span>Semua Tugas & Deadline</span>
                  </div>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => handleNavigate('/calendar')}
                  className="neo-btn"
                  style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} />
                    <span>Kalender Akademik</span>
                  </div>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={handleSync}
                  className="neo-btn"
                  style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={16} color="var(--color-orange)" />
                    <span>Sinkronisasi Data Moodle Sekarang</span>
                  </div>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Assignments Search Results */}
            {filteredAssignments.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>
                  Tugas ({filteredAssignments.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                  {filteredAssignments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleNavigate('/assignments')}
                      className="neo-btn"
                      style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%', textAlign: 'left' }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{a.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.courseName}</div>
                      </div>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Courses Search Results */}
            {filteredCourses.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>
                  Mata Kuliah ({filteredCourses.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                  {filteredCourses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleNavigate('/courses')}
                      className="neo-btn"
                      style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%', textAlign: 'left' }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.courseCode}</div>
                      </div>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
