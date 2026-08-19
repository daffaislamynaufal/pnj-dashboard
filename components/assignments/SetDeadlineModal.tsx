'use client';

import React, { useState } from 'react';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { db } from '@/lib/storage/db';
import { calculatePriority } from '@/lib/utils/priority';

interface SetDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    title: string;
    courseName?: string;
    dueDate?: string | null;
  } | null;
}

export function SetDeadlineModal({ isOpen, onClose, assignment }: SetDeadlineModalProps) {
  const [date, setDate] = useState(() => {
    if (assignment?.dueDate) {
      return assignment.dueDate.split('T')[0];
    }
    // Default to 3 days from now
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [time, setTime] = useState(() => {
    if (assignment?.dueDate && assignment.dueDate.includes('T')) {
      return assignment.dueDate.split('T')[1].slice(0, 5);
    }
    return '23:59';
  });

  if (!isOpen || !assignment) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    const isoStr = `${date}T${time}:00+07:00`;
    const finalDate = new Date(isoStr).toISOString();
    const newPriority = calculatePriority(finalDate);

    await db.assignments.update(assignment.id, {
      dueDate: finalDate,
      priority: newPriority,
      status: new Date(finalDate).getTime() < Date.now() ? 'overdue' : 'pending',
    });

    onClose();
  };

  const handleQuickPreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDate(d.toISOString().split('T')[0]);
    setTime('23:59');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div style={{ width: '100%', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <NeoCard style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--color-orange)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>Atur Tenggat Waktu</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.65rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: 'var(--border-thin)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{assignment.courseName}</span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginTop: '2px' }}>{assignment.title}</h4>
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
              Pilihan Cepat:
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickPreset(0)}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 800, border: 'var(--border-thin)', borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-card)' }}
              >
                Hari Ini (23:59)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(1)}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 800, border: 'var(--border-thin)', borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-card)' }}
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(3)}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 800, border: 'var(--border-thin)', borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-card)' }}
              >
                3 Hari Lagi
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(7)}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 800, border: 'var(--border-thin)', borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-card)' }}
              >
                1 Minggu Lagi
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                  Tanggal Tenggat *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="neo-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                  Jam Tenggat (WIB) *
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="neo-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <NeoButton type="button" onClick={onClose} style={{ flex: 1 }}>
                Batal
              </NeoButton>
              <NeoButton type="submit" variant="primary" style={{ flex: 1 }}>
                Aktifkan Countdown
              </NeoButton>
            </div>
          </form>
        </NeoCard>
      </div>
    </div>
  );
}
