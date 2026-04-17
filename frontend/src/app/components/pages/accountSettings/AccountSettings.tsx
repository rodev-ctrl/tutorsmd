"use client"
import React, { ForwardedRef, FunctionComponent, useEffect } from "react";

import UpLinie from "../../Header/UpLinie";
import BodyAccountSettings from "./BodyAccountSettings";
import Footer from "../../Footer/Footer";

import { Message } from "@/app/interfaces/index";
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



const AccountSettings:FunctionComponent<Props> = ({isCabinetOpened, setIsCabinetOpened, /*icon={icon}*/  isLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, setIsLoginedClientCabinetOpened, scrollToBlock, messages, setMessages, refQuestionWrite }) => {

  
return(
    <div>
         <UpLinie scrollToBlock={scrollToBlock} 
                 refQuestionWrite={refQuestionWrite} 
                 setIsCabinetOpened={setIsCabinetOpened} 
                 isCabinetOpened={isCabinetOpened}  
         />

         <BodyAccountSettings />

         <Footer refQuestionWrite={refQuestionWrite}  />
          
    </div>
    )
   
  }

  export default React.memo(AccountSettings);
