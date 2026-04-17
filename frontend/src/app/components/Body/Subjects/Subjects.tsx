"use client";

import { useState, FunctionComponent, useEffect } from "react";

import Subject from "./Subject/Subject";
import { useDispatch, useSelector } from "react-redux";
import React from "react";


import "./styles/Subjects.css";
import * as Types from "../../../interfaces/index";
import { useLanguage } from "../../../context/LanguageContext";



  const Subjects: FunctionComponent = () => {
  
  
    const { language } = useLanguage();
    const dispatch = useDispatch();
    const subjects = useSelector((state: any) => {
      
      const data = language === "german" ? state.german : state.russian;
      console.log(data);
      console.log(language)
      return data?.subjects || []; // Если данных нет, возвращаем пустой массив
    });

    const [gridClassName, setGridClassName] = useState<String>(`grid grid-cols-${subjects.length}`);

    function grid() {
        if(window.innerWidth < 1200) {
          setGridClassName(`grid grid-cols-1`);
        } else {
          setGridClassName(`grid grid-cols-${subjects.length}`);
        }
      }
    
      useEffect(() => {grid()}, []);

      class TranslateClass { 
        static header() {
           if(language == "german") return "Fächer"
           if(language == "russian") return "Предметы"
        }
      }

const className = `subjects content-center justify-center items-center`

  return (

  <div className={className} id="subjects">
    <h2 className="text-3xl text-center py-5">{TranslateClass.header()}</h2>
    <div className={`${gridClassName}`}>
      {
         subjects.map((subject: Types.Subject) => <Subject amount={subjects.length} subject={subject} key={subject.id} />)
      }
    </div>


  </div>

  );
}

export default React.memo(Subjects);
