import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import Cabinet from "../Cabinet";
import SideMenuButton from "../SideMenuButton";

import "../../../templates/LoginedCabinet/LoginedCabinet.css";
import "./styles/Menu.css";
import { selectUser } from "../../../store/selectors";
import { useLanguage } from "../../../context/LanguageContext";

import { MenuItem, Client, Tutor } from "../../../interfaces/index";

  type Props = {
    menu: MenuItem[],
    showSideMenu: string,
    setShowSideMenu: Function,
    setOpacityPage: Function,
    openModal: Function,
    isCabinetOpened: string,
    setIsCabinetOpened: (isCabinetOpened: string) => void,
    icon: string,
    openLoginedPersonCabinet: Function,
    isLoginedClientCabinetOpened: string, 
    setIsLoginedClientCabinetOpened: Function,
    isLoginedTutorCabinetOpened: string, 
    setIsLoginedTutorCabinetOpened: Function,
    scrollToBlock: Function,
    user: Client | Tutor
  }


const MobileMenu:FunctionComponent<Props> = ({menu, showSideMenu, setShowSideMenu, setOpacityPage, openModal, isCabinetOpened, setIsCabinetOpened, icon, openLoginedPersonCabinet, isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, scrollToBlock, user}) => {
 

    // Создаем массив ссылок для всех элементов меню
    const refs = useRef<{ [key: string]: HTMLElement | null }>({});
    const [sizeShortMenu, setSizeShortMenu] = useState<string>("");
    const [sizeShortMenuStyle, setSizeShortMenuStyle] = useState<string>("100%");


    const { language } = useLanguage();

    useEffect(() => {
      console.log(user);
    }, []);

    useEffect(() => {
      const activePath = location.pathname;
    
      // Сбрасываем класс у всех элементов
      Object.values(refs.current).forEach((el) => {
        el?.classList.remove("activeLink");
      });
    
      // Ставим класс активной ссылке
      if (refs.current[activePath]) {
        refs.current[activePath].classList.add("activeLink");
      }
    }, [location.pathname]);
    

      // Показываем только **первый** элемент из меню
  const firstItem = menu[0];
  const secondItem = menu[1];
  if (!firstItem || !secondItem) return null; // Если меню пустое, ничего не отображаем


useEffect(() => {
   if(language == "german") setSizeShortMenu("text-2xl")
   if(language == "russian") setSizeShortMenu("text-lg");
   if(user && user?.email.length > 0) {
     setSizeShortMenu("text-md");
     setSizeShortMenuStyle("90%");
   }
}, [language]);


  return ( 
      <div className="w-full menu p-2 relative">
  
  
     <div className="grid grid-cols-4 gap-2 w-full">
        <div className="col-span-1 justify-self-start hover:bg-gray-300 duration-300 rounded-lg" style={{height: "71px"}}>
           <SideMenuButton showSideMenu={showSideMenu} setShowSideMenu={setShowSideMenu} setOpacityPage={setOpacityPage} />
        </div>
  
<div 
   style={{marginLeft: "20%"}}
   className={`shortMenu flex col-span-2 justify-center items-center gap-8 ${sizeShortMenu}`}>
  { [firstItem, secondItem].map((item, index) => (
    <Link
      key={item.href}
      to={`${process.env.REACT_APP_CLIENT_URL}${item.href}`}
      ref={(el) => (refs.current[item.href] = el)}
      onClick={() => {
        scrollToBlock({ current: refs.current[item.href] });
        window.history.pushState({}, "", `${process.env.REACT_APP_CLIENT_URL}${item.href}`)
      } 
      }
      
      style={{marginRight: "0%", marginLeft: "0%", color: "black", backgroundColor: index === 0 ? "#F3F4F6" : "#F97316" }}
      className="menuItem px-6 py-2"
    >
      <p 
        className="text-center font-bold hover:cursor-pointer hover:border-b-4 hover:border-red-500 duration-300"
        style={{fontSize: sizeShortMenuStyle}}>
        {item.name}
      </p>
    </Link>
  ))}
</div>

         
        <div className="col-span-1 flex justify-center items-center">
          <Cabinet
          openModal={openModal}
          isCabinetOpened={isCabinetOpened}
          setIsCabinetOpened={setIsCabinetOpened}
          icon={icon}
          openLoginedPersonCabinet={openLoginedPersonCabinet}
          isLoginedClientCabinetOpened={isLoginedClientCabinetOpened}
          setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
          isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened}
          setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
          user={user}
        />
           
        </div>    
     </div>
    
      
      </div>
      
      )
  }

  export default React.memo(MobileMenu);