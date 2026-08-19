import { NextRequest, NextResponse } from 'next/server';
import { MoodleAuthService } from '@/lib/moodle/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username (NIM) dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await MoodleAuthService.login(username, password);

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Autentikasi gagal.' },
        { status: 401 }
      );
    }

    // Create secure session payload for client cookie
    const sessionPayload = Buffer.from(JSON.stringify(result.session)).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: {
        username: result.session.username,
        fullname: result.session.fullname,
        hasWsToken: !!result.session.wstoken,
      },
    });

    // Set HTTP-only secure cookie
    response.cookies.set('pnj_moodle_session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: `Terjadi kesalahan internal server: ${err?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
