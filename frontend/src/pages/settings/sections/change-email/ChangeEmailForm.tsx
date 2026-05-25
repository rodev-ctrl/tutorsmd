
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schema, FormData } from './schema';
import { useRequestEmailChangeMutation } from '@shared/api/authApi';


export const ChangeEmailForm = () => {
  const [requestChange, { isLoading }] = useRequestEmailChangeMutation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await requestChange(data).unwrap();
      setSent(true);
    } catch (err: any) {
      setServerError(err?.data?.message ?? 'Fehler beim Ändern der E-Mail.');
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
        ✉️ Bestätigungslink an neue E-Mail gesendet. Bitte prüfen Sie Ihr Postfach.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">E-Mail ändern</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Neue E-Mail</label>
        <input type="email" className={inp(!!errors.newEmail)} {...register('newEmail')} />
        {errors.newEmail && <p className="text-red-500 text-xs mt-1">{errors.newEmail.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aktuelles Passwort (zur Bestätigung)
        </label>
        <input type="password" className={inp(!!errors.password)} {...register('password')} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
          {serverError}
        </div>
      )}

      <button type="submit" disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
          text-white text-sm font-medium px-6 py-2 rounded-lg transition">
        {isLoading ? 'Wird gesendet...' : 'Bestätigungslink senden'}
      </button>
    </form>
  );
};

const inp = (e: boolean) =>
  `w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2
   ${e ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`;