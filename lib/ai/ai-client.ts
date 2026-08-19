import { AI_ROUTER_CONFIG } from '../moodle/config';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIAssistantService {
  /**
   * Calls Azbry DeepSeek AI Free API
   */
  static async chat(messages: AIMessage[]): Promise<string> {
    try {
      // Build context prompt from conversation history
      const prompt = messages
        .map(m => (m.role === 'user' ? `User: ${m.content}` : `Assistant: ${m.content}`))
        .join('\n\n');

      const encodedText = encodeURIComponent(prompt);
      const url = `${AI_ROUTER_CONFIG.endpointUrl}?text=${encodedText}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 PNJAcademicDashboard/1.0',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`API DeepSeek merespons dengan HTTP ${res.status}`);
      }

      const data = await res.json();

      // Extract response from result object or string
      if (data?.result?.response) {
        return data.result.response;
      } else if (typeof data?.result === 'string') {
        return data.result;
      } else if (data?.response) {
        return data.response;
      }

      return 'Maaf, tidak dapat membaca respon dari AI.';
    } catch (err: any) {
      throw new Error(`Gagal menghubungi DeepSeek AI: ${err?.message || 'Koneksi terputus.'}`);
    }
  }

  /**
   * Generates intelligent academic daily study plan
   */
  static async generateStudyPlan(assignments: any[], courses: any[]): Promise<string> {
    const prompt = `Kamu adalah Asisten Akademik Mahasiswa Politeknik Negeri Jakarta (PNJ).
Berikut adalah data tugas aktif dan mata kuliah mahasiswa:
- Mata Kuliah: ${courses.map(c => c.name).join(', ')}
- Daftar Tugas & Deadline: ${JSON.stringify(assignments.map(a => ({ title: a.title, course: a.courseName, dueDate: a.dueDate, status: a.status })))}

Tugas kamu:
1. Buatkan prioritas pengerjaan tugas hari ini berdasarkan deadline terdekat.
2. Berikan tips strategi pengerjaan yang efisien dan to-the-point.
3. Gunakan bahasa Indonesia yang ramah, semangat, dan rapi dengan format bullet points.`;

    return await this.chat([
      { role: 'system', content: 'Kamu adalah asisten studi pintar mahasiswa PNJ.' },
      { role: 'user', content: prompt },
    ]);
  }
}
