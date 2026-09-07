import { useGetLessonSummaryQuery } from '@shared/api/lessonApi';

interface Props {
  lessonId: string;
}

/**
 * Rendert das feste Format aus anthropic_client.py's generate_summary() System-Prompt:
 * "## Topics Covered / ## Key Points / ## Homework (if any)", mit "- "-Listen und **bold**.
 *
 * Bewusst kein react-markdown (nicht in package.json) — der Inhalt kommt aus einem
 * festen, selbst kontrollierten Prompt, kein beliebiges Nutzer-Markdown. Für freieres
 * Markdown später: react-markdown ist der Standard-Ersatz für diese Funktion.
 */
function renderInline(text: string): Array<string | JSX.Element> {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="text-white font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

function renderMarkdownLite(text: string): JSX.Element[] {
  const lines = text.split('\n');
  const blocks: JSX.Element[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc list-inside space-y-1 text-sm text-gray-200">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      flushList(`list-${i}`);
      blocks.push(
        <h3 key={i} className="text-sm font-semibold text-blue-300 mt-4 first:mt-0">
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
    } else if (line.length > 0) {
      flushList(`list-${i}`);
      blocks.push(
        <p key={i} className="text-sm text-gray-300">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList('list-end');
  return blocks;
}

export function LessonSummaryCard({ lessonId }: Props) {
  // Саммари генерируется асинхронно (BullMQ после completion) — поллим как и
  // основной getLesson на этой же странице (LessonPage.tsx, 15s).
  const { data, isLoading } = useGetLessonSummaryQuery(lessonId, {
    pollingInterval: 15_000,
  });

  if (isLoading) return null;

  if (!data || data.status === 'not_ready') {
    return (
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 text-left">
        <p className="text-gray-400 text-sm flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          Zusammenfassung wird noch erstellt…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 text-left space-y-1 max-h-96 overflow-y-auto">
      <p className="text-blue-300 font-semibold text-sm mb-2">📝 Zusammenfassung der Stunde</p>
      {renderMarkdownLite(data.content)}
    </div>
  );
}
