"use client"
import React, { ForwardedRef, FunctionComponent, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import UpLinie from "../../Header/UpLinie";
import BodyPopularQuestions from "./BodyAlleQuestions";
import Footer from "../../Footer/Footer";

import { Message } from "../../../interfaces/index";

type Props = {
    isCabinetOpened: string,
    setIsCabinetOpened: (isCabinetOpened: string) => void,
    isLoginedClientCabinetOpened: string, 
    setIsLoginedClientCabinetOpened: Function,
    isLoginedTutorCabinetOpened: string, 
    setIsLoginedTutorCabinetOpened: Function,
    scrollToBlock: Function,
    messages: Message[],
    setMessages: Function,
    refQuestionWrite: ForwardedRef<HTMLDivElement>
  }



const AlleQuestions:FunctionComponent<Props> = ({ isCabinetOpened, setIsCabinetOpened, /*icon={icon}*/  isLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, setIsLoginedClientCabinetOpened,  scrollToBlock, messages, setMessages, refQuestionWrite }) => {


return(
    <div style={{
      backgroundColor: "white",
      backgroundImage: "radial-gradient(circle, rgba(243, 134, 17, 0.1) 3px, transparent 1px)",
      backgroundSize: "20px 20px" 
    }}>
      <UpLinie scrollToBlock={scrollToBlock}
   refQuestionWrite={refQuestionWrite} setIsCabinetOpened={setIsCabinetOpened} isCabinetOpened={isCabinetOpened} />

     <BodyPopularQuestions />

         <Footer
                    refQuestionWrite={refQuestionWrite}   
             />
          
    </div>
    )
   
  }

  export default React.memo(AlleQuestions);
