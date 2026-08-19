'use client';

import React, { useState } from 'react';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { NeoBadge } from './NeoBadge';
import { Bot, Sparkles, Send, X, BookOpen, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage/db';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Halo! Saya AI Academic Assistant PNJ yang terhubung via **DeepSeek AI (Free API)**. Ada tugas atau mata kuliah yang ingin kamu konsultasikan atau mau saya buatkan rencana belajar hari ini?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];
  const courses = useLiveQuery(() => db.courses.toArray()) || [];

  if (!isOpen) return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const newMsgs = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMsgs);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI Assistant via 9Router.');
      }

      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        { role: 'assistant', content: `⚠️ Error: ${err.message || 'Koneksi ke 9Router gagal. Pastikan 9Router berjalan di port 20128.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    setLoading(true);
    const userMsg = 'Tolong buatkan rencana belajar prioritas hari ini berdasarkan tugas Moodle saya.';
    const newMsgs = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMsgs);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_plan',
          assignments,
          courses,
        }),
      });

      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        { role: 'assistant', content: `⚠️ Error: ${err.message || 'Gagal generate study plan.'}` },
      ]);
    } finally {
      setLoading(false);
    }
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
      <div
        style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <NeoCard style={{ display: 'flex', flexDirection: 'column', height: '80vh', padding: '0', overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: 'var(--border-thick)',
              backgroundColor: 'var(--color-orange)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#0A0A0A', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                <Bot size={22} color="#FFFFFF" />
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0A0A0A' }}>PNJ AI Academic Assistant</h3>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0A0A0A' }}>Powered by DeepSeek AI (Free API)</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#0A0A0A',
                border: '2px solid #000',
                color: '#FFF',
                padding: '0.35rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div
            style={{
              padding: '0.6rem 1rem',
              borderBottom: 'var(--border-thin)',
              backgroundColor: 'var(--bg-muted)',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
            }}
          >
            <button
              onClick={handleGenerateStudyPlan}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                background: 'var(--bg-card)',
                border: 'var(--border-thin)',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={14} color="var(--color-orange)" />
              Buatkan Rencana Belajar Hari Ini
            </button>
            <button
              onClick={() => handleSendMessage('Apa saja tips menyelesaikan tugas coding praktikum dengan cepat?')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                background: 'var(--bg-card)',
                border: 'var(--border-thin)',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <BookOpen size={14} />
              Tips Praktikum
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: 'var(--bg-main)',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'var(--border-thick)',
                  boxShadow: 'var(--shadow-sm)',
                  backgroundColor: m.role === 'user' ? 'var(--color-orange)' : 'var(--bg-card)',
                  color: m.role === 'user' ? '#FFFFFF' : 'var(--text-main)',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1rem',
                  borderRadius: '12px',
                  border: 'var(--border-thick)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={16} className="animate-spin" color="var(--color-orange)" />
                AI sedang berpikir via 9Router...
              </div>
            )}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.75rem 1rem',
              borderTop: 'var(--border-thick)',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Tanyakan tugas, strategi belajar, atau materi kuliah..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="neo-input"
              style={{ flex: 1 }}
              disabled={loading}
            />
            <NeoButton variant="primary" type="submit" disabled={loading || !input.trim()}>
              <Send size={18} />
            </NeoButton>
          </form>
        </NeoCard>
      </div>
    </div>
  );
}
