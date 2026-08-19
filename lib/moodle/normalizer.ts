import { Course, Assignment, Quiz, CalendarEvent, Announcement, GradeItem } from '@/types/app';
import { MOODLE_BASE_URL } from './config';
import { parseIndonesianDateStringToISO } from './parser';

export class MoodleNormalizer {
  /**
   * Normalize raw Moodle Course data (from REST / AJAX or HTML)
   */
  static normalizeCourse(raw: any): Course {
    const sourceId = String(raw.id || raw.sourceId || '');
    const fullName = String(raw.fullname || raw.name || `Mata Kuliah #${sourceId}`).trim();
    const shortName = String(raw.shortname || raw.shortName || `PNJ-${sourceId}`).trim();
    
    // Extract course code if present inside bracket or prefix
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
   * Normalize raw Moodle Assignment data with comprehensive deadline parsing
   */
  static normalizeAssignment(raw: any, courseNameMap: Map<string, string> = new Map()): Assignment {
    // Determine consistent sourceId
    const sourceId = String(raw.instance || raw.id || raw.sourceId || '');
    
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

    // Clean course name if contains course codes
    courseName = courseName.replace(/^[A-Z0-9_-]+\s*[:-]\s*/i, '');
    
    // Extract timestamp from all possible Moodle fields (timesort, timestart, duedate, formattedtime)
    let dueDate: string | null = null;
    const rawTimestamp = raw.timesort || raw.timestart || raw.duedate || raw.time;
    
    if (typeof rawTimestamp === 'number' && rawTimestamp > 0) {
      dueDate = new Date(rawTimestamp * 1000).toISOString();
    } else if (typeof rawTimestamp === 'string') {
      const parsed = parseIndonesianDateStringToISO(rawTimestamp);
      if (parsed) dueDate = parsed;
    }

    // If still null, check formattedtime (e.g. "<b>Jatuh tempo:</b> Senin, 24 Agustus 2026, 23:59")
    if (!dueDate && raw.formattedtime) {
      const cleanTime = String(raw.formattedtime).replace(/<[^>]*>?/gm, ' ').trim();
      const parsed = parseIndonesianDateStringToISO(cleanTime);
      if (parsed) dueDate = parsed;
    }

    if (!dueDate && raw.dueDate) {
      dueDate = raw.dueDate;
    }

    // Clean up title (remove trailing "is due", "Assignment", "berakhir", etc.)
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

    // Extract real URL
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
      status,
      submittedAt: raw.submittedAt || null,
      gradedAt: raw.gradedAt || null,
      grade: raw.grade !== undefined ? raw.grade : null,
      maxGrade: raw.maxGrade || raw.gradeitem?.grademax || 100,
      priority: 'upcoming',
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
