"use client";

import React from "react";
import { useState, FunctionComponent, useEffect } from "react";


import "../styles/Subjects.css";


type SubjectType = {
  id: number,
  subjectName: string,
  level: string[],
  description: string,
  image: string
}

interface Props {
    subject: SubjectType,
    amount: number
  }

  

  const Subject = ({subject, amount}: Props): JSX.Element => {

    const {subjectName, level, description, image}:SubjectType = subject;
  
    const [margin, setMargin] = useState("");
    const [gridMain, setGridMain] = useState("");
    const [gridPhoto, setGridPhoto] = useState("");
    const [gridBody, setGridBody] = useState("");
    const [widthCard, setWidthCard] = useState<string>("w-11/12");
    const [commonClassname, setCommonClassname] = useState<string>("subject m-auto mb-20 justify-center shadow-[0_-3px_38px_-9px_rgba(0,0,0,1)] hover:cursor-pointer");
    const [borderRadius, setBorderradius] = useState("20px");
    const [textSize, setTextSize] = useState<string>("text-xl");

    function marginFunc() {
        if(window.innerWidth < 600) {
          setMargin("m-1");
        } else {
          setMargin("");
        }
      }

      function gridFunc() {
        if(window.innerWidth < 1450) {
          setTextSize("text-xl")
        } else if(window.innerWidth < 1250) {
          setTextSize("text-base")
        } else if(window.innerWidth < 850) {

        } else {
          setTextSize("text-2xl")
        }
          if(window.innerWidth < 750) {
            setGridMain("");
            setGridPhoto("");
            setGridBody("");
          } else {
            setGridMain("grid grid-cols-4");
            setGridPhoto("col-span-2");
            setGridBody("col-span-2");
          } 
        }
    
      useEffect(() => {marginFunc(); gridFunc()}, []);





  return (

<div className={`${commonClassname} ${gridMain} ${margin} ${widthCard} text-center p-2`} style={{borderRadius: borderRadius}}>

         <div className={`${gridPhoto}`}>
           <img
                src={image}
                height={270}
                alt={`${subjectName}`}
                style={{
                    objectFit: "cover",
                    borderRadius: borderRadius,
                    height: "270px",
                    width: "100%"
                  }}
                  className="mx-auto"
                 
               
           />
         </div>

<div className={`${gridBody}`}>
<h4 className="text-3xl font-bold pt-5 pb-5
         ">
               {subjectName}
         </h4>



         <div className="mx-auto">
            <div className={`level justify-center pb-5 ${textSize}`}>
               {level.map((item, i) => {
                   const isLast = i === level.length - 1;
                   return (
                     <span key={i} className="text-blue-500">
                       <span className="bg-yellow-400 shadow-md p-1">{item}</span>
                       {!isLast && " , "}
                     </span>
                   );
                 
               })}
            </div>

            <div className="description p-2 text-md">
               {description}
            </div>
         </div>
</div>
        
  
      
</div>
 
  );
}

export default React.memo(Subject);
