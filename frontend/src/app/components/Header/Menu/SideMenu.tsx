"use client";
import { FunctionComponent, Key, useRef } from "react";
import {Link} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import React from "react";

import "./styles/sideMenu.css";
import Language from "../../../templates/Language/Language";
import { MenuItem } from "../../../interfaces/index";




type Props = {
    showSideMenu: string,
    setShowSideMenu: Function,
    scrollToBlock: Function,
    menu: MenuItem[]
  }


const SideMenu: FunctionComponent<Props> = ({showSideMenu, setShowSideMenu, scrollToBlock, menu}) => {

  // Создаем массив ссылок для всех элементов меню
  const refs = useRef<(HTMLElement | null)[]>([]);
 


  return (
  
    <div id="SideMenu" aria-hidden="true" className={`${showSideMenu} justify-self-start fixed justify-center items-center`} style={{zIndex: 90000000000000}}>
    <div className="relative w-full h-full">
      
        


    <div style={{position: "relative", zIndex: 90}} className={`sideMenu grid grid-cols-4 opacity-1 h-screen bg-black text-white ${showSideMenu}`} >
     
          <div className="col-span-3 mt-5 pl-5 pr-5">
             {menu.map(function(item:MenuItem, i:number) {
              if(item.name == "Язык" || item.name == "Sprache") {
                               return <div key={menu.length-1} className="mt-2"><Language /></div>
                    
                          } else {
                              return (
                                <div key={i} onClick={() => {scrollToBlock({ current: refs.current[i] }); setShowSideMenu("hidden")}} className="text-2xl pt-5 pb-5"><Link to={`${process.env.REACT_APP_CLIENT_URL}${menu[i].href}`}>{item.name}</Link></div>
                              )       
                            }      
              
})}
          </div>

          <div className="col-span-1 justify-self-end mt-5 mr-5 ml-5 mr-5" onClick={() => setShowSideMenu("hidden")}>
          <svg className="w-8 h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
          </div>
      
         
    </div>
    


    </div>
    </div>
    
  );
}



export default React.memo(SideMenu);