"use client"
import React, { ForwardedRef, FunctionComponent, useEffect } from "react";
import UpLinie from "../../Header/UpLinie";
import BodyAboutUs from "./BodyAboutUs";
import Footer from "../../Footer/Footer";

import { Message } from "../../../interfaces/index";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/selectors";

type Props = {
    isCabinetOpened: string,
    setIsCabinetOpened: (isCabinetOpened: string) => void,
    isLoginedClientCabinetOpened: string, 
    setIsLoginedClientCabinetOpened: Function,
    isLoginedTutorCabinetOpened: string, 
    setIsLoginedTutorCabinetOpened: Function,
    scrollToBlock: Function,
    refQuestionWrite: ForwardedRef<HTMLDivElement>,
    messages: Message[],
    setMessages: Function
  }



const AboutUs:FunctionComponent<Props> = ({ isCabinetOpened, setIsCabinetOpened, isLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, setIsLoginedClientCabinetOpened, scrollToBlock, refQuestionWrite, messages, setMessages }) => {
  

return(
    <div style={{
                 backgroundColor: "white",
                 backgroundImage: "radial-gradient(circle, rgba(243, 134, 17, 0.1) 3px, transparent 1px)",
                 backgroundSize: "20px 20px" 
               }}
    >
       <UpLinie scrollToBlock={scrollToBlock} 
                  refQuestionWrite={refQuestionWrite} 
                  setIsCabinetOpened={setIsCabinetOpened} 
                  isCabinetOpened={isCabinetOpened}  
          />

     <BodyAboutUs />
         <Footer refQuestionWrite={refQuestionWrite}   />
          
    </div>
    )
   
  }

  export default React.memo(AboutUs);


