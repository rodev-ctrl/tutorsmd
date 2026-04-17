"use client";
import { useNavigate } from 'react-router-dom';

const ImageSelfi = require("assets/img/FotoLebenslauf.jpg");


import Selfi from "./TutorComponents/Selfi";
import Text from "./TutorComponents/Text";
import Subjects from "./TutorComponents/Subjects";
import HeaderTutor from "./TutorComponents/HeaderTutor";
import ButtonLessonsReceive from "./TutorComponents/ButtonLessonsReceive";
import React, { useEffect, useRef, useState } from "react";

import { Tutor } from '../../../../../interfaces/index';
import { useLanguage } from '../../../../../context/LanguageContext';

  type Props = {
    tutor: Tutor,
    commonClassname: string,
    grade: number,
    setCurrentNameTutor: (currentNameTutor:string) => void,
    setCurrentSurnameTutor: (currentSurnameTutor: string) => void,
    currentNameTutor: string,
    currentSurnameTutor: string
  }


const MobileTutor = ({grade, tutor, commonClassname, setCurrentNameTutor, setCurrentSurnameTutor, currentNameTutor, currentSurnameTutor}: Props)  => {
    const {id, name, namegerman, surname, surnamegerman, availableSubjects, highlight, highlightgerman, fulldescribe, fulldescribegerman}: Tutor = tutor;


    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement | null>(null); 
    const { language } = useLanguage();

        const [highlightCurrent, setHighlightCurrent] = useState<string>();
        const [fulldescribeCurrent, setFulldescribeCurrent] = useState<string>();
        const [borderRadius, setBorderRadius] = useState<string>("");

    const link = () => {
      console.log(namegerman);
      console.log(surnamegerman);
      console.log(name);
      console.log(surname);
      console.log(language);
      if(language == "german") {
        // setCurrentNameTutor(namegerman); setCurrentSurnameTutor(surnamegerman);
        navigate(`/tutors?name=${namegerman}&surname=${surnamegerman}`);
      }
      if(language == "russian") {
        // setCurrentNameTutor(name); setCurrentSurnameTutor(surname);
        navigate(`/tutors?name=${name}&surname=${surname}`)
      }
    }

    /*
          useEffect(() => {
            if (currentNameTutor.length > 0 && currentSurnameTutor.length > 0) {
              if(window.location.href.indexOf("name") == -1 && window.location.href.indexOf("surname") == -1 && window.location.href.indexOf("dashboard") == -1) {
                navigate(`/tutors?name=${currentNameTutor}&surname=${currentSurnameTutor}`);
              }
            }
          }, [currentNameTutor, currentSurnameTutor, navigate]);
*/
                useEffect(() => {
                     if(language == "german") {setFulldescribeCurrent(fulldescribegerman); setHighlightCurrent(highlightgerman)}
                     if(language == "russian") {setFulldescribeCurrent(fulldescribe); setHighlightCurrent(highlight)}
                }, [language, fulldescribe, fulldescribegerman, highlight, highlightgerman])


                // Скругления
  useEffect(() => {
    const handleResize = () => {
      setBorderRadius(window.innerWidth > 1250 ? "15px 0px 0px 5px" : "15px 15px 0px 0px");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    return ( 
     
   
  
  <div 
     ref={ref}
     style={{borderRadius: "20px 20px 5px 5px"}} 
     className={commonClassname || ""}
     onClick={link}>
  
  <Selfi 
      ImageSelfi={ImageSelfi} 
      name={(language == "german") ? namegerman : name} 
      surname={language === "german" ? surnamegerman : surname}
      width="100%" 
      height="100%" 
      maxHeight="260px" 
      radius={borderRadius} 
  /> 
  



  <div className="text-center w-full mt-2">
  

  

  <div className="p-2">
  <HeaderTutor grade={grade} id={tutor.id} count={tutor.rating_count} />


  <div className="describe my-4">
  <Subjects availableSubjects={availableSubjects} />
  <Text highlight={highlightCurrent || ""} fulldescribe={fulldescribeCurrent || ""} />
  </div>

  
  </div>
  <div className='flex justify-center'>
<ButtonLessonsReceive />
</div>
  </div>
  
    
  </div>
   
    
     
    
    );
   }



   export default React.memo(MobileTutor);