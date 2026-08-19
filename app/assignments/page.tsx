'use client';

import React, { useState } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoBadge } from '@/components/ui/NeoBadge';
import { LiveCountdown } from '@/components/ui/LiveCountdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { SetDeadlineModal } from '@/components/assignments/SetDeadlineModal';
import { Search, Filter, CheckCircle, ExternalLink, RefreshCw, Calendar, BookOpen, Clock, Edit3 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { calculatePriority, formatIndonesianDate } from '@/lib/utils/priority';
import { Assignment, AssignmentStatus } from '@/types/app';
import { SyncEngine } from '@/lib/storage/sync-engine';

export default function AssignmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'title'>('deadline');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedAssignmentForDeadline, setSelectedAssignmentForDeadline] = useState<Assignment | null>(null);

  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];
  const courses = useLiveQuery(() => db.courses.toArray()) || [];

  const handleToggleStatus = async (id: string, currentStatus: AssignmentStatus) => {
    const nextStatus = currentStatus === 'submitted' ? 'pending' : 'submitted';
    await db.assignments.update(id, {
      status: nextStatus,
      submittedAt: nextStatus === 'submitted' ? new Date().toISOString() : null,
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await SyncEngine.syncAll();
    setIsSyncing(false);
  };

  // Filter & Sort
  const filteredAssignments = assignments
    .map(a => ({ ...a, priority: calculatePriority(a.dueDate) }))
    .filter(a => {
      const matchSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.courseName && a.courseName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? a.status === 'pending' || a.status === 'new'
          : a.status === statusFilter;

      const matchCourse = courseFilter === 'all' || String(a.courseId) === courseFilter;

      return matchSearch && matchStatus && matchCourse;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { critical: 1, urgent: 2, upcoming: 3, safe: 4, overdue: 0 };
        return (order[a.priority] ?? 5) - (order[b.priority] ?? 5);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Default: deadline
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Semua Tugas & Deadline</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Pantau dan kelola semua tugas e-learning PNJ dari satu tempat
          </p>
        </div>
        <NeoButton variant="secondary" onClick={handleSync} disabled={isSyncing}>
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          Sinkronisasi Moodle
        </NeoButton>
      </div>

      {/* Filter & Search Bar */}
      <NeoCard style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari judul tugas atau mata kuliah..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="neo-input"
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Course Select Filter */}
          <div style={{ flex: 1, minWidth: '180px' }}>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="neo-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="all">Semua Mata Kuliah</option>
              {courses.map(c => (
                <option key={c.id} value={String(c.sourceId)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div style={{ flex: 1, minWidth: '160px' }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="neo-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="deadline">Urutkan: Deadline Terdekat</option>
              <option value="priority">Urutkan: Urgensi Prioritas</option>
              <option value="title">Urutkan: Judul (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Semua', val: 'all' },
            { label: 'Belum Selesai', val: 'pending' },
            { label: 'Sudah Dikirim', val: 'submitted' },
            { label: 'Sudah Dinilai', val: 'graded' },
            { label: 'Terlewat (Overdue)', val: 'overdue' },
          ].map(chip => (
            <button
              key={chip.val}
              onClick={() => setStatusFilter(chip.val as any)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: 'var(--border-thin)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: statusFilter === chip.val ? 'var(--color-orange)' : 'var(--bg-main)',
                color: statusFilter === chip.val ? '#FFF' : 'var(--text-main)',
                boxShadow: statusFilter === chip.val ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </NeoCard>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Tidak ada tugas yang sesuai."
          description="Coba ubah kata kunci pencarian atau reset filter di atas."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredAssignments.map(assign => (
            <NeoCard key={assign.id} interactive style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <LiveCountdown dueDate={assign.dueDate} />
                    <span
                      style={{
                        backgroundColor: 'var(--bg-muted)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {assign.courseName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color:
                          assign.status === 'submitted'
                            ? 'var(--color-green)'
                            : assign.status === 'graded'
                            ? 'var(--color-blue)'
                            : 'var(--text-muted)',
                      }}
                    >
                      • Status: {assign.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '0.35rem' }}>
                    {assign.title}
                  </h3>

                  {assign.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                      {assign.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>Tenggat: {formatIndonesianDate(assign.dueDate)}</span>
                    
                    <button
                      onClick={() => setSelectedAssignmentForDeadline(assign)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-orange)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        textDecoration: 'underline',
                      }}
                    >
                      <Edit3 size={13} />
                      {assign.dueDate ? 'Ubah Tenggat' : 'Atur Tenggat & Countdown'}
                    </button>

                    {assign.grade !== null && (
                      <span style={{ color: 'var(--color-green)', fontWeight: 900 }}>
                        Nilai: {assign.grade} / {assign.maxGrade}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <NeoButton
                    variant={assign.status === 'submitted' ? 'secondary' : 'primary'}
                    onClick={() => handleToggleStatus(assign.id, assign.status)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    <CheckCircle size={16} />
                    {assign.status === 'submitted' ? 'Batal Kirim' : 'Tandai Selesai'}
                  </NeoButton>

                  <a
                    href={assign.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-btn"
                    style={{ padding: '0.45rem 0.75rem' }}
                    title="Buka Halaman Tugas di E-Learning PNJ"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
      )}

      {/* Set Deadline Modal */}
      <SetDeadlineModal
        isOpen={!!selectedAssignmentForDeadline}
        onClose={() => setSelectedAssignmentForDeadline(null)}
        assignment={selectedAssignmentForDeadline}
      />
    </div>
  );
}
