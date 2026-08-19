import { NextResponse } from 'next/server';
import { MoodleDiscoveryService } from '@/lib/moodle/discovery';

export async function GET() {
  try {
    const report = await MoodleDiscoveryService.discover();
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Gagal menjalankan discovery Moodle: ${err?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
