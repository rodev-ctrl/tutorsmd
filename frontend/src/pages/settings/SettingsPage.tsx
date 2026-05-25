
import { useState } from 'react';
import { Layout } from '@widgets/layout/ui/Layout';
import { ProfileForm } from './sections/profile-form/ProfileForm';
import { ChangePasswordForm } from './sections/change-password/ChangePasswordForm';
import { ChangeEmailForm } from './sections/change-email/ChangeEmailForm';
import { SessionsList } from './sections/session-list/SessionList';

import { useSelector } from 'react-redux';
import { selectActiveRole } from '@entities/user/model/selectors';

import { TutorProfileForm }   from './sections/tutor-profile-form/TutorProfileForm';



type Tab = 'profile' | 'tutor-profile' | 'security' | 'sessions';

export default function SettingsPage() {
  const role = useSelector(selectActiveRole);
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',  label: 'Profil' },
    ...(role === 'tutor'
      ? [{ key: 'tutor-profile' as Tab, label: 'Lehrerprofil' }]
      : []),
    { key: 'security', label: 'Sicherheit' },
    { key: 'sessions', label: 'Sitzungen' },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Einstellungen</h1>

        {/* Tab nav */}
        <div className="flex border-b border-gray-200 mb-8 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px
                ${tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile'       && <ProfileForm />}
        {tab === 'tutor-profile' && <TutorProfileForm />}
        {tab === 'security'      && (
          <div className="space-y-8">
            <ChangePasswordForm />
            <ChangeEmailForm />
          </div>
        )}
        {tab === 'sessions' && <SessionsList />}
      </div>
    </Layout>
  );
}