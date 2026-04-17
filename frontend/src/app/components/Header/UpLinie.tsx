"use client";
import React, { useState, FunctionComponent, SetStateAction, useEffect, ForwardedRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

const icon = require("../../../assets/img/icon.png");
import BetterSchoolToDo from "../../templates/BetterSchoolToDo/BetterSchoolToDo";
import Modal from "../../templates/Modal/Modal";
import LoginPersonCabinet from "../../templates/LoginedCabinet/LoginedPersonCabinet";
import { Client, Tutor, PropsStor } from "../../interfaces/index";


import Menu from "./Menu/Menu";
import SideMenu from "./Menu/SideMenu";
import { useLanguage } from "../../context/LanguageContext";
import { selectRole, selectUser } from "../../store/selectors";

type Props = {
    
    scrollToBlock: Function,
    refQuestionWrite: ForwardedRef<HTMLDivElement>,
    setIsCabinetOpened: (isCabinetOpened: string) => void, 
    isCabinetOpened: string
  }





 
 
  const EMPTY_ARRAY: any[] = [];

const UpLinie: FunctionComponent<Props> = ({scrollToBlock, refQuestionWrite, isCabinetOpened, setIsCabinetOpened}) => {

  const dispatch = useDispatch();
  const {language} = useLanguage();

  const menu = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian
    return data?.menu || EMPTY_ARRAY; // Если данных нет, возвращаем пустой массив
  });
  // Было data?.clientMenu, стало data?.menuClient
  const clientMenu = useSelector((state: any) => {
    const data = language === "german" ? state.german : state.russian
    return data?.menuClient || EMPTY_ARRAY; 
  });

  // Было data?.menu, стало data?.menuTutor для tutorMenu
  const tutorMenu = useSelector((state: any) => {
    const data = language === "german" ? state.german : state.russian
    return data?.menuTutor || EMPTY_ARRAY; 
  });
  // let user = useSelector((stor:PropsStor) => stor.user);
  // let language = useSelector((stor:PropsStor) => stor.language);
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
 
  
  const [showSideMenu, setShowSideMenu] = useState<string>('hidden');
  const [opacityPage, setOpacityPage] = useState<string>("100");
 
  const [isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened] = useState<string>('hidden');
  const [isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened] = useState<string>('hidden');

  const [isLogined, setIsLogined] = useState<boolean>(true);
  const [isOfferModalOpened, setIsOfferModalOpened] = useState<boolean>(false);
  

  function openModal(v:String, setV:Function) {
    console.log("click");
      (v == 'hidden') ? setV('block') : setV('hidden');
  }

  function openLoginedPersonCabinet(v:String, setV:Function) {
    (v == 'hidden') ? setV('block') : setV('hidden');
  }


    // Единый выбор актуального меню
    const currentMenu = useMemo(() => {
      let current;
      if (role === "client") {
        current = clientMenu
      } else if (role === "tutor") { 
        current = tutorMenu; 
      } else {
        current = menu;
      }
console.log(current);
console.log(role);
console.log(language);
      return current;
      
    // важно включить зависимости, влияющие на смену языка/роли
    }, [
      language,
      menu, clientMenu, tutorMenu,
      user
    ]);

    


  

  return (

    <div className="text-center w-full min-h-[170px] relative">

    <SideMenu 
       showSideMenu={showSideMenu} setShowSideMenu={setShowSideMenu} 
       scrollToBlock={scrollToBlock} 
       menu={currentMenu} />
  
    <Menu
          menu={currentMenu}
          openModal={openModal}
          isCabinetOpened={isCabinetOpened} setIsCabinetOpened={setIsCabinetOpened}
          isLoginedClientCabinetOpened={isLoginedClientCabinetOpened} setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
          isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened} setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
          icon={icon}
          openLoginedPersonCabinet={openLoginedPersonCabinet}
          showSideMenu={showSideMenu} setShowSideMenu={setShowSideMenu} 
          setOpacityPage={setOpacityPage} scrollToBlock={scrollToBlock} />
   
    <BetterSchoolToDo 
          isOfferModalOpened={isOfferModalOpened} setIsOfferModalOpened={setIsOfferModalOpened} />
       
      
  {isCabinetOpened !== "hidden" &&
 
  <Modal isCabinetOpened={isCabinetOpened} setIsCabinetOpened={setIsCabinetOpened} />
}
        
               
    {(user && user?.email.length > 0) ? (
      <LoginPersonCabinet 
              isLoginedClientCabinetOpened={isLoginedClientCabinetOpened} setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
              isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened} setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
              isOfferModalOpened={isOfferModalOpened} setIsOfferModalOpened={setIsOfferModalOpened}
              refQuestionWrite={refQuestionWrite} />
    )
        
              : null

              }
    </div>
  );
}



export default React.memo(UpLinie);