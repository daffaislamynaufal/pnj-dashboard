import { MOODLE_CONFIG } from './config';
import { MoodleSessionData, MoodleAjaxRequest, MoodleAjaxResponse } from '@/types/moodle';
import { Course, Assignment, Quiz, CalendarEvent, Announcement, GradeItem, UserProfile } from '@/types/app';
import { MoodleHtmlParser, parseIndonesianDateStringToISO } from './parser';
import { MoodleNormalizer } from './normalizer';
import * as cheerio from 'cheerio';

export class MoodleClient {
  private session: MoodleSessionData;

  constructor(session: MoodleSessionData) {
    this.session = session;
  }

  /**
   * Helper to perform authenticated HTTP GET request to Moodle
   */
  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': MOODLE_CONFIG.userAgent,
        'Cookie': this.session.cookie,
      },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('Sesi Moodle telah berakhir (Session Expired). Silakan login ulang.');
    }

    if (!res.ok) {
      throw new Error(`Gagal memuat data dari PNJ E-Learning (HTTP ${res.status}).`);
    }

    return await res.text();
  }

  /**
   * Helper to execute Level 2 AJAX Service
   */
  private async executeAjax<T = any>(requests: MoodleAjaxRequest[]): Promise<MoodleAjaxResponse<T>[]> {
    if (!this.session.sesskey) {
      throw new Error('Sesskey tidak tersedia untuk pemanggilan Moodle AJAX.');
    }

    const url = `${MOODLE_CONFIG.ajaxServiceUrl}?sesskey=${encodeURIComponent(this.session.sesskey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': MOODLE_CONFIG.userAgent,
        'Content-Type': 'application/json',
        'Cookie': this.session.cookie,
      },
      body: JSON.stringify(requests),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`AJAX request failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Helper to execute Level 1 Web Service REST API with proper indexed array params
   */
  private async executeWs<T = any>(wsfunction: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.session.wstoken) {
      throw new Error('WSToken tidak tersedia.');
    }

    const query = new URLSearchParams({
      wstoken: this.session.wstoken,
      wsfunction,
      moodlewsrestformat: 'json',
    });

    // Expand array parameters into indexed query format: courseids[0]=123&courseids[1]=456
    Object.entries(params).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((item, idx) => {
          query.append(`${key}[${idx}]`, String(item));
        });
      } else if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    });

    const res = await fetch(`${MOODLE_CONFIG.webServiceUrl}?${query.toString()}`, {
      method: 'GET',
      headers: { 'User-Agent': MOODLE_CONFIG.userAgent },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`WebService call failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.exception) {
      throw new Error(`WebService exception: ${data.message || data.errorcode}`);
    }

    return data;
  }

  /**
   * Fetch Courses with direct API & AJAX
   */
  async getCourses(): Promise<{ courses: Course[]; tier: string }> {
    // Level 1: Try Web Services if token exists
    if (this.session.wstoken) {
      try {
        const data = await this.executeWs<any[]>('core_enrol_get_users_courses', { userid: this.session.userId || 0 });
        if (Array.isArray(data) && data.length > 0) {
          const courses = data.map(c => MoodleNormalizer.normalizeCourse(c));
          return { courses, tier: 'level1_rest' };
        }
      } catch {}
    }

    // Level 2: Direct AJAX timeline classification
    if (this.session.sesskey) {
      try {
        const ajaxRes = await this.executeAjax<any>([
          {
            index: 0,
            methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
            args: { classification: 'all', limit: 0, offset: 0, sort: 'fullname' },
          },
        ]);
        if (ajaxRes[0] && !ajaxRes[0].error && ajaxRes[0].data?.courses) {
          const rawCourses = ajaxRes[0].data.courses;
          const courses = rawCourses.map((c: any) => MoodleNormalizer.normalizeCourse(c));
          return { courses, tier: 'level2_ajax' };
        }
      } catch {}
    }

    // Fallback: Fetch /my/courses.php HTML
    const html = await this.fetchPage(MOODLE_CONFIG.coursesUrl);
    const parsed = MoodleHtmlParser.parseCourses(html);
    return { courses: parsed, tier: 'level4_html' };
  }

  /**
   * Fetch Assignments DIRECTLY via Moodle API (mod_assign_get_assignments, core_course_get_contents, action_events)
   */
  async getAssignments(courses: Course[]): Promise<{ assignments: Assignment[]; tier: string }> {
    const courseMap = new Map<string, string>(courses.map(c => [String(c.sourceId), c.name]));
    const assignmentsMap = new Map<string, Assignment>();
    let detectedTier = 'level2_ajax';

    const courseIds = courses.map(c => Number(c.sourceId)).filter(id => !isNaN(id) && id > 0);

    // 1. PRIMARY API: mod_assign_get_assignments via Web Services (if wstoken)
    if (this.session.wstoken && courseIds.length > 0) {
      try {
        const data = await this.executeWs<any>('mod_assign_get_assignments', { courseids: courseIds });
        if (data?.courses && Array.isArray(data.courses)) {
          data.courses.forEach((c: any) => {
            (c.assignments || []).forEach((a: any) => {
              const norm = MoodleNormalizer.normalizeAssignment({ ...a, course: c.id }, courseMap);
              assignmentsMap.set(norm.id, norm);
            });
          });
          if (assignmentsMap.size > 0) {
            return { assignments: Array.from(assignmentsMap.values()), tier: 'level1_rest' };
          }
        }
      } catch {}
    }

    // 2. PRIMARY AJAX: mod_assign_get_assignments via AJAX service
    if (this.session.sesskey && courseIds.length > 0) {
      try {
        const ajaxRes = await this.executeAjax<any>([
          {
            index: 0,
            methodname: 'mod_assign_get_assignments',
            args: { courseids: courseIds },
          },
        ]);

        if (ajaxRes[0] && !ajaxRes[0].error && ajaxRes[0].data?.courses) {
          ajaxRes[0].data.courses.forEach((c: any) => {
            (c.assignments || []).forEach((a: any) => {
              const norm = MoodleNormalizer.normalizeAssignment({ ...a, course: c.id }, courseMap);
              assignmentsMap.set(norm.id, norm);
            });
          });
        }
      } catch {}
    }

    // 3. SECONDARY AJAX: core_calendar_get_action_events_by_timesort
    if (this.session.sesskey) {
      try {
        const calRes = await this.executeAjax<any>([
          {
            index: 0,
            methodname: 'core_calendar_get_action_events_by_timesort',
            args: {
              timesortfrom: Math.floor(Date.now() / 1000) - 86400 * 60,
              timesortto: Math.floor(Date.now() / 1000) + 86400 * 180,
              limitnum: 100,
            },
          },
        ]);

        if (calRes[0] && !calRes[0].error && calRes[0].data?.events) {
          calRes[0].data.events.forEach((ev: any) => {
            if (ev.modulename === 'assign' || ev.eventtype === 'due' || ev.purpose === 'assessment') {
              const norm = MoodleNormalizer.normalizeAssignment(ev, courseMap);
              const existing = assignmentsMap.get(norm.id);
              if (existing) {
                if (!existing.dueDate && norm.dueDate) {
                  existing.dueDate = norm.dueDate;
                }
              } else {
                assignmentsMap.set(norm.id, norm);
              }
            }
          });
        }
      } catch {}
    }

    // 4. TERTIARY AJAX: core_course_get_contents for all enrolled courses
    if (this.session.sesskey && courses.length > 0) {
      try {
        const batchRequests: MoodleAjaxRequest[] = courses.slice(0, 15).map((course, idx) => ({
          index: idx,
          methodname: 'core_course_get_contents',
          args: { courseid: Number(course.sourceId) },
        }));

        const batchRes = await this.executeAjax<any[]>(batchRequests);

        batchRes.forEach((res, idx) => {
          if (!res.error && Array.isArray(res.data)) {
            const course = courses[idx];
            res.data.forEach((section: any) => {
              (section.modules || []).forEach((mod: any) => {
                if (mod.modname === 'assign') {
                  const modId = String(mod.id);
                  const assignKey = `assign_${modId}`;

                  let parsedDueDate: string | null = null;
                  let rawDueTimestamp: number | null = null;

                  if (Array.isArray(mod.dates)) {
                    for (const d of mod.dates) {
                      if (d.timestamp && typeof d.timestamp === 'number' && d.timestamp > 0) {
                        rawDueTimestamp = d.timestamp;
                        parsedDueDate = new Date(d.timestamp * 1000).toISOString();
                        break;
                      }
                    }
                  }

                  const existing = assignmentsMap.get(assignKey);
                  if (existing) {
                    if (!existing.dueDate && parsedDueDate) {
                      existing.dueDate = parsedDueDate;
                    }
                  } else {
                    const normalized = MoodleNormalizer.normalizeAssignment(
                      {
                        id: modId,
                        instance: mod.instance,
                        cmid: mod.id,
                        name: mod.name,
                        course: { id: course.sourceId, fullname: course.name },
                        duedate: rawDueTimestamp,
                        url: mod.url || `${MOODLE_CONFIG.baseUrl}/mod/assign/view.php?id=${modId}`,
                      },
                      courseMap
                    );
                    assignmentsMap.set(assignKey, normalized);
                  }
                }
              });
            });
          }
        });
      } catch {}
    }

    // 5. USER OVERRIDES / SUBMISSION STATUS CHECK: mod_assign_get_submission_status
    if (this.session.sesskey && assignmentsMap.size > 0) {
      try {
        const assignList = Array.from(assignmentsMap.values());
        const statusRequests: MoodleAjaxRequest[] = assignList.slice(0, 15).map((a, idx) => ({
          index: idx,
          methodname: 'mod_assign_get_submission_status',
          args: { assignid: Number(a.sourceId) },
        }));

        const statusRes = await this.executeAjax<any>(statusRequests);

        statusRes.forEach((res, idx) => {
          if (!res.error && res.data) {
            const assign = assignList[idx];
            const data: any = res.data;

            // Extract student-specific duedate override if present
            if (data.gradingsummary?.duedate && data.gradingsummary.duedate > 0) {
              assign.dueDate = new Date(data.gradingsummary.duedate * 1000).toISOString();
            }
            if (data.gradingsummary?.cutoffdate && data.gradingsummary.cutoffdate > 0) {
              assign.cutoffDate = new Date(data.gradingsummary.cutoffdate * 1000).toISOString();
            }

            // Extract submission status
            const subStatus = data.lastattempt?.submission?.status;
            if (subStatus === 'submitted') {
              assign.status = 'submitted';
            }
          }
        });
      } catch {}
    }

    const assignments = Array.from(assignmentsMap.values());

    // 6. CONTROLLED HTML FALLBACK: Only if API returned zero assignments or missing duedate
    if (assignments.length === 0) {
      for (const course of courses.slice(0, 8)) {
        try {
          const courseHtml = await this.fetchPage(`${MOODLE_CONFIG.baseUrl}/course/view.php?id=${course.sourceId}`);
          const parsed = MoodleHtmlParser.parseAssignments(courseHtml, course.sourceId);
          parsed.forEach(a => {
            a.courseName = course.name;
            assignments.push(a);
          });
        } catch {}
      }
      detectedTier = 'level4_html';
    }

    // Deep check view.php for assignments with null dueDate
    for (const assign of assignments) {
      if (!assign.dueDate && assign.url) {
        try {
          const assignHtml = await this.fetchPage(assign.url);
          const $ = cheerio.load(assignHtml);

          let foundDateText = '';
          $('[data-region="activity-dates"], .activity-dates, .submissionstatustable, .generaltable tr').each((_, el) => {
            const text = $(el).text();
            if (text.includes('Jatuh tempo') || text.includes('Batas waktu') || text.includes('Due') || text.includes('Tenggat')) {
              foundDateText = text;
            }
          });

          if (foundDateText) {
            const parsedIso = parseIndonesianDateStringToISO(foundDateText);
            if (parsedIso) {
              assign.dueDate = parsedIso;
            }
          }
        } catch {}
      }
    }

    return { assignments, tier: detectedTier };
  }

  /**
   * Fetch Calendar events
   */
  async getCalendarEvents(): Promise<{ events: CalendarEvent[]; tier: string }> {
    if (this.session.sesskey) {
      try {
        const ajaxRes = await this.executeAjax<any>([
          {
            index: 0,
            methodname: 'core_calendar_get_calendar_monthly_view',
            args: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
          },
        ]);
        if (ajaxRes[0] && !ajaxRes[0].error && ajaxRes[0].data?.weeks) {
          const rawEvents: any[] = [];
          ajaxRes[0].data.weeks.forEach((w: any) => {
            w.days.forEach((d: any) => {
              if (d.events && Array.isArray(d.events)) {
                rawEvents.push(...d.events);
              }
            });
          });
          const events = rawEvents.map(e => MoodleNormalizer.normalizeCalendarEvent(e));
          return { events, tier: 'level2_ajax' };
        }
      } catch {}
    }

    return { events: [], tier: 'level4_html' };
  }

  /**
   * Fetch Announcements
   */
  async getAnnouncements(): Promise<{ announcements: Announcement[]; tier: string }> {
    try {
      const html = await this.fetchPage(MOODLE_CONFIG.announcementsUrl);
      const parsed = MoodleHtmlParser.parseAnnouncements(html);
      return { announcements: parsed, tier: 'level4_html' };
    } catch {
      try {
        const frontpageHtml = await this.fetchPage(MOODLE_CONFIG.baseUrl);
        const parsed = MoodleHtmlParser.parseAnnouncements(frontpageHtml);
        return { announcements: parsed, tier: 'level4_html' };
      } catch {
        return { announcements: [], tier: 'level4_html' };
      }
    }
  }

  /**
   * Fetch User Profile
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const html = await this.fetchPage(`${MOODLE_CONFIG.baseUrl}/user/profile.php`);
      return MoodleHtmlParser.parseUserProfile(html, this.session.username);
    } catch {
      return {
        id: `user_${this.session.username}`,
        sourceId: this.session.username,
        nim: this.session.username,
        fullname: this.session.fullname || this.session.username,
        department: 'Teknik Informatika dan Komputer',
        program: 'Politeknik Negeri Jakarta',
        lastLogin: new Date().toISOString(),
      };
    }
  }
}
