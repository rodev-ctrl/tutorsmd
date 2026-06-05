import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectActiveRole } from '@entities/user/model/selectors';
import {
  useConfirmLessonMutation,
  useRejectLessonMutation,
  useCancelByClientMutation,
  useCancelByTutorMutation,
  useAcceptRescheduleMutation,
  useDeclineRescheduleMutation,
  type Lesson,
} from '@shared/api/lessonApi';

const STATUS_LABELS: Record<string, string> = {
  pending:             'Anfrage',
  pending_reschedule:  'Umplanung',
  confirmed:           'Bestätigt',
  in_progress:         'Läuft',
  completed:           'Abgeschlossen',
  cancelled_by_client: 'Storniert (Schüler)',
  cancelled_by_tutor:  'Storniert (Lehrer)',
  rescheduled:         'Umgeplant',
  no_show_client:      'Nicht erschienen',
  no_show_tutor:       'Lehrer nicht erschienen',
};

const STATUS_COLORS: Record<string, string> = {
  pending:             'bg-yellow-100 text-yellow-700',
  pending_reschedule:  'bg-orange-100 text-orange-700',
  confirmed:           'bg-green-100 text-green-700',
  in_progress:         'bg-blue-100 text-blue-700',
  completed:           'bg-gray-100 text-gray-600',
  cancelled_by_client: 'bg-red-100 text-red-600',
  cancelled_by_tutor:  'bg-red-100 text-red-600',
  rescheduled:         'bg-purple-100 text-purple-600',
  no_show_client:      'bg-red-100 text-red-600',
  no_show_tutor:       'bg-red-100 text-red-600',
};

interface Props {
  lesson: Lesson;
  role:   'client' | 'tutor' | 'admin';
}

export const LessonCard = ({ lesson, role }: Props) => {
  const navigate   = useNavigate();
  const activeRole = useSelector(selectActiveRole);
  const lessonId   = lesson.id;
  const status     = lesson.status;

  const [confirm]           = useConfirmLessonMutation();
  const [reject]            = useRejectLessonMutation();
  const [cancelByClient]    = useCancelByClientMutation();
  const [cancelByTutor]     = useCancelByTutorMutation();
  const [acceptReschedule]  = useAcceptRescheduleMutation();
  const [declineReschedule] = useDeclineRescheduleMutation();

  const date   = new Date(lesson.scheduledAt);
  const person = role === 'client' ? lesson.tutor : lesson.client;

  const handleConfirm = async () => {
    await confirm(lessonId).unwrap().catch(() => {});
  };

  const handleReject = async () => {
    await reject(lessonId).unwrap().catch(() => {});
  };

  const handleCancel = async () => {
    if (!window.confirm('Unterricht wirklich absagen?')) return;
    if (activeRole === 'client') await cancelByClient({ lessonId }).unwrap().catch(() => {});
    else                         await cancelByTutor({ lessonId }).unwrap().catch(() => {});
  };

  const handleAccept = async () => {
    const result = await acceptReschedule(lessonId).unwrap().catch(() => null);
    if (result) navigate(`/lessons/${result.newLessonId}`);
  };

  const handleDecline = async () => {
    await declineReschedule(lessonId).unwrap().catch(() => {});
  };

  const handleJoin = () => navigate(`/lessons/${lessonId}`);

  const isTerminal = ['completed','cancelled_by_client','cancelled_by_tutor',
                      'rescheduled','no_show_client','no_show_tutor'].includes(status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4
      flex items-start justify-between gap-4 shadow-sm">

      {/* Левая часть — дата + инфо */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Дата */}
        <div className="flex-shrink-0 w-14 text-center bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-400 uppercase leading-none">
            {date.toLocaleDateString('de-DE', { month: 'short' })}
          </p>
          <p className="text-xl font-bold text-gray-900 leading-tight">{date.getDate()}</p>
          <p className="text-xs text-gray-500">
            {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Инфо */}
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {person ? `${person.name} ${person.surname}` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {lesson.durationMinutes} Min.
            {' · '}{lesson.type === 'trial' ? 'Probestunde' : 'Regulär'}
          </p>
          {status === 'pending_reschedule' && lesson.proposedScheduledAt && (
            <p className="text-xs text-orange-600 mt-1">
              📅 Vorschlag: {new Date(lesson.proposedScheduledAt).toLocaleString('de-DE')}
            </p>
          )}
          {/* Статус badge */}
          <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5
            rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
      </div>

      {/* Правая часть — кнопки */}
      {!isTerminal && (
        <div className="flex flex-col gap-2 flex-shrink-0">

          {/* Присоединиться */}
          {(status === 'confirmed' || status === 'in_progress') && (
            <button onClick={handleJoin}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs
                font-medium px-3 py-1.5 rounded-lg transition">
              Beitreten →
            </button>
          )}

          {/* Тьютор: подтвердить pending */}
          {status === 'pending' && activeRole === 'tutor' && (
            <button onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 text-white text-xs
                font-medium px-3 py-1.5 rounded-lg transition">
              ✓ Bestätigen
            </button>
          )}

          {/* Тьютор: отклонить pending */}
          {status === 'pending' && activeRole === 'tutor' && (
            <button onClick={handleReject}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs
                font-medium px-3 py-1.5 rounded-lg transition">
              Ablehnen
            </button>
          )}

          {/* Клиент: принять перенос */}
          {status === 'pending_reschedule' && activeRole === 'client' && (
            <button onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 text-white text-xs
                font-medium px-3 py-1.5 rounded-lg transition">
              ✓ Annehmen
            </button>
          )}

          {/* Клиент: отклонить перенос */}
          {status === 'pending_reschedule' && activeRole === 'client' && (
            <button onClick={handleDecline}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs
                font-medium px-3 py-1.5 rounded-lg transition">
              Ablehnen
            </button>
          )}

          {/* Отмена — для pending и confirmed */}
          {['pending', 'confirmed'].includes(status) && (
            <button onClick={handleCancel}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs
                font-medium px-3 py-1.5 rounded-lg transition border border-red-200">
              Absagen
            </button>
          )}
        </div>
      )}

      {/* Терминальный статус — только ссылка на урок */}
      {isTerminal && (
        <button onClick={handleJoin}
          className="text-xs text-gray-400 hover:text-gray-600 transition flex-shrink-0">
          Details →
        </button>
      )}
    </div>
  );
};