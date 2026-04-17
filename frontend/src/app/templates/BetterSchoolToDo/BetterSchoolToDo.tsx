import { Button, Input } from "@mui/material";
import React, { useState, useRef, FunctionComponent, useEffect, RefObject } from "react";
import './BetterSchoolToDo.css';
import { useLanguage } from "../../context/LanguageContext";

type Props = {
  isOfferModalOpened: boolean;
  setIsOfferModalOpened: Function;
};

const BetterSchoolToDo: FunctionComponent<Props> = ({ isOfferModalOpened, setIsOfferModalOpened }) => {
 
  const { language } = useLanguage();
 
  const ref = useRef<HTMLDivElement>(null);

  const [route, setRoute] = useState<string>("offers");
  const [offer, setOffer] = useState<string>();
  const [danke, setDanke] = useState<boolean>(false);

  function offerChange(e: { target: { value: React.SetStateAction<string | undefined> } }) {
    setOffer(e.target.value);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOfferModalOpened(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const responseFunction = async (route: string, data: string) => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";
      const URL = `${backendURL}${route}`;

      const body = JSON.stringify({ offer: data });

      const response = await fetch(URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (response && response.ok) return response;
    } catch (e) {
      console.log(e);
    }
  };

  const send = async (route: string) => {
    try {
      if (offer != null && offer !== "") {
        const response = await responseFunction(route, offer);
        if (response && response.ok) {
          setDanke(true);
        }
      }
    } catch (e: any) {
      console.log(e.message);
    }
  };

  class TranslateClass {
    static header() {
      return language === "german" ? "Dein Vorschlag" : "Твое предложение";
    }
    static inputOfferPlaceholder() {
      return language === "german" ? "Schreib hier" : "Напиши здесь";
    }
    static buttonSend() {
      return language === "german" ? "Schicken" : "Отправить";
    }
    static dankeMessage() {
      return language === "german"
        ? "Danke für Ihren Vorschlag. Wir achten darauf unbedingt"
        : "Спасибо за Ваше предложение. Мы обязательно учтем его";
    }
  }

  if (!isOfferModalOpened) return null;

  return (
    <div
      id="offerModal"
      className="flex justify-center items-center overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 h-[calc(100%-1rem)] max-h-full"
    >
      <div ref={ref} className="relative widthModal p-4 w-fit h-fit">
        <div className="offerModal relative content-center mx-auto rounded-lg shadow bg-gray-900">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-white">{TranslateClass.header()}</h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white rounded-lg text-sm w-10 h-10 ms-auto inline-flex justify-center items-center"
              onClick={() => setIsOfferModalOpened(false)}
            >
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          {danke ? (
            <p className="text-lg p-4 text-white">{TranslateClass.dankeMessage()}</p>
          ) : (
            <div className="p-4 md:p-5 space-y-4 justify-center">
              <div className="w-full min-w-72">
                <Input
                  type="text"
                  placeholder={TranslateClass.inputOfferPlaceholder()}
                  className="p-5 mx-auto fieldModal text-white"
                  style={{ color: "white" }}
                  onChange={offerChange}
                  value={offer}
                />
              </div>

              <div className="items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                <Button
                  type="button"
                  className="w-1/2 mr-5 text-white bg-green-800 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  onClick={() => send(route)}
                >
                  {TranslateClass.buttonSend()}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(BetterSchoolToDo);
