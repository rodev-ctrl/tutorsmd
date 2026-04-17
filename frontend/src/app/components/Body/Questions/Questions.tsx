"use client";
import React, { useRef, useState } from "react";
import { useEffect, FunctionComponent } from "react";
import Question from "./Question/Question";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";

import { PropsStor } from "../../../interfaces/index";
import { useLanguage } from "../../../context/LanguageContext";

type QuestionType = {
  id: number;
  question: string;
  answer: string;
};



const Questions: FunctionComponent = () => {


  const { language } = useLanguage();
  const [questionsHeaderSize, setQuestionsHeaderSize] = useState<string>("text-3xl");

  const questions = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian;
    return data?.questions || []; // Если данных нет, возвращаем пустой массив
  });
  const ref = useRef<HTMLDivElement | null>(null);





  class TranslateClass {
    static header() {
      if (language === "german") return "Populärste Fragen";
      if (language === "russian") return "Самые популярные вопросы";
    }

    static buttonAllQuestions() {
      if (language === "german") return "Alle Fragen";
      if (language === "russian") return "Все вопросы";
    }
  }

  useEffect(() => {
    if(window.innerWidth < 450) setQuestionsHeaderSize("text-2xl");
    if(window.innerWidth < 415) setQuestionsHeaderSize("text-xl");
  }, [])
  


  return (
    <div
      ref={ref}
      className="
        questions
        p-5
        mt-20
        mb-20
        mx-auto
        w-11/12
        max-w-3xl
        shadow-[0_-3px_38px_-9px_rgba(0,0,0,1)]
        rounded-2xl
      "
      style={{
        backdropFilter: "blur(6px)",
      }}
    >
      <h2 className={`${questionsHeaderSize} text-center font-bold`}>{TranslateClass.header()}</h2>

      <div className="mt-6 space-y-4">
        {questions.map((question: QuestionType) => (
          <Question
            key={question.id}
            id={question.id}
            question={question.question}
            answer={question.answer}
          />
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Link to="/PopularQuestions" className="w-1/2">
          <Button
            fullWidth
            sx={{
              borderRadius: "8px",
              backgroundColor: "orange",
              color: "white",
              padding: "5%",
              "&:hover": { backgroundColor: "#ffb84d" },
            }}
            color="warning"
          >
            {TranslateClass.buttonAllQuestions()}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default React.memo(Questions);
