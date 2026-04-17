// TutorPage.tsx
"use client";
import React, {
  FunctionComponent,
  useState,
} from "react";

import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography} from "@mui/material";
import { Dayjs } from "dayjs";

import { Tutor } from "../../../../../interfaces/index";
import { useLanguage } from "../../../../../context/LanguageContext";

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

type Level = {
    title: string;
    description: string;
  };



type Props = {
    currentSubject: string, 
    setCurrentSubject: (currentSubject: string) => void,
    tutor: Tutor,
    languagesChooseGerman: string[], 
    languagesChooseRussian: string[],
    currentLevel: Level | null, 
    levels: Level[] | undefined,
    handleBooking: () => void,
    dateTime: Dayjs | null,
    TitleChange: (event: SelectChangeEvent<string>) => void
    goBack: () => void,
    T: T
};


const StepForm: FunctionComponent<Props> = (props) => {

    const {
        currentSubject, setCurrentSubject,
        tutor,
        languagesChooseGerman, languagesChooseRussian,
        currentLevel, levels,
        handleBooking,
        dateTime,
        TitleChange,
        goBack,
        T
    } = props;


    const { language, setLanguage } = useLanguage();
    const [nativeLang, setNativeLang] = useState<string>(language);

    return (

        <Box mt={3}>
          <Typography variant="h6" align="center" fontWeight={700}>
            {T.moreAboutYou}
          </Typography>

          {/* Предмет */}
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>{T.subjectLabel}</InputLabel>
            <Select value={currentSubject} onChange={(e) => setCurrentSubject(e.target.value)}>
              {(language === "german" ? tutor?.availableSubjects?.de : tutor?.availableSubjects?.ru || []).map(
                (subject: string, i: number) => (
                  <MenuItem key={i} value={subject}>
                    {subject}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          {/* Родной язык */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>{T.nativeLang}</InputLabel>
            <Select value={nativeLang} onChange={(e) => setNativeLang(e.target.value)}>
              {(language === "german" ? languagesChooseGerman : languagesChooseRussian).map((lng, i) => (
                <MenuItem key={i} value={lng}>
                  {lng}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Уровень */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>{T.levelLabel}</InputLabel>
            <Select value={currentLevel?.title || ""} onChange={TitleChange}>
              {(levels || []).map((lvl:Level, i:number) => (
                <MenuItem key={i} value={lvl.title}>
                  <div style={{ whiteSpace: "normal" }}>
                    <strong>{lvl.title}</strong>
                    <Typography variant="body2" color="text.secondary">
                      {lvl.description}
                    </Typography>
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" gap={2} mt={3}>
            <Button variant="outlined" color="error" fullWidth onClick={goBack}>
              {T.back}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleBooking}
              disabled={!currentSubject || !language || !currentLevel || !dateTime}
            >
              {T.book}
            </Button>
          </Box>
        </Box>
    
)}

export default React.memo(StepForm);