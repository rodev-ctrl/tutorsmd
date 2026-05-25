import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schema, FormData } from "./schema";
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '@shared/api/profileApi';
import { Spinner } from '@shared/index';



export const ProfileForm = () => {
  const { data: profile, isLoading } = useGetUserProfileQuery();
  const [update, { isLoading: saving, isSuccess }] = useUpdateUserProfileMutation();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Заполняем форму данными из API
  useEffect(() => {
    if (profile) {
      reset({
        name:         profile.name,
        surname:      profile.surname,
        username:     profile.username ?? '',
        timezone:     profile.timezone,
        languageCode: profile.languageCode,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: FormData) => {
    await update(data).unwrap().catch(() => {});
  };

  if (isLoading) return <Spinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Persönliche Daten</h2>

      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
          Gespeichert ✓
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Vorname" error={errors.name?.message}>
          <input className={input(!!errors.name)} {...register('name')} />
        </Field>
        <Field label="Nachname" error={errors.surname?.message}>
          <input className={input(!!errors.surname)} {...register('surname')} />
        </Field>
      </div>

      <Field label="Benutzername" error={errors.username?.message}>
        <input className={input(!!errors.username)} {...register('username')} />
      </Field>

      <Field label="Sprache">
        <select className={input(false)} {...register('languageCode')}>
          <option value="de">Deutsch</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </Field>

      <Field label="Zeitzone">
        <input className={input(false)} {...register('timezone')} />
      </Field>

      {/* Readonly email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
        <div className="flex items-center gap-2">
          <input
            value={profile?.email ?? ''}
            readOnly
            className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500"
          />
          {!profile?.isEmailVerified && (
            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
              Nicht verifiziert
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !isDirty}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
          text-white text-sm font-medium px-6 py-2 rounded-lg transition"
      >
        {saving ? 'Wird gespeichert...' : 'Speichern'}
      </button>
    </form>
  );
};

const input = (hasError: boolean) =>
  `w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2
   ${hasError ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`;

const Field = ({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);