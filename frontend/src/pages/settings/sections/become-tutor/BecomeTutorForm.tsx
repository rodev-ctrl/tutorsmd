import { useTranslation } from 'react-i18next';
import { useGetUserProfileQuery } from '@shared/api/profileApi';
import { selectIsAuthenticated } from '@entities/user/model/selectors';
import { useSelector } from 'react-redux';

export const BecomeTutorForm = () => {
  const { t }           = useTranslation('settings');
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data: profile } = useGetUserProfileQuery(undefined, { skip: !isAuthenticated });

  // Если заявка уже подана — показываем статус
  if (profile?.tutor) {
    const status = profile.tutor.approvalStatus;
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('becomeTutor.title')}
        </h2>
        <div className={`rounded-2xl border p-5 text-sm
          ${status === 'pending'  ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
          ${status === 'approved' ? 'bg-green-50  border-green-200  text-green-800'  : ''}
          ${status === 'rejected' ? 'bg-red-50    border-red-200    text-red-700'    : ''}

        `}>
          {t(`becomeTutor.status.${status}`)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {t('becomeTutor.title')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('becomeTutor.description')}
        </p>
      </div>

      {/* Шаги процесса */}
      <div className="space-y-3">
        {([1, 2, 3] as const).map((step) => (
          <div key={step} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs
              font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {step}
            </div>
            <p className="text-sm text-slate-700">
              {t(`becomeTutor.steps.${step}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Кнопка — регистрирует tutor профиль через /auth/register/tutor endpoint
          НО с тем же email — backend создаёт Tutor запись со статусом pending */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-sm text-blue-800 mb-4">
          {t('becomeTutor.note')}
        </p>
        <a
          href="mailto:support@tutorsmd.net?subject=Ich möchte Lehrer werden"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white
            text-sm font-medium px-6 py-2.5 rounded-xl transition"
        >
          {t('becomeTutor.contactAdmin')}
        </a>
      </div>
    </div>
  );
};