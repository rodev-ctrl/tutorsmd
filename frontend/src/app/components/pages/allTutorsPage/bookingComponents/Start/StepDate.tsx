// TutorPage.tsx
"use client";
import React, {
  FunctionComponent,
} from "react";

import { Box, Button, Typography} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";


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

type WeeklyPlan = {
  id: number;
  lessonid: string;
  client_email: string;
  tutor_email: string;
  status: string;
  datetime: {
    timezone: string;
    subjects: Record<
      string,
      Array<{ dow: number; time: string; status: string }>
    >;
  };
};


type Props = {
    step: "date" | "time" | "form" | null,
    date: Dayjs | null,
    handleDateChange: (newDate: Dayjs | null) => void,
    goNext: () => void,
    T: T,
    unavailableLessonsTime: WeeklyPlan[]
};


const StepDate: FunctionComponent<Props> = (props) => {

    const {
        step,
        date,
        handleDateChange,
        goNext,
        T,
        unavailableLessonsTime
    } = props;


    return (
      <>
        <Box textAlign="center" mt={2}>
          <Typography variant="h6" fontWeight={700}>
            {T.chooseDate}
          </Typography>
          <DatePicker
            value={date || dayjs()}
            onChange={(d) => handleDateChange(d || dayjs())}
            shouldDisableDate={(d) => d.isBefore(dayjs().startOf("day").add(1, "day"))}
            sx={{ mt: 2 }}
          />
        </Box>

        <Button 
            variant="contained" 
            onClick={goNext} 
            disabled={!date || !dayjs()} 
            style={{"position": "relative", "left": "45%", marginTop: "1rem"}}>
              {T.next}
        </Button>
      </>
        
    
    )}

export default React.memo(StepDate);