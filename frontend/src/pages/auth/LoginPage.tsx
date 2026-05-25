// src/pages/auth/LoginPage.tsx
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useLoginMutation } from '@shared/api/authApi';
import { loginSchema, type LoginFormData } from '@features/auth/schemas';

// Коды ошибок бэкенда → человекочитаемые сообщения + доп. действие
const EMAIL_NOT_VERIFIED_MSG = 'Please verify your email before logging in';

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const [serverError, setServerError]           = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  // Сообщение от ResetPasswordPage после успешного сброса
  const successMessage = (location.state as any)?.message as string | undefined;

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { activeRole: 'client' },
  });

  const activeRole = watch('activeRole');

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setEmailNotVerified(false);

    try {
      await login(data).unwrap();
      navigate('/dashboard');
    } catch (err: any) {
      const msg: string = err?.data?.message ?? '';

      if (msg === EMAIL_NOT_VERIFIED_MSG) {
        setEmailNotVerified(true);
      } else {
        setServerError(msg || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-2xl font-bold text-center mb-6">Anmelden</h1>

        {/* Успешный сброс пароля */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm
            rounded-lg px-4 py-3 mb-4">
            {successMessage}
          </div>
        )}

        {/* Role switcher */}
        <div className="flex rounded-lg overflow-hidden border mb-6">
          {(['client', 'tutor'] as const).map((role) => (
            <label
              key={role}
              className={`flex-1 text-center py-2 cursor-pointer text-sm font-medium transition
                ${activeRole === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <input
                type="radio"
                value={role}
                className="hidden"
                {...register('activeRole')}
              />
              {role === 'client' ? 'Schüler' : 'Nachhilfelehrer'}
            </label>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              autoComplete="email"
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2
                ${errors.email
                  ? 'border-red-500 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-blue-300'}`}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Paaswort Vergessen?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2
                ${errors.password
                  ? 'border-red-500 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-blue-300'}`}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Email not verified */}
          {emailNotVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <p className="text-yellow-800 text-sm font-medium">
                E-Mail nicht bestätigt
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Bitte bestätigen Sie Ihre E-Mail-Adresse.
                Kein E-Mail erhalten?
              </p>
              <Link
                to="/resend-verification"
                state={{ email: getValues('email') }}
                className="inline-block mt-2 text-xs font-medium text-yellow-800
                  underline hover:text-yellow-900"
              >
                Neuen Aktivierungslink anfordern →
              </Link>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm
              rounded-lg px-4 py-2">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-medium py-2 rounded-lg transition text-sm"
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>

        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Registrieren
          </Link>
        </p>

      </div>
    </div>
  );
}