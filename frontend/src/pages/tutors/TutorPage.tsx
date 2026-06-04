import { useParams, Link } from 'react-router-dom';
import { useGetTutorByIdQuery, useGetTutorSlotsQuery } from '@shared/api/tutor/tutorPublicApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectActiveRole } from '@entities/user/model/selectors';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { BookTrialButton } from './components/BookTrialButton';
import { TutorSchedule }  from './components/TutorSchedule';
import { LikeButton }     from '@shared/ui/LikeButton';
import { useTranslation } from 'react-i18next';

export default function TutorPage() {
  const { t, i18n } = useTranslation('tutorPage');
  const lang = i18n.language;

  const { tutorId }     = useParams<{ tutorId: string }>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeRole      = useSelector(selectActiveRole);

  const { data: tutor, isLoading } = useGetTutorByIdQuery(tutorId ?? '', { skip: !tutorId });
  const { data: slotsData }        = useGetTutorSlotsQuery(tutorId ?? '', { skip: !tutorId });


  if (isLoading) return <Layout><Spinner /></Layout>;
  if (!tutor) return (
    <Layout>
      <div className="text-center py-12 text-slate-400">{t('notFound')}</div>
    </Layout>
  );

  const slots = (slotsData?.slots ?? []).map(s => ({ ...s, tutorId: tutor.id }));

  // Локализованные поля
  const displayName = lang === 'de' && tutor.nameDe
    ? `${tutor.nameDe} ${tutor.surnameDe ?? ''}`.trim()
    : lang === 'ru' && tutor.nameRu
    ? `${tutor.nameRu} ${tutor.surnameRu ?? ''}`.trim()
    : `${tutor.name} ${tutor.surname}`;

  const highlight = lang === 'ru' && tutor.highlightRu
    ? tutor.highlightRu
    : tutor.highlightDe;

  const fullDescription = lang === 'ru' && tutor.fulldescribeRu
    ? tutor.fulldescribeRu
    : tutor.fulldescribeDe;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6
          flex flex-col sm:flex-row gap-6 relative">

          {/* LikeButton — абсолютно в правом верхнем углу карточки */}
          <LikeButton
            tutorId={tutor.id}
            className="absolute top-5 right-5"
          />

          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-blue-50 flex items-center justify-center
            text-blue-600 font-bold text-3xl flex-shrink-0 overflow-hidden">
            {tutor.avatarUrl
              ? <img src={tutor.avatarUrl} alt={displayName} className="w-24 h-24 object-cover" />
              : `${tutor.name[0]}${tutor.surname[0]}`}
          </div>

          {/* Info */}
          <div className="flex-1 pr-10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {displayName}
            </h1>

            {/* Оригинальное имя если отличается от отображаемого */}
            {lang !== 'de' && tutor.nameDe && (
              <p className="text-sm text-slate-400 mt-0.5">
                {tutor.nameDe} {tutor.surnameDe}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-sm text-slate-500">
                ⭐ {tutor.ratingAvg.toFixed(1)}{' '}
                <span className="text-slate-400">
                  ({tutor.ratingCount} {t('reviews')})
                </span>
              </span>
              {tutor.hourlyRate && (
                <span className="text-sm font-semibold text-slate-900">
                  {tutor.hourlyRate} {t('perHour')}
                </span>
              )}
            </div>

            {highlight && (
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">{highlight}</p>
            )}
          </div>
        </div>

        {/* Описание */}
        {fullDescription && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">{t('about')}</h2>
            <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
              {fullDescription}
            </p>
          </div>
        )}

        {/* Расписание */}
        <TutorSchedule slots={slots} />

        {/* CTA */}
        <div className="bg-blue-600 rounded-3xl p-6 text-white text-center">
          <h2 className="text-xl font-bold mb-2">{t('cta.title')}</h2>
          <p className="text-blue-200 text-sm mb-5">{t('cta.subtitle')}</p>

          {isAuthenticated && activeRole === 'client' ? (
            <BookTrialButton tutorId={tutor.id} subjects={tutor.subjects ?? []} />
          ) : !isAuthenticated ? (
            <Link
              to="/login"
              className="inline-block bg-white text-blue-600 font-semibold text-sm
                px-6 py-2.5 rounded-xl hover:bg-blue-50 transition"
            >
              {t('cta.loginToBook')}
            </Link>
          ) : (
            <p className="text-blue-200 text-sm">{t('cta.onlyClients')}</p>
          )}
        </div>

      </div>
    </Layout>
  );
}