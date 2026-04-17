// TutorPage.tsx
"use client";
import React, {
  FunctionComponent,
} from "react";

import { Box, Button, Chip, Typography } from "@mui/material";

import { Booking, Tutor } from "@/app/interfaces/index";
import { useLanguage } from "../../../../context/LanguageContext";

// ---- types ----
type T = {
  teach: string,
    reviewsOfStudents: string,
    chooseDate: string,
    chooseTime: string,
    subjectLabel: string,
    nativeLangHeader: string,
    nativeLang: string,
    levelHeader: string,
    levelLabel: string,
    book: string,
    time: string,
    join: string,
    cancel: string,
    afterBooked: string,
    whyCancelled: string,
    complaint: string,
    afterComplaint: string,
    buttonsAfterComplaint: string[],
    afterCompletedBooking: string[], 
    subjectsTitle: string,
    moreAboutYou: string,
    back: string,
    next: string,
    writeReview: string,
    reviewPH: string,
    send: string,
    reviews: string,
    showMore: string,
    collapse: string,
    likedLesson: string,
    pickDays: string,
    pickDaysFirst: string,
    changeDays: string,
    savePlan: string,
}

type Props = {
  hasRegularLessons: boolean,
  tutor: Tutor,
  selectedSubjects: string[],
  toggleSubjectSelection: (subject: string) => void,
  expandedSubject: string | null,
  toggleExpand: (subject: string) => void,
  toggleDayForSubject: (subject: string, dayKey: string) => void,
  scheduleBySubject : Record<string, {
    selectedDays: string[];
    times: Record<string, string>; // ключ = день, значение = время
  }>,
  visibleTimes: string[],
  handleNext: () => void,
  handlePrev: () => void,
  startIndex: number,
  pickTimeForSubjectDay: (subject: string, dayKey: string, time: string) => void,
  filteredTimes: string[],
  finalizeRegularSchedule: () => void,
  T: T
};

// ---- constants/helpers ----
const ITEMS_PER_PAGE = 3;

const daysOfWeek = [
  { key: "mon", dow: 1, ru: "Пн", de: "Mo" },
  { key: "tue", dow: 2, ru: "Вт", de: "Di" },
  { key: "wed", dow: 3, ru: "Ср", de: "Mi" },
  { key: "thu", dow: 4, ru: "Чт", de: "Do" },
  { key: "fri", dow: 5, ru: "Пт", de: "Fr" },
  { key: "sat", dow: 6, ru: "Сб", de: "Sa" },
  { key: "sun", dow: 7, ru: "Вс", de: "So" },
];





const BookingCompleted: FunctionComponent<Props> = (props) => {

    const {
        hasRegularLessons,
        tutor,
        selectedSubjects,
        toggleSubjectSelection,
        expandedSubject,
        toggleExpand,
        toggleDayForSubject,
        scheduleBySubject,
        visibleTimes,
        handleNext,
        handlePrev,
        startIndex,
        pickTimeForSubjectDay,
        filteredTimes,
        finalizeRegularSchedule,
        T
    } = props;


    const { language } = useLanguage();

    return (
        <>
        
      
              {/* если плана ещё нет → конструктор расписания */}
              {!hasRegularLessons && (
                <Box mt={4}>
                  <Typography variant="h6" align="center" fontWeight={700} sx={{ mb: 3 }}>
                    {language === "german"
                      ? "Wählen Sie regelmäßige Unterrichtsfächer"
                      : "Выберите предметы для регулярных занятий"}
                  </Typography>
        
                  {/* Предметы */}
                  <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2} mb={3}>
                    {(language === "german" ? tutor?.availableSubjects?.de : tutor?.availableSubjects?.ru || []).map(
                      (subject: string) => {
                        const isSelected = selectedSubjects.includes(subject);
                        return (
                          <Chip
                            key={subject}
                            label={subject}
                            onClick={() => toggleSubjectSelection(subject)}
                            icon={isSelected ? <span>✓</span> : undefined}
                            color={isSelected ? "primary" : "default"}
                            variant={isSelected ? "filled" : "outlined"}
                            sx={{ minWidth: "120px", cursor: "pointer" }}
                          />
                        );
                      }
                    )}
                  </Box>
        
                  {/* Аккордеоны по предметам */}
                  {selectedSubjects.map((subject) => {
                    const isExpanded = expandedSubject === subject;
                    const schedule = scheduleBySubject[subject] || { selectedDays: [], times: {} };
        
                    return (
                      <Box key={subject} sx={{ border: "1px solid #ccc", borderRadius: "8px", mb: 2 }}>
                        <Box
                          onClick={() => toggleExpand(subject)}
                          sx={{
                            p: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            backgroundColor: isExpanded ? "#f0f0f0" : "#fafafa",
                          }}
                        >
                          <Typography fontWeight={700}>{subject}</Typography>
                          <Typography>{isExpanded ? "▲" : "▼"}</Typography>
                        </Box>
        
                        {isExpanded && (
                          <Box p={2}>
                            <Typography align="center" sx={{ mb: 2 }}>
                              {T.pickDays}
                            </Typography>
        
                            {/* Дни недели */}
                            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                              {daysOfWeek.map((day) => {
                                const isDaySelected = schedule.selectedDays.includes(day.key);
                                const label = language === "german" ? day.de : day.ru;
                                return (
                                  <Chip
                                    key={day.key}
                                    label={label}
                                    onClick={() => toggleDayForSubject(subject, day.key)}
                                    icon={isDaySelected ? <span>✓</span> : undefined}
                                    color={isDaySelected ? "success" : "default"}
                                    variant={isDaySelected ? "filled" : "outlined"}
                                  />
                                );
                              })}
                            </Box>
        
                            {/* Выбор времени */}
                            {schedule.selectedDays.map((dayKey) => {
                              const day = daysOfWeek.find((d) => d.key === dayKey);
                              const label = language === "german" ? day?.de : day?.ru;
                              const currentTime = schedule.times[dayKey];
        
                              return (
                                <Box key={dayKey} mt={3}>
                                  <Typography align="center">
                                    {(language === "german" ? "Zeit für " : "Время для ") + label}
                                  </Typography>
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} flexWrap="wrap" mt={1}>
                                    <Button onClick={handlePrev} disabled={startIndex === 0}>◀</Button>
                                    {visibleTimes.map((time) => (
                                      <Chip
                                        key={time}
                                        label={time}
                                        onClick={() => pickTimeForSubjectDay(subject, dayKey, time)}
                                        color={currentTime === time ? "primary" : "default"}
                                        variant={currentTime === time ? "filled" : "outlined"}
                                      />
                                    ))}
                                    <Button onClick={handleNext} disabled={startIndex + ITEMS_PER_PAGE >= filteredTimes.length}>▶</Button>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
        
                  {/* Сохранить общий план */}
                  {selectedSubjects.length > 0 && (
                    <Box display="flex" justifyContent="center" mt={4}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={finalizeRegularSchedule}
                        disabled={selectedSubjects.some(
                          (subject) =>
                            scheduleBySubject[subject].selectedDays.length === 0 ||
                            !Object.values(scheduleBySubject[subject].times).every(Boolean)
                        )}
                      >
                        {T.savePlan}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
        
             
        
            </>
          
)}

export default React.memo(BookingCompleted);