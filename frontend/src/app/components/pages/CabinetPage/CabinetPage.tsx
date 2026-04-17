import React, { ForwardedRef, FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import UpLinie from "../../Header/UpLinie";
import Grafik from "./Grafik";
import UserService from "../../../../app/services/UserService";
import { Button, Input } from "@mui/material";
import dayjs from "dayjs";
import Footer from "../../Footer/Footer";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import UsersChatService from "../../../services/UsersChatService";

const ArrowRight = require("../../../../assets/img/arrowRight.png");

import { Booking, Participant, WeeklyPlan } from "../../../interfaces/index";
import { useLanguage } from "../../../context/LanguageContext";
import { useSelector } from "react-redux";
import { selectRole, selectToken, selectUser } from "../../../store/selectors";
import LessonDisplay from "../allTutorsPage/lessonComponents/LessonDisplay";
import BookingCancelled from "../allTutorsPage/bookingComponents/BookingCancelled";


type Props = {
  booking: Booking | null,
  setBooking: (booking: Booking | null) => void,
  scrollToBlock: Function,
  refQuestionWrite: ForwardedRef<HTMLDivElement>,
  isCabinetOpened: string,
  setIsCabinetOpened: (isCabinetOpened: string) => void,
  lessons: WeeklyPlan[],
  getLessons: (client_email?: string, tutor_email?: string) => void,
  complaint: string,
  setComplaint: (complaint: string) => void,
  complaintSent: boolean,
  setComplaintSent: (complaintSent: boolean) => void,
  sendComplaint: () => void
}



const CabinetPage: FunctionComponent<Props> = ({
      booking, setBooking, 
      scrollToBlock, 
      refQuestionWrite, 
      isCabinetOpened, setIsCabinetOpened, 
      getLessons,
      lessons,
      complaint, setComplaint,
      complaintSent, setComplaintSent,
      sendComplaint
    }) => {

      const role = useSelector(selectRole);

/*
  useEffect(() => {
    if(tutorUse && tutorUse.email.length > 0) {setName(tutorUse.name); setEmail(tutorUse.email)};
    if(clientUse && clientUse.email.length > 0) {setName(clientUse.name); setEmail(clientUse.email)};
  }, [])

  let store: Store<State, ActionType> = createStore(russianReducer);
  let setAccessToken: (token: string) => ActionType;


useEffect(() => {
  if (language === 'russian') {
    store = createStore(russianReducer);
    setAccessToken = setRussianAccessToken;
  } else {
    store = createStore(germanReducer);
    setAccessToken = setGermanAccessToken;
  }
}, [language]);
  

  useEffect(() => {
    async function checkAuth() {
      const roleFromLocalStorage = localStorage.getItem("role");
  
      if (roleFromLocalStorage == "tutor" || roleFromLocalStorage == "client") {
        try {
          const accessToken = store.getState().accessToken;
          let user = await AuthService.checkAuth(roleFromLocalStorage, language, accessToken);

          if (!user) {
            console.error("Ответ не получен (undefined)");
            throw new Error("Нет соединения с сервером");
          }
          
          if (user.status >= 400) {
            throw new Error("Ошибка авторизации или refresh для клиента или пользователя");
          }
  
          if (user) {
            if (user.data.client) {
              setClientUse(user.data.client);
            } else if (user.data.tutor) {
              setTutorUse(user.data.tutor);
            }

            setUserToken(user.data.refreshtoken);
            const currentToken = (store.getState() as any).accessToken;
              if (user?.data?.accessToken && user.data.accessToken !== currentToken) {
                store.dispatch(setAccessToken(user.data.accessToken));
              }
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  
    if (clientUse && clientUse.email.length == 0 && tutorUse && tutorUse.email.length == 0) {
      checkAuth();
    }
  }, []);
  */
  
const { language } = useLanguage();
const user = useSelector(selectUser);
const userToken = useSelector(selectToken);

  const nearLessonsRef = useRef(null);
  const navigate = useNavigate();

  const [grid, setGrid] = useState<number>(0);




  const T = {
    teach: language === "german" ? "Unterrichtet" : "Преподает",
    reviewsOfStudents: language === "german" ? "Bewertung von Schülern: " : "Отзывы от учеников: ",
    chooseDate: language === "german" ? "Datum auswählen" : "Выбрать дату",
    chooseTime: language === "german" ? "Время выбрать" : "Выбрать время",
    subjectLabel: language === "german" ? "Fach" : "Предмет",
    nativeLangHeader: language === "german" ? "Ihre Heimatsprache" : "Ваш родной язык?",
    nativeLang: language === "german" ? "Heimatsprache" : "Родной язык",
    levelHeader: language === "german" ? "Welche Niveau haben Sie?" : "Какой уровень вы имеете?",
    levelLabel: language === "german" ? "Niveau" : "Уровень",
    book: language === "german" ? "Unterricht buchen" : "Забронировать урок",
    time: language === "german" ? "Unterrichtszeit" : "Время урока",
    join: language === "german" ? "Am Unterricht teilnehmen" : "Присоединиться к уроку",
    cancel: language === "german" ? "Unterricht absagen" : "Отменить урок",
    afterBooked: language === "german" ? "Sie haben Unterricht gebucht" : "Вы забронировали урок",
    whyCancelled: language === "german"
      ? "Was ist los? Teilen Sie mit uns, warum Sie den Unterricht abgesagt haben"
      : "Что случилось? Поделитесь с нами, почему Вы отменили урок",
    complaint: language === "german" ? "Senden" : "Отправить",
    afterComplaint: language === "german" ? "Unser Team hat Ihr Nachricht bekommen und wir bearbeiten dies so schnell wie möglich" : "Наша команда получила Ваше сообщение и мы обработаем ваше возражение как можно скорее",
    buttonsAfterComplaint: language === "german" ? ["Unterricht noch mal zu bronieren", "Anderen Lehrer zu finden"] : ["Забронировать урок еще раз", "Найти другого преподавателя"],
    afterCompletedBooking: language === "german" ? ["Ist das Probeunterricht gefallen? Bewerten Sie(können Sie überspringen)", "Wählen Sie Zeit für reguläre Unterrichte"] : ["Понравился пробный урок? Оцените его(можете пропустить)", "Выбирайте время для регулярных уроков"], 
    subjectsTitle: language === "german" ? "Fächer" : "Предметы",
    moreAboutYou: language === "german" ? "Erzähl bitte mehr über sich:" : "Расскажи больше о себе:",
    back: language === "german" ? "Zurück" : "Назад",
    next: language === "german" ? "Weiter" : "Дальше",
    writeReview: language === "german" ? "Schreib deine Bewertung" : "Напиши свой комментарий",
    reviewPH: language === "german" ? "Bewertung" : "Отзыв",
    send: language === "german" ? "Senden" : "Отправить",
    reviews: language === "german" ? "Bewertungen" : "Отзывы",
    showMore: language === "german" ? "Mehr zeigen" : "Показать больше",
    collapse: language === "german" ? "Aufrollen" : "Свернуть",
    likedLesson: language === "german" ? "Der Unterricht hat gefallen?" : "Понравился урок?",
    pickDays: language === "german" ? "Wähle Tage und Zeit" : "Выбери дни и время",
    pickDaysFirst: language === "german" ? "Wähle zuerst die Tage" : "Сначала выбери дни",
    changeDays: language === "german" ? "Tage ändern" : "Изменить дни",
    savePlan: language === "german" ? "Plan speichern" : "Сохранить расписание",
    messageForTutor: language === "german" ? "Legen Sie neue Account als Client an, um mit Tutoren zu lernen" : "Создайте новый аккаунт как клиент, чтобы заниматься с преподавателями"
  };


class TranslateClass {
 
  static header() {
    if(language == "german") return "Mein Fortschritt"
    if(language == "russian") return "Мой прогресс"    
  }

  static nearLessons() {
    if(language == "german") return "Meine nähere Unterrichte"
    if(language == "russian") return "Мои ближайшие уроки"
  }

  static time() {
    if(language == "german") return "Unterrichtsszeit"
    if(language == "russian") return "Время урока"
  }

  static cancelButton() {
    if(language == "german") return "Unterricht absagen"
    if(language == "russian") return "Отменить урок"
  }

  static joinLessonButton() {
    if(language == "german") return "Am Unterricht teilnehmen"
    if(language == "russian") return "Присоединиться к уроку"
  }

  static textAfterBronieren() {
    if(language == "german") return "Sie haben Unterricht broniert"
    if(language == "russian") return "Вы забронировали урок"
  }

  static questionAboutCancelledBooking() {
     if(language == "german") return "Was ist los? Teilen Sie mit uns, warum sie das Unterricht abgesagt haben"
     if(language == "german") return "Что случилось? Поделитесь с нами почему Вы отменили урок"
  }

  static findTeacher() {
       if(language == "german") return "Lehrer zu finden"
       if(language == "russian") return "Найти преподавателя"
  }

  static openUsersChat() {
    if(language == "german") return "Chat mit Users"
    if(language == "russian") return "Чат с преподавателями"
}
}





  useEffect(() => {
    async function getBooking() {
      try {

          if(user && user?.email.length > 0){
            const bookingResponse = await UserService.getBooking(user?.id, role);
            console.log(bookingResponse);
            if(bookingResponse != undefined || bookingResponse != null) {
              
              const bookingData = bookingResponse?.data;
              if (bookingData) {
                if(bookingData.status == "process") {
                  setBooking(bookingData)
                }
                
              } else {
                return;
              }
            } else {
              return;
            }
          }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    }
  
    getBooking();
  }, [user]);


const redirectToLesson = async (lessonid: string) => {
  try {
    navigate(`/dashboard/lessons/${lessonid}`);
  } catch (e) {
    console.log(e);
  }
};


/*
// useEffect отслеживает изменения состояния и выполняет переход, когда они обновятся
useEffect(() => {
  if (redirectDone && randomLessonId) {
    
    console.log("Emitting join event with:", userToken);

    console.log("Opening WebSocket connection...");
    
    const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";

    socketRef.current = io(backendURL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

        // Обрабатываем входящие обновления участников
        socketRef.current.on("updateParticipants", (participantList: string[]) => {
          console.log("Обновление участников:", participantList);
    
          setParticipants((prev: Participant[]) =>
            participantList.map((token) => ({
              userToken: token,
              stream: prev.find((p) => p.userToken === token)?.stream || null,
            }))
          );
        });

            // Получаем поток демонстрации экрана
    socketRef.current.on("shareScreen", (userId: string, streamId: string) => {
      console.log(`Пользователь ${userId} демонстрирует экран. Stream ID: ${streamId}`);
      // Обновляем участников с новым потоком экрана
      setParticipants((prev:Participant[]) =>
        prev.map((participant:Participant) =>
          participant.userToken === userId
            ? { ...participant, stream: localStream } // Привязываем поток
            : participant
        )
      );
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    if (userToken && randomLessonId) {
      console.log("Emitting join event with:", userToken, "Random:", randomLessonId);
  
      let email;
      if(clientUse && clientUse.email.length > 0) {
        email = clientUse.email
      } else if(tutorUse && tutorUse.email.length > 0) {
        email = tutorUse.email
      }
  
      if(email) {
        const roleFromLocalStorage = localStorage.getItem("role");
        socketRef.current.emit("joinLesson", {randomLessonId, userToken, email, role: roleFromLocalStorage});
      }
      
    }  

// Очистка
return () => {
  socketRef.current?.off("joinLesson");
};



  }
}, [redirectDone, randomLessonId, userToken]); // Выполнится при изменении этих состояний
*/


/*
  // Навигация в видео-комнату
  useEffect(() => {
    if (redirectDone) {
      navigate(`/dashboard/lessons/${lessonid}`);
    }
  }, [booking, lessons, navigate, redirectDone]);
*/



  useEffect(() => {
     if(window.innerWidth < 600) {
      setGrid(1);
     } else {
      setGrid(2);
     }
  }, [window.innerWidth]);

  function monthFunc() {
  // console.log(new Date(booking?.datetime));
  let month = dayjs(booking?.datetime).format("MM");

  if(month == "01") {
    if(language == "german") return "Januar";
    if(language == "russian") return "Января";
  }
  if(month == "02") {
    if(language == "german") return "Februar";
    if(language == "russian") return "Февраля";
  }
  if(month == "03") {
    if(language == "german") return "März";
    if(language == "russian") return "Марта";
  }
  if(month == "04") {
    if(language == "german") return "April";
    if(language == "russian") return "Апреля";
  }
  if(month == "05") {
    if(language == "german") return "Mai";
    if(language == "russian") return "Мая";
  }
  if(month == "06") {
    if(language == "german") return "Juni";
    if(language == "russian") return "Июня";
  }
  if(month == "07") {
    if(language == "german") return "Juli";
    if(language == "russian") return "Июля";
  }

  if(month == "08") {
    if(language == "german") return "August";
    if(language == "russian") return "Августа";
  }

  if(month == "09") {
    if(language == "german") return "September";
    if(language == "russian") return "Сентября";
  }

  if(month == "10") {
    if(language == "german") return "Oktober";
    if(language == "russian") return "Октября";
  }

  if(month == "11") {
    if(language == "german") return "November";
    if(language == "russian") return "Ноября";
  }

  if(month == "12") {
    if(language == "german") return "Dezember";
    if(language == "russian") return "Декабря";
  }
  
  };


 /*
      const cancelBooking = async () => {
      try {
        if (booking) { // Проверка, что dateTime заполнен
          // Преобразуем dateTime в строку перед отправкой на сервер
          const response = await UserService.cancelBooking(
            userToken, 
            "", 
            booking.datetime,
            booking.lessonid
          );
  
          if(response) {
            console.log("Урок отменен!");
            setBooking(null);
          }
          
  
        } 
      } catch (e) {
        console.log(e);
      }
    };
*/
const cancelBooking = async () => {
  try {
    if (booking && booking.datetime && booking.lessonid) {
      await UserService.cancelBooking(user.id, booking.lessonid);
      
   }
  } catch (e) {
    console.log(e);
  }
};

useEffect(() => {
  async function run() {
    await getLessons(user?.email);
  }
  run();
}, []);


const openUsersChat = async () => {
  try {
    const role = localStorage.getItem("role");
    if(role) {
      const response = await UsersChatService.ticket(role, user?.email); // accessToken подставится автоматически
      console.log(response);
      if(response && response.ticket) {
        const { ticket } = response;
  
        if (ticket) {
          // window.location.href = `https://userschat.tutorsmd.net/sso/consume?ticket=${ticket}`;
          window.location.href = `http://localhost:5173/sso/consume?ticket=${ticket}/chats`;
        }
    }
    
    }
    
  } catch (err) {
    console.error("Ошибка создания билета:", err);
    alert("Не удалось открыть чат. Попробуй снова.");
  }
};

useEffect(() => {
    console.log(booking);
    console.log(lessons);
}, [userToken, user, booking, lessons]);




return (
  <div className="cabinet">
    {/* HEADER */}
    <div className="header">
      <UpLinie
        scrollToBlock={scrollToBlock}
        refQuestionWrite={refQuestionWrite}
        setIsCabinetOpened={setIsCabinetOpened}
        isCabinetOpened={isCabinetOpened}
      />
    </div>

    {/* MAIN */}
    <div className="mainContent">
      {user?.email?.length > 0 && (
        <div
          className={`grid gap-6 ${
            grid === 2
              ? 'grid-cols-2'
              : grid === 3
              ? 'grid-cols-3'
              : 'grid-cols-1'
          }`}
        >
          {/* LEFT COLUMN */}
          <Grafik email={user.email} userToken={userToken} />

          {/* RIGHT COLUMN */}
          <div>
            <h3 className="text-xl text-center">
              {TranslateClass.nearLessons()}
            </h3>

            <div className="nearLessons mt-4 w-fit" ref={nearLessonsRef}>
              {/* EMPTY STATE */}
              {!booking && (!lessons || lessons.length === 0) && (
                <div className="min-h-[60px] flex justify-center">
                  <Button
                    component={Link}
                    to={`${process.env.REACT_APP_CLIENT_URL}/tutors`}
                    color="warning"
                    className="findTeacher flex items-center m-4 text-center duration-300"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'orange',
                        color: 'white',
                      },
                    }}
                    style={{ height: '50px' }}
                  >
                    {TranslateClass.findTeacher()}
                    <span className="ml-2">
                      <img
                        alt="right"
                        src={ArrowRight}
                        style={{ width: '40px', height: '40px' }}
                      />
                    </span>
                  </Button>
                </div>
              )}

              {/* BOOKING */}
              {booking && (
                <>
                  {booking.status === 'process' && (
                    <div
                      className="p-2 w-fit rounded-lg"
                      style={{
                        boxShadow:
                          '0 0 2rem rgba(0,0,0,0.075), 0 1rem 1rem -1rem rgba(0,0,0,0.1)',
                      }}
                    >
                      <strong>
                        {dayjs(booking.datetime).format('DD')} {monthFunc()}
                      </strong>
                      ,{' '}
                      <strong>
                        {dayjs(booking.datetime).format('HH:mm')}
                      </strong>

                      <div className="flex mt-2">
                        <Button
                          color="error"
                          onClick={cancelBooking}
                          className="m-2 p-2 duration-300"
                        >
                          {TranslateClass.cancelButton()}
                        </Button>

                        <Button
                          component={Link}
                          to={`${process.env.REACT_APP_CLIENT_URL}/dashboard/lessons/${booking.lessonid}`}
                          color="success"
                          className="m-2 p-2 duration-300"
                        >
                          {TranslateClass.joinLessonButton()}
                        </Button>
                      </div>
                    </div>
                  )}

                  {booking.status === 'cancelled' && (
                      <BookingCancelled 
                        booking={booking} setBooking={setBooking}
                        complaintSent={complaintSent} setComplaintSent={setComplaintSent} setComplaint={setComplaint} sendComplaint={sendComplaint}
                        T={T} />
                      
                  )}

                  {booking.status === 'completed' && (
                    <div className="min-h-[60px] flex justify-center">
                      <Button
                        component={Link}
                        to={`${process.env.REACT_APP_CLIENT_URL}/tutors`}
                        color="success"
                        className="findTeacher flex items-center m-4 duration-300"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'orange',
                            color: 'white',
                          },
                        }}
                        style={{ height: '50px' }}
                      >
                        {TranslateClass.findTeacher()}
                        <span className="ml-2">
                          <img
                            alt="right"
                            src={ArrowRight}
                            style={{ width: '40px', height: '40px' }}
                          />
                        </span>
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* LESSONS */}
              {lessons && lessons.length > 0 && !booking && (
                <div className="mt-4">
                  <LessonDisplay lessons={lessons} goToLesson={redirectToLesson} T={T} />
                </div>
              )}
            </div>

            {/* CHAT */}
            <Button
              color="primary"
              className="chatusers flex m-4 text-center duration-300"
              sx={{
                '&:hover': {
                  backgroundColor: 'green',
                  color: 'white',
                },
              }}
              style={{ height: '50px' }}
              onClick={openUsersChat}
            >
              {TranslateClass.openUsersChat()}
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* FOOTER */}
    <Footer refQuestionWrite={refQuestionWrite} />
  </div>
)}


export default React.memo(CabinetPage);
