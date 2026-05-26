
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTrialLessonMutation } from '@shared/api/lessonApi';

interface Props { tutorId: string; }

export const BookTrialButton = ({ tutorId }: Props) => {
  const navigate = useNavigate();
  const [createTrial, { isLoading }] = useCreateTrialLessonMutation();
  const [error, setError] = useState<string | null>(null);
  const [date, setDate]   = useState('');
  const [time, setTime]   = useState('');
  const [open, setOpen]   = useState(false);

  const handleBook = async () => {
    if (!date || !time) { setError('Bitte Datum und Uhrzeit wählen.'); return; }
    setError(null);
    try {
      const result = await createTrial({
        tutorId,
        subjectId: '', // TODO: выбор предмета
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
      }).unwrap();
      navigate(`/lessons/${result.lessonId}`);
    } catch (err: any) {
      setError(err?.data?.message ?? 'Fehler beim Buchen.');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-block bg-white text-blue-600 font-medium text-sm
          px-6 py-2 rounded-lg hover:bg-blue-50 transition"
      >
        Probestunde buchen
      </button>
    );
  }

  return (
    <div className="space-y-3 max-w-xs mx-auto">
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 border border-white/30 bg-white/10 text-white rounded-lg
            px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50
            placeholder-white/60"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="flex-1 border border-white/30 bg-white/10 text-white rounded-lg
            px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      {error && <p className="text-red-200 text-xs text-center">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 text-sm text-white/70 hover:text-white transition"
        >
          Abbrechen
        </button>
        <button
          onClick={handleBook}
          disabled={isLoading}
          className="flex-1 bg-white text-blue-600 font-medium text-sm
            px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
        >
          {isLoading ? '...' : 'Bestätigen'}
        </button>
      </div>
    </div>
  );
};