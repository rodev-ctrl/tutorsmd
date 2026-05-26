
import { useSearchParams, Link } from 'react-router-dom';
import { useGetTutorsQuery } from '@shared/api/tutorPublicApi';
import { Spinner } from '@shared/ui/Spinner';

export const TutorList = () => {
  const [params] = useSearchParams();

  const { data, isLoading, isError } = useGetTutorsQuery({
    search:   params.get('search')  ?? undefined,
    minRate:  params.get('minRate') ? Number(params.get('minRate')) : undefined,
    maxRate:  params.get('maxRate') ? Number(params.get('maxRate')) : undefined,
    page:     Number(params.get('page') ?? 1),
    limit:    12,
  });

  if (isLoading) return <Spinner />;

  if (isError) return (
    <div className="text-center py-12 text-red-500 text-sm">
      Fehler beim Laden. Bitte versuchen Sie es erneut.
    </div>
  );

  const tutors = data?.tutors ?? [];

  if (!tutors.length) return (
    <div className="text-center py-12 text-gray-400 text-sm">
      Keine Nachhilfelehrer gefunden.
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {data?.total ?? 0} Lehrer gefunden
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tutors.map((tutor) => (
          <Link
            key={tutor.id}
            to={`/tutors/${tutor.id}`}
            className="bg-white rounded-2xl border border-gray-100 p-5
              hover:shadow-md transition group"
          >
            {/* Аватар + имя */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center
                justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                {tutor.avatarUrl
                  ? <img src={tutor.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  : `${tutor.name[0]}${tutor.surname[0]}`
                }
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-blue-600
                  transition truncate">
                  {tutor.name} {tutor.surname}
                </p>
                <p className="text-xs text-gray-400">
                  ⭐ {tutor.ratingAvg.toFixed(1)} ({tutor.ratingCount})
                </p>
              </div>
            </div>

            {/* Highlight */}
            {(tutor.highlightDe || tutor.highlightRu) && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {tutor.highlightDe ?? tutor.highlightRu}
              </p>
            )}

            {/* Стоимость */}
            <div className="flex items-center justify-between mt-auto">
              <span className="text-sm font-semibold text-gray-900">
                {tutor.hourlyRate ? `${tutor.hourlyRate} €/Std.` : 'Preis auf Anfrage'}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                Profil ansehen →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};