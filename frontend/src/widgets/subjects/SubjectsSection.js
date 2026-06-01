import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export const SubjectsSection = () => {
    const { t } = useTranslation('home');
    const subjects = t('subjects.items', { returnObjects: true });
    return (_jsx("section", { className: "py-16", style: {
            backgroundColor: 'white',
            backgroundImage: 'radial-gradient(circle, rgba(243,134,17,0.08) 2px, transparent 1px)',
            backgroundSize: '24px 24px',
        }, children: _jsxs("div", { className: "max-w-5xl mx-auto px-6", children: [_jsx("h2", { className: "text-3xl font-bold tracking-tight text-slate-900 mb-8 text-center", children: t('subjects.title') }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: subjects.map((subject) => (_jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("span", { className: "text-4xl", children: subject.icon }), _jsx("h3", { className: "text-lg font-semibold text-slate-900", children: subject.name })] }), _jsx("p", { className: "text-slate-500 text-sm leading-relaxed mb-4", children: subject.desc }), _jsx("div", { className: "flex flex-wrap gap-2", children: subject.levels.map((level) => (_jsx("span", { className: "bg-blue-50 text-blue-700 text-xs font-medium\r\n                      px-3 py-1 rounded-full", children: level }, level))) })] }, subject.name))) }), _jsx("div", { className: "text-center mt-10", children: _jsx(Link, { to: "/tutors", className: "inline-block bg-orange-500 hover:bg-orange-600 text-white\r\n              font-semibold px-8 py-3 rounded-xl transition text-sm\r\n              shadow-lg shadow-orange-200", children: t('subjects.cta') }) })] }) }));
};
