import type { AvailableSlot } from '@shared/api/tutor/tutorPublicApi';

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

interface Props {
  slots: AvailableSlot[];
}

export const TutorSchedule = ({ slots }: Props) => {
  const activeSlots = slots.filter((s) => s.isActive);

  if (!activeSlots.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Verfügbarkeit</h2>
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Заголовки дней */}
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}

        {/* Слоты по дням */}
        {DAY_NAMES.map((_, day) => {
          const daySlots = activeSlots
            .filter((s) => s.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={day} className="space-y-1 min-h-[24px]">
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className="text-xs bg-blue-50 text-blue-700 rounded px-1 py-0.5"
                  title={`${s.startTime} – ${s.endTime}`}
                >
                  {s.startTime}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
