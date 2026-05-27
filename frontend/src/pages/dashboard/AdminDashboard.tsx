import { Lesson } from '@entities/lesson/model/types';
import { useGetPendingTutorsQuery, useApproveTutorMutation, useRejectTutorMutation } from '@shared/api/tutor/tutorApi';
import { Spinner, useGetUserLessonsQuery } from '@shared/index';
import { LessonCard } from '@widgets/lesson-card/index';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { data, isLoading } = useGetPendingTutorsQuery();
  const { data: lessonsData, isLoading: lessonsLoading } = useGetUserLessonsQuery({});

  const [approve, { isLoading: approving }] = useApproveTutorMutation();
  const [reject,  { isLoading: rejecting }] = useRejectTutorMutation();

  const pending = data?.tutors ?? [];
  const allLessons       = lessonsData?.lessons ?? [];
  const pendingLessons   = allLessons.filter((l: Lesson) => l.status === 'pending');
  const confirmedLessons = allLessons.filter((l: Lesson) => l.status === 'confirmed');


  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-bold text-gray-900">Admin-Bereich</h1>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Nachhilfelehrer zur Prüfung ({pending.length})
        </h2>

        {isLoading ? (
          <Spinner />
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">Keine ausstehenden Anträge.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((tutor) => (
              <div
                key={tutor.tutorId}
                className="bg-white rounded-2xl border border-gray-100 p-5
                  flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {tutor.name} {tutor.surname}
                  </p>
                  <p className="text-sm text-gray-500">{tutor.email}</p>
                  {tutor.nameDe && (
                    <p className="text-xs text-gray-400 mt-0.5">DE: {tutor.nameDe}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve({ tutorId: tutor.tutorId })}
                    disabled={approving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400
                      text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Freischalten
                  </button>
                  <button
                    onClick={() => reject({ tutorId: tutor.tutorId })}
                    disabled={rejecting}
                    className="bg-red-100 hover:bg-red-200 text-red-700
                      text-sm px-4 py-2 rounded-lg transition"
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}


      </section>




<section className="unterricht">

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <QuickAction to="/lessons"  icon="📅" title="Alle Unterrichte" />
           <QuickAction to="/settings" icon="📝" title="Profil bearbeiten" />
           <QuickAction to="/settings/media" icon="🎥" title="Kamera testen" />
         </div>
   
       
         {pendingLessons.length > 0 && (
           <div className="mt-6">
             <h2 className="text-lg font-semibold text-gray-900 mb-4">
               Neue Anfragen ({pendingLessons.length})
             </h2>
             <div className="space-y-3">
               {pendingLessons.map((lesson: Lesson) => (
                 <LessonCard key={lesson.id} lesson={lesson} role="tutor" />
               ))}
             </div>
           </div>
         )}
   
         {/* Предстоящие уроки */}
         <section>
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-gray-900">
               Nächste Unterrichtsstunden
             </h3>
             <Link to="/lessons" className="text-sm text-blue-600 hover:underline">
               Alle ansehen
             </Link>
           </div>
   
           {isLoading ? (
             <Spinner />
           ) : confirmedLessons.length === 0 ? (
             <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
               <p className="text-gray-400 text-sm">Keine Unterrichtsstunden geplant.</p>
             </div>
           ) : (
             <div className="space-y-3">
               {confirmedLessons.slice(0, 5).map((lesson) => (
                 <LessonCard key={lesson.id} lesson={lesson} role="tutor" />
               ))}
             </div>
           )}
         </section>
   
       
       
    
  </section>
</div>
);}
  



 const QuickAction = ({ to, icon, title }: { to: string; icon: string; title: string }) => (
     <Link
       to={to}
       className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md
         transition flex items-center gap-3"
     >
       <span className="text-2xl">{icon}</span>
       <p className="font-medium text-gray-900 text-sm">{title}</p>
     </Link>
   );