"use client";
import { useState, FunctionComponent, useEffect, useRef } from "react";

import { Button, FormControl, Input, InputLabel, MenuItem, Select } from "@mui/material";
import { Link, animateScroll as scroll } from "react-scroll";
import { useDispatch, useSelector } from "react-redux";
import Price from "./Price/Price";
import React from "react";


import { PropsStor } from "../../../interfaces/index";
import { useLanguage } from "../../../context/LanguageContext";


type TimeType = {
    id: number,
    name: string
  }
  

const Prices: FunctionComponent = () => {


    const { language } = useLanguage();
    const dispatch = useDispatch();
    const time = useSelector((state: any) => {
      console.log(state);
      // Проверяем, какая ветка сейчас активна в сторе
      const data = language === "german" ? state.german : state.russian
      return data?.time || []; 
    });
    const refParent = useRef<HTMLDivElement | null>(null);
    
  

    const [amountOfLessonsInWeek, setAmountOfLessonsInWeek] = useState<number>(0);
    const [timePeriod, setTimePeriod] = useState<Number>();
    const [sum, setSum] = useState<Number>(0);
    const [copyName, setCopyName] = useState<string>("Месяц");
    const [calcNameSize, setCalcnameSize] = useState<string>("text-3xl");
    const [widthCard, setWidthCard] = useState<string>("w-1/2");
  


    function Time() {
return time.map((timeItem: TimeType) => <Price key={timeItem.id} price={timeItem} Sum={Sum} setCopyName={setCopyName} copyName={copyName} refParent={refParent} />) 
    }



    function Sum(copyName:string) {
     
          if(copyName == "Год" || copyName == "Jahr") {
          
            setSum(amountOfLessonsInWeek * 4 * 12 * 15); 
          } else if(copyName == "Месяц" || copyName == "Monat") {
            setSum(amountOfLessonsInWeek * 4 * 15); 
          } else if(copyName == "Неделя" || copyName == "Woche") {
            setSum(amountOfLessonsInWeek * 15); 
          } else {
            setSum(0);
          }
          
         }
       
         
        
      
    useEffect(() => {Sum(copyName)}, [amountOfLessonsInWeek, copyName]);

    useEffect(() => {
      if(window.innerWidth < 450) setCalcnameSize("text-2xl")
      if(window.innerWidth < 800) setWidthCard("w-11/12");
    }, [])
    
    
    class TranslateClass {
      static calcName() {
        if(language == "german") return "Kostenberechnung"
        if(language == "russian") return "Калькулятор стоимости"
      }

      static time() {
         if(language == "german") return "Zeitraum"
        if(language == "russian") return "Длительность"
      }

      static amountOfLessons() {
        if(language == "german") return "Unterrichtzahl pro Woche"
        if(language == "russian") return "Количество занятий в неделю"
      }

      static sum() {
        if(language == "german") return ["Summe", "Euro"]
        if(language == "russian") return ["Сумма", "Евро"]
        return ["Сумма", "Евро"]
      }
    }
    
  return (
  <div id="prices" className={`prices text-center ${widthCard} font-bold mx-auto p-4 mt-40 shadow-[0_-3px_38px_-9px_rgba(0,0,0,1)]`} style={{borderRadius: "20px"}}>    
      <h2 className={`${calcNameSize}`}>{TranslateClass.calcName()}</h2>
      <div className="time mt-10">
      <h3 className="font-bold text-lg text-orange-300">{TranslateClass.time()}</h3>

       {/* Переключатель: мобильный селект или горизонтальный список */}
       {(window.innerWidth < 800) ? (
          <div className="mt-3">
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                displayEmpty
              >
                {time.map((t: { id: number, name: string }) => (
                  <MenuItem key={t.id} value={t.name}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        ) : (
          <div
            ref={refParent}
            className="mx-auto mt-4 flex flex-wrap justify-center gap-3"
          >
            {time.map((t: { id: number, name: string }) => {
              const active = copyName === t.name;
              return (
                <Button
                  key={t.id}
                  variant={active ? "contained" : "outlined"}
                  onClick={() => setCopyName(t.name)}
                  sx={{ textTransform: "none", marginLeft: "10px", marginRight: "10px" }}
                >
                  {t.name}
                </Button>
              );
            })}
          </div>
        )}
      </div>

        

       
        
        

<div className="amountOfLessonsInWeek mt-6">
  <h3 className="font-bold text-lg text-orange-300">{TranslateClass.amountOfLessons()}</h3>
<Input
                         type="text"
                         placeholder="0"
                         className="max-w-xs p-5 mx-auto"
                         onChange={(e) => {setAmountOfLessonsInWeek(Number(e.target.value))}}
                         value={String(amountOfLessonsInWeek)}
                         
                    />
</div>


<div className="sum mt-6">
   <h3 className="text-lg">{TranslateClass.sum()[0]}: <span className="text-yellow-200 font-bold">{String(sum)} {TranslateClass.sum()[1]}</span></h3>
</div>



      </div>
  
  );
}


export default React.memo(Prices);

