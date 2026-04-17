import React, { FunctionComponent, useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import "./styles/Grafik.css";
import UserService from "../../../services/UserService";

type WeeklyProgress = {
  week_range: string;
  total_hours: number;
};

type Props = {
  email: string;
  userToken: string;
};

const Grafik: FunctionComponent<Props> = ({ email, userToken }) => {
  const [data, setData] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getProgress() {
      try {
        console.log("Fetching progress for:", email);
        setLoading(true);
        setError(null);

        const progress = await UserService.getProgress(email);
        console.log("Response:", progress);

        if (progress && progress.data && Array.isArray(progress.data.progress)) {
          setData(progress.data.progress);
        } else {
          console.warn("Unexpected response format:", progress?.data);
          setData([]); // Сбрасываем данные, если структура неожиданная
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    }

    getProgress();
  }, [email, userToken]); // Добавили userToken в зависимости

  return (
    <div className="grafik text-center">
      <h2 className="text-xl font-bold mb-4">Прогресс по неделям</h2>

      {loading && <p>Загрузка...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <Line type="monotone" dataKey="total_hours" stroke="#8884d8" strokeWidth={2} />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="week_range" tickFormatter={(week) => `Неделя ${week}`} />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default React.memo(Grafik);

