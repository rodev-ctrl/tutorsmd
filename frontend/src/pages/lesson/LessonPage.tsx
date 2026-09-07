import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveRole } from '@entities/user/model/selectors';
import {
  useGetLessonQuery,
  useConfirmLessonMutation,
  useRejectLessonMutation,
  useCancelByClientMutation,
  useCancelByTutorMutation,
  useProposeRescheduleMutation,
  useAcceptRescheduleMutation,
  useDeclineRescheduleMutation,
} from '@shared/api/lessonApi';
import { Spinner } from '@shared/index';
import { VideoRoom }      from '@widgets/lesson/VideoRoom';
import { LessonChat }     from '@widgets/lesson/LessonChat';
import { Whiteboard }     from '@widgets/lesson/Whiteboard';
import { LessonControls } from '@widgets/lesson/LessonControls';
import { LessonSocketProvider } from '@shared/providers/LessonSocketProvider';
import { LessonSummaryCard } from '@widgets/lesson/LessonSummaryCard';

type Tab = 'chat' | 'whiteboard';

const STATUS_LABEL: Record<string, string> = {
  pending:             '⏳ Warte auf Bestätigung',
  pending_reschedule:  '📅 Umplanungsvorschlag',
  confirmed:           '✓ Bestätigt',
  in_progress:         '🟢 Unterricht läuft',
  completed:           '✓ Abgeschlossen',
  cancelled_by_client: '❌ Vom Schüler abgesagt',
  cancelled_by_tutor:  '❌ Vom Lehrer abgesagt',
  rescheduled:         '📅 Umgeplant',
  no_show_client:      '🚫 Schüler nicht erschienen',
  no_show_tutor:       '🚫 Lehrer nicht erschienen',
};

const TERMINAL = new Set([
  'completed','cancelled_by_client','cancelled_by_tutor',
  'rescheduled','no_show_client','no_show_tutor',
]);

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate     = useNavigate();
  const role         = useSelector(selectActiveRole);

  const { data: lesson, isLoading, refetch } = useGetLessonQuery(lessonId ?? '', {
    skip: !lessonId,
    pollingInterval: 15_000,
  });

  const [confirm]        = useConfirmLessonMutation();
  const [reject]         = useRejectLessonMutation();
  const [cancelClient]   = useCancelByClientMutation();
  const [cancelTutor]    = useCancelByTutorMutation();
  const [propose]        = useProposeRescheduleMutation();
  const [acceptReschedule]  = useAcceptRescheduleMutation();
  const [declineReschedule] = useDeclineRescheduleMutation();

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [localStream, setLocalStream]    = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Cancel form
  const [showCancel, setShowCancel]   = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Propose reschedule form
  const [showPropose, setShowPropose]   = useState(false);
  const [proposeDate, setProposeDate]   = useState('');
  const [proposeTime, setProposeTime]   = useState('');

  if (!lessonId) return <Navigate to="/dashboard" replace />;
  if (isLoading) return <Spinner fullscreen />;
  if (!lesson)   return <Navigate to="/dashboard" replace />;

  const status     = lesson.status;
  const isTerminal = TERMINAL.has(status);
  const canJoin    = status === 'confirmed' || status === 'in_progress';

  const handleConfirm = async () => {
    await confirm(lessonId).unwrap().catch(() => {});
    refetch();
  };

  const handleReject = async () => {
    await reject(lessonId).unwrap().catch(() => {});
    navigate('/dashboard');
  };

  const handleCancel = async () => {
    try {
      if (role === 'client') await cancelClient({ lessonId, reason: cancelReason }).unwrap();
      else                   await cancelTutor({ lessonId, reason: cancelReason }).unwrap();
      navigate('/dashboard');
    } catch (err) {
      // Отмена не прошла — остаёмся на странице. Пользователю ошибка пока
      // не показывается (в этом компоненте вообще нет механизма её вывода:
      // остальные обработчики так же гасят её через .catch(() => {})).
      // Логируем, чтобы отказ хотя бы был диагностируемым, а не невидимым.
      console.error('Не удалось отменить урок:', err);
    }
  };

  const handlePropose = async () => {
    if (!proposeDate || !proposeTime) return;
    await propose({
      lessonId,
      newScheduledAt: new Date(`${proposeDate}T${proposeTime}`).toISOString(),
    }).unwrap().catch(() => {});
    setShowPropose(false);
    refetch();
  };

  const handleAccept = async () => {
    const result = await acceptReschedule(lessonId).unwrap().catch(() => null);
    if (result) navigate(`/lessons/${result.newLessonId}`);
  };

  const handleDecline = async () => {
    await declineReschedule(lessonId).unwrap().catch(() => {});
    refetch();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800
        border-b border-gray-700 flex-shrink-0 gap-3 flex-wrap">

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            status === 'in_progress' ? 'bg-green-400 animate-pulse' :
            status === 'confirmed'   ? 'bg-blue-400' :
            status === 'pending'     ? 'bg-yellow-400' :
            status === 'pending_reschedule' ? 'bg-orange-400' : 'bg-gray-500'
          }`} />
          <span className="text-sm font-medium">{STATUS_LABEL[status] ?? status}</span>
        </div>

        {/* Time */}
        <span className="text-xs text-gray-400">
          {new Date(lesson.scheduledAt).toLocaleString('de-DE')}
          {' · '}{lesson.durationMinutes} Min.
          {' · '}{lesson.type === 'trial' ? 'Probestunde' : 'Regulär'}
        </span>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">

          {/* pending: тьютор подтверждает или отклоняет */}
          {status === 'pending' && role === 'tutor' && (
            <>
              <button onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700 text-white text-xs
                  font-medium px-3 py-1.5 rounded-lg transition">
                ✓ Bestätigen
              </button>
              <button onClick={handleReject}
                className="bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs
                  font-medium px-3 py-1.5 rounded-lg transition border border-red-600/40">
                Ablehnen
              </button>
            </>
          )}

          {/* pending: клиент может отменить */}
          {status === 'pending' && role === 'client' && !showCancel && (
            <button onClick={() => setShowCancel(true)}
              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs
                font-medium px-3 py-1.5 rounded-lg transition border border-red-600/30">
              Absagen
            </button>
          )}

          {/* confirmed: отмена для обоих */}
          {status === 'confirmed' && !showCancel && (
            <button onClick={() => setShowCancel(true)}
              className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs
                font-medium px-3 py-1.5 rounded-lg transition border border-red-600/30">
              Absagen
            </button>
          )}

          {/* confirmed: тьютор предлагает перенос */}
          {status === 'confirmed' && role === 'tutor' && !showPropose && (
            <button onClick={() => setShowPropose(true)}
              className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 text-xs
                font-medium px-3 py-1.5 rounded-lg transition border border-orange-600/30">
              Umplanen
            </button>
          )}

          {/* pending_reschedule: клиент принимает или отклоняет */}
          {status === 'pending_reschedule' && role === 'client' && (
            <>
              {lesson.proposedScheduledAt && (
                <span className="text-xs text-orange-300">
                  Vorschlag: {new Date(lesson.proposedScheduledAt).toLocaleString('de-DE')}
                </span>
              )}
              <button onClick={handleAccept}
                className="bg-green-600 hover:bg-green-700 text-white text-xs
                  font-medium px-3 py-1.5 rounded-lg transition">
                Annehmen
              </button>
              <button onClick={handleDecline}
                className="bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs
                  font-medium px-3 py-1.5 rounded-lg transition border border-red-600/40">
                Ablehnen
              </button>
            </>
          )}

        </div>
      </div>

      {/* Cancel form */}
      {showCancel && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3
          flex items-center gap-3 flex-shrink-0">
          <input
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Grund (optional)..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5
              text-sm text-white placeholder:text-gray-500 focus:outline-none
              focus:ring-2 focus:ring-red-500"
          />
          <button onClick={handleCancel}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition">
            Bestätigen
          </button>
          <button onClick={() => setShowCancel(false)}
            className="text-gray-400 text-xs hover:text-white transition px-2">
            ✕
          </button>
        </div>
      )}

      {/* Propose reschedule form */}
      {showPropose && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3
          flex items-center gap-3 flex-shrink-0 flex-wrap">
          <span className="text-xs text-gray-400">Neuer Termin:</span>
          <input type="date" value={proposeDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setProposeDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5
              text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input type="time" value={proposeTime}
            onChange={e => setProposeTime(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5
              text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <button onClick={handlePropose}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-lg transition">
            Senden
          </button>
          <button onClick={() => setShowPropose(false)}
            className="text-gray-400 text-xs hover:text-white transition px-2">
            ✕
          </button>
        </div>
      )}

      {/* Terminal state */}
      {isTerminal ? (
        <div className="flex-1 flex items-center justify-center bg-gray-900">
          <div className="text-center space-y-4 px-6">
            <p className="text-2xl">{STATUS_LABEL[status]}</p>
            {lesson.cancellationReason && (
              <p className="text-sm text-gray-400">Grund: {lesson.cancellationReason}</p>
            )}
            {status === 'completed' && (
              <div className="max-w-md mx-auto">
                <LessonSummaryCard lessonId={lessonId} />
              </div>
            )}
            {status === 'completed' && lesson.type === 'trial' && role === 'client' && (
        <div className="bg-blue-600/20 border border-blue-600/40 rounded-2xl p-5 text-left space-y-3">
          <p className="text-blue-300 font-semibold text-sm">
            🎉 Probestunde abgeschlossen!
          </p>
          <p className="text-gray-300 text-sm">
            Hat Ihnen die Stunde gefallen? Buchen Sie regelmäßige Unterrichtsstunden
            mit diesem Lehrer.
          </p>
          <button
            onClick={() => navigate(`/tutors/${lesson.tutorId}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
              font-medium px-4 py-2.5 rounded-xl transition">
            Reguläre Stunden buchen →
          </button>
        </div>
      )}
            <button onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm
                px-6 py-2.5 rounded-xl transition">
              Zum Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <LessonSocketProvider lessonId={lesson.id}>
           <div className="flex-1 flex flex-col overflow-hidden">
            <VideoRoom
              lessonId={lessonId}
              localStream={localStream}
              setLocalStream={setLocalStream}
              remoteStreams={remoteStreams}
              setRemoteStreams={setRemoteStreams}
              canJoin={canJoin}
            />
            <LessonControls localStream={localStream} />
           </div>

          <aside className="w-80 flex flex-col border-l border-gray-700
            bg-gray-800 flex-shrink-0">
            <div className="flex border-b border-gray-700 flex-shrink-0">
              {(['chat', 'whiteboard'] as Tab[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium transition
                    ${activeTab === tab
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-200'}`}>
                  {tab === 'chat' ? '💬 Chat' : '🖊 Whiteboard'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat'
                ? <LessonChat lessonId={lessonId} />
                : <Whiteboard lessonId={lessonId} />}
            </div>
          </aside>
         </LessonSocketProvider>
          
        </div>
      )}
    </div>
  );
}