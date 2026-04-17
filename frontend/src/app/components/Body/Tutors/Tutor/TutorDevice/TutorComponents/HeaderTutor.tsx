const Star = require("../../../../../../../assets/img/Star.png");
const HeartEmpty = require("../../../../../../../assets/img/HeartEmpty.png");
const HeartFull = require("../../../../../../../assets/img/HeartFull.png");
import React, { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";


import { useLanguage } from "../../../../../../context/LanguageContext";

type HeaderTutorProps = {
  grade: number,
  count: number,
  id: number
}



function HeaderTutor({grade, count, id}: HeaderTutorProps) {

  const { language } = useLanguage();
  const likedTutors = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian;
    return data?.likedTutors || []; // Если данных нет, возвращаем пустой массив
  });
    const dispatch = useDispatch();

    const [isLiked, setIsLiked] = useState<Boolean>(false);
    

    class TranslateClass {
        
        static reviewsNumber() {
            if(count == 0) {
              if(language == "russian") return `${count} Отзывов`
            }

            if(count == 1) {
                if(language == "german") return `${count} Bewertung`
                if(language == "russian") return `${count} Отзыв`
              }
            
              if(count >= 2 && count <= 4) {
                if(language == "russian") return `${count} Отзыва`
              }
              if(count >= 5) {
                if(language == "russian") return `${count} Отзывов`
              }
           if(language == "german") return `${count} Bewertungen`
        }
    }

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        dispatch({ type: "TOGGLE_LIKE", payload: id });
    };

      useEffect(() => {
        const likedTutorsLocal = localStorage.getItem("likedTutors");
    
        if(likedTutorsLocal && likedTutorsLocal.includes(String(id))) setIsLiked(true);
        if(likedTutorsLocal && !likedTutorsLocal.includes(String(id))) setIsLiked(false);
    }, [likedTutors])
      
  

    
    return (
        <div className="headerTutor grid grid-cols-5 pb-2 border-b-2 text-xl">
        <div className="grade my-auto col-span-4 grid grid-cols-3">
          <div className="grid grid-cols-2 col-span-1">
            <div className="justify-self-end my-auto">
              <img src={Star} width={20} height={20} alt="Grade" />
            </div>
            <div className="justify-self-start ml-1 my-auto text-center">
              <p>{grade}</p>
            </div>
          </div>
          <div className="reviews col-span-2 justify-self-start my-auto">
            <p className="text-sky-600 underline hover:text-sky-800 duration-300">
              {TranslateClass.reviewsNumber()}
            </p>
          </div>
        </div>
  
        <div
          className="like justify-self-end col-span-1 border-1 border-slate-400 hover:bg-gray-200 duration-300"
          style={{ width: "60px", height: "55px", borderRadius: "20px" }}
        >
          <img
            src={isLiked ? HeartFull : HeartEmpty}
            width={55.575}
            height={51.2}
            alt="Like"
            style={{
              objectFit: "cover",
              position: "relative",
              marginTop: "3px",
            }}
            onClick={handleLike} // ✅ Теперь лайк/дизлайк работает через Redux
            className="mx-auto"
          />
        </div>
      </div>
            )
}


export default React.memo(HeaderTutor);