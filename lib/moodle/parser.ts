import * as cheerio from 'cheerio';
import { MOODLE_BASE_URL } from './config';
import { Course, Assignment, Quiz, CalendarEvent, Announcement, GradeItem, UserProfile } from '@/types/app';

const ID_MONTHS: Record<string, string> = {
  januari: '01', jan: '01', january: '01',
  februari: '02', feb: '02', february: '02',
  maret: '03', mar: '03', march: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06', june: '06',
  juli: '07', jul: '07', july: '07',
  agustus: '08', agu: '08', ags: '08', august: '08',
  september: '09', sep: '09', sept: '09',
  oktober: '10', okt: '10', oct: '10', october: '10',
  november: '11', nov: '11',
  desember: '12', des: '12', dec: '12', december: '12',
};

export function parseIndonesianDateStringToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.toLowerCase().replace(/pukul|wib|wita|wit/g, '').trim();

  // Try standard Date.parse
  const directParse = Date.parse(clean);
  if (!isNaN(directParse)) {
    return new Date(directParse).toISOString();
  }

  // Regex for "Senin, 24 Agustus 2026, 23:59" or "24 Agustus 2026, 23:59"
  const match = clean.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const month = ID_MONTHS[monthName] || '01';
    const year = match[3];
    const hour = (match[4] || '23').padStart(2, '0');
    const min = (match[5] || '59').padStart(2, '0');

    const isoStr = `${year}-${month}-${day}T${hour}:${min}:00+07:00`;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  return null;
}

export class MoodleHtmlParser {
  /**
   * Parse enrolled courses from /my/courses.php or /my/ HTML
   */
  static parseCourses(html: string): Course[] {
    const $ = cheerio.load(html);
    const courses: Course[] = [];
    const seenIds = new Set<string>();

    $('.dashboard-card, .course-info-container, .card.dashboard-card, [data-region="course-content"]').each((_, el) => {
      const $card = $(el);
      const link = $card.find('a.coursename, a.aalink, a[href*="/course/view.php"]').first();
      const href = link.attr('href') || '';
      const idMatch = href.match(/id=(\d+)/);
      if (!idMatch) return;

      const sourceId = idMatch[1];
      if (seenIds.has(sourceId)) return;
      seenIds.add(sourceId);

      const fullName = link.text().trim() || $card.find('.multiline, .coursename').text().trim();
      const codeMatch = fullName.match(/^\[?([A-Z0-9_-]+)\]?\s*[:-]?\s*(.*)/i);
      const courseCode = codeMatch ? codeMatch[1] : `PNJ-${sourceId}`;
      const name = codeMatch && codeMatch[2] ? codeMatch[2].trim() : fullName;

      const teacherText = $card.find('.teachers, .course-teachers, .text-muted:contains("Dosen"), .text-muted:contains("Pengajar")').text().trim();
      const teacher = teacherText ? teacherText.replace(/^(Dosen|Pengajar)\s*:\s*/i, '').trim() : null;

      let progress: number | null = null;
      const progressText = $card.find('.progress-bar, [role="progressbar"]').attr('aria-valuenow') ||
        $card.find('.progress-text').text();
      if (progressText) {
        const val = parseInt(progressText, 10);
        if (!isNaN(val)) progress = Math.min(100, Math.max(0, val));
      }

      courses.push({
        id: `course_${sourceId}`,
        sourceId,
        name: name || `Mata Kuliah #${sourceId}`,
        shortName: courseCode,
        courseCode,
        teacher,
        url: href.startsWith('http') ? href : `${MOODLE_BASE_URL}${href}`,
        progress,
        assignmentCount: 0,
        quizCount: 0,
        lastUpdated: new Date().toISOString(),
      });
    });

    if (courses.length === 0) {
      $('a[href*="/course/view.php?id="]').each((_, el) => {
        const $a = $(el);
        const href = $a.attr('href') || '';
        const idMatch = href.match(/id=(\d+)/);
        if (!idMatch) return;
        const sourceId = idMatch[1];
        if (sourceId === '1' || seenIds.has(sourceId)) return;
        seenIds.add(sourceId);

        const title = $a.text().trim();
        if (title.length < 3) return;

        courses.push({
          id: `course_${sourceId}`,
          sourceId,
          name: title,
          shortName: `PNJ-${sourceId}`,
          courseCode: `PNJ-${sourceId}`,
          teacher: null,
          url: href.startsWith('http') ? href : `${MOODLE_BASE_URL}${href}`,
          progress: null,
          assignmentCount: 0,
          quizCount: 0,
          lastUpdated: new Date().toISOString(),
        });
      });
    }

    return courses;
  }

  /**
   * Parse assignments from /mod/assign/index.php?id=... or course view
   */
  static parseAssignments(html: string, courseId: string | number = '0'): Assignment[] {
    const $ = cheerio.load(html);
    const assignments: Assignment[] = [];
    const seenIds = new Set<string>();

    // Check assignment tables or activity cards
    $('tr, .activity-item, .event, .submissionstatustable tr').each((_, el) => {
      const $row = $(el);
      const link = $row.find('a[href*="/mod/assign/view.php?id="]').first();
      const href = link.attr('href') || '';
      const idMatch = href.match(/id=(\d+)/);
      if (!idMatch) return;

      const sourceId = idMatch[1];
      if (seenIds.has(sourceId)) return;
      seenIds.add(sourceId);

      const title = link.text().trim() || $row.find('.instancename, .activityname').text().trim();
      if (!title) return;

      const dueText = $row.find('.c2, .duedate, .text-muted, [data-region="event-time"], td:contains("Tenggat"), td:contains("Due")').text().trim();
      const dueDate = parseIndonesianDateStringToISO(dueText);

      const statusText = $row.find('.c3, .submissionstatus, .badge').text().toLowerCase();
      let status: Assignment['status'] = 'pending';
      if (statusText.includes('submitted') || statusText.includes('dikirim') || statusText.includes('sudah mengumpulkan')) {
        status = 'submitted';
      } else if (statusText.includes('graded') || statusText.includes('dinilai')) {
        status = 'graded';
      }

      assignments.push({
        id: `assign_${sourceId}`,
        sourceId,
        courseId,
        title,
        description: '',
        url: href.startsWith('http') ? href : `${MOODLE_BASE_URL}${href}`,
        dueDate,
        status,
        submittedAt: null,
        gradedAt: null,
        grade: null,
        maxGrade: 100,
        priority: 'upcoming',
        lastUpdated: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      });
    });

    return assignments;
  }

  /**
   * Parse quizzes from course or quiz list
   */
  static parseQuizzes(html: string, courseId: string | number = '0'): Quiz[] {
    const $ = cheerio.load(html);
    const quizzes: Quiz[] = [];
    const seenIds = new Set<string>();

    $('a[href*="/mod/quiz/view.php?id="]').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href') || '';
      const idMatch = href.match(/id=(\d+)/);
      if (!idMatch) return;

      const sourceId = idMatch[1];
      if (seenIds.has(sourceId)) return;
      seenIds.add(sourceId);

      const title = $link.text().trim();
      if (!title) return;

      quizzes.push({
        id: `quiz_${sourceId}`,
        sourceId,
        courseId,
        title,
        description: '',
        url: href.startsWith('http') ? href : `${MOODLE_BASE_URL}${href}`,
        openTime: null,
        closeTime: null,
        durationMinutes: null,
        status: 'upcoming',
        grade: null,
        lastUpdated: new Date().toISOString(),
      });
    });

    return quizzes;
  }

  /**
   * Parse site & forum announcements
   */
  static parseAnnouncements(html: string): Announcement[] {
    const $ = cheerio.load(html);
    const announcements: Announcement[] = [];
    const seenIds = new Set<string>();

    $('.discussion, .forumpost, article, .activity-item').each((_, el) => {
      const $el = $(el);
      const link = $el.find('a[href*="/mod/forum/discuss.php?d="], a.aalink').first();
      const href = link.attr('href') || '';
      const idMatch = href.match(/d=(\d+)/) || href.match(/id=(\d+)/);
      const sourceId = idMatch ? idMatch[1] : `ann_${Math.random().toString(36).substring(2, 8)}`;

      if (seenIds.has(sourceId)) return;
      seenIds.add(sourceId);

      const title = link.text().trim() || $el.find('h3, h4, .subject').first().text().trim();
      if (!title) return;

      const content = $el.find('.content, .post-content, .activity-altcontent, p').text().trim();
      const author = $el.find('.author, .user-name, [data-region="author"]').text().trim() || 'Admin PNJ';
      const dateText = $el.find('.date, time, .text-muted').first().text().trim();

      announcements.push({
        id: `ann_${sourceId}`,
        sourceId,
        title,
        content: content.slice(0, 500),
        author: author || null,
        publishedAt: dateText || new Date().toISOString(),
        url: href.startsWith('http') ? href : `${MOODLE_BASE_URL}${href}`,
      });
    });

    return announcements;
  }

  /**
   * Parse User Profile
   */
  static parseUserProfile(html: string, fallbackNim: string): UserProfile {
    const $ = cheerio.load(html);
    const fullname = $('.page-header-headings h1, .userprofile .page-title, .usertext').first().text().trim() || fallbackNim;
    const email = $('dd a[href^="mailto:"]').first().text().trim() || undefined;
    const avatarUrl = $('.userpicture, .avatar').first().attr('src') || undefined;

    return {
      id: `user_${fallbackNim}`,
      sourceId: fallbackNim,
      nim: fallbackNim,
      fullname,
      email,
      avatarUrl,
      department: 'Teknik Informatika dan Komputer',
      program: 'Politeknik Negeri Jakarta',
      lastLogin: new Date().toISOString(),
    };
  }
}
