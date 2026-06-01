import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetTutorsQuery } from '@shared/api/tutor/tutorPublicApi';
import { Spinner } from '@shared/index';
export const TutorsPreview = () => {
    const { t, i18n } = useTranslation('home');
    const lang = i18n.language;
    const { data, isLoading } = useGetTutorsQuery({ limit: 3, page: 1 });
    const tutors = data?.tutors ?? [];
    return (_jsxs("section", { className: "max-w-5xl mx-auto px-6 py-16", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3", children: [_jsx("h2", { className: "text-3xl font-bold tracking-tight text-slate-900", children: t('tutorsPreview.title') }), _jsxs(Link, { to: "/tutors", className: "text-sm text-blue-600 hover:text-blue-700 hover:underline self-start sm:self-auto", children: [t('tutorsPreview.viewAll'), " \u2192"] })] }), isLoading ? (_jsx(Spinner, {})) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: tutors.map((tutor) => (_jsxs(Link, { to: `/tutors/${tutor.id}`, className: "bg-white rounded-3xl border border-slate-200 p-5\r\n                hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-blue-50 flex items-center\r\n                justify-center text-blue-600 font-bold text-xl mb-4 flex-shrink-0 overflow-hidden", children: tutor.avatarUrl
                                ? _jsx("img", { src: tutor.avatarUrl, alt: "", className: "w-14 h-14 object-cover" })
                                : `${tutor.name[0]}${tutor.surname[0]}` }), _jsx("p", { className: "font-semibold text-slate-900 text-sm\r\n                group-hover:text-blue-600 transition-colors", children: lang === 'de' && tutor.nameDe
                                ? `${tutor.nameDe} ${tutor.surnameDe}`
                                : lang === 'ru' && tutor.nameRu
                                    ? `${tutor.nameRu} ${tutor.surnameRu}`
                                    : `${tutor.name} ${tutor.surname}` }), _jsxs("p", { className: "text-xs text-slate-400 mt-0.5", children: ["\u2B50 ", tutor.ratingAvg.toFixed(1), ' ', _jsxs("span", { className: "text-slate-300", children: ["(", tutor.ratingCount, " ", t('tutorsPreview.reviews'), ")"] })] }), (tutor.highlightDe || tutor.highlightRu) && (_jsx("p", { className: "text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed", children: lang === 'ru' && tutor.highlightRu
                                ? tutor.highlightRu
                                : tutor.highlightDe })), tutor.hourlyRate && (_jsxs("p", { className: "text-sm font-semibold text-slate-900 mt-3", children: [tutor.hourlyRate, " ", t('tutorsPreview.perHour')] }))] }, tutor.id))) }))] }));
};
