'use client';

import React, { useState } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, User, CheckSquare, HelpCircle, ExternalLink, Search, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { SyncEngine } from '@/lib/storage/sync-engine';

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];

  const handleSync = async () => {
    setIsSyncing(true);
    await SyncEngine.syncAll();
    setIsSyncing(false);
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Mata Kuliah Terdaftar</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Daftar mata kuliah aktif semester berjalan di E-Learning PNJ
          </p>
        </div>
        <NeoButton variant="secondary" onClick={handleSync} disabled={isSyncing}>
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          Perbarui Matkul
        </NeoButton>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Cari mata kuliah atau kode matkul..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="neo-input"
          style={{ paddingLeft: '2.5rem' }}
        />
        <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="Tidak ada mata kuliah yang ditemukan."
          description="Pastikan Anda sudah login ke akun E-Learning PNJ Anda."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredCourses.map(course => {
            const courseAssignments = assignments.filter(a => String(a.courseId) === String(course.sourceId));
            const pendingCount = courseAssignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').length;

            return (
              <NeoCard key={course.id} interactive style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--color-yellow)',
                        color: '#0A0A0A',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        border: '1.5px solid #000',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                      }}
                    >
                      {course.courseCode}
                    </span>
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neo-btn"
                      style={{ padding: '0.35rem 0.6rem' }}
                      title="Buka Halaman Matkul di Moodle"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: '1.3' }}>
                    {course.name}
                  </h3>

                  {course.teacher && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem' }}>
                      <User size={15} />
                      <span>{course.teacher}</span>
                    </div>
                  )}

                  {/* Progress bar if available */}
                  {course.progress !== null && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        <span>Progress Belajar</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--bg-muted)',
                          borderRadius: '999px',
                          border: '1.5px solid #000',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${course.progress}%`,
                            height: '100%',
                            backgroundColor: 'var(--color-green)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer stats */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: 'var(--border-thin)',
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckSquare size={16} color="var(--color-orange)" />
                    <span>{courseAssignments.length} Tugas ({pendingCount} aktif)</span>
                  </div>
                </div>
              </NeoCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
