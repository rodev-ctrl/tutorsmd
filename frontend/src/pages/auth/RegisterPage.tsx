import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRegisterClientMutation, useRegisterTutorMutation } from '@shared/api/authApi';
import { registerSchema, type RegisterFormData } from '@features/auth/schemas';
import AuthLayout from '@widgets/auth/ui/AuthLayout';
import { authInputClass, authButtonClass } from '@shared/ui/auth/styles';
import { useTranslation } from 'react-i18next';


export default function RegisterPage() {
  const { t } = useTranslation('auth');

  const [registerClient, { isLoading: loadingClient }] = useRegisterClientMutation();
  const [registerTutor,  { isLoading: loadingTutor }]  = useRegisterTutorMutation();
  const isLoading = loadingClient || loadingTutor;

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  const [selectedRole, setSelectedRole] = useState<'client' | 'tutor'>('client');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      languageCode: 'de',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    const { confirmPassword, ...dto } = data;
    try {
      if (selectedRole === 'tutor') {
        await registerTutor(dto).unwrap();
      } else {
        await registerClient(dto).unwrap();
      }
      setSuccess(true);
    } catch (err: any) {
      setServerError(err?.data?.message ?? t('errors.registerFailed'));
    }
  };

  const isTutor = selectedRole === 'tutor';

  if (success) {
    return (
      <AuthLayout
        title={t('registerPage.successTitle')}
        subtitle={t('registerPage.successText')}
      >
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200
            flex items-center justify-center text-3xl">
            ✉️
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {t('registerPage.toLogin')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isTutor
            ? `${t('registerPage.titleTutor')} | TutorsMD`
            : `${t('registerPage.titleClient')} | TutorsMD`}
        </title>
        <meta name="description" content="Erstellen Sie kostenlos ein Konto bei TutorsMD." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AuthLayout
        maxWidth="lg"
        title={isTutor ? t('registerPage.titleTutor') : t('registerPage.titleClient')}
        subtitle={isTutor ? t('registerPage.subtitleTutor') : t('registerPage.subtitleClient')}
      >
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
  {(['client', 'tutor'] as const).map((r) => (
    <button
      key={r}
      type="button"
      onClick={() => setSelectedRole(r)}
      className={`flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition-all
        ${selectedRole === r
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'}`}
    >
      {r === 'client' ? t('student') : t('tutor')}
    </button>
  ))}
</div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('firstName')}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="given-name"
                className={authInputClass}
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="surname" className="mb-1.5 block text-sm font-medium text-slate-700">
                {t('lastName')}
              </label>
              <input
                id="surname"
                type="text"
                autoComplete="family-name"
                className={authInputClass}
                {...register('surname')}
              />
              {errors.surname && (
                <p className="mt-1.5 text-xs text-red-500">{errors.surname.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={authInputClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('password')}{' '}
              <span className="text-slate-400 font-normal">{t('registerPage.passwordHint')}</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={authInputClass}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('registerPage.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={authInputClass}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-2xl border border-red-200 bg-red-50
              px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <button type="submit" disabled={isLoading} className={authButtonClass}>
            {isLoading ? t('registerPage.submitting') : t('registerPage.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('registerPage.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            {t('registerPage.loginLink')}
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}