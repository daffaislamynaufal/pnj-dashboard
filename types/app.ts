export type PriorityLevel = 'critical' | 'urgent' | 'upcoming' | 'safe' | 'overdue';

export interface UserProfile {
  id: string;
  sourceId: string | number;
  nim: string;
  fullname: string;
  email?: string;
  avatarUrl?: string;
  department?: string;
  program?: string;
  lastLogin?: string;
}

export interface Course {
  id: string;
  sourceId: string | number;
  name: string;
  shortName: string;
  courseCode: string;
  teacher: string | null;
  url: string;
  progress: number | null;
  assignmentCount: number;
  quizCount: number;
  lastUpdated: string;
}

export type AssignmentStatus = 'new' | 'pending' | 'submitted' | 'graded' | 'overdue';

export interface Assignment {
  id: string;
  sourceId: string | number;
  courseId: string | number;
  courseName?: string;
  title: string;
  description: string;
  url: string;
  dueDate: string | null; // ISO string
  status: AssignmentStatus;
  submittedAt: string | null;
  gradedAt: string | null;
  grade: number | string | null;
  maxGrade: number | string | null;
  priority: PriorityLevel;
  lastUpdated: string;
  syncedAt: string;
}

export type QuizStatus = 'upcoming' | 'open' | 'closed' | 'submitted' | 'graded';

export interface Quiz {
  id: string;
  sourceId: string | number;
  courseId: string | number;
  courseName?: string;
  title: string;
  description: string;
  url: string;
  openTime: string | null;
  closeTime: string | null;
  durationMinutes: number | null;
  status: QuizStatus;
  grade: number | string | null;
  maxGrade?: number | string | null;
  lastUpdated: string;
}

export type CalendarEventType = 'assignment' | 'quiz' | 'class' | 'event' | 'reminder' | 'personal';

export interface CalendarEvent {
  id: string;
  sourceId: string | number;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string | null;
  type: CalendarEventType;
  url?: string;
  courseId?: string | number | null;
  courseName?: string;
  source: 'moodle' | 'personal';
  location?: string;
  color?: string;
}

export interface Announcement {
  id: string;
  sourceId: string | number;
  courseId?: string | number | null;
  courseName?: string;
  title: string;
  content: string;
  author: string | null;
  publishedAt: string;
  url: string;
}

export interface GradeItem {
  id: string;
  sourceId: string | number;
  courseId: string | number;
  courseName?: string;
  itemName: string;
  grade: number | string | null;
  maxGrade: number | string | null;
  percentage: number | null;
  feedback?: string | null;
  gradedAt: string | null;
}

export interface NotificationItem {
  id: string;
  type: 'assignment' | 'quiz' | 'announcement' | 'deadline' | 'grade' | 'system';
  title: string;
  message: string;
  linkUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
}

export interface PersonalEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  reminderMinutes?: number;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  color?: string;
  createdAt: string;
}

export interface SyncMetadata {
  id: string;
  lastSyncTime: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  tierUsed: 'level1_rest' | 'level2_ajax' | 'level3_http' | 'level4_html' | 'offline';
  itemsCount: {
    courses: number;
    assignments: number;
    quizzes: number;
    calendar: number;
    announcements: number;
    grades: number;
  };
}
