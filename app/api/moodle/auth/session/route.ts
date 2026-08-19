import { NextRequest, NextResponse } from 'next/server';
import { MoodleSessionData } from '@/types/moodle';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('pnj_moodle_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const sessionData: MoodleSessionData = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString('utf-8')
    );

    if (Date.now() > sessionData.expiresAt) {
      const res = NextResponse.json({ authenticated: false, reason: 'expired' }, { status: 401 });
      res.cookies.delete('pnj_moodle_session');
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: sessionData.username,
        fullname: sessionData.fullname,
        hasWsToken: !!sessionData.wstoken,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
