'use client';

import React from 'react';
import { NeoCard } from '../ui/NeoCard';
import { BookOpen, CheckSquare, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';
import { calculatePriority } from '@/lib/utils/priority';

export function StatGrid() {
  const coursesCount = useLiveQuery(() => db.courses.count()) || 0;
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];
  const quizzesCount = useLiveQuery(() => db.quizzes.count()) || 0;

  const activeAssignments = assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded');
  const todayDeadlines = activeAssignments.filter(a => calculatePriority(a.dueDate) === 'critical');

  const stats = [
    {
      title: 'Mata Kuliah',
      value: coursesCount,
      desc: 'Semester Berjalan',
      icon: BookOpen,
      color: 'var(--color-blue)',
      href: '/courses',
    },
    {
      title: 'Tugas Aktif',
      value: activeAssignments.length,
      desc: `${assignments.length} total tugas`,
      icon: CheckSquare,
      color: 'var(--color-orange)',
      href: '/assignments',
    },
    {
      title: 'Deadline Hari Ini',
      value: todayDeadlines.length,
      desc: 'Wajib diselesaikan',
      icon: AlertTriangle,
      color: 'var(--color-red)',
      href: '/assignments',
    },
    {
      title: 'Quiz Aktif',
      value: quizzesCount,
      desc: 'Evaluasi & kuis',
      icon: HelpCircle,
      color: 'var(--color-purple)',
      href: '/quizzes',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <NeoCard key={idx} interactive style={{ padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                {stat.title}
              </span>
              <div
                style={{
                  backgroundColor: stat.color,
                  color: '#FFFFFF',
                  padding: '0.4rem',
                  borderRadius: '8px',
                  border: '2px solid #000',
                  display: 'flex',
                }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '0.25rem' }}>
              {stat.value}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {stat.desc}
            </span>
          </NeoCard>
        );
      })}
    </div>
  );
}
