// application/usecases/lesson/material/AskAboutMaterialsUseCase.ts
import { ILessonRepository } from '../../../../domain/repositories/lesson/ILessonRepository';
import { ClientId, TutorId, LessonId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';
import { IRagService, RagCitation } from '../../../ports/IRagService';

export interface AskAboutMaterialsDto {
  lessonId:      string;
  requesterId:   string;       // client.id или tutor.id
  requesterRole: 'client' | 'tutor';
  question:      string;
}

export interface AskAboutMaterialsSource {
  lessonId:   string;
  materialId: string;
  similarity: number;
  excerpt:    string;
}

export interface AskAboutMaterialsResult {
  answer:         string;
  sources:        AskAboutMaterialsSource[];
  /**
   * Belegstellen pro Aussage. `documentIndex` zeigt in das `sources`-Array —
   * damit kann die UI einen zitierten Satz direkt dem Material zuordnen und
   * die Originalstelle hervorheben.
   */
  citations:      AskAboutMaterialsCitation[];
  fallback?:      'web_search';
  searchQueries?: string[];
  /** Nur beim Websuche-Fallback: welche Werkzeuge in welcher Reihenfolge liefen. */
  toolsUsed?:     string[];
}

export interface AskAboutMaterialsCitation {
  citedText:      string;
  documentIndex:  number;
  documentTitle?: string;
  startCharIndex?: number;
  endCharIndex?:   number;
}

export class AskAboutMaterialsUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
    private readonly ragService: IRagService,
  ) {}

  async execute(dto: AskAboutMaterialsDto): Promise<AskAboutMaterialsResult> {
    const lessonId = new LessonId(dto.lessonId);

    // 1. Найти урок
    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // 2. Проверить участника — только клиент или тьютор этого урока
    if (dto.requesterRole === 'client') {
      const clientId = new ClientId(dto.requesterId);
      if (lesson.clientId !== clientId.value) {
        throw new DomainError('You are not the client of this lesson');
      }
    } else {
      const tutorId = new TutorId(dto.requesterId);
      if (lesson.tutorId !== tutorId.value) {
        throw new DomainError('You are not the tutor of this lesson');
      }
    }

    // 3. RAG-Anfrage an ai-service — dort per requester_id + lesson_id gescoped
    const result = await this.ragService.ask(dto.requesterId, dto.question, dto.lessonId);

    return {
      answer: result.answer,
      sources: result.sources.map((s) => ({
        lessonId:   s.lesson_id,
        materialId: s.material_id,
        similarity: s.similarity,
        excerpt:    s.excerpt,
      })),
      // Bewusst Feld für Feld statt Spread: die Python-Antwort ist snake_case,
      // und ein Spread würde neue Felder unbenannt durchreichen. Wer hier ein
      // Feld ergänzt, muss es auch in IRagService.ts ergänzen — genau das ist
      // der Zweck der expliziten Abbildung.
      citations: (result.citations ?? []).map((c: RagCitation) => ({
        citedText:      c.cited_text,
        documentIndex:  c.document_index,
        documentTitle:  c.document_title,
        startCharIndex: c.start_char_index,
        endCharIndex:   c.end_char_index,
      })),
      fallback:      result.fallback,
      searchQueries: result.search_queries,
      toolsUsed:     result.tools_used,
    };
  }
}
