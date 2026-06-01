import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
export const TutorFilters = () => {
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState(params.get('search') ?? '');
    const [minRate, setMinRate] = useState(params.get('minRate') ?? '');
    const [maxRate, setMaxRate] = useState(params.get('maxRate') ?? '');
    const apply = useCallback(() => {
        const next = new URLSearchParams();
        if (search)
            next.set('search', search);
        if (minRate)
            next.set('minRate', minRate);
        if (maxRate)
            next.set('maxRate', maxRate);
        setParams(next);
    }, [search, minRate, maxRate, setParams]);
    const reset = () => {
        setSearch('');
        setMinRate('');
        setMaxRate('');
        setParams(new URLSearchParams());
    };
    return (_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 p-5 space-y-5", children: [_jsx("h2", { className: "font-semibold text-gray-900", children: "Filter" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Name / Beschreibung" }), _jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: (e) => e.key === 'Enter' && apply(), placeholder: "Suchen...", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm\n            focus:outline-none focus:ring-2 focus:ring-blue-300" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Stundensatz (\u20AC)" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "number", value: minRate, onChange: (e) => setMinRate(e.target.value), placeholder: "Min", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm\n              focus:outline-none focus:ring-2 focus:ring-blue-300" }), _jsx("span", { className: "text-gray-400 text-sm", children: "\u2014" }), _jsx("input", { type: "number", value: maxRate, onChange: (e) => setMaxRate(e.target.value), placeholder: "Max", className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm\n              focus:outline-none focus:ring-2 focus:ring-blue-300" })] })] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("button", { onClick: apply, className: "w-full bg-blue-600 hover:bg-blue-700 text-white text-sm\n            font-medium py-2 rounded-lg transition", children: "Anwenden" }), _jsx("button", { onClick: reset, className: "w-full text-sm text-gray-500 hover:text-gray-700 transition", children: "Zur\u00FCcksetzen" })] })] }));
};
