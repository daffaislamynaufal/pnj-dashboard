import { NextRequest, NextResponse } from 'next/server';
import { AIAssistantService } from '@/lib/ai/ai-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, action, assignments, courses } = body;

    if (action === 'generate_plan') {
      const plan = await AIAssistantService.generateStudyPlan(assignments || [], courses || []);
      return NextResponse.json({ reply: plan });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format pesan tidak valid.' }, { status: 400 });
    }

    const reply = await AIAssistantService.chat(messages);
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Gagal berkomunikasi dengan AI Assistant via 9Router.' },
      { status: 500 }
    );
  }
}
