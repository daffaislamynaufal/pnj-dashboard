import { db } from './db';
import { Course, Assignment, Quiz, CalendarEvent, Announcement, GradeItem, UserProfile, NotificationItem } from '@/types/app';
import { calculatePriority } from '../utils/priority';
import { sound } from '../utils/sound';

export interface SyncResponseData {
  user?: UserProfile;
  courses: Course[];
  assignments: Assignment[];
  quizzes: Quiz[];
  calendar: CalendarEvent[];
  announcements: Announcement[];
  grades: GradeItem[];
  tier: string;
}

export class SyncEngine {
  /**
   * Run full idempotent synchronization from API proxy to IndexedDB
   */
  static async syncAll(): Promise<{ success: boolean; tier?: string; error?: string }> {
    try {
      const res = await fetch('/api/moodle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401) {
        return { success: false, error: 'Sesi Moodle Anda telah berakhir. Silakan login kembali.' };
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error || `Gagal sinkronisasi data (HTTP ${res.status}).` };
      }

      const data: SyncResponseData = await res.json();

      // 1. Save User Profile
      if (data.user) {
        await db.users.put(data.user);
      }

      // 2. Save Courses
      if (data.courses?.length > 0) {
        await db.courses.clear();
        await db.courses.bulkPut(data.courses);
      }

      // 3. Save Assignments with deduplication and clean stale records
      const newNotifications: NotificationItem[] = [];

      if (data.assignments?.length > 0) {
        // Deduplicate assignments by normalized title + courseName
        const uniqueAssignments: Assignment[] = [];
        const seenKeys = new Set<string>();

        for (const assign of data.assignments) {
          const key = `${assign.title.toLowerCase().trim()}_${assign.courseName?.toLowerCase().trim()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueAssignments.push({
              ...assign,
              priority: calculatePriority(assign.dueDate),
            });
          }
        }

        // Replace old assignments with freshly normalized clean ones
        await db.assignments.clear();
        await db.assignments.bulkPut(uniqueAssignments);
      }

      // 4. Save Quizzes
      if (data.quizzes?.length > 0) {
        await db.quizzes.clear();
        await db.quizzes.bulkPut(data.quizzes);
      }

      // 5. Save Calendar Events
      if (data.calendar?.length > 0) {
        await db.calendar_events.clear();
        await db.calendar_events.bulkPut(data.calendar);
      }

      // 6. Save Announcements
      if (data.announcements?.length > 0) {
        const existingAnnouncements = await db.announcements.toArray();
        const existingAnnMap = new Map(existingAnnouncements.map(a => [a.id, a]));

        for (const ann of data.announcements) {
          if (!existingAnnMap.has(ann.id)) {
            newNotifications.push({
              id: `notif_ann_${ann.id}_${Date.now()}`,
              type: 'announcement',
              title: 'Pengumuman Baru',
              message: ann.title,
              linkUrl: '/announcements',
              priority: 'medium',
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }

        await db.announcements.bulkPut(data.announcements);
      }

      // 7. Save Grades
      if (data.grades?.length > 0) {
        await db.grades.clear();
        await db.grades.bulkPut(data.grades);
      }

      // 8. Put new notifications into store
      if (newNotifications.length > 0) {
        await db.notifications.bulkPut(newNotifications);
        sound.playNotification();
      }

      // 9. Update Sync Metadata
      await db.sync_metadata.put({
        id: 'latest',
        lastSyncTime: new Date().toISOString(),
        status: 'success',
        tierUsed: (data.tier as any) || 'level2_ajax',
        itemsCount: {
          courses: data.courses?.length || 0,
          assignments: data.assignments?.length || 0,
          quizzes: data.quizzes?.length || 0,
          calendar: data.calendar?.length || 0,
          announcements: data.announcements?.length || 0,
          grades: data.grades?.length || 0,
        },
      });

      return { success: true, tier: data.tier };
    } catch (err: any) {
      await db.sync_metadata.put({
        id: 'latest',
        lastSyncTime: new Date().toISOString(),
        status: 'error',
        errorMessage: err?.message || 'Gagal sinkronisasi data',
        tierUsed: 'offline',
        itemsCount: { courses: 0, assignments: 0, quizzes: 0, calendar: 0, announcements: 0, grades: 0 },
      });

      return { success: false, error: err?.message || 'Jaringan tidak dapat dihubungi.' };
    }
  }
}
