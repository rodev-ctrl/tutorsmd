import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectActiveRole } from '@entities/user/model/selectors';
import { useLogoutMutation } from '@shared/api/authApi';
import { useGetUserProfileQuery } from '@shared/api/profileApi';
import { useTranslation } from 'react-i18next';
export const UserMenu = () => {
    const { t } = useTranslation('nav');
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const activeRole = useSelector(selectActiveRole);
    const navigate = useNavigate();
    const [logout] = useLogoutMutation();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const { data: profile } = useGetUserProfileQuery(undefined, {
        skip: !isAuthenticated,
    });
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const handleLogout = async () => {
        setOpen(false);
        await logout();
        navigate('/');
    };
    // Незалогиненный
    if (!isAuthenticated) {
        return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { to: "/login", className: "text-sm font-medium text-slate-600 hover:text-blue-600 transition", children: t('login') }), _jsx(Link, { to: "/register", className: "text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white\r\n            px-4 py-2 rounded-xl transition shadow-sm shadow-orange-200", children: t('register') })] }));
    }
    const initials = profile
        ? `${profile.name[0]}${profile.surname[0]}`.toUpperCase()
        : activeRole?.[0]?.toUpperCase() ?? '?';
    return (_jsxs("div", { className: "relative", ref: menuRef, children: [_jsx("button", { onClick: () => setOpen((v) => !v), className: "w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm\r\n          flex items-center justify-center hover:bg-blue-700 transition\r\n          focus:outline-none focus:ring-2 focus:ring-blue-300 overflow-hidden", "aria-label": t('userMenu'), children: profile?.avatarUrl
                    ? _jsx("img", { src: profile.avatarUrl, alt: "", className: "w-9 h-9 object-cover" })
                    : initials }), open && (_jsxs("div", { className: "absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl\r\n          border border-slate-200 py-1.5 z-50\r\n          animate-in fade-in slide-in-from-top-2 duration-100", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-100", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 truncate", children: profile ? `${profile.name} ${profile.surname}` : '...' }), _jsx("p", { className: "text-xs text-slate-400 capitalize mt-0.5", children: activeRole })] }), _jsxs("div", { className: "py-1", children: [_jsx(MenuLink, { to: "/dashboard", onClick: () => setOpen(false), children: t('dashboard') }), _jsx(MenuLink, { to: "/lessons", onClick: () => setOpen(false), children: t('lessons') }), _jsx(MenuLink, { to: "/liked-tutors", onClick: () => setOpen(false), children: t('likedTutors') }), _jsx(MenuLink, { to: "/support", onClick: () => setOpen(false), children: t('support') }), _jsx(MenuLink, { to: "/settings", onClick: () => setOpen(false), children: t('settings') }), _jsx(MenuLink, { to: "/settings/media", onClick: () => setOpen(false), children: t('mediaCheck') })] }), _jsx("div", { className: "border-t border-slate-100 mt-1 pt-1", children: _jsx("button", { onClick: handleLogout, className: "w-full text-left px-4 py-2.5 text-sm text-red-600\r\n                hover:bg-red-50 transition rounded-b-2xl", children: t('logout') }) })] }))] }));
};
const MenuLink = ({ to, onClick, children, }) => (_jsx(Link, { to: to, onClick: onClick, className: "block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition", children: children }));
