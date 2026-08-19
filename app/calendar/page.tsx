'use client';

import React, { useState } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoBadge } from '@/components/ui/NeoBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddEventModal } from '@/components/calendar/AddEventModal';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { formatIndonesianDate } from '@/lib/utils/priority';

type CalendarViewMode = 'month' | 'agenda' | 'day';

interface UnifiedCalendarItem {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: string;
  source: 'moodle' | 'personal';
  courseName?: string;
  location?: string;
  color: string;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('agenda');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const moodleEvents = useLiveQuery(() => db.calendar_events.toArray()) || [];
  const personalEvents = useLiveQuery(() => db.personal_events.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];

  // Combine Moodle events, personal events, and assignments with due dates
  const allEvents: UnifiedCalendarItem[] = [
    ...moodleEvents.map(e => ({
      id: e.id,
      title: e.title,
      date: e.startTime.split('T')[0],
      time: e.startTime.split('T')[1]?.slice(0, 5) || '00:00',
      type: e.type,
      source: 'moodle' as const,
      courseName: e.courseName,
      location: undefined,
      color: 'var(--color-orange)',
    })),
    ...personalEvents.map(p => ({
      id: p.id,
      title: p.title,
      date: p.date,
      time: p.startTime,
      endTime: p.endTime,
      type: 'personal',
      source: 'personal' as const,
      location: p.location,
      courseName: undefined,
      color: p.color || 'var(--color-blue)',
    })),
    ...assignments
      .filter(a => !!a.dueDate)
      .map(a => ({
        id: `event_assign_${a.id}`,
        title: `[Tugas] ${a.title}`,
        date: (a.dueDate as string).split('T')[0],
        time: (a.dueDate as string).split('T')[1]?.slice(0, 5) || '23:59',
        type: 'assignment',
        source: 'moodle' as const,
        courseName: a.courseName,
        location: undefined,
        color: 'var(--color-red)',
      })),
  ].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const filteredEvents = allEvents.filter(e => {
    if (typeFilter === 'all') return true;
    return e.type === typeFilter;
  });

  const handleDeletePersonalEvent = async (id: string) => {
    await db.personal_events.delete(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Kalender Akademik</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Jadwal terintegrasi perkuliahan Moodle dan agenda belajar pribadi
          </p>
        </div>
        <NeoButton variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Tambah Agenda Pribadi
        </NeoButton>
      </div>

      {/* View Switcher & Filters */}
      <NeoCard style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Filter Type Chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Semua', val: 'all' },
            { label: 'Tugas', val: 'assignment' },
            { label: 'Quiz', val: 'quiz' },
            { label: 'Personal', val: 'personal' },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => setTypeFilter(f.val)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                border: 'var(--border-thin)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: typeFilter === f.val ? 'var(--color-orange)' : 'var(--bg-main)',
                color: typeFilter === f.val ? '#FFF' : 'var(--text-main)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setViewMode('agenda')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'var(--border-thin)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: viewMode === 'agenda' ? '#0A0A0A' : 'var(--bg-card)',
              color: viewMode === 'agenda' ? '#FFF' : 'var(--text-main)',
            }}
          >
            Agenda
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'var(--border-thin)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: viewMode === 'month' ? '#0A0A0A' : 'var(--bg-card)',
              color: viewMode === 'month' ? '#FFF' : 'var(--text-main)',
            }}
          >
            Bulan
          </button>
        </div>
      </NeoCard>

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEvents.length === 0 ? (
            <EmptyState
              emoji="📅"
              title="Belum ada agenda di kalender."
              description="Klik tombol 'Tambah Agenda Pribadi' untuk membuat jadwal belajar atau sinkronkan tugas Moodle."
            />
          ) : (
            filteredEvents.map(e => (
              <NeoCard key={e.id} interactive style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div
                      style={{
                        backgroundColor: e.color || 'var(--color-yellow)',
                        color: '#0A0A0A',
                        border: 'var(--border-thin)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        textAlign: 'center',
                        minWidth: '65px',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800 }}>{e.date}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{e.time}</div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-muted)',
                            border: '1px solid #000',
                          }}
                        >
                          {e.source === 'personal' ? 'Pribadi' : e.type}
                        </span>
                        {e.courseName && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {e.courseName}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 900 }}>{e.title}</h4>
                      {e.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <MapPin size={13} />
                          <span>{e.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {e.source === 'personal' && (
                    <button
                      onClick={() => handleDeletePersonalEvent(e.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)' }}
                      title="Hapus Agenda Pribadi"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </NeoCard>
            ))
          )}
        </div>
      )}

      {/* Month View (Simple Grid representation) */}
      {viewMode === 'month' && (
        <NeoCard style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem' }}>
            Bulan Ini: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} style={{ fontWeight: 900, fontSize: '0.8rem', padding: '0.5rem', backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}>
                {d}
              </div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${new Date().toISOString().slice(0, 7)}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter(e => e.date === dateStr);

              return (
                <div
                  key={i}
                  style={{
                    border: 'var(--border-thin)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.25rem',
                    minHeight: '65px',
                    backgroundColor: dayEvents.length > 0 ? 'var(--color-orange-light)' : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{dayNum}</span>
                  {dayEvents.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        backgroundColor: 'var(--color-orange)',
                        color: '#FFF',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '999px',
                        marginTop: '0.2rem',
                      }}
                    >
                      {dayEvents.length} event
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </NeoCard>
      )}

      {/* Add Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}
