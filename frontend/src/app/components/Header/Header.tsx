"use client";
import React, { useState, FunctionComponent, ForwardedRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

import UpLinie from "./UpLinie";
import { Client, Tutor, Subject, PropsStor } from "../../interfaces/index";
import { useLanguage } from "../../context/LanguageContext";



type Props = {
    scrollToBlock: Function,
    refQuestionWrite: ForwardedRef<HTMLDivElement>,
    setIsCabinetOpened: (isCabinetOpened: string) => void,
    isCabinetOpened: string
  }
  
 

const Header: FunctionComponent<Props> = ({ scrollToBlock, refQuestionWrite, setIsCabinetOpened, isCabinetOpened}) => {

  const { language } = useLanguage();
  const subjects = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian
    return data?.subjects || []; // Если данных нет, возвращаем пустой массив
  });

  const [opacityPage, setOpacityPage] = useState<string>("100");



  return (
  <div className={`Header text-center w-full max-h-80 opacity-${opacityPage}`}>
   
   <UpLinie scrollToBlock={scrollToBlock} 
            refQuestionWrite={refQuestionWrite} 
            setIsCabinetOpened={setIsCabinetOpened} 
            isCabinetOpened={isCabinetOpened}  
    />
   

   <div className="subjects mt-16 space-y-4">
  {subjects.map((subject: Subject, index: number) => (
    <motion.p
      key={subject.id}
      className="text-2xl italic"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      {subject.subjectName}
    </motion.p>
  ))}
</div>
    
  </div>
  );
}



export default React.memo(Header);