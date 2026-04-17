"use client"
import { useLanguage } from "../../../context/LanguageContext";
import React, { FunctionComponent } from "react";


const BodyAboutUs:FunctionComponent = () => {

    const { language } = useLanguage();
class TranslateClass {
    static greeting() {
        if(language == "german") return "Hallo"
        if(language == "russian") return "Привет"
    }
    static content() {
        if(language == "german") return `Warum sollten Sie uns für Deutsch- und Mathematikunterricht wählen?

Unsere Lehrer verfügen über zwei Jahre Erfahrung im Unterrichten von Deutsch und Mathematik und helfen Ihnen dabei, hervorragende Ergebnisse zu erzielen, unabhängig von Ihrem Vorbereitungsniveau. Wir wissen, dass jeder Schüler einzigartig ist. Deshalb entwickeln wir personalisierte Programme, die Ihren Zielen und Bedürfnissen entsprechen.

Deutsch: Unsere Lehrer vermitteln Ihnen ein tiefes Verständnis der Sprache, von den Grundlagen bis zum professionellen Niveau. Wir verwenden moderne Lehrmethoden, einschließlich Konversationspraxis, Grammatikübungen und landeskundlichen Aspekten, um den Lernprozess nicht nur effektiv, sondern auch unterhaltsam zu gestalten.

Mathematik: Wir unterstützen dich beim Erlernen aller wichtigen Themen vom Grundverständnis bis hin zu komplexen Fragestellungen. Lehrkräfte mit zweijähriger Erfahrung verstehen es, komplexe Theorien einfach zu erklären und bieten darüber hinaus praktische Aufgaben an, die das erworbene Wissen festigen und Ihnen helfen, eventuelle Probleme sicher zu lösen.

Wir möchten sicherstellen, dass das Lernen nicht nur produktiv, sondern auch angenehm ist. Wenn Sie mit uns zusammenarbeiten, erhalten Sie bei jedem Schritt Unterstützung und Vertrauen in Ihren Erfolg!`
        if(language == "russian") return `Почему стоит выбрать нас для обучения немецкому языку и математике?

Наши преподаватели с двухлетним опытом в обучении немецкому языку и математике помогут вам достичь отличных результатов, независимо от вашего уровня подготовки. Мы понимаем, что каждый ученик уникален, и поэтому разрабатываем персонализированные программы, учитывающие ваши цели и потребности.

Немецкий язык: Наши преподаватели обеспечат глубокое понимание языка, начиная от основ и заканчивая профессиональным уровнем. Мы используем современные методы обучения, включая разговорные практики, грамматические упражнения и изучение культурных аспектов, чтобы сделать процесс изучения не только эффективным, но и увлекательным.

Математика: Мы поможем вам освоить все важнейшие темы — от базовых понятий до сложных задач. Преподаватели с двухлетним опытом знают, как объяснить сложные теории простыми словами, а также предложат практические задания, которые закрепят полученные знания и помогут вам уверенно решать любые задачи.

Мы стремимся к тому, чтобы обучение было не только продуктивным, но и комфортным. Работая с нами, вы получите поддержку на каждом шаге и уверенность в своем успехе!`
    }
}
  
return(
    <div className="text-center text-xl" style={{marginLeft: "10%", marginRight: "10%", lineHeight: "40px"}}>
        
        <h1 className="text-3xl font-bold">{TranslateClass.greeting()}</h1>
        <p className="m-2">{TranslateClass.content()}</p>
          
    </div>
    )
   
  }

  export default React.memo(BodyAboutUs);