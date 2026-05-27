import { useGetUserProfileQuery } from '@shared/api/profileApi';
import { useGetUserLessonsQuery } from '@shared/api/lessonApi';
import { LessonCard }    from '@widgets/lesson-card/index';
import { ProgressChart } from '@widgets/dashboard/ui/ProgressChart';
import { Spinner }       from '@shared/index';
import { Link }          from 'react-router-dom';

export const ClientDashboard = () => {
  const { data: profile, isLoading: profileLoading } = useGetUserProfileQuery();
  const { data: lessonsData, isLoading: lessonsLoading } = useGetUserLessonsQuery({
    status: 'confirmed',
  });

  const upcomingLessons = lessonsData?.lessons ?? [];

  if (profileLoading) return <Spinner />;

  return (
    <div className="space-y-8">

      {/* Приветствие */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen, {profile?.name}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Hier sind Ihre nächsten Unterrichtsstunden.
        </p>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction to="/tutors"   icon="🔍" title="Nachhilfelehrer finden" description="Alle verfügbaren Lehrer ansehen" />
        <QuickAction to="/lessons"  icon="📅" title="Alle Unterrichte"       description="Vergangene und geplante Stunden" />
        <QuickAction to="/settings" icon="⚙️" title="Einstellungen"          description="Profil und Konto verwalten" />
      </div>

      {/* График прогресса */}
      <ProgressChart />

      {/* Ближайшие уроки */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Nächste Unterrichtsstunden
          </h2>
          <Link to="/lessons" className="text-sm text-blue-600 hover:underline">
            Alle ansehen
          </Link>
        </div>

        {lessonsLoading ? (
          <Spinner />
        ) : upcomingLessons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm mb-4">Keine Unterrichtsstunden geplant.</p>
            <Link to="/tutors"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Nachhilfelehrer suchen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingLessons.slice(0, 3).map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} role="client" />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

const QuickAction = ({
  to, icon, title, description,
}: {
  to: string; icon: string; title: string; description: string;
}) => (
  <Link to={to}
    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md
      transition group flex items-start gap-4">
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition text-sm">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </Link>
);