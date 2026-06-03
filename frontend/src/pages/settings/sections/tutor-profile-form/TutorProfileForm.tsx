import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData, schema } from './schema';
import { useGetTutorProfileQuery, useSubmitApplicationMutation, useUpdateTutorProfileMutation } from '@shared/api/tutor/tutorApi';
import { Spinner } from '@shared/index';
import { useTranslation } from 'react-i18next';

export const TutorProfileForm = () => {
  const { t } = useTranslation('settings');

  const { data: tutor, isLoading } = useGetTutorProfileQuery();
  const [update, { isLoading: saving, isSuccess }] = useUpdateTutorProfileMutation();
  const [submitApp, { isLoading: submitting }] = useSubmitApplicationMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleSubmitAdmin = async () => {
  setSubmitError(null);
  try {
    await submitApp().unwrap();
  } catch (err: any) {
    setSubmitError(err?.data?.message ?? 'Fehler beim Einreichen');
  }
};

  if (isLoading) return <Spinner />;

  const approvalStatus = tutor?.approvalStatus;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Approval banners */}
      {approvalStatus === 'pending' && (
        <div className="bg-amber-100 border border-amber-200 rounded-3xl px-5 py-4">
          <p className="text-sm text-amber-700 font-semibold">
            {t('tutorProfile.approvalStatus.pending.title')}
          </p>
          <p className="text-xs text-amber-700 opacity-80 mt-0.5">
            {t('tutorProfile.approvalStatus.pending.subtitle')}
          </p>
        </div>
      )}

      {/* Submit application */}
{(approvalStatus === 'pending' || approvalStatus === 'rejected') && (
  <div className="border-t border-slate-200 pt-6 mt-6">
    {approvalStatus === 'rejected' && tutor?.rejectionReason && (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-4">
        <p className="text-sm font-semibold text-red-600">Ablehnungsgrund:</p>
        <p className="text-sm text-red-600 mt-1">{tutor.rejectionReason}</p>
      </div>
    )}
    {submitError && (
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm
        rounded-2xl px-4 py-3 mb-4">
        {submitError}
      </div>
    )}
    <button
      type="button"
      onClick={handleSubmitAdmin}
      disabled={submitting}
      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50
        text-white text-sm font-medium px-6 py-2.5 rounded-xl transition"
    >
      {submitting ? 'Wird eingereicht...' : 'Bewerbung einreichen →'}
    </button>
  </div>
)}

{approvalStatus === 'submitted' && (
  <div className="border-t border-slate-200 pt-6 mt-6">
    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
      <p className="text-sm font-semibold text-blue-700">
        ✓ Bewerbung eingereicht
      </p>
      <p className="text-xs text-blue-600 mt-1">
        Wir prüfen Ihr Profil und melden uns bald.
      </p>
    </div>
  </div>
)}

{approvalStatus === 'under_review' && (
  <div className="border-t border-slate-200 pt-6 mt-6">
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <p className="text-sm font-semibold text-amber-700">
        🔍 Profil wird geprüft
      </p>
      <p className="text-xs text-amber-600 mt-1">
        Unser Team prüft Ihr Profil aktiv.
      </p>
    </div>
  </div>
)}

      {approvalStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-4">
          <p className="text-sm text-red-600 font-semibold">
            {t('tutorProfile.approvalStatus.rejected.title')}
          </p>
          <p className="text-xs text-red-600 opacity-80 mt-0.5">
            {t('tutorProfile.approvalStatus.rejected.subtitle')}
          </p>
        </div>
      )}

      {approvalStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-3xl px-5 py-4">
          <p className="text-sm text-green-700 font-semibold">
            {t('tutorProfile.approvalStatus.approved')}
          </p>
        </div>
      )}

      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-2xl px-4 py-3">
          {t('tutorProfile.saved')}
        </div>
      )}

      {/* Hourly rate */}
      <section className="space-y-3">
        <SectionTitle>{t('tutorProfile.hourlyRate.title')}</SectionTitle>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            €
          </span>
          <input
            type="number"
            step="0.5"
            min="1"
            max="10000"
            id="hourlyRate"
            className={`${inp(!!errors.hourlyRate)} pl-8`}
            {...register('hourlyRate', { valueAsNumber: true })}
          />
        </div>
        {errors.hourlyRate && (
          <p className="text-red-500 text-xs">{errors.hourlyRate.message}</p>
        )}
      </section>

      {/* Name DE / RU */}
      <section className="space-y-3">
        <SectionTitle>{t('tutorProfile.name.title')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('tutorProfile.name.firstNameDe')} error={errors.nameDe?.message} htmlFor="nameDe">
            <input id="nameDe" className={inp(!!errors.nameDe)} {...register('nameDe')} />
          </Field>
          <Field label={t('tutorProfile.name.firstNameRu')} error={errors.nameRu?.message} htmlFor="nameRu">
            <input id="nameRu" className={inp(!!errors.nameRu)} {...register('nameRu')} />
          </Field>
          <Field label={t('tutorProfile.name.lastNameDe')} error={errors.surnameDe?.message} htmlFor="surnameDe">
            <input id="surnameDe" className={inp(!!errors.surnameDe)} {...register('surnameDe')} />
          </Field>
          <Field label={t('tutorProfile.name.lastNameRu')} error={errors.surnameRu?.message} htmlFor="surnameRu">
            <input id="surnameRu" className={inp(!!errors.surnameRu)} {...register('surnameRu')} />
          </Field>
        </div>
      </section>

      {/* Highlight */}
      <section className="space-y-3">
        <SectionTitle>
          {t('tutorProfile.highlight.title')}{' '}
          <span className="text-slate-400 font-normal">{t('tutorProfile.highlight.maxChars')}</span>
        </SectionTitle>
        <Field label={t('tutorProfile.highlight.de')} error={errors.highlightDe?.message} htmlFor="highlightDe">
          <textarea
            id="highlightDe"
            rows={3}
            className={inp(!!errors.highlightDe)}
            placeholder={t('tutorProfile.highlight.placeholderDe')}
            {...register('highlightDe')}
          />
        </Field>
        <Field label={t('tutorProfile.highlight.ru')} error={errors.highlightRu?.message} htmlFor="highlightRu">
          <textarea
            id="highlightRu"
            rows={3}
            className={inp(!!errors.highlightRu)}
            placeholder={t('tutorProfile.highlight.placeholderRu')}
            {...register('highlightRu')}
          />
        </Field>
      </section>

      {/* Full description */}
      <section className="space-y-3">
        <SectionTitle>
          {t('tutorProfile.fullDescription.title')}{' '}
          <span className="text-slate-400 font-normal">{t('tutorProfile.fullDescription.maxChars')}</span>
        </SectionTitle>
        <Field label={t('tutorProfile.fullDescription.de')} error={errors.fulldescribeDe?.message} htmlFor="fulldescribeDe">
          <textarea
            id="fulldescribeDe"
            rows={6}
            className={inp(!!errors.fulldescribeDe)}
            placeholder={t('tutorProfile.fullDescription.placeholderDe')}
            {...register('fulldescribeDe')}
          />
        </Field>
        <Field label={t('tutorProfile.fullDescription.ru')} error={errors.fulldescribeRu?.message} htmlFor="fulldescribeRu">
          <textarea
            id="fulldescribeRu"
            rows={6}
            className={inp(!!errors.fulldescribeRu)}
            placeholder={t('tutorProfile.fullDescription.placeholderRu')}
            {...register('fulldescribeRu')}
          />
        </Field>
      </section>

      <button
        type="submit"
        disabled={saving || !isDirty}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50
          text-white text-sm font-medium px-6 py-2.5 rounded-xl transition
          shadow-lg shadow-orange-200"
      >
        {saving ? t('tutorProfile.saving') : t('tutorProfile.save')}
      </button>

    </form>
  );
};

const inp = (hasError: boolean) =>
  `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 resize-none
   ${hasError
     ? 'border-red-400 focus:ring-red-100'
     : 'border-slate-300 focus:ring-blue-100'}`;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
);

const Field = ({
  label, error, htmlFor, children,
}: {
  label: string; error?: string; htmlFor: string; children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
  </div>
);