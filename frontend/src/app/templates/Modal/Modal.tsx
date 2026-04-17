/*
"use client";

import React, { useState, useRef, FunctionComponent, useEffect, useMemo, useCallback, Ref, RefObject } from "react";


import './Modal.css';
import HidePassword from "../../../assets/img/hidePassword.jpg";
import ShowPassword from "../../../assets/img/showPassword.png";
import { useDispatch, useSelector } from "react-redux";
import { setAccessToken as setRussianToken } from '../../store/russianStore'; 
import { setAccessToken as setGermanToken } from '../../store/germanStore';


import {Input, Button, Icon} from "@mui/material";
import AuthService from "../../../app/services/AuthServices";


import { PropsStor } from "../../interfaces/index";
import { useLanguage } from "../../context/LanguageContext";

type Props = {
    isCabinetOpened: string,
    setIsCabinetOpened: Function
  }

 
const Modal: FunctionComponent<Props> = ({isCabinetOpened, setIsCabinetOpened}) => {


      if(isCabinetOpened != "hidden") {

        const { language } = useLanguage();
        const dispatch = useDispatch();
        const tutors = useSelector((state: any) => state.russian?.tutors || state.german?.tutors || []);

  const ref = useRef<HTMLDivElement>(null);
const [user, setUser] = useState<object>({});
const [routeCreate, setRouteCreate] = useState<string>("clients");
const [routeLogin, setRouteLogin] = useState<string>("loginClient");
const [routePasswordRefresh, setRoutePasswordRefresh] = useState("forgotPasswordClient");
const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
const [signAndBack, setSignAndBack] = useState<string>("");
const [widthModal, setWidthModal] = useState<number>(0);
const [check, setCheck] = useState<boolean>(false);
const [isRegistrationInBackendSuccessed, setIsRegistrationInBackendSuccessed] = useState<boolean>(false);

const [localEmail, setLocalEmail] = useState<string>(email);
const [localPass, setLocalPass] = useState<string>(pass);
const [visabilityPass, setVisabilityPass] = useState<boolean>(false);
const [localName, setLocalName] = useState<string>(name);
const [localSurname, setLocalSurname] = useState<string>(surname);

const emailRef = useRef<HTMLInputElement>(null);
const emailErrorRef = useRef<HTMLParagraphElement>(null);
const passRef = useRef<HTMLInputElement>(null);
const passErrorRef = useRef<HTMLParagraphElement>(null);
const nameRef = useRef<HTMLInputElement>(null);
const nameErrorRef = useRef<HTMLParagraphElement>(null);
const surnameRef = useRef<HTMLInputElement>(null);
const surnameErrorRef = useRef<HTMLParagraphElement>(null);


const [forgotPasswordValue, setForgotPasswordValue] = useState("");


    const sacreate = async() => {
  const newUser = {
    name: localName,
    surname: localSurname,
    email: localEmail,
    password: localPass
}
setUser(newUser);
    return newUser;
    }


    function emailCheck(email:string) {
      let checkEmail = /^[\w-\.]+@[\w-]+\.[a-z]{2,4}$/i;
              
              
              if(emailRef.current && emailErrorRef.current) {
                 if(!checkEmail.test(email)) {

                  formCheck(emailRef, emailErrorRef);
                  if(language == "russian") {
                     emailErrorRef.current.innerHTML = `Введите корректный email. Нужно ввести символы <span style="font-weight: bold; color: orange;">@</span>, <span style="font-weight: bold; color: orange;">.</span>`
                  }
                   else if(language == "german") {
                     emailErrorRef.current.innerHTML = `Schreiben Sie korrekte Email. Es ist nötig, die Symbole <span style="font-weight: bold; color: orange;">@</span>, <span style="font-weight: bold; color: orange;">.</span> zu schreiben`
                   }
                  
                 } else {
                  emailRef.current.style.border = "";
                  emailErrorRef.current.style.color = "";
                  emailErrorRef.current.innerHTML = "";
                  return true;
                }

                   
              }  
    }

    function passwordCheck(password:string) {

      if(passRef.current && passErrorRef.current) {
        if(password.length < 5) {
          
          if(language == "russian") {
            passErrorRef.current.innerHTML = `Введите корректный пароль. Нужно ввести больше <span style="font-weight: bold; color: orange;">5 символов</span>`
          }
          else if(language == "german") {
            passErrorRef.current.innerHTML = `Schreiben Sie korrekte Passwort. Es ist nötig, <span style="font-weight: bold; color: orange;">mehr als 5 Symbole</span> zu schreiben`
          }

         formCheck(passRef, passErrorRef);
        }
        
        else {
           passRef.current.style.border = "";
           passErrorRef.current.style.color = "";
           passErrorRef.current.innerHTML = "";
         return true;
        }
      } 
    }

    function formCheck(ref: RefObject<HTMLParagraphElement>, errorRef: RefObject<HTMLParagraphElement>) {
      if(ref.current && errorRef.current) {
      ref.current.style.border = "3px solid red";
        
      errorRef.current.style.fontWeight = 'bold';
      errorRef.current.style.color = "red";
    }
  }

    const passwordRefresh = async(route:string, method:string) => {
        try {
          //let clientCopy = sacreate();
          let data = await sacreate();
          let result = emailCheck(data.email);

               if(result) {
                 await responseFunction(route, method,  data)
               }
        } catch(e) {
          console.log(e);
        }
    }

    interface LoginRegistration {
      email: string,
      password: string,
      name: string,
      surname: string
    }


    const responseFunction = async (route:string, method:string, data:LoginRegistration) => {
      try{

 let role;
 if(route == "loginTutor") role = "tutor";
 if(route == "loginClient") role = "client";
console.log(role);
 if(role) {
  const response = await AuthService.login(data.email, data.password, role, language);
   console.log(response) 
  if (!response) {
    console.error("Ответ не получен (undefined)");
    throw new Error("Нет соединения с сервером");
  }
  
  if (response.status == 400) {
    throw new Error("Ошибка авторизации");
  }
 
  if(response && response.status == 404) {
     if(response.data.status == "Not Found Email" && emailErrorRef && emailErrorRef.current) {
      if(language == "german") {
         emailErrorRef.current.innerHTML = `Введите корректный email. Ваш Email не найден`
      } else if(language == "russian") {
         emailErrorRef.current.innerHTML = `Schreiben Sie korrekte Email. Ihr E-Mail wurde nicht gefunden`
      }
        
     } else if(response.data.status == "Not Equals Password" && passErrorRef && passErrorRef.current) {
      if(language == "german") {
         passErrorRef.current.innerHTML = `Email корректный, но пароль неправильный`
      } else if(language == "russian") {
         passErrorRef.current.innerHTML = `E-Mail ist korrekt, aber das Passwort ist nicht korrekt`
      }
        
     }
     
  }
  if(response && response.data) {
    
    const accessToken = response.data;
    const tokenAction = language === "russian" ? setRussianToken : setGermanToken;
    dispatch(tokenAction(String(accessToken)));
    return response;
  }
 } else {
  const response = await AuthService.registration(data.name, data.surname, data.email, data.password, language);

  if (!response) {
    console.error("Ответ не получен (undefined)");
    throw new Error("Нет соединения с сервером");
  }
  
  if (response.status >= 400) {
    throw new Error("Ошибка авторизации");
  }
  

  if(response) {
    setIsRegistrationInBackendSuccessed(true);
  }
  return response;
 }

 

      } catch (e) {
        console.log(e);
      }
      
    }
    

   const send = async(route:string, method:string) => {
    if(route == "registration") {
      () => setCheck(false);
    }
      try{
         const data = await sacreate();
              let isEmailCorrect = emailCheck(data.email);
              let isPasswordCheck = passwordCheck(data.password);

              if(isEmailCorrect && isPasswordCheck) {
                tutors.map((item) => {
                  if(data.email == item.email) route = "loginTutor"; 
                  });

                  if(route !== "loginTutor" && route !== "clients") route = "loginClient";
                  
                     let personUseCopy;
                     
                      try {
                        console.log(route);
                        console.log(method);
                        console.log(data);
                       const response = await responseFunction(route, method, data); 
                       console.log(response);
                       (response && response.data) ? 
                           personUseCopy = await response.data.person : 
                           console.error("Ошибка: Нет ответа от сервера или некорректные данные");
                
                      } catch(e: any) {
                       let refInput;
                       let refError;
                  

                  if(e.message.includes("email") && passRef.current && passErrorRef.current) {
                    passRef.current.style.border = "";
                    passErrorRef.current.textContent = ""; 
                    passRef.current.style.color = "";
                   
                     refInput = emailRef;
                     refError = emailErrorRef;
                  } else if(e.message.includes("Пароль") && emailRef.current && emailErrorRef.current) {
                    emailRef.current.style.border = "";
                    emailRef.current.style.color = "";
                    emailErrorRef.current.textContent = ""; 
            
                    refInput = passRef;
                    refError = passErrorRef;
                 } else {
                  
                 }

                 if(refInput && refInput.current && refError && refError.current) {
                  refInput.current.style.border = "3px solid red";
                  refError.current.textContent = e.message; 
                  refError.current.style.color = "red";
                 } 
                }
              if(personUseCopy != undefined && personUseCopy != null) {
              if(personUseCopy.availableSubjects != undefined) { 
                if(route == "loginTutor") {
                   setTutorUse(personUseCopy);
                   localStorage.setItem("role", "tutor");
                   if(localStorage.getItem("role") == "gast") {
                     localStorage.setItem("role", "tutor");
                   }
                  };
                
                  setIsCabinetOpened("hidden");
              } else if(personUseCopy.availableSubjects == undefined && personUseCopy.isActivated == true) {
                if(route == "loginClient") {
                   setClientUse(personUseCopy);
                   localStorage.setItem("role", "client");
                   if(localStorage.getItem("role") == "gast") {
                     localStorage.setItem("role", "client");
                   }
                   
                };
                  setIsCabinetOpened("hidden");
              }
              setIsLogined(true);
             } 
                if(personUseCopy) return personUseCopy;
                
            }
        } catch(e: any) {
            console.log(e.message); 
        };
   }

   useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsCabinetOpened("hidden") 
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
    useEffect(() => {if(check == true) {send(routeCreate, "POST")}}, [check]);    
    class Translate {
      header() {
        if(language == "russian") {
          if(isForgotPassword) {
            return <p className="text-white" ><span>Восстановление пароля</span></p>
          }
           if(isLogined && !isForgotPassword) {
              return <p className="text-white" ><span>Войти</span></p>
           }    
             else if(!isLogined && !isForgotPassword) {
               return <p className="text-white"><span>Зарегистрироваться</span></p>
             }
          
        } else if(language == "german") {

          if(isForgotPassword) {
            return <p className="text-white"><span>Password zu erneuten</span></p>
          }
           if(isLogined && !isForgotPassword) {
              return <p className="text-white"><span>Anmelden</span></p>
           }    
             else if(!isLogined && !isForgotPassword) {
               return <p className="text-white"><span>Registrieren</span></p>
             }
            }
      }

      inputFirstNamePlaceholder() {
        if(language == "russian") {
          return "Имя"
        } else if(language == "german") {
          return "Vorname"
        }
      }

      inputSecondNamePlaceholder() {
        if(language == "russian") {
          return "Фамилия"
        } else if(language == "german") {
          return "Nachname"
        }
      }

      inputPassword() {
        if(language == "russian") {
          return "Пароль"
        } else if(language == "german") {
          return "Passwort"
        }
      }

      noAccount() {
        if(language == "russian") {
          return "Нет аккаунта"
        } else if(language == "german") {
          return "Kein Account"
        }
      }

      isAccount() {
        if(language == "russian") {
          return "У меня есть аккаунт"
        } else if(language == "german") {
          return "Ich habe Account"
        }
      }

      buttonForgotPassword() {
        if(language == "russian") {
          setForgotPasswordValue("Забыл пароль")
         } else if(language == "german") {
           setForgotPasswordValue("Ich vergesse Password");
         } 
      }

      buttonChangePassword() {
        if(language == "russian") {
          setForgotPasswordValue("Поменять пароль");
         } else if(language == "german") {
          setForgotPasswordValue("Password zu verändern");
         } 
      }

      buttonSignIn() {
        if(language == "russian") {
              return <p className="text-white"><span>Войти</span></p>
        } else if(language == "german") {
           if(isLogined && !isForgotPassword) {
              return <p className="text-white"><span>Anmelden</span></p>
           }    
             
            }
      }

      buttonBack() {
        if(language == "russian") {
          return "Назад";
         } else if(language == "german") {
          return "Zurück";
         } 
      }

      isRegistrationInBackendSuccessedTextTranslate() {
        if(language == "german") return "Letzter Schritt - Bestätigen Sie Ihre E-Mail";
        if(language == "russian") return "Последний шаг - ПОдтвердите Вашу почту";
      }

      errors() {
       if(language == "russian") {

       } else if(language == "german") {

       }
      }
    }

    const translateClass = new Translate();
    useEffect(() => {translateClass.buttonForgotPassword()}, [language])
   
    const EmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalEmail(e.target.value); 
    };
    const PasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalPass(e.target.value); 
    };
    const FirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalName(e.target.value); 
    };
    const SecondNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSurname(e.target.value); 
    };

    
  return (
    <div 
              id="cabinetModal" 
              className={` 
                          flex justify-center items-center
                          overflow-y-auto overflow-x-hidden 
                          fixed top-0 right-0 left-0 z-50 
                          md:inset-0 h-[calc(100%-1rem)] max-h-full
                          bg-black/40`
                        }
              aria-modal="true"
              role="dialog"
    >

    <div 
      ref={ref} 
      className="relative widthModal w-fit h-fit overflow-hidden" 
      style={{boxShadow: "2px 2px 10px 0px #a69fa6"}}
    >
      
        <div className="relative content-center mx-auto bg-white rounded-lg shadow dark:bg-gray-700">
            
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 modal-header-gradient">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                   {translateClass.header()}
                </h3>
                <button 
                      type="button" 
                      className="
                                bg-transparent 
                                text-white/90 hover:text-white transition
                                hover:bg-gray-200 hover:text-gray-900 
                                rounded-lg text-sm w-10 h-10 ms-auto inline-flex justify-center items-center 

                                " 
                data-modal-hide="default-modal"
                onClick={() => setIsCabinetOpened('hidden')}
                aria-label="Close"
                title="Close">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>
            </div>

            {isRegistrationInBackendSuccessed ?
            
            (
              <p className="text-center text-xl p-2 font-semibold">{translateClass.isRegistrationInBackendSuccessedTextTranslate()}</p>
            )

            :

            (
              <div className="p-4 md:p-5 space-y-4 justify-center">
                
              {(isLogined) ? <p></p> : 
              
               <div className="w-full min-w-72"> 
                  <Input
                       type="text"
                       placeholder={translateClass.inputFirstNamePlaceholder()}
                       className="p-2 mx-auto fieldModal"
                       onChange={FirstNameChange}
                       style={{color: "white", width: "250px"}}
                       value={localName}
                  /><br/>
                  <Input
                       type="text"
                       placeholder={translateClass.inputSecondNamePlaceholder()}
                       className="p-2 mx-auto fieldModal"
                       onChange={SecondNameChange}
                       style={{color: "white", width: "250px"}}
                       value={localSurname}
                       
                  />
                  </div>
                  
                  }
                  <Input 
                       ref = {emailRef}
                       type="text"
                       placeholder="Email"
                       className="p-2 mx-auto fieldModal"
                       onChange={EmailChange}
                       style={{color: "white", width: "250px"}}
                       value={localEmail}
                       autoComplete="current-email"
                      
                  />
                  <p ref={emailErrorRef} className="errorEmail"></p>

                  {isForgotPassword ? <p></p> : (
<div className="relative max-w-md mx-auto flex" style={{ width: "235px" }}>
  <Input
    ref={passRef}
    type={visabilityPass ? "text" : "password"}
    placeholder={translateClass.inputPassword()}
    className="pr-10 w-full fieldModal"
    onChange={PasswordChange}
    value={localPass}
    autoComplete="current-password"
    style={{ borderRadius: "8px", color: "white" }} // можно подправить под твой стиль
    
  />

</div>
)}

                  <p ref={passErrorRef} className="errorPass"></p>

{(isLogined) ? 
  (isForgotPassword) ?
     null
    : 
     <Button 
         variant="text"
         className="
            text-center
            bg-cyan-700
            p-2
             rounded-md"
         onClick={() => setIsLogined(false)}
     >
        {translateClass.noAccount()}
     </Button>

  : 
   <Button 
      variant="text"
      className="
                text-center
                bg-cyan-700
                p-2
                 rounded-md"
     onClick={() => {setIsLogined(true)}}
     >
       {translateClass.isAccount()}
  </Button>

}           
{(isLogined) ? 
          <div className="container grid grid-cols-2 space-x-4 gap-x-4 items-center p-4 border-t border-gray-200 dark:border-gray-600">
              {(isForgotPassword) ?
              <Button  
              color="error"
              className="
                  text-white mx-2
                  focus:ring-4 focus:outline-none
                  font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                  "
              sx={{color: "white !important", marginRight: "10%"}}
              onClick={() => {setIsForgotPassword(false); translateClass.buttonForgotPassword()} }>
            {translateClass.buttonBack()}</Button>
             :
              <Button 
                    className=" mx-2
                              text-white bg-green-700
                              
                              focus:ring-4 focus:outline-none focus:ring-green-300 
                              font-medium text-sm px-5 py-2.5 text-center 
                              dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-800"
                              sx={{color: "white !important", backgroundColor: " rgb(34, 133, 43)", marginRight: "10%"}}
                    onClick={() => send(routeLogin, "POST")}>
              {translateClass.buttonSignIn()}</Button>
              }

              <Button  
                    className=" mx-2
                              justify-end text-white bg-red-700 
                              hover:bg-red-800 focus:ring-4 
                              focus:outline-none focus:ring-red-300 
                              font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                              dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                              sx={{color: "white", backgroundColor: " rgb(255,99,71)"}}
                    onClick={async () => {  
                   
                      if(forgotPasswordValue == "Поменять пароль" || forgotPasswordValue == "Password zu verändern" ) {
                   
                       const data = await sacreate();            
                          tutors.map((item) => {
                            if(data.email == item.email) setRoutePasswordRefresh("forgotPasswordTutor"); 
                          })

                        passwordRefresh(routePasswordRefresh, "POST")
                      } else {
                         translateClass.buttonChangePassword()
                         setIsForgotPassword(true);
                      }
                  }}
                >
              {(window.innerWidth > 500) ? 
                  <p>{forgotPasswordValue}</p> :
                    (window.innerWidth <= 500 && window.innerWidth > 450) ? 
                      <p style={{fontSize: "90%"}}>{forgotPasswordValue}</p> :
                        (window.innerWidth <= 450 && window.innerWidth > 400) ? <p style={{fontSize: "70%"}}>{forgotPasswordValue}</p> :
                          (window.innerWidth <= 400) ? <p style={{fontSize: "60%"}}>{forgotPasswordValue}</p> : null }</Button>
          </div>
: 

<div className="items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
<Button 
    data-modal-hide="default-modal" 
    type="button" 
    className="w-1/2
              mr-5 text-white 
              focus:ring-4 focus:outline-none  
              font-medium rounded-lg text-sm px-5 py-2.5 text-center 
              bg-blue-600
              dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
    onClick={() => {setCheck(true)}}>
{translateClass.header()}</Button>
</div>

}
      </div>
            )} 
    </div>
</div>
</div>
  );


}
}
export default React.memo(Modal);
*/



























































"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Input } from "@mui/material";

import "./Modal.css";
import { setAccessToken as setRussianToken } from "../../store/russianStore";
import { setAccessToken as setGermanToken } from "../../store/germanStore";

import AuthService from "../../../app/services/AuthServices";
import { useLanguage } from "../../context/LanguageContext";

interface ModalProps {
  isCabinetOpened: string;
  setIsCabinetOpened: (v: string) => void;
}

const Modal: React.FC<ModalProps> = ({ isCabinetOpened, setIsCabinetOpened }) => {
  const { language } = useLanguage();
  const dispatch = useDispatch();

  const tutors = useSelector((state: any) => {
    const branch = state.russian || state.german;
    console.log(branch);
    return branch?.tutors || [];
  });

  const modalRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<
    "login" | "register" | "forgot"
  >("login");

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    surname: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsCabinetOpened("hidden");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setIsCabinetOpened]);

  if (isCabinetOpened === "hidden") return null;

  const t = {
    login: language === "russian" ? "Войти" : "Anmelden",
    register: language === "russian" ? "Регистрация" : "Registrieren",
    forgot: language === "russian" ? "Восстановление пароля" : "Passwort erneuern",
    next: language === "russian" ? "Далее" : "Weiter",
    noAccount: language === "russian" ? "Нет аккаунта?" : "Kein Account?",
    hasAccount: language === "russian" ? "Уже есть аккаунт" : "Ich habe Account",
    forgotPass: language === "russian" ? "Забыл пароль" : "Passwort vergessen",
    checkMail: language === "russian" ? "Проверьте вашу почту" : "Prüfen Sie Ihre E-Mail",
  };

  const setField =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [name]: e.target.value }));
      setError("");
    };

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(language === "russian" ? "Некорректный Email" : "Ungültige Email");
      return false;
    }

    if (mode !== "forgot" && form.password.length < 8) {
      setError(language === "russian" ? "Минимум 8 символов" : "Mindestens 8 Zeichen");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    try {
      let role = "client";
      if (tutors.some((t: any) => t.email === form.email)) role = "tutor";
    
      if (mode === "login") {
        const response = await AuthService.login(form.email, form.password, role);
        if(response.data) {
          setSuccess(true);
          setIsCabinetOpened("hidden");
        } 
      }

      if (mode === "register") {
        const response = await AuthService.registration(
          form.name,
          form.surname,
          form.email,
          form.password
        );
        if(response.data) {
          setSuccess(true);
        } 
      }

      if (mode === "forgot") {
        const response = await AuthService.forgotPassword(form.email, language);
        if(response.data) {
          setSuccess(true);
        }
        
      }
    } catch (e: any) {
      setError(e.message || "Ошибка");
      console.log("LOGIN ERROR:", e);       // ← ДОБАВЬ ЭТО
    }
  };

  const header =
    mode === "login"
      ? t.login
      : mode === "register"
      ? t.register
      : t.forgot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-5 border-b flex justify-between items-center modal-header-gradient text-white">
          <h3 className="text-xl font-bold">{header}</h3>
          <button
            onClick={() => setIsCabinetOpened("hidden")}
            className="text-white hover:scale-110 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <p className="text-center text-lg font-medium">{t.checkMail}</p>
          ) : (
            <>
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={setField("name")}
                    fullWidth
                  />
                  <Input
                    name="surname"
                    placeholder="Surname"
                    value={form.surname}
                    onChange={setField("surname")}
                    fullWidth
                  />
                </div>
              )}

              <Input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={setField("email")}
                fullWidth
              />

              {mode !== "forgot" && (
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={setField("password")}
                  fullWidth
                />
              )}

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <Button variant="contained" color="primary" onClick={submit} fullWidth>
                {mode === "forgot" ? t.next : header}
              </Button>

              <div className="flex justify-between text-sm">
                <button
                  onClick={() =>
                    setMode(mode === "login" ? "register" : "login")
                  }
                  className="text-blue-500 hover:underline"
                >
                  {mode === "login" ? t.noAccount : t.hasAccount}
                </button>

                {mode !== "register" && (
                  <button
                    onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {mode === "forgot"
                      ? language === "russian"
                        ? "Назад"
                        : "Zurück"
                      : t.forgotPass}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Modal);
