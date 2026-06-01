import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveRole } from '@entities/user/model/selectors';
import { Layout } from '@widgets/layout/index';
import { ProfileForm } from './sections/profile-form/ProfileForm';
import { TutorProfileForm } from './sections/tutor-profile-form/TutorProfileForm';
import { ChangePasswordForm } from './sections/change-password/ChangePasswordForm';
import { ChangeEmailForm } from './sections/change-email/ChangeEmailForm';
import { SessionsList } from './sections/sessions-list/SessionsList';
import { useTranslation } from 'react-i18next';
export default function SettingsPage() {
    const { t } = useTranslation('settings');
    const role = useSelector(selectActiveRole);
    // tabs зависят от роли — tutor видит вкладку "Lehrerprofil", client нет
    const tabs = [
        { key: 'profile', labelKey: 'profile' },
        ...(role === 'tutor'
            ? [{ key: 'tutor-profile', labelKey: 'tutorProfile' }]
            : []),
        { key: 'security', labelKey: 'security' },
        { key: 'sessions', labelKey: 'sessions' },
    ];
    const [tab, setTab] = useState('profile');
    return (_jsx(Layout, { children: _jsxs("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 py-8", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-slate-900 mb-8", children: t('title') }), _jsx("div", { className: "flex border-b border-slate-200 mb-8 gap-1 overflow-x-auto", children: tabs.map((t_) => (_jsx("button", { onClick: () => setTab(t_.key), className: `px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap
                ${tab === t_.key
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'}`, children: t(`tabs.${t_.labelKey}`) }, t_.key))) }), tab === 'profile' && _jsx(ProfileForm, {}), tab === 'tutor-profile' && _jsx(TutorProfileForm, {}), tab === 'security' && (_jsxs("div", { className: "space-y-10", children: [_jsx(ChangePasswordForm, {}), _jsx("div", { className: "border-t border-slate-200 pt-10", children: _jsx(ChangeEmailForm, {}) })] })), tab === 'sessions' && _jsx(SessionsList, {})] }) }));
}
