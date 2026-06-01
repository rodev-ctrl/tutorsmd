import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UserMenu } from './UserMenu';
import { LanguageSwitcher } from '../../../shared/index';
export const SideMenu = ({ links, isOpen, onClose }) => {
    // тот же namespace что и Header
    const { t } = useTranslation('nav');
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { className: "fixed inset-0 bg-black/40 z-40 md:hidden", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose }, "backdrop"), _jsxs(motion.aside, { className: "fixed top-0 left-0 h-full w-72 bg-white z-50 md:hidden\r\n              flex flex-col shadow-2xl", initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, transition: { type: 'tween', duration: 0.22 }, children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-200", children: [_jsx("span", { className: "font-bold text-xl text-blue-600", children: "TutorsMD" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-xl hover:bg-slate-100 transition", "aria-label": t('closeMenu'), children: _jsx("svg", { className: "w-5 h-5 text-slate-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("nav", { className: "flex-1 overflow-y-auto py-3 px-3 space-y-0.5", children: links.map((link) => (_jsx(NavLink, { to: link.to, onClick: onClose, className: ({ isActive }) => `block px-4 py-3 rounded-xl text-sm font-medium transition
                     ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-700 hover:bg-slate-50'}`, children: t(link.key) }, link.to))) }), _jsxs("div", { className: "px-5 py-4 border-t border-slate-200 flex items-center justify-between", children: [_jsx(LanguageSwitcher, {}), _jsx(UserMenu, {})] })] }, "drawer")] })) }));
};
