/*
"use client";
import React, { FunctionComponent, RefObject, useEffect, useRef, useState } from "react";
// import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

import "./styles/AccountSettings.css";
import { Button, Input } from "@mui/material";
import UserService from "../../../../app/services/UserService";
import AuthService from "../../../../app/services/AuthServices";

import { useSelector } from "react-redux";
import { selectRole, selectUser } from "../../../store/selectors";

import { useLanguage } from "../../../context/LanguageContext";




const BodyAccountSettings: FunctionComponent = () => {

const user = useSelector(selectUser);
const { language } = useLanguage();
const role = useSelector(selectRole);
  
  const [gridMain, setGridMain] = useState<string>("");
  const [colMenu, setColMenu] = useState<string>("");
  const [colContent, setColContent] = useState<string>("");

  const [gridGeneralInfo, setGridGeneralInfo] = useState<string>("");
  const [colGeneralText, setColGeneralText] = useState<string>("");
  const [colGeneralButtons, setColGeneralButtons] = useState<string>("");
  const [currentSetting, setCurrentSetting] = useState<string>("");

  const [changeEmail, setChangeEmail] = useState<boolean>(false);
  const [isChangedEmail, setIsChangedEmail] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>("");
  const [route, setRoute] = useState<string>("emailChange");

  const emailRef = useRef<HTMLButtonElement | null>(null);
  const emailErrorRef = useRef<HTMLParagraphElement | null>(null);
  
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>("");
  const [oldPassword, setOldPassword] = useState<string>("");

  const passwordRef = useRef<HTMLButtonElement | null>(null);
  const passwordErrorRef = useRef<HTMLParagraphElement | null>(null);
  const passwordConfirmRef = useRef<HTMLButtonElement | null>(null);
  const passwordErrorConfirmRef = useRef<HTMLParagraphElement | null>(null);
  const [errorNewPassword, setErrorNewPassword] = useState<string>("");
  const [errorNewPasswordConfirm, setErrorNewPasswordConfirm] = useState<string>("");

  const [routePasswordRefresh, setRoutePasswordRefresh] = useState("forgotPasswordClient");
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);


  const [isPayReady, setIsPayReady] = useState<boolean>(false);



  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements) {
      console.warn("Stripe не загружен!");
    }
  }, [stripe, elements]);



  class TranslateClass {
    static menu() {
      if (language === "german")
        return ["Allgemein", "Zahlungen"];
      if (language === "russian")
        return ["Общее", "Платежи"];
      return [];
    }

    static menuItem(item:string) {
      if (language == "russian") {
        if(item == "Общее") {
          return "Общее"
        } else if(item == "Платежи") {
          return "Платежи"
        }
      } 

      else if (language === "german") {
        if(item == "Allgemein") {
          return "Allgemein"
        } else if(item == "Zahlungen") {
          return "Zahlungen"
        }
      }
        
     return ""
    }

    static headerModalChangeEmail() {
      if(language == "german") return "Neue Email";
      if(language == "russian") return "Новый Email"
    }

    static headerChangeOldPassword() {
      if(language == "german") return "Altes Passwort";
      if(language == "russian") return "Старый пароль"
    }

    static headerChangeNewPassword() {
      if(language == "german") return "Neues Passwort";
      if(language == "russian") return "Новый пароль"
    }

    static headerChangeNewConfirmPassword() {
      if(language == "german") return "Neues Passwort bestätigen";
      if(language == "russian") return "Новый пароль подтвердить"
    }

    static buttonModalChangeEmail() {
      if(language == "german") return "Email zu wächseln";
      if(language == "russian") return "Поменять Email"
    }

    static buttonModalChangePassword() {
      if(language == "german") return "Passwort zu wächseln";
      if(language == "russian") return "Поменять пароль"
    }

    static isChangedEmail() {
      if (language == "german") return "Bestätigen Sie bitte neue Email-Adresse";
      if (language == "russian") return "Подтвердите новую почту"
    } 

    static deleteAccount() {
       if (language == "german") return "Account zu löschen";
       if (language == "russian") return "Удалить аккаунт"
    }

    static deleteAccountText() {
       if (language == "german") return "Die Löschung des Accounts";
       if (language == "russian") return "Удаление аккаунта"
    }
  }


 

  useEffect(() => {
    const updateGrid = () => {
      if (window.innerWidth < 600) {
        setGridMain("grid-cols-1");
        setGridGeneralInfo("grid-cols-1");
      } else {
        setGridMain("grid-cols-3");
        setColMenu("col-span-1");
        setColContent("col-span-2");

        setGridGeneralInfo("grid-cols-3");
        setColGeneralText("col-span-1");
        setColGeneralButtons("col-span-2");
      }
    };

    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, []);

  const EmailValueChange = (e: { target: { value: React.SetStateAction<string>}}) => {
     setNewEmail(e.target.value);
  }

  const NewPasswordValueChange = (e: { target: { value: React.SetStateAction<string>}}) => {
    setNewPassword(e.target.value);
  }

  const NewPasswordConfirmValueChange = (e: { target: { value: React.SetStateAction<string>}}) => {
    setNewPasswordConfirm(e.target.value);
  }

  const OldPasswordValueChange = (e: { target: { value: React.SetStateAction<string>}}) => {
    setOldPassword(e.target.value);
  }


  const changeEmailInServer = async () => {
    try{

      const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";
      let URL = `${backendURL}${route}`;
      let body;
      let obj = {
          oldEmail: user.email,
          newEmail: newEmail,
          role: role
      }

      body = JSON.stringify(obj);

      const response = await AuthService.emailChange()

      return response;
    } catch (e) {
      console.log(e);
    }
    
  }


     function formCheck(ref: RefObject<HTMLButtonElement | undefined>, errorRef: RefObject<HTMLParagraphElement | undefined>) {
        if(ref.current && errorRef.current) {
        ref.current.style.border = "3px solid red";
          
        errorRef.current.style.fontWeight = 'bold';
        errorRef.current.style.color = "red";
      }
    }
    
    function emailCheck(email: string): boolean {
      const checkEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
      if (emailRef.current && emailErrorRef.current) {
        if (!checkEmail.test(email)) {
          formCheck(emailRef, emailErrorRef);
    
          if (language === "russian") {
            emailErrorRef.current.innerHTML = `Введите корректный email. Нужно ввести символы <span style="font-weight: bold; color: orange;">@</span>, <span style="font-weight: bold; color: orange;">.</span>`;
          } else if (language === "german") {
            emailErrorRef.current.innerHTML = `Schreiben Sie korrekte Email. Es ist nötig, die Symbole <span style="font-weight: bold; color: orange;">@</span>, <span style="font-weight: bold; color: orange;">.</span> zu schreiben.`;
          }
    
          return false;
        } else {
          emailRef.current.style.border = "";
          emailErrorRef.current.style.color = "";
          emailErrorRef.current.innerHTML = "";
          return true;
        }
      }
    
      return false; // безопасно возвращаем
    }
    

    const send = async () => {
    
      try {
        const isEmailCorrect = emailCheck(newEmail);
    
        if (isEmailCorrect) {
          const response = await changeEmailInServer();
    
          if (response && !response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
          }
    
          // Email успешно отправлен
          setIsChangedEmail(true);
        }
      } catch (e: any) {
        console.log("Ошибка:", e.message);
    
        if (
          e.message.includes("email") &&
          emailRef.current &&
          emailErrorRef.current
        ) {
          emailRef.current.style.border = "3px solid red";
          emailErrorRef.current.textContent = e.message;
          emailErrorRef.current.style.color = "red";
        }
      }
    };
    

   const passwordChange = async() => {
    try {
    
      const currentEmail:string = newEmail || user.email; 

      if(currentEmail) {
        let result = emailCheck(currentEmail);

        if(role == "tutor") {
          setRoutePasswordRefresh("forgotPasswordTutor");
        } else if(role == "client") {
          setRoutePasswordRefresh("forgotPasswordClient");
        }

        if(result && 
          (routePasswordRefresh == "forgotPasswordTutor" || 
           routePasswordRefresh == "forgotPasswordClient")) {
          await passwordChangeFunction(routePasswordRefresh, "POST", newPassword, currentEmail)
        }
      }
           
          
    } catch(e) {
      console.log(e);
    }
}


    function checkNewPassword() {
      if(passwordErrorRef.current && passwordRef.current && newPassword.length < 5) {
         passwordRef.current.style.border = "3px solid red";
         setErrorNewPassword("Введите корректный пароль. Нужно ввести больше 5 символов"); 
         passwordErrorRef.current.style.color = "red";
         return false;
      } 
      return true;
    }


    async function check() {
       if(checkNewPassword()) {
        if(newPassword !== oldPassword && newPassword == newPasswordConfirm) {
           return true;
        } else {
            if(passwordErrorConfirmRef.current && passwordConfirmRef.current) {
                passwordConfirmRef.current.style.border = "3px solid red";
                  setErrorNewPasswordConfirm("Пароли не совпадают");
                passwordErrorConfirmRef.current.style.color = "red";
          }
          return false;
        }
       }
       
    }


  const passwordChangeFunction = async (route:string, method:string, data:(Object | string), email:string) => {
    try{
 
      const isChecked = await check();
  
      if(isChecked) {
        
            const response = await AuthService.passwordIsChanged(String(data), email, role);

            if (!response) {
              console.error("Ответ не получен (undefined)");
              throw new Error("Нет соединения с сервером");
            }
        
            if (response.status >= 400) {
              throw new Error("Ошибка изменения пароля");
            }

            return response;
          
      
      }
    
    } catch (e) {
      console.log(e);
    }
  
  }


  const deleteAccount = async () => {
    await UserService.deleteAccount(user.email, role)
  }


  const menuSettings = TranslateClass.menu();

  
  const addCard = async() => {
      if (!stripe || !elements) return;
  
      try {
        // Создаём paymentMethod на основе введённых пользователем данных
        const { paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: elements.getElement(CardElement)!
        });

  
        // Отправляем paymentMethodId на сервер
        if(clientUse && paymentMethod) {
          const response = await UserService.addCard(paymentMethod.id, clientUse.email);

          if (response && response.data.success) {
            return "Подписка успешно оформлена!";
          } else {
            return "Ошибка при оформлении подписки";
          }
        } 
      } catch (err) {
        console.log(err);
      }
  }


return (
  <div 
      className={`accountSettings grid ${gridMain}`} 
      style={{
        backgroundColor: "white",
        backgroundImage: "radial-gradient(circle, rgba(243, 134, 17, 0.1) 3px, transparent 1px)",
        backgroundSize: "20px 20px" 
      }}>
      
      <div className={`menu ${colMenu}`}>
        {menuSettings.map((item: string) => (
          <p
            key={item}
            className="w-full p-10 font-bold text-xl cursor-pointer"
            onClick={() => setCurrentSetting(item)}
          >
            {item}
          </p>
        ))}
      </div>

      <div className={`content ${colContent} p-10`}>
        <h2 className="font-bold text-xl">{TranslateClass.menuItem(currentSetting)}</h2>

        {(currentSetting === "Allgemein" || currentSetting === "Общее") && (
          <div className="general mt-10">

            <div className={`email grid ${gridGeneralInfo}`}>
              <div className={`${colGeneralText}`}>
                <p>Email: {user.email}</p>
              </div>

              <div className={`${colGeneralButtons}`}>
               
                  <div>
                    <p className="text-center w-1/2">{user.email}</p>
                    <p ref={emailErrorRef}></p>
                    
                    <Button 
                      ref={emailRef}
                      type="button" 
                      className="w-1/2
                                 mr-5 text-white bg-orange-700 
                                 hover:bg-orange-800 
                                 focus:ring-4 focus:outline-none focus:ring-orange-300 
                                 font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                                 dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                      onClick={() => setChangeEmail(true)}>
                        {TranslateClass.buttonModalChangeEmail()}
                    </Button>
                  </div>
              </div>
            </div>

            <div className={`password mt-6 grid ${gridGeneralInfo}`}>
              <div className={`${colGeneralText}`}>
                <p>{(language == "german") ? "Passwort" : "Пароль"}: </p>
              </div>

              <div className={`${colGeneralButtons}`}>
                <div>
                  <Button 
                    type="button" 
                    className="w-1/2
                               mr-5 text-white bg-orange-700 
                               hover:bg-orange-800 
                               focus:ring-4 focus:outline-none focus:ring-orange-300 
                               font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                               dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                    onClick={() => {setIsForgotPassword(true)}}>
                      {TranslateClass.buttonModalChangePassword()}
                  </Button>

                  {isForgotPassword &&
                    
                    <div>
                      <Input
                        type="text"
                        placeholder={TranslateClass.headerChangeOldPassword()}
                        className="w-1/2 p-5 m-2 mx-auto fieldModal text-white"
                        onChange={OldPasswordValueChange}
                        value={oldPassword}
                      />

                      <Input
                        type="text"
                        ref={passwordRef}
                        placeholder={TranslateClass.headerChangeNewPassword()}
                        className="w-1/2 p-5 m-2 mx-auto fieldModal text-white"
                        onChange={NewPasswordValueChange}
                        value={newPassword}
                      />
                      <p ref={passwordErrorRef}>{errorNewPassword}</p>

                      <Input
                        type="text"
                        placeholder={TranslateClass.headerChangeNewConfirmPassword()}
                        className=" w-1/2 p-5 m-2 mx-auto fieldModal text-white"
                        onChange={NewPasswordConfirmValueChange}
                        value={newPasswordConfirm}
                  />
                  <p ref={passwordErrorConfirmRef}>{errorNewPasswordConfirm}</p>

                  <Button 
                    type="button" 
                    className="w-1/2
                               mx-auto
                               text-white bg-orange-700 
                               hover:bg-orange-800 
                               focus:ring-4 focus:outline-none focus:ring-orange-300 
                               font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                               dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                    onClick={() => passwordChange()}>
                    {(language == "german") ? "Passwort bestätigen" : "Пароль подтвердить"}</Button>
  </div>
} 
                  </div>

              </div>
            </div>



            <div className={`deleteAccount mt-10 grid ${gridGeneralInfo}`}>
       <p>{TranslateClass.deleteAccountText()}</p>
              <Button 
      data-modal-hide="Delete Account" 
      type="button" 
      className="w-full
                mr-5 text-white bg-red-700 
                hover:bg-orange-800 
                focus:ring-4 focus:outline-none focus:ring-orange-300 
                font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
      onClick={() => deleteAccount()}>
{TranslateClass.deleteAccount()}</Button>
              </div>

          </div>
        )}

      

        {(currentSetting === "Zahlungen" || currentSetting === "Платежи") && (
         <div className="mt-10">

           <Button 
           data-modal-hide="Pay" 
           type="button" 
           className="w-full
                     mr-5 text-white bg-red-700 
                     hover:bg-orange-800 
                     focus:ring-4 focus:outline-none focus:ring-orange-300 
                     font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                     dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
           onClick={() => setIsPayReady(!isPayReady)}>
               Add card</Button>
         {(isPayReady) ? ( <div className="subscription-container mt-6">
          <form onSubmit={addCard} className="w-full">
            <CardElement className="card-input" />
            <div className="w-full px-auto" style={{paddingLeft: "35%", paddingRight: "auto"}}>
            <button type="submit" className="mt-2 p-2 text-center w-1/2">
              {(language == "german") ? "Abonnieren" : "Подписаться"}
            </button>
            </div>
          </form>
          
        </div>) : null }

        </div>
        )}
      </div>


      {changeEmail && (




            <div 
            id="changeEmail" 
            className={`
                        flex justify-center items-center
                        overflow-y-auto overflow-x-hidden 
                        fixed top-0 right-0 left-0 z-50 
                        md:inset-0 h-[calc(100%-1rem)] max-h-full`
                      }
  >

  <div className="relative widthModal p-4 w-fit h-fit">
    
      <div className="offerModal relative content-center mx-auto  rounded-lg shadow bg-gray-900">
          
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                 {TranslateClass.headerModalChangeEmail()}
              </h3>
              <button 
                    type="button" 
                    className="
                              text-gray-400 bg-transparent 
                              hover:bg-gray-200 hover:text-gray-900 
                              dark:hover:bg-gray-600 dark:hover:text-white
                              rounded-lg text-sm w-10 h-10 ms-auto inline-flex justify-center items-center 

                              " 
              data-modal-hide="default-modal"
              onClick={() => setChangeEmail(false)}>
                  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
              </button>
          </div>
         
         {(isChangedEmail) ? 
           (
              <p className="text-lg p-4">{TranslateClass.isChangedEmail()}</p>
           ) 
          
          : 
           
           (
          <div className="p-4 md:p-5 space-y-4 justify-center">
            
              
               <div className="w-full min-w-72"> 
                  <Input
                       type="text"
                       placeholder={TranslateClass.headerModalChangeEmail()}
                       className="p-5 mx-auto fieldModal text-white"
                       onChange={EmailValueChange}
                       value={newEmail}
                  />
                  </div>

        

<div className="items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
<Button 
data-modal-hide="default-modal" 
type="button" 
className="w-1/2
          mr-5 text-white bg-orange-700 
          hover:bg-orange-800 
          focus:ring-4 focus:outline-none focus:ring-orange-300 
          font-medium rounded-lg text-sm px-5 py-2.5 text-center 
          dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
onClick={send}
>
{TranslateClass.buttonModalChangeEmail()}
</Button>

</div>


      </div>
         )
         }

  </div>
</div>

</div>     
      )}
    </div>
  );
};

export default React.memo(BodyAccountSettings);
*/




































"use client";

import React, { useState, useRef } from "react";
import { Button, Input } from "@mui/material";

import { useSelector } from "react-redux";
import { selectRole, selectUser } from "../../../store/selectors";

import { useLanguage } from "../../../context/LanguageContext";
import AuthService from "../../../../app/services/AuthServices";
import UserService from "../../../../app/services/UserService";

const BodyAccountSettings: React.FC = () => {
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
  const { language } = useLanguage();

  const [currentSetting, setCurrentSetting] = useState("general");

  // -------- EMAIL ----------
  const [newEmail, setNewEmail] = useState("");
  const [emailModal, setEmailModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const emailError = useRef<HTMLParagraphElement>(null);

  // -------- PASSWORD ----------
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");

  const T = {
    emailChangeError: (language === "german") ? "Falsche Email" : "Некорректный email",
  }
  // -------- DELETE ----------
  const deleteAccount = async () => {
    await UserService.deleteAccount(user.email, role);
  };

  // =========================
  // EMAIL VALIDATION
  // =========================
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submitEmailChange = async () => {
    if (!isValidEmail(newEmail)) {
      if (emailError.current) {
        emailError.current.innerText = T.emailChangeError;
        emailError.current.style.color = "red";
      }
      return;
    }

    await AuthService.emailChange(newEmail, user.password);
    setEmailSent(true);
  };

  // =========================
  // PASSWORD CHANGE
  // =========================
  const submitPasswordChange = async () => {
    setPassError("");

    if (newPass.length < 8) {
      return setPassError("Минимум 8 символов");
    }

    if (newPass !== confirmPass) {
      return setPassError("Пароли не совпадают");
    }

    
try {
  const response = await AuthService.passwordChange(oldPass, newPass);

  if(response && response.data) {
    setShowPasswordForm(false);
    localStorage.setItem("role", "gast");
    location.reload();
  }
} catch(e: any) {
  const msg = e.response?.data?.message || "Ошибка сети";

  if (msg === "Old password is incorrect") {
    const messageError = language === "russian" ? "Старый пароль неверный" : "Alte Passwort ist nicht korrekt"
    return setPassError(messageError);
  }

  if (msg === "Invalid token") {
    const messageError = language === "russian" ? "Сессия истекла — войдите снова" : "Session ist beendet - loggen Sie noch mal"
    return setPassError(messageError);
  }

  setPassError(msg);
}
    
   
  };

  return (
    <div className="p-10">

      {/* Меню */}
      <div>
        <p onClick={() => setCurrentSetting("general")}>Общее</p>
        <p onClick={() => setCurrentSetting("payments")}>Платежи</p>
      </div>

      {/* ------- ОБЩЕЕ -------- */}
      {currentSetting === "general" && (
        <div className="mt-10">

          {/* EMAIL */}
          <div>
            <p>Email: {user.email}</p>

            <Button onClick={() => setEmailModal(true)}>
              Поменять Email
            </Button>
          </div>

          {/* PASSWORD */}
          <div className="mt-6">
            <Button onClick={() => setShowPasswordForm(true)}>
              Поменять пароль
            </Button>

            {showPasswordForm && (
              <div>
                <Input
                  type="password"
                  placeholder="Старый пароль"
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="Новый пароль"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="Подтверждение"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                />

                <p>{passError}</p>

                <Button onClick={submitPasswordChange}>
                  Подтвердить
                </Button>
              </div>
            )}
          </div>

          {/* DELETE */}
          <div className="mt-10">
            <Button color="error" onClick={deleteAccount}>
              Удалить аккаунт
            </Button>
          </div>
        </div>
      )}

      {/* ------- EMAIL MODAL ------- */}
      {emailModal && (
        <div className="modal">

          {emailSent ? (
            <p>Подтвердите email по ссылке</p>
          ) : (
            <>
              <Input
                placeholder="Новый email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />

              <p ref={emailError} />

              <Button onClick={submitEmailChange}>
                Отправить письмо
              </Button>
            </>
          )}

          <Button onClick={() => setEmailModal(false)}>Закрыть</Button>
        </div>
      )}

    </div>
  );
};

export default React.memo(BodyAccountSettings);
