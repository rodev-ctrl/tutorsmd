"use client";
const ImageSelfi = require("assets/img/Foto Lebenslauf.jpg");
import { useNavigate } from 'react-router-dom';



import ButtonLessonsReceive from "./TutorComponents/ButtonLessonsReceive";
import HeaderTutor from "./TutorComponents/HeaderTutor";
import Text from "./TutorComponents/Text";
import Subjects from "./TutorComponents/Subjects";
import Selfi from "./TutorComponents/Selfi";

import React, { useEffect, useState } from "react";

import { Tutor } from '../../../../../interfaces/index';
import { useLanguage } from '../../../../../context/LanguageContext';

type Props = {
  tutor: Tutor;
  commonClassname: string;
};

const DekstopTutor = ({
  tutor,
  commonClassname,
}: Props) => {
  const {
    name,
    namegerman,
    surname,
    surnamegerman,
    availableSubjects,
    highlight,
    highlightgerman,
    fulldescribe,
    fulldescribegerman,
    rating_avg,
    rating_count
  } = tutor;

  const navigate = useNavigate();

  const [highlightCurrent, setHighlightCurrent] = useState<string>("");
  const [fulldescribeCurrent, setFulldescribeCurrent] = useState<string>("");
  const [borderRadius, setBorderRadius] = useState<string>("15px 15px 0px 0px");
  const [marginDescribe, setMarginDescribe] = useState<string>("2%");


  const { language } = useLanguage();


  // Устанавливаем имя и фамилию текущего репетитора
  const link = () => {
    if(language == "german") {
      // setCurrentNameTutor(namegerman); setCurrentSurnameTutor(surnamegerman);
      navigate(`/tutors?name=${namegerman}&surname=${surnamegerman}`);
    }
    if(language == "russian") {
      // setCurrentNameTutor(name); setCurrentSurnameTutor(surname);
      navigate(`/tutors?name=${name}&surname=${surname}`)
    }
  }

  // Навигация при выборе репетитора
  
  /*
  useEffect(() => {
    if (currentNameTutor.length > 0 && currentSurnameTutor.length > 0) {
      if(window.location.href.indexOf("name") == -1 && window.location.href.indexOf("surname") == -1 && window.location.href.indexOf("dashboard") == -1) {
        navigate(`/tutors?name=${currentNameTutor}&surname=${currentSurnameTutor}`);
      }
    }
  }, [currentNameTutor, currentSurnameTutor, navigate]);
  */

  // Текстовые поля в зависимости от языка
  useEffect(() => {
    if (language === "german") {
      setFulldescribeCurrent(fulldescribegerman);
      setHighlightCurrent(highlightgerman);
    } else {
      setFulldescribeCurrent(fulldescribe);
      setHighlightCurrent(highlight);
    }
  }, [language, fulldescribe, fulldescribegerman, highlight, highlightgerman]);

  // Обновляем скругление углов при изменении ширины окна
  useEffect(() => {
    const handleResize = () => {
      setBorderRadius(
        window.innerWidth > 1250 ? "15px 0px 0px 5px" : "15px 15px 0px 0px"
      );
      setMarginDescribe(
        window.innerWidth > 1410 ? "4%" : "2%"
      )
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  

  return (
    <div
      style={{ borderRadius: "20px 20px 5px 5px", maxHeight: "260px" }}
      className={`grid grid-cols-12 ${commonClassname}`}
      onClick={link}
    >
      <div className='col-span-5'>
      <Selfi
        ImageSelfi={ImageSelfi}
        name={language === "german" ? namegerman : name}
        surname={language === "german" ? surnamegerman : surname}
        width="100%"
        height="100%"
        maxHeight="260px"
        radius={borderRadius}
      />
      </div>
      

      <div className="w-full p-2 col-span-7">
        <HeaderTutor
          grade={rating_avg}
          count={rating_count}
          id={tutor.id}
        />

        <div className="describe" style={{marginTop: marginDescribe, marginBottom: marginDescribe}}>
          <Subjects availableSubjects={availableSubjects} />
          <Text
            highlight={highlightCurrent || ""}
            fulldescribe={fulldescribeCurrent || ""}
          />
        </div>

        <div className="flex justify-center">
          <ButtonLessonsReceive />
        </div>
      </div>
    </div>
  );
};

export default React.memo(DekstopTutor);