import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResendVerificationMutation } from '@shared/api/authApi';

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

type FormData = z.infer<typeof schema>;

export default function ResendVerificationPage() {
  const [resend, { isLoading }] = useResendVerificationMutation();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await resend(data.email).unwrap().catch(() => {});
    // Всегда показываем success — защита от email enumeration
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold mb-2">E-Mail gesendet</h2>
          <p className="text-gray-600 text-sm">
            Falls diese E-Mail registriert und nicht aktiviert ist,
            haben wir einen neuen Aktivierungslink gesendet.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-blue-600 hover:underline text-sm"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          Aktivierungslink erneut senden
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen neuen Link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-medium py-2 rounded-lg transition text-sm"
          >
            {isLoading ? 'Wird gesendet...' : 'Link senden'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/login" className="text-blue-600 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}