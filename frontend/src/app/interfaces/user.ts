import { Message } from './chat';


export type Client = {
  id: number;
  name: string;
  surname: string;
  email: string;
  newEmail?: string;
  password: string;
  isActivated: boolean;
  activationLink?: string;
  changeEmailLink?: string;
  messages: Message[];
  progress: Array<Object>;
  username: string;
};

export type Tutor = {
  id: number;
  name: string;
  namegerman: string;
  surname: string;
  surnamegerman: string;
  email: string;
  grade: number;
  availableSubjects: { [key: string]: string[] };
  highlight: string;
  highlightgerman: string;
  fulldescribe: string;
  fulldescribegerman: string;
  messages: Message[];
  rating_avg: number;
  rating_count: number;
  isActivated: boolean;
  price?: string;
  username: string;
};

export type Review = {
  id: number;
  tutor_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  grade: number;
  comment: string;
  created_at: string;
};


export type Participant = {
  userToken: string;
  stream: MediaStream | null;
};