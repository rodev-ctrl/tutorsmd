import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTrialLessonMutation } from '@shared/api/lessonApi';
import { SUBJECTS, getSubjectName } from '@shared/config/subjects';
import { useTranslation } from 'react-i18next';

interface TutorSubject {
  id: string;
  name: string;
}

interface Props {
  tutorId: string;
  subjects: TutorSubject[];
}

export const BookTrialButton = ({
  tutorId,
  subjects,
}: Props) => {
  const navigate = useNavigate();

  const { i18n } = useTranslation();

  const lang = i18n.language;

  const [createTrial, { isLoading }] =
    useCreateTrialLessonMutation();

  const [error, setError] =
    useState<string | null>(null);

  const [date, setDate] =
    useState('');

  const [time, setTime] =
    useState('');

  const [subjectId, setSubjectId] =
    useState('');

  const [open, setOpen] =
    useState(false);

  const availableSubjects = SUBJECTS.filter(
    subject =>
      subjects.some(
        tutorSubject =>
          tutorSubject.id === subject.id,
      ),
  );

  const handleBook = async () => {
    if (!date || !time) {
      setError(
        'Bitte Datum und Uhrzeit wählen.',
      );
      return;
    }

    if (!subjectId) {
      setError(
        'Bitte ein Fach wählen.',
      );
      return;
    }

    setError(null);

    try {
      const result =
        await createTrial({
          tutorId,
          subjectId,
          scheduledAt: new Date(
            `${date}T${time}`,
          ).toISOString(),
        }).unwrap();

      navigate(
        `/lessons/${result.lessonId}`,
      );
    } catch (err: any) {
      setError(
        err?.data?.message ??
          'Fehler beim Buchen.',
      );
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="
          inline-block
          bg-white
          text-blue-600
          font-medium
          text-sm
          px-6
          py-2
          rounded-lg
          hover:bg-blue-50
          transition
        "
      >
        Probestunde buchen
      </button>
    );
  }

  return (
    <div className="space-y-3 max-w-sm mx-auto text-left">

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Fach
        </label>

        <div className="flex flex-wrap gap-2">
          {availableSubjects.map(subject => (
            <button
              key={subject.id}
              type="button"
              onClick={() =>
                setSubjectId(subject.id)
              }
              className={`
                flex items-center gap-2
                px-3 py-2 rounded-lg text-sm
                border transition

                ${
                  subjectId === subject.id
                    ? `
                      bg-white
                      text-blue-600
                      border-white
                    `
                    : `
                      bg-white/10
                      text-white
                      border-white/30
                      hover:bg-white/20
                    `
                }
              `}
            >
              <span>{subject.icon}</span>

              {getSubjectName(
                subject,
                lang,
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          min={
            new Date()
              .toISOString()
              .split('T')[0]
          }
          onChange={e =>
            setDate(
              e.target.value,
            )
          }
          className="
            flex-1
            border
            border-white/30
            bg-white/10
            text-white
            rounded-lg
            px-3
            py-2
            text-sm
          "
        />

        <input
          type="time"
          value={time}
          onChange={e =>
            setTime(
              e.target.value,
            )
          }
          className="
            flex-1
            border
            border-white/30
            bg-white/10
            text-white
            rounded-lg
            px-3
            py-2
            text-sm
          "
        />
      </div>

      {error && (
        <p className="text-red-200 text-xs">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() =>
            setOpen(false)
          }
          className="
            flex-1
            text-sm
            text-white/70
            hover:text-white
          "
        >
          Abbrechen
        </button>

        <button
          onClick={handleBook}
          disabled={isLoading}
          className="
            flex-1
            bg-white
            text-blue-600
            font-medium
            text-sm
            px-4
            py-2
            rounded-lg
            disabled:opacity-50
          "
        >
          {isLoading
            ? '...'
            : 'Bestätigen'}
        </button>
      </div>
    </div>
  );
};