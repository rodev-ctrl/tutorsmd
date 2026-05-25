import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schema, FormData } from './schema';
import { useChangePasswordMutation } from '@shared/api/authApi';
import { useLogoutMutation } from '@shared/api/authApi';
import { useNavigate } from 'react-router-dom';


export const ChangePasswordForm = () => {
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [logout] = useLogoutMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }).unwrap();
      // После смены пароля — все сессии отозваны на бэкенде
      // Разлогиниваем клиент и редиректим
      await logout();
      navigate('/login', { state: { message: 'Passwort geändert. Bitte erneut anmelden.' } });
    } catch (err: any) {
      setServerError(err?.data?.message ?? 'Fehler beim Ändern des Passworts.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Passwort ändern</h2>

      <Field label="Aktuelles Passwort" error={errors.oldPassword?.message}>
        <input type="password" autoComplete="current-password"
          className={inp(!!errors.oldPassword)} {...register('oldPassword')} />
      </Field>

      <Field label="Neues Passwort (mind. 15 Zeichen)" error={errors.newPassword?.message}>
        <input type="password" autoComplete="new-password"
          className={inp(!!errors.newPassword)} {...register('newPassword')} />
      </Field>

      <Field label="Passwort bestätigen" error={errors.confirmPassword?.message}>
        <input type="password" autoComplete="new-password"
          className={inp(!!errors.confirmPassword)} {...register('confirmPassword')} />
      </Field>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
          {serverError}
        </div>
      )}

      <button type="submit" disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
          text-white text-sm font-medium px-6 py-2 rounded-lg transition">
        {isLoading ? 'Wird geändert...' : 'Passwort ändern'}
      </button>
    </form>
  );
};

const inp = (e: boolean) =>
  `w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2
   ${e ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`;

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);