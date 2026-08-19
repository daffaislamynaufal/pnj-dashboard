import { Course, Assignment, Quiz, CalendarEvent, Announcement, GradeItem } from '@/types/app';
import { MOODLE_BASE_URL } from './config';
import { calculatePriority } from '../utils/priority';

export class MoodleNormalizer {
  /**
   * Normalize raw Moodle Course data (from REST / AJAX or HTML)
   */
  static normalizeCourse(raw: any): Course {
    const sourceId = String(raw.id || raw.sourceId || '');
    const fullName = String(raw.fullname || raw.name || `Mata Kuliah #${sourceId}`).trim();
    const shortName = String(raw.shortname || raw.shortName || `PNJ-${sourceId}`).trim();
    
    const codeMatch = fullName.match(/^\[?([A-Z0-9_-]+)\]?\s*[:-]?\s*(.*)/i);
    const courseCode = codeMatch ? codeMatch[1] : shortName;
    const cleanName = codeMatch && codeMatch[2] ? codeMatch[2].trim() : fullName;

    let progress: number | null = null;
    if (typeof raw.progress === 'number' && !isNaN(raw.progress)) {
      progress = Math.min(100, Math.max(0, Math.round(raw.progress)));
    }

    return {
      id: `course_${sourceId}`,
      sourceId,
      name: cleanName,
      shortName,
      courseCode,
      teacher: raw.teacher || null,
      url: raw.url || `${MOODLE_BASE_URL}/course/view.php?id=${sourceId}`,
      progress,
      assignmentCount: Number(raw.assignmentCount || 0),
      quizCount: Number(raw.quizCount || 0),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Centralized normalizeAssignment function
   * Strictly extracts Moodle Unix timestamps: new Date(duedate * 1000)
   */
  static normalizeAssignment(raw: any, courseNameMap: Map<string, string> = new Map()): Assignment {
    // Temporary debug logging in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MOODLE ASSIGNMENT RAW]', {
        id: raw.id,
        cmid: raw.cmid,
        name: raw.name || raw.title,
        duedate: raw.duedate,
        cutoffdate: raw.cutoffdate,
        allowsubmissionsfromdate: raw.allowsubmissionsfromdate,
        timesort: raw.timesort,
        timestart: raw.timestart,
      });
      console.log('[MOODLE DUE DATE]', {
        id: raw.id,
        name: raw.name || raw.title,
        duedate: raw.duedate,
        cutoffdate: raw.cutoffdate,
      });
    }

    const sourceId = String(raw.cmid || raw.id || raw.instance || raw.sourceId || '');
    
    // Safely extract courseId whether course is an object or primitive
    let courseId = '0';
    if (raw.course && typeof raw.course === 'object') {
      courseId = String(raw.course.id || '0');
    } else if (raw.courseid) {
      courseId = String(raw.courseid);
    } else if (raw.courseId) {
      courseId = String(raw.courseId);
    } else if (raw.course && (typeof raw.course === 'string' || typeof raw.course === 'number')) {
      courseId = String(raw.course);
    }

    // Safely extract courseName
    let courseName = '';
    if (raw.course && typeof raw.course === 'object' && raw.course.fullname) {
      courseName = String(raw.course.fullname);
    } else if (raw.courseName && typeof raw.courseName === 'string' && !raw.courseName.includes('[object')) {
      courseName = raw.courseName;
    } else if (courseNameMap.has(courseId)) {
      courseName = courseNameMap.get(courseId)!;
    } else {
      courseName = courseId !== '0' ? `Mata Kuliah #${courseId}` : 'E-Learning PNJ';
    }
    courseName = courseName.replace(/^[A-Z0-9_-]+\s*[:-]\s*/i, '');

    // Extract raw Unix timestamp (in seconds)
    let dueTimestamp = 0;
    if (typeof raw.duedate === 'number') {
      dueTimestamp = raw.duedate;
    } else if (raw.duedate) {
      dueTimestamp = Number(raw.duedate) || 0;
    } else if (typeof raw.timesort === 'number') {
      dueTimestamp = raw.timesort;
    } else if (typeof raw.timestart === 'number') {
      dueTimestamp = raw.timestart;
    }

    let cutoffTimestamp = 0;
    if (typeof raw.cutoffdate === 'number') {
      cutoffTimestamp = raw.cutoffdate;
    } else if (raw.cutoffdate) {
      cutoffTimestamp = Number(raw.cutoffdate) || 0;
    }

    let allowSubmissionsTimestamp = 0;
    if (typeof raw.allowsubmissionsfromdate === 'number') {
      allowSubmissionsTimestamp = raw.allowsubmissionsfromdate;
    } else if (raw.allowsubmissionsfromdate) {
      allowSubmissionsTimestamp = Number(raw.allowsubmissionsfromdate) || 0;
    }

    // Conversion: duedate > 0 -> new Date(duedate * 1000).toISOString()
    const dueDate = dueTimestamp > 0 ? new Date(dueTimestamp * 1000).toISOString() : null;
    const cutoffDate = cutoffTimestamp > 0 ? new Date(cutoffTimestamp * 1000).toISOString() : null;
    const allowSubmissionsFromDate = allowSubmissionsTimestamp > 0 ? new Date(allowSubmissionsTimestamp * 1000).toISOString() : null;

    // Clean up title
    let title = String(raw.name || raw.title || 'Tugas').trim();
    title = title
      .replace(/\s+(is due|is closing|berakhir|jatuh tempo|Assignment)$/i, '')
      .replace(/\s+Assignment\b/i, '')
      .trim();

    let status: Assignment['status'] = 'pending';
    if (raw.submitted || raw.status === 'submitted') {
      status = 'submitted';
    } else if (raw.graded || raw.status === 'graded') {
      status = 'graded';
    } else if (dueDate && new Date(dueDate).getTime() < Date.now()) {
      status = 'overdue';
    }

    let url = raw.url || raw.action?.url || '';
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      url = `${MOODLE_BASE_URL}/mod/assign/view.php?id=${sourceId}`;
    }

    return {
      id: `assign_${sourceId}`,
      sourceId,
      courseId,
      courseName,
      title,
      description: String(raw.intro || raw.description || '').replace(/<[^>]*>?/gm, '').trim(),
      url,
      dueDate,
      cutoffDate,
      allowSubmissionsFromDate,
      status,
      submittedAt: raw.submittedAt || null,
      gradedAt: raw.gradedAt || null,
      grade: raw.grade !== undefined ? raw.grade : null,
      maxGrade: raw.maxGrade || raw.gradeitem?.grademax || 100,
      priority: calculatePriority(dueDate),
      lastUpdated: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalize Calendar event
   */
  static normalizeCalendarEvent(raw: any): CalendarEvent {
    const sourceId = String(raw.id || raw.sourceId || Math.random().toString(36).substring(2, 9));
    const startTs = typeof raw.timestart === 'number' ? raw.timestart * 1000 : (Date.parse(raw.startTime || '') || Date.now());
    const startTime = new Date(startTs).toISOString();
    
    let endTime: string | null = null;
    if (raw.timeduration && raw.timeduration > 0) {
      endTime = new Date(startTs + raw.timeduration * 1000).toISOString();
    } else if (raw.endTime) {
      endTime = raw.endTime;
    }

    let type: CalendarEvent['type'] = 'event';
    const eventType = String(raw.eventtype || raw.type || '').toLowerCase();
    if (eventType.includes('assign') || eventType.includes('due')) type = 'assignment';
    else if (eventType.includes('quiz') || eventType.includes('exam')) type = 'quiz';
    else if (eventType.includes('course') || eventType.includes('class')) type = 'class';

    return {
      id: `event_${sourceId}`,
      sourceId,
      title: String(raw.name || raw.title || 'Agenda').trim(),
      description: String(raw.description || '').replace(/<[^>]*>?/gm, '').trim(),
      startTime,
      endTime,
      type,
      url: raw.url || `${MOODLE_BASE_URL}/calendar/view.php?view=day&time=${Math.floor(startTs / 1000)}`,
      courseId: raw.course?.id || raw.courseid || raw.courseId || null,
      courseName: raw.course?.fullname || raw.courseName || undefined,
      source: 'moodle',
    };
  }
}
