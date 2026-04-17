"use client"
import React, { ForwardedRef, FunctionComponent, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import UpLinie from "../../Header/UpLinie";
import BodyPrivacyPolicy from "./BodyPrivacyPolicy";
import Footer from "../../Footer/Footer";

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
  setMessages: Function,
  }

type Message = {
  question?: string;
  answer?: string;
  language: string;
  files?: Array<{ name: string; type: string; data: number[] }>;
  ts?: number;
};

  


const PrivacyPolicy:FunctionComponent<Props> = ({ isCabinetOpened, setIsCabinetOpened, /*icon={icon}*/  isLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, setIsLoginedClientCabinetOpened, scrollToBlock, refQuestionWrite, messages, setMessages }) => {
  
  
return(
    <div>
      <UpLinie scrollToBlock={scrollToBlock} 
                 refQuestionWrite={refQuestionWrite} 
                 setIsCabinetOpened={setIsCabinetOpened} 
                 isCabinetOpened={isCabinetOpened}  
         />
     <BodyPrivacyPolicy />

    <Footer refQuestionWrite={refQuestionWrite}   
        />
          
    </div>
    )
   
  }

  export default React.memo(PrivacyPolicy);
