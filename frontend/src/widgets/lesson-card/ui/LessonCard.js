import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router-dom';
import { useCancelByClientMutation, useCancelByTutorMutation, useConfirmLessonMutation } from '@shared/api/lessonApi';
import { useSelector } from 'react-redux';
import { selectActiveRole } from '@entities/user/model/selectors';
const STATUS_LABELS = {
    pending: 'Anfrage',
    pending_reschedule: 'Umplanung',
    confirmed: 'Bestätigt',
    in_progress: 'Läuft',
    completed: 'Abgeschlossen',
    cancelled_by_client: 'Storniert (Schüler)',
    cancelled_by_tutor: 'Storniert (Lehrer)',
    no_show_client: 'Nicht erschienen',
    no_show_tutor: 'Lehrer nicht erschienen',
};
const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    pending_reschedule: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled_by_client: 'bg-red-100 text-red-600',
    cancelled_by_tutor: 'bg-red-100 text-red-600',
    no_show_client: 'bg-red-100 text-red-600',
    no_show_tutor: 'bg-red-100 text-red-600',
};
export const LessonCard = ({ lesson, role }) => {
    const navigate = useNavigate();
    const date = new Date(lesson.scheduledAt);
    const person = role === 'client' ? lesson.tutor : lesson.client;
    const activeRole = useSelector(selectActiveRole);
    const lessonId = lesson.id;
    const [confirmLesson] = useConfirmLessonMutation();
    const [cancelByClient] = useCancelByClientMutation();
    const [cancelByTutor] = useCancelByTutorMutation();
    const handleCancel = async () => {
        if (!confirm('Unterricht wirklich absagen?'))
            return;
        if (activeRole === 'client') {
            await cancelByClient({ lessonId }).unwrap().catch(() => { });
        }
        else {
            await cancelByTutor({ lessonId }).unwrap().catch(() => { });
        }
        navigate('/dashboard');
    };
    return (_jsxs(Link, { to: `/lessons/${lesson.id}`, className: "bg-white rounded-2xl border border-gray-100 p-4 flex items-center\r\n        justify-between gap-4 hover:shadow-md transition group", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex-shrink-0 w-14 text-center bg-gray-50 rounded-xl p-2", children: [_jsx("p", { className: "text-xs text-gray-400 uppercase", children: date.toLocaleDateString('de-DE', { month: 'short' }) }), _jsx("p", { className: "text-xl font-bold text-gray-900 leading-none", children: date.getDate() }), _jsx("p", { className: "text-xs text-gray-500", children: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm group-hover:text-blue-600 transition", children: person ? `${person.name} ${person.surname}` : '—' }), _jsxs("p", { className: "text-xs text-gray-500 mt-0.5", children: [lesson.durationMinutes, " Min. \u00B7 ", lesson.type === 'trial' ? 'Probestunde' : 'Regulär'] })] })] }), activeRole === 'tutor' && lesson.status === 'pending' && (_jsx("button", { onClick: () => confirmLesson(lessonId), className: "bg-green-600 hover:bg-green-700 text-white text-sm font-medium\r\n            px-4 py-2 rounded-xl transition", children: "Best\u00E4tigen" })), ['pending', 'confirmed'].includes(lesson.status) && (_jsx("button", { onClick: handleCancel, className: "bg-gray-700 hover:bg-red-700 text-white text-sm font-medium\r\n            px-4 py-2 rounded-xl transition", children: "Absagen" })), _jsx("span", { className: `text-xs font-medium px-3 py-1 rounded-full flex-shrink-0
        ${STATUS_COLORS[lesson.status] ?? 'bg-gray-100 text-gray-600'}`, children: STATUS_LABELS[lesson.status] ?? lesson.status })] }));
};
