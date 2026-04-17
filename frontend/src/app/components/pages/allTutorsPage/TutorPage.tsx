// TutorPage.tsx
"use client";
import React, {
  ForwardedRef,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { SelectChangeEvent } from "@mui/material/Select";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import UpLinie from "../../Header/UpLinie";
import Footer from "../../Footer/Footer";
import Selfi from "../../Body/Tutors/Tutor/TutorDevice/TutorComponents/Selfi";
import BookingCompleted from "./bookingComponents/BookingCompleted";
import BookingProcess from "./bookingComponents/bookingProcess";
import BookingCancelled from "./bookingComponents/BookingCancelled";


import UserService from "../../../services/UserService";
import type { AxiosResponse } from "axios";
import type { BookingResponse } from "@/app/models/response/BookingResponse";
import type { ReviewResponse } from "@/app/models/response/ReviewResponse";

import "./TutorPage.css";

import LessonDisplay from "./lessonComponents/LessonDisplay";
import StepDate from "./bookingComponents/Start/StepDate";
import StepTime from "./bookingComponents/Start/StepTime";
import StepForm from "./bookingComponents/Start/StepForm";
import Reviews from "./Reviews";
import { useSelector } from "react-redux";

import { Message, Booking, Participant, Tutor, Review } from "../../../interfaces/index";
import { selectRole, selectToken, selectUser } from "../../../store/selectors";
import { useLanguage } from "../../../context/LanguageContext";

const ImageSelfi = require("assets/img/FotoLebenslauf.jpg");



type Level = {
  title: string;
  description: string;
};


type Props = {
  messages: Message[];
  setMessages: (m: Message[]) => void;
  setCurrentNameTutor: (v: string) => void;
  setCurrentSurnameTutor: (v: string) => void;
  booking: Booking | null;
  setBooking: (b: Booking | null) => void;
  scrollToBlock: Function;
  localStream: MediaStream | null;
  refQuestionWrite: ForwardedRef<HTMLDivElement>;
  setIsCabinetOpened: (isCabinetOpened: string) => void;
  isCabinetOpened: string;
  nameSearch: string;
  surnameSearch: string;
  getLessons: (client_email?: string, tutor_email?: string) => void;
  lessons: WeeklyPlan[],
  hasRegularLessons: boolean, 
  setHasRegularLessons: (hasRegularLessons: boolean) => void,
  unavailableLessonsTime: WeeklyPlan[],
  isGetLessonsCalled: boolean,
  setIsGetLessonsCalled: (isGetLessonsCalled:boolean) => void,
  complaint: string,
  setComplaint: (complaint: string) => void,
  complaintSent: boolean,
  setComplaintSent: (complaintSent: boolean) => void,
  sendComplaint: () => void
};



// ---- constants/helpers ----
const COMMENTS_PER_PAGE = 5;
const ITEMS_PER_PAGE = 3;

const daysOfWeek = [
  { key: "mon", dow: 1, ru: "Пн", de: "Mo" },
  { key: "tue", dow: 2, ru: "Вт", de: "Di" },
  { key: "wed", dow: 3, ru: "Ср", de: "Mi" },
  { key: "thu", dow: 4, ru: "Чт", de: "Do" },
  { key: "fri", dow: 5, ru: "Пт", de: "Fr" },
  { key: "sat", dow: 6, ru: "Сб", de: "Sa" },
  { key: "sun", dow: 7, ru: "Вс", de: "So" },
];

type WeeklyPlan = {
  id: number;
  lessonid: string;
  client_email: string;
  tutor_email: string;
  status: string;
  datetime: {
    timezone: string;
    subjects: Record<
      string,
      Array<{ dow: number; time: string; status: string }>
    >;
  };
};






const TutorPage: FunctionComponent<Props> = (props) => {

  const {
    booking,
    setBooking,
    scrollToBlock,
    refQuestionWrite,
    setIsCabinetOpened,
    isCabinetOpened,
    nameSearch,
    surnameSearch,
    getLessons,
    lessons,
    hasRegularLessons, 
    setHasRegularLessons,
    unavailableLessonsTime,
    complaint, setComplaint,
    complaintSent, setComplaintSent,
    sendComplaint
  } = props;

  const navigate = useNavigate();
  const lesson = lessons[0] ?? null;

////////// STORE ///////////////////////////////////////
  const user = useSelector(selectUser);
  const { language } = useLanguage();
  const role = useSelector(selectRole);
/////////////////////////////////////////////////////////

  // ---- responsive ----
  const [isTwoCols, setIsTwoCols] = useState<boolean>(true);
  const [isNarrow, setIsNarrow] = useState<boolean>(false);

  
  

  useEffect(() => {
    const apply = () => {
      console.log(window.innerWidth);
      (window.innerWidth >= 980) ? setIsTwoCols(true): setIsTwoCols(false);
      setIsNarrow(window.innerWidth <= 500);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // ---- state ----
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
const [reviewsTotal, setReviewsTotal] = useState<number>(0);
const [myReview, setMyReview] = useState<Review | null>(null);


  const [date, setDate] = useState<Dayjs | null>(dayjs().add(1, "day"));
  const [dateTime, setDateTime] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [step, setStep] = useState<"date" | "time" | "form" | null>("date");
  const [isBronierenLessonWindowOpened, setIsBronierenLessonWindowOpened] = useState<boolean>(false);
  const [isBookingLoading, setIsBookingLoading] = useState(true);
  const didFetch = useRef(false);


  // анкета
  const [currentSubject, setCurrentSubject] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [gradeFlex, setGradeFlex] = useState<string>("");

  useEffect(() => {
     (window.innerWidth > 650) ? setGradeFlex("flex") : setGradeFlex("");
  }, []);

  // отзыв
  const [currentReview, setCurrentReview] = useState<string>("");
  const [visibleCountReviews, setVisibleCountReviews] = useState<number>(COMMENTS_PER_PAGE);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [currentGrade, setCurrentGrade] = useState<number>(0);

  // пагинация времени
  const [startIndex, setStartIndex] = useState<number>(0);

  // booking


  const [scheduleBySubject, setScheduleBySubject] = useState<Record<string, {
    selectedDays: string[];
    times: Record<string, string>; // ключ = день, значение = время
  }>>({});
  // Активный предмет для расписания регулярных занятий
// const [activeRegularSubject, setActiveRegularSubject] = useState<string | null>(null);
const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

const [isExistsLessonsChecked, setIsExistsLessonsChecked] = useState<boolean>(false);



// ✅ Вкл/выкл предмет
const toggleSubjectSelection = (subject: string) => {
  setSelectedSubjects(prev => {
    // Если уже был выбран → убираем
    if (prev.includes(subject)) {
      const updated = prev.filter(s => s !== subject);

      // ❌ Удаляем расписание для предмета
      setScheduleBySubject(prevSchedule => {
        const copy = { ...prevSchedule };
        delete copy[subject];
        return copy;
      });

      // ❌ Закрываем аккордеон, если он был открыт
      if (expandedSubject === subject) {
        setExpandedSubject(null);
      }

      return updated;
    }

    // ✅ Добавляем предмет
    setScheduleBySubject(prevSchedule => ({
      ...prevSchedule,
      [subject]: prevSchedule[subject] || { selectedDays: [], times: {} }
    }));
    return [...prev, subject];
  });
};

// ✅ Открыть/закрыть аккордеон
const toggleExpand = (subject: string) => {
  setExpandedSubject(prev => prev === subject ? null : subject);
};

// ✅ Выбор дня
const toggleDayForSubject = (subject: string, dayKey: string) => {
  setScheduleBySubject(prev => {
    const subj = prev[subject] || { selectedDays: [], times: {} };
    const selectedDays = subj.selectedDays.includes(dayKey)
      ? subj.selectedDays.filter(d => d !== dayKey)
      : [...subj.selectedDays, dayKey];

    // если день убрали — удалить время
    const times = { ...subj.times };
    if (!selectedDays.includes(dayKey)) delete times[dayKey];

    return {
      ...prev,
      [subject]: { selectedDays, times }
    };
  });
};

// ✅ Выбор времени
const pickTimeForSubjectDay = (subject: string, dayKey: string, time: string) => {
  setScheduleBySubject(prev => ({
    ...prev,
    [subject]: {
      ...prev[subject],
      times: {
        ...prev[subject].times,
        [dayKey]: time
      }
    }
  }));
};



/*
const toggleRegularSubject = (subject: string) => {
  setActiveRegularSubject(prev => {
    // Если нажали повторно - снимаем выбор
    if (prev === subject) return null;
    return subject;
  });
  

  // Если предмет ещё не был добавлен в расписание — создаём структуру
  setScheduleBySubject(prev => {
    if (!prev[subject]) {
      return {
        ...prev,
        [subject]: { selectedDays: [], times: {} }
      };
    }
    return prev;
  });
};
*/







  const onSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
  
    if (!scheduleBySubject[subject]) {
      setScheduleBySubject(prev => ({
        ...prev,
        [subject]: { selectedDays: [], times: {} }
      }));
    }
  };

  /*
  const toggleDayForSubject = (subject: string, day: string) => {
    setScheduleBySubject(prev => {
      const subj = prev[subject] || { selectedDays: [], times: {} };
      const selectedDays = subj.selectedDays.includes(day)
        ? subj.selectedDays.filter(d => d !== day)
        : [...subj.selectedDays, day];
      const times = { ...subj.times };
      if (!selectedDays.includes(day)) delete times[day];
      return { ...prev, [subject]: { selectedDays, times } };
    });
  };
  */
  
  
  
  

  
  // refs
  const refLessonTimeBlock = useRef<HTMLDivElement | null>(null);

  /*
   // auth check (как у тебя было, почистил ошибки)
   useEffect(() => {
    const role = localStorage.getItem("role");
    const run = async () => {
      try {
        if (role === "tutor" || role === "client") {
          const user = await AuthService.checkAuth(role, language, accessToken);
          if (user?.data?.client) setClientUse(user.data.client);
          if (user?.data?.tutor) setTutorUse(user.data.tutor);
          if (user?.data?.refreshtoken) setUserToken(user.data.refreshtoken);
          const currentToken = (store.getState() as any).accessToken;
          if (user?.data?.accessToken && user.data.accessToken !== currentToken) {
            store.dispatch(setAccessTokenAction(user.data.accessToken));
          }
        } else if (role !== "gast") {
          localStorage.removeItem("gastToken");
          const user = await AuthService.getOneClientByAccessToken();
          if (user?.data?.client) setClientUse(user.data.client);
          if (user?.data?.person) setTutorUse(user.data.person);
          if (user?.data?.refreshToken) setUserToken(user.data.refreshToken);
          const currentToken = (store.getState() as any).accessToken;
          if (user?.data?.accessToken && user.data.accessToken !== currentToken) {
            store.dispatch(setAccessTokenAction(user.data.accessToken));
          }
        }
      } catch (e) {
        console.log(e);
      }
    };

    if (!clientUse?.email && !tutorUse?.email) run();
  }, []);
  */


  // загрузка репетитора
  const getTutor = useCallback(async () => {
    console.log(nameSearch);
    console.log(surnameSearch);
    console.log(language);
    const tutorResponse = await UserService.getTutor(nameSearch, surnameSearch, language);
    console.log(tutorResponse);
    const tutorData = tutorResponse?.data.data as Tutor | null;
    if (tutorData) {
      setTutor(tutorData);
    }
    return tutorData;
  }, []);

  useEffect(() => {
    (async () => {
      await getTutor();
    })();
  }, [getTutor]);
  
  

 

  /*
  // редирект, если нет query name/surname
  const linkToTutorsList = useCallback(() => {
    if (!tutor) return;
    if (language === "german") {
      navigate(`/tutors?name=${tutor.namegerman}&surname=${tutor.surnamegerman}`);
    } else {
      setCurrentNameTutor(tutor.name);
      setCurrentSurnameTutor(tutor.surname);
      navigate(`/tutors?name=${tutor.name}&surname=${tutor.surname}`);
    }
  }, [tutor, language]);
*/

  /*
  useEffect(() => {
    if (!tutor) return;
    const href = window.location.href;
    const hasParams = href.includes("name") && href.includes("surname");
    if (!hasParams) {
      linkToTutorsList();
    } else {
      localStorage.removeItem("currentNameTutor");
      localStorage.removeItem("currentSurnameTutor");
    }
  }, [tutor, language, linkToTutorsList]);
*/

  // время — генерация и фильтрация
  const timeBlocks = useMemo(() => {
    const blocks: string[] = [];
    let t = dayjs().hour(9).minute(0).second(0);
    const end = dayjs().hour(18).minute(0).second(0);
    while (t.isBefore(end) || t.isSame(end)) {
      blocks.push(t.format("HH:mm"));
      t = t.add(30, "minute");
    }
    return blocks;
  }, []);

  const now = dayjs();
  const filteredTimes = useMemo(() => {

    if (booking?.status === "completed" && isBronierenLessonWindowOpened) {
      // показывать ВСЕ доступные слоты, без фильтра по дате
      return timeBlocks;
    }
    
    if (!date) return [];
    if (!dayjs(date).isSame(now, "day")) return timeBlocks;
    return timeBlocks.filter((time) => {
      const [h, m] = time.split(":").map(Number);
      const slot = dayjs().hour(h).minute(m);
      return slot.isAfter(now) || slot.isSame(now, "minute");
    });
  }, [date, now, timeBlocks]);

  const visibleTimes = useMemo(() => filteredTimes.slice(startIndex, startIndex + ITEMS_PER_PAGE), [filteredTimes, startIndex]);

  const handlePrev = () => setStartIndex((s) => Math.max(0, s - ITEMS_PER_PAGE));
  const handleNext = () => setStartIndex((s) => (s + ITEMS_PER_PAGE >= filteredTimes.length ? s : s + ITEMS_PER_PAGE));

  const handleDateChange = (newDate: Dayjs | null) => {
    const onlyDay = (newDate || dayjs()).startOf("day");
    setDate(onlyDay);
    setDateTime(onlyDay);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (time && date) {
      const [hours, minutes] = time.split(":").map(Number);
      setDateTime(dayjs(date).hour(hours).minute(minutes));
    }
  };

  const goNext = () => {
    if (step === "date") setStep("time");
    else if (step === "time") setStep("form");
  };
  
  const goBack = () => {
    if (step === "form") setStep("time");
    else if (step === "time") setStep("date");
  };
  

  // анкета: уровни
  const languagesChooseRussian = ["Английский", "Немецкий", "Русский", "Украинский"];
  const languagesChooseGerman = ["Englisch", "Deutsch", "Russisch", "Ukrainisch"];

  const levels: Level[] | undefined = useMemo(() => {
    if (!tutor) return undefined;
    if (language === "german") {
      if (currentSubject === "Mathe") {
        return [
          { title: "Grundniveau", description: "Zählen, Grundrechenarten, Brüche." },
          { title: "Durchschnitt", description: "Aufgaben mit Modulen, einfache Geometrie." },
          { title: "Überdurchschnitt", description: "Gleichungen, Graphen, Pythagoras, Flächen." },
          { title: "Hochniveau", description: "Logarithmen, Ableitung/Integral, Trigonometrie." },
        ];
      }
      if (currentSubject === "Deutsch") {
        return [
          { title: "Keine Ahnung", description: "Niveau unklar." },
          { title: "A0", description: "Noch nie gelernt." },
          { title: "A1", description: "Sehr einfache Kommunikation." },
          { title: "A2", description: "Einfache Sätze verstehen/sprechen." },
          { title: "B1", description: "Alltägliche Themen." },
          { title: "B2", description: "Spontan und komplexer Inhalt." },
          { title: "C1", description: "Sicher und flexibel, privat/beruflich." },
        ];
      }
    } else {
      if (currentSubject === "Математика") {
        return [
          { title: "Начальный уровень", description: "Счёт, базовые операции, дроби." },
          { title: "Средний уровень", description: "Модуль, простая геометрия." },
          { title: "Выше среднего уровень", description: "Уравнения, графики, Пифагор, площади." },
          { title: "Высокий уровень", description: "Логарифмы, производная/интеграл, тригонометрия." },
        ];
      }
      if (currentSubject === "Немецкий") {
        return [
          { title: "Не знаю", description: "Пока не понимаю свой уровень." },
          { title: "A0", description: "Никогда не учил." },
          { title: "A1", description: "Очень простые фразы." },
          { title: "A2", description: "Простая коммуникация." },
          { title: "B1", description: "Популярные бытовые темы." },
          { title: "B2", description: "Спонтанная речь, сложный контент." },
          { title: "C1", description: "Свободно и уверенно, приват/работа." },
        ];
      }
    }
    return [];
  }, [currentSubject, language, tutor]);

  const TitleChange = (event: SelectChangeEvent<string>) => {
    const found = (levels || []).find((l) => l.title === event.target.value);
    setCurrentLevel(found || null);
  };

  // бронирование
  const monthName = (d: Dayjs) => {
    const map: Record<string, { de: string; ru: string }> = {
      "01": { de: "Januar", ru: "Января" },
      "02": { de: "Februar", ru: "Февраля" },
      "03": { de: "März", ru: "Марта" },
      "04": { de: "April", ru: "Апреля" },
      "05": { de: "Mai", ru: "Мая" },
      "06": { de: "Juni", ru: "Июня" },
      "07": { de: "Juli", ru: "Июля" },
      "08": { de: "August", ru: "Августа" },
      "09": { de: "September", ru: "Сентября" },
      "10": { de: "Oktober", ru: "Октября" },
      "11": { de: "November", ru: "Ноября" },
      "12": { de: "Dezember", ru: "Декабря" },
    };
    const m = d.format("MM");
    return language === "german" ? map[m].de : map[m].ru;
  };


  const handleBooking = async () => {
    try {
      if (!tutor || !dateTime || !language || !currentLevel || !currentSubject) return;
      if (!(user?.email)) {
        setIsCabinetOpened("block");
        return;
      }
      const response: AxiosResponse<BookingResponse> = await UserService.bookings(
        user?.id,
        tutor.email,
        dateTime.toISOString(),
        String(user?.email),
        role
      );

      console.log(response.data);

      if(response.status === 409 && response.data.message === "Already booked") {
        // setIsBookedBooking(true);
        return;
      }
      if (response?.data?.booking) {
        console.log(response.data.booking)
        // Если booking это массив, берем первый элемент, иначе сам объект
        const bookingData = Array.isArray(response.data.booking) 
          ? response.data.booking[0] 
          : response.data.booking;
        setBooking(bookingData as unknown as Booking);
        setStep(null);
        
      }
    } catch (e) {
      console.log(e);
    }
  };

 
    async function getBooking(tutor: Tutor) { 
      try { 

        console.log("GET BOOKING");
        setIsBookingLoading(true);

          if (user?.email.length > 0) { 
            
            const bookingResponse = await UserService.getBooking(user?.id, role, tutor.email); 
            const bookingData = bookingResponse?.data;
           
            console.log(bookingResponse);
            if (bookingData != null && bookingData != undefined) {
              console.log(bookingResponse);
              console.log(bookingData);
              if(!isExistsLessonsChecked) {
                /*
                   const lessonsByTutor = await getLessons(clientUse.email, tutor.email);

                   if(lessonsByTutor != undefined || lessonsByTutor != null) {
                    setIsExistsLessonsChecked(true);
                    setStep(null);
                  } 
                    */
                  setBooking(bookingData); 
              }
              

             
              
              
              console.log(bookingData);
              console.log(booking);
                
           } 
            else { 
              setBooking(null);
              console.log("else")
              setStep("date");
              
            }; 
          } 
        
      } catch (error) { 
        console.log("Error fetching bookings:", error); 
      } finally {
        // После любого исхода — снимаем флаг загрузки
        console.log("FINALYYYYYYyyy");
        setIsBookingLoading(false);
      }
    } 

    
 
    

  useEffect(() => {
    console.log(tutor);
    console.log(user);
    if (!tutor || !user?.id) {setIsBookingLoading(false); return};
    if (didFetch.current) {setIsBookingLoading(false); return};
    didFetch.current = true;
  console.log("CALLLLLLLL");
    getBooking(tutor); // твоя асинхронная функция
    // getLessonsScheduleByTutor();
  }, [tutor, user?.id]);

  useEffect(() => {
    didFetch.current = false;
  }, [tutor?.email]);

  useEffect(() => {
    console.log(booking)
  }, [booking]) 

 
  

  const cancelBooking = async () => {
    try {
      if (!booking) return;
      await UserService.cancelBooking(user.id, booking.lessonid);
      
    } catch (e) {
      console.log(e);
    }
  };

  

  // переход в комнату

  ////// НАДО ПОДУМАТЬ КАК ГРАМОТНО ОПРЕДЕЛЯТЬ ЭТО ПРОБНЫЙ УРОК ИЛИ РЕГУЛЯРНОЕ ЗАНЯТИЕ
  const goToLesson = (type:string) => {
    let lessonid:string = "";
    const first = lessons[0];
    if(type == "booking" && booking) {
      lessonid = booking.lessonid;
    } 
    else if (type === "lesson" && first && first.datetime?.subjects) {
      lessonid = first.lessonid;
    }
      if ((user?.email) && lessonid.length > 0) {
        navigate(`/dashboard/lessons/${lessonid}`);
      } else {
        setIsCabinetOpened("block");
      }
    };

  // отзывы
  const renderStars = (g: number) => {
    const arr = [];
    const full = Math.floor(g);
    const half = g % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) arr.push(<FaStar key={i} className="text-yellow-400" />);
      else if (i === full && half) arr.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      else arr.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
    return arr;
  };

  const Star = ({ filled, size = 24 }: { filled: boolean; size?: number }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ cursor: "pointer", transition: "fill 0.2s", fill: filled ? "#facc15" : "#fff", stroke: "#facc15", strokeWidth: 2 }}
    >
      <path d="M12 .587l3.668 7.431L24 9.75l-6 5.848L19.335 24 12 20.202 4.665 24 6 15.598 0 9.75l8.332-1.732z" />
    </svg>
  );


  const getReviews = useCallback(async () => {
    if (!tutor) return;
  
    const res = await UserService.getTutorReviews(tutor.id, COMMENTS_PER_PAGE, 0);
    if(!res) return;
    setReviews(res.data.items);
    setReviewsTotal(res.data.total);
  }, [tutor]);

  const getMyReview = useCallback(async () => {
    if (!tutor || !user) return;
  console.log(tutor.id);
    const res = await UserService.getMyReview(tutor.id);
    if(!res) return;
    setMyReview(res.data.review);
  }, [tutor, user]);

  useEffect(() => {
     console.log(myReview);
  }, [myReview])
   

  const submitReview = async () => {
    if (!tutor) return;
  
    if (!user) {
      setIsCabinetOpened("block");
      return;
    }
  
    console.log(tutor);
    console.log(currentGrade);
    console.log(currentReview);
    console.log(myReview);
    
    if (myReview) {
      console.log("edit");
      if(myReview.grade == currentGrade && myReview.comment == currentReview) return;
      console.log("edit 2");
      await UserService.editReview(
        myReview.id,
        currentGrade,
        currentReview
      );
    } else {
      console.log("new")
      await UserService.sendReview(
        tutor.id,
        currentGrade,
        currentReview
      );
    }
  
    setCurrentReview("");
    setCurrentGrade(0);
  
    await getReviews();
    await getMyReview();
  };
  

  useEffect(() => {
    if (!tutor) return;
    getReviews();
    getMyReview();
  }, [tutor, getReviews, getMyReview]);




  const finalizeRegularSchedule = async () => {
    if (!booking || !tutor) return;
  
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  
    const subjectsPlan = Object.fromEntries(
      Object.entries(scheduleBySubject).map(([subject, data]) => [
        subject,
        data.selectedDays.map(dayKey => {
          const day = daysOfWeek.find(d => d.key === dayKey)!;
          return { dow: day.dow, time: data.times[dayKey], status: "process" };
        })
      ])
    );
  

    type SchedulePlan = {
      timezone: string;
      subjects: Record<string, Array<{ dow: number; time: string; status: string }>>;
    };
    
    const plan: SchedulePlan = { timezone: tz, subjects: subjectsPlan };
    
  
    try {
      const response = await UserService.setLessonSchedule(
        booking.lessonid,
        plan,
        user?.email,
        tutor.email
      );
  
      if (response?.data) {
        setSelectedSubjects([]);
        setScheduleBySubject({});
        setExpandedSubject(null);
        const responseDeleteBooking = await UserService.deleteBooking(user.id, booking.lessonid, role);
  
        if (getLessons && user?.email && tutor.email && responseDeleteBooking && responseDeleteBooking.data) {
          await getLessons(user?.email, tutor.email); // ✅ теперь lessons обновятся
          setHasRegularLessons(true);
          setBooking(null);
        }
      }
    } catch (error) {
      console.error("Ошибка при сохранении расписания:", error);
    }
  };

  useEffect(() => {
    const lesson = lessons[0];
    if (lesson && lesson.datetime?.subjects) {
      setHasRegularLessons(Object.keys(lesson.datetime.subjects).length > 0);
    } else {
      setHasRegularLessons(false);
    }
  }, [lessons]);
  
  
  
  // тексты
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
    edit: language === "german" ? "Ändern Bewertung" : "Изменить комментарий",
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

  // Subjects chip list
  const SubjectsTutor = () => {
    if (!tutor) return null;
    const list =
      language === "german" ? tutor.availableSubjects?.de || tutor.availableSubjects?.["de"] : tutor.availableSubjects?.ru || tutor.availableSubjects?.["ru"];
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {(list || []).map((subject: string, idx: number) => (
          <span key={idx} className="text-blue-600 text-sm">
            <span className="bg-yellow-400/90 shadow px-2 py-1 rounded">{subject}</span>
          </span>
        ))}
      </div>
    );
  };

  // имя репетитора
  const NameTutor = () => {
    if (!tutor) return null;
    const full = language === "german" ? `${tutor.namegerman} ${tutor.surnamegerman}` : `${tutor.name} ${tutor.surname}`;
    return <p className={`text-center font-bold ${isNarrow ? "text-xl" : "text-2xl"}`}>{full}</p>;
  };

  const reviewsVisible = reviews.slice(0, visibleCountReviews);


 useEffect(() => {
  async function run() {
    if (user?.email && tutor) {
      getLessons(user?.email, tutor.email); 
      if(booking && hasRegularLessons) {
        await UserService.deleteBooking(user.id, booking.lessonid, role);
        setBooking(null);
        console.log("LESSSSSSSSONNSSS");
        console.log(lessons);
      }
    }
  } 
  

  run()
}, [user?.email, tutor]);

useEffect(() => {
  console.log(isBookingLoading);
  console.log(booking);
  console.log(role);
  console.log(step);
   }, [isBookingLoading, booking, role, step])

   





  
return (
    <div className="tutor">
       <UpLinie scrollToBlock={scrollToBlock} 
                  refQuestionWrite={refQuestionWrite} 
                  setIsCabinetOpened={setIsCabinetOpened} 
                  isCabinetOpened={isCabinetOpened}  
          />

      {tutor && (
        <div className={`p-4 grid ${isTwoCols ? "grid-cols-2" : "grid-cols-1"}`}>
          {/* левая колонка */}
          <div className="m-2">
  <div
    className={`p-6 grid ${
      window.innerWidth < 550 ? "grid-cols-1 text-center" : "grid-cols-12 items-center"
    }`}
    
  >
    {/* Левая колонка */}
    <div className={`${(window.innerWidth > 550) && "ml-2"} col-span-5 w-full`}>
      <Selfi
        ImageSelfi={ImageSelfi}
        name={language === "german" ? tutor.namegerman : tutor.name}
        surname={language === "german" ? tutor.surnamegerman : tutor.surname}
        width={window.innerWidth > 550 ? "220px" : "100%"}
        height={window.innerWidth > 550 ? "220px" : "100%"}
        maxHeight={window.innerWidth > 550 ? "220px" : "400px"}
        radius="20px"
      />
    </div>

    {/* Правая колонка */}
    <div
      className={`flex flex-col col-span-7 ${
        window.innerWidth < 550 ? "items-center text-center" : "items-center text-left m-2"
      } justify-center`}
    >
      <div>
      {NameTutor()}

<p className="text-gray-600 mt-2">
  {language === "german" ? tutor.fulldescribegerman : tutor.fulldescribe}
</p>

<div className="flex justify-center items-center mt-4 gap-2 flex-wrap">
  <div className="flex items-center">
    <span className="text-lg font-semibold text-gray-800">{tutor.rating_avg}</span>
    <div className="flex ml-1">{renderStars(tutor.rating_avg)}</div>
  </div>
  <button
    type="button"
    onClick={() => {
      const href = window.location.href;
      if (!href.includes("#reviews")) window.location.href = href + "#reviews";
    }}
    className="text-lg font-bold text-sky-600 hover:underline ml-2"
  >
    {language === "german"
      ? `${reviews.length} ${reviews.length === 1 ? "Bewertung" : "Bewertungen"}`
      : reviews.length === 1
      ? "1 отзыв"
      : `${reviews.length} отзыв(ов)`}
  </button>
</div>

<div className="mt-6 text-center">
  <h3 className="text-xl font-semibold">{T.subjectsTitle}</h3>
  <SubjectsTutor />
</div>
      </div>
      
    </div>
  </div>
</div>


         
        
<div
  ref={refLessonTimeBlock}
  className={`lessonTime mx-auto w-full ${isTwoCols ? "max-w-md" : "max-w-xl"} ${!isTwoCols ? "mt-10" : ""}`}
>

  {role === "client" ? (
    <>
    {isBookingLoading && role !== "gast" && (
      <div className="text-center p-4">Загрузка данных бронирования...</div>
    )}



  {/* === 1) Нет booking ИЛИ booking не completed → Воронка пробного урока (3 шага) === */}
  {(!booking || booking == null || booking == undefined) && 
   (!lesson || Object.keys(lesson?.datetime?.subjects || {}).length === 0) && 
   isBookingLoading == false && (
    
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    

      {/* Шаг 1: дата */}
      {step == "date" && (
      <StepDate 
          step={step}
          date={date}
          handleDateChange={handleDateChange}
          goNext={goNext}
          T={T} 
          unavailableLessonsTime={unavailableLessonsTime}

      />
      )}

      {/* Шаг 2: время */}
      {step == "time" && (
        <StepTime
          visibleTimes={visibleTimes}
          handleNext={handleNext} handlePrev={handlePrev}
          startIndex={startIndex}
          filteredTimes={filteredTimes}
          selectedTime={selectedTime}
          handleTimeSelect={handleTimeSelect}
          goBack={goBack} goNext={goNext}
          T={T} 
     />
      )}
     

      {/* Шаг 3: анкета (form) */}
      {step === "form" && (
          <StepForm
              currentSubject={currentSubject} setCurrentSubject={setCurrentSubject}
              tutor={tutor}
              languagesChooseGerman={languagesChooseGerman} languagesChooseRussian={languagesChooseRussian}
              currentLevel={currentLevel} levels={levels}
              handleBooking={handleBooking}
              dateTime={dateTime}
              TitleChange={TitleChange}
              goBack={goBack}
              T={T} 
          />
      )}
    </LocalizationProvider>
  )}

  {/* === 2) Есть booking === */}
  {booking && !isBookingLoading && (
    
    <>
    
      {/* 2а) Отменён → жалоба/перебронирование */}
      {booking.status === "cancelled" && 
      <BookingCancelled 
        booking={booking} setBooking={setBooking}
        complaintSent={complaintSent} setComplaintSent={setComplaintSent} setComplaint={setComplaint} sendComplaint={sendComplaint}
        setStep={setStep}
        setDate={setDate}
        setSelectedTime={setSelectedTime}
        setCurrentSubject={setCurrentSubject}
        setCurrentLevel={setCurrentLevel}
        T={T} />
      }
      {/* 2б) В процессе → показать время, отмена/войти */}
      {booking.status === "process" && (
        <BookingProcess  
            booking={booking}
            cancelBooking={cancelBooking}
            goToLesson={goToLesson}
            monthName={monthName}
            T={T} 
        />
      )}

      {/* === 3) booking completed → после пробника: регулярные занятия ИЛИ уже сохранённый план === */}
  {booking.status === "completed" && 
  <BookingCompleted
        hasRegularLessons={hasRegularLessons}
        tutor={tutor}
        selectedSubjects={selectedSubjects}
        toggleSubjectSelection={toggleSubjectSelection}
        expandedSubject={expandedSubject}
        toggleExpand={toggleExpand}
        toggleDayForSubject={toggleDayForSubject}
        scheduleBySubject={scheduleBySubject}
        visibleTimes={visibleTimes}
        handleNext={handleNext}
        handlePrev={handlePrev}
        startIndex={startIndex}
        pickTimeForSubjectDay={pickTimeForSubjectDay}
        filteredTimes={filteredTimes}
        finalizeRegularSchedule={finalizeRegularSchedule}
        T={T} />
  }


    </>
  )}

  
   {/* если план уже есть → показать расписание */}
   {hasRegularLessons && lessons && (
          <LessonDisplay 
              lessons={lessons}
              goToLesson={goToLesson} 
              T={T}
          />
   )}

    </>
    

          ) : (
            <div>
              <p className="text-center text-bold">
                {T.messageForTutor}
              </p>
            </div>
          )
        }
         </div> 


        </div>
      )}

      {/* отзывы */}
     <Reviews
          isTwoCols={isTwoCols}
          currentReview={currentReview} setCurrentReview={setCurrentReview}
          currentGrade={currentGrade} setCurrentGrade={setCurrentGrade}
          hoveredStar={hoveredStar} setHoveredStar={setHoveredStar}
          Star={Star}
          submitReview={submitReview}
          reviewsVisible={reviewsVisible}
          reviews={reviews}
          myReview={myReview}
          visibleCountReviews={visibleCountReviews}
          setVisibleCountReviews={setVisibleCountReviews}
          T={T} 
          
      />

      <Footer refQuestionWrite={refQuestionWrite}   
          />
    </div>
  );
};

export default React.memo(TutorPage);



