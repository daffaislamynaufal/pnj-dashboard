import { NextRequest, NextResponse } from 'next/server';
import { MoodleSessionData } from '@/types/moodle';
import { MoodleClient } from '@/lib/moodle/client';

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('pnj_moodle_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'Belum terautentikasi. Silakan login ke PNJ E-Learning terlebih dahulu.' },
      { status: 401 }
    );
  }

  try {
    const sessionData: MoodleSessionData = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString('utf-8')
    );

    const client = new MoodleClient(sessionData);

    // Parallel sync with controlled fallback
    const [coursesRes, calendarRes, announcementsRes, userProfile] = await Promise.all([
      client.getCourses().catch(() => ({ courses: [], tier: 'level4_html' })),
      client.getCalendarEvents().catch(() => ({ events: [], tier: 'level4_html' })),
      client.getAnnouncements().catch(() => ({ announcements: [], tier: 'level4_html' })),
      client.getUserProfile().catch(() => undefined),
    ]);

    const assignmentsRes = await client.getAssignments(coursesRes.courses).catch(() => ({
      assignments: [],
      tier: 'level4_html',
    }));

    return NextResponse.json({
      success: true,
      tier: coursesRes.tier || assignmentsRes.tier || 'level2_ajax',
      user: userProfile,
      courses: coursesRes.courses,
      assignments: assignmentsRes.assignments,
      quizzes: [],
      calendar: calendarRes.events,
      announcements: announcementsRes.announcements,
      grades: [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Gagal melakukan sinkronisasi dengan Moodle: ${err?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
