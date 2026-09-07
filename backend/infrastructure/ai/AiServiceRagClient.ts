import { signServiceToken } from './ServiceTokenFactory';
import { IRagService, RagAskResult } from '../../application/ports/IRagService';

interface IngestResult {
  chunks_indexed: number;
  material_id: string;
}

/**
 * HTTP-Client für RAG-Aufrufe an ai-service. requester_id ist immer
 * req.user!.profileId (client.id oder tutor.id) des aktuell eingeloggten
 * Nutzers — ai-service scoped jede Suche/jeden Ingest damit auf dessen
 * eigene Lektionen (siehe rag.py / retrieval.py).
 */
export class AiServiceRagClient implements IRagService {
  private readonly baseUrl = process.env.AI_SERVICE_URL ?? 'http://tutors-ai:8000';

  private async post<T>(path: string, body: object, userId: string): Promise<T> {
    const token = signServiceToken(userId);

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ai-service ${path} failed: ${res.status} ${text}`);
    }

    return res.json() as Promise<T>;
  }

  ask(requesterId: string, question: string, lessonId?: string, topK = 3): Promise<RagAskResult> {
    return this.post<RagAskResult>('/rag/ask', {
      requester_id: requesterId,
      question,
      lesson_id: lessonId,
      top_k: topK,
    }, requesterId);
  }

  ingestMaterial(
    requesterId: string,
    lessonId: string,
    materialId: string,
    text: string,
    metadata?: Record<string, unknown>,
  ): Promise<IngestResult> {
    return this.post<IngestResult>('/rag/ingest', {
      requester_id: requesterId,
      lesson_id: lessonId,
      material_id: materialId,
      text,
      metadata,
    }, requesterId);
  }
}
