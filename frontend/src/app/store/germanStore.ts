import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Client, Tutor, MenuItem, Subject, HeaderText, Time, Question } from "../interfaces/index";

// Импорты ассетов
const German = require("../../assets/img/German.jpg");
const Math = require('../../assets/img/Math.png');

// Загрузка лайков из localStorage
const storedLikedTutors: number[] = JSON.parse(localStorage.getItem("likedTutors") || "[]");

// 1. Интерфейс состояния
interface GermanState {
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

// 2. Начальное состояние (на немецком языке)
const initialState: GermanState = {
  subjects: [
    { 
      id: 0, 
      subjectName: "Mathe", 
      level: ["1-13 Klassen", "Klausuren"], 
      description: "Vorbereitung zu Klausuren. Auch wenn Sie in deutschen Schulen integrieren möchten...", 
      image: Math 
    },
    { 
      id: 1, 
      subjectName: "Deutsch", 
      level: ["A0-B2", "Telc", "DSH", "Goethe"], 
      description: "Vorbereitung zu sowohl schriftlicher als auch mundlicher Prüfung...", 
      image: German 
    }
  ],
  tutors: [], 
  menu: [
    { name: "Lehrer", href: "#tutors" },
    { name: "Fächer", href: "#subjects" },
    { name: "Preis", href: "#prices" },
    { name: "Fragen", href: "#questions" },
    { name: "Sprache", href: "" }
  ],
  menuClient: [
    { name: "Mein Bereich", href: "/dashboard" },
    { name: "Ausgewählte Nachhilfelehrer", href: "/dashboard/liked-teachers" },
    { name: "Unsere Schule verbessern", href: "/dashboard/school-better" },
    { name: "Support kontaktieren", href: "/#questionWrite" },
    { name: "Einstellungen", href: "/dashboard/settings-account" },
    { name: "Video- und Audiotest", href: "/dashboard/check-device" },
    { name: "Sprache", href: "" }
  ],
  
  menuTutor: [
    { name: "Mein Bereich", href: "/dashboard" },
    { name: "Meine Schüler", href: "/dashboard/my-students" },
    { name: "Unsere Schule verbessern", href: "/dashboard/school-better" },
    { name: "Support kontaktieren", href: "/#questionWrite" },
    { name: "Einstellungen", href: "/dashboard/settings-account" },
    { name: "Video- und Audiotest", href: "/dashboard/check-device" },
    { name: "Sprache", href: "" }
  ],
  
  menuAdmin: [
    { name: "Mein Bereich", href: "/dashboard" },
    { name: "Meine Schüler", href: "/dashboard/my-students" },
    { name: "Nachrichten", href: "/dashboard/gast/messages" },
    { name: "Einstellungen", href: "/dashboard/settings-account" },
    { name: "Video- und Audiotest", href: "/dashboard/check-device" },
    { name: "Sprache", href: "" }
  ],
  
  headerText: {
    buttonLessonReceive: "Unterricht erhlalten",
    title: "Suchen Sie idealen Nachhilfelehrer",
    buttonSortTutors: {
      defaultValue: "Wahl des Fachs",
      subjectValues: ["Alle", "Mathe", "Deutsch"]
    }
  },
  time: [
    { id: 0, name: "Jahr" },
    { id: 1, name: "Monat" },
    { id: 2, name: "Woche" }
  ],
  questions: [
    { id: 0, question: "Wie lange dauert eine Stunde?", answer: "75 Minuten..." },
    { id: 4, question: "Wie kann man Unterricht absagen?", answer: "In Ihrem Kabinett werden 3 näherste Unterrichte gezeigt..." }
  ],
  likedTutors: storedLikedTutors,
  accessToken: "",
  user: null,
  role: localStorage.getItem("role") || "gast"
};

// 3. Создание Slice
const germanSlice = createSlice({
  name: 'german',
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
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    }
  }
});

// 4. Экспорт экшенов и стора
export const { 
  setSubjects, 
  setTutors, 
  setAccessToken, 
  setUser, 
  setRole, 
  toggleLike, 
  setHeaderText,
  setQuestions 
} = germanSlice.actions;

export const germanReducer = germanSlice.reducer;

export const germanStore = configureStore({
  reducer: {
    german: germanSlice.reducer,
  },
});

// Типы для хуков
export type GermanRootState = ReturnType<typeof germanStore.getState>;
export type GermanAppDispatch = typeof germanStore.dispatch;

export default germanStore;