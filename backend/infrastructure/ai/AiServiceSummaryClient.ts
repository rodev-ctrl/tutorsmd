import { ILessonSummaryService } from '../../application/ports/ILessonSummaryService';
import { signServiceToken } from './ServiceTokenFactory';

export class AiServiceSummaryClient implements ILessonSummaryService {
  private readonly baseUrl = process.env.AI_SERVICE_URL ?? 'http://tutors-ai:8000';

  async generateSummary(lessonId: string): Promise<void> {
    const token = signServiceToken();

    const res = await fetch(`${this.baseUrl}/summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lesson_id: lessonId }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`ai-service /summary/generate failed: ${res.status} ${body}`);
    }
  }
}
