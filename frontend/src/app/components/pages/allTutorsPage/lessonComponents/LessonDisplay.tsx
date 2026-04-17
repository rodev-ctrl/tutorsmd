"use client";
import React, { FunctionComponent } from "react";
import { Box, Button, Typography } from "@mui/material";

import { WeeklyPlan } from "../../../../interfaces/index";
import { useLanguage } from "../../../../context/LanguageContext";

type T = {
  join: string;
};



type Props = {
  lessons: WeeklyPlan[]; // ← теперь массив
  goToLesson: (type: string, lessonid?: string) => void;
  T: T;
};

const daysOfWeek = [
  { dow: 1, ru: "Пн", de: "Mo" },
  { dow: 2, ru: "Вт", de: "Di" },
  { dow: 3, ru: "Ср", de: "Mi" },
  { dow: 4, ru: "Чт", de: "Do" },
  { dow: 5, ru: "Пт", de: "Fr" },
  { dow: 6, ru: "Сб", de: "Sa" },
  { dow: 7, ru: "Вс", de: "So" },
];

const LessonDisplay: FunctionComponent<Props> = ({
  lessons,
  goToLesson,
  T
}) => {

  const { language } = useLanguage();

  // 🔥 Берём только первый объект расписания
  const lesson = lessons && lessons.length > 0 ? lessons[0] : null;

  if (!lesson || !lesson.datetime || !lesson.datetime.subjects) {
    return null; // Ничего не рендерим, если данных нет
  }

  // 🧩 Собираем все записи по предметам в один массив
  const entries = Object.entries(lesson.datetime.subjects).flatMap(
    ([subjectName, arr]) =>
      arr.map(item => ({
        subjectName,
        dow: item.dow,
        time: item.time,
        lessonid: lesson.lessonid
      }))
  );

  // ⏳ Сортируем по времени
  const sorted = entries.sort((a, b) => {
    const [ah, am] = a.time.split(":").map(Number);
    const [bh, bm] = b.time.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  return (
    <Box mt={4} textAlign="center">
      <Typography variant="h6" fontWeight={700}>
        {language === "german"
          ? "Ihr regelmäßiger Stundenplan"
          : "Ваше регулярное расписание"}
      </Typography>

      {sorted.map((item, index) => {
        const dayObj = daysOfWeek.find(d => d.dow === item.dow);
        const dayLabel =
          language === "german" ? dayObj?.de : dayObj?.ru;

        return (
          <Box
            key={index}
            mt={2}
            p={2}
            border="1px solid #ccc"
            borderRadius="8px"
            sx={{ textAlign: "left", maxWidth: 400, mx: "auto" }}
          >
            <Typography fontWeight={700} sx={{ mb: 1, textAlign: "center" }}>
              {item.subjectName}
            </Typography>

            <Typography>
              {dayLabel}: <strong>{item.time}</strong>
            </Typography>

            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              

              <Button
                color="success"
                variant="contained"
                onClick={() => goToLesson("lesson", item.lessonid)}
              >
                {T.join}
              </Button>
            </div>
          </Box>
        );
      })}
    </Box>
  );
};

export default React.memo(LessonDisplay);
