import React, { FunctionComponent, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useLanguage } from "../../../../../../context/LanguageContext";


const ButtonLessonsReceive:FunctionComponent= () => {


  const {language} = useLanguage();

   class TranslateClass {
    
    static button() {
      if(language == "german") return "Probeunterricht"
      if(language == "russian") return "Пробный урок"
    }
   }

   
    return (
      <Button 
      className= "buttonLessonReceive text-center mx-auto w-1/2 block hover:bg-orange-300 duration-300 active:bg-orange-300"
      sx={{paddingX: "5px", paddingY: "10px", margin: "0.5rem", backgroundColor: "orange", color: "white", borderRadius: "5px" }}
     >
       {TranslateClass.button()}
  </Button>
    )
  }

  export default React.memo(ButtonLessonsReceive);