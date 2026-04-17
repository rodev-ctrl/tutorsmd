"use client"
import React, { ForwardedRef, FunctionComponent, RefObject, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";
import Tutor from "../../Body/Tutors/Tutor/Tutor";
import { Button } from "@mui/material";
import UpLinie from "../../Header/UpLinie";
import Footer from "../../Footer/Footer";
const ArrowRight = require("../../../../assets/img/arrowRight.png");

import * as Types from "@/app/interfaces";
import { useLanguage } from "../../../context/LanguageContext";

type Props = {
    setCurrentNameTutor: (currentNameTutor: string) => void,
    setCurrentSurnameTutor: (currentSurnameTutor: string) => void,
    currentNameTutor: string,
    currentSurnameTutor: string,
    scrollToBlock: Function, 
    refQuestionWrite: RefObject<HTMLDivElement>, 
    setIsCabinetOpened: (isCabinetOpened: string) => void, 
    isCabinetOpened: string,
    messages: Types.Message[],
    setMessages: (messages: Types.Message[]) => void 
  }




const LikedTeachers:FunctionComponent<Props> = ({setCurrentNameTutor, setCurrentSurnameTutor, currentNameTutor, currentSurnameTutor, scrollToBlock, refQuestionWrite, setIsCabinetOpened, isCabinetOpened, messages, setMessages }) => {
  

  const { language } = useLanguage();

  const likedTutors = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian
    return data?.likedTutors || []; // Если данных нет, возвращаем пустой массив
  });

  const tutors = useSelector((state: any) => {
    const data = language === "german" ? state.german : state.russian
    return data?.tutors;
  })
  const [className, setClassName] = useState<string>("mt-10");


  class TranslateClass {
    static header() {
      if(filteredTutors.length > 0) {
         if(language == "german") return "Bevorzugte Lehrer"
         if(language == "russian") return "Понравившиеся преподаватели"
      } else {
         if(language == "german") return "Keine bevorzugte Lehrer"
         if(language == "russian") return "Нет понравившихся преподавателей"
      }
      
    }

    static buttonRedirectTutorsPage() {
      if(language == "german") return "Alle Tutors"
      if(language == "russian") return "Все преподаватели"
    }
  }


   // Фильтруем преподавателей, чьи ID находятся в likedTutors
   const filteredTutors = tutors.filter((tutor: Types.Tutor) =>
    likedTutors.includes(tutor.id)
  );

  useEffect(() => {
    if(window.innerWidth > 600) {
       setClassName(className + " grid grid-cols-2");
    }
  }, [])


  

  return (
    <div>
      <UpLinie scrollToBlock={scrollToBlock} 
                 refQuestionWrite={refQuestionWrite} 
                 setIsCabinetOpened={setIsCabinetOpened} 
                 isCabinetOpened={isCabinetOpened}  
         />
      <h1 className="text-3xl font-bold text-center m-2">{TranslateClass.header()}</h1>
  
      {filteredTutors.length > 0 ? (
        <div className={className}>
          {filteredTutors.map((tutor: Types.Tutor) => (
            <Tutor
              length={tutors.length}
              tutor={tutor}
              key={tutor.id}
              setCurrentNameTutor={setCurrentNameTutor}
              setCurrentSurnameTutor={setCurrentSurnameTutor}
              currentNameTutor={currentNameTutor}
              currentSurnameTutor={currentSurnameTutor}
              filteredTutorsLength={filteredTutors.length}
            />
          ))}
        </div>
      ) : (
        

        <div className="w-full mt-10 flex justify-center">
          <Button
            color="warning"
            variant="contained"
            component={RouterLink}
            to={`${process.env.REACT_APP_CLIENT_URL}/tutors`}
            startIcon={
              <img
                alt="left"
                src={ArrowRight}
                style={{ width: 24, height: 24, transform: "rotate(180deg)" }}
              />
            }
            sx={{
              m: 2,
              px: 2,
              height: 50,
              "&:hover": { backgroundColor: "lightorange", color: "white" },
            }}
          >
            {TranslateClass.buttonRedirectTutorsPage()}
          </Button>
        </div>
        
      )}


      <Footer refQuestionWrite={refQuestionWrite}   
          />
    </div>
  );
  
   
  }

  export default React.memo(LikedTeachers);
