/**
 * Spiegelt die Antwort von ai-service POST /rag/ask (routers/rag.py).
 * snake_case bleibt hier absichtlich erhalten — das Umbenennen auf camelCase
 * passiert erst in AskAboutMaterialsUseCase, damit diese Datei ein 1:1-Abbild
 * des Wire-Formats bleibt und ein Vergleich mit rag.py trivial ist.
 */

/**
 * Ein Zitat verankert EINEN Satz der Antwort in EINER Textstelle des Materials.
 *
 * Unterschied zu `sources`: sources sagt nur "diese drei Chunks lagen im
 * Kontext", citations sagt "genau dieser Halbsatz stammt aus Zeichen 120-190
 * von Chunk 2". Für die UI heißt das: anklickbare Belege statt einer pauschalen
 * Quellenliste.
 *
 * `document_index` ist der Index im `sources`-Array oben — die Reihenfolge ist
 * auf der Python-Seite identisch aufgebaut.
 *
 * Bei Text-Dokumenten (der /rag/ask-Fall) kommt `char_location` mit
 * start/end_char_index. PDFs liefern stattdessen `page_location` mit
 * Seitenzahlen — deshalb sind beide Feldgruppen optional.
 */
export interface RagCitation {
  type: 'char_location' | 'page_location' | 'content_block_location' | string;
  cited_text: string;
  document_index: number;
  document_title?: string;
  start_char_index?: number;
  end_char_index?: number;
  start_page_number?: number;
  end_page_number?: number;
}

export interface RagAskResult {
  answer: string;
  sources: Array<{ lesson_id: string; material_id: string; similarity: number; excerpt: string }>;
  /** Leer, wenn die Antwort aus der Websuche kam — dort liefert Anthropic eigene Quellen. */
  citations: RagCitation[];
  fallback?: 'web_search';
  search_queries?: string[];
  /**
   * Welche Werkzeuge der Websuche-Fallback tatsächlich aufgerufen hat, in
   * Aufrufreihenfolge (z.B. ["exa_search", "exa_search", "exa_get_contents"]).
   * Nur beim Fallback gesetzt. Nützlich fürs Debugging: zwei exa_search-Einträge
   * hintereinander heißen, dass die erste Formulierung nichts gefunden hat und
   * das Modell selbstständig umformuliert hat.
   */
  tools_used?: string[];
}

export interface IRagService {
  /**
   * Fragt ai-service /rag/ask. requesterId ist immer req.user!.profileId des
   * eingeloggten Nutzers — ai-service scoped die Suche darauf (siehe rag.py).
   */
  ask(requesterId: string, question: string, lessonId?: string, topK?: number): Promise<RagAskResult>;
}
