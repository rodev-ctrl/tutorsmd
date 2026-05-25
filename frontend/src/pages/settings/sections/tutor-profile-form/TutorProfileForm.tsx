import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData } from "./schema";
import { useGetTutorProfileQuery, useUpdateTutorProfileMutation } from '@shared/api/index';
import { Spinner } from '@shared/ui/index';


export const TutorProfileForm = () => {
  const { data: tutor, isLoading } = useGetTutorProfileQuery();
  const [update, { isLoading: saving, isSuccess }] = useUpdateTutorProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (tutor) {
      reset({
        nameDe:         tutor.nameDe,
        nameRu:         tutor.nameRu,
        surnameDe:      tutor.surnameDe,
        surnameRu:      tutor.surnameRu,
        hourlyRate:     tutor.hourlyRate,
        highlightDe:    tutor.highlightDe,
        highlightRu:    tutor.highlightRu,
        fulldescribeDe: tutor.fulldescribeDe,
        fulldescribeRu: tutor.fulldescribeRu,
      });
    }
  }, [tutor, reset]);

  const onSubmit = async (data: FormData) => {
    await update(data).unwrap().catch(() => {});
  };

  if (isLoading) return <Spinner />;

  const approvalStatus = tutor?.approvalStatus;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Статус одобрения */}
      {approvalStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <p className="text-sm text-yellow-800 font-medium">
            Ihr Profil wird geprüft.
          </p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Sie können Ihr Profil bereits ausfüllen — es wird nach der Freischaltung sichtbar.
          </p>
        </div>
      )}

      {approvalStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700 font-medium">
            Ihr Profil wurde abgelehnt.
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            Bitte aktualisieren Sie Ihr Profil und warten Sie auf eine erneute Prüfung.
          </p>
        </div>
      )}

      {approvalStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-sm text-green-700 font-medium">✓ Profil freigeschaltet</p>
        </div>
      )}

      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
          Gespeichert ✓
        </div>
      )}

      {/* Stundensatz */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Stundensatz
        </h3>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
          <input
            type="number"
            step="0.5"
            min="1"
            max="10000"
            className={`w-full border rounded-lg pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2
              ${errors.hourlyRate ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`}
            {...register('hourlyRate', { valueAsNumber: true })}
          />
        </div>
        {errors.hourlyRate && (
          <p className="text-red-500 text-xs">{errors.hourlyRate.message}</p>
        )}
      </section>

      {/* Имя/Фамилия на DE и RU */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Name auf Deutsch / по-русски
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vorname (DE)" error={errors.nameDe?.message}>
            <input className={inp(!!errors.nameDe)} {...register('nameDe')} />
          </Field>
          <Field label="Vorname (RU)" error={errors.nameRu?.message}>
            <input className={inp(!!errors.nameRu)} {...register('nameRu')} />
          </Field>
          <Field label="Nachname (DE)" error={errors.surnameDe?.message}>
            <input className={inp(!!errors.surnameDe)} {...register('surnameDe')} />
          </Field>
          <Field label="Nachname (RU)" error={errors.surnameRu?.message}>
            <input className={inp(!!errors.surnameRu)} {...register('surnameRu')} />
          </Field>
        </div>
      </section>

      {/* Kurzvorstellung */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Kurzvorstellung (max. 500 Zeichen)
        </h3>
        <Field label="Auf Deutsch" error={errors.highlightDe?.message}>
          <textarea
            rows={3}
            className={inp(!!errors.highlightDe)}
            placeholder="z.B. Ich unterrichte Mathematik seit 5 Jahren..."
            {...register('highlightDe')}
          />
        </Field>
        <Field label="По-русски" error={errors.highlightRu?.message}>
          <textarea
            rows={3}
            className={inp(!!errors.highlightRu)}
            placeholder="например: Преподаю математику уже 5 лет..."
            {...register('highlightRu')}
          />
        </Field>
      </section>

      {/* Vollständige Beschreibung */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Ausführliche Beschreibung (max. 5000 Zeichen)
        </h3>
        <Field label="Auf Deutsch" error={errors.fulldescribeDe?.message}>
          <textarea
            rows={6}
            className={inp(!!errors.fulldescribeDe)}
            placeholder="Beschreiben Sie Ihre Erfahrung, Methodik, Erfolge..."
            {...register('fulldescribeDe')}
          />
        </Field>
        <Field label="По-русски" error={errors.fulldescribeRu?.message}>
          <textarea
            rows={6}
            className={inp(!!errors.fulldescribeRu)}
            placeholder="Опишите свой опыт, методику, достижения..."
            {...register('fulldescribeRu')}
          />
        </Field>
      </section>

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

const inp = (hasError: boolean) =>
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
