"use client";
import { useState, FunctionComponent, useEffect } from "react";


import Tutors from "./Tutors/Tutors";
import Subjects from "./Subjects/Subjects";
import Prices from "./Prices/Prices";
import Questions from "./Questions/Questions";
import { scroller } from "react-scroll";
import React from "react";


type Props = {
  setCurrentNameTutor: (currentNameTutor:string) => void,
  setCurrentSurnameTutor: (currentSurnameTutor: string) => void,
  currentNameTutor: string,
  currentSurnameTutor: string
}


const Body: FunctionComponent<Props> = ({setCurrentNameTutor, setCurrentSurnameTutor, currentNameTutor, currentSurnameTutor}) => {

  const [nameElement, setNameElement] = useState("");

  useEffect(() => {
    if(window.location.href == `${process.env.REACT_APP_CLIENT_URL}/#tutors`) setNameElement("tutors")
    if(window.location.href == `${process.env.REACT_APP_CLIENT_URL}/#subjects`) {setNameElement("subjects")}
    if(window.location.href == `${process.env.REACT_APP_CLIENT_URL}/#prices`) setNameElement("prices")
    if(window.location.href == `${process.env.REACT_APP_CLIENT_URL}/#questions`) setNameElement("questions")

    if(nameElement.length > 0) {
      scroller.scrollTo(nameElement, {
        duration: 100,
        delay: 0,
        smooth: 'easeInOutQuart'
      });
    
    }
  }, [window.location.href, nameElement]);
    

  return (
  <div className="body mt-20">  
  
    <Tutors setCurrentNameTutor={setCurrentNameTutor} setCurrentSurnameTutor={setCurrentSurnameTutor} currentNameTutor={currentNameTutor} currentSurnameTutor={currentSurnameTutor} />
    <Subjects />
    <Prices />
    <Questions />
    
  </div>
  );
}


export default React.memo(Body);

