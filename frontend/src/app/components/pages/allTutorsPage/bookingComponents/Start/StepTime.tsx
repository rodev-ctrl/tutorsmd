// TutorPage.tsx
"use client";
import React, {
  FunctionComponent,
} from "react";

import { Box, Button, Typography} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const ITEMS_PER_PAGE = 3;


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
    visibleTimes: string[],
    handleNext: () => void,
    handlePrev: () => void,
    startIndex: number,
    filteredTimes: string[],
    selectedTime: string | null,
    handleTimeSelect: (time: string) => void,
    goBack: () => void,
    goNext: () => void,
    T: T
};


const StepTime: FunctionComponent<Props> = (props) => {

    const {
        visibleTimes,
        handleNext,
        handlePrev,
        startIndex,
        filteredTimes,
        selectedTime,
        handleTimeSelect,
        goBack,
        goNext,
        T
    } = props;


    return (

        <Box textAlign="center" mt={2}>
          <Typography variant="h6" fontWeight={700}>
            {T.chooseTime}
          </Typography>

          <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2} flexWrap="wrap">
            <Button onClick={handlePrev} disabled={startIndex === 0}>◀</Button>

            {visibleTimes.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "contained" : "outlined"}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </Button>
            ))}

            <Button onClick={handleNext} disabled={startIndex + ITEMS_PER_PAGE >= filteredTimes.length}>▶</Button>
          </Box>

          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button variant="outlined" color="error" onClick={goBack}>
              {T.back}
            </Button>
            <Button variant="contained" onClick={goNext} disabled={!selectedTime}>
              {T.next}
            </Button>
          </Box>
        </Box>
    
)}

export default React.memo(StepTime);