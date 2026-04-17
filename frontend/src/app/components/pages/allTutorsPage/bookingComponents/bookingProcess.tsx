// TutorPage.tsx
"use client";
import React, {
  FunctionComponent,
} from "react";

import { Box, Button, Chip, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { Booking } from "../../../../interfaces/index";

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
  booking: Booking | null,
  cancelBooking: () => void,
  goToLesson: (type:string, lessonid?:string) => void,
  monthName: (d: Dayjs) => string,
  T: T
};



const BookingProcess: FunctionComponent<Props> = (props) => {

    const {
        booking,
        cancelBooking,
        goToLesson,
        monthName,
        T
    } = props;


    return (
        <>
            <Box textAlign="center" mt={2}>
          <div className="mb-2">{T.afterBooked}</div>
          <p>{T.time}:</p>
          <strong>
            {booking && dayjs(booking.datetime).format("DD")} {booking && monthName(dayjs(booking.datetime))}{" "}
            {booking && dayjs(booking.datetime).format("HH:mm")}
          </strong>

          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <Button color="error" variant="outlined" onClick={cancelBooking}>
              {T.cancel}
            </Button>
            <Button color="success" variant="contained" onClick={() => goToLesson("booking")}>
              {T.join}
            </Button>
          </div>
        </Box>
        </>  
)}

export default React.memo(BookingProcess);