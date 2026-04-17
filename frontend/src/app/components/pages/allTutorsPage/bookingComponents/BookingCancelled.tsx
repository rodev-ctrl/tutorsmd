// TutorPage.tsx
"use client";
import React, {
  FunctionComponent,
} from "react";

import { Button} from "@mui/material";
import { Link } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";


import { Booking } from "../../../../interfaces/index";
import { useLanguage } from "../../../../context/LanguageContext";

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
    booking: Booking | null, 
    setBooking: (booking: Booking | null) => void,
    complaintSent: boolean, 
    setComplaintSent: (complaintSent: boolean) => void, 
    setComplaint: (complaint: string) => void, 
    sendComplaint: () => void,
    setStep?: (step: "date" | "time" | "form" | null) => void,
    setDate?: (date: Dayjs | null) => void,
    setSelectedTime?: (selectedTime: string | null) => void,
    setCurrentSubject?: (currentSubject: string) => void,
    setCurrentLevel?: (currentLevel: Level | null) => void,
    T: T
};


const BookingCancelled: FunctionComponent<Props> = (props) => {

    const {
        setBooking,
        complaintSent, setComplaintSent, setComplaint, sendComplaint,
        setStep,
        setDate,
        setSelectedTime,
        setCurrentSubject,
        setCurrentLevel,
        T
    } = props;

    const { language } = useLanguage();

    return (
        <>
          {!complaintSent ? (
            <div className="p-4 rounded-lg" style={{ boxShadow: "0 0 2rem rgba(0,0,0,.075), 0rem 1rem 1rem -1rem rgba(0,0,0,.1)" }}>
              <p className="text-center font-semibold mb-2">{T.whyCancelled}</p>
              <input
                type="text"
                className="w-full mx-auto p-2 border rounded"
                placeholder={language === "german" ? "Ihr Feedback" : "Ваша обратная связь"}
                onChange={(e) => setComplaint(e.target.value)}
              />
              <Button className="mx-auto mt-3" color="success" variant="outlined" onClick={sendComplaint}>
                {T.complaint}
              </Button>
            </div>
          ) : (
            <div>
              <div>{T.afterComplaint}</div>
              <div className="flex mt-3">
                <Button
                  className="mx-auto"
                  color="warning"
                  variant="outlined"
                  onClick={() => {
                    setBooking(null);
                    if(setStep) {
                      setStep("date");
                    }
                    if(setDate) {
                      setDate(dayjs().startOf("day"));
                    }
                    if(setSelectedTime) {
                      setSelectedTime(null);
                    }
                    if(setCurrentSubject) {
                      setCurrentSubject("");
                    }
                    if(setCurrentLevel) {
                      setCurrentLevel(null);
                    }
                    if(setComplaintSent) {
                      setComplaintSent(false);
                    }
                    if(setDate) {
                      setDate(dayjs().startOf("day"));
                    }
                  }}
                >
                  {T.buttonsAfterComplaint[0]}
                </Button>
                <Link to="/tutors">
                  <Button color="success" variant="outlined">
                    {T.buttonsAfterComplaint[1]}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
)}

export default React.memo(BookingCancelled);