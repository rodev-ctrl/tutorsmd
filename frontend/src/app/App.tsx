"use client"

import React, { ForwardedRef, FunctionComponent, RefObject, SetStateAction, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";


import "../assets/css/App.css";

import Header from "./components/Header/Header";
import Body from "./components/Body/Body";
import Footer from "./components/Footer/Footer";

import { Tutor, Message } from "./interfaces/index";
import { useSelector } from "react-redux";
import { selectUser } from "./store/selectors";



type Props = {
  setCurrentNameTutor: (currentNameTutor:string) => void,
  setCurrentSurnameTutor: (currentSurnameTutor: string) => void,
  currentNameTutor: string,
  currentSurnameTutor: string,
  scrollToBlock: Function,
  refQuestionWrite: ForwardedRef<HTMLDivElement>,
  isCabinetOpened: string,
  setIsCabinetOpened: (isCabinetOpened: SetStateAction<string>) => void,
  isAllowCookies: boolean
}


const App: FunctionComponent<Props> = ({        setCurrentNameTutor, setCurrentSurnameTutor,
                                                currentNameTutor, currentSurnameTutor, scrollToBlock,
                                                refQuestionWrite, setIsCabinetOpened, isCabinetOpened,
                                                isAllowCookies 
                                              }) => {


const user = useSelector(selectUser)

  const HomePage = () => {

    const location = useLocation();
    const navigate = useNavigate();

    
    useEffect(() => {
     // const isOnDashboard = location.pathname === "/dashboard";
    
      const shouldRedirect =
        isAllowCookies &&
        (user?.email.length > 0) &&
        !location.pathname.includes("/dashboard");

        console.log(shouldRedirect);
        console.log(isAllowCookies);
        console.log(user);
    
      if (shouldRedirect) {
        console.log(shouldRedirect)
        navigate("/dashboard", { replace: true });
      }
    }, [user, isAllowCookies, location.pathname]);
    



    

    return (
    <div className="Home">
  
    <Header 
           scrollToBlock={scrollToBlock} refQuestionWrite={refQuestionWrite}   
           setIsCabinetOpened={setIsCabinetOpened} isCabinetOpened={isCabinetOpened}            
     />
 

    <Body   
            setCurrentNameTutor={setCurrentNameTutor} setCurrentSurnameTutor={setCurrentSurnameTutor} 
            currentNameTutor={currentNameTutor} currentSurnameTutor={currentSurnameTutor} 
    />
    <Footer refQuestionWrite={refQuestionWrite} />
 
 </div>
    )
  }

  
  return ( 
  
            <HomePage />

  );
}

export default React.memo(App);



