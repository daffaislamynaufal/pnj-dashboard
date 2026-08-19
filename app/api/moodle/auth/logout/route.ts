import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar.' });
  response.cookies.delete('pnj_moodle_session');
  return response;
}
