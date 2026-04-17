import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Client, Tutor, MenuItem, Subject, HeaderText, Time, Question } from "../interfaces/index";

// Импорты ассетов
const German = require("../../assets/img/German.jpg");
const Math = require('../../assets/img/Math.png');

// Загрузка лайков из localStorage
const storedLikedTutors: number[] = JSON.parse(localStorage.getItem("likedTutors") || "[]");

// 1. Начальное состояние
interface RussianState {
  subjects: Subject[];
  tutors: Tutor[];
  menu: MenuItem[];
  menuClient: MenuItem[];
  menuTutor: MenuItem[];
  menuAdmin: MenuItem[];
  headerText: HeaderText;
  time: Time[];
  questions: Question[];
  likedTutors: number[];
  accessToken: string;
  user: Client | Tutor | null;
  role: string;
}

const initialState: RussianState = {
  subjects: [
    { id: 0, subjectName: "Математика", level: ["1-13 Классы", "Клаузуры"], description: "Подготовка к экзаменам...", image: Math },
    { id: 1, subjectName: "Немецкий", level: ["A0-B2", "Telc", "DSH", "Goethe"], description: "Подготовка к экзаменам...", image: German }
  ],
  tutors: [], // Оставляем пустым, данные придут с сервера
  menu: [
    { name: "Учителя", href: "#tutors" },
    { name: "Предметы", href: "#subjects" },
    { name: "Цена", href: "#prices" },
    { name: "Вопросы", href: "#questions" },
    { name: "Язык", href: "" }
  ],

  menuClient: [
    {name: "Мой кабинет", href: "/dashboard"}, 
    {name: "Все преподаватели", href: "/tutors"}, 
    {name: "Выбранные преподаватели", href: "/dashboard/liked-teachers"}, 
    {name: "Улучшить нашу школу", href: "/dashboard/school-better"}, 
    {name: "Написать в поддержку", href: "/#questionWrite"}, 
    {name: "Настройки", href: "/dashboard/settings-account"}, 
    {name: "Проверка видео и аудио", href: "/dashboard/check-device"},
    { name: "Язык", href: "" }
  ],
  menuTutor: [
    {name: "Мой кабинет", href: "/dashboard"}, 
    {name: "Мои ученики", href: "/dashboard/my-students"}, 
    {name: "Улучшить нашу школу", href: "/dashboard/school-better"}, 
    {name: "Написать в поддержку", href: "/#questionWrite"}, 
    {name: "Настройки", href: "/dashboard/settings-account"}, 
    {name: "Проверка видео и аудио", href: "/dashboard/check-device"},
    { name: "Язык", href: "" }
  ],
  menuAdmin: [
    {name: "Мой кабинет", href: "/dashboard"}, 
    {name: "Мои ученики", href: "/dashboard/my-students"}, 
    {name: "Сообщения", href: "/dashboard/gast/messages"}, 
    {name: "Настройки", href: "/dashboard/settings-account"}, 
    {name: "Проверка видео и аудио", href: "/dashboard/check-device"},
    { name: "Язык", href: "" }
  ],

  headerText: {
    buttonLessonReceive: "Получить урок",
    title: "Найдите идеального репетитора",
    buttonSortTutors: {
      defaultValue: "Выбирайте предмет",
      subjectValues: ["Все", "Математика", "Немецкий"]
    }
  },
  time: [{ id: 0, name: "Год" }, { id: 1, name: "Месяц" }, { id: 2, name: "Неделя" }],
  questions: [
    { id: 0, question: "Сколько длится урок?", answer: "75 минут..." }
  ],
  likedTutors: storedLikedTutors,
  accessToken: "",
  user: null,
  role: localStorage.getItem("role") || "gast"
};

console.log(localStorage.getItem("role"));

// 2. Создание Slice
const russianSlice = createSlice({
  name: 'russian',
  initialState,
  reducers: {
    setSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.subjects = action.payload;
    },
    setTutors: (state, action: PayloadAction<Tutor[]>) => {
      state.tutors = action.payload;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action: PayloadAction<Client | Tutor | null>) => {
      state.user = action.payload;
    },
    setRole: (state, action: PayloadAction<string>) => {
      state.role = action.payload;
      localStorage.setItem("role", action.payload);
    },
    toggleLike: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.likedTutors.includes(id)) {
        state.likedTutors = state.likedTutors.filter(tutorId => tutorId !== id);
      } else {
        state.likedTutors.push(id);
      }
      localStorage.setItem("likedTutors", JSON.stringify(state.likedTutors));
    },
    setHeaderText: (state, action: PayloadAction<HeaderText>) => {
      state.headerText = action.payload;
    }
  }
});

// 3. Экспорт экшенов и стора
export const { 
  setSubjects, 
  setTutors, 
  setAccessToken, 
  setUser, 
  setRole, 
  toggleLike, 
  setHeaderText 
} = russianSlice.actions;

export const russianReducer = russianSlice.reducer;

export const russianStore = configureStore({
  reducer: {
    russian: russianSlice.reducer,
  },
});

// Типы для хуков
export type RootState = ReturnType<typeof russianStore.getState>;
export type AppDispatch = typeof russianStore.dispatch;

export default russianStore;
      

/*
      [LOCALES.RUSSIAN]: {
        subjects: [{id: 0, subjectName: "Математика", level: "1-11 класс", description: "ЗНО, ДПА др.", image: Math }, 
            {id: 1, subjectName: "Немецкий", level: "A0-B2", description: "Telc, DSH, др.", image: German }
           ],


 tutors: [
      {
         id: 0, 
         name: "Роман", 
         grade: 4.2,
         reviews: [], 
         availableSubjects: ["Математика", "Немецкий"], 
         highlight: "Со мной математика - игра", 
         fullDescribe: "Я готовлю к экзаменам и преподаю школьную программу уже 3 года. Со мной Вы можете быть уверенным, что Вы со мной все выучите"
      }, 
      {
         id: 1, 
         name: "Павло", 
         grade: 4.5, 
         availableSubjects: ["Немецкий"], 
         highlight: "", 
         fullDescribe: "",
         price: "20"
      }, 
      {
         id: 2, 
         name: "Макар", 
         grade: 4.2, 
         availableSubjects: ["Математика"], 
         highlight: "", 
         fullDescribe: ""
      }],
 menu: [
         {name: "Учителя", href: "#tutors"}, 
         {name: "Предметы", href: "#subjects"}, 
         {name: "Стоимость", href: "#prices"},
         {name: "Вопросы", href: "#questions"}, 
         {name: "Язык"}
       ],
 time: [{id: 0, name: "Год"}, {id: 1, name: "Месяц"}, {id: 2, name: "Неделя"}]
      },






   ///////////////////////////////////////   
      [LOCALES.GERMAN]: {
        subjects: [{id: 0, subjectName: "Mathe", level: "1-13 Klassen", description: "Klausur, usw.", image: Math }, 
            {id: 1, subjectName: "Deutsch", level: "A0-B2", description: "Telc, DSH, usw.", image: German }
           ],


 tutors: [
      {
         id: 0, 
         name: "Roman", 
         grade: 4.2,
         reviews: [], 
         availableSubjects: ["Mathe", "Deutsch"], 
         highlight: "Mathe - das Spiel mit mir", 
         fullDescribe: "Ich bereite zu den Prüfungen vor und unterrichte den Schulehrplan schon 3 Jahren. Mit mir können Sie sicher sein, dass Sie mit mir alles lernen",
         price: "20"
      }, 
      {
         id: 1, 
         name: "Pavlo", 
         grade: 4.5, 
         availableSubjects: ["Deutsch"], 
         highlight: "", 
         fullDescribe: "",
         price: "20"
      }, 
      {
         id: 2, 
         name: "Makar", 
         grade: 4.2, 
         availableSubjects: ["Mathe"], 
         highlight: "", 
         fullDescribe: "",
         price: "20"
      }],
 menu: [
         {name: "Lehrer", href: "#tutors"}, 
         {name: "Fächer", href: "#subjects"}, 
         {name: "Preis", href: "#prices"},
         {name: "Fragen", href: "#questions"}, 
         {name: "Sprache"}
       ],
 time: [{id: 0, name: "Jahr"}, {id: 1, name: "Monat"}, {id: 2, name: "Woche"}]
      } 
 
      
      */


/*
export const rootReducer = (state = defaultState, action) => {
    switch(action.type) {
        case "SUBJECTS": {
            return {...state}      
         }
        case "TUTORS": {
            return {...state}    
        }
        case "MENU": {
            return {...state}
        }
   
        default: 
            return state;
      }
    }
*/
