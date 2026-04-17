"use client";
import React, { ForwardedRef, useEffect } from "react";
import { FunctionComponent } from "react";
import { Button } from "@mui/material";

import "./LoginedCabinet.css";
import { Link } from "react-router-dom";
import Language from "../Language/Language";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/selectors";
import { useLanguage } from "../../context/LanguageContext";
import { MenuItem } from "../../interfaces/index";


type Props = {
  logout: Function,
  menu: MenuItem[],
  greetingsForm: Function,
  isOfferModalOpened: boolean,
  offerModalOpen: Function,
  refQuestionWrite: ForwardedRef<HTMLDivElement>
}

const LoginedTutorCabinet: FunctionComponent<Props> = ({logout, menu, greetingsForm, isOfferModalOpened, offerModalOpen, refQuestionWrite}) => {


  const user = useSelector(selectUser);
  const { language } = useLanguage();

    const { name, namegerman } = user;
    


    const getTutorDisplayName = () => {
      if (!name) return "";
      return language === "german" ? namegerman : name;
    };
    
    

    return (
      <div>
        
        <h2 className="text-xl">{greetingsForm()} <span className="font-bold">{getTutorDisplayName()}</span></h2>
        <div>
        {menu.map((item) => {
  const key = item.name;

  if (item.name === "Улучшить нашу школу" || item.name === "Verbesserung unserer Schule") {
    return (
      <span key={key} onClick={() => offerModalOpen(isOfferModalOpened)} className="py-2 my-2 hover:text-orange-400 item">
        <p className="cursor-pointer">{item.name}</p>
        <div className="borderAnimated h-2"></div>
      </span>
    );
  }

  if (item.name === "Написать в поддержку" || item.name === "Schreiben zum Support") {
    return (
      <span key={key} onClick={() => {
        if (refQuestionWrite && "current" in refQuestionWrite && refQuestionWrite.current) {
          refQuestionWrite.current.style.position = "sticky";
          refQuestionWrite.current.style.display = "block";
        }
      }} className="py-2 my-2 hover:text-orange-400 item">
        <p className="cursor-pointer">{item.name}</p>
        <div className="borderAnimated h-2"></div>
      </span>
    );
  }

  return (
    <Link to={item.href} key={key}>
      <span className="py-2 my-2 hover:text-orange-400 item">
        <p className="cursor-pointer">{item.name}</p>
        <div className="borderAnimated h-2"></div>
      </span>
    </Link>
  );
})}

        </div>
        <Button
          className="text-center text-white bg-red-700 p-2 w-full mt-4 rounded-md"
          color="warning"
          onClick={() => logout()}
        >
          <Link to="/">Выйти</Link>
        </Button>
      </div>
                     
           )  
}



export default React.memo(LoginedTutorCabinet);