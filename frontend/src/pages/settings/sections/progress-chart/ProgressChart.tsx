// Заменяет старый Grafik.tsx
import { useGetUserLessonsQuery } from '@shared/index';
import {
  LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { Spinner } from '@shared/index';

export const ProgressChart = () => {
  const { data, isLoading } = useGetUserLessonsQuery({ status: 'completed' });

  // Группируем завершённые уроки по неделям
  const chartData = useMemo(() => {
    if (!data?.lessons.length) return [];

    const weeks: Record<string, number> = {};

    data.lessons.forEach((lesson) => {
      const date  = new Date(lesson.completedAt ?? lesson.scheduledAt);
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay()); // начало недели
      const key = start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      weeks[key] = (weeks[key] ?? 0) + lesson.durationMinutes / 60;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8) // последние 8 недель
      .map(([week, hours]) => ({
        week,
        hours: Math.round(hours * 10) / 10,
      }));
  }, [data]);

  if (isLoading) return <Spinner />;

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <p className="text-gray-400 text-sm">Noch keine abgeschlossenen Unterrichtsstunden.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Fortschritt (Stunden/Woche)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2563eb' }}
          />
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="4 4" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="h" />
          <Tooltip
            formatter={(v: number) => [`${v}h`, 'Unterricht']}
            labelFormatter={(l) => `Woche ${l}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};