"use client";
import React, { ForwardedRef } from "react";
import { useState, FunctionComponent, useEffect } from "react";

const LoginedClientCabinet = React.lazy(() => import("./LoginedClientCabinet"));
const LoginedTutorCabinet = React.lazy(() => import("./LoginedTutorCabinet"));
import AuthService from "../../../app/services/AuthServices";
import { useSelector } from "react-redux";
import { useLanguage } from "../../context/LanguageContext";
import { selectRole, selectUser } from "../../store/selectors";
import { MenuItem } from "../../interfaces/index";



type Props = {
    isLoginedClientCabinetOpened: string,
    setIsLoginedClientCabinetOpened: Function,
    isLoginedTutorCabinetOpened: string,
    setIsLoginedTutorCabinetOpened: Function,
    isOfferModalOpened: boolean,
    setIsOfferModalOpened: Function,
    refQuestionWrite: ForwardedRef<HTMLDivElement>
}



const LoginedPersonCabinet: FunctionComponent<Props>= ({isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, isOfferModalOpened, setIsOfferModalOpened, refQuestionWrite}) => {

  const [className, setClassName] = useState<string>("");
  const [boxShadow, setBoxShadow] = useState<string>("");
  

  const { language } = useLanguage();
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);

  const data = useSelector((state: any) =>
    language === "german" ? state.german : state.russian
  );
  
 
  const menu: MenuItem[] = React.useMemo(() => {
    console.log(language);
    switch (role) {
      case "client": return data?.menuClient || [];
      case "tutor": return data?.menuTutor || [];
      case "admin": return data?.menuAdmin || [];
      default: return data?.menu || [];
    }
  }, [data, user]);
  
  
  async function logout(route:string, role:string) {
  
try{
  const response = await AuthService.logout(role);
  
    localStorage.setItem("role", "gast");
  
await AuthService.setGastCookie();
location.reload();
return response;
} catch(e) {
  console.log(e);
}

  
  }



  function greetingsForm() {
    if(language == "german") return "Hallo ";
    if(language == "russian") return "Привет ";
  }

  
  function offerModalOpen(isOfferModalOpened:boolean) {
    (isOfferModalOpened) ? setIsOfferModalOpened(false) : setIsOfferModalOpened(true);
  }


  useEffect(() => {
      if(isLoginedClientCabinetOpened !== "hidden" || isLoginedTutorCabinetOpened !== "hidden") {
        setBoxShadow("0 0 2rem rgba(0, 0, 0, 0.075), 0rem 1rem 1rem -1rem rgba(0, 0, 0, 0.1)")  
      } else {
        setBoxShadow("");
      }
  }, [isLoginedClientCabinetOpened, isLoginedTutorCabinetOpened])
 

  useEffect(() => {
    (isLoginedClientCabinetOpened !== "hidden" || isLoginedTutorCabinetOpened !== "hidden") ? setClassName("absolute") : setClassName("hidden");
  }, [isLoginedClientCabinetOpened, isLoginedTutorCabinetOpened]);

  

 
    
  return (
     
            <div className={`
loginedCabinet bg-white ${className} p-4 z-50 w-60 h-fit overflow-y-auto overflow-x-hidden 
                           `} 
                           style={{"marginRight": "0.35rem", position: "absolute", top: "90px", right: "1%",
                            boxShadow: boxShadow,
                            borderRadius: "30px"
                           }}
                           >
                            
                     
                    {(isLoginedClientCabinetOpened != "hidden") ? <LoginedClientCabinet logout={logout} menu={menu} greetingsForm={greetingsForm} isOfferModalOpened={isOfferModalOpened} offerModalOpen={offerModalOpen} refQuestionWrite={refQuestionWrite} /> : null}
                    {(isLoginedTutorCabinetOpened != "hidden") ? <LoginedTutorCabinet logout={logout} menu={menu} greetingsForm={greetingsForm} isOfferModalOpened={isOfferModalOpened} offerModalOpen={offerModalOpen} refQuestionWrite={refQuestionWrite} /> : null}
            </div>
         )  
    
  
}



export default React.memo(LoginedPersonCabinet);