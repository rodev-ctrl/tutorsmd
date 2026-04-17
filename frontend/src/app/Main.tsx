"use client";



/////////////////////////////////////////////////////// ИМПОРТЫ ////////////////////////////////////////////////////////////

////////////////////////// REACT ///////////////
import React, {
  RefObject,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Provider } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { IntlProvider } from "react-intl";
import { Helmet } from "react-helmet";
////////////////////////////////////////////////



//////////////////// STORE ////////////////////
// Main.tsx

// ИСПОЛЬЗУЙТЕ ФИГУРНЫЕ СКОБКИ для редьюсеров
          import { setTutors as ruSetTutors } from "./store/russianStore";
          import { setTutors as deSetTutors } from "./store/germanStore";
import store from "./store";
///////////////////////////////////////////////



///////////////////////////////////////////// COMPONENTS //////////////////////////////////////////////////
import App from "./App";
import AboutUs from "./components/pages/aboutUs/AboutUs";
import CabinetPage from "./components/pages/CabinetPage/CabinetPage";
import AllTutorsPage from "./components/pages/allTutorsPage/AllTutorsPage";



import { CanvasProvider } from "./context/CanvasContext.tsx";
import { useLanguage } from "./context/LanguageContext.tsx";

import PrivacyPolicy from "./components/pages/PrivacyPolicy.tsx/PrivacyPolicy.tsx";
import LikedTeachers from "./components/pages/likedTeachers/LikedTeachers.tsx";

/// LAZY COMPONENTS ///
const MessagesFromGasts = React.lazy(
  () => import("./components/pages/MessagesFromGasts/MessagesFromGasts")
);
const AlleQuestions = React.lazy(
  () => import("./components/pages/AlleQuestions/AlleQuestions")
);
const LessonsLive = React.lazy(
  () => import("./components/pages/lessonsLive/LessonsLive")
);
const MediaCheckPage = React.lazy(
  () => import("./components/pages/mediaCheckPage/MediaCheckPage")
);
const PasswordForgot = React.lazy(() => import("./components/pages/passwordForgot/PasswordForgot"));
const AccountSettings = React.lazy(
  () => import("./components/pages/accountSettings/AccountSettings")
);
//////////////////////////////////////////////////////////////////////////////////////////////////////////



////////////////////////// SERVICES & UTILITIES /////////////////////////
import UserService from "./services/UserService";
import FileService from "./services/FileService";
import { authFetch, setGlobalStore } from "./utils/authFetch";
/////////////////////////////////////////////////////////////////////////

////////////////////////// INTERFACES & TYPES ////////////////////////////
import { Participant, Booking, WeeklyPlan, Message, Tutor, Client } from "./interfaces/index";
///////////////////////////////////////////////////////////////////////


import "./Main.css";
import { useAuth } from "./hooks/useAuth.ts";

// import { loadStripe } from "@stripe/stripe-js";
// import { Elements } from "@stripe/react-stripe-js";




function RequireAuth({isAuthChecked, allow, children}: {
  isAuthChecked: boolean;
  allow: boolean;
  children: React.ReactNode;
}) {
  if (!isAuthChecked) return <div className="text-center mt-10 text-lg">Загрузка...</div>;

  return allow ? <>{children}</> : <Navigate to="/" replace />;
}




function MainContent({ store }: { store: any }) {
  /*
  // --- Stripe (без условных хуков) ---
  const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY ?? "";
  const stripePromise = useMemo(
    () => (STRIPE_KEY ? loadStripe(STRIPE_KEY) : null),
    [STRIPE_KEY]
  );
  */

  // --- Локальные стейты ---

  const [currentNameTutor, setCurrentNameTutor] = useState<string>("");
  const [currentSurnameTutor, setCurrentSurnameTutor] = useState<string>("");

  const [showSideMenu, setShowSideMenu] = useState<string>("hidden");
  const [opacityPage, setOpacityPage] = useState<string>("100");
  const [isCabinetOpened, setIsCabinetOpened] = useState<string>("hidden");
  const [isLoginedClientCabinetOpened, setIsLoginedClientCabinetOpened] =
    useState<string>("hidden");
  const [isLoginedTutorCabinetOpened, setIsLoginedTutorCabinetOpened] =
    useState<string>("hidden");
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const refQuestionWrite = useRef<HTMLDivElement | null>(null);
  const [bookingCompleted, setBookingCompleted] = useState<boolean>(false);
  const [lessons, setLessons] = useState<WeeklyPlan[]>([]);
  const [hasRegularLessons, setHasRegularLessons] = useState<boolean>(false);
  const [unavailableLessonsTime, setUnavailableLessonsTime] = useState<WeeklyPlan[]>([]);
 
  const [isGetLessonsCalled, setIsGetLessonsCalled] = useState<boolean>(false);

  // жалоба
  const [complaint, setComplaint] = useState<string>("");
  const [complaintSent, setComplaintSent] = useState<boolean>(false); 
 

  

  const sendComplaint = async () => {
    try {

     if(booking && complaint) {
       const response = await UserService.sendComplaint(complaint);

       if(response.data.message == "Жалоба отправлена") {
           const response = await UserService.deleteBooking(booking.lessonid);
           if(response) {
             setComplaintSent(true);
             setComplaint("");
           }
       }
       return response;
     }
      
    } catch(e) {
     console.log(e)
    }
 }

  const getLessons = async (client_email?: string, tutor_email?: string) => {
   
    if (!isGetLessonsCalled) {
      setIsGetLessonsCalled(true);
      let response;
      console.log("getLessons");
      if (tutor_email && tutor_email.length > 0 && client_email && client_email.length > 0) {
       
        response = await UserService.getLessons(client_email, tutor_email);
        console.log(response);
      } else if (client_email && client_email.length > 0 && !tutor_email) {
        response = await UserService.getLessons(client_email);
        console.log(response);
      }
      
  
      if (Array.isArray(response)) { 
          setLessons(response);
          setHasRegularLessons(response.length > 0);
      } 
     
    }
    setIsGetLessonsCalled(false);
  };


  useEffect(() => {
    const changeWidth = () => {
      location.reload();
    };

    window.addEventListener('resize', changeWidth);

    // Очистка слушателя при размонтировании компонента
    return () => {
      window.removeEventListener('resize', changeWidth);
    };
  }, []);







/*
/////////////////////////// ЯЗЫК ///////////////////////////////////////
 useEffect(() => {
  const savedLanguage = localStorage.getItem("language");
  setLanguage(savedLanguage || "russian");
}, []);

// сохраняем язык
useEffect(() => {
  if (language) localStorage.setItem("language", language);
}, [language]);
/////////////////////////// ЯЗЫК ///////////////////////////////////////
*/




///////////////////////// ВЫХОД ИЗ СТРАНИЦЫ ПРЕПОДАВАТЕЛЯ /////////////////
  useEffect(() => {
    if (
      !location.search.includes("name") &&
      !location.search.includes("surname")
    ) {
      localStorage.removeItem("currentNameTutor");
      localStorage.removeItem("currentSurnameTutor");
    }
  }, [location.pathname, location.search]);
///////////////////////// ВЫХОД ИЗ СТРАНИЦЫ ПРЕПОДАВАТЕЛЯ //////////////////
  
const { language, setLanguage } = useLanguage();
/*
const {
  user,  
  role, 
  isAuthChecked,
  userToken, 
  isAllowCookies
} = useAuth(language, store);
 */

  // Добавляем защиту: если auth или user не пришли, используем пустые значения
  const auth = useAuth(language);

  const user = auth?.user || { email:"" };
  const role = auth?.role || "gast";
  const isAuthChecked = auth?.isAuthChecked || false;
  const isAllowCookies = auth?.isAllowCookies || false;
  
 
  // статус логина
  const isLoggedIn = useMemo(() => {
    const hasUser = (user?.email?.length ?? 0) > 0;
    console.log(isAllowCookies);
    console.log(auth);
    return hasUser && isAllowCookies;
  }, [user?.email, isAllowCookies]);



  /////////////////////////// ROLE ////////////////////////////////////////
  useEffect(() => {
    if (isAuthChecked) {
      localStorage.setItem("role", role);
    }
  }, [role, isAuthChecked]);
  
/////////////////////////// ROLE ///////////////////////////////////////

//////// периодический refresh ACCESSTOKEN-a ////////////////////////////////
  useEffect(() => {
    if(role !== "gast") {
      const id = setInterval(async () => {
      
        try {
          const response = await authFetch(
            `${process.env.REACT_APP_BACKEND_URL}get/accessToken`,
            { method: "GET" },
            language
          );
          if (response.ok) {
            await response.json();
          }
        } catch (e) {
          console.error("Ошибка при обновлении accessToken:", e);
        }
      }, 15 * 60 * 1000);
      return () => clearInterval(id);
    }
   
  }, [role]);
///////////////////////////////////////////////////////////////////////////////


  // получить список преподавателей (один раз)
  useEffect(() => {
    async function getTutors() {
      try {
        const data = await UserService.getTutors();
        if (data) {
          console.log(data);
          
          store.dispatch(ruSetTutors(data.data.data));
          store.dispatch(deSetTutors(data.data.data));
        }
      } catch (error) {
        console.error("Ошибка при получении списка преподавателей:", error);
      }
    }
    getTutors();
  }, []);

  const memoizedMessages = useMemo(() => messages, [messages]);

  const scrollToBlock = (ref: RefObject<HTMLDivElement>): void => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // создание директории на сервере для пользователя
  useEffect(() => {
    async function createDir() {
      if (user && (user?.email?.length ?? 0) > 0) {
        await FileService.createDir(user?.email);
      }
    }
    createDir();

  }, [user]);

 
/*
  useEffect(() => {
    if (
      role === "gast" &&
      (user?.email?.length === 0)
    )
      setIsLogined("notLogined");
    if (
      (role === "client" || role === "tutor") &&
      (user?.email?.length ?? 0) > 0 &&
      isAllowCookies
    )
      setIsLogined("logined");
  }, [user, isAllowCookies, role]);
  */

  // i18n локаль
  const locale = language === "german" ? "de" : "ru";

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {`
    {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalProgram",
      "name": "tutorsmd",
      "provider": {
        "@type": "Online Education",
        "name": "tutorsmd"
      },
      "occupationalCategory": ["Математика", "Немецкий"],
      "timeOfDay": "60-90 минут",
      "offers": [
        {
          "@type": "Lesson",
          "price": "20",
          "priceCurrency": "EUR",
          "description": "Математика, Mathe"
        },
        {
          "@type": "Lesson",
          "price": "15",
          "priceCurrency": "EUR",
          "description": "Немецкий, Deutsch"
        }
      ]
    }
    `}
        </script>
      </Helmet>

      <IntlProvider locale={locale} defaultLocale="ru">
        <Suspense
          fallback={<div className="text-center mt-10 text-lg">Загрузка...</div>}
        >
          <CanvasProvider pageId={0}>
            
             <BrowserRouter future={{ v7_relativeSplatPath: true }} basename="/">
                <Routes>
                  {/* Корень */}
                  <Route
                    path="/"
                    element={
                      !isAuthChecked ? (
                        <div className="text-center mt-10 text-lg">Загрузка...</div>
                      ) : isLoggedIn ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <App
                          setCurrentNameTutor={setCurrentNameTutor}
                          setCurrentSurnameTutor={setCurrentSurnameTutor}
                          currentNameTutor={currentNameTutor}
                          currentSurnameTutor={currentSurnameTutor}
                          scrollToBlock={scrollToBlock}
                          refQuestionWrite={refQuestionWrite}
                          setIsCabinetOpened={setIsCabinetOpened}
                          isCabinetOpened={isCabinetOpened}
                          isAllowCookies={isAllowCookies}
                        />
                      )
                    }
                  />

                  {
                    
                    <Route
                    path="/password/forgot/:link"
                    element={
                      <PasswordForgot />
                    }
                  />
                  
                  }
                  

                  <Route
                    path="/AboutUs"
                    element={
                      <AboutUs
                        
                        isCabinetOpened={isCabinetOpened}
                        setIsCabinetOpened={setIsCabinetOpened}
                        isLoginedClientCabinetOpened={isLoginedClientCabinetOpened}
                        isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened}
                        setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
                        setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
                        scrollToBlock={scrollToBlock}
                        refQuestionWrite={refQuestionWrite}
                        messages={messages}
                        setMessages={setMessages}
                      />
                    }
                  />

                  <Route
                    path="/PopularQuestions"
                    element={
                      <AlleQuestions
                        isCabinetOpened={isCabinetOpened}
                        setIsCabinetOpened={setIsCabinetOpened}
                        isLoginedClientCabinetOpened={isLoginedClientCabinetOpened}
                        isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened}
                        setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
                        setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
                        scrollToBlock={scrollToBlock}
                        messages={messages}
                        setMessages={setMessages}
                        refQuestionWrite={refQuestionWrite}
                      />
                    }
                  />


<Route
  path="/dashboard"
  element={
    <RequireAuth
      isAuthChecked={isAuthChecked}
      allow={(
        ((user?.email?.length ?? 0) > 0)
        && isAllowCookies
      )}
    >
      <CabinetPage
                          booking={booking}
                          setBooking={setBooking}
                          scrollToBlock={scrollToBlock}
                          refQuestionWrite={refQuestionWrite}
                          setIsCabinetOpened={setIsCabinetOpened}
                          isCabinetOpened={isCabinetOpened}
                          getLessons={getLessons}
                          lessons={lessons}
                          complaint={complaint}
                          setComplaint={setComplaint}
                          complaintSent={complaintSent}
                          setComplaintSent={setComplaintSent}
                          sendComplaint={sendComplaint}
                        />

                        
                         
                         

    </RequireAuth>
  }
/>


<Route
  path="/dashboard/gast/messages"
  element={
    <RequireAuth
      isAuthChecked={isAuthChecked}
      allow={(
        ((user?.email?.length ?? 0) > 0)
        && isAllowCookies
      )}
    >
      <MessagesFromGasts />
    </RequireAuth>
  }
/>

                 

<Route
  path="/dashboard/lessons/:randomLessonId"
  element={
    <RequireAuth
      isAuthChecked={isAuthChecked}
      allow={(
        (user?.email?.length ?? 0) > 0
        && isAllowCookies
      )}
    >
       <LessonsLive
                          booking={booking}
                          setBooking={setBooking}
                          participants={participants}
                          setParticipants={setParticipants}
                          localStream={localStream}
                          setLocalStream={setLocalStream}
                          bookingCompleted={bookingCompleted} setBookingCompleted={setBookingCompleted}
                          lessons={lessons}
                        />
    </RequireAuth>
  }
/>
      
{
  
<Route
  path="/dashboard/settings-account"
  element={
    <RequireAuth
      isAuthChecked={isAuthChecked}
      allow={(
        (user?.email?.length ?? 0 > 0)
        && isAllowCookies /*&& !!stripePromise*/
      )}
    >
                         {
                          /* <Elements stripe={stripePromise}> */
                         }
                          
                            <AccountSettings
                              isCabinetOpened={isCabinetOpened}
                              setIsCabinetOpened={setIsCabinetOpened}
                              isLoginedClientCabinetOpened={
                                isLoginedClientCabinetOpened
                              }
                              setIsLoginedClientCabinetOpened={
                                setIsLoginedClientCabinetOpened
                              }
                              isLoginedTutorCabinetOpened={
                                isLoginedTutorCabinetOpened
                              }
                              setIsLoginedTutorCabinetOpened={
                                setIsLoginedTutorCabinetOpened
                              }
                              scrollToBlock={scrollToBlock}
                              refQuestionWrite={refQuestionWrite}
                              messages={messages}
                              setMessages={setMessages}
                            />

                            {/* </Elements> */}
                          
                        
                      
    </RequireAuth>
  }
/>  
  
}


<Route
  path="/dashboard/check-device"
  element={
    <RequireAuth
      isAuthChecked={isAuthChecked}
      allow={(
        ((user?.email?.length ?? 0) > 0)
        && isAllowCookies
      )}
    >
         <MediaCheckPage />
    </RequireAuth>
  }
/>

                

                  <Route
                    path="/tutors"
                    element={
                      <AllTutorsPage
                        
                        messages={memoizedMessages}
                        setMessages={setMessages}
                        setCurrentNameTutor={setCurrentNameTutor}
                        setCurrentSurnameTutor={setCurrentSurnameTutor}
                        currentNameTutor={currentNameTutor}
                        currentSurnameTutor={currentSurnameTutor}
                        scrollToBlock={scrollToBlock}
                        refQuestionWrite={refQuestionWrite}
                        booking={booking}
                        setBooking={setBooking}
                        localStream={localStream}
                        setIsCabinetOpened={setIsCabinetOpened}
                        isCabinetOpened={isCabinetOpened}
                        getLessons={getLessons}
                        lessons={lessons}
                        hasRegularLessons={hasRegularLessons} setHasRegularLessons={setHasRegularLessons}
                        unavailableLessonsTime={unavailableLessonsTime}
                        isGetLessonsCalled={isGetLessonsCalled}
                        setIsGetLessonsCalled={setIsGetLessonsCalled}
                        complaint={complaint}
                        setComplaint={setComplaint}
                        complaintSent={complaintSent}
                        setComplaintSent={setComplaintSent}
                        sendComplaint={sendComplaint}
                      />
                    }
                  />

                  <Route
                    path="/PrivacyPolicy"
                    element={
                      <PrivacyPolicy
                        isCabinetOpened={isCabinetOpened}
                        setIsCabinetOpened={setIsCabinetOpened}
       
                        isLoginedClientCabinetOpened={isLoginedClientCabinetOpened}
                        setIsLoginedClientCabinetOpened={setIsLoginedClientCabinetOpened}
                        isLoginedTutorCabinetOpened={isLoginedTutorCabinetOpened}
                        setIsLoginedTutorCabinetOpened={setIsLoginedTutorCabinetOpened}
                        scrollToBlock={scrollToBlock}
                        refQuestionWrite={refQuestionWrite}
                        messages={messages}
                        setMessages={setMessages}
                      />
                    }
                  />



<Route
  path="/dashboard/liked-teachers"
  element={
    <RequireAuth
      isAuthChecked={isAuthChecked}
      allow={(
        ((user?.email?.length ?? 0) > 0)
        && isAllowCookies
      )}
    >
        <LikedTeachers
                          setCurrentNameTutor={setCurrentNameTutor}
                          setCurrentSurnameTutor={setCurrentSurnameTutor}
                          currentNameTutor={currentNameTutor}
                          currentSurnameTutor={currentSurnameTutor}
                          scrollToBlock={scrollToBlock}
                          refQuestionWrite={refQuestionWrite}
                          setIsCabinetOpened={setIsCabinetOpened}
                          isCabinetOpened={isCabinetOpened}
                          messages={messages}
                          setMessages={setMessages}
                        />
    </RequireAuth>
  }
/>

                  
                </Routes>
              </BrowserRouter>
             
          </CanvasProvider>
        </Suspense>
      </IntlProvider>
    </>
  );
}

function Home() {
  useEffect(() => {
    console.log("check");
    setGlobalStore(store);
  }, [store]);
  return (
    <Provider store={store}>
       <MainContent store={store} />
    </Provider>
  );
}

export default React.memo(Home);

