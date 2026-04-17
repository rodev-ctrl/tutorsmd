import React, { FunctionComponent, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import Cabinet from "../Cabinet";
import Language from "../../../templates/Language/Language";

import "../../../templates/LoginedCabinet/LoginedCabinet.css";
import "./styles/Menu.css";
import { MenuItem, Client, Tutor } from "../../../interfaces/index";

type Props = {
  sizeText: string,
  setSizeText: Function,
  menu: MenuItem[],
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

const DekstopMenu: FunctionComponent<Props> = ({ sizeText, setSizeText, menu, openModal, isCabinetOpened, setIsCabinetOpened, icon, openLoginedPersonCabinet, isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened, isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened, scrollToBlock, user }) => {
  
  useEffect(() => {
    if (window.innerWidth > 700 && window.innerWidth <= 900) {
      setSizeText("text-md");
    } else if (window.innerWidth <= 700) {
      setSizeText("text-sm");
    } else {
      setSizeText("text-xl");
    }
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
  



  // Создаем useRef как объект, чтобы сохранять ссылки на элементы
  const refs = useRef<{ [key: string]: HTMLElement | null }>({});

  let length = menu.length + 1;

  return (
    <div className="menu grid gap-6 w-full relative" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {menu.map((item, i) => {
        if (item.name === "Язык" || item.name === "Sprache") {
          return (
            <div key={`lang-${i}`}>
              <Language />
            </div>
          );
        } else {
          return (
            <Link 
              key={item.href} 
              to={`${process.env.REACT_APP_CLIENT_URL}${item.href}`}
              onClick={() => window.history.pushState({}, "", `${process.env.REACT_APP_CLIENT_URL}${item.href}`)}
              className="py-2">
              <div
                ref={(el) => (refs.current[item.href] = el)} // Присваиваем ссылку
                style={{padding: "8px"}}
                onClick={() => {
                  //console.log(refs.current); // Проверяем содержимое refs.current
                  //console.log(refs.current[item.href]); // Проверяем конкретный элемент
                  
                    scrollToBlock({ current: refs.current[item.href] });
                  
                }}
                className="menuItem my-4"
              >
                <p className={`${sizeText} text-center hover:cursor-pointer hover:border-b-4 hover:border-red-500 duration-300 font-bold py-auto my-auto`}>{item.name}</p>
              </div>
            </Link>
          );
        }
      })}

      <div className="col-span-1 justify-self-center">
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
  );
};

export default React.memo(DekstopMenu);
