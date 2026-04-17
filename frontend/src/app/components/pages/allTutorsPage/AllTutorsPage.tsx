import React, { ForwardedRef, FunctionComponent, useEffect } from "react";
import UpLinie from "../../Header/UpLinie";
import TutorPage from "./TutorPage";
import Tutors from "../../Body/Tutors/Tutors";
import Footer from "../../Footer/Footer";
import { useSearchParams } from "react-router-dom";

import { Booking, Message, Tutor, WeeklyPlan } from "../../../interfaces/index";



type Props = {
  messages: Message[],
  setMessages: (m: Message[]) => void,
  setCurrentNameTutor: (currentNameTutor: string) => void,
  setCurrentSurnameTutor: (currentSurnameTutor: string) => void,
  currentNameTutor: string,
  currentSurnameTutor: string,
  scrollToBlock: Function,
  refQuestionWrite: ForwardedRef<HTMLDivElement>,
  localStream: MediaStream | null,
  booking: Booking | null,
  setBooking: (booking: Booking | null) => void,
  setIsCabinetOpened: (isCabinetOpened: string) => void,
  isCabinetOpened: string,
  getLessons: (client_email?: string, tutor_email?: string) => void,
  lessons: WeeklyPlan[],
  hasRegularLessons: boolean,
  setHasRegularLessons: (hasRegularLessons: boolean) => void,
  unavailableLessonsTime: WeeklyPlan[],
  isGetLessonsCalled: boolean,
  setIsGetLessonsCalled: (isGetLessonsCalled:boolean) => void,
  complaint: string,
  setComplaint: (complaint: string) => void,
  complaintSent: boolean,
  setComplaintSent: (complaintSent: boolean) => void,
  sendComplaint: () => void
}



const AllTutorsPage: FunctionComponent<Props> = ({
      messages, setMessages, 
      setCurrentNameTutor, setCurrentSurnameTutor, 
      currentNameTutor, currentSurnameTutor, 
      scrollToBlock, 
      refQuestionWrite, 
      booking, setBooking,
      localStream, 
      setIsCabinetOpened, isCabinetOpened, 
      getLessons, lessons, hasRegularLessons, setHasRegularLessons,
      unavailableLessonsTime,
      isGetLessonsCalled, setIsGetLessonsCalled,
      complaint, setComplaint,
      complaintSent, setComplaintSent,
      sendComplaint
    }) => {

  

  const [searchParams] = useSearchParams();
  const nameSearch = searchParams.get("name");
  const surnameSearch = searchParams.get("surname");

  useEffect(() => {
    if(isGetLessonsCalled) {
      console.log(lessons);
    }
    
  }, [lessons]);

  useEffect(() => {
     console.log(nameSearch);
     console.log(surnameSearch);
  }, [])

  
  // Если есть параметры name и surname, рендерим TutorPage
  if (nameSearch && surnameSearch) {
    return <TutorPage 
            
            messages={messages} setMessages={setMessages} 
            setCurrentNameTutor={setCurrentNameTutor} setCurrentSurnameTutor={setCurrentSurnameTutor} 
            booking={booking} setBooking={setBooking} 
            scrollToBlock={scrollToBlock} 
            localStream={localStream} 
            refQuestionWrite={refQuestionWrite} 
            setIsCabinetOpened={setIsCabinetOpened} isCabinetOpened={isCabinetOpened}
            nameSearch={nameSearch} surnameSearch={surnameSearch}
            getLessons={getLessons}
            lessons={lessons}
            hasRegularLessons={hasRegularLessons} setHasRegularLessons={setHasRegularLessons}
            unavailableLessonsTime={unavailableLessonsTime}
            isGetLessonsCalled={isGetLessonsCalled} setIsGetLessonsCalled={setIsGetLessonsCalled}
            complaint={complaint} setComplaint={setComplaint}
            complaintSent={complaintSent} setComplaintSent={setComplaintSent}
            sendComplaint={sendComplaint}
            />
  }




  return (
    <div className="tutors">
             
                   <UpLinie scrollToBlock={scrollToBlock} 
                              refQuestionWrite={refQuestionWrite} 
                              setIsCabinetOpened={setIsCabinetOpened} 
                              isCabinetOpened={isCabinetOpened}  
                      />
           
             <Tutors setCurrentNameTutor={setCurrentNameTutor} setCurrentSurnameTutor={setCurrentSurnameTutor} currentNameTutor={currentNameTutor} currentSurnameTutor={currentSurnameTutor} />
             <Footer refQuestionWrite={refQuestionWrite}   
          />
    </div>
  )
};

export default React.memo(AllTutorsPage);
