"use client"
import React, { FunctionComponent } from "react";
import { useDispatch, useSelector } from "react-redux";
import Question from "../../Body/Questions/Question/Question";
import { useLanguage } from "../../../context/LanguageContext";


  type QuestionType = {
    id: number,
    question: string,
    answer: string
}


  type Store = {
    questions: Array<QuestionType>
  }
  


const BodyAlleQuestions:FunctionComponent = () => {

  const dispatch = useDispatch();
  const { language } = useLanguage();
  const questions = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian
    return data?.questions || []; // Если данных нет, возвращаем пустой массив
  });
  


  class TranslateClass {
    static header() {
        if(language == "german") return "Alle Fragen"
        if(language == "russian") return "Все вопросы"
    }
  }
  
return(
    <div className="privacyPolicy text-center" style={{marginBottom: "8%"}}>
           <h1 className="text-3xl">{TranslateClass.header()}</h1><br/>
                {
                  questions.map((question:QuestionType) => <Question key={question.id} id={question.id} question={question.question} answer={question.answer} />)
                }
    </div>
    )
   
  }

  export default React.memo(BodyAlleQuestions);