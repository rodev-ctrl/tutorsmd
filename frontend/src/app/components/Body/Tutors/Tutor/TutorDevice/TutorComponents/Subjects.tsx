import { useLanguage } from "../../../../../../context/LanguageContext";
import React from "react";

type Subjects = {
  availableSubjects: { [key: string]: string[] }; 
};

function Subjects({ availableSubjects }: Subjects) {

  const { language, setLanguage } = useLanguage();
  class TranslateClass {
    static subject() {
      if (language === "german") return "Fächer";
      if (language === "russian") return "Предметы";
      return "Subjects";
    }
  }
  

  const renderSubjects = () => {
    console.log(availableSubjects);
    console.log(language);
    let part = language.slice(0, 2);

    if(part == "ge") part = "de"
    
    const subjectsForLanguage = availableSubjects[part] || []; 
    console.log(subjectsForLanguage);
    return subjectsForLanguage.map((subject, i) => {
      const isLast = i === subjectsForLanguage.length - 1;
      console.log(subject);
      return (
        <span key={i} className="text-blue-500">
          <span className="bg-yellow-400 shadow-md p-1">{subject}</span>
          {!isLast && ", "}
        </span>
      );
    });
  };

  return (
    <div className="tags my-auto" style={{ maxWidth: "100%" }}>
      <pre style={{ maxWidth: "100%" }}>
        {TranslateClass.subject()}: {renderSubjects()}
      </pre>
    </div>
  );
}

export default React.memo(Subjects);
