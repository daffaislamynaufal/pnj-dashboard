import { PriorityLevel } from '@/types/app';

export function calculatePriority(dueDate: string | null): PriorityLevel {
  if (!dueDate) return 'safe';
  
  const due = new Date(dueDate).getTime();
  if (isNaN(due)) return 'safe';

  const diffMs = due - Date.now();
  if (diffMs < 0) return 'overdue';

  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 24) return 'critical';
  if (diffHours <= 72) return 'urgent';
  if (diffHours <= 168) return 'upcoming';
  return 'safe';
}

export function formatCountdown(dueDate: string | null): { text: string; isOverdue: boolean; priority: PriorityLevel } {
  if (!dueDate) {
    return { text: 'Tanpa Batas Waktu', isOverdue: false, priority: 'safe' };
  }

  const due = new Date(dueDate).getTime();
  if (isNaN(due)) {
    return { text: 'Format Tanggal Tidak Valid', isOverdue: false, priority: 'safe' };
  }

  const diffMs = due - Date.now();
  const priority = calculatePriority(dueDate);

  if (diffMs < 0) {
    return { text: 'OVERDUE (Terlewat)', isOverdue: true, priority: 'overdue' };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    return { text: `${totalDays} hari lagi`, isOverdue: false, priority };
  }
  if (totalHours > 0) {
    return { text: `${totalHours} jam lagi`, isOverdue: false, priority };
  }
  return { text: `${Math.max(1, totalMinutes)} menit lagi`, isOverdue: false, priority };
}

export function formatIndonesianDate(isoString: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
