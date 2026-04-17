"use client";

import React, { FunctionComponent, ForwardedRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Language from "../../templates/Language/Language";
import QuestionWrite from "../../templates/QuestionWrite/QuestionWrite";

import "./styles/Footer.css";

import { MenuItem } from "../../interfaces";
import { selectUser } from "../../store/selectors";
import { useLanguage } from "../../context/LanguageContext";

type Props = {
  refQuestionWrite: ForwardedRef<HTMLDivElement>;
};

const Footer: FunctionComponent<Props> = ({
  refQuestionWrite,
}) => {
  const  { language } = useLanguage();
  const menu = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian
    return data?.menu || []; // Если данных нет, возвращаем пустой массив
  });
  const user = useSelector(selectUser);
  const [grid, setGrid] = useState<string>("");

  

  const t = {
    about: language === "german" ? "Über uns" : "О нас",
    privacy:
      language === "german" ? "Vertraulichkeitspolitik" : "Политика конфиденциальности",
    help: language === "german" ? "Hilfe" : "Помощь",
    ask: language === "german" ? "Frage zu stellen" : "Задать вопрос",
    faq: "FAQ",
  };

  const isAuthed =
    (user?.email?.length > 0)

  useEffect(() => {
    if(window.innerWidth > 820) setGrid("grid-cols-4");
    if(window.innerWidth > 400 && window.innerWidth <= 820) setGrid("grid-cols-2");
    if(window.innerWidth <= 400) setGrid("grid-cols-1");
  }, [])

  useEffect(() => {
    if(refQuestionWrite) {
      if("current" in refQuestionWrite) {
        console.log(refQuestionWrite.current);
        if(refQuestionWrite.current) console.log(refQuestionWrite.current.style.display)
      }
    }

  }, [])



  return (
    <footer className="footer-bg text-gray-900 p-10 text-center">
      <div
        className={`
          container mx-auto
          grid gap-6
          ${grid}
          px-4 py-6 sm:py-8 lg:py-10
          text-base sm:text-lg
        `}
      >
        {/* 1. Языки */}
        <div>
          <h3 className="footer-title mb-3 px-auto">{language === "german" ? "Sprache" : "Язык"}</h3>
          <Language />
        </div>

        {/* 2. Меню из стора (без пункта "Язык"/"Sprache") */}
        <nav aria-label="Footer navigation" className="px-auto">
          <h3 className="footer-title mb-3">{language === "german" ? "Menü" : "Меню"}</h3>
          <ul className="space-y-2">
            {menu
              .filter((i: MenuItem) => i.name !== "Язык" && i.name !== "Sprache")
              .map((item: MenuItem) => (
                <li key={item.href}>
                  <Link
                    className="footer-link"
                    to={`${process.env.REACT_APP_CLIENT_URL}${item.href}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        {/* 3. О нас / Политика */}
        <div>
          <h3 className="footer-title mb-3 px-auto">{t.about}</h3>
          <ul className="space-y-2 px-auto">
            <li>
              <Link className="footer-link px-auto" to="/AboutUs">
                {t.about}
              </Link>
            </li>
            <li>
              <Link className="footer-link px-auto" to="/PrivacyPolicy">
                {t.privacy}
              </Link>
            </li>
          </ul>
        </div>

        {/* 4. Помощь */}
        <div className="px-auto">
          <h3 className="footer-title mb-3">{t.help}</h3>
          <ul className="space-y-2">
            <li>
              <button
                className="footer-link text-left"
                onClick={() => {
                  if (
                    refQuestionWrite &&
                    typeof refQuestionWrite !== "function" &&
                    refQuestionWrite.current
                  ) {
                    refQuestionWrite.current.style.display = "block";
                  }
                }}
              >
                {t.ask}
              </button>
            </li>
            <li>
              <Link className="footer-link" to="/PopularQuestions">
                {t.faq}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Форма вопроса — только для авторизованных */}
      {isAuthed ? (
        <div className="container mx-auto px-4 pb-8">
          <QuestionWrite refQuestionWrite={refQuestionWrite} />
        </div>
      ) : null}
    </footer>
  );
};

export default React.memo(Footer);
