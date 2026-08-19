import { PriorityLevel } from '@/types/app';

export type DeadlineState =
  | 'NO_DEADLINE'
  | 'SAFE'
  | 'UPCOMING'
  | 'URGENT'
  | 'CRITICAL'
  | 'OVERDUE';

export interface DeadlineStatus {
  state: DeadlineState;
  label: string;
  timestamp: number | null;
  priority: PriorityLevel;
}

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

/**
 * Returns structured deadline status and countdown labels
 */
export function getDeadlineStatus(dueDate: string | null): DeadlineStatus {
  if (!dueDate) {
    return {
      state: 'NO_DEADLINE',
      label: 'Tidak ada batas waktu',
      timestamp: null,
      priority: 'safe',
    };
  }

  const due = new Date(dueDate).getTime();
  if (isNaN(due) || due <= 0) {
    return {
      state: 'NO_DEADLINE',
      label: 'Tidak ada batas waktu',
      timestamp: null,
      priority: 'safe',
    };
  }

  const diffMs = due - Date.now();
  const priority = calculatePriority(dueDate);

  if (diffMs < 0) {
    return {
      state: 'OVERDUE',
      label: 'Terlewat',
      timestamp: due,
      priority: 'overdue',
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  let state: DeadlineState = 'SAFE';
  if (diffMs <= 24 * 3600 * 1000) state = 'CRITICAL';
  else if (diffMs <= 72 * 3600 * 1000) state = 'URGENT';
  else if (diffMs <= 168 * 3600 * 1000) state = 'UPCOMING';

  let label = '';
  if (totalDays > 0) {
    label = `${totalDays} hari lagi`;
  } else if (totalHours > 0) {
    label = `${totalHours} jam lagi`;
  } else {
    label = `${Math.max(1, totalMinutes)} menit lagi`;
  }

  return {
    state,
    label,
    timestamp: due,
    priority,
  };
}

export function formatCountdown(dueDate: string | null): { text: string; isOverdue: boolean; priority: PriorityLevel } {
  const status = getDeadlineStatus(dueDate);
  return {
    text: status.label,
    isOverdue: status.state === 'OVERDUE',
    priority: status.priority,
  };
}

/**
 * Format timestamp in Indonesian timezone (Asia/Jakarta / WIB)
 * Example output: "25 Agustus 2026 • 23:59 WIB"
 */
export function formatIndonesianDate(isoString: string | null): string {
  if (!isoString) return 'Tidak ada batas waktu';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Tidak ada batas waktu';

    const dateFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateFormatted = dateFormatter.format(d);
    const timeFormatted = timeFormatter.format(d).replace('.', ':');

    return `${dateFormatted} • ${timeFormatted} WIB`;
  } catch {
    return 'Tidak ada batas waktu';
  }
}
