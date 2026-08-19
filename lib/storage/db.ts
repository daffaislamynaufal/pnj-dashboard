import Dexie, { type Table } from 'dexie';
import {
  UserProfile,
  Course,
  Assignment,
  Quiz,
  CalendarEvent,
  Announcement,
  GradeItem,
  NotificationItem,
  PersonalEvent,
  SyncMetadata,
} from '@/types/app';

export class PnjAcademicDatabase extends Dexie {
  users!: Table<UserProfile, string>;
  courses!: Table<Course, string>;
  assignments!: Table<Assignment, string>;
  quizzes!: Table<Quiz, string>;
  calendar_events!: Table<CalendarEvent, string>;
  announcements!: Table<Announcement, string>;
  grades!: Table<GradeItem, string>;
  notifications!: Table<NotificationItem, string>;
  personal_events!: Table<PersonalEvent, string>;
  sync_metadata!: Table<SyncMetadata, string>;

  constructor() {
    super('PnjAcademicDB');
    this.version(1).stores({
      users: 'id, nim, fullname',
      courses: 'id, sourceId, name, courseCode',
      assignments: 'id, sourceId, courseId, dueDate, status, priority',
      quizzes: 'id, sourceId, courseId, openTime, closeTime, status',
      calendar_events: 'id, sourceId, startTime, type, source',
      announcements: 'id, sourceId, publishedAt',
      grades: 'id, courseId',
      notifications: 'id, type, isRead, priority, createdAt',
      personal_events: 'id, date, startTime',
      sync_metadata: 'id, lastSyncTime',
    });
  }
}

export const db = new PnjAcademicDatabase();
