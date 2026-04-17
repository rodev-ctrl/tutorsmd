interface Subject {
    id: number;
    subjectName: string;
    level: string;
    description: string;
    image: string;
  }
  
  interface Tutor {
    id: number,
    name: string,
    email: string,
    availableSubjects: { [key: string]: string[] },
    highlight: string,
    fulldescribe: string,
    isActivated: boolean
  }

  interface Menu {
    name: string,
    href?: string
  }
  
  interface Time {
    id: number;
    name: string
  }
  
  interface Question {
    id: number;
    question: string;
    answer: string;
  }

export interface State {
    accessToken: string;
    subjects: Subject[];
    tutors: Tutor[];
    menu: Menu[];
    time: Time[];
    questions: Question[];
  }
  
  export interface ActionType {
    type: "SUBJECTS" | "TUTORS" | "MENU" | "QUESTIONS" | "SET_ACCESS_TOKEN" | "MENU_CLIENT" | "MENU_TUTOR" | "SET_HEADER_TEXT" | "TOGGLE_LIKE";
    payload?: any;
  }
  