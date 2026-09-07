import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useLoginMutation } from '@shared/api/authApi';
import { loginSchema, type LoginFormData } from '@features/auth/schemas';
import AuthLayout from '@widgets/auth/ui/AuthLayout';
import { GoogleSignInButton } from '@widgets/auth/ui/GoogleSignInButton';
import { authInputClass, authButtonClass } from '@shared/ui/auth/styles';
import { useTranslation } from 'react-i18next';

const EMAIL_NOT_VERIFIED_MSG = 'Please verify your email before logging in';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();

  const [login, { isLoading }] = useLoginMutation();

  const params       = new URLSearchParams(location.search);
  const roleFromUrl  = params.get('role');
  const isAdminLogin = roleFromUrl === 'admin' &&
    params.get('key') === import.meta.env.VITE_ADMIN_KEY;

  const [serverError, setServerError]       = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const successMessage = (location.state as any)?.message as string | undefined;

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { activeRole: isAdminLogin ? 'admin' : 'client' },
  });

  const activeRole = watch('activeRole');

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setEmailNotVerified(false);
    try {
      await login({
        ...data,
        activeRole: isAdminLogin ? 'admin' : data.activeRole,
      }).unwrap();
      navigate('/dashboard');
    } catch (err: any) {
      const msg: string = err?.data?.message ?? '';
      if (msg === EMAIL_NOT_VERIFIED_MSG) {
        setEmailNotVerified(true);
      } else {
        setServerError(msg || t('errors.loginFailed'));
      }
    }
  };

  return (
    <AuthLayout
      title={t('loginPage.title')}
      subtitle={t('loginPage.subtitle')}
    >
      {successMessage && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50
          px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Role switcher */}
      {!isAdminLogin && (
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
          {(['client', 'tutor'] as const).map((role) => (
            <label
              key={role}
              className={`flex-1 cursor-pointer rounded-xl py-2.5 text-center
                text-sm font-medium transition-all
                ${activeRole === role
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              <input type="radio" value={role} className="hidden" {...register('activeRole')} />
              {role === 'client' ? t('student') : t('tutor')}
            </label>
          ))}
        </div>
      )}

      {!isAdminLogin && (
        <>
          <GoogleSignInButton
            role={activeRole === 'tutor' ? 'tutor' : 'client'}
            onError={setServerError}
          />
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            {t('or')}
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              {t('password')}
            </label>
            {!isAdminLogin && (
              <Link to="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700">
                {t('forgotPassword')}
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={authInputClass}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {emailNotVerified && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-700">
              {t('loginPage.emailNotVerified.title')}
            </p>
            <Link
              to="/resend-verification"
              state={{ email: getValues('email') }}
              className="mt-1.5 inline-block text-xs font-medium text-amber-700 underline
                underline-offset-2"
            >
              {t('loginPage.emailNotVerified.resend')}
            </Link>
          </div>
        )}

        {serverError && (
          <div className="rounded-2xl border border-red-200 bg-red-50
            px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? t('loginPage.submitting') : t('loginPage.submit')}
        </button>
      </form>

      {!isAdminLogin && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {t('loginPage.noAccount')}{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
            {t('loginPage.registerLink')}
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}