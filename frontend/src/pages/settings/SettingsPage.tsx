import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveRole } from '@entities/user/model/selectors';
import { selectIsAuthenticated } from '@entities/user/model/selectors';
import { useGetUserProfileQuery } from '@shared/api/profileApi';
import { Layout }             from '@widgets/layout/index';
import { ProfileForm }        from './sections/profile-form/ProfileForm';
import { TutorProfileForm }   from './sections/tutor-profile-form/TutorProfileForm';
import { BecomeTutorForm }    from './sections/become-tutor/BecomeTutorForm';
import { ChangePasswordForm } from './sections/change-password/ChangePasswordForm';
import { ChangeEmailForm }    from './sections/change-email/ChangeEmailForm';
import { SessionsList }       from './sections/sessions-list/SessionsList';
import { useTranslation }     from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

type TabKey = 'profile' | 'tutor-profile' | 'become-tutor' | 'security' | 'sessions';

export default function SettingsPage() {
  const { t }           = useTranslation('settings');
  const role            = useSelector(selectActiveRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // profile нужен чтобы проверить есть ли у client уже tutor-профиль
  const { data: profile } = useGetUserProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const tabs: { key: TabKey; labelKey: string }[] = [
    { key: 'profile', labelKey: 'profile' },

    // tutor видит свой профиль преподавателя
    ...(role === 'tutor'
      ? [{ key: 'tutor-profile' as TabKey, labelKey: 'tutorProfile' }]
      : []),

    // client без tutor-профиля видит форму заявки
    ...(role === 'client' && !profile?.tutor
      ? [{ key: 'become-tutor' as TabKey, labelKey: 'becomeTutor' }]
      : []),

    { key: 'security', labelKey: 'security' },
    { key: 'sessions', labelKey: 'sessions' },
  ];



  const [searchParams] = useSearchParams();
const initialTab = (searchParams.get('tab') as TabKey) ?? 'profile';
const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">
          {t('title')}
        </h1>

        {/* Tab nav */}
        <div className="flex border-b border-slate-200 mb-8 gap-1 overflow-x-auto">
          {tabs.map((t_) => (
            <button
              key={t_.key}
              onClick={() => setTab(t_.key)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap
                ${tab === t_.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t(`tabs.${t_.labelKey}`)}
            </button>
          ))}
        </div>

        {tab === 'profile'      && <ProfileForm />}
        {tab === 'tutor-profile' && <TutorProfileForm />}
        {tab === 'become-tutor' && <BecomeTutorForm />}
        {tab === 'security'     && (
          <div className="space-y-10">
            <ChangePasswordForm />
            <div className="border-t border-slate-200 pt-10">
              <ChangeEmailForm />
            </div>
          </div>
        )}
        {tab === 'sessions' && <SessionsList />}
      </div>
    </Layout>
  );
}