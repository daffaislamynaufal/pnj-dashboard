'use client';

import React, { useState } from 'react';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { db } from '@/lib/storage/db';
import { PersonalEvent } from '@/types/app';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
}

export function AddEventModal({ isOpen, onClose, selectedDate }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#FF5E00');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const newEvent: PersonalEvent = {
      id: `personal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime,
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      color,
      createdAt: new Date().toISOString(),
    };

    await db.personal_events.put(newEvent);

    // Reset form & close
    setTitle('');
    setDescription('');
    setLocation('');
    onClose();
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
      <div style={{ width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <NeoCard style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={22} color="var(--color-orange)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900 }}>Tambah Agenda Pribadi</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                Judul Kegiatan / Agenda *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Belajar Kelompok Lab TI, Bimbingan TA"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="neo-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                  Tanggal *
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
                  Warna Label
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                  {['#FF5E00', '#FFD000', '#00D06C', '#0070F3', '#8B5CF6'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: c,
                        border: color === c ? '3px solid #000' : '1px solid #000',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                  Mulai
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="neo-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                  Selesai
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="neo-input"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                Lokasi / Ruangan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Gedung AA Lantai 3, Zoom, Lab GS"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="neo-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: '0.3rem' }}>
                Deskripsi / Catatan Tambahan
              </label>
              <textarea
                placeholder="Catatan materi atau perlengkapan yang perlu dibawa..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="neo-input"
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <NeoButton type="button" onClick={onClose} style={{ flex: 1 }}>
                Batal
              </NeoButton>
              <NeoButton type="submit" variant="primary" style={{ flex: 1 }}>
                Simpan Agenda
              </NeoButton>
            </div>
          </form>
        </NeoCard>
      </div>
    </div>
  );
}
