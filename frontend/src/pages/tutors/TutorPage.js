import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { useGetTutorByIdQuery, useGetTutorSlotsQuery } from '@shared/api/tutor/tutorPublicApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectActiveRole } from '@entities/user/model/selectors';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { BookTrialButton } from './components/BookTrialButton';
import { TutorSchedule } from './components/TutorSchedule';
import { LikeButton } from '@shared/ui/LikeButton';
import { useTranslation } from 'react-i18next';
export default function TutorPage() {
    const { t, i18n } = useTranslation('tutorPage');
    const lang = i18n.language;
    const { tutorId } = useParams();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const activeRole = useSelector(selectActiveRole);
    const { data: tutor, isLoading } = useGetTutorByIdQuery(tutorId ?? '', { skip: !tutorId });
    const { data: slotsData } = useGetTutorSlotsQuery(tutorId ?? '', { skip: !tutorId });
    if (isLoading)
        return _jsx(Layout, { children: _jsx(Spinner, {}) });
    if (!tutor)
        return (_jsx(Layout, { children: _jsx("div", { className: "text-center py-12 text-slate-400", children: t('notFound') }) }));
    const slots = (slotsData?.slots ?? []).map(s => ({ ...s, tutorId: tutor.id }));
    // Локализованные поля
    const displayName = lang === 'de' && tutor.nameDe
        ? `${tutor.nameDe} ${tutor.surnameDe ?? ''}`.trim()
        : lang === 'ru' && tutor.nameRu
            ? `${tutor.nameRu} ${tutor.surnameRu ?? ''}`.trim()
            : `${tutor.name} ${tutor.surname}`;
    const highlight = lang === 'ru' && tutor.highlightRu
        ? tutor.highlightRu
        : tutor.highlightDe;
    const fullDescription = lang === 'ru' && tutor.fulldescribeRu
        ? tutor.fulldescribeRu
        : tutor.fulldescribeDe;
    return (_jsx(Layout, { children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4", children: [_jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 p-6\r\n          flex flex-col sm:flex-row gap-6 relative", children: [_jsx(LikeButton, { tutorId: tutor.id, className: "absolute top-5 right-5" }), _jsx("div", { className: "w-24 h-24 rounded-2xl bg-blue-50 flex items-center justify-center\r\n            text-blue-600 font-bold text-3xl flex-shrink-0 overflow-hidden", children: tutor.avatarUrl
                                ? _jsx("img", { src: tutor.avatarUrl, alt: displayName, className: "w-24 h-24 object-cover" })
                                : `${tutor.name[0]}${tutor.surname[0]}` }), _jsxs("div", { className: "flex-1 pr-10", children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight text-slate-900", children: displayName }), lang !== 'de' && tutor.nameDe && (_jsxs("p", { className: "text-sm text-slate-400 mt-0.5", children: [tutor.nameDe, " ", tutor.surnameDe] })), _jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-2", children: [_jsxs("span", { className: "text-sm text-slate-500", children: ["\u2B50 ", tutor.ratingAvg.toFixed(1), ' ', _jsxs("span", { className: "text-slate-400", children: ["(", tutor.ratingCount, " ", t('reviews'), ")"] })] }), tutor.hourlyRate && (_jsxs("span", { className: "text-sm font-semibold text-slate-900", children: [tutor.hourlyRate, " ", t('perHour')] }))] }), highlight && (_jsx("p", { className: "text-sm text-slate-500 mt-3 leading-relaxed", children: highlight }))] })] }), fullDescription && (_jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 mb-3", children: t('about') }), _jsx("p", { className: "text-sm text-slate-500 whitespace-pre-line leading-relaxed", children: fullDescription })] })), _jsx(TutorSchedule, { slots: slots }), _jsxs("div", { className: "bg-blue-600 rounded-3xl p-6 text-white text-center", children: [_jsx("h2", { className: "text-xl font-bold mb-2", children: t('cta.title') }), _jsx("p", { className: "text-blue-200 text-sm mb-5", children: t('cta.subtitle') }), isAuthenticated && activeRole === 'client' ? (_jsx(BookTrialButton, { tutorId: tutor.id })) : !isAuthenticated ? (_jsx(Link, { to: "/login", className: "inline-block bg-white text-blue-600 font-semibold text-sm\r\n                px-6 py-2.5 rounded-xl hover:bg-blue-50 transition", children: t('cta.loginToBook') })) : (_jsx("p", { className: "text-blue-200 text-sm", children: t('cta.onlyClients') }))] })] }) }));
}
